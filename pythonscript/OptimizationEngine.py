import pyodbc
import math
import pandas as pd
import json
import sys
from collections import OrderedDict

# Connection string to the SQL Server database
connection_string = 'DRIVER={SQL Server};SERVER=103.116.81.118;DATABASE=MasterSchedule;UID=sa;PWD=Apache#3407'  # TODO: fill in your database connection string

# Function to calculate the task duration in minutes and hours
def calculate_task_duration(uom, WIDTH, HEIGHT, ore, duration_minutes):
    try:
        if uom == "Area":
            area = float(WIDTH) * float(HEIGHT)
            task_duration_minutes = area * float(duration_minutes)
        elif uom == "Ton":
            task_duration_minutes = ore * float(duration_minutes)
        elif uom == "Task":
            task_duration_minutes = float(duration_minutes)
        else:
            return 0, 0

        if 0 < task_duration_minutes < 60:
            task_duration_hours = 1
        else:
            task_duration_hours = math.ceil(task_duration_minutes / 60)
        return task_duration_minutes, task_duration_hours
    except (ValueError, TypeError):
        return 0, 0

# Generate the main 24-hour task grid
def generate_task_grid(delayed_slots=None):
    if delayed_slots is None:
        delayed_slots = set()

    grid = OrderedDict()
    hourly_resource_allocation = {hour: {} for hour in range(24)}
    last_filled_column = {}

    connection = pyodbc.connect(connection_string)
    cursor = connection.cursor()

    # Task name lookup
    task_name_map = {}
    cursor.execute("SELECT [ID], [Task] FROM [MasterSchedule].[dbo].[MS_PARAMETERS];")
    for row in cursor.fetchall():
        task_name_map[row.ID] = row.Task

    # Task color lookup
    task_color_map = {}
    cursor.execute("SELECT [ID], [Color] FROM [MasterSchedule].[dbo].[MS_PARAMETERS];")
    for row in cursor.fetchall():
        task_color_map[row.ID] = row.Color

    # Fetch weekly plan
    query_temp_table = """
        SELECT [NAME], [TYPE], [WIDTH], [HEIGHT], [CUTS], [ACTIVE],
               (CAST([WIDTH] AS FLOAT)*CAST([HEIGHT] AS FLOAT)) AS Area,
               (CAST([WIDTH] AS FLOAT)*CAST([HEIGHT] AS FLOAT)*4.5*2.7) AS Tons,
               CASE WHEN [TYPE]='OV' THEN 'Opex' ELSE 'Capex' END AS typeCO,
               ROW_NUMBER() OVER (
                 PARTITION BY CASE WHEN [TYPE]='OV' THEN 'Opex' ELSE 'Capex' END
                 ORDER BY [CUTS] DESC,
                          (CAST([WIDTH] AS FLOAT)*CAST([HEIGHT] AS FLOAT)*4.5*2.7) DESC
               ) AS Rank,
               [Current_Task], [Time_to_Complete]
        FROM [MasterSchedule].[dbo].[MS_UPLOAD_WEEKLY_PLAN]
        WHERE [ACTIVE] = 1
    """
    cursor.execute(query_temp_table)
    rows = cursor.fetchall()
    temp_table_data = sorted(rows, key=lambda r: r.Rank)

    # Sequence tasks lookup
    query_seq_task = """
        SELECT [SEQ],[ID],[Task],[UOM],[Duration ( Minutes )],[Limits]
        FROM [MasterSchedule].[dbo].[MS_PARAMETERS]
        WHERE [SEQ] > (
            SELECT [SEQ] FROM [MasterSchedule].[dbo].[MS_PARAMETERS] WHERE [ID]=?
        )
        ORDER BY [SEQ];
    """

    # Limits per task
    limits_map = {}
    cursor.execute("SELECT [ID],[Limits] FROM [MasterSchedule].[dbo].[MS_PARAMETERS];")
    for row in cursor.fetchall():
        try:
            limits_map[row.ID] = int(row.Limits)
        except Exception:
            limits_map[row.ID] = 2

    # Build grid
    for row in temp_table_data:
        name = row.NAME
        current_task = row.Current_Task
        WIDTH, HEIGHT = row.WIDTH, row.HEIGHT
        ore = row.Tons
        duration = int(row.Time_to_Complete)

        if name not in grid:
            grid[name] = ['']*24
            last_filled_column[name] = 0

        remaining = duration
        col = last_filled_column[name]
        max_res = limits_map.get(current_task, 2)
        while remaining > 0 and col < 24:
            if (name, col) in delayed_slots:
                grid[name][col] = 'DELAY'
            else:
                if grid[name][col] == '' and hourly_resource_allocation[col].get(current_task, 0) < max_res:
                    grid[name][col] = current_task
                    hourly_resource_allocation[col][current_task] = hourly_resource_allocation[col].get(current_task, 0) + 1
                    remaining -= 1
            col += 1
        last_filled_column[name] = col

        cursor.execute(query_seq_task, current_task)
        for seq_row in cursor.fetchall():
            _, task_id, _, uom, dur_min, _ = seq_row
            _, hrs = calculate_task_duration(uom, WIDTH, HEIGHT, ore, dur_min)
            remaining = hrs
            col = last_filled_column[name]
            max_res = limits_map.get(task_id, 2)
            while remaining > 0 and col < 24:
                if (name, col) in delayed_slots:
                    grid[name][col] = 'DELAY'
                else:
                    if grid[name][col] == '' and hourly_resource_allocation[col].get(task_id, 0) < max_res:
                        grid[name][col] = task_id
                        hourly_resource_allocation[col][task_id] = hourly_resource_allocation[col].get(task_id, 0) + 1
                        remaining -= 1
                col += 1
            last_filled_column[name] = col

    connection.close()
    return grid, hourly_resource_allocation, limits_map, task_name_map, task_color_map

# Render the 24-hour task grid as HTML with styling, cards, charts, and Actual rows
def print_task_grid(grid, hourly_resource_allocation, limits_map, task_name_map, task_color_map):
    html = '''<style>
    table.task-grid { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; margin-bottom: 20px; }
    table.task-grid th, table.task-grid td { border: 1px solid black; padding: 8px; text-align: center; font-size: 14px; }
    table.task-grid th { background-color: #0f0e17; font-weight: bold; color: #ff8906; }
    table.task-grid tr:nth-child(even) { background-color: #0f0e17; }
    table.task-grid tr:hover { background-color: #ff8906; }
    table.task-grid td { vertical-align: middle; }
    table.task-grid .task-cell span { display: inline-block; padding: 5px 10px; border-radius: 4px; font-size: 12px; color: #000000; font-weight: bold; }
    .cards-container {
      display: flex;
      flex-wrap: nowrap;
      align-items: flex-start;
      justify-content: flex-start;
      gap: 10px;
      padding: 20px;
    }
    .card {
      border: 1px solid #D3D3D3;
      padding: 20px;
      background-color: #ff8906;
      color: #fff;
      font-weight: bold;
      text-align: center;
    }
    </style>'''

    sum_limits = sum(limits_map.values())
    total_resources_per_hour = [sum(hourly_resource_allocation[h].values()) for h in range(24)]
    avg_row = sum((x/sum_limits)*100 for x in total_resources_per_hour)/24 if sum_limits else 0
    avg_col = sum((sum(hourly_resource_allocation[h].get(t,0) for h in range(24))/(limits_map[t]*24)*100) for t in limits_map)/len(limits_map)
    ve_count = sum(1 for row in grid.values() for t in row if t == 'VE')
    peak = total_resources_per_hour.index(max(total_resources_per_hour)) + 1
    idle = total_resources_per_hour.count(0)

    html += "<div class='cards-container'>\n"
    html += f"  <div class='card'>Hourly Utilisation: {avg_row:.0f}%</div>\n"
    html += f"  <div class='card'>Task Utilisation: {avg_col:.0f}%</div>\n"
    html += f"  <div class='card'>No of cuts (VE): {ve_count}</div>\n"
    html += f"  <div class='card'>Peak Hour: {peak}</div>\n"
    html += f"  <div class='card'>Idle Hours: {idle}</div>\n"
    html += "</div>\n"

    html += '<table class="task-grid"><tr><th>Name</th>' + ''.join(f'<th>{h+1}</th>' for h in range(24)) + '</tr>'
    
    for name, hours in grid.items():
        html += f'<tr><td>{name}</td>'
        for h, task in enumerate(hours):
            tid = str(task) if task else '&nbsp;'
            if tid == 'DELAY':
                html += f'<td class="task-cell" style="background-color:red;"><span style="color:white;font-size:20px;">&#9888;</span></td>'
            else:
                color = task_color_map.get(tid, '#0f0e17')
                html += f'<td class="task-cell" style="background-color:{color};"><span>{tid}</span></td>'
        html += '</tr>'
        html += '<tr><td>Actual</td>' + ''.join('<td>&nbsp;</td>' for _ in range(24)) + '</tr>'
    html += '</table>'

    hourly_pct = [round((x/sum_limits)*100,0) for x in total_resources_per_hour]
    task_pct = [round((sum(hourly_resource_allocation[h].get(t,0) for h in range(24))/(limits_map[t]*24)*100),0) for t in limits_map]
    ids = list(limits_map.keys())
    colors = json.dumps(task_color_map)

    html += '''
<div style="display:flex; justify-content:space-between; margin-top:20px;">
  <div id="hourlyUtilisationChart" style="width:48%;height:400px;"></div>
  <div id="taskUtilisationChart" style="width:48%;height:400px;"></div>
</div>
<script src="https://cdn.jsdelivr.net/npm/echarts/dist/echarts.min.js"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
  var hData = ''' + json.dumps(hourly_pct) + ''';
  var tData = ''' + json.dumps(task_pct) + ''';
  var tIDs = ''' + json.dumps(ids) + ''';
  var tColors = ''' + colors + ''';

  var hChart = echarts.init(document.getElementById('hourlyUtilisationChart'));
  hChart.setOption({
    title: { text: 'Hourly Utilisation (%)', textStyle: { color: '#ff8906', fontSize:16}},
    xAxis: { type: 'category', data: Array.from({length:24},(_,i)=>i+1)},
    yAxis: { type: 'value', max:100},
    series: [{ data: hData, type: 'line', smooth: true, lineStyle: { color: '#ff8906', width:3}, symbolSize:8, label: { show:true, color:'#fff', position:'top', formatter: '{c}%'} }]
  });

  var tChart = echarts.init(document.getElementById('taskUtilisationChart'));
  tChart.setOption({
    title: { text: 'Task Utilisation (%)', textStyle: { color: '#ff8906', fontSize:16}},
    xAxis: { type: 'category', data: tIDs},
    yAxis: { type: 'value', max:100},
    series: [{ type:'bar', data: tData.map((v,i)=>({ value:v, itemStyle:{ color:tColors[tIDs[i]]}})), label:{ show:true, color:'#fff', position:'top', formatter: '{c}%'}, barWidth:'60%' }]
  });
});
</script>'''

    categories, codes = fetch_delay_categories_and_codes()
    html += f'''
<script>
var delayCategories = {json.dumps(categories)};
var delayCodes = {json.dumps(codes)};

document.addEventListener('DOMContentLoaded', function() {{
    const categorySelect = document.getElementById('delayCategory');
    const codeSelect = document.getElementById('delayCode');

    delayCategories.forEach(cat => {{
        let option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    }});

    categorySelect.addEventListener('change', function() {{
        const selectedCategory = this.value;
        codeSelect.innerHTML = '<option value="">Select Code</option>';

        delayCodes.filter(dc => dc.category === selectedCategory)
          .forEach(dc => {{
              let option = document.createElement('option');
              option.value = dc.code;
              option.textContent = dc.code;
              codeSelect.appendChild(option);
          }});
    }});
}});
</script>
'''

    return html

# Generate maintenance opportunity grid
def generate_maintenance_opportunity_grid(hourly_resource_allocation, limits_map, task_name_map):
    html = '<h3 style="color:#ff8906;">Maintenance Opportunity Grid (<span style="color:#00ff00;">&#10004;</span> Available,<span style="color:#ff0000;">&#10060;</span> In Use)</h3>'
    html += '<table class="task-grid"><tr><th>Task</th>' + ''.join(f'<th>{h+1}</th>' for h in range(24)) + '</tr>'
    task_ids = list(limits_map.keys())[:12]
    for tid in task_ids:
        name = task_name_map.get(tid, tid)
        html += f'<tr><td>{name}</td>'
        for h in range(24):
            free = (hourly_resource_allocation[h].get(tid, 0) == 0)
            if free:
                html += f'<td style="background-color:#0f0e17; color:#00ff00; font-size:18px;">&#10004;</td>'
            else:
                html += f'<td style="background-color:#0f0e17; font-size:18px;">&#10060;</td>'
        html += '</tr>'
    html += '</table>'
    
    return html
def fetch_delay_categories_and_codes():
    connection = pyodbc.connect(connection_string)
    cursor = connection.cursor()

    # Fetch active delay categories and codes
    cursor.execute("""
        SELECT Delay_Category, Delay_code 
        FROM MasterSchedule.dbo.MS_DELAYS
        WHERE IsActive = 1
    """)
    rows = cursor.fetchall()

    # Get unique categories
    categories = list(sorted(set(row.Delay_Category for row in rows)))

    # Prepare codes list with category
    codes = [{'code': row.Delay_code, 'category': row.Delay_Category} for row in rows]

    connection.close()
    return categories, codes



import sys

if __name__ == '__main__':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    delayed_slots = set()

    if len(sys.argv) > 1 and sys.argv[1]:
        try:
            delayed_slots_list = json.loads(sys.argv[1])
            delayed_slots = {(item['row'], item['hour']) for item in delayed_slots_list}
            print(f" Delayed slots received: {delayed_slots}")
        except Exception as e:
            print(f"⚠️ Error parsing delayed slots: {e}")

    grid, hourly_alloc, limits_map, task_name_map, task_color_map = generate_task_grid(delayed_slots)
    print(print_task_grid(grid, hourly_alloc, limits_map, task_name_map, task_color_map))
    print(generate_maintenance_opportunity_grid(hourly_alloc, limits_map, task_name_map))

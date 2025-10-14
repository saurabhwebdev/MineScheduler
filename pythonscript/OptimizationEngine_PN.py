
# -*- coding: utf-8 -*-
import pyodbc
import math
import json
import sys
# Connection string to the SQL Server database
connection_string = 'DRIVER={SQL Server};SERVER=103.116.81.118;DATABASE=MasterSchedule;UID=sa;PWD=Apache#3407'  # Your database connection string


json_data = sys.argv[1]  # your hfDelayedSlots
try:
    grid_hours = int(sys.argv[2]) if len(sys.argv) > 2 else 24
except:
    grid_hours = 24

# --------------------------------------------------
# 0. Delay categories & codes helper
# --------------------------------------------------
def fetch_delay_categories_and_codes():
    conn   = pyodbc.connect(connection_string)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT Delay_Category, Delay_code
          FROM MasterSchedule.dbo.PN_MS_DELAYS
         WHERE IsActive = 1
    """)
    rows = cursor.fetchall()
    conn.close()

    # unique categories
    categories = sorted({ r.Delay_Category for r in rows })
    # list of dicts for filtering by category
    codes = [ {'category': r.Delay_Category, 'code': r.Delay_code} for r in rows ]
    return categories, codes
# --------------------------------------------------
# 1. Calculate Task Duration
# --------------------------------------------------
def calculate_task_duration(
    uom: str,
    total_plan_m: float,
    width: float,
    height: float,
    density: float,
    duration_minutes: float
) -> tuple[float, int]:
    u = (uom or '').strip().lower()
    

    if u.startswith("area"):
        minutes =(total_plan_m/duration_minutes)*60
       
    elif u.startswith("ton"):
        volume = width * height * density
        minutes = volume * duration_minutes
        
    else:
        minutes = duration_minutes
        

    hours = 1 if 0 < minutes < 60 else math.ceil(minutes / 60)
    
    return minutes, hours

# --------------------------------------------------
# 2. Generate 24-hour Task Grid (plus priority & active maps)
# --------------------------------------------------
def generate_task_grid(delayed_slots,grid_hours=24):
    # Build a lookup: site ? set of blocked hours
    delay_map: dict[str, set[int]] = {}
    for d in delayed_slots:
        site = d.get('row')
        hour = d.get('hour') if 'hour' in d else d.get('hourIndex')
        if site is not None and isinstance(hour, int):
            delay_map.setdefault(site, set()).add(hour)

    grid = {}
    hourly_alloc = {h: {} for h in range(grid_hours)}
    last_filled = {}
    task_duration_data = {}
    site_priority_map = {}
    site_active_map = {}

    conn = pyodbc.connect(connection_string)
    cur  = conn.cursor()


    # Parameter limits & UOM
    cur.execute("SELECT ID, Limits, UOM FROM [MasterSchedule].[dbo].[PN_MS_PARAMETERS]")
    limits_map, uom_map = {}, {}
    for ID, lim, uoc in cur.fetchall():
        limits_map[ID] = int(lim) if str(lim).isdigit() and int(lim) > 0 else 2
        uom_map[ID] = uoc or 'Task'

    # Plan rows
    cur.execute("""
        SELECT   [Site]
      ,[Priority]
      ,[TOTAL PLAN M]
      ,[ACTIVE]
      ,[Current_Task]
      ,[Time_to_complete]
  FROM [MasterSchedule].[dbo].[PN_MS_UPLOAD_WEEKLY_PLAN] 
    """)
    rows = cur.fetchall()
    rows.sort(key=lambda r: (r[1] is None, r[1]))  # sort by Priority

    seq_sql = """
        SELECT SEQ, ID, [Duation (Minutes)], UOM
          FROM [MasterSchedule].[dbo].[PN_MS_PARAMETERS]
         WHERE SEQ > (
             SELECT SEQ FROM [MasterSchedule].[dbo].[PN_MS_PARAMETERS] WHERE ID = ?
         )
         ORDER BY SEQ ASC
    """
    cur.execute("""
    SELECT TOP 1 ID FROM [MasterSchedule].[dbo].[PN_MS_PARAMETERS]
    WHERE SEQ = 1
    """)
    row = cur.fetchone()
    default_task_id = row[0] if row else 'DEFAULT_TASK'

    for site, prio, planM, active_flag, task_id, dur_hours in rows:
        # ────────── HARDCODED GEOMETRY ──────────
        height  = 4    # metres
        length  = 10   # metres
        density = 2.7    # tonnes per cubic metre
        site_priority_map[site] = prio
        is_active = bool(active_flag)
        site_active_map[site] = is_active

        # Initialize empty grid for all sites
        if site not in grid:
            grid[site] = [''] * grid_hours
            last_filled[site] = 0

        # ❗ Skip task allocation for inactive sites
        if not is_active:
            continue

        if not task_id:
            task_id = default_task_id

# ✅ Always fallback to 60 minutes if missing or invalid
        try:
            dur_minutes = float(dur_hours) * 60 if dur_hours else 60.0
        except:
            dur_minutes = 60.0

        mins = dur_minutes
        hrs = 1 if 0 < mins < 60 else math.ceil(mins / 60)


        task_duration_data[f"{site}:{task_id}"] = {'min': mins, 'hr': hrs}

        rem, col = hrs, last_filled[site]
        maxr     = limits_map.get(task_id, 2)
        while rem > 0 and col < grid_hours:
            if col in delay_map.get(site, set()):
                col += 1
                continue
            if not grid[site][col] and hourly_alloc[col].get(task_id, 0) < maxr:
                grid[site][col]            = task_id
                hourly_alloc[col][task_id] = hourly_alloc[col].get(task_id, 0) + 1
                rem -= 1
            col += 1
        last_filled[site] = col

        # Sequence tasks
        cur.execute(seq_sql, task_id)
        width = length
        for _, sid, sd_minutes, uom in cur.fetchall():
            mins2, hrs2 = calculate_task_duration(
                uom_map.get(sid, uom),
                planM,   
                height,
                length,
                density,
                sd_minutes  # duration_per_unit from PN_MS_PARAMETERS
            )
    

            rem2, c2 = hrs2, last_filled[site]
            max2 = limits_map.get(sid, 2)
            while rem2 > 0 and c2 < grid_hours:
                if c2 in delay_map.get(site, set()):
                    c2 += 1
                    continue
                if not grid[site][c2] and hourly_alloc[c2].get(sid, 0) < max2:
                    grid[site][c2] = sid
                    hourly_alloc[c2][sid] = hourly_alloc[c2].get(sid, 0) + 1
                    rem2 -= 1
                c2 += 1
            last_filled[site] = c2

    conn.close()
    return grid, hourly_alloc, limits_map, task_duration_data, site_priority_map, site_active_map



def generate_maintenance_opportunity_grid(
    hourly_alloc,
    task_name_map,
    limits_map,
    equipment_names_map=None,
    grid_hours=24
):
    equipment_names_map = equipment_names_map or {}

    # Reverse mapping: Equipment → Task(s)
    equipment_task_map = {}
    # Also track "virtual equipment" for unmapped tasks
    all_task_ids = list(limits_map.keys())

    for task_id in all_task_ids:
        equipments = equipment_names_map.get(task_id, [f"[{task_name_map.get(task_id, task_id)}]"])
        for eq in equipments:
            equipment_task_map.setdefault(eq, set()).add(task_id)

    # Usage tracking
    eq_usage = {h: {} for h in range(grid_hours)}
    for h in range(grid_hours):
        for eq, tasks in equipment_task_map.items():
            eq_usage[h][eq] = any(hourly_alloc[h].get(t, 0) > 0 for t in tasks)

    # Render HTML table
    html = (
        '<h3 style="color:#ff8906;">Maintenance Opportunity Grid '
        '(<span style="color:#00ff00;">&#10004;</span> Available, '
        '<span style="color:#ff0000;">&#10060;</span> In Use)</h3>'
        '<table class="task-grid"><tr>'
        '<th style="width:15%;">Equipment</th>'
    )

    per_slot_pct = 85 / grid_hours
    html += ''.join(
        f'<th style="width:{per_slot_pct:.2f}%;">{h+1}</th>'
        for h in range(grid_hours)
    )
    html += '</tr>'

    for eq in sorted(equipment_task_map.keys()):
        html += f'<tr><td>{eq}</td>'
        for h in range(grid_hours):
            in_use = eq_usage[h][eq]
            symbol = '&#10060;' if in_use else '&#10004;'
            color = '#ff0000' if in_use else '#00ff00'
            html += (
                f'<td style="background-color:#0f0e17;'
                f'color:{color};font-size:12px;text-align:center">'
                f'{symbol}</td>'
            )
        html += '</tr>'

    html += '</table>'
    return html




# --------------------------------------------------
# # 4. Display Task Grid + Menu + Charts + Maintenance
# --------------------------------------------------
def display_task_grid(
    grid, hourly_alloc, limits_map,
    task_color_map, task_name_map,
    site_prio, site_active_map,
    equipment_names_map=None,grid_hours=24
):
    import json
    # 1) Ensure default colors
    for k, v in {
        "MDS": "#FF6B6B", "DRP": "#6BCB77", "CHP": "#4D96FF", "SST": "#FFD93D",
        "SUM": "#845EC2", "TRD": "#00C9A7", "CBO": "#FFC75F", "ING": "#F9F871",
        "DRI": "#0081CF", "SUH": "#FF9671", "CHR": "#00C2A8", "FIR": "#C34A36",
        "REN": "#8D6E63", "WDF": "#2EC4B6", "REM": "#F67280", "BOG": "#00BBF9",
        "STS": "#FFB627", "REA": "#06D6A0", "BFP": "#EF476F", "BFPrep": "#118AB2",
        "BFL": "#FF5D9E", "BOGB": "#1982C4", "GEOI": "#FB5607", "REHB": "#83D0C9"
    }.items():
        task_color_map.setdefault(k, v)

    # 2) Sort sites by the uploaded priority
    sites = sorted(
    grid.keys(),
    key=lambda s: (
        0 if site_active_map.get(s, True) else 1,   # Active = 0, Inactive = 1
        site_prio.get(s, 999)                       # Then by priority
    )
)

    # 3) Fetch delay categories & codes
    categories, codes = fetch_delay_categories_and_codes()

    # 4) Start building HTML with CSS and table header
    html = """<style>
    table.task-grid { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; margin-bottom: 20px; }
    table.task-grid th, table.task-grid td { border: 1px solid black; padding: 8px; text-align: center; font-size: 14px; }
    table.task-grid th { background-color: #0f0e17; font-weight: bold; color: #ff8906; }
    table.task-grid tr:nth-child(even) { background-color: #0f0e17; }
    table.task-grid tr:hover { background-color: #ff8906; }
    table.task-grid td { vertical-align: middle; }
    table.task-grid .task-cell span { display: inline-block; padding: 5px 10px; border-radius: 4px; font-size: 12px; color: #000000; font-weight: bold; }

    /* shift header styling */
    .shift-header {
  background-color: #444;
  color: #fff;
  border: 2px solid #ff8906 !important;
  font-weight: bold;
}
/* spacer row styling */
.spacer-row td {
  border: none;
  height: 8px;      /* adjust vertical spacing here */
  background: none; /* transparent background */
  padding: 0;
}
    /* ensure P/Site headers stay white */
    table.task-grid th[rowspan] {
      color: #fff;
      background-color: #0f0e17;
    }
    table.task-grid td:nth-child(2) a.toggle-site {
  color: white !important;
}
    </style>

<div style="overflow-x:auto; white-space:nowrap;">
<table class="task-grid" style="table-layout:fixed; width:auto;">
  <thead>
    <!-- First row: P/Site and Day/Night -->
    <tr>
      <th rowspan="2" style="width:50px;">P</th>
      <th rowspan="2" style="width:100px;">Site</th>"""
    # Day/Night cells
    for block_start in range(0, grid_hours, 12):
        shift = 'Day Shift' if (block_start // 12) % 2 == 0 else 'Night Shift'
        span = min(12, grid_hours - block_start)
        html += f'\n      <th colspan="{span}" class="shift-header">{shift}</th>'
    html += "\n    </tr>\n"

    # Second row: hour numbers
    html += "    <tr>"
    for h in range(grid_hours):
        html += f'\n      <th>{h+1}</th>'
    html += "\n    </tr>\n  </thead>\n"


    # 5) Populate rows
    for site in sites:
        raw_prio = site_prio.get(site, '')
        try:
            prio = int(float(raw_prio))
        except (TypeError, ValueError):
            prio = raw_prio
        is_active = site_active_map.get(site, True)
        row_style = 'background-color:#2b2b2b;color:#333;' if not is_active else ''
        html += f'<tr style="{row_style}"><td>{prio}</td><td style="padding:2px;"><div style="display:flex; align-items:center; justify-content:center; width:100%; height:100%; font-size:clamp(6px, 0.6vw, 14px); white-space:nowrap;"><a href="#" class="toggle-site" data-site="{site}">{site}</a></div></td>'



        for h in range(grid_hours):
            tid = grid[site][h]
            # compute background only if there’s a task
            bg_style = (
    'background-color:#444;color:#aaa;' if not is_active else
    f'background:{task_color_map.get(tid,"")};'
) if tid else ''

            # this cell now *always* has data-site & data-hour
            html += (
                f'<td class="task-cell" data-site="{site}" data-hour="{h}" '
                f'style="{bg_style}">'
                f'{f"<span>{tid}</span>" if tid else "&nbsp;"}'
                f'</td>'
            )

        html += "</tr>"
    html += "</table>"
    html += "</div>"

    # 6) Prepare chart data
    sum_limits = sum(limits_map.values())
    hourly_pct = [round((sum(hourly_alloc[h].values()) / sum_limits) * 100, 0) for h in range(grid_hours)]
    task_pct   = [round((sum(hourly_alloc[h].get(t, 0) for h in range(grid_hours)) / (limits_map[t] * grid_hours)) * 100, 0)
                  for t in limits_map]
    ids        = list(limits_map.keys())
    js_hourly  = json.dumps(hourly_pct)
    js_task    = json.dumps(task_pct)
    js_ids     = json.dumps(ids)
    js_colors  = json.dumps(task_color_map)
    js_cats    = json.dumps(categories)
    js_codes   = json.dumps(codes)

    # 7) Inject JS for charts and delay dropdowns
    html += f"""
<div style="display:flex;justify-content:space-between;margin-top:20px;">
  <div id="hourlyUtilisationChart" style="width:100%;height:300px;"></div>
  <div id="taskUtilisationChart"   style="width:120%;height:300px;"></div>
</div>
<script src="https://cdn.jsdelivr.net/npm/echarts/dist/echarts.min.js"></script>
<script>
(function(){{
  var hData = {js_hourly};
  var tData = {js_task};
  var tIDs  = {js_ids};
  var tCols = {js_colors};

  var hChart = echarts.init(document.getElementById("hourlyUtilisationChart"));
  hChart.setOption({{
    title: {{ text:"Hourly Utilisation (%)", textStyle:{{ color:"#fff" }} }},
    xAxis: {{ type:"category", data: Array.from({{length:{grid_hours}}}, (_,i) => i+1) }},
    yAxis: {{ type:"value", max:100 }},
    series:[{{
      data: hData,
      type: "line",
      smooth: true,
      lineStyle: {{ width: 2 }},
      symbolSize: 6,
      label: {{ show:true, position:"top", formatter:"{{c}}%", color:"#fff" }}
    }}]
  }});

  var tChart = echarts.init(document.getElementById("taskUtilisationChart"));
  tChart.setOption({{
    title: {{ text:"Task Utilisation (%)", textStyle:{{ color:"#fff" }} }},
    xAxis: {{ type:"category", data: tIDs, axisLabel:{{ interval:0, rotate:45, color:"#fff", fontSize:8 }} }},
    yAxis: {{ type:"value", max:100 }},
    series:[{{
      type: "bar",
      data: tData.map((v,i)=>({{ value:v, itemStyle:{{ color:tCols[tIDs[i]] }} }})),
      label: {{ show:true, position:"top", formatter:"{{c}}%", color:"#fff" }},
      barWidth:"60%"
    }}]
  }});
}})();

</script>

<script>
// Populate Delay dropdowns
document.addEventListener("DOMContentLoaded", function() {{
  var cats = {js_cats}, codes = {js_codes};
  var catSel  = document.getElementById("delayCategory"),
      codeSel = document.getElementById("delayCode");
  cats.forEach(c=>catSel.add(new Option(c,c)));
  catSel.addEventListener("change", function() {{
    codeSel.options.length = 0;
    codes.filter(dc=>dc.category===this.value)
         .forEach(dc=>codeSel.add(new Option(dc.code,dc.code)));
  }});
  if(cats.length) {{
    catSel.value = cats[0];
    catSel.dispatchEvent(new Event("change"));
  }}
}});
</script>

"""



    html += generate_maintenance_opportunity_grid(
        hourly_alloc,
        
        task_name_map,
        limits_map,
        equipment_names_map,grid_hours
    )
    html += """
<script>
// Immediately attach handlers
(function(){
  console.log("🔔 Attaching toggle-site listeners…");
  const els = document.querySelectorAll(".toggle-site");
  console.log("Found toggle-site elements:", els.length);
  els.forEach(el => {
    el.addEventListener("click", function(e) {
      e.preventDefault();
      const site = el.dataset.site;
      console.log("🖱️  Clicked:", site);
      fetch(`/ToggleSiteStatus.aspx?site=${encodeURIComponent(site)}`)
        .then(r => r.text())
        .then(txt => {
          console.log("✅ Toggle response:", txt);
          window.location.reload();
        })
        .catch(err => console.error("❌ Toggle failed:", err));
    });
  });
})();
</script>
"""

    print(html)

# --------------------------------------------------
# 5. Main
# --------------------------------------------------
if __name__ == '__main__':
    import sys, io
    # ensure utf-8 stdout
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    # 1) parse delays JSON from argv[1], if present
    delayed_slots = []
    if len(sys.argv) > 1 and sys.argv[1]:
        try:
            delayed_slots = json.loads(sys.argv[1])
        except Exception as e:
            print(f"?? Error parsing delayed slots JSON: {e}", file=sys.stderr)
            delayed_slots = []

    # 2) generate grid with delays
    grid, alloc, limits_map, durations, site_prio, site_active = generate_task_grid(delayed_slots, grid_hours)

    # 3) load your color & name maps
    conn = pyodbc.connect(connection_string)
    cur  = conn.cursor()
    task_color_map = { ID: Color for ID, Color in cur.execute(
        "SELECT ID, Color FROM MasterSchedule.dbo.PN_MS_PARAMETERS")}
    task_name_map  = { ID: Task  for ID, Task  in cur.execute(
        "SELECT ID, Task  FROM MasterSchedule.dbo.PN_MS_PARAMETERS")}
    conn.close()

    equipment_names_map = {
        'DRI': ['Rented', '301', '1030']

        # …etc…
    }

    # 5) render
    display_task_grid(
        grid, alloc, limits_map,
        task_color_map, task_name_map,
        site_prio, site_active,
        equipment_names_map,grid_hours
    )
# -*- coding: utf-8 -*- 
import pyodbc
import math
import json
import sys
# Connection string to the SQL Server database
connection_string = 'DRIVER={SQL Server};SERVER=103.116.81.118;DATABASE=MasterSchedule;UID=sa;PWD=Apache#3407'  # TODO: fill in your database connection string


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
          FROM MasterSchedule.dbo.MS_DELAYS
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
    plan_m: float,
    backfill_t: float,
    firings: float,
    actual_t: float,
    height: float,
    length: float,
    density: float,
    bolting: float,
    cables_m: float,
    shotcrete: float,
    remote_t: float,
    time_to_complete_hr: float,
    duration_per_unit: float
) -> tuple[float, int]:
    """
    Returns (minutes, hours) for any task based on its UOM:
      - duration_per_unit = minutes per unit from MS_PARAMETERS_WEST
      - plan_m, backfill_t, firings, actual_t, bolting, etc. = the row’s targets
    """

    u = (uom or "").strip().lower()

    # geometry
    area   = height * length
    volume = area * density

    # compute raw minutes
    if  u == "muck":
        minutes = (actual_t / duration_per_unit) * 60.0
        method = "MUCK (forced actual_t)"
    elif u.startswith("drill"):
        minutes = plan_m * (60.0 / duration_per_unit)
        method = "drill"

    elif u.startswith("bogt"):
        minutes = (remote_t /  duration_per_unit)* 60.0
        method = "Trolley_T"

    

    elif u.startswith("backfill"):
        minutes = backfill_t * (60.0 / duration_per_unit)
        method = "backfill tonnes"

    elif u.startswith("bolt"):
        minutes = bolting * (60.0 / duration_per_unit)
        method = "bolting count"

    elif u.startswith("cable"):
        minutes = cables_m * (60.0 / duration_per_unit)
        method = "cable metres"

    elif u.startswith("sht"):
        minutes = shotcrete * (60.0 / duration_per_unit)
        method = "shotcrete"

    elif u.startswith("area"):
        minutes = area * (60.0 / duration_per_unit)
        method = "area-based"

    elif u.startswith("volume"):
        minutes = volume * (60.0 / duration_per_unit)
        method = "volume-based"

    elif u in ("time", "task"):
        minutes = duration_per_unit 
        method = "explicit time"

    else:
        minutes = 1 * duration_per_unit
        method = "fallback (1 unit)"

    hours = 1 if 0 < minutes < 60 else math.ceil(minutes / 60)

    # ✅ Debug output
   # print(f"[DurationCalc] UOM: '{uom}' method: {method}, minutes: {minutes:.2f}, hours: {hours}, duration/unit: {duration_per_unit}")

    return minutes, hours

# --------------------------------------------------
# 2. Generate 24-hour Task Grid (plus priority & active maps)
# --------------------------------------------------
def generate_task_grid(delayed_slots, grid_hours=24):
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
    cur.execute("SELECT ID, Limits, UOM FROM [MasterSchedule].[dbo].[MS_PARAMETERS_WEST]")
    limits_map, uom_map = {}, {}
    for ID, lim, uoc in cur.fetchall():
        limits_map[ID] = int(lim) if str(lim).isdigit() and int(lim) > 0 else 2
        uom_map[ID] = uoc or 'Task'

    # Plan rows
    cur.execute("""
        SELECT  [OPS_Location], [Height], [Length], [Density], [ACTUAL_M], [ACTUAL_TONS],
                [Trolley_T], [Bolting], [Câbles forés (m)], [Tonnes - sautage], [Betong],
                [Remblai], [Current], [TimeToComplete], [Longueur linéaire (m)],
                [Active], [Priority]
        FROM [MasterSchedule].[dbo].[MS_WEEKLY_PLAN_WEST] 
    """)
    rows = cur.fetchall()
    rows.sort(key=lambda r: (0 if r[15] else 1, r[16] if r[16] is not None else 999))

    seq_sql = """
        SELECT SEQ, ID, [Duration], UOM
        FROM [MasterSchedule].[dbo].[MS_PARAMETERS_WEST]
        WHERE SEQ > (
            SELECT SEQ FROM [MasterSchedule].[dbo].[MS_PARAMETERS_WEST] WHERE ID = ?
        )
        ORDER BY SEQ ASC
    """

    cur.execute("SELECT TOP 1 ID FROM [MasterSchedule].[dbo].[MS_PARAMETERS_WEST] WHERE SEQ = 1")
    row = cur.fetchone()
    default_task_id = row[0] if row else 'DEFAULT_TASK'

    for (
        site, height, length, density, planM, planTons, remote_t, bolting,
        cables_m, firings, shotcrete, backfill, task_id, dur_hours, linear_m,
        active_flag, prio
    ) in rows:

        site_priority_map[site] = prio
        is_active = bool(active_flag)
        site_active_map[site] = is_active

        if site not in grid:
            grid[site] = [''] * grid_hours
            last_filled[site] = 0

        if not is_active:
            continue

        if not task_id:
            task_id = default_task_id

        # Fetch duration_per_unit for task_id
        duration_per_unit = 60
        cur.execute("SELECT Duration FROM [MasterSchedule].[dbo].[MS_PARAMETERS_WEST] WHERE ID = ?", task_id)
        row_dur = cur.fetchone()
        if row_dur and row_dur[0]:
            try:
                duration_per_unit = float(row_dur[0])
            except:
                duration_per_unit = 60

        # ✅ Calculate duration properly even for MUCK
        mins, hrs = calculate_task_duration(
            uom_map.get(task_id, "Task"),
            planM, backfill, firings, planTons,
            height, length, density, bolting,
            cables_m, shotcrete, remote_t,
            dur_hours or 0, duration_per_unit
        )

        task_duration_data[f"{site}:{task_id}"] = {'min': mins, 'hr': hrs}

        rem, col = hrs, last_filled[site]
        maxr     = limits_map.get(task_id, 2)
        #print(f"Assigning task {task_id} to {site}, starting from column {col}")
        while rem > 0 and col < grid_hours:
            if col in delay_map.get(site, set()):
                col += 1
                continue
            if not grid[site][col] and hourly_alloc[col].get(task_id, 0) < maxr:
                grid[site][col] = task_id
                hourly_alloc[col][task_id] = hourly_alloc[col].get(task_id, 0) + 1
                rem -= 1
            col += 1
        last_filled[site] = col

        # Sequence tasks
        cur.execute(seq_sql, task_id)
        for _, sid, sd_minutes, uom in cur.fetchall():
            mins2, hrs2 = calculate_task_duration(
                uom_map.get(sid, uom), planM, backfill, firings, planTons,
                height, length, density, bolting,
                cables_m, shotcrete, remote_t,
                0, sd_minutes
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
# \# 4. Display Task Grid + Menu + Charts + Maintenance
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
.grid-scroll {
  overflow-x:auto;
  white-space:nowrap;
}
.grid-scroll table {
  table-layout:fixed;
  width:auto;
}
    </style>

<div style="overflow-x:auto; white-space:nowrap;">
  <table class="task-grid" style="table-layout:fixed; width:auto;">
    <thead>
      <tr>
        <th rowspan="2" style="width:50px;">P</th>
        <th rowspan="2" style="width:100px;">Site</th>"""
    day = 1
    for idx, start in enumerate(range(0, grid_hours, 12)):
            shift_type = 'Day Shift' if idx % 2 == 0 else 'Night Shift'
            span       = min(12, grid_hours - start)
            html += (
                f'\n        <th colspan="{span}" class="shift-header">'
                f'{shift_type} Day {day}'
                f'</th>'
            )
            # after you’ve added the Night Shift for this day, bump day counter
            if idx % 2 == 1:
                day += 1
    html += "\n      </tr>\n      <tr>"
    # Hour numbers
    for h in range(grid_hours):
        html += f'\n        <th>{h+1}</th>'
    html += "\n      </tr>\n    </thead>\n    <tbody>\n"


    # 5) Populate rows
    for site in sites:
        raw_prio = site_prio.get(site, '')
        try:
            prio = int(float(raw_prio))
        except (TypeError, ValueError):
            prio = raw_prio
        is_active = site_active_map.get(site, True)
        row_style = 'background-color:#2b2b2b;color:#999;' if not is_active else ''
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
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".toggle-site").forEach(el => {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      const site = this.dataset.site;
      fetch(/ToggleSiteStatusWest.aspx?site=${encodeURIComponent(site)})
        .then(resp => resp.text())
        .then(data => {
          location.reload(); // reload the grid after toggle
        })
        .catch(err => console.error("Toggle failed", err));
    });
  });
});
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
        "SELECT ID, Color FROM MasterSchedule.dbo.MS_PARAMETERS_WEST")}
    task_name_map  = { ID: Task  for ID, Task  in cur.execute(
        "SELECT ID, Task  FROM MasterSchedule.dbo.MS_PARAMETERS_WEST")}
    conn.close()

    equipment_names_map = {
        'CBL': ['UD10', 'UD11', 'UD12', 'UD15','UD13', 'UD14', 'UD16'],
        'PDR': ['UD10', 'UD11', 'UD12', 'UD15','UD13', 'UD14', 'UD16'],
        'CF':['IT01','U526'],
        'SBG': ['UL04', 'UL07', 'UL21', 'UL22','UL24', 'UL26', 'UL27','UL28'],
        'BFP':['UL04', 'UL07', 'UL21', 'UL22','UL24', 'UL26', 'UL27','UL28'],
        'BF':['UL04', 'UL07', 'UL21', 'UL22','UL24', 'UL26', 'UL27','UL28'],
        'BBG':['UL04', 'UL07', 'UL21', 'UL22','UL24', 'UL26', 'UL27','UL28']

        # …etc…
    }

    # 5) render
    display_task_grid(
        grid, alloc, limits_map,
        task_color_map, task_name_map,
        site_prio, site_active,
        equipment_names_map,grid_hours
    )
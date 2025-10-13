 # -*- coding: utf-8 -*-
import pyodbc
import math
import json
import sys
# Connection string to the SQL Server database
connection_string = 'DRIVER={SQL Server};SERVER=103.116.81.118;DATABASE=MasterSchedule;UID=sa;PWD=Apache#3407'  # Your database connection string


# ---- read delays from STDIN; grid_hours from argv[1] ----
def _load_delays_from_stdin():
    import sys, json, io
    # ensure UTF-8 stdout once
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    raw = sys.stdin.read()
    if not raw or not raw.strip():
        return []
    try:
        return json.loads(raw)
    except Exception as e:
        print(f"?? Error parsing delayed slots JSON from STDIN: {e}", file=sys.stderr)
        return []


try:
    grid_hours = int(sys.argv[1]) if len(sys.argv) > 1 else 24
except:
    grid_hours = 24
def _f(x, default=0.0):
    try:
        v = float(x)
        if math.isnan(v) or math.isinf(v):
            return default
        return v
    except Exception:
        return default
# --------------------------------------------------
# 0. Delay categories & codes helper
# --------------------------------------------------
def fetch_delay_categories_and_codes():
    conn   = pyodbc.connect(connection_string)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT Delay_Category, Delay_code, COALESCE(Description, '') AS Description
        FROM MasterSchedule.dbo.MS_DELAYS
        WHERE IsActive = 1
    """)
    rows = cursor.fetchall()
    conn.close()

    categories = sorted({ r.Delay_Category for r in rows })
    codes = [
        {'category': r.Delay_Category, 'code': r.Delay_code, 'description': r.Description or ""}
        for r in rows
    ]
    return categories, codes

    html += f"""
<script>
  window.MS_DELAY_CATS  = {json.dumps(categories)};
  window.MS_DELAY_CODES = {json.dumps(codes)};
</script>
"""

# --------------------------------------------------
# 1. Calculate Task Duration
# --------------------------------------------------
def calculate_task_duration(
    uom: str,
    total_plan_m: float,
    total_backfill_t: float,
    firings: int,          # unused right now
    width: float,
    height: float,
    density: float,
    remote_t: float,
    duration_minutes: float
) -> tuple[float, int]:
    """
    duration_minutes meaning:
      - UOM 'area*' -> duration_minutes is a *meters per hour* rate
      - UOM 'ton*'  -> duration_minutes is *minutes per tonne*
      - UOM 'bogt'  -> use remote_t directly (minutes)
      - else        -> treat duration_minutes as absolute minutes
    Skip rules (minutes=0 -> hours=0):
      - area: if rate<=0 or total_plan_m<=0 -> skip
      - ton:  if total_backfill_t<=0 -> skip   (per your requirement)
      - bogt: if remote_t<=0 -> skip
      - else: if duration_minutes<=0 -> skip
    """
    def _f(x, d=0.0):
        try:
            return float(x) if x is not None else d
        except Exception:
            return d

    u = (uom or "").strip().lower()
    rate = _f(duration_minutes, 0.0)

    if u.startswith("area"):
        m = _f(total_plan_m, 0.0)
        if rate > 0 and m > 0:
            minutes = (m / rate) * 60.0
        else:
            minutes = 0.0  # skip

    elif u == "bogt":
        minutes = _f((remote_t/duration_minutes)*60, 0.0)  

    elif u.startswith("ton"):
        tonnes = _f(total_backfill_t, 0.0)
        if tonnes > 0 and rate > 0:
            minutes = tonnes * 60/rate   
        else:
            minutes = 0.0  # skip if no tonnes or no rate

    elif u == "bfp":
    # Skip when tons are 0; else behave like 'task' (fixed minutes)
        tonnes = _f(total_backfill_t, 0.0)
        if tonnes <= 0:
            minutes = 0.0
        else:
            minutes = rate if rate > 0 else 0.0
    else:
        # fixed minutes task
        minutes = rate if rate > 0 else 0.0  # 0 => skip

    hours = 0 if minutes <= 0 else math.ceil(minutes / 60.0)
    return minutes, hours

# --------------------------------------------------
# 2. Generate 24-hour Task Grid (plus priority & active maps)
# --------------------------------------------------
def generate_task_grid(delayed_slots, grid_hours=24):
    # Build a lookup: site -> set(blocked hours)
    delay_map: dict[str, set[int]] = {}
    for d in delayed_slots:
        site = d.get('row')
        hour = d.get('hour') if 'hour' in d else d.get('hourIndex')
        if site is not None and isinstance(hour, int) and 0 <= hour < grid_hours:
            delay_map.setdefault(site, set()).add(hour)

    grid = {}
    hourly_alloc = {h: {} for h in range(grid_hours)}
    last_filled = {}
    task_duration_data = {}
    site_priority_map = {}
    site_active_map = {}

    conn = pyodbc.connect(connection_string)
    cur  = conn.cursor()

    # ---------- Constants ----------
    cur.execute("SELECT keyword, value FROM [MasterSchedule].[dbo].[CF_CONSTANTS]")
    def _ff(x, d=0.0):
        try:
            return float(x)
        except Exception:
            return d
    consts = {k: _ff(v, 0.0) for k, v in cur.fetchall()}
    width, height, density = consts.get('WIDTH', 0), consts.get('HEIGHT', 0), consts.get('DENSITY', 0)

    # ---------- Parameter limits & UOM ----------
    cur.execute("SELECT ID, Limits, UOM, [Duation (Minutes)] FROM [MasterSchedule].[dbo].[CF_MS_PARAMETERS]")
    limits_map, uom_map, duration_map = {}, {}, {}
    for ID, lim, uoc, dur in cur.fetchall():
        limits_map[ID]  = int(lim) if str(lim).isdigit() and int(lim) > 0 else 2
        uom_map[ID]     = uoc or 'Task'
        duration_map[ID]= _f(dur, 0.0)   # base minutes/rate (semantics depend on UOM)

    # ---------- Full SEQ order (to enable cycling) ----------
    cur.execute("""
        SELECT ID
        FROM [MasterSchedule].[dbo].[CF_MS_PARAMETERS]
        ORDER BY SEQ ASC
    """)
    seq_order_rows = [r[0] for r in cur.fetchall()]
    seq_index = {tid: i for i, tid in enumerate(seq_order_rows)}

    # Fallback default task = SEQ 1 (or first available)
    cur.execute("""SELECT TOP 1 ID FROM [MasterSchedule].[dbo].[CF_MS_PARAMETERS] WHERE SEQ = 1""")
    row = cur.fetchone()
    default_task_id = row[0] if row else (seq_order_rows[0] if seq_order_rows else 'DEFAULT_TASK')

    # ---------- Plan rows ----------
    cur.execute("""
        SELECT [Site], [Priority], [Active], [Firings],
               [Total Backfill T], [TOTAL PLAN M], [Current_Task],
               [Time_to_Complete], [REMOTE_T]
        FROM [MasterSchedule].[dbo].[MS_UPLOAD_WEEKLY_PLAN_CF]
    """)
    rows = cur.fetchall()
    rows.sort(key=lambda r: (r[1] is None, r[1]))  # by Priority

    def allocate(site, task_id, hrs_needed):
        rem = int(max(0, hrs_needed))
        col = last_filled[site]
        max_per_hour = limits_map.get(task_id, 2)
        while rem > 0 and col < grid_hours:
            if col in delay_map.get(site, set()):
                col += 1
                continue
            if not grid[site][col] and hourly_alloc[col].get(task_id, 0) < max_per_hour:
                grid[site][col] = task_id
                hourly_alloc[col][task_id] = hourly_alloc[col].get(task_id, 0) + 1
                rem -= 1
            col += 1
        last_filled[site] = col

    for site, prio, active_flag, firings, backfill, planM, task_id, ttc_hours, remote_t in rows:
        site_priority_map[site] = prio
        is_active = bool(active_flag)
        site_active_map[site] = is_active

        # init row
        if site not in grid:
            grid[site] = [''] * grid_hours
            last_filled[site] = 0

        if not is_active:
            continue

        # start task & firings
                # start task & firings
        task_id = task_id or default_task_id
        try:
            cycles = int(firings) if firings is not None else 1
        except:
            cycles = 1
        cycles = max(1, cycles)

        # Build the cyclic task list starting from current task_id
        if seq_order_rows:
            start_idx = seq_index.get(task_id, 0)

            if cycles == 1:
                
                per_cycle_nowrap = seq_order_rows[start_idx:]   
                task_cycle_ids = per_cycle_nowrap if per_cycle_nowrap else [task_id]
            else:
               
                per_cycle_wrap = [seq_order_rows[(start_idx + k) % len(seq_order_rows)]
                                  for k in range(len(seq_order_rows))]
                task_cycle_ids = per_cycle_wrap * cycles
        else:
            task_cycle_ids = [task_id] * cycles


        used_ttc_once_for_current = False

        for tid in task_cycle_ids:
            ...
            base_min = duration_map.get(tid, 60.0) or 60.0

            if (tid == task_id) and (not used_ttc_once_for_current) and _f(ttc_hours, 0.0) > 0:
                mins = _f(ttc_hours, 0.0) * 60.0
                hrs  = max(1, math.ceil(mins / 60.0))
                used_ttc_once_for_current = True
            else:
                mins, hrs = calculate_task_duration(
                    uom_map.get(tid, 'Task'),
                    planM, backfill, firings,
                    width, height, density,
                    remote_t,
                    base_min
                )


            task_duration_data[f"{site}:{tid}"] = {'min': mins, 'hr': hrs}

            if hrs > 0:
                allocate(site, tid, hrs)

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
table.task-grid { width:100%; table-layout:fixed; border-collapse:collapse; font-family:Arial,sans-serif; margin-bottom:20px; }
table.task-grid th, table.task-grid td { border:1px solid #333; padding:clamp(2px,0.5vw,8px); font-size:clamp(8px,0.8vw,14px); text-align:center; white-space:normal; word-wrap:break-word; }
table.task-grid th { background:#0f0e17; color:#ff8906; }
table.task-grid tr:nth-child(even) { background:#0f0e17; }
table.task-grid tr:hover { background:#ff8906; }
table.task-grid .task-cell span { display:inline-block; padding:clamp(1px,0.4vw,6px); font-size:clamp(6px,0.7vw,12px); border-radius:4px; color:#000; font-weight:bold; }
</style>

<style>
a.toggle-site {
  color: white;
  font-weight: bold;
  padding: 2px 6px;
  
  
  text-decoration: none;
  transition: all 0.2s ease-in-out;
}
a.toggle-site:hover {
  background-color: #ff8906;
  color: black;
  text-decoration: none;
}

/* ---- Sort indicator triangles ---- */
.sort-indicator{
  display:inline-block; margin-left:6px; width:0; height:0; vertical-align:middle;
  border-left:5px solid transparent; border-right:5px solid transparent;
}
th[data-dir="none"] .sort-indicator{
  border-top:6px solid #666; opacity:.6;
}
th[data-dir="asc"] .sort-indicator{
  border-bottom:6px solid #ff8906; border-top:none; opacity:1;
}
th[data-dir="desc"] .sort-indicator{
  border-top:6px solid #ff8906; border-bottom:none; opacity:1;
}
table.task-grid th .hour-btn{
  display:block;
  width:100%;
  height:100%;
  background: transparent !important;
  color: inherit;
  text-align:center;
  cursor:pointer;
}
</style>


<table class="task-grid">
  <thead>
    <tr>
      <th style="width:3%;">P</th>
      <th style="width:10%; cursor:pointer;" data-sort="site" data-dir="desc" title="Sort by Site">
        <span class="th-text">Site</span><span class="sort-indicator"></span>
      </th>""" 
    # hours header
    per_slot = 85 / grid_hours
    for h in range(grid_hours):
        html += (
            f'<th class="hour-th" style="width:{per_slot:.2f}%;">'
            f'  <div class="hour-btn" data-hour="{h}" '
            f'       title="Delay from hour {h+1}" '
            f'       role="button" tabindex="0">{h+1}</div>'
            f'</th>'
        )
    html += "</tr></thead><tbody>"
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
    html += "</tbody></table>"
    html += """
<script>
(function(){
  function textAt(cell){
    var a = cell.querySelector('a');
    return (a ? a.textContent : cell.textContent).trim();
  }

  // Extract the group char (3rd char) and return a rank for the given dir
  // asc  => 8 is *smaller* than 7  (G8 first)
  // desc => 7 is *larger*  than 8  (G7 first)
  function groupRankForDir(dir, name){
    var s = (name || "").replace(/\\s+/g,'');
    var ch = s.length >= 3 ? s[2] : '';
    var g  = (ch === '7') ? 'G7' : (ch === '8') ? 'G8' : 'OTHER';

    if (dir === 'asc'){
      if (g === 'G8') return 0;
      if (g === 'G7') return 1;
      return 2;
    } else { // 'desc'
      if (g === 'G7') return 0;
      if (g === 'G8') return 1;
      return 2;
    }
  }

  // -- storage helpers (switch to sessionStorage below if you want session-only)
  var STORE_KEY = 'mscf_site_sort_dir';
  function getStoredDir(){
    try { return localStorage.getItem(STORE_KEY) || 'desc'; } catch(e){ return 'desc'; }
  }
  function setStoredDir(v){
    try { localStorage.setItem(STORE_KEY, v); } catch(e){}
  }

  document.addEventListener('DOMContentLoaded', function(){
    var th = document.querySelector('th[data-sort="site"]');
    if(!th) return;

    var table = th.closest('table');
    var tbody = table.querySelector('tbody');
    if(!tbody) return;

    var originalRows = Array.from(tbody.querySelectorAll('tr'));

    function applySort(dir){
      if(dir === 'none'){
        originalRows.forEach(r => tbody.appendChild(r));
        return;
      }
      var colIdx = 1; // Site column
      var rows = Array.from(tbody.querySelectorAll('tr'));
      rows.sort(function(r1, r2){
        var a = textAt(r1.cells[colIdx]);
        var b = textAt(r2.cells[colIdx]);

        // Rank by 7/8 group first (direction-aware)
        var ra = groupRankForDir(dir, a);
        var rb = groupRankForDir(dir, b);
        if (ra !== rb) return ra - rb;

        // Tie-breaker: normal string compare, direction-aware
        var cmp = a.toLowerCase().localeCompare(b.toLowerCase(), undefined, {numeric:true, sensitivity:'base'});
        return (dir === 'asc') ? cmp : -cmp;
      });
      rows.forEach(r => tbody.appendChild(r));
    }

    // Load saved dir (default 'desc'), apply immediately, show state on header
    var saved = getStoredDir(); // 'desc' | 'asc' | 'none'
    th.setAttribute('data-dir', saved);
    applySort(saved);

    th.addEventListener('click', function(){
      var current = th.getAttribute('data-dir') || 'none';
      var next = (current === 'none') ? 'asc' : (current === 'asc' ? 'desc' : 'none');
      th.setAttribute('data-dir', next);
      setStoredDir(next);
      applySort(next);
    });
  });
})();
</script>

<script>
(function(){
  document.addEventListener('click', function(e){
    var btn = e.target.closest('.hour-btn');
    if (!btn) return;

    var hour = parseInt(btn.getAttribute('data-hour'), 10) || 0;
    var modalEl = document.getElementById('delayModal');
    if (!modalEl) return;

    var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();

    setTimeout(function(){
      var form = document.getElementById('delayForm');
      if (!form) return;

      // mark batch mode (matches submit logic)
      form.dataset.mode       = 'batch-edit';
      form.dataset.batch      = '1';
      form.dataset.site       = '__ALL__';
      form.dataset.hourIndex  = String(hour);
      form.dataset.blockStart = String(hour);
      form.dataset.blockEndEx = String(hour + 1);

      // show Delete button in batch mode
      var delBtn = document.getElementById('btnDeleteDelay');
      if (delBtn) delBtn.style.display = '';

      var maxH = (typeof getGridHours === 'function') ? getGridHours() : 24;
      var dur  = document.getElementById('duration');
      if (dur) {
        dur.setAttribute('max', String(maxH));
        if (!dur.value || parseInt(dur.value,10) < 1) dur.value = '1';
      }

      if (typeof window.fillDelayDropdowns === 'function') {
        window.fillDelayDropdowns();
      }
    }, 0);
  }, {capture:false, passive:false});
})();
</script>


"""

       # 6) Prepare chart data
    sum_limits = sum(limits_map.values()) or 0
    if sum_limits <= 0:
        hourly_pct = [0 for _ in range(grid_hours)]
    else:
        hourly_pct = [round((sum(hourly_alloc[h].values()) / sum_limits) * 100, 0) for h in range(grid_hours)]

    task_pct = []
    for t, lim in limits_map.items():
        denom = (lim or 0) * grid_hours
        if denom <= 0:
            task_pct.append(0)
        else:
            used = sum(hourly_alloc[h].get(t, 0) for h in range(grid_hours))
            task_pct.append(round((used / denom) * 100, 0))

    ids       = list(limits_map.keys())
    js_hourly = json.dumps(hourly_pct)
    js_task   = json.dumps(task_pct)
    js_ids    = json.dumps(ids)
    js_colors = json.dumps(task_color_map)
    js_cats   = json.dumps(categories)
    js_codes  = json.dumps(codes)

    # 6.1) Inject delay dropdown data & logic (MUST be after js_cats/js_codes and inside this function)
    html += f"""
<script>
(function(){{
  // Data injected from Python
  window.MS_DELAY_CATS  = {js_cats};
  window.MS_DELAY_CODES = {js_codes};

  var CATS  = Array.isArray(window.MS_DELAY_CATS)  ? window.MS_DELAY_CATS  : [];
  var CODES = Array.isArray(window.MS_DELAY_CODES) ? window.MS_DELAY_CODES : [];

  if (!CATS.length && CODES.length) {{
    var set = {{}};
    CODES.forEach(function(x){{ if (x && x.category) set[x.category] = 1; }});
    CATS = Object.keys(set).sort();
  }}

  function fillDelayDropdowns(preselectCat, preselectCode){{
    var catSel  = document.getElementById("delayCategory");
    var codeSel = document.getElementById("delayCode");
    if (!catSel || !codeSel) return;

    var prevCat  = (preselectCat  != null ? preselectCat  : catSel.value) || "";
    var prevCode = (preselectCode != null ? preselectCode : codeSel.value) || "";

    // Rebuild categories
    catSel.options.length = 0;
    if (CATS.length) {{
      CATS.forEach(function(c){{ catSel.add(new Option(c, c)); }});
    }} else {{
      var opt = new Option("No categories found", "");
      opt.disabled = true; opt.selected = true;
      catSel.add(opt);
    }}

    // Restore previous category if possible
    if (prevCat && Array.prototype.some.call(catSel.options, function(o){{ return o.value === prevCat; }})) {{
      catSel.value = prevCat;
    }} else if (catSel.options.length) {{
      catSel.selectedIndex = 0;
    }}

    // Rebuild codes for selected category
    var selCat = catSel.value || "";
    codeSel.options.length = 0;
    var filtered = (CODES || []).filter(function(x){{ return x && x.category === selCat; }});
    if (filtered.length) {{
      filtered.forEach(function(x){{ codeSel.add(new Option(x.code, x.code)); }});
      if (prevCode && filtered.some(function(x){{ return x.code === prevCode; }})) {{
        codeSel.value = prevCode;
      }} else {{
        codeSel.selectedIndex = 0;
      }}
    }} else {{
      var oc = new Option("No codes for " + (selCat || "category"), "");
      oc.disabled = true; oc.selected = true;
      codeSel.add(oc);
    }}
  }}
  window.fillDelayDropdowns = fillDelayDropdowns;

  function wire(){{
    var catSel = document.getElementById("delayCategory");
    if (catSel && !catSel.__wired) {{
      catSel.addEventListener("change", function(){{
        fillDelayDropdowns(catSel.value, null);
      }});
      catSel.__wired = true;
    }}
  }}

  // Wait until selects exist (this HTML is injected after postback)
  (function wait(attempts){{
    attempts = attempts || 0;
    var ready = document.getElementById("delayCategory") && document.getElementById("delayCode");
    if (!ready) {{
      if (attempts < 100) return setTimeout(function(){{ wait(attempts+1); }}, 50);
      return;
    }}
    wire();
    fillDelayDropdowns();
  }})();

  // Refill whenever the modal is shown
  var modal = document.getElementById("delayModal");
  if (modal) {{
    modal.addEventListener("shown.bs.modal", function(){{
      wire();
      fillDelayDropdowns();
    }});
  }}

  // Refill after UpdatePanel partial postbacks
  if (typeof(Sys) !== "undefined" && Sys.WebForms && Sys.WebForms.PageRequestManager) {{
    Sys.WebForms.PageRequestManager.getInstance().add_endRequest(function(){{
      wire();
      fillDelayDropdowns();
    }});
  }}
}})();
</script>
"""

    # 7) Charts
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
"""

    # 8) Maintenance grid + toggle script
    html += generate_maintenance_opportunity_grid(
        hourly_alloc,
        task_name_map,
        limits_map,
        equipment_names_map,
        grid_hours
    )
    html += """
<script>
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".toggle-site").forEach(el => {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      const site = this.dataset.site;
      fetch(`/ToggleSiteStatus.aspx?site=${encodeURIComponent(site)}`)
        .then(resp => resp.text())
        .then(_ => location.reload())
        .catch(err => console.error("Toggle failed", err));
    });
  });
});
</script>
"""
    return html

# ==== Snapshot persistence (final; no HOURLY_ALLOC table writes) ====
import uuid, json
from datetime import datetime, timezone

DDL_BATCH = r"""
IF OBJECT_ID('dbo.MS_CF_SNAPSHOT','U') IS NULL
BEGIN
  CREATE TABLE dbo.MS_CF_SNAPSHOT(
      SnapshotID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
      GeneratedAtUTC DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
      GridHours INT NOT NULL,
      DelayedSlotsJson NVARCHAR(MAX) NULL,
      ParametersJson NVARCHAR(MAX) NULL,
      Source VARCHAR(64) NULL
  );
END;

IF OBJECT_ID('dbo.MS_CF_SNAPSHOT_SITE','U') IS NULL
BEGIN
  CREATE TABLE dbo.MS_CF_SNAPSHOT_SITE(
      SnapshotID UNIQUEIDENTIFIER NOT NULL,
      Site NVARCHAR(100) NOT NULL,
      Priority INT NULL,
      IsActive BIT NOT NULL,
      CONSTRAINT PK_MS_CF_SNAPSHOT_SITE PRIMARY KEY (SnapshotID, Site),
      CONSTRAINT FK_MS_CF_SNAPSHOT_SITE_SNAP FOREIGN KEY (SnapshotID) REFERENCES dbo.MS_CF_SNAPSHOT(SnapshotID)
  );
END;

IF OBJECT_ID('dbo.MS_CF_SNAPSHOT_LIMITS','U') IS NULL
BEGIN
  CREATE TABLE dbo.MS_CF_SNAPSHOT_LIMITS(
      SnapshotID UNIQUEIDENTIFIER NOT NULL,
      TaskID NVARCHAR(50) NOT NULL,
      LimitPerHour INT NOT NULL,
      CONSTRAINT PK_MS_CF_SNAPSHOT_LIMITS PRIMARY KEY (SnapshotID, TaskID),
      CONSTRAINT FK_MS_CF_SNAPSHOT_LIMITS_SNAP FOREIGN KEY (SnapshotID) REFERENCES dbo.MS_CF_SNAPSHOT(SnapshotID)
  );
END;

IF OBJECT_ID('dbo.MS_CF_SNAPSHOT_TASK_DURATION','U') IS NULL
BEGIN
  CREATE TABLE dbo.MS_CF_SNAPSHOT_TASK_DURATION(
      SnapshotID UNIQUEIDENTIFIER NOT NULL,
      Site NVARCHAR(100) NOT NULL,
      TaskID NVARCHAR(50) NOT NULL,
      Minutes FLOAT NOT NULL,
      Hours INT NOT NULL,
      CONSTRAINT PK_MS_CF_SNAPSHOT_TASK_DURATION PRIMARY KEY (SnapshotID, Site, TaskID),
      CONSTRAINT FK_MS_CF_SNAPSHOT_TASK_DURATION_SNAP FOREIGN KEY (SnapshotID) REFERENCES dbo.MS_CF_SNAPSHOT(SnapshotID)
  );
END;

IF OBJECT_ID('dbo.MS_CF_SNAPSHOT_CELL','U') IS NULL
BEGIN
  CREATE TABLE dbo.MS_CF_SNAPSHOT_CELL(
      SnapshotID UNIQUEIDENTIFIER NOT NULL,
      Site NVARCHAR(100) NOT NULL,
      HourIndex INT NOT NULL,
      TaskID NVARCHAR(50) NULL,
      IsDelayed BIT NOT NULL,
      CONSTRAINT PK_MS_CF_SNAPSHOT_CELL PRIMARY KEY (SnapshotID, Site, HourIndex),
      CONSTRAINT FK_MS_CF_SNAPSHOT_CELL_SNAP FOREIGN KEY (SnapshotID) REFERENCES dbo.MS_CF_SNAPSHOT(SnapshotID)
  );
END;

IF OBJECT_ID('dbo.MS_CF_SNAPSHOT_DELAYS','U') IS NULL
BEGIN
  CREATE TABLE dbo.MS_CF_SNAPSHOT_DELAYS(
      DelayID     BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
      SnapshotID  UNIQUEIDENTIFIER NOT NULL,
      RowSite     NVARCHAR(100) NULL,
      HourIndex   INT NULL,
      BlockStart  INT NULL,
      BlockEndEx  INT NULL,
      DelayCategory NVARCHAR(100) NULL,
      DelayCode     NVARCHAR(100) NULL,
      Notes       NVARCHAR(4000) NULL,
      RawJson     NVARCHAR(MAX) NULL,
      CONSTRAINT FK_MS_CF_SNAPSHOT_DELAYS_SNAP
        FOREIGN KEY (SnapshotID) REFERENCES dbo.MS_CF_SNAPSHOT(SnapshotID)
  );
END;
"""

def ensure_tables():
    conn = pyodbc.connect(connection_string)
    cur  = conn.cursor()
    cur.execute(DDL_BATCH)
    conn.commit()
    conn.close()

def persist_snapshot(
    snapshot_id,
    grid_hours,
    delayed_slots,
    grid,
    limits_map,
    task_duration_data,
    site_priority_map,
    site_active_map,
    parameters_json=None,
    source='python'
):
    import collections

    def _exec_many_stream(cur, sql, row_iter, chunk=200):
        """Stream rows into executemany in small chunks to avoid MemoryError."""
        buf = []
        for row in row_iter:
            buf.append(row)
            if len(buf) >= chunk:
                cur.executemany(sql, buf)
                buf.clear()
        if buf:
            cur.executemany(sql, buf)

    def _compress_delays_bitset(slots, grid_hours):
        """
        Build a tiny bitset (int) per (site,cat,code,notes) and emit contiguous [start,end) ranges.
        Yields tuples for INSERT: (SnapshotID, RowSite, BlockStart, BlockEndEx, DelayCategory, DelayCode, Notes, HourIndex, RawJson)
        """
        # key: (site, category, code, note) -> bitmask int
        masks = collections.defaultdict(int)

        for d in (slots or []):
            site = d.get('row')
            h    = d.get('hour') if 'hour' in d else d.get('hourIndex')
            if site is None or h is None:
                continue
            cat  = d.get('category') or d.get('delayCategory')
            code = d.get('code')     or d.get('delayCode')
            note = d.get('notes')    or d.get('comment')
            hi = int(h)
            if hi < 0 or hi >= int(grid_hours):
                continue
            key = (site, cat, code, note)
            masks[key] |= (1 << hi)

        # walk each mask and yield contiguous runs
        for (site, cat, code, note), mask in masks.items():
            # find runs of 1-bits in [0, grid_hours)
            i = 0
            while i < grid_hours:
                if not (mask >> i) & 1:
                    i += 1
                    continue
                # start of a run
                start = i
                while i < grid_hours and ((mask >> i) & 1):
                    i += 1
                end_ex = i  # exclusive
                yield (snapshot_id, site, start, end_ex, cat, code, note, start, None)

    conn = pyodbc.connect(connection_string)
    cur  = conn.cursor()
    cur.fast_executemany = True
    try:
        # 1) snapshot header
        cur.execute("""
            INSERT INTO dbo.MS_CF_SNAPSHOT (SnapshotID, GridHours, DelayedSlotsJson, ParametersJson, Source)
            VALUES (?, ?, ?, ?, ?)
        """, (snapshot_id, int(grid_hours), json.dumps(delayed_slots, ensure_ascii=False), parameters_json, source))

        # 2) sites meta (stream small batch)
        site_rows = (
            (snapshot_id, site,
             None if site_priority_map.get(site) is None else int(site_priority_map.get(site)),
             1 if site_active_map.get(site, True) else 0)
            for site in grid.keys()
        )
        _exec_many_stream(cur, """
            INSERT INTO dbo.MS_CF_SNAPSHOT_SITE (SnapshotID, Site, Priority, IsActive)
            VALUES (?, ?, ?, ?)
        """, site_rows, chunk=200)

        # 3) limits
        limit_rows = ((snapshot_id, str(task_id), int(lim)) for task_id, lim in limits_map.items())
        _exec_many_stream(cur, """
            INSERT INTO dbo.MS_CF_SNAPSHOT_LIMITS (SnapshotID, TaskID, LimitPerHour)
            VALUES (?, ?, ?)
        """, limit_rows, chunk=200)

        # 4) durations
        def _dur_iter():
            for key, obj in task_duration_data.items():
                site, task_id = key.split(':', 1)
                yield (snapshot_id, site, task_id, float(obj.get('min', 0.0)), int(obj.get('hr', 0)))
        _exec_many_stream(cur, """
            INSERT INTO dbo.MS_CF_SNAPSHOT_TASK_DURATION (SnapshotID, Site, TaskID, Minutes, Hours)
            VALUES (?, ?, ?, ?, ?)
        """, _dur_iter(), chunk=200)

        # 5) cells (site × hour) — streamed
        def _cell_iter():
            # build tiny lookup set for delayed cells per site to tag IsDelayed quickly
            delayed_lookup = {}
            for d in delayed_slots or []:
                site = d.get('row')
                h    = d.get('hour') if 'hour' in d else d.get('hourIndex')
                if site is None or h is None:
                    continue
                delayed_lookup.setdefault(site, set()).add(int(h))
            for site, row in grid.items():
                dset = delayed_lookup.get(site, ())
                for h, tid in enumerate(row):
                    is_del = 1 if h in dset else 0
                    yield (snapshot_id, site, int(h), (str(tid) if tid else None), is_del)

        _exec_many_stream(cur, """
            INSERT INTO dbo.MS_CF_SNAPSHOT_CELL (SnapshotID, Site, HourIndex, TaskID, IsDelayed)
            VALUES (?, ?, ?, ?, ?)
        """, _cell_iter(), chunk=500)  # 500 is fine; rows are tiny

         # 6) delays — COMPRESSED bitset, stream + per-row execute to avoid executemany buffering
        delay_sql = """
            INSERT INTO dbo.MS_CF_SNAPSHOT_DELAYS
            (SnapshotID, RowSite, BlockStart, BlockEndEx, DelayCategory, DelayCode, Notes, HourIndex, RawJson)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        # executemany can spike memory; do per-row executes instead
        cur.fast_executemany = False
        for row in _compress_delays_bitset(delayed_slots, int(grid_hours)):
            cur.execute(delay_sql, row)

        conn.commit()
    except MemoryError:
        conn.rollback()
        print("!! Persist snapshot failed: out of memory while batching rows. Compression+streaming applied; if this persists, reduce chunk sizes further.", file=sys.stderr)
        raise
    except Exception as e:
        conn.rollback()
        print(f"!! Persist snapshot failed: {e}", file=sys.stderr)
        raise
    finally:
        conn.close()

def load_snapshot(snapshot_id: str):
    """Rebuild grid + metadata from snapshot tables so we can render without regenerating."""
    conn = pyodbc.connect(connection_string)
    cur  = conn.cursor()

    # 1) basics
    cur.execute("SELECT GridHours FROM dbo.MS_CF_SNAPSHOT WHERE SnapshotID = ?", snapshot_id)
    row = cur.fetchone()
    if not row:
        conn.close()
        raise ValueError(f"Snapshot {snapshot_id} not found")
    grid_hours = int(row[0])

    # 2) site meta
    site_prio, site_active = {}, {}
    cur.execute("""
        SELECT Site, Priority, IsActive
        FROM dbo.MS_CF_SNAPSHOT_SITE
        WHERE SnapshotID = ?
    """, snapshot_id)
    for site, prio, is_active in cur.fetchall():
        site_prio[site]   = prio
        site_active[site] = bool(is_active)

    # 3) limits
    limits_map = {}
    cur.execute("""
        SELECT TaskID, LimitPerHour
        FROM dbo.MS_CF_SNAPSHOT_LIMITS
        WHERE SnapshotID = ?
    """, snapshot_id)
    for tid, lim in cur.fetchall():
        limits_map[str(tid)] = int(lim)

    # 4) durations (site-task minutes/hours)
    durations = {}
    cur.execute("""
        SELECT Site, TaskID, Minutes, Hours
        FROM dbo.MS_CF_SNAPSHOT_TASK_DURATION
        WHERE SnapshotID = ?
    """, snapshot_id)
    for site, tid, mins, hrs in cur.fetchall():
        durations[f"{site}:{tid}"] = {"min": float(mins), "hr": int(hrs)}

    # 5) grid cells -> grid + hourly_alloc
    grid = {}
    hourly_alloc = {h: {} for h in range(grid_hours)}
    cur.execute("""
        SELECT Site, HourIndex, TaskID
        FROM dbo.MS_CF_SNAPSHOT_CELL
        WHERE SnapshotID = ?
        ORDER BY Site, HourIndex
    """, snapshot_id)
    for site, h, tid in cur.fetchall():
        if site not in grid:
            grid[site] = [''] * grid_hours
        idx = int(h)
        t   = (tid or '').strip()
        grid[site][idx] = t
        if t:
            hourly_alloc[idx][t] = hourly_alloc[idx].get(t, 0) + 1

    conn.close()
    return grid, hourly_alloc, limits_map, durations, site_prio, site_active, grid_hours


def get_snapshot_delays(snapshot_id: str):
    """Return a per-hour delayed_slots array for the snapshot."""
    conn = pyodbc.connect(connection_string)
    cur  = conn.cursor()

    # First try the JSON cached on the snapshot header
    cur.execute("SELECT DelayedSlotsJson FROM dbo.MS_CF_SNAPSHOT WHERE SnapshotID = ?", snapshot_id)
    row = cur.fetchone()
    if row and row[0]:
        try:
            arr = json.loads(row[0])
            conn.close()
            # normalize shape (row/hourIndex/category/code/comments/duration)
            out = []
            for d in arr:
                if not d: continue
                site = d.get('row') or d.get('RowSite') or d.get('site')
                h    = d.get('hourIndex') if 'hourIndex' in d else d.get('hour')
                if site is None or h is None: continue
                out.append({
                    'row': site,
                    'hourIndex': int(h),
                    'category': d.get('category') or d.get('delayCategory') or '',
                    'code': d.get('code') or d.get('delayCode') or '',
                    'comments': d.get('comments') or d.get('notes') or d.get('comment') or '',
                    'duration': int(d.get('duration') or 1)
                })
            return out
        except Exception:
            pass  # fall back to ranges

    # Fall back: expand ranges from MS_CF_SNAPSHOT_DELAYS
    cur.execute("""
        SELECT RowSite, BlockStart, BlockEndEx, ISNULL(DelayCategory,''), ISNULL(DelayCode,''), ISNULL(Notes,'')
        FROM dbo.MS_CF_SNAPSHOT_DELAYS
        WHERE SnapshotID = ?
    """, snapshot_id)
    out = []
    for site, start, endex, cat, code, notes in cur.fetchall():
        if site is None or start is None or endex is None: 
            continue
        dur = max(1, int(endex) - int(start))
        for h in range(int(start), int(endex)):
            out.append({
                'row': site,
                'hourIndex': h,
                'category': cat,
                'code': code,
                'comments': notes or '',
                'duration': dur
            })
    conn.close()
    return out

# --------------------------------------------------
# 5. Main
# --------------------------------------------------
if __name__ == '__main__':
    import argparse, uuid, json
    from datetime import datetime, timezone

    parser = argparse.ArgumentParser()
    parser.add_argument('--snapshot', help='Render from an existing SnapshotID')
    parser.add_argument('--hours', type=int, default=None)
    args, _ = parser.parse_known_args()

    # ---------- RESTORE MODE ----------
    if args.snapshot:
        try:
            # 1) Load data from snapshot tables
            grid, alloc, limits_map, durations, site_prio, site_active, grid_hours = load_snapshot(args.snapshot)

            # 2) Fetch color/name maps
            conn = pyodbc.connect(connection_string)
            cur  = conn.cursor()
            task_color_map = { ID: Color for ID, Color in cur.execute(
                "SELECT ID, Color FROM MasterSchedule.dbo.CF_MS_PARAMETERS") }
            task_name_map  = { ID: Task  for ID, Task  in cur.execute(
                "SELECT ID, Task  FROM MasterSchedule.dbo.CF_MS_PARAMETERS") }
            conn.close()

            equipment_names_map = {
                'CBL': ['UD10','UD11','UD12','UD15','UD13','UD14','UD16'],
                'PDR': ['UD10','UD11','UD12','UD15','UD13','UD14','UD16'],
                'CF':  ['IT01','U526'],
                'SBG': ['UL04','UL07','UL21','UL22','UL24','UL26','UL27','UL28'],
                'BFP': ['UL04','UL07','UL21','UL22','UL24','UL26','UL27','UL28'],
                'BF':  ['UL04','UL07','UL21','UL22','UL24','UL26','UL27','UL28'],
                'BBG': ['UL04','UL07','UL21','UL22','UL24','UL26','UL27','UL28']
            }

            # 3) Meta for toast
            print(
                f'<div id="mscf-snapshot-meta" style="display:none" '
                f'data-snapshot-id="{args.snapshot}" '
                f'data-grid-hours="{grid_hours}" '
                f'data-delays="(restored)" '
                f'data-sites="{len(grid)}"></div>'
            )

            # 4) Render grid HTML
            html_out = display_task_grid(
                grid, alloc, limits_map,
                task_color_map, task_name_map,
                site_prio, site_active,
                equipment_names_map, grid_hours
            )
            print(html_out)

            # 5) Seed delays into sessionStorage + repaint (robust)
            delayed_slots_restored = get_snapshot_delays(args.snapshot)
            print(f"""
<script>
(function(){{
  // 1) Seed session + hidden field
  var v = {json.dumps(delayed_slots_restored, ensure_ascii=False)};
  try {{ sessionStorage.setItem('delayedSlots', JSON.stringify(v)); }} catch(_){{
  }}
  try {{
    var hf = document.getElementById('hfDelayedSlots');
    if (hf) hf.value = JSON.stringify(v);
  }} catch(_){{
  }}

  // 2) Ensure hour toggle & body class match snapshot
  function selectHours(target){{
    var radios = document.querySelectorAll('input[name="rblHours"]');
    var found = false;
    radios.forEach(function(r){{
      if (parseInt(r.value, 10) === target) {{ r.checked = true; found = true; }}
      else {{ r.checked = false; }}
    }});
    if (found){{
      var evt = new Event('change', {{ bubbles:true }});
      var sel = document.querySelector('input[name="rblHours"]:checked');
      if (sel) sel.dispatchEvent(evt);
    }}
    document.body.classList.toggle('grid-48h', {int(grid_hours)} === 48);
  }}
  selectHours({int(grid_hours)});

  // 3) Repaint delays when grid DOM is ready
  function gridReady(){{
    return document.querySelectorAll('.task-grid .task-cell').length > 0;
  }}
  function repaint(){{
    if (typeof applyDelayedSlots === 'function') {{
      try {{ applyDelayedSlots(); }} catch(e){{ console && console.warn('applyDelayedSlots error', e); }}
    }}
  }}
  (function waitAndPaint(n){{
    if (gridReady()) {{ repaint(); return; }}
    if (n > 40) {{ repaint(); return; }}
    setTimeout(function(){{ waitAndPaint(n+1); }}, 50);
  }})(0);

  // 4) After partial postbacks or modal closes, repaint again
  if (typeof(Sys) !== 'undefined' && Sys.WebForms && Sys.WebForms.PageRequestManager){{
    try {{
      Sys.WebForms.PageRequestManager.getInstance().add_endRequest(function(){{ repaint(); }});
    }} catch(_){{
    }}
  }}
  document.addEventListener('hidden.bs.modal', function(e){{
    var id = e && e.target && e.target.id;
    if (id === 'snapHistoryModal' || id === 'delayModal') repaint();
  }});
}})();
</script>
""")
        except Exception:
            import traceback, html as _html
            tb = _html.escape(''.join(traceback.format_exc()))
            print(f"<div class='text-danger'>Restore error:<br/><pre>{tb}</pre></div>")
        sys.exit(0)  # <-- IMPORTANT: stop here in restore mode

    # ---------- GENERATE MODE ----------
    # Only read stdin in generate mode
    delayed_slots = _load_delays_from_stdin()
    if args.hours:
        grid_hours = args.hours

    grid, alloc, limits_map, durations, site_prio, site_active = generate_task_grid(delayed_slots, grid_hours)

    # fetch color/name maps
    conn = pyodbc.connect(connection_string)
    cur  = conn.cursor()
    task_color_map = { ID: Color for ID, Color in cur.execute(
        "SELECT ID, Color FROM MasterSchedule.dbo.CF_MS_PARAMETERS") }
    task_name_map  = { ID: Task  for ID, Task  in cur.execute(
        "SELECT ID, Task  FROM MasterSchedule.dbo.CF_MS_PARAMETERS") }
    conn.close()

    equipment_names_map = {
        'CBL': ['UD10','UD11','UD12','UD15','UD13','UD14','UD16'],
        'PDR': ['UD10','UD11','UD12','UD15','UD13','UD14','UD16'],
        'CF':  ['IT01','U526'],
        'SBG': ['UL04','UL07','UL21','UL22','UL24','UL26','UL27','UL28'],
        'BFP': ['UL04','UL07','UL21','UL22','UL24','UL26','UL27','UL28'],
        'BF':  ['UL04','UL07','UL21','UL22','UL24','UL26','UL27','UL28'],
        'BBG': ['UL04','UL07','UL21','UL22','UL24','UL26','UL27','UL28']
    }

    # 1) ensure tables (idempotent)
    ensure_tables()

    # 2) persist snapshot
    snapshot_id = uuid.uuid4()
    params_obj = {
        "grid_hours": grid_hours,
        "generated_at_utc": datetime.now(timezone.utc).isoformat(timespec='seconds')
    }
    persist_snapshot(
        snapshot_id=snapshot_id,
        grid_hours=grid_hours,
        delayed_slots=delayed_slots,
        grid=grid,
        limits_map=limits_map,
        task_duration_data=durations,
        site_priority_map=site_prio,
        site_active_map=site_active,
        parameters_json=json.dumps(params_obj, ensure_ascii=False),
        source='python'
    )

    # toast meta
    delays_count = len(delayed_slots or [])
    site_count   = len(grid or {})
    print(
        f'<div id="mscf-snapshot-meta" style="display:none" '
        f'data-snapshot-id="{snapshot_id}" '
        f'data-grid-hours="{grid_hours}" '
        f'data-delays="{delays_count}" '
        f'data-sites="{site_count}"></div>'
    )

    # 3) render HTML
    html_out = display_task_grid(
        grid, alloc, limits_map,
        task_color_map, task_name_map,
        site_prio, site_active,
        equipment_names_map, grid_hours
    )
    print(html_out)



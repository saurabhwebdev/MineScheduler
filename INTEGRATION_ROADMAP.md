# MineScheduler Integration Roadmap & Architecture

**Date:** 2025-10-13  
**Status:** Planning Phase for Scheduling Algorithm Implementation

---

## 📊 AUDIT LOGGING STATUS - ✅ COMPLETE

### **All Implemented Modules Have Full Audit Logging:**

| Module | CREATE | UPDATE | DELETE | IMPORT | Notes |
|--------|--------|--------|--------|--------|-------|
| **Tasks** | ✅ | ✅ | ✅ | ✅ | Move operations tracked |
| **Delays** | ✅ | ✅ | ✅ | ✅ | Bulk import logged |
| **UOMs** | ✅ | ✅ | ✅ | ❌ | No import feature |
| **Shifts** | ✅ | ✅ | ✅ | ✅ | Bulk import logged |
| **Sites** | ✅ | ✅ | ✅ | ✅ | Status toggle logged |
| **Equipment** | ✅ | ✅ | ✅ | ✅ | Maintenance logged |
| **Constants** | ✅ | ✅ | ✅ | ❌ | No import feature |
| **Users** | ✅ | ✅ | ✅ | ❌ | Role changes logged |

**All audit logs include:**
- User who performed action
- Action type (CREATE/UPDATE/DELETE)
- Module/Entity type
- Old values (for UPDATE/DELETE)
- New values (for CREATE/UPDATE)
- IP Address
- User Agent
- Timestamp

---

## ✅ IMPLEMENTED MODULES (Backend + Frontend Complete)

### **1. Authentication & Authorization** ✅
**Files:**
- `routes/auth.js`, `routes/oauth.js`
- `middleware/auth.js`
- `client/src/pages/Login.js`, `Register.js`, `OAuthCallback.js`

**Features:**
- JWT-based authentication
- SSO (Google, Microsoft)
- Role-based access control (admin/user)
- Password reset/change
- Profile management

---

### **2. Task Management** ✅
**Files:**
- `routes/tasks.js` (inline controllers)
- `models/Task.js`
- `client/src/pages/Tasks.js`

**Features:**
- Task types: `task` and `activity`
- UOM assignment (links to UOM module)
- Rate-based calculations for activities
- Task duration (minutes)
- Task ordering (SEQ) with move up/down
- Task limits (1-10 per hour) - **USED BY SCHEDULER**
- Color assignment - **USED BY SCHEDULER**
- Excel import/export
- Calculated output for activities

**Audit Logging:** ✅ CREATE, UPDATE, DELETE, IMPORT

**Integration Points:**
- **UOM Module**: Each task has a UOM field
- **Scheduler**: Task limits enforce max sites per hour
- **Scheduler**: Task colors used in grid visualization
- **Scheduler**: Task order defines cyclic rotation sequence
- **Equipment**: Tasks can be assigned to equipment

---

### **3. Delay Management** ✅
**Files:**
- `routes/delays.js` (inline controllers)
- `models/Delay.js`
- `client/src/pages/Delays.js`

**Features:**
- Delay categories and codes
- Delay types: `standard` (with duration) and `custom`
- Active/Inactive status
- Excel import/export

**Audit Logging:** ✅ CREATE, UPDATE, DELETE, IMPORT

**Integration Points:**
- **Scheduler**: Delays block specific site-hour cells
- **Scheduler**: Standard delays have predefined durations
- **Grid UI**: Delays shown as overlays on schedule grid

---

### **4. UOM Management** ✅
**Files:**
- `routes/uoms.js` (inline controllers)
- `models/Uom.js`
- `client/src/components/UomConfig.js` (in Settings)

**Features:**
- Define units of measurement (Ton, Area, Task, BOGT, BFP, etc.)
- Used to categorize task types

**Audit Logging:** ✅ CREATE, UPDATE, DELETE

**Integration Points:**
- **Tasks**: Each task assigned a UOM
- **Scheduler**: UOM determines duration calculation formula
  - `area*` → (meters / meters_per_hour) × 60
  - `ton*` → (tonnes × 60) / rate
  - `bogt` → (remote_t / duration_minutes) × 60
  - `bfp` → fixed duration if tonnes > 0
  - `task` → fixed minutes

---

### **5. Shift Management** ✅
**Files:**
- `routes/shifts.js` (inline controllers)
- `models/Shift.js`
- `client/src/components/ShiftConfig.js` (in Settings)

**Features:**
- Shift codes (A, B, C, etc.)
- Start/end times
- Shift change duration (minutes)
- Color coding
- Active/Inactive status
- Excel import/export

**Audit Logging:** ✅ CREATE, UPDATE, DELETE, IMPORT

**Integration Points:**
- **Scheduler**: Defines work periods for 24/48-hour grids
- **Grid UI**: Shift change periods shown as breaks
- **Future**: Filter schedule by shift

---

### **6. Site/Location Management** ✅
**Files:**
- `routes/sites.js`
- `controllers/siteController.js`
- `models/Site.js`
- `client/src/pages/Sites.js`

**Features:**
- Site priority (determines scheduling order) - **CRITICAL FOR SCHEDULER**
- Active/Inactive status - **CRITICAL FOR SCHEDULER**
- Planning data:
  - **Total Backfill Tonnes** - used in tonnage calculations
  - **Total Plan Meters** - used in area calculations
  - **Remote Tonnes** - used in BOGT calculations
  - **Firings** (cycles) - determines how many times tasks repeat
  - **Current Task** - starting task for cyclic rotation
  - **Time to Complete** - override for current task duration
- Notes
- Excel import/export
- Status toggle

**Audit Logging:** ✅ CREATE, UPDATE, DELETE, IMPORT, TOGGLE

**Integration Points:**
- **Scheduler**: Priority determines row order (top to bottom)
- **Scheduler**: Only active sites are scheduled
- **Scheduler**: Planning data used in duration calculations
- **Scheduler**: Firings determine task cycle repetitions
- **Grid UI**: Each site = one row in the schedule grid

---

### **7. Equipment Management** ✅
**Files:**
- `routes/equipment.js`
- `controllers/equipmentController.js`
- `models/Equipment.js`, `models/MaintenanceLog.js`
- `client/src/pages/Equipment.js`

**Features:**
- Equipment ID, name, type
- Status (Active, Under Maintenance, Inactive, Retired)
- Site assignment
- Specifications (manufacturer, model, year, capacity, serial number)
- Maintenance tracking:
  - Last service date
  - Next service date
  - Service interval (hours)
  - Operational hours
- Maintenance log history
- Task assignments (which tasks use this equipment) - **CRITICAL FOR SCHEDULER**
- Excel import/export

**Audit Logging:** ✅ CREATE, UPDATE, DELETE, IMPORT, MAINTENANCE_LOG

**Integration Points:**
- **Scheduler**: Task-equipment mapping determines availability
- **Maintenance Grid**: Shows equipment availability per hour
- **Sites**: Equipment can be assigned to specific sites
- **Future**: Equipment downtime affects scheduling

---

### **8. Constants Management** ✅
**Files:**
- `routes/constants.js`
- `controllers/constantsController.js`
- `models/Constant.js`
- `client/src/components/ConstantsConfig.js` (in Settings)

**Features:**
- Mining calculation constants:
  - **WIDTH** (5.0 meters) - **CRITICAL FOR SCHEDULER**
  - **HEIGHT** (4.0 meters) - **CRITICAL FOR SCHEDULER**
  - **DENSITY** (2.7 tonnes/m³) - **CRITICAL FOR SCHEDULER**
- Admin-only management
- Category-based organization
- Auto-seeding on first load

**Audit Logging:** ✅ CREATE, UPDATE, DELETE

**Integration Points:**
- **Scheduler**: Used in volume/tonnage calculations:
  ```
  volume = WIDTH × HEIGHT × total_plan_m
  tonnes = volume × DENSITY
  ```

---

### **9. User Management** ✅
**Files:**
- `routes/users.js` (inline controllers)
- `models/User.js`
- `client/src/pages/UserManagement.js`

**Features:**
- User CRUD (admin only)
- Role management (admin/user)
- Last admin protection

**Audit Logging:** ✅ CREATE, UPDATE, DELETE, ROLE_CHANGE

**Integration Points:**
- **All Modules**: Every action tied to a user
- **Audit**: All logs reference user who performed action

---

### **10. Audit Logging** ✅
**Files:**
- `routes/audit.js`
- `models/AuditLog.js`
- `utils/auditLogger.js`
- `client/src/pages/Audit.js`

**Features:**
- Track all CRUD operations
- User actions logged
- IP address tracking
- Change details (before/after)
- Filter by user, action, date, module

**Integration Points:**
- **All Modules**: Every operation creates audit log
- **Compliance**: Full audit trail for all changes

---

## ❌ PENDING MODULES (From Python Script - Not Yet Implemented)

### **🔴 CRITICAL: Scheduling Algorithm** ❌
**Purpose:** The heart of the application - generates the 24/48-hour schedule grid

**What It Does:**
1. **Fetches Data** from all modules:
   - Sites (with priority, active status, planning data)
   - Tasks (with limits, UOM, durations, colors, order)
   - Delays (blocked hours)
   - Constants (WIDTH, HEIGHT, DENSITY)
   - Equipment (task-equipment mapping)

2. **Duration Calculation** based on UOM:
   ```javascript
   if (uom === 'area') {
     volume = WIDTH × HEIGHT × total_plan_m
     duration_minutes = (total_plan_m / rate_meters_per_hour) × 60
   } else if (uom === 'ton') {
     tonnes = total_backfill_t || (WIDTH × HEIGHT × total_plan_m × DENSITY)
     duration_minutes = (tonnes × 60) / rate_tons_per_hour
   } else if (uom === 'bogt') {
     duration_minutes = (remote_t / duration_minutes) × 60
   } else if (uom === 'bfp') {
     if (total_backfill_t > 0) {
       duration_minutes = fixed_duration
     } else {
       skip this task (0 hours)
     }
   } else { // 'task'
     duration_minutes = fixed_duration
   }
   
   hours = Math.ceil(duration_minutes / 60)
   ```

3. **Priority-Based Allocation:**
   - Sort sites by priority (low number = high priority)
   - Sort by active status (active sites first)
   - Allocate hours top-to-bottom

4. **Hourly Limit Enforcement:**
   - Each task has a `limits` field (1-10)
   - Maximum X sites can use same task in same hour
   - Example: If "Drilling" has limit=2, only 2 sites can drill in hour 5

5. **Delay Integration:**
   - Skip hours where delays are marked
   - Move to next available hour

6. **Cyclic Task Rotation (Firings):**
   - If site has `firings=3`:
     - Start with `current_task`
     - Complete all tasks in sequence (based on task `order`)
     - Repeat sequence 3 times
   - If `firings=1`:
     - Start with `current_task`
     - Complete remaining tasks in sequence (no wrap-around)
   
7. **Time-to-Complete Override:**
   - If site has `time_to_complete` value:
     - Use this for the `current_task` duration (overrides calculation)
     - Then continue with calculated durations for subsequent tasks

8. **Grid Generation:**
   - Create 2D array: `grid[site][hour] = taskId`
   - Return JSON structure for frontend

**Files to Create:**
- `routes/schedule.js`
- `controllers/scheduleController.js`
- Backend endpoint: `POST /api/schedule/generate`

**Input:**
```json
{
  "gridHours": 24,
  "delayedSlots": [
    { "row": "SiteA", "hourIndex": 5, "category": "Mechanical", "code": "M01", "duration": 2 }
  ]
}
```

**Output:**
```json
{
  "grid": {
    "SiteA": ["DRL", "DRL", "DRL", "CHP", "", "", ...],
    "SiteB": ["CHP", "CHP", "DRL", "DRL", "", "", ...]
  },
  "hourlyAllocation": {
    "0": { "DRL": 2, "CHP": 1 },
    "1": { "DRL": 2, "CHP": 1 }
  },
  "taskDurations": {
    "SiteA:DRL": { "min": 180, "hr": 3 },
    "SiteB:CHP": { "min": 120, "hr": 2 }
  },
  "sitePriority": {
    "SiteA": 1,
    "SiteB": 2
  },
  "siteActive": {
    "SiteA": true,
    "SiteB": true
  }
}
```

**Integration Points:**
- **Sites**: Priority, active status, planning data, firings, current task, time_to_complete
- **Tasks**: Task limits, UOM, rate, duration, color, order
- **Delays**: Block specific site-hour cells
- **Constants**: WIDTH, HEIGHT, DENSITY for calculations
- **Equipment**: Task-equipment mapping (future: check availability)

---

### **🔴 CRITICAL: Schedule Grid UI** ❌
**Purpose:** Visual interface to display and interact with the schedule

**What It Shows:**
- **Table Layout**:
  - Rows: Sites (sorted by priority)
  - Columns: Hours (1-24 or 1-48)
  - Cells: Task IDs (color-coded)
  
- **Interactive Features**:
  - Click site name to toggle active/inactive
  - Click cell to add/edit delay
  - Click hour header to delay entire column (all sites)
  - Hover to see task details
  - Sort by site name (with G7/G8 grouping)
  
- **Visual Indicators**:
  - Color-coded tasks (from Task.color)
  - Delayed cells: Red overlay or strikethrough
  - Inactive sites: Greyed out
  - Active cell highlighting

**Files to Create:**
- `client/src/pages/Schedule.js` (replace placeholder)
- `client/src/components/ScheduleGrid.js`
- `client/src/components/ScheduleCell.js`
- `client/src/components/DelayModal.js`
- `client/src/pages/Schedule.css`

**Components:**

1. **ScheduleGrid.js**
   ```jsx
   <div className="schedule-grid">
     <div className="grid-controls">
       <button onClick={generate24Hour}>24 Hours</button>
       <button onClick={generate48Hour}>48 Hours</button>
       <button onClick={exportExcel}>Export</button>
     </div>
     
     <table className="task-grid">
       <thead>
         <tr>
           <th>Priority</th>
           <th>Site</th>
           {hours.map(h => <th key={h}>{h+1}</th>)}
         </tr>
       </thead>
       <tbody>
         {sites.map(site => (
           <tr key={site}>
             <td>{sitePriority[site]}</td>
             <td>
               <a onClick={() => toggleSiteStatus(site)}>
                 {site}
               </a>
             </td>
             {hours.map(h => (
               <ScheduleCell 
                 key={h}
                 site={site}
                 hour={h}
                 taskId={grid[site][h]}
                 isDelayed={isDelayed(site, h)}
                 taskColor={taskColors[grid[site][h]]}
                 onClick={() => openDelayModal(site, h)}
               />
             ))}
           </tr>
         ))}
       </tbody>
     </table>
   </div>
   ```

2. **DelayModal.js**
   ```jsx
   <Modal>
     <Form>
       <Select name="delayCategory" options={delayCategories} />
       <Select name="delayCode" options={delayCodesFiltered} />
       <InputNumber name="duration" min={1} max={gridHours} />
       <TextArea name="notes" />
       <Button type="submit">Apply Delay</Button>
       <Button type="danger" onClick={deleteDelay}>Delete Delay</Button>
     </Form>
   </Modal>
   ```

**State Management:**
```javascript
const [gridHours, setGridHours] = useState(24);
const [scheduleData, setScheduleData] = useState(null);
const [delayedSlots, setDelayedSlots] = useState([]);
const [loading, setLoading] = useState(false);

// Store delays in sessionStorage for persistence
useEffect(() => {
  const saved = sessionStorage.getItem('delayedSlots');
  if (saved) setDelayedSlots(JSON.parse(saved));
}, []);

const generateSchedule = async () => {
  const response = await fetch('/api/schedule/generate', {
    method: 'POST',
    body: JSON.stringify({ gridHours, delayedSlots })
  });
  const data = await response.json();
  setScheduleData(data);
};
```

**Integration Points:**
- **Scheduler API**: Calls POST /api/schedule/generate
- **Delays**: Fetch delay categories/codes for modal
- **Sites**: Toggle active/inactive status
- **Session Storage**: Persist delays across page refreshes

---

### **🟡 IMPORTANT: Snapshot System** ❌
**Purpose:** Save and restore schedule states for version control

**What It Does:**
1. **Save Snapshot**:
   - Capture entire schedule state:
     - Grid data (all site-hour-task assignments)
     - Delayed slots
     - Site metadata (priority, active status)
     - Task limits
     - Task durations (calculated)
     - GridHours (24 or 48)
     - Timestamp
   - Store in database with unique SnapshotID

2. **Restore Snapshot**:
   - Load saved state from database
   - Regenerate grid HTML without recalculating
   - Apply saved delays

3. **Snapshot History**:
   - List all saved snapshots
   - Show: Date, GridHours, # of delays, # of sites
   - Allow restore or delete

**Files to Create:**
- `models/Snapshot.js` (6 related schemas):
  ```javascript
  SnapshotSchema: {
    snapshotId: UUID,
    generatedAt: Date,
    gridHours: Number,
    delayedSlotsJson: String,
    parametersJson: String,
    source: String (e.g., "manual", "auto")
  }
  
  SnapshotSiteSchema: {
    snapshotId: UUID,
    site: String,
    priority: Number,
    isActive: Boolean
  }
  
  SnapshotLimitsSchema: {
    snapshotId: UUID,
    taskId: String,
    limitPerHour: Number
  }
  
  SnapshotTaskDurationSchema: {
    snapshotId: UUID,
    site: String,
    taskId: String,
    minutes: Number,
    hours: Number
  }
  
  SnapshotCellSchema: {
    snapshotId: UUID,
    site: String,
    hourIndex: Number,
    taskId: String,
    isDelayed: Boolean
  }
  
  SnapshotDelaysSchema: {
    snapshotId: UUID,
    rowSite: String,
    blockStart: Number,
    blockEndEx: Number,
    delayCategory: String,
    delayCode: String,
    notes: String
  }
  ```

- Backend endpoints:
  - `POST /api/schedule/snapshot/save` - Save current schedule
  - `GET /api/schedule/snapshot/:id` - Restore snapshot
  - `GET /api/schedule/snapshots` - List all snapshots
  - `DELETE /api/schedule/snapshot/:id` - Delete snapshot

- Frontend:
  - Add "Save Snapshot" button on schedule page
  - Add "Snapshot History" modal
  - Add "Restore" button in history modal

**Integration Points:**
- **Scheduler**: Auto-save after each generation
- **Grid UI**: Manual save button
- **History**: Version comparison (future)

---

### **🟡 IMPORTANT: Charts & Analytics** ❌
**Purpose:** Visualize schedule utilization and performance

**What It Shows:**

1. **Hourly Utilization Chart** (Line Chart):
   - X-axis: Hours (1-24 or 1-48)
   - Y-axis: Utilization % (0-100%)
   - Formula: `(sites_scheduled_this_hour / sum_of_all_task_limits) × 100`
   - Shows: How efficiently each hour is used

2. **Task Utilization Chart** (Bar Chart):
   - X-axis: Task IDs (DRL, CHP, etc.)
   - Y-axis: Utilization % (0-100%)
   - Formula: `(hours_used / (limit × grid_hours)) × 100`
   - Color: Each bar uses task's color
   - Shows: Which tasks are over/under utilized

3. **Equipment Maintenance Grid** (Table):
   - Rows: Equipment names
   - Columns: Hours (1-24 or 1-48)
   - Cells: 
     - ✅ Green checkmark = Available for maintenance
     - ❌ Red X = In use (assigned task is scheduled)
   - Logic:
     ```javascript
     for each hour:
       for each equipment:
         if any assigned task is scheduled this hour:
           mark as "In Use"
         else:
           mark as "Available"
     ```

**Files to Create:**
- `client/src/pages/Reports.js` (replace placeholder)
- Use Chart.js or ECharts library
- Add equipment maintenance grid component

**Integration Points:**
- **Scheduler**: Fetch schedule data for calculations
- **Equipment**: Use task-equipment assignments
- **Tasks**: Use task colors for bar chart

---

### **🟢 NICE TO HAVE: Additional Features** ❌

1. **Schedule Export** (PDF/Excel):
   - Export grid as Excel with colors
   - Export as PDF with charts
   - Email schedule reports

2. **Schedule Templates**:
   - Save common schedule configurations
   - Quick-apply templates

3. **Real-time Collaboration**:
   - WebSocket support
   - Live updates when another user changes schedule
   - User presence indicators

4. **Equipment Utilization Tracking**:
   - Track actual vs planned hours
   - Maintenance alerts
   - Downtime tracking

5. **Advanced Filtering**:
   - Filter schedule by shift
   - Filter by site group
   - Filter by task type

---

## 🔄 COMPLETE SYSTEM INTEGRATION FLOW

### **Workflow 1: Creating a New Schedule**

```
USER ACTIONS:
1. Navigate to "Sites" page
   ├─ Create/update sites with priority, planning data, firings
   └─ Set current_task and time_to_complete if needed

2. Navigate to "Tasks" page
   ├─ Create/update tasks with UOM, rate, duration, limits
   └─ Set task order for cyclic rotation

3. Navigate to "Delays" page
   └─ Create delay categories and codes

4. Navigate to "Equipment" page (optional)
   ├─ Create equipment
   └─ Assign tasks to equipment

5. Navigate to "Settings" page
   ├─ UOM Configuration: Define units
   ├─ Shift Management: Define shifts
   └─ Mining Constants: Set WIDTH, HEIGHT, DENSITY

6. Navigate to "Schedule" page
   ├─ Select grid hours (24 or 48)
   ├─ Click "Generate Schedule"
   │  └─ Backend fetches:
   │     ├─ Sites (priority, active, planning data)
   │     ├─ Tasks (limits, UOM, durations, colors, order)
   │     ├─ Delays (categories, codes)
   │     ├─ Constants (WIDTH, HEIGHT, DENSITY)
   │     └─ Equipment (task assignments)
   │  
   │  └─ Backend calculates:
   │     ├─ Task durations (based on UOM and planning data)
   │     ├─ Priority-based allocation
   │     ├─ Hourly limit enforcement
   │     ├─ Cyclic task rotation (firings)
   │     └─ Generates grid[site][hour] = taskId
   │
   └─ Grid displayed with colors and interactive cells

7. Apply delays (optional)
   ├─ Click any cell or hour header
   ├─ Select delay category and code
   ├─ Set duration
   └─ Delays stored in sessionStorage

8. Regenerate schedule (if delays applied)
   └─ Backend skips delayed hours during allocation

9. Save snapshot
   └─ Captures entire state for future restore

10. View analytics (Reports page)
    ├─ Hourly utilization chart
    ├─ Task utilization chart
    └─ Equipment maintenance grid
```

---

### **Workflow 2: Data Flow Through Modules**

```
[USER] → [LOGIN/AUTH]
           ↓
    [AUTHENTICATED SESSION]
           ↓
    ┌──────┴──────┐
    ↓             ↓
[ADMIN ROLE]  [USER ROLE]
    │             │
    ├─ Users      ├─ Home (Dashboard)
    ├─ Audit      ├─ Schedule (view/edit)
    │             ├─ Tasks (view only)
    │             ├─ Delays (view only)
    │             ├─ Sites (view only)
    │             ├─ Equipment (view only)
    │             ├─ Reports (view)
    │             └─ Settings (view only)
    │
    └─ Full CRUD on:
       ├─ Tasks
       ├─ Delays
       ├─ UOMs
       ├─ Shifts
       ├─ Sites
       ├─ Equipment
       └─ Constants

[SCHEDULE GENERATION] ← Pulls data from:
    ├─ Sites (priority, planning data, firings)
    ├─ Tasks (limits, UOM, durations, order)
    ├─ Delays (categories, codes)
    ├─ Constants (WIDTH, HEIGHT, DENSITY)
    ├─ Equipment (task assignments)
    └─ Session delays (delayed slots)
    
    ↓
[SCHEDULER ALGORITHM]
    ├─ Calculate durations
    ├─ Sort by priority
    ├─ Allocate hours
    ├─ Enforce limits
    ├─ Handle delays
    └─ Rotate tasks (firings)
    
    ↓
[SCHEDULE DATA]
    ├─ grid[site][hour] = taskId
    ├─ hourlyAllocation
    ├─ taskDurations
    └─ siteMetadata
    
    ↓
[GRID UI] → Displays schedule
    ├─ Color-coded cells
    ├─ Interactive delays
    └─ Site status toggle
    
    ↓
[SNAPSHOT] → Saves state
    
    ↓
[REPORTS] → Analyzes data
    ├─ Utilization charts
    └─ Maintenance grid

[AUDIT] ← Logs all actions
    ├─ Every CRUD operation
    ├─ Schedule generation
    ├─ Delay application
    └─ Status changes
```

---

### **Workflow 3: How Each Module Contributes to Scheduling**

```
SITES MODULE:
├─ Provides: Site list, priority, active status, planning data
├─ Planning Data:
│  ├─ Total Backfill Tonnes → Used in tonnage calculations
│  ├─ Total Plan Meters → Used in area calculations
│  ├─ Remote Tonnes → Used in BOGT calculations
│  ├─ Firings → Determines task cycle repetitions
│  ├─ Current Task → Starting point for rotation
│  └─ Time to Complete → Override for current task duration
└─ Used By: Scheduler (priority sort, duration calcs, cyclic rotation)

TASKS MODULE:
├─ Provides: Task definitions, UOM, rate, duration, limits, color, order
├─ Task Data:
│  ├─ UOM → Determines calculation formula
│  ├─ Rate → Used in area/tonnage formulas
│  ├─ Duration → Base minutes for task
│  ├─ Limits → Max sites per hour (1-10)
│  ├─ Color → Visual representation in grid
│  └─ Order → Sequence for cyclic rotation
└─ Used By: Scheduler (duration calcs, hourly limits, colors, rotation order)

DELAYS MODULE:
├─ Provides: Delay categories, codes, durations
├─ Delay Data:
│  ├─ Category → Grouping (Mechanical, Geological, etc.)
│  ├─ Code → Specific delay (M01, G05, etc.)
│  └─ Duration → Fixed hours (for standard delays)
└─ Used By: Grid UI (delay modal), Scheduler (skip blocked hours)

CONSTANTS MODULE:
├─ Provides: Calculation constants
├─ Constants:
│  ├─ WIDTH (5.0 m) → Tunnel width
│  ├─ HEIGHT (4.0 m) → Tunnel height
│  └─ DENSITY (2.7 t/m³) → Rock density
├─ Formula: volume = WIDTH × HEIGHT × total_plan_m
│           tonnes = volume × DENSITY
└─ Used By: Scheduler (tonnage calculations from meters)

EQUIPMENT MODULE:
├─ Provides: Equipment list, task assignments, maintenance schedule
├─ Equipment Data:
│  ├─ Task Assignments → Which tasks use this equipment
│  ├─ Maintenance Schedule → Next service date
│  └─ Status → Available, Under Maintenance, etc.
└─ Used By: Maintenance Grid (show availability), Future: Scheduler (check availability)

UOM MODULE:
├─ Provides: Unit definitions
├─ UOMs:
│  ├─ "Ton" → Tonnage-based tasks
│  ├─ "Area" → Area-based tasks
│  ├─ "Task" → Fixed-duration tasks
│  ├─ "BOGT" → Bogger tasks
│  └─ "BFP" → Backfill prep tasks
└─ Used By: Tasks (categorize), Scheduler (select calculation formula)

SHIFTS MODULE:
├─ Provides: Shift definitions, timing, change duration
├─ Shift Data:
│  ├─ Start/End Times → Define work periods
│  ├─ Shift Change Duration → Break periods
│  └─ Color → Visual representation
└─ Used By: Future: Grid UI (show shift boundaries), Filter by shift

AUDIT MODULE:
├─ Captures: All CRUD operations across all modules
├─ Logged Actions:
│  ├─ Task create/update/delete
│  ├─ Site create/update/delete/toggle
│  ├─ Schedule generation
│  ├─ Delay application
│  ├─ Equipment changes
│  └─ User actions
└─ Used By: Compliance, Debugging, History tracking
```

---

## 📈 IMPLEMENTATION PRIORITY

### **Phase 1: Core Scheduling (CRITICAL) - 2-3 Weeks**
**Without this, the app is just a data management tool, not a scheduler.**

1. **Step 1: Scheduling Algorithm** (1-2 weeks)
   - Port Python logic to Node.js
   - Implement duration calculation based on UOM
   - Priority-based allocation
   - Hourly limits enforcement
   - Delay integration
   - Cyclic task rotation (firings)
   - Create `POST /api/schedule/generate` endpoint

2. **Step 2: Schedule Grid UI** (1 week)
   - Build grid component (sites × hours)
   - Color-coded task cells
   - 24/48-hour toggle
   - Delay modal integration
   - Site active/inactive toggle
   - Sortable table
   - Responsive design

---

### **Phase 2: Analytics & History (IMPORTANT) - 2-3 Weeks**

3. **Step 3: Snapshot System** (1 week)
   - Create snapshot models (6 schemas)
   - Save/restore endpoints
   - Snapshot history UI
   - Version comparison

4. **Step 4: Charts & Analytics** (1 week)
   - Hourly utilization chart
   - Task utilization chart
   - Equipment maintenance grid
   - KPI dashboard
   - Implement Reports page

---

### **Phase 3: Polish & Enhancements (NICE TO HAVE) - 1-2 Weeks**

5. **Step 5: Export & Templates** (3-4 days)
   - Excel export with colors
   - PDF export with charts
   - Schedule templates
   - Email reports

6. **Step 6: Advanced Features** (optional)
   - Real-time collaboration (WebSockets)
   - Equipment utilization tracking
   - Advanced filtering

---

## 🎯 KEY INTEGRATION POINTS SUMMARY

| From Module | To Module | Data Passed | Purpose |
|-------------|-----------|-------------|---------|
| Sites | Scheduler | Priority, planning data, firings | Sort order, duration calcs, rotation |
| Tasks | Scheduler | Limits, UOM, duration, order | Hourly constraints, calcs, sequence |
| Delays | Scheduler | Blocked slots | Skip hours during allocation |
| Constants | Scheduler | WIDTH, HEIGHT, DENSITY | Volume/tonnage calculations |
| Equipment | Maintenance Grid | Task assignments | Show availability |
| Tasks | Grid UI | Colors | Cell visualization |
| Scheduler | Grid UI | Grid data | Display schedule |
| Grid UI | Delays | User selections | Apply/remove delays |
| All Modules | Audit | All actions | Compliance tracking |

---

## 🔍 CURRENT STATE SUMMARY

### ✅ **Foundation Complete (10/18 modules)**
- Authentication ✅
- Task Management ✅
- Delay Management ✅
- UOM Management ✅
- Shift Management ✅
- Site Management ✅
- Equipment Management ✅
- Constants Management ✅
- User Management ✅
- Audit Logging ✅

### ❌ **Core Functionality Pending (3/18 modules)**
- Scheduling Algorithm ❌ **[MOST CRITICAL]**
- Schedule Grid UI ❌ **[MOST CRITICAL]**
- Snapshot System ❌

### ❌ **Analytics Pending (1/18 modules)**
- Charts & Reports ❌

### 🎯 **Next Steps:**
1. Implement Scheduling Algorithm (Backend)
2. Implement Schedule Grid UI (Frontend)
3. Connect the two
4. Test end-to-end workflow
5. Add Snapshot System
6. Add Charts & Analytics

---

## 🚀 READY TO IMPLEMENT?

All the building blocks are in place:
- ✅ Data models for Sites, Tasks, Delays, Equipment, Constants
- ✅ Full CRUD operations with audit logging
- ✅ Frontend pages for data management
- ✅ Authentication and authorization
- ✅ User interface framework (Ant Design)

**What's needed:**
- ❌ Scheduling algorithm to tie it all together
- ❌ Grid UI to display the schedule
- ❌ Snapshot system for versioning
- ❌ Analytics to measure performance

Once the scheduling algorithm is implemented, the app transforms from a **data management system** into a **functional mine scheduler**.

---

**Next Prompt:** Ready to implement the Scheduling Algorithm? 🎯

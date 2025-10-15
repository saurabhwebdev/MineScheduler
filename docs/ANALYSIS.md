# Mine Scheduler Analysis: Python Script vs MERN Stack Implementation

## Executive Summary
This document analyzes the existing Python-based mine scheduler (from your company) and compares it with your current MERN stack implementation to identify implemented features, pending items, and recommendations for the Equipment module.

---

## 1. PYTHON SCRIPT ANALYSIS (test.py)

### Core Functionality

#### A. **Task Scheduling Algorithm**
- **Purpose**: Generates a 24-hour (or 48-hour) task grid for mining sites
- **Key Features**:
  - Calculates task duration based on UOM (Unit of Measure)
  - Handles different task types: area-based, tonnage-based, BOGT, BFP
  - Supports cyclic task execution (firings/cycles)
  - Priority-based site allocation
  - Hourly limit constraints per task
  - Delay/blocked hours management

#### B. **Task Duration Calculation** (Lines 71-133)
Supports multiple UOM types:
1. **Area-based** (`area*`): Duration = (total_plan_m / rate_m_per_hour) × 60
2. **Tonnage-based** (`ton*`): Duration = (total_backfill_t × 60) / rate
3. **BOGT** (Bogger): Uses remote_t directly
4. **BFP** (Backfill Prep): Fixed duration if tonnes > 0
5. **Default**: Fixed minute duration

#### C. **Scheduling Logic** (Lines 137-279)
- **Reads from SQL Server database**: `MS_UPLOAD_WEEKLY_PLAN_CF`
- **Constants**: WIDTH, HEIGHT, DENSITY from `CF_CONSTANTS`
- **Parameters**: Task limits, UOM, duration from `CF_MS_PARAMETERS`
- **Priority sorting**: Sites scheduled by priority
- **Active/Inactive sites**: Only active sites are scheduled
- **Delay handling**: Blocked hours are skipped
- **Cyclic tasks**: Supports multiple firings with task rotation

#### D. **Equipment Maintenance Grid** (Lines 281-337)
- **Purpose**: Shows equipment availability for maintenance
- **Logic**: Maps tasks to equipment, shows when equipment is in use
- **Visual**: Green checkmark (available), Red X (in use)
- **Equipment Mapping**:
  ```
  CBL/PDR → UD10, UD11, UD12, UD15, UD13, UD14, UD16
  CF → IT01, U526
  SBG/BFP/BF/BBG → UL04, UL07, UL21, UL22, UL24, UL26, UL27, UL28
  ```

#### E. **Delay Management** (Lines 43-59, 920-957)
- **Categories and Codes**: Fetches from `MS_DELAYS` table
- **Bitset Compression**: Efficiently stores contiguous delay blocks
- **Fields**: Site, Category, Code, Notes, Duration, Hour ranges

#### F. **Snapshot System** (Lines 804-1160)
- **Purpose**: Save/restore scheduling states
- **Tables**:
  - `MS_CF_SNAPSHOT` - Header
  - `MS_CF_SNAPSHOT_SITE` - Site metadata
  - `MS_CF_SNAPSHOT_LIMITS` - Task limits
  - `MS_CF_SNAPSHOT_TASK_DURATION` - Calculated durations
  - `MS_CF_SNAPSHOT_CELL` - Grid cells
  - `MS_CF_SNAPSHOT_DELAYS` - Delay records

#### G. **Visualization** (Lines 344-802)
- **HTML/CSS/JavaScript generation**
- **Interactive grid**: Click to toggle site status, add delays
- **ECharts integration**: Hourly utilization, Task utilization charts
- **Color-coded tasks**: Each task has a unique color
- **Sortable table**: Sort by site, priority
- **Responsive design**: Clamp font sizes for different screens

---

## 2. CURRENT MERN STACK IMPLEMENTATION

### ✅ **Implemented Features**

#### A. **Authentication & Authorization**
- ✅ User registration and login
- ✅ JWT token-based authentication
- ✅ Role-based access control (admin/user)
- ✅ SSO support (Google, Microsoft)
- ✅ Profile management

#### B. **Task Management**
- ✅ Task CRUD operations
- ✅ Task types: `task` and `activity`
- ✅ UOM support (Unit of Measure)
- ✅ Rate-based calculations for activities
- ✅ Task duration (minutes)
- ✅ Calculated output (rate × duration)
- ✅ Task color assignment
- ✅ Task limits (1-10 per hour)
- ✅ Task ordering
- ✅ Bulk import via Excel
- ✅ Export functionality

#### C. **Delay Management**
- ✅ Delay CRUD operations
- ✅ Delay categories and codes
- ✅ Delay types: `standard` and `custom`
- ✅ Delay duration (optional for custom)
- ✅ Active/Inactive status
- ✅ Bulk import via Excel
- ✅ Export functionality

#### D. **UOM Management**
- ✅ UOM CRUD operations
- ✅ Predefined UOMs seeded on startup
- ✅ Support for compound UOMs (e.g., meter/hour)

#### E. **Shift Management**
- ✅ Shift CRUD operations
- ✅ Shift timing (start/end)
- ✅ Shift change duration
- ✅ Color coding
- ✅ Active/Inactive status

#### F. **User Management (Admin)**
- ✅ User CRUD operations
- ✅ Role management
- ✅ Last admin protection

#### G. **Audit Logging**
- ✅ Track all CRUD operations
- ✅ User actions logged
- ✅ IP address tracking
- ✅ Change details (before/after)

#### H. **UI/UX**
- ✅ Responsive design
- ✅ Flat, modern UI
- ✅ Consistent color scheme
- ✅ Toast notifications
- ✅ Loading states
- ✅ Sidebar navigation
- ✅ Profile dropdown

---

### ❌ **Missing/Pending Features**

#### A. **Scheduling Algorithm** 🔴 **CRITICAL**
- ❌ No task scheduling grid generation
- ❌ No priority-based allocation
- ❌ No hourly slot management
- ❌ No cyclic task execution (firings)
- ❌ No task duration calculation based on UOM
- ❌ No delay-aware scheduling

#### B. **Site/Location Management** 🔴 **CRITICAL**
- ❌ No site model/schema
- ❌ No site priority management
- ❌ No active/inactive site toggle
- ❌ No site-specific planning data:
  - Total Backfill Tonnes
  - Total Plan Meters
  - Remote Tonnes
  - Current Task
  - Time to Complete
  - Firings

#### C. **Equipment Management** 🔴 **CRITICAL**
- ❌ No equipment model/schema (currently placeholder)
- ❌ No equipment-to-task mapping
- ❌ No maintenance opportunity tracking
- ❌ No equipment utilization tracking
- ❌ No equipment status tracking

#### D. **Schedule Grid** 🔴 **CRITICAL**
- ❌ No visual scheduling grid
- ❌ No 24/48-hour view toggle
- ❌ No interactive cell editing
- ❌ No delay application on grid
- ❌ No real-time updates

#### E. **Snapshot System** 🟡 **IMPORTANT**
- ❌ No snapshot save/restore
- ❌ No schedule history
- ❌ No version comparison

#### F. **Charts & Analytics** 🟡 **IMPORTANT**
- ❌ No hourly utilization chart
- ❌ No task utilization chart
- ❌ No equipment maintenance grid visualization
- ❌ No performance metrics

#### G. **Constants/Parameters** 🟡 **IMPORTANT**
- ❌ No system constants (WIDTH, HEIGHT, DENSITY)
- ❌ No configurable task parameters
- ❌ No formula support for calculations

#### H. **Import/Export** 🟢 **NICE TO HAVE**
- ✅ Tasks and Delays support import/export
- ❌ Schedule export to Excel/PDF
- ❌ Site planning data import

---

## 3. EQUIPMENT MODULE IMPLEMENTATION PLAN

### Current State (Placeholder)
The Equipment page currently shows:
- Mock table with 3 sample equipment items
- Columns: Name, Type, Status, Location, Last Maintenance
- CRUD modals (non-functional)
- "Coming Soon" notification on actions

### Recommended Implementation (Phase 1 - MVP)

#### A. **Database Schema** (Equipment Model)

```javascript
const EquipmentSchema = new mongoose.Schema({
  equipmentId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Excavator', 'Haul Truck', 'Drill', 'Loader', 'Grader', 'Dozer', 'Bogger', 'Other'],
    required: true
  },
  status: {
    type: String,
    enum: ['operational', 'maintenance', 'out-of-service'],
    default: 'operational'
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  lastMaintenance: {
    type: Date,
    default: null
  },
  nextMaintenance: {
    type: Date,
    default: null
  },
  maintenanceInterval: {
    type: Number, // hours
    default: 500
  },
  operatingHours: {
    type: Number,
    default: 0
  },
  specifications: {
    manufacturer: String,
    model: String,
    year: Number,
    capacity: String,
    serialNumber: String
  },
  assignedTasks: [{
    type: String, // Task IDs
    ref: 'Task'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
```

#### B. **Backend API Routes**

```
GET    /api/equipment         - Get all equipment
POST   /api/equipment         - Create equipment
GET    /api/equipment/:id     - Get single equipment
PUT    /api/equipment/:id     - Update equipment
DELETE /api/equipment/:id     - Delete equipment
POST   /api/equipment/import  - Bulk import
GET    /api/equipment/export  - Export to Excel
PUT    /api/equipment/:id/maintenance - Log maintenance
GET    /api/equipment/availability    - Get maintenance opportunities
```

#### C. **Frontend Features**

1. **Equipment List Page**
   - ✅ Table with sorting, filtering, pagination (already styled)
   - Add search by name, type, location
   - Status badges (color-coded)
   - Quick status toggle
   - Last/next maintenance indicators

2. **Create/Edit Modal**
   - Equipment ID (auto-generated or manual)
   - Name
   - Type (dropdown)
   - Status (dropdown)
   - Location (dropdown or text)
   - Specifications (collapsible section)
   - Maintenance interval
   - Task assignment (multi-select)

3. **Additional Features**
   - Maintenance logging modal
   - Equipment history view
   - Utilization dashboard (future)
   - Import/Export functionality

#### D. **Integration with Scheduling** (Phase 2)

1. **Task-Equipment Mapping**
   - Add `equipment` field to Task schema (array of equipment IDs)
   - When scheduling, check equipment availability
   - Show maintenance windows on schedule grid

2. **Maintenance Opportunity Grid**
   - Show equipment availability per hour
   - Color-coded: Green (available), Red (in use), Yellow (maintenance due)
   - Click to schedule maintenance

3. **Equipment Utilization**
   - Track hours used per shift
   - Automatic maintenance alerts
   - Downtime tracking

---

## 4. PRIORITY IMPLEMENTATION ROADMAP

### 🔴 **Phase 1: Core Scheduling (Critical)**
**Timeline: 2-3 weeks**

1. **Site Management Module**
   - Create Site schema
   - Site CRUD operations
   - Site planning data (backfill, plan meters, firings, etc.)
   - Active/inactive toggle

2. **Scheduling Algorithm**
   - Implement task duration calculation logic
   - Build scheduling grid generator
   - Priority-based allocation
   - Hourly limit enforcement
   - Delay integration

3. **Schedule Grid UI**
   - Visual grid component
   - 24/48-hour toggle
   - Color-coded tasks
   - Interactive cells
   - Delay overlay

### 🟡 **Phase 2: Equipment & Analytics (Important)**
**Timeline: 1-2 weeks**

1. **Equipment Module** (per plan above)
   - Complete Equipment schema
   - Full CRUD operations
   - Task-equipment mapping
   - Basic maintenance tracking

2. **Analytics Dashboard**
   - Hourly utilization chart
   - Task utilization chart
   - Equipment maintenance grid
   - Basic KPIs

### 🟢 **Phase 3: Advanced Features (Enhancement)**
**Timeline: 2-3 weeks**

1. **Snapshot System**
   - Save schedule states
   - History view
   - Restore functionality

2. **Advanced Equipment**
   - Maintenance scheduling
   - Downtime tracking
   - Utilization analytics

3. **Reports & Export**
   - Schedule reports (PDF/Excel)
   - Equipment reports
   - Performance reports

---

## 5. EQUIPMENT MODULE - SPECIFIC RECOMMENDATIONS

### What Can Be Implemented Now (Quick Wins)

1. **Database Schema** ✅
   - Create Equipment model (see schema above)
   - Add indexes for performance

2. **Basic CRUD API** ✅
   - Implement all REST endpoints
   - Add validation
   - Add audit logging

3. **Frontend Enhancement** ✅
   - Replace placeholder data with real API calls
   - Add proper form validation
   - Add search/filter functionality
   - Add bulk import/export

4. **Basic Task Integration** ✅
   - Add multi-select field to assign tasks to equipment
   - Show assigned tasks in equipment details

### What Should Wait (Requires Scheduling)

1. **Maintenance Opportunity Grid** ⏳
   - Requires: Scheduling algorithm
   - Shows: When equipment is available based on scheduled tasks

2. **Utilization Tracking** ⏳
   - Requires: Schedule execution tracking
   - Shows: Hours used vs. available

3. **Automated Maintenance Alerts** ⏳
   - Requires: Operating hours tracking from schedule
   - Shows: When maintenance is due

---

## 6. KEY DIFFERENCES: Python vs MERN

| Feature | Python Script | MERN App |
|---------|---------------|----------|
| **Database** | SQL Server | MongoDB |
| **Architecture** | Monolithic script | REST API + React |
| **UI** | HTML generation | React components |
| **State** | SQL snapshots | To be implemented |
| **Scheduling** | Complex algorithm | Not yet implemented |
| **Equipment** | Hard-coded mapping | To be implemented |
| **Charts** | ECharts (server-side) | To be implemented |
| **Delays** | Bitset compression | Basic CRUD only |
| **Sites** | From database | Not yet implemented |

---

## 7. CONCLUSION

Your MERN stack app has a **solid foundation** with:
- ✅ Complete authentication & authorization
- ✅ Task management with UOM support
- ✅ Delay management
- ✅ User management
- ✅ Audit logging
- ✅ Modern UI/UX

**Critical gaps** to address:
- ❌ Site/Location management
- ❌ Scheduling algorithm
- ❌ Visual schedule grid
- ❌ Equipment module (currently placeholder)
- ❌ Analytics/Charts

**For Equipment Module**: Start with Phase 1 (basic CRUD and task integration), then enhance with scheduling-dependent features in Phase 2.

The Python script is primarily a **scheduling engine**, while your MERN app is a **comprehensive management platform**. The core scheduling logic from Python needs to be **adapted and integrated** into your MERN stack to make it fully functional.

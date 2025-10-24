# MineScheduler - Quick Test Setup Guide

## 🎯 Purpose
Quick setup guide with dummy data to test scheduler logic in **10 minutes**.

---

## 📋 Setup Steps

### 1. Constants (Settings Page)
Add these 3 constants:

```
WIDTH     | 3.6  | meters     | Standard stope width
HEIGHT    | 3.4  | meters     | Standard stope height  
DENSITY   | 2.7  | tonnes/m3  | Ore density
```

---

### 2. Equipment Types (Settings Page)
Add these types:

1. Click **Settings** in sidebar
2. Go to **Equipment Types** tab
3. Add these 4 types (click "Add Equipment Type" for each):

```
- Drill Rig
- Excavator
- Haul Truck
- Crusher
```

---

### 3. Units of Measurement - UOM (Settings Page)
Add these 5 UOMs (REQUIRED before creating tasks):

1. Go to **UOM** tab in Settings
2. Click "Add UOM" for each:

**UOM 1:**
- **Name:** `area`
- **Description:** `Area-based calculation for drilling`
- Click "Add UOM"

**UOM 2:**
- **Name:** `ton`
- **Description:** `Tonnage-based calculation`
- Click "Add UOM"

**UOM 3:**
- **Name:** `bogt`
- **Description:** `Bogging calculation`
- Click "Add UOM"

**UOM 4:**
- **Name:** `bfp`
- **Description:** `Backfill placement`
- Click "Add UOM"

**UOM 5:**
- **Name:** `task`
- **Description:** `Fixed task duration`
- Click "Add UOM"

**Note:** UOM names trigger calculation formulas. "area"/"meter" = area-based, "ton" = tonnage, "bogt" = bogging, "bfp" = backfill, "task" = fixed time.

---

### 4. Tasks (Tasks Page)
Create 4 tasks:

**Task 1 - Drilling:**
1. Click "New Task"
2. Fill form:
   - **Task ID:** `DRI`
   - **Task Name:** `Drilling`
   - **Task Type:** Select `Activity (Quantifiable with UOM & Rate)`
   - **UOM:** Select `area` from dropdown
   - **Rate (per hour):** `50`
   - **Task Duration (Minutes):** `240`
   - **Task Color:** Choose red (e.g., `#e74c3c`)
   - **Formula:** Leave blank (optional)
   - **Limits/Equipments:** Select `3`
3. Click "Create"

**Task 2 - Excavation:**
- **Task ID:** `EXC`
- **Task Name:** `Excavation`
- **Task Type:** `Activity (Quantifiable with UOM & Rate)`
- **UOM:** `ton`
- **Rate (per hour):** `100`
- **Task Duration (Minutes):** `360`
- **Task Color:** Blue (e.g., `#3498db`)
- **Limits/Equipments:** `4`

**Task 3 - Crushing:**
- **Task ID:** `CRU`
- **Task Name:** `Crushing`
- **Task Type:** `Activity (Quantifiable with UOM & Rate)`
- **UOM:** `ton`
- **Rate (per hour):** `75`
- **Task Duration (Minutes):** `180`
- **Task Color:** Green (e.g., `#2ecc71`)
- **Limits/Equipments:** `2`

**Task 4 - Hauling:**
- **Task ID:** `HAU`
- **Task Name:** `Hauling`
- **Task Type:** `Simple Task (Time-based only)`
- **UOM:** `task`
- **Task Duration (Minutes):** `120`
- **Task Color:** Orange (e.g., `#f39c12`)
- **Limits/Equipments:** `5`

**Note:** When you select "Activity" type, the Rate field appears. The system will show "Calculated Output" alert showing the result.

---

### 5. Sites (Sites Page)
Create 5 test sites:

**Site 1 - SITE-A:**
1. Click "New Site"
2. **Tab 1 - Basic Info:**
   - **Site ID:** `SITE-A`
   - **Site Name:** `North Pit`
   - **Priority:** `1`
   - **Type:** Select `mining`
   - **Location:** `North Zone`
   - **Active:** ✅ (toggle ON)
3. **Tab 2 - Planning Data:**
   - **Total Backfill Tonnes:** `500`
   - **Total Plan Meters:** `100`
   - **Remote Tonnes:** `200`
   - **Firings:** `0`
   - **Width (m):** `3.6`
   - **Height (m):** `3.4`
   - **Current Task:** Leave blank (or select `DRI`)
   - **Time to Complete:** `0`
4. Click "Create"

**Site 2 - SITE-B:**
- **Basic Info:** ID: `SITE-B`, Name: `South Pit`, Priority: `2`, Type: `mining`, Location: `South Zone`, Active: ✅
- **Planning Data:** Backfill: `400`, Plan Meters: `80`, Remote: `150`, Firings: `0`, Width: `3.6`, Height: `3.4`

**Site 3 - SITE-C:**
- **Basic Info:** ID: `SITE-C`, Name: `East Pit`, Priority: `3`, Type: `mining`, Location: `East Zone`, Active: ✅
- **Planning Data:** Backfill: `600`, Plan Meters: `120`, Remote: `250`, Firings: `0`, Width: `3.6`, Height: `3.4`

**Site 4 - SITE-D (Inactive):**
- **Basic Info:** ID: `SITE-D`, Name: `West Pit`, Priority: `4`, Type: `mining`, Location: `West Zone`, **Active: ❌ (toggle OFF)**
- **Planning Data:** Backfill: `450`, Plan Meters: `90`, Remote: `180`, Firings: `0`, Width: `3.6`, Height: `3.4`

**Site 5 - SITE-E:**
- **Basic Info:** ID: `SITE-E`, Name: `Central Pit`, Priority: `5`, Type: `mining`, Location: `Central`, Active: ✅
- **Planning Data:** Backfill: `550`, Plan Meters: `110`, Remote: `220`, Firings: `0`, Width: `3.6`, Height: `3.4`

---

### 6. Equipment (Equipment Page)
Create 8 pieces of equipment:

**Equipment 1 - EX-01:**
1. Click "New Equipment"
2. **Tab 1 - Basic Info:**
   - **Equipment ID:** `EX-01`
   - **Name:** `Excavator-1`
   - **Type:** Select `Excavator` from dropdown
   - **Status:** `Operational`
   - **Location:** Select any site (optional)
3. **Tab 2 - Specifications:** (all optional - leave blank for quick test)
4. **Tab 3 - Maintenance:**
   - **Maintenance Interval (hours):** `500`
   - **Operating Hours:** `50`
5. **Tab 4 - Tasks:**
   - **Assigned Tasks:** Select `EXC` from dropdown
6. Click "Create"

**Equipment 2 - EX-02:**
- **Basic:** ID: `EX-02`, Name: `Excavator-2`, Type: `Excavator`, Status: `Operational`
- **Maintenance:** Interval: `500`, Operating Hours: `480`
- **Tasks:** `EXC`

**Equipment 3 - DR-01:**
- **Basic:** ID: `DR-01`, Name: `Drill-1`, Type: `Drill Rig`, Status: `Operational`
- **Maintenance:** Interval: `500`, Operating Hours: `100`
- **Tasks:** `DRI`

**Equipment 4 - DR-02 (DUE SOON):**
- **Basic:** ID: `DR-02`, Name: `Drill-2`, Type: `Drill Rig`, Status: `Operational`
- **Maintenance:** Interval: `500`, **Operating Hours: `450`** (90% used - will show DUE SOON)
- **Tasks:** `DRI`

**Equipment 5 - CR-01:**
- **Basic:** ID: `CR-01`, Name: `Crusher-1`, Type: `Crusher`, Status: `Operational`
- **Maintenance:** Interval: `500`, Operating Hours: `200`
- **Tasks:** `CRU`

**Equipment 6 - HT-01:**
- **Basic:** ID: `HT-01`, Name: `Hauler-1`, Type: `Haul Truck`, Status: `Operational`
- **Maintenance:** Interval: `500`, Operating Hours: `150`
- **Tasks:** `HAU`

**Equipment 7 - HT-02:**
- **Basic:** ID: `HT-02`, Name: `Hauler-2`, Type: `Haul Truck`, Status: `Operational`
- **Maintenance:** Interval: `500`, Operating Hours: `300`
- **Tasks:** `HAU`

**Equipment 8 - EX-03 (OVERDUE):**
- **Basic:** ID: `EX-03`, Name: `Excavator-3`, Type: `Excavator`, **Status: `Maintenance`**
- **Maintenance:** Interval: `500`, **Operating Hours: `520`** (104% used - OVERDUE)
- **Tasks:** `EXC`

**Note:** DR-02 (450/500) will show "DUE SOON" badge. EX-03 (520/500) will show "OVERDUE" badge.

---

## ✅ Testing Checklist

### Test 1: Basic Schedule Generation
1. Go to **Schedule** page
2. Select **24 Hours**
3. Click **"Generate Schedule"**

**✅ Expected:**
- Grid shows with colored cells
- SITE-A tasks appear first (Priority 1)
- SITE-D (inactive) grayed out, no tasks
- No equipment double-booking
- Tasks use their assigned colors
- Success notification appears

---

### Test 2: Verify Task Durations
Check the schedule grid:

**✅ Expected:**
- DRI (240 min) = **4 cells** (4 hours)
- EXC (360 min) = **6 cells** (6 hours)  
- CRU (180 min) = **3 cells** (3 hours)
- HAU (120 min) = **2 cells** (2 hours)

Count colored cells per task to verify.

---

### Test 3: Priority Order
Look at which sites get scheduled first:

**✅ Expected:**
- SITE-A (P:1) fills hours 1-X first
- SITE-B (P:2) gets next available hours
- SITE-C (P:3) after that
- SITE-D (P:4) = NO TASKS (inactive)
- SITE-E (P:5) gets remaining hours

---

### Test 4: Site Sorting
1. Click **"SITE"** column header

**✅ Expected:**
- First click: Sort A→Z (SITE-A, B, C, D, E)
- Second click: Sort Z→A (SITE-E, D, C, B, A)
- Third click: Reset to priority order
- Arrow indicator changes (▲ ▼ ⬍)

---

### Test 5: Site Toggle
1. Click site name link (e.g., **SITE-B**)
2. Confirm toggle

**✅ Expected:**
- SITE-B row grays out
- All tasks disappear from SITE-B
- Equipment freed up for other sites
- Schedule regenerates
- Click again to reactivate

---

### Test 6: Add Delay
1. Click any **empty white cell**
2. Delay modal opens
3. Select:
   - Category: **Operational**
   - Code: **Equipment Breakdown**
   - Duration: **2 hours**
   - Comment: "Testing delay"
4. Click **"Add Delay"**

**✅ Expected:**
- Badge shows "1 Delays Applied"
- Success notification
- Cell doesn't change yet

5. Click **"Generate Schedule"** again

**✅ Expected:**
- Delayed cell turns **RED**
- Shows **⚠ warning icon**
- No task in that cell
- Tasks shift around the delay

---

### Test 7: Remove Delay
1. Click the **RED delayed cell**
2. Confirm removal

**✅ Expected:**
- Badge decreases count
- Success notification

3. Regenerate schedule

**✅ Expected:**
- Red cell becomes normal
- Tasks can fill that slot again

---

### Test 8: 48-Hour Schedule
1. Select **48 Hours** radio button
2. Generate schedule

**✅ Expected:**
- Grid extends to 48 columns (1-48)
- Horizontal scroll enabled
- More tasks scheduled
- All same logic applies

---

### Test 9: Equipment Schedule
1. Go to **Equipment** page
2. Click **"Usage Schedule"** tab

**✅ Expected:**
- Grid with 24 hour columns
- **Green cells** = Equipment in use (with task ID)
- **Blue cells** = Available for maintenance (wrench icon)
- **Gray cells** = Not operational
- **Red vertical line** = Current time indicator
- DR-02 shows **"DUE SOON"** badge (450/500 hours)
- EX-03 shows **"OVERDUE"** badge (520/500 hours)

---

### Test 10: Log Maintenance
1. On Equipment page, click wrench icon for **DR-02**
2. Fill form:
   - Type: Scheduled
   - Description: "Regular service"
   - Date: Today
   - Cost: 1500
   - Duration: 4 hours
   - Performed By: "Tech Team"
3. Save

**✅ Expected:**
- Success notification
- Operating hours reset to 0
- Status changes to "GOOD" (green)
- Next maintenance recalculated

---

## 🐛 Common Issues

### No Schedule Generated?
- Check: At least 1 active site exists
- Check: Sites have tasks assigned
- Check: Tasks exist in database
- Check: Equipment exists for task types
- Check: Constants (WIDTH, HEIGHT, DENSITY) exist

### Equipment Conflicts?
- Same equipment in 2 places = **BUG**
- Should only appear once per hour

### Wrong Durations?
- Check task duration in minutes
- 240 min = 4 hours = 4 cells

### Time Indicator Wrong?
- Refresh page
- Check system time is correct
- Indicator should align with current hour

---

## 🎯 Success Criteria

Your scheduler works if:

✅ Sites scheduled by priority  
✅ Tasks span correct cell count  
✅ No equipment double-booking  
✅ Equipment assigned to correct tasks  
✅ Delays block slots properly  
✅ Site toggle works  
✅ Time indicator shows current time  
✅ Grid scrolls horizontally  
✅ No console errors  
✅ Maintenance tracking works  

---

## 📊 Quick Visual Check

After generating schedule, the grid should look like:

```
P | SITE    | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | ...
1 | SITE-A  |DR |DR |DR |DR |EXC|EXC|EXC|EXC| ...
2 | SITE-B  |   |   |   |   |EXC|EXC|EXC|EXC| ...
3 | SITE-C  |   |   |   |   |   |   |   |DRI| ...
4 | SITE-D  | (inactive - no tasks - grayed out) |
5 | SITE-E  |   |   |   |   |   |   |   |   | ...
```

Colors:
- 🟥 DRI = Red
- 🟦 EXC = Blue  
- 🟩 CRU = Green
- 🟧 HAU = Orange
- ⬜ Empty = White
- 🟥 Delay = Red with ⚠

---

## 🚀 Next Steps

After all tests pass:

1. **Test with real data** - Import actual mine data
2. **Train users** - Show them the system
3. **Deploy** - Move to production
4. **Monitor** - Track performance

---

## 💡 Tips

- Use **F12** to open DevTools and check console
- Use **Ctrl+Shift+R** to hard refresh
- Check **Network** tab for API errors
- Export data regularly as backup
- Take screenshots of any bugs

---

**Test Duration:** ~10-15 minutes  
**Difficulty:** Easy  
**Prerequisites:** Backend & Frontend running

Good luck! 🎉

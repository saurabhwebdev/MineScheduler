# 🧪 MINESCHEDULER - COMPLETE TESTING GUIDE

## Purpose
This document provides step-by-step instructions to test all features of the MineScheduler application, verify the scheduling algorithm works correctly, and ensure the UI functions as expected.

---

## 📋 PRE-TESTING SETUP

### ✅ Step 1: Start the Application

Open TWO terminal windows:

**Terminal 1 - Backend:**
```powershell
cd C:\Webdev\MineScheduler
npm start
```
✅ **Expected:** Server running on `http://localhost:5000`

**Terminal 2 - Frontend:**
```powershell
cd C:\Webdev\MineScheduler\client
npm start
```
✅ **Expected:** React app opens at `http://localhost:3000`

---

### ✅ Step 2: Login to Application

1. Navigate to: `http://localhost:3000`
2. Login with credentials:
   - **Email:** `admin@minescheduler.com`
   - **Password:** `admin123`
   - *(Or use your registered credentials)*

3. ✅ **Expected:** Redirected to Dashboard

---

## 🧩 MODULE TESTING (Phase 1)

### TEST 1: Constants Module ⚙️

**Why:** Constants are CRITICAL for task duration calculations. Test this FIRST!

#### Steps:
1. Click **"Constants"** in sidebar
2. ✅ Verify page loads with title "Constants"

#### Test 1.1: Add Constants
Add the following three constants:

**Constant 1:**
- Name: `WIDTH`
- Value: `3.6`
- Unit: `meters`
- Description: `Standard stope width`
- Click **Add Constant**

**Constant 2:**
- Name: `HEIGHT`
- Value: `3.4`
- Unit: `meters`
- Description: `Standard stope height`
- Click **Add Constant**

**Constant 3:**
- Name: `DENSITY`
- Value: `2.7`
- Unit: `tonnes/m3`
- Description: `Ore density`
- Click **Add Constant**

✅ **Expected Results:**
- [ ] Success notification appears for each
- [ ] All three constants appear in the table
- [ ] Values display correctly

#### Test 1.2: Edit Constant
1. Click **Edit** icon on WIDTH
2. Change value to `3.8`
3. Click **Update**

✅ **Expected:**
- [ ] Success notification
- [ ] Table shows updated value `3.8`

#### Test 1.3: Delete Constant (Optional - then re-add)
1. Click **Delete** icon on any constant
2. Confirm deletion

✅ **Expected:**
- [ ] Confirmation dialog appears
- [ ] Constant removed from table

**Status: Constants Module** ⬜ PASS / ⬜ FAIL

---

### TEST 2: UOMs Module 📏

**Why:** UOMs define how task durations are calculated.

#### Steps:
1. Click **"UOMs"** in sidebar
2. ✅ Verify page loads

#### Test 2.1: Add UOMs
Add these UOMs one by one:

**IMPORTANT:** UOMs work by **pattern matching on the name**. The calculation formulas are built into the scheduling algorithm, NOT stored in the database.

**UOM 1:**
- Name: `area`
- Description: `Area-based calculation for drilling and charging (meters)`
- Click **Add UOM**

**UOM 2:**
- Name: `ton`
- Description: `Tonnage-based calculation (tonnes/hour)`
- Click **Add UOM**

**UOM 3:**
- Name: `bogt`
- Description: `Bogging calculation (bogger/trolley operations)`
- Click **Add UOM**

**UOM 4:**
- Name: `bfp`
- Description: `Backfill placement calculation`
- Click **Add UOM**

**UOM 5:**
- Name: `task`
- Description: `Fixed task duration (time-based)`
- Click **Add UOM**

**Note:** The system uses pattern matching:
- Names containing "area", "meter", "m/h" → Area-based calculation
- Names containing "ton", "tonne", "t/h" → Tonnage-based calculation  
- Names containing "bogt", "bogger", "trolley" → Bogging calculation
- Names containing "bfp", "backfill" → Backfill calculation
- All other names (including "task") → Fixed duration calculation

✅ **Expected Results:**
- [ ] All 5 UOMs added successfully
- [ ] Each shows in table with name and description
- [ ] No formula column (formulas are in the scheduling algorithm)
- [ ] No errors in console

**Status: UOMs Module** ⬜ PASS / ⬜ FAIL

---

### TEST 3: Tasks Module 📋

**Why:** Tasks define what work gets scheduled.

#### Steps:
1. Click **"Tasks"** in sidebar

#### Test 3.1: Add Tasks
Add these tasks:

**Task 1 - Drilling:**
- Task ID: `DR`
- Task Name: `Drilling`
- Task Type: **Activity (Quantifiable with UOM & Rate)**
- UOM: `area` (from dropdown)
- Rate (per hour): `30` (meters per hour)
- Task Duration (Minutes): `90` (1.5 hours)
- Task Color: Click color picker, choose red (e.g., `#FF6B6B`)
- Formula: (leave blank - optional)
- Limits/Equipments: `3`
- Click **Create**

✅ You'll see "Calculated Output" alert showing the calculation

**Task 2 - Charging:**
- Task ID: `CH`
- Task Name: `Charging`
- Task Type: **Activity (Quantifiable with UOM & Rate)**
- UOM: `area`
- Rate (per hour): `40` (meters per hour)
- Task Duration (Minutes): `60`
- Task Color: Orange (e.g., `#FFA500`)
- Formula: (leave blank)
- Limits/Equipments: `3`
- Click **Create**

**Task 3 - Firing:**
- Task ID: `FI`
- Task Name: `Firing`
- Task Type: **Simple Task (Time-based only)**
- UOM: `task` (from dropdown)
- Rate: (not shown for Simple Task type)
- Task Duration (Minutes): `60` (1 hour)
- Task Color: Bright red (e.g., `#FF0000`)
- Formula: (leave blank)
- Limits/Equipments: `5`
- Click **Create**

**Task 4 - Bogging:**
- Task ID: `BO`
- Task Name: `Bogging`
- Task Type: **Activity (Quantifiable with UOM & Rate)**
- UOM: `bogt`
- Rate (per hour): `45` (tonnes per hour)
- Task Duration (Minutes): `180` (3 hours)
- Task Color: Green (e.g., `#4CAF50`)
- Formula: (leave blank)
- Limits/Equipments: `4`
- Click **Create**

**Task 5 - Backfill:**
- Task ID: `BF`
- Task Name: `Backfill`
- Task Type: **Simple Task (Time-based only)**
- UOM: `bfp`
- Task Duration (Minutes): `120` (2 hours)
- Task Color: Purple (e.g., `#9C27B0`)
- Formula: (leave blank)
- Limits/Equipments: `2`
- Click **Create**

**Important Notes:**
- **Task Type** determines form fields:
  - **Activity**: Shows Rate field, calculates output automatically
  - **Simple Task**: No Rate field, just duration
- **Rate** is per hour (e.g., 30 meters/hour for drilling)
- **Task Duration** is in minutes (not hours!)
- **Limits** is the number of equipment/resources (used for hourly limits)
- **Formula** field is optional (for documentation purposes)

✅ **Expected Results:**
- [ ] All 5 tasks added successfully
- [ ] Success notifications appear for each
- [ ] Table shows:
  - [ ] SEQ column (order number)
  - [ ] COLOR column (colored square)
  - [ ] Task ID, Task Name
  - [ ] TYPE column ("Activity" or "Task" tag)
  - [ ] UOM column
  - [ ] RATE column (shows rate/hr for Activities, "-" for Tasks)
  - [ ] DURATION column (shows minutes)
  - [ ] OUTPUT column (calculated for Activities)
  - [ ] LIMITS column
  - [ ] ORDER buttons (up/down arrows)
  - [ ] ACTIONS buttons (edit/delete)
- [ ] Colors are vibrant and visible
- [ ] Activity tasks show calculated output (e.g., "45.00 area")
- [ ] Simple tasks show "-" for Rate and Output

#### Test 3.2: Edit Task
1. Click **Edit** icon on DR task
2. Change Rate to `35` (was 30)
3. Keep duration at `90` minutes
4. Click **Save**

✅ **Expected:**
- [ ] Modal opens with all fields pre-filled
- [ ] Calculated output updates automatically as you change values
- [ ] Success notification appears
- [ ] Table shows updated rate: "35/hr"
- [ ] Output recalculates: (90 ÷ 60) × 35 = 52.50 area

**Status: Tasks Module** ⬜ PASS / ⬜ FAIL

---

### TEST 4: Sites Module 🏗️

**Why:** Sites are the rows in your schedule grid.

#### Steps:
1. Click **"Sites"** in sidebar

#### Test 4.1: Add Sites
Add these test sites:

**Site 1:**
- Site ID: `G7-001`
- Site Name: `G7 Panel 001`
- Priority: `1`
- Active: ✅ (checked)
- Total Plan Meters: `100`
- Total Backfill Tonnes: `500`
- Remote Tonnes: `200`
- Width: `3.6`
- Height: `3.4`
- Current Task: `DR` (from dropdown)
- Firings: `0`
- Time to Complete: `0`
- Click **Add Site**

**Site 2:**
- Site ID: `G7-002`
- Site Name: `G7 Panel 002`
- Priority: `2`
- Active: ✅
- Total Plan Meters: `80`
- Total Backfill Tonnes: `400`
- Remote Tonnes: `150`
- Width: `3.6`
- Height: `3.4`
- Current Task: (leave blank)
- Firings: `0`
- Time to Complete: `0`
- Click **Add Site**

**Site 3:**
- Site ID: `G8-001`
- Site Name: `G8 Panel 001`
- Priority: `3`
- Active: ✅
- Total Plan Meters: `120`
- Total Backfill Tonnes: `600`
- Remote Tonnes: `250`
- Width: `3.6`
- Height: `3.4`
- Current Task: `CH`
- Firings: `1`
- Time to Complete: `0`
- Click **Add Site**

**Site 4:**
- Site ID: `G8-002`
- Site Name: `G8 Panel 002`
- Priority: `4`
- Active: ⬜ (unchecked - INACTIVE)
- Total Plan Meters: `90`
- Total Backfill Tonnes: `450`
- Remote Tonnes: `180`
- Width: `3.6`
- Height: `3.4`
- Current Task: (leave blank)
- Firings: `0`
- Time to Complete: `0`
- Click **Add Site**

**Site 5:**
- Site ID: `G7-003`
- Site Name: `G7 Panel 003`
- Priority: `5`
- Active: ✅
- Total Plan Meters: `110`
- Total Backfill Tonnes: `550`
- Remote Tonnes: `220`
- Width: `3.6`
- Height: `3.4`
- Current Task: (leave blank)
- Firings: `0`
- Time to Complete: `0`
- Click **Add Site**

✅ **Expected Results:**
- [ ] All 5 sites added successfully
- [ ] Active status shows correctly (green/red)
- [ ] Priority numbers display
- [ ] All fields saved

#### Test 4.2: Edit Site
1. Click **Edit** on G7-001
2. Change Priority to `10`
3. Click **Update**

✅ **Expected:**
- [ ] Success notification
- [ ] Priority updated in table

**Status: Sites Module** ⬜ PASS / ⬜ FAIL

---

### TEST 5: Delays Module ⚠️

**Why:** Delays are needed for the delay modal to work.

#### Steps:
1. Click **"Delays"** in sidebar

#### Test 5.1: Add Delay Categories and Codes

**Delay 1:**
- Category: `Operational`
- Code: `OP-BREAKDOWN`
- Type: `Standard`
- Duration: `2` hours
- Description: `Equipment breakdown`
- Active: ✅
- Click **Add Delay**

**Delay 2:**
- Category: `Operational`
- Code: `OP-MAINTAIN`
- Type: `Standard`
- Duration: `3` hours
- Description: `Scheduled maintenance`
- Active: ✅
- Click **Add Delay**

**Delay 3:**
- Category: `Safety`
- Code: `SAF-INCIDENT`
- Type: `Standard`
- Duration: `4` hours
- Description: `Safety incident investigation`
- Active: ✅
- Click **Add Delay**

**Delay 4:**
- Category: `Safety`
- Code: `SAF-INSPECTION`
- Type: `Standard`
- Duration: `1` hour
- Description: `Safety inspection`
- Active: ✅
- Click **Add Delay**

**Delay 5:**
- Category: `Production`
- Code: `PROD-DELAY`
- Type: `Custom`
- Duration: (leave blank)
- Description: `General production delay`
- Active: ✅
- Click **Add Delay**

✅ **Expected Results:**
- [ ] All 5 delays added
- [ ] Categories group correctly
- [ ] Standard delays show duration
- [ ] Custom delay has no duration

**Status: Delays Module** ⬜ PASS / ⬜ FAIL

---

### TEST 6: Equipment Module 🚜

**Why:** For future equipment maintenance grid.

#### Steps:
1. Click **"Equipment"** in sidebar

#### Test 6.1: Add Equipment

**Equipment 1:**
- Name: `Jumbo-01`
- Type: `Drill Rig`
- Model: `Atlas Copco`
- Serial: `JB001`
- Status: `Active`
- Assigned Tasks: Select `DR` and `CH`
- Hours Used: `0`
- Maintenance Hours: `500`
- Click **Add Equipment**

**Equipment 2:**
- Name: `LHD-01`
- Type: `Loader`
- Model: `Sandvik`
- Serial: `LD001`
- Status: `Active`
- Assigned Tasks: Select `BO`
- Hours Used: `0`
- Maintenance Hours: `300`
- Click **Add Equipment**

✅ **Expected Results:**
- [ ] Both equipment added
- [ ] Assigned tasks display
- [ ] Status shows active

**Status: Equipment Module** ⬜ PASS / ⬜ FAIL

---

## 📊 SCHEDULE GENERATION TESTING (Phase 2)

### TEST 7: Basic Schedule Generation 🎯

**This is the CORE functionality test!**

#### Test 7.1: Generate 24-Hour Schedule

1. Click **"Schedule"** in sidebar
2. ✅ Verify page loads with controls
3. Ensure **24 Hours** is selected
4. Click **"Generate Schedule"** button

✅ **Expected Results:**
- [ ] Loading spinner appears
- [ ] Grid appears after 1-3 seconds
- [ ] Grid shows:
  - [ ] Column headers: P, Site, 1, 2, 3... 24
  - [ ] Row for each active site (4 active sites)
  - [ ] Inactive site (G8-002) at bottom, grayed out
  - [ ] Priority numbers in P column
  - [ ] Site names as clickable links
  - [ ] Colored cells with task IDs (DR, CH, FI, BO, BF)
  - [ ] Some cells empty (white)
- [ ] Success notification appears
- [ ] No errors in browser console (F12)

#### Test 7.2: Verify Task Allocation
Look at the grid and verify:

- [ ] **G7-001** (Priority 1): Should have DR task first (current task)
- [ ] **G7-002** (Priority 2): Should have tasks starting from first in cycle
- [ ] **G8-001** (Priority 3): Should have CH task first (current task with firings=1)
- [ ] **G7-003** (Priority 5): Should have tasks allocated
- [ ] **G8-002** (Inactive): Should be grayed out with NO tasks
- [ ] Tasks span multiple hours (not just 1 hour per task)
- [ ] Different task colors visible

**Status: Basic Generation** ⬜ PASS / ⬜ FAIL

---

### TEST 8: Site Sorting & Grouping 🔄

#### Test 8.1: Sort by Site Name

1. Click on **"Site"** column header (once)

✅ **Expected:**
- [ ] Sort indicator shows ▲ (ascending)
- [ ] Sites reorder:
  - [ ] G8 sites FIRST (G8-001, G8-002)
  - [ ] Then G7 sites (G7-001, G7-002, G7-003)
  - [ ] Within groups: alphabetical/numerical order
- [ ] Active sites before inactive

2. Click **"Site"** column header again (second time)

✅ **Expected:**
- [ ] Sort indicator shows ▼ (descending)
- [ ] Sites reorder:
  - [ ] G7 sites FIRST
  - [ ] Then G8 sites
  - [ ] Reverse order within groups

3. Click **"Site"** column header again (third time)

✅ **Expected:**
- [ ] Sort indicator shows ⬍ (none)
- [ ] Sites return to PRIORITY order
- [ ] G7-001 (P:1), G7-002 (P:2), G8-001 (P:3), etc.

**Status: Site Sorting** ⬜ PASS / ⬜ FAIL

---

### TEST 9: Toggle Site Active Status 🔘

#### Test 9.1: Deactivate a Site

1. Click on site name link **"G7-001"**
2. ✅ Confirmation dialog appears: "Toggle active status for G7-001?"
3. Click **OK**

✅ **Expected:**
- [ ] Success notification: "Site G7-001 status toggled"
- [ ] Schedule regenerates automatically
- [ ] G7-001 row becomes:
  - [ ] Grayed out
  - [ ] Site name has strikethrough
  - [ ] All task cells empty (no tasks allocated)
  - [ ] Moved to bottom with inactive sites

#### Test 9.2: Reactivate the Site

1. Click on **"G7-001"** link again (now grayed)
2. Confirm dialog
3. Click **OK**

✅ **Expected:**
- [ ] Site becomes active again
- [ ] Moves back to top section
- [ ] Tasks allocated again
- [ ] Normal styling restored

**Status: Toggle Status** ⬜ PASS / ⬜ FAIL

---

### TEST 10: Delay Modal & Delay Management ⚠️

#### Test 10.1: Open Delay Modal

1. Click on any **empty cell** (white cell)
2. ✅ Delay Modal should open

✅ **Expected Modal:**
- [ ] Title: "Add Delay" with warning icon
- [ ] Shows Site ID and Hour number
- [ ] Form fields:
  - [ ] Delay Category dropdown
  - [ ] Delay Code dropdown (disabled initially)
  - [ ] Duration input (default: 1)
  - [ ] Comments textarea (optional)
- [ ] Buttons: "Add Delay" (red) and "Cancel"

#### Test 10.2: Fill Delay Form

1. Click **Delay Category** dropdown
2. ✅ Verify categories appear: Operational, Safety, Production
3. Select **"Operational"**
4. ✅ Delay Code dropdown becomes enabled
5. Click **Delay Code** dropdown
6. ✅ Verify only Operational codes appear: OP-BREAKDOWN, OP-MAINTAIN
7. Select **"OP-BREAKDOWN"**
8. ✅ Duration auto-fills to **2** (from standard delay duration)
9. Type in Comments: `Testing delay functionality`
10. Click **"Add Delay"** button

✅ **Expected Results:**
- [ ] Modal closes
- [ ] Success notification: "Delay Added"
- [ ] Badge appears: "1 Delays Applied"
- [ ] Cell does NOT turn red yet (need to regenerate)

#### Test 10.3: Add Multiple Delays

1. Click another cell (different site or hour)
2. Add another delay (any category/code)
3. Click on a third cell
4. Add another delay

✅ **Expected:**
- [ ] Badge shows "3 Delays Applied"
- [ ] Each notification appears

#### Test 10.4: Regenerate with Delays

1. Click **"Generate Schedule"** button

✅ **Expected Results:**
- [ ] Loading spinner
- [ ] Grid regenerates
- [ ] All 3 delayed cells now show:
  - [ ] **RED background**
  - [ ] **⚠ Warning icon** in center
  - [ ] NO task allocated in those cells
- [ ] Tasks shift around delays
- [ ] Schedule adjusts to avoid delayed slots

**Status: Delay Modal** ⬜ PASS / ⬜ FAIL

---

### TEST 11: Remove Delays 🗑️

#### Test 11.1: Remove Single Delay

1. Click on a **RED delayed cell** (with ⚠ icon)
2. ✅ Confirm dialog: "Remove delay from [Site] at hour [X]?"
3. Click **OK**

✅ **Expected:**
- [ ] Success notification: "Delay Removed"
- [ ] Badge count decreases (e.g., "2 Delays Applied")
- [ ] Red cell does NOT disappear yet

#### Test 11.2: Regenerate After Removal

1. Click **"Generate Schedule"**

✅ **Expected:**
- [ ] Removed delay cell is no longer red
- [ ] Tasks can be allocated there again
- [ ] Other delays still show red
- [ ] Schedule recalculates

#### Test 11.3: Remove All Delays

1. Remove remaining delays one by one
2. Regenerate schedule

✅ **Expected:**
- [ ] Badge disappears (0 delays)
- [ ] No red cells
- [ ] Full schedule without restrictions

**Status: Remove Delays** ⬜ PASS / ⬜ FAIL

---

### TEST 12: 48-Hour Schedule 📅

#### Test 12.1: Generate 48-Hour Schedule

1. Select **"48 Hours"** radio button
2. Click **"Generate Schedule"**

✅ **Expected Results:**
- [ ] Grid extends to 48 columns (1-48)
- [ ] Horizontal scrolling enabled
- [ ] More tasks allocated over longer time
- [ ] All sites still present
- [ ] Same logic applies (delays, sorting, etc.)

#### Test 12.2: Add Delay in 48-Hour Grid

1. Scroll to hour 30-40
2. Add a delay to any cell
3. Regenerate

✅ **Expected:**
- [ ] Works same as 24-hour
- [ ] Red cell appears at correct position
- [ ] Scrolling still works

**Status: 48-Hour Schedule** ⬜ PASS / ⬜ FAIL

---

### TEST 13: Session Persistence 💾

#### Test 13.1: Test Session Storage

1. Add 2-3 delays to schedule
2. Note the delay count badge
3. **Refresh the page** (F5 or Ctrl+R)
4. Wait for page to reload

✅ **Expected:**
- [ ] Login session persists
- [ ] Delay count badge shows same number
- [ ] Delays still tracked in sessionStorage
5. Click **"Generate Schedule"**

✅ **Expected:**
- [ ] Red delayed cells reappear
- [ ] Delays applied to schedule

#### Test 13.2: Clear Session

1. Open browser DevTools (F12)
2. Go to **Application** tab → **Session Storage**
3. Delete `delayedSlots` entry
4. Refresh page

✅ **Expected:**
- [ ] Badge disappears
- [ ] No delays persisted
- [ ] Clean state

**Status: Session Persistence** ⬜ PASS / ⬜ FAIL

---

## 🧮 ALGORITHM LOGIC TESTING (Phase 3)

### TEST 14: Task Cycling & Firings 🔄

#### Test 14.1: Verify Task Progression

1. Go to Sites module
2. Note: **G7-001** has `currentTask: DR, firings: 0`
3. Go to Schedule, generate schedule
4. Look at G7-001 row

✅ **Expected:**
- [ ] First task is **DR** (current task)
- [ ] DR spans multiple hours (based on duration)
- [ ] After DR, next task should be **CH**
- [ ] Tasks follow cycle: DR → CH → FI → BO → BF → (repeat)

#### Test 14.2: Check Firings Increment

1. After first schedule generation
2. Go back to Sites module
3. View G7-001 details

✅ **Expected:**
- [ ] `firings` should increment (may be 1, 2, or more)
- [ ] `currentTask` should update to next task in cycle

**Note:** This requires backend to save state after scheduling.

**Status: Task Cycling** ⬜ PASS / ⬜ FAIL

---

### TEST 15: Duration Calculations ⏱️

#### Test 15.1: Verify Area-Based Duration (DR task)

**Formula:** `(width * height * duration) / (WIDTH * HEIGHT)`

**For G7-001:**
- width: 3.6
- height: 3.4
- DR duration rate: 1.5
- WIDTH constant: 3.6
- HEIGHT constant: 3.4

**Calculation:**
```
Duration = (3.6 * 3.4 * 1.5) / (3.6 * 3.4)
         = 18.36 / 12.24
         = 1.5 hours
```

✅ **Expected:**
- [ ] DR task spans approximately **2 cells** (rounded up)
- [ ] Check by counting colored DR cells in G7-001 row

#### Test 15.2: Verify BOGT Duration (BO task)

**Formula:** `(totalPlanMeters * width * height * DENSITY) / rate`

**For G7-001:**
- totalPlanMeters: 100
- width: 3.6
- height: 3.4
- DENSITY: 2.7
- BO rate: 45

**Calculation:**
```
Duration = (100 * 3.6 * 3.4 * 2.7) / 45
         = 3304.8 / 45
         = 73.44 hours
```

✅ **Expected:**
- [ ] BO task spans approximately **73-74 cells**
- [ ] May exceed 24-hour grid (continues in next cycle)
- [ ] In 48-hour grid, takes majority of schedule

#### Test 15.3: Verify Fixed Task Duration (FI task)

**Formula:** `duration`

**For FI task:**
- Duration rate: 1.0

✅ **Expected:**
- [ ] FI task spans exactly **1 cell** (1 hour)
- [ ] Same for all sites

**Status: Duration Calculations** ⬜ PASS / ⬜ FAIL

---

### TEST 16: Hourly Task Limits 🚫

#### Test 16.1: Verify DR Task Limit

**DR task limit:** 3 (max 3 sites can run DR in same hour)

1. Generate schedule
2. Look at any hour column (e.g., hour 5)
3. Count how many sites have **DR** task in that hour

✅ **Expected:**
- [ ] No more than **3 sites** have DR in any single hour
- [ ] Check multiple hours to verify
- [ ] If more than 3 sites need DR, some are delayed to next available hour

#### Test 16.2: Check Other Task Limits

- CH limit: 3
- FI limit: 5
- BO limit: 4
- BF limit: 2

✅ **Expected:**
- [ ] Each task respects its hourly limit
- [ ] No violations across all hours

**Status: Hourly Limits** ⬜ PASS / ⬜ FAIL

---

### TEST 17: Priority Ordering 🏆

#### Test 17.1: Verify Priority Scheduling

Sites are scheduled in priority order:
1. G7-001 (P:1)
2. G7-002 (P:2)
3. G8-001 (P:3)
4. G8-002 (P:4 - inactive)
5. G7-003 (P:5)

✅ **Expected:**
- [ ] G7-001 gets scheduled first (fills hours from left)
- [ ] G7-002 gets next available slots
- [ ] Lower priority sites get scheduled last
- [ ] If hours run out, lower priority sites may miss tasks

#### Test 17.2: Change Priority and Test

1. Edit **G7-003** → Change priority to **1**
2. Edit **G7-001** → Change priority to **10**
3. Generate schedule

✅ **Expected:**
- [ ] G7-003 now scheduled first
- [ ] G7-001 scheduled last (may have fewer tasks)

**Status: Priority Ordering** ⬜ PASS / ⬜ FAIL

---

### TEST 18: Delay Blocking Logic 🚧

#### Test 18.1: Verify Delays Block Tasks

1. Add delay to **G7-001** at **Hour 5**
2. Regenerate schedule

✅ **Expected:**
- [ ] Hour 5 for G7-001 is RED
- [ ] NO task allocated at that slot
- [ ] If a task was running through hour 5:
  - [ ] Task ends before hour 5, OR
  - [ ] Task starts after hour 5
- [ ] Schedule adjusts around the blocked slot

#### Test 18.2: Multiple Delays on Same Site

1. Add delays to G7-001 at hours: 5, 10, 15
2. Regenerate

✅ **Expected:**
- [ ] All three hours show red
- [ ] Tasks scheduled between delays
- [ ] No task spans across a delay

**Status: Delay Blocking** ⬜ PASS / ⬜ FAIL

---

## 🎨 UI/UX TESTING (Phase 4)

### TEST 19: Modern Flat Design ✨

#### Test 19.1: Visual Inspection

Look at the Schedule page and verify:

- [ ] **Flat Design:**
  - [ ] Border radius: 6px (small rounded corners)
  - [ ] Borders instead of shadows (1px solid #e8e8e8)
  - [ ] Clean, minimal look

- [ ] **Grid Styling:**
  - [ ] Table borders are light gray (#e8e8e8)
  - [ ] Header row has subtle background (#f9f9f9)
  - [ ] No heavy shadows

- [ ] **Controls:**
  - [ ] Controls card has border, not shadow
  - [ ] Buttons styled consistently
  - [ ] Delay badge flat design

- [ ] **Colors:**
  - [ ] Task colors vibrant but not overwhelming
  - [ ] Red delays stand out
  - [ ] Green brand color (#3cca70) used sparingly

#### Test 19.2: Hover States

1. Hover over **site name link**

✅ **Expected:**
- [ ] Background: light green (#f6ffed)
- [ ] Smooth transition (0.15s)
- [ ] No text decoration change (stays underline)

2. Hover over **schedule cell**

✅ **Expected:**
- [ ] Cell scales slightly (1.03x)
- [ ] Green border outline (2px #3cca70)
- [ ] Smooth transition
- [ ] No large shadow

3. Hover over **Site column header** (sortable)

✅ **Expected:**
- [ ] Background lightens to #f5f5f5
- [ ] Cursor changes to pointer
- [ ] Transition smooth

**Status: Modern Design** ⬜ PASS / ⬜ FAIL

---

### TEST 20: Responsive Design 📱

#### Test 20.1: Tablet View (768px - 1200px)

1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select **iPad** or set width to **800px**

✅ **Expected:**
- [ ] Grid remains usable
- [ ] Horizontal scroll works smoothly
- [ ] Controls stack properly
- [ ] Font sizes readable
- [ ] Buttons not too small

#### Test 20.2: Mobile View (< 768px)

1. Set device width to **375px** (iPhone)

✅ **Expected:**
- [ ] Controls stack vertically
- [ ] Generate button full width
- [ ] Grid scrolls horizontally
- [ ] Sidebar becomes mobile menu
- [ ] Everything still functional

**Status: Responsive Design** ⬜ PASS / ⬜ FAIL

---

### TEST 21: Accessibility ♿

#### Test 21.1: Keyboard Navigation

1. Use **Tab** key to navigate through Schedule page

✅ **Expected:**
- [ ] Can tab to "Generate Schedule" button
- [ ] Can tab to radio buttons (24/48 hours)
- [ ] Can tab to site links
- [ ] Focus visible on all elements

2. Press **Enter** on focused elements

✅ **Expected:**
- [ ] Button activates
- [ ] Links open
- [ ] Radio buttons toggle

#### Test 21.2: Screen Reader (Optional)

If you have screen reader software:

- [ ] Page title announced
- [ ] Buttons have clear labels
- [ ] Table structure logical

**Status: Accessibility** ⬜ PASS / ⬜ FAIL

---

## 🐛 ERROR HANDLING TESTING

### TEST 22: Edge Cases & Errors 🚨

#### Test 22.1: Generate Schedule with No Data

1. Go to Sites module
2. Delete all sites (or deactivate all)
3. Go to Schedule page
4. Click "Generate Schedule"

✅ **Expected:**
- [ ] No crash
- [ ] Empty grid OR message: "No active sites"
- [ ] Graceful error handling

#### Test 22.2: Missing Constants

1. Go to Constants
2. Delete WIDTH constant
3. Go to Schedule, generate

✅ **Expected:**
- [ ] Error notification OR
- [ ] Backend error message about missing constants
- [ ] No schedule generated

#### Test 22.3: Invalid Site Data

1. Edit a site
2. Set totalPlanMeters to **0**
3. Generate schedule

✅ **Expected:**
- [ ] Site may not get certain tasks (BO, BF)
- [ ] No crash
- [ ] Other sites unaffected

#### Test 22.4: Network Failure Simulation

1. Stop backend server (close Terminal 1)
2. Try to generate schedule

✅ **Expected:**
- [ ] Loading spinner appears
- [ ] After timeout: "Network Error" notification
- [ ] No schedule generated
- [ ] No crash

3. Restart backend
4. Generate schedule again

✅ **Expected:**
- [ ] Works normally

**Status: Error Handling** ⬜ PASS / ⬜ FAIL

---

## 📊 PERFORMANCE TESTING

### TEST 23: Performance & Load ⚡

#### Test 23.1: Large Dataset

1. Add **20 more sites** (use quick add or duplicate)
2. Generate 48-hour schedule

✅ **Expected:**
- [ ] Completes within **10 seconds**
- [ ] Grid renders smoothly
- [ ] No browser freeze
- [ ] Scrolling remains smooth

#### Test 23.2: Multiple Delays

1. Add **50 delays** across different sites/hours
2. Generate schedule

✅ **Expected:**
- [ ] Schedule calculates correctly
- [ ] All delays respected
- [ ] Completes within reasonable time

#### Test 23.3: Browser Console

1. Open DevTools (F12) → Console tab
2. Perform various actions (generate, sort, add delays)

✅ **Expected:**
- [ ] No error messages (red)
- [ ] No warning messages (yellow) that indicate problems
- [ ] Clean console

**Status: Performance** ⬜ PASS / ⬜ FAIL

---

## 📝 FINAL TESTING CHECKLIST

### Module Completeness
- [ ] Constants: Add, Edit, Delete ✓
- [ ] UOMs: Add, Edit, Delete ✓
- [ ] Tasks: Add, Edit, Delete ✓
- [ ] Sites: Add, Edit, Delete, Toggle Status ✓
- [ ] Delays: Add, Edit, Delete ✓
- [ ] Equipment: Add, Edit, Delete ✓

### Schedule Functionality
- [ ] Generate 24-hour schedule ✓
- [ ] Generate 48-hour schedule ✓
- [ ] Sort sites (G7/G8 grouping) ✓
- [ ] Toggle site active status ✓
- [ ] Add delays via modal ✓
- [ ] Remove delays ✓
- [ ] Regenerate with delays ✓
- [ ] Session persistence ✓

### Algorithm Verification
- [ ] Task cycling works ✓
- [ ] Duration calculations correct ✓
- [ ] Hourly limits respected ✓
- [ ] Priority ordering works ✓
- [ ] Delays block slots correctly ✓

### UI/UX Quality
- [ ] Modern flat design ✓
- [ ] Smooth hover states ✓
- [ ] Responsive on tablet ✓
- [ ] Responsive on mobile ✓
- [ ] Keyboard navigation ✓
- [ ] No console errors ✓

### Error Handling
- [ ] No data scenarios handled ✓
- [ ] Missing constants handled ✓
- [ ] Network errors handled ✓
- [ ] Invalid data handled ✓

---

## 🎉 TEST RESULTS SUMMARY

**Date Tested:** _______________  
**Tested By:** _______________

### Overall Status

| Category | Status | Notes |
|----------|--------|-------|
| Module Tests (1-6) | ⬜ PASS / ⬜ FAIL | |
| Schedule Generation (7-13) | ⬜ PASS / ⬜ FAIL | |
| Algorithm Logic (14-18) | ⬜ PASS / ⬜ FAIL | |
| UI/UX Testing (19-21) | ⬜ PASS / ⬜ FAIL | |
| Error Handling (22) | ⬜ PASS / ⬜ FAIL | |
| Performance (23) | ⬜ PASS / ⬜ FAIL | |

### Issues Found

List any bugs or issues discovered:

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Recommendations

List any improvements or enhancements needed:

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

## 🚀 WHAT'S NEXT?

### If All Tests Pass ✅

The application is **PRODUCTION READY** for:
- Live deployment
- End-user training
- Demo presentations
- Further feature development

### Recommended Next Features

1. **Snapshot System** - Save/restore schedule versions
2. **Equipment Maintenance Grid** - Track equipment usage
3. **Charts & Analytics** - Visual reporting
4. **Shift Integration** - Shift-based scheduling
5. **Export Features** - Excel/PDF export

---

## 📞 SUPPORT

If you encounter issues during testing:

1. Check browser console (F12) for errors
2. Check backend terminal for server errors
3. Verify database connection (MongoDB running)
4. Restart servers if needed
5. Clear browser cache and sessionStorage
6. Document the issue with screenshots

---

**END OF TESTING GUIDE**

Good luck with your testing! 🎯

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

```
- Drill Rig
- Excavator
- Haul Truck
- Crusher
```

---

### 3. Tasks (Tasks Page)
Create 4 tasks:

| Task ID | Name | Duration (min) | Rate/hr | UOM | Equipment Type |
|---------|------|----------------|---------|-----|----------------|
| DRI | Drilling | 240 | 50 | meters | Drill Rig |
| EXC | Excavation | 360 | 100 | tons | Excavator |
| CRU | Crushing | 180 | 75 | tons | Crusher |
| HAU | Hauling | 120 | 30 | tons | Haul Truck |

**How to add:**
- Click "New Task"
- Fill all fields
- Task Color: Choose distinct colors (Red, Blue, Green, Orange)
- Click "Create"

---

### 4. Sites (Sites Page)
Create 5 test sites:

| Site ID | Site Name | Priority | Active | Location | Tasks Needed |
|---------|-----------|----------|--------|----------|--------------|
| SITE-A | North Pit | 1 | ✅ | North Zone | DRI, EXC, HAU |
| SITE-B | South Pit | 2 | ✅ | South Zone | EXC, CRU |
| SITE-C | East Pit | 3 | ✅ | East Zone | DRI, HAU |
| SITE-D | West Pit | 4 | ❌ | West Zone | DRI, EXC |
| SITE-E | Central Pit | 5 | ✅ | Central | HAU, CRU |

**How to add:**
- Click "New Site"
- Fill Site ID, Name, Priority
- Check/uncheck Active
- Enter Location
- Save

**Then assign tasks:**
- Click on site name
- Click "Assign Tasks"
- Select tasks from dropdown
- Save

---

### 5. Equipment (Equipment Page)
Create 8 pieces of equipment:

| ID | Name | Type | Status | Tasks | Maint Hours | Current Hours |
|----|------|------|--------|-------|-------------|---------------|
| EX-01 | Excavator-1 | Excavator | operational | EXC | 500 | 50 |
| EX-02 | Excavator-2 | Excavator | operational | EXC | 500 | 480 |
| DR-01 | Drill-1 | Drill Rig | operational | DRI | 500 | 100 |
| DR-02 | Drill-2 | Drill Rig | operational | DRI | 500 | 450 |
| CR-01 | Crusher-1 | Crusher | operational | CRU | 500 | 200 |
| HT-01 | Hauler-1 | Haul Truck | operational | HAU | 500 | 150 |
| HT-02 | Hauler-2 | Haul Truck | operational | HAU | 500 | 300 |
| EX-03 | Excavator-3 | Excavator | maintenance | EXC | 500 | 520 |

**Note:** DR-02 and EX-03 are near/past maintenance (will show warnings)

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

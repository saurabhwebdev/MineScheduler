# UOM System - How It Works

## Overview
The UOM (Unit of Measure) system in MineScheduler uses **pattern matching** on UOM names to determine which calculation formula to apply. **Formulas are NOT stored in the database** - they are hardcoded in the scheduling algorithm.

---

## Database Schema

### UOM Model (`models/UOM.js`)
```javascript
{
  name: String,          // e.g., "area", "ton", "bogt", "bfp", "task"
  description: String,   // Description of the UOM
  createdBy: ObjectId,   // User who created it
  createdAt: Date,
  updatedAt: Date
}
```

**Note:** There is NO `formula` field. The system is designed to be flexible and extensible.

---

## How Pattern Matching Works

The scheduling algorithm (`utils/durationCalculator.js`) uses pattern matching on the UOM name to determine which formula to apply:

### 1. **Area-Based Calculation**
**Triggers when UOM name contains:**
- `"area"`
- `"meter"`
- `"m/h"`

**Formula:**
```javascript
minutes = (totalPlanMeters / rate) × 60
```

**Example UOMs:**
- `area`
- `meter`
- `area_meter`
- `drilling_area`

**Used for:** Drilling, Charging, and other area-based tasks

---

### 2. **Tonnage-Based Calculation**
**Triggers when UOM name contains:**
- `"ton"`
- `"tonne"`
- `"t/h"`

**Formula:**
```javascript
// If totalBackfillTonnes is provided:
minutes = (totalBackfillTonnes × 60) / rate

// Otherwise calculate from meters:
volume = width × height × totalPlanMeters
tonnes = volume × DENSITY
minutes = (tonnes × 60) / rate
```

**Example UOMs:**
- `ton`
- `tonne`
- `tonnage`
- `ore_ton`

**Used for:** Tonnage-based operations

---

### 3. **BOGT (Bogging) Calculation**
**Triggers when UOM name contains:**
- `"bogt"`
- `"bogger"`
- `"trolley"`

**Formula:**
```javascript
minutes = (remoteTonnes / taskDuration) × 60
```

**Example UOMs:**
- `bogt`
- `bogger`
- `trolley`
- `bogger_op`

**Used for:** Bogging/ore extraction operations

---

### 4. **BFP (Backfill Placement) Calculation**
**Triggers when UOM name contains:**
- `"bfp"`
- `"backfill"`

**Formula:**
```javascript
if (totalBackfillTonnes > 0) {
  minutes = taskDuration  // Fixed duration
} else {
  minutes = 0  // Skip if no tonnes
}
```

**Example UOMs:**
- `bfp`
- `backfill`
- `backfill_prep`

**Used for:** Backfill placement operations

---

### 5. **Task (Fixed Duration) - DEFAULT**
**Triggers for:**
- Any UOM name that doesn't match the above patterns
- Explicitly: `"task"`, `"time"`, or any other name

**Formula:**
```javascript
minutes = taskDuration  // Fixed duration in minutes
```

**Example UOMs:**
- `task`
- `time`
- `fixed`
- `hours`
- Any other custom name

**Used for:** Fixed-duration tasks (firing, inspections, etc.)

---

## Frontend Implementation

### UOM Configuration (`client/src/components/UomConfig.js`)

The UOM module provides a simple interface:

**Add/Edit UOM:**
- **Name** (required) - The UOM identifier used for pattern matching
- **Description** (optional) - Describes what the UOM is used for

**Features:**
- ✅ Create, Read, Update, Delete UOMs
- ✅ Import/Export to Excel
- ✅ Sort by name
- ✅ Audit logging

**No formula field is needed** - the name itself determines the calculation!

---

## Adding Custom UOMs

### Example 1: Area-Based UOM
```javascript
Name: "drilling_area"
Description: "Area-based calculation for drilling operations"
// System will use area-based formula because name contains "area"
```

### Example 2: Time-Based UOM
```javascript
Name: "inspection_time"
Description: "Fixed time for safety inspections"
// System will use fixed duration because name doesn't match other patterns
```

### Example 3: Tonnage UOM
```javascript
Name: "ore_tonnage"
Description: "Ore extraction based on tonnes"
// System will use tonnage formula because name contains "ton"
```

---

## Standard UOMs (Recommended)

For testing and production use, create these 5 standard UOMs:

| Name | Description | Calculation Type |
|------|-------------|-----------------|
| `area` | Area-based calculation for drilling/charging | Area-based |
| `ton` | Tonnage-based calculation | Tonnage-based |
| `bogt` | Bogging calculation | BOGT |
| `bfp` | Backfill placement | BFP |
| `task` | Fixed task duration | Fixed Duration |

These names will trigger the correct calculations in the scheduling algorithm.

---

## Task Configuration

When creating a task, you select a UOM from the dropdown:

```javascript
Task: "DR" (Drilling)
UOM: "area"  // From dropdown
Duration/Rate: 1.5  // 1.5 hours per unit
```

The scheduler will:
1. Look up the UOM name ("area")
2. Match it to area-based calculation
3. Apply the formula using the task's duration/rate

---

## Why This Design?

### Advantages:
✅ **Flexible** - Add new UOMs without changing code  
✅ **Simple Database** - No complex formula storage  
✅ **Pattern Matching** - Easy to extend with new patterns  
✅ **Backward Compatible** - Existing UOMs work automatically  
✅ **User-Friendly** - Just create UOMs by name  

### Trade-offs:
❌ **Not Fully Dynamic** - Can't create completely custom formulas via UI  
❌ **Pattern Dependent** - UOM name must match expected patterns  

---

## Complete Workflow

### 1. Create Constants
```
WIDTH = 3.6 meters
HEIGHT = 3.4 meters
DENSITY = 2.7 tonnes/m³
```

### 2. Create UOMs
```
area, ton, bogt, bfp, task
```

### 3. Create Tasks
```
DR (Drilling) → UOM: area, Rate: 1.5
BO (Bogging) → UOM: bogt, Rate: 45
```

### 4. Create Sites
```
G7-001 → totalPlanMeters: 100, width: 3.6, height: 3.4
```

### 5. Generate Schedule
The algorithm:
- Reads DR task with "area" UOM
- Matches "area" to area-based formula
- Calculates: (100 / 1.5) × 60 = 4000 minutes = 67 hours
- Allocates DR to G7-001 for 67 hours

---

## Technical Details

### Duration Calculator (`utils/durationCalculator.js`)

```javascript
function calculateTaskDuration(params) {
  const { uom, totalPlanMeters, rate, taskDuration, ... } = params;
  
  const uomLower = uom.toLowerCase().trim();
  
  if (uomLower.includes('area') || uomLower.includes('meter')) {
    // Area-based calculation
    minutes = (totalPlanMeters / rate) × 60;
  }
  else if (uomLower.includes('ton')) {
    // Tonnage-based calculation
    minutes = (tonnes × 60) / rate;
  }
  // ... other patterns
  
  return { minutes, hours: Math.ceil(minutes / 60) };
}
```

### Pattern Matching Priority
1. Check for "area/meter" → Area-based
2. Check for "ton/tonne" → Tonnage-based
3. Check for "bogt/bogger" → BOGT
4. Check for "bfp/backfill" → BFP
5. Default → Fixed Duration

---

## Summary

✅ **UOMs are simple:** Just name + description  
✅ **Formulas are built-in:** Hardcoded in algorithm  
✅ **Pattern matching:** Name determines calculation type  
✅ **Extensible:** Add new UOMs anytime  
✅ **No formula field needed:** System is smart enough!  

The UOM system is **complete and working as designed**. There's no need to add formula fields - the pattern matching approach provides the flexibility needed while keeping the interface simple.

---

**Ready to test?** Follow the TESTING_GUIDE.md with the corrected UOM instructions!

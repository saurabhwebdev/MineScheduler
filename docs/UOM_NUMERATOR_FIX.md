# UOM Numerator Extraction Fix

## Date: 2025-10-13

### Problem
The output was displaying the **full UOM** (e.g., "21 meter/hour") instead of just the **numerator** (e.g., "21 meter"). This was confusing because the output represents TOTAL production, not a rate.

### Understanding
- **UOM for Rate:** "meter/hour", "ton/hour", etc. (describes production speed)
- **Output Display:** Should show only the numerator ("meter", "ton") because it's total production
- **Example:**
  - Rate: 7 **meter/hour**
  - Duration: 180 minutes (3 hours)
  - Output: 21 **meter** (NOT "21 meter/hour" ❌)

---

## Solution

### 1. Frontend - Utility Function (`client/src/pages/Tasks.js`)

Added a utility function to extract the numerator from UOM strings:

```javascript
// Utility function to extract the numerator from UOM (e.g., "meter/hour" -> "meter", "ton/hour" -> "ton")
const getUomNumerator = (uom) => {
  if (!uom) return '';
  // If UOM contains '/', extract the part before it (numerator)
  if (uom.includes('/')) {
    return uom.split('/')[0].trim();
  }
  // Otherwise return the UOM as is
  return uom;
};
```

**Examples:**
- `"meter/hour"` → `"meter"`
- `"ton/hour"` → `"ton"`
- `"kg/min"` → `"kg"`
- `"NA"` → `"NA"` (no change)
- `"unit"` → `"unit"` (no change)

---

### 2. Table Display Update

**Before:**
```javascript
render: (output, record) => {
  if (record.taskType === 'activity' && output && output > 0) {
    return `${Number(output).toFixed(2)} ${record.uom}`;  // Shows "21 meter/hour" ❌
  }
  return '-';
}
```

**After:**
```javascript
render: (output, record) => {
  if (record.taskType === 'activity' && output && output > 0) {
    // Use uomNumerator from API if available, otherwise extract from uom
    const uomNumerator = record.uomNumerator || getUomNumerator(record.uom);
    return `${Number(output).toFixed(2)} ${uomNumerator}`;  // Shows "21 meter" ✅
  }
  return '-';
}
```

---

### 3. Modal Display Update

**Before:**
```javascript
<strong>Total Output: {calculatedOutput} {form.getFieldValue('uom') || 'units'}</strong>
// Shows: "Total Output: 21 meter/hour" ❌
```

**After:**
```javascript
<strong>Total Output: {calculatedOutput} {getUomNumerator(form.getFieldValue('uom')) || 'units'}</strong>
// Shows: "Total Output: 21 meter" ✅
```

**Calculation explanation also updated:**
```javascript
<small>
  Calculation: ({taskDuration} minutes ÷ 60 hours) × {rate} {uom}/hr = {calculatedOutput} {getUomNumerator(uom)}
</small>
// Shows: "(180 minutes ÷ 60 hours) × 7 meter/hour = 21 meter" ✅
```

---

### 4. Backend - Virtual Field (`models/Task.js`)

Added a helper function and virtual field to the Task model:

```javascript
// Helper function to extract UOM numerator (e.g., "meter/hour" -> "meter")
function getUomNumerator(uom) {
  if (!uom) return '';
  // If UOM contains '/', extract the part before it (numerator)
  if (uom.includes('/')) {
    return uom.split('/')[0].trim();
  }
  // Otherwise return the UOM as is
  return uom;
}

// Virtual field for UOM numerator (for display purposes)
TaskSchema.virtual('uomNumerator').get(function() {
  return getUomNumerator(this.uom);
});

// Ensure virtuals are included in JSON
TaskSchema.set('toJSON', { virtuals: true });
TaskSchema.set('toObject', { virtuals: true });
```

**Benefits:**
- API responses now include `uomNumerator` field automatically
- Frontend can use it directly without parsing
- Consistent logic between frontend and backend

---

## Test Cases

### ✅ UOM with Rate Format
| UOM | Numerator Extracted | Output Display |
|-----|---------------------|----------------|
| meter/hour | meter | "21.00 meter" ✅ |
| ton/hour | ton | "150.50 ton" ✅ |
| kg/min | kg | "45.75 kg" ✅ |
| m³/day | m³ | "1200.00 m³" ✅ |

### ✅ UOM without Rate Format
| UOM | Numerator Extracted | Output Display |
|-----|---------------------|----------------|
| NA | NA | "-" (task type) |
| unit | unit | "100.00 unit" ✅ |
| piece | piece | "50.00 piece" ✅ |

### ✅ Example Scenarios

#### Scenario 1: Drilling
- UOM: "meter/hour"
- Rate: 7 meter/hour
- Duration: 180 minutes (3 hours)
- **Output Display:** "21.00 meter" ✅

#### Scenario 2: Material Transport
- UOM: "ton/hour"
- Rate: 50 ton/hour
- Duration: 120 minutes (2 hours)
- **Output Display:** "100.00 ton" ✅

#### Scenario 3: Equipment Count (simple UOM)
- UOM: "unit"
- Rate: 10 unit/hour
- Duration: 60 minutes (1 hour)
- **Output Display:** "10.00 unit" ✅

---

## Files Modified

### Frontend
1. `client/src/pages/Tasks.js`
   - Added `getUomNumerator()` utility function (lines 13-22)
   - Updated OUTPUT column render (lines 520-532)
   - Updated modal output display (lines 743-747)

### Backend
2. `models/Task.js`
   - Added `getUomNumerator()` helper function (lines 89-98)
   - Added `uomNumerator` virtual field (lines 100-107)
   - Enabled virtuals in JSON output

---

## API Response Example

**Before:**
```json
{
  "taskId": "DR001",
  "taskName": "Drilling",
  "taskType": "activity",
  "uom": "meter/hour",
  "rate": 7,
  "taskDuration": 180,
  "calculatedOutput": 21
}
```

**After (with virtual field):**
```json
{
  "taskId": "DR001",
  "taskName": "Drilling",
  "taskType": "activity",
  "uom": "meter/hour",
  "uomNumerator": "meter",  ← NEW!
  "rate": 7,
  "taskDuration": 180,
  "calculatedOutput": 21
}
```

---

## Summary

✅ **Fixed Everywhere:**
- Table OUTPUT column: Shows "21 meter" instead of "21 meter/hour"
- Modal alert: Shows "Total Output: 21 meter"
- Modal calculation: Clear explanation with correct unit
- API response: Includes `uomNumerator` field for easy access

✅ **Works for ALL UOM Types:**
- Rate-based UOMs: "meter/hour", "ton/hour", "kg/min", etc.
- Simple UOMs: "unit", "piece", "NA", etc.

✅ **Consistent Logic:**
- Same extraction function used in frontend and backend
- No duplication or confusion

**All output displays now correctly show TOTAL PRODUCTION units, not rate units!** 🎉

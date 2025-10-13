# Task Module Updates - Pagination & Limits Field Changes

## Date: 2025-10-13

### Summary
Fixed pagination issues and converted the Limits/Equipment field from a text input to a dropdown selector (1-10). This field will be used for future calculations.

---

## Changes Made

### 1. **Backend - Task Model** (`models/Task.js`)

#### Changed: Limits Field Type
**Before:**
```javascript
limits: {
  type: String,
  trim: true,
  default: ''
}
```

**After:**
```javascript
limits: {
  type: Number,
  min: 1,
  max: 10,
  default: 1
}
```

**Reason:** Changed from String to Number (1-10) to support dropdown selection and future calculations with equipment/resource limits.

---

### 2. **Backend - Task Routes** (`routes/tasks.js`)

#### Updated: Default Limits Value in Task Creation
- **Line 108:** Changed `limits: limits || ''` to `limits: limits || 1`
- Ensures new tasks default to 1 equipment/resource if not specified

#### Updated: Excel Import Validation
- **Lines 399-407:** Added parsing and validation for limits field
```javascript
// Parse and validate limits (must be 1-10)
let limits = 1;
if (row.limits) {
  const parsedLimits = parseInt(row.limits);
  if (!isNaN(parsedLimits) && parsedLimits >= 1 && parsedLimits <= 10) {
    limits = parsedLimits;
  }
}
```
- Validates imported limits values are between 1-10
- Defaults to 1 if invalid or missing

---

### 3. **Frontend - Tasks Component** (`client/src/pages/Tasks.js`)

#### Fixed: Pagination Settings
**Before:**
```javascript
pagination={{
  pageSize: 15,
  showSizeChanger: true,
  pageSizeOptions: ['10', '15', '25', '50', '100'],
  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
  simple: false,
}}
```

**After:**
```javascript
pagination={{
  defaultPageSize: 10,
  pageSize: 10,
  showSizeChanger: true,
  pageSizeOptions: ['10', '15', '25', '50', '100'],
  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
}}
```

**Changes:**
- Added `defaultPageSize: 10` to ensure initial page size is 10
- Changed `pageSize` from 15 to 10
- Removed unnecessary `simple: false` property

---

#### Changed: Limits/Equipment Field to Dropdown
**Before:**
```javascript
<Form.Item
  label="Limits/Equipments"
  name="limits"
>
  <TextArea 
    rows={2}
    placeholder="Enter limits or equipments (optional)" 
  />
</Form.Item>
```

**After:**
```javascript
<Form.Item
  label="Limits/Equipments"
  name="limits"
  rules={[{ required: true, message: 'Required' }]}
  tooltip="Select number of equipment/resources (1-10)"
>
  <Select placeholder="Select number of equipment/resources">
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
      <Option key={num} value={num}>{num}</Option>
    ))}
  </Select>
</Form.Item>
```

**Changes:**
- Replaced TextArea with Select dropdown
- Shows numbers 1-10 as options
- Made field required
- Added tooltip for clarity

---

#### Added: Limits Column to Table
**New column added after OUTPUT column:**
```javascript
{
  title: 'LIMITS/EQP',
  dataIndex: 'limits',
  key: 'limits',
  width: 100,
  align: 'center',
  render: (limits) => limits || 1
}
```

- Displays the limits/equipment count in the main task table
- Defaults to showing 1 if no value present

---

#### Updated: Default Limits in Form Initialization
**Line 122:** Added `limits: 1` to default form values when creating new tasks

---

#### Updated: Excel Template Download
**Lines 333 & 343:** Changed template examples from empty strings to numbers:
- Drilling Operation example: `limits: 2`
- Maintenance Check example: `limits: 1`

---

#### Updated: Table Scroll Width
**Line 602:** Changed from `scroll={{ x: 1400 }}` to `scroll={{ x: 1500 }}`
- Accommodates the new LIMITS/EQP column

---

## Database Migration Note

### For Existing Data
Existing tasks in the database may have:
- String values in the `limits` field (old format)
- Empty strings or null values

**Recommendation:**
Run a migration script to convert existing data:
```javascript
// Migration script (run once)
db.tasks.find().forEach(function(task) {
  let newLimits = 1;
  if (task.limits) {
    const parsed = parseInt(task.limits);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) {
      newLimits = parsed;
    }
  }
  db.tasks.updateOne(
    { _id: task._id },
    { $set: { limits: newLimits } }
  );
});
```

---

## Testing Checklist

- [x] Backend model updated with Number type
- [x] Backend routes handle default value (1)
- [x] Excel import validates and parses limits correctly
- [x] Frontend displays dropdown with 1-10 options
- [x] Pagination defaults to 10 items per page
- [x] Pagination size changer works correctly
- [x] New tasks default to limits = 1
- [x] Limits column visible in table
- [x] Excel template reflects new number format

---

## Next Steps (As per user request)

The limits/equipment field is now ready for future calculations. The user mentioned this will be used in other calculations which they will specify next.

---

## Files Modified

1. `C:\Webdev\MineScheduler\models\Task.js`
2. `C:\Webdev\MineScheduler\routes\tasks.js`
3. `C:\Webdev\MineScheduler\client\src\pages\Tasks.js`

---

## Questions for User

1. Should we add a database migration script to convert existing string limits to numbers?
2. What specific calculations will use the limits/equipment field?
3. Do you need any filtering or sorting by limits in the table?

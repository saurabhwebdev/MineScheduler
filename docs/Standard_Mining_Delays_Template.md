# Standard Mining Delays Template

## Pre-configured Standard Delays for Mining Operations

This document lists standard delay categories and codes that can be configured in the Delay Management system.

---

## Standard Delay Categories

### 1. **Equipment Delays**
| Delay Code | Description | Category |
|------------|-------------|----------|
| EQ-001 | Equipment Breakdown - Mechanical | Equipment |
| EQ-002 | Equipment Breakdown - Electrical | Equipment |
| EQ-003 | Equipment Maintenance - Scheduled | Equipment |
| EQ-004 | Equipment Maintenance - Unscheduled | Equipment |
| EQ-005 | Hydraulic System Failure | Equipment |
| EQ-006 | Tire/Track Damage | Equipment |
| EQ-007 | Engine Failure | Equipment |
| EQ-008 | Transmission Issues | Equipment |
| EQ-009 | Cooling System Failure | Equipment |
| EQ-010 | Equipment Unavailable/In Repair | Equipment |

### 2. **Safety Delays**
| Delay Code | Description | Category |
|------------|-------------|----------|
| SF-001 | Safety Inspection | Safety |
| SF-002 | Safety Meeting/Toolbox Talk | Safety |
| SF-003 | Accident Investigation | Safety |
| SF-004 | Safety Incident - Near Miss | Safety |
| SF-005 | Unsafe Conditions - Work Stopped | Safety |
| SF-006 | Safety Equipment Check | Safety |
| SF-007 | Emergency Response Drill | Safety |
| SF-008 | PPE Issues | Safety |
| SF-009 | Medical Emergency | Safety |
| SF-010 | First Aid | Safety |

### 3. **Weather Delays**
| Delay Code | Description | Category |
|------------|-------------|----------|
| WT-001 | Heavy Rain | Weather |
| WT-002 | Lightning/Thunderstorm | Weather |
| WT-003 | High Winds | Weather |
| WT-004 | Fog/Low Visibility | Weather |
| WT-005 | Extreme Heat | Weather |
| WT-006 | Extreme Cold | Weather |
| WT-007 | Snow/Ice | Weather |
| WT-008 | Dust Storm | Weather |
| WT-009 | Flooding | Weather |
| WT-010 | Weather Standby | Weather |

### 4. **Operational Delays**
| Delay Code | Description | Category |
|------------|-------------|----------|
| OP-001 | Shift Change | Operational |
| OP-002 | Meal Break | Operational |
| OP-003 | Pre-Start Meeting | Operational |
| OP-004 | Waiting for Instructions | Operational |
| OP-005 | Operator Unavailable | Operational |
| OP-006 | Training | Operational |
| OP-007 | Shift Handover | Operational |
| OP-008 | Communication Failure | Operational |
| OP-009 | Coordination Issues | Operational |
| OP-010 | Management Decision | Operational |

### 5. **Material Delays**
| Delay Code | Description | Category |
|------------|-------------|----------|
| MT-001 | Fuel Supply Delay | Material |
| MT-002 | Spare Parts Unavailable | Material |
| MT-003 | Consumables Shortage | Material |
| MT-004 | Explosives Unavailable | Material |
| MT-005 | Water Supply Issues | Material |
| MT-006 | Lubrication Supply Delay | Material |
| MT-007 | Materials Delivery Delay | Material |
| MT-008 | Equipment Transportation Delay | Material |
| MT-009 | Tire Shortage | Material |
| MT-010 | Steel/Ground Support Materials Delay | Material |

### 6. **Maintenance Delays**
| Delay Code | Description | Category |
|------------|-------------|----------|
| MN-001 | Preventive Maintenance | Maintenance |
| MN-002 | Corrective Maintenance | Maintenance |
| MN-003 | Lubrication Service | Maintenance |
| MN-004 | Filter Changes | Maintenance |
| MN-005 | Welding Repairs | Maintenance |
| MN-006 | Tire/Track Replacement | Maintenance |
| MN-007 | Electrical Repairs | Maintenance |
| MN-008 | Hydraulic Repairs | Maintenance |
| MN-009 | Awaiting Maintenance Crew | Maintenance |
| MN-010 | Major Component Replacement | Maintenance |

### 7. **Geological/Mining Delays**
| Delay Code | Description | Category |
|------------|-------------|----------|
| GL-001 | Ground Conditions - Unstable | Geological |
| GL-002 | Blasting Preparation | Geological |
| GL-003 | Blasting Clearance/Evacuation | Geological |
| GL-004 | Post-Blast Clearance | Geological |
| GL-005 | Re-entry Procedure | Geological |
| GL-006 | Rock Fall Cleanup | Geological |
| GL-007 | Ground Support Installation | Geological |
| GL-008 | Bench Preparation | Geological |
| GL-009 | Drilling Issues | Geological |
| GL-010 | Ore Grade Issues | Geological |

### 8. **Planning/Management Delays**
| Delay Code | Description | Category |
|------------|-------------|----------|
| PM-001 | Production Plan Change | Planning |
| PM-002 | Priority Change | Planning |
| PM-003 | Area Not Ready | Planning |
| PM-004 | Survey Required | Planning |
| PM-005 | Design Change | Planning |
| PM-006 | Management Review | Planning |
| PM-007 | Budget Constraints | Planning |
| PM-008 | Permit Delays | Planning |
| PM-009 | Environmental Compliance | Planning |
| PM-010 | Regulatory Inspection | Planning |

### 9. **Infrastructure Delays**
| Delay Code | Description | Category |
|------------|-------------|----------|
| IF-001 | Haul Road Maintenance | Infrastructure |
| IF-002 | Haul Road Blocked | Infrastructure |
| IF-003 | Ramp Construction | Infrastructure |
| IF-004 | Power Outage | Infrastructure |
| IF-005 | Water System Issues | Infrastructure |
| IF-006 | Ventilation Issues | Infrastructure |
| IF-007 | Lighting Failure | Infrastructure |
| IF-008 | Communication System Down | Infrastructure |
| IF-009 | Access Issues | Infrastructure |
| IF-010 | Infrastructure Repair | Infrastructure |

### 10. **Other Delays**
| Delay Code | Description | Category |
|------------|-------------|----------|
| OT-001 | No Delay - Productive Time | Other |
| OT-002 | Break Time - Approved | Other |
| OT-003 | Travel Time | Other |
| OT-004 | Standby - Other Reason | Other |
| OT-005 | End of Shift | Other |
| OT-006 | Start of Shift Setup | Other |
| OT-007 | Quality Control | Other |
| OT-008 | Documentation | Other |
| OT-009 | Site Visit | Other |
| OT-010 | Miscellaneous | Other |

---

## How to Use This Template

### Method 1: Manual Entry
1. Go to **Delay Management** page
2. Click **"+ New Delay"**
3. Enter:
   - **Delay Category**: (e.g., "Equipment", "Safety", "Weather")
   - **Delay Code**: (e.g., "EQ-001", "SF-001")
   - **Description**: (e.g., "Equipment Breakdown - Mechanical")
   - **Status**: Active/Inactive toggle

### Method 2: Excel Import
1. Create an Excel file with columns:
   - `delayCategory`
   - `delayCode`
   - `description`
   - `isActive` (optional - Active/Inactive)

2. On the **Delay Management** page:
   - Click **"Download Template"** to get the format
   - Fill in your delays
   - Click **"Import Excel"** to upload

### Method 3: Bulk Import
Use the provided categories above to create your Excel file with all standard delays at once.

---

## Excel Format Example

```
delayCategory | delayCode | description | isActive
Equipment | EQ-001 | Equipment Breakdown - Mechanical | Active
Equipment | EQ-002 | Equipment Breakdown - Electrical | Active
Safety | SF-001 | Safety Inspection | Active
Safety | SF-002 | Safety Meeting/Toolbox Talk | Active
Weather | WT-001 | Heavy Rain | Active
```

---

## Customization Tips

1. **Modify codes** to match your site's naming convention
2. **Add site-specific delays** based on your unique conditions
3. **Mark delays as Inactive** if they don't apply to your operation
4. **Create sub-categories** for more granular tracking
5. **Use consistent naming** for easy reporting

---

## Best Practices

✅ **Keep codes short and meaningful** (e.g., EQ-001, SF-001)
✅ **Use clear descriptions** that operators can easily understand
✅ **Group related delays** under appropriate categories
✅ **Review and update regularly** based on actual site conditions
✅ **Train operators** on proper delay code usage
✅ **Set inactive delays** that are no longer relevant

---

## Categories Summary

| # | Category | Count | Code Prefix |
|---|----------|-------|-------------|
| 1 | Equipment | 10 | EQ-XXX |
| 2 | Safety | 10 | SF-XXX |
| 3 | Weather | 10 | WT-XXX |
| 4 | Operational | 10 | OP-XXX |
| 5 | Material | 10 | MT-XXX |
| 6 | Maintenance | 10 | MN-XXX |
| 7 | Geological | 10 | GL-XXX |
| 8 | Planning | 10 | PM-XXX |
| 9 | Infrastructure | 10 | IF-XXX |
| 10 | Other | 10 | OT-XXX |
| **TOTAL** | **100** | **Standard Delays** | - |

---

## Quick Start Recommendation

For a new site, start with these **essential delays**:

1. **EQ-001** - Equipment Breakdown
2. **EQ-003** - Scheduled Maintenance
3. **SF-001** - Safety Inspection
4. **SF-002** - Safety Meeting
5. **WT-001** - Heavy Rain
6. **OP-001** - Shift Change
7. **OP-002** - Meal Break
8. **MN-001** - Preventive Maintenance
9. **GL-001** - Unstable Ground
10. **OT-001** - No Delay (Productive Time)

Then add more delays as needed based on your operation!

---

## System Features

✅ **Create/Edit/Delete** delays
✅ **Active/Inactive** status toggle
✅ **Excel Import/Export** for bulk operations
✅ **Audit Trail** - All changes logged
✅ **Search & Filter** delays by category/status
✅ **Click to view** detailed delay information
✅ **Unique delay codes** - System prevents duplicates

**The Delay Management system is fully functional and ready to use!** 🎉

# MineScheduler User Guide

## Welcome to MineScheduler

This comprehensive guide will walk you through the complete user journey from setup to creating your first schedule. Follow the steps in order for the best experience.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Initial Configuration](#2-initial-configuration)
3. [Creating Tasks](#3-creating-tasks)
4. [Managing Sites](#4-managing-sites)
5. [Equipment Management](#5-equipment-management)
6. [Delay Management](#6-delay-management)
7. [Creating a Schedule](#7-creating-a-schedule)
8. [How the Core Logic Works](#8-how-the-core-logic-works)
9. [Best Practices & Tips](#9-best-practices--tips)
10. [Quick Reference](#quick-reference)

---

## 1. Getting Started

**Set up your system and understand the basics**

### 1.1 Login to the System
Use your credentials to access MineScheduler. First-time users will be required to reset their password for security.

### 1.2 Understand the Dashboard
The Home dashboard provides an overview of equipment status, maintenance schedules, and KPIs. Use this as your starting point each day.

### 1.3 Navigate the Sidebar
Access all modules from the left sidebar: Schedule, Tasks, Delays, Sites, Equipment, and Settings. Hover over icons to see labels.

---

## 2. Initial Configuration

**Configure your system before creating schedules**

### 2.1 Configure Constants
Go to **Settings → Constants**. Set mining parameters like WIDTH, HEIGHT, and DENSITY. These are used in task duration calculations.

### 2.2 Set Up Shifts
Go to **Settings → Shift Configuration**. Define your work shifts (e.g., Day Shift 06:00-18:00). Configure shift changeover durations for automatic delays.

### 2.3 Define Equipment Types
Go to **Settings → Equipment Types**. Create categories for your equipment (e.g., Drills, Loaders, Trucks). This helps in organizing your fleet.

### 2.4 Configure UOMs
Go to **Settings → UOM Configuration**. Set up Units of Measure for tasks (meters/hour, tonnes/hour, etc.). This determines how task durations are calculated.

---

## 3. Creating Tasks

**Define the tasks that will be scheduled**

### 3.1 Add New Task
Navigate to Tasks page. Click "Add Task" button. Each task represents an activity in your mining cycle (e.g., Drilling, Charging, Blasting).

### 3.2 Configure Task Properties
Set Task ID (unique code), Name, UOM type, Rate/Duration, Color, and Order. The Order determines the sequence in the mining cycle.

### 3.3 Set Task Limits
Configure how many sites can perform this task simultaneously per hour. This prevents resource conflicts.

### 3.4 Import Tasks via Excel
For bulk setup, download the template, fill in task details, and import. This is faster for multiple tasks.

---

## 4. Managing Sites

**Set up mining sites and their parameters**

### 4.1 Add Site
Go to Sites page. Click "Add Site". Enter Site ID (e.g., G701), name, location, and priority. Lower priority numbers are scheduled first.

### 4.2 Set Site Parameters
Configure Total Plan Meters, Backfill Tonnes, Remote Tonnes, Width, and Height. These values are used to calculate task durations.

### 4.3 Set Current Task and Firings
Specify which task the site is currently on and number of blast cycles (firings). The system will schedule tasks in sequence for each cycle.

### 4.4 Use Time to Complete Override
If you know exactly how long the current task will take, enter it in "Time to Complete (hrs)". This overrides the calculated duration for the first task.

---

## 5. Equipment Management

**Track and assign equipment to tasks**

### 5.1 Add Equipment
Navigate to Equipment page. Add your fleet with Equipment ID, Name, Type, and Status. Track specifications, location, and serial numbers.

### 5.2 Assign Tasks to Equipment
In the "Tasks" tab of equipment form, select which tasks this equipment can perform. This links equipment to the scheduling system.

### 5.3 Configure Maintenance
Set Maintenance Interval (hours) and track Operating Hours. The system calculates when maintenance is due.

### 5.4 View Maintenance Opportunities
The Maintenance Grid shows hourly availability of equipment. Blue cells indicate good times for maintenance when equipment is not in use.

---

## 6. Delay Management

**Define and track operational delays**

### 6.1 Set Up Delay Codes
Go to Delays page. Create delay codes with Category (e.g., Equipment, Operational) and Code (e.g., EQ-001). Add descriptions for clarity.

### 6.2 Import Standard Delays
Download the delay template, define your standard delay codes, and import them. This creates a consistent delay tracking system.

### 6.3 Standard vs Custom Delays
Standard delays have predefined durations. Custom delays are entered on-the-fly during scheduling.

---

## 7. Creating a Schedule

**Generate and manage your mine schedule**

### 7.1 Navigate to Schedule Page
Click Schedule in the sidebar. Choose between 24-hour or 48-hour grid view using the toggle at the top.

### 7.2 Generate Schedule
Click "Generate Schedule" button. The system calculates task allocations based on your sites, tasks, and configuration. This takes a few seconds.

### 7.3 Understand the Grid
Each row is a site, each column is an hour. Color-coded cells show which task is scheduled. Priority sites appear first. Inactive sites are grayed out.

### 7.4 Add Delays
Click any cell or hour header to mark delays. Select delay category, code, duration, and notes. Delays block task allocation for that period.

### 7.5 Regenerate with Delays
After adding delays, click "Generate Schedule" again. The system will reschedule around the blocked hours.

### 7.6 Save as Snapshot
Click "Save Snapshot" to preserve this schedule version. Give it a name and description. Access historical snapshots anytime.

### 7.7 Toggle Site Status
Click site name in grid to toggle active/inactive. Inactive sites are skipped in scheduling but remain visible for reference.

---

## 8. How the Core Logic Works

**Understanding the scheduling and maintenance algorithms**

### 8.1 Task Duration Calculation

The system calculates task durations based on Unit of Measure (UOM) types:

1. **Area-based**: Duration = (Total Plan Meters ÷ Rate m/h) × 60
   - Example: 100m at 10m/h = 10 hours

2. **Tonnage-based**: Duration = (Total Backfill Tonnes × 60) ÷ Rate t/h
   - If tonnes not provided, calculates from Width × Height × Length × Density

3. **BOGT (Bogger/Trolley)**: Duration = (Remote Tonnes ÷ Rate) × 60

4. **BFP (Backfill Prep)**: Uses fixed duration only if tonnes > 0, skips if no backfill

5. **Task (Fixed)**: Uses configured duration in minutes directly

*All durations are rounded up to next whole hour.*

### 8.2 Priority-Based Allocation

Sites are sorted by Priority (lower number = higher priority) before scheduling. Active sites come first, then inactive. The scheduler processes sites in this order, allocating tasks sequentially. This ensures critical sites get scheduled first when resources are limited.

### 8.3 Task Cycling & Firings

**Firings** represent blast cycles:

- **Firings = 1**: System schedules tasks from current task to end of cycle (no wrap)
- **Firings > 1**: System schedules complete mining cycle (drill → charge → blast → ventilate → etc.) and repeats it "Firings" times

Tasks follow the Order sequence defined in Tasks page.

### 8.4 Time to Complete Override

When "Time to Complete" is set for a site, it overrides the calculated duration ONLY for the first occurrence of the current task. Subsequent tasks and cycles use normal duration calculations. This is useful when you know exact remaining time for an in-progress task.

### 8.5 Task Limits Enforcement

Each task has a "Limit" defining max simultaneous sites per hour. For example, if Drill limit = 2, only 2 sites can drill in the same hour. The scheduler checks hourly allocation and skips hours where limit is reached, moving to the next available hour. This prevents equipment conflicts.

### 8.6 Delay Handling

Delays block specific hours for specific sites. When generating schedule, the system builds a delay map and skips those hours during allocation. This forces tasks to be scheduled around delays. Shift changeover delays are automatically generated based on shift configuration.

### 8.7 Hour Allocation Algorithm

For each site, the scheduler:

1. Starts at hour 0 or last filled hour
2. Checks if hour is delayed - if yes, skip to next hour
3. Checks if cell already filled - if yes, skip to next hour
4. Checks task limit for that hour - if reached, skip to next hour
5. If all checks pass, allocate task to that hour and increment counter
6. Repeat until all hours for task are allocated or grid ends

### 8.8 Maintenance Opportunity Grid Logic

Equipment is assigned to specific tasks via "Assigned Tasks" field. The system:

1. Checks each hour to see which tasks are running (from schedule grid)
2. If ANY task assigned to an equipment is running, marks equipment as "In Use" (Green)
3. If equipment is operational AND not in use, marks hour as "Maintenance Window" (Blue)
4. Considers operating hours vs maintenance interval to show status:
   - Good (< 80%)
   - Due Soon (80-99%)
   - Overdue (≥ 100%)

### 8.9 Equipment Maintenance Calculation

Maintenance status is calculated as:

**Percent Used = (Operating Hours ÷ Maintenance Interval) × 100**

Example: Equipment with 450 hours operated and 500-hour interval = 90% (Due Soon)

**Hours Until Maintenance = Maintenance Interval - Operating Hours**

The system tracks this automatically and shows visual indicators (Green/Orange/Red).

### 8.10 Shift Changeover Auto-Delay

When shifts are configured with changeover duration (e.g., 30 minutes), the system automatically blocks the hour BEFORE each shift starts.

Example: Day shift starts at 06:00 with 30-min changeover → Hour 5 (05:00-06:00) is automatically blocked for ALL active sites.

This prevents task allocation during crew changes.

### 8.11 Schedule Grid Color Coding

Each task has a unique color defined in Tasks page. The grid uses these colors to visualize the schedule:

- **Empty cells** = white (available)
- **Colored cells** = task assigned
- **Gray cells** = inactive site
- **Delayed cells** = show with visual indicators

This provides instant visual understanding of the schedule.

### 8.12 Snapshot & History

Snapshots save complete schedule state including:
- Grid allocation
- Task durations
- Site priorities
- Delays
- All parameters

This allows:

1. **Historical comparison** - see how schedules evolved
2. **Rollback capability** - restore previous versions
3. **Audit trail** - track schedule changes over time

*Snapshots are immutable once saved.*

---

## 9. Best Practices & Tips

**Optimize your scheduling workflow**

### 9.1 Set Priorities Correctly
Lower priority numbers = higher importance. Use priorities to control which sites get scheduled first when resources are limited.

### 9.2 Use Task Orders
Task order defines the mining cycle sequence. Ensure tasks are numbered correctly (e.g., 1=Drill, 2=Charge, 3=Blast, 4=Ventilate).

### 9.3 Leverage Excel Import
For initial setup or bulk updates, use Excel import. Download templates, fill offline, and import. This is much faster than manual entry.

### 9.4 Monitor Equipment Maintenance
Check the Equipment Dashboard regularly. Schedule maintenance during "blue" hours in the Maintenance Grid when equipment is available.

### 9.5 Use Shift Changeover
Configure shift changeover durations in Settings. The system automatically blocks those hours, preventing task allocation during crew changes.

### 9.6 Review Audit Logs
Admins can check Audit page to see who made changes and when. This helps track schedule modifications and maintain accountability.

### 9.7 Save Snapshots Regularly
Create snapshots before major changes. This lets you compare schedules and revert if needed. Name them clearly (e.g., "Week 12 - Initial").

### 9.8 Understand UOM Types
Area-based (m/h), Tonnage-based (t/h), BOGT (trolley), BFP (backfill prep), and Task (fixed time). Choose the right UOM for accurate duration calculations.

---

## Quick Reference

| Term | Description |
|------|-------------|
| **Priority** | Lower number = Higher priority |
| **Firings** | Number of blast cycles to schedule |
| **Task Limits** | Max sites per hour for a task |
| **UOM** | Unit of Measure for duration calculation |
| **Snapshot** | Saved version of a schedule |
| **Active/Inactive** | Control if site is scheduled |

---

## Need More Help?

If you have questions not covered in this guide, please contact your system administrator or IT support team.

---

**© 2025 Unison Mining - MineScheduler**
**Version 1.0**

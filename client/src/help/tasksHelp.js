export const tasksHelp = {
  title: 'Tasks Management',
  icon: 'CheckSquareOutlined',
  sections: [
    {
      title: 'Overview',
      content: 'Tasks represent mining operations (Drilling, Charging, Firing, Bogging, Backfill, etc.) that get scheduled at sites. Each task has a UOM, duration, rate, and hourly limit that determines how it\'s allocated in the schedule.'
    },
    {
      title: 'Creating a Task',
      items: [
        {
          subtitle: 'Task ID',
          description: 'Short unique identifier (e.g., "DR" for Drilling, "CH" for Charging, "FI" for Firing). This appears in the schedule grid cells.'
        },
        {
          subtitle: 'Task Name',
          description: 'Full descriptive name (e.g., "Drilling", "Charging", "Bogging"). Used in tables and reports.'
        },
        {
          subtitle: 'Task Type',
          description: 'Activity: Quantifiable tasks with rates (e.g., 30 m/hr drilling). Simple Task: Fixed duration tasks (e.g., 1 hour firing). Activities show calculated output, simple tasks don\'t.'
        },
        {
          subtitle: 'UOM (Unit of Measurement)',
          description: 'Select from configured UOMs: "area" (drilling/charging), "ton" (tonnage), "bogt" (bogging), "bfp" (backfill), "task" (fixed). The UOM name determines which calculation formula is used.'
        },
        {
          subtitle: 'Rate (per hour) - Activities Only',
          description: 'For Activity tasks only. Enter rate per hour (e.g., 30 meters/hour for drilling, 45 tonnes/hour for bogging). System calculates: Output = (Duration ÷ 60) × Rate.'
        },
        {
          subtitle: 'Task Duration (Minutes)',
          description: 'Duration in MINUTES (not hours!). For Activities: base duration per unit. For Simple Tasks: fixed duration. Example: 90 minutes = 1.5 hours.'
        },
        {
          subtitle: 'Task Color',
          description: 'Color used in schedule grid. Click color picker to choose from presets or enter hex code. Each task should have a distinct color for easy visual identification.'
        },
        {
          subtitle: 'Formula (Optional)',
          description: 'Text field for documenting calculation formulas or notes. Not used by scheduler, for reference only.'
        },
        {
          subtitle: 'Limits/Equipments',
          description: 'Maximum number of sites that can run this task simultaneously in one hour (1-10). Prevents overloading equipment. Example: Limit=3 means max 3 sites can drill at the same time.'
        }
      ]
    },
    {
      title: 'Task Order & Sequencing',
      content: 'Tasks have an ORDER field that determines the sequence in the cycle (DR→CH→FI→BO→BF). Use the up/down arrows to reorder tasks. The scheduler runs tasks in this order for each site, based on currentTask and firings.'
    },
    {
      title: 'How Tasks Are Scheduled',
      content: 'The scheduler calculates task duration based on UOM + site data (totalPlanMeters, totalBackfillTonnes, width, height) + constants (WIDTH, HEIGHT, DENSITY). It then allocates hours in the grid, respecting hourly limits and delays.'
    },
    {
      title: 'Calculated Output (Activities)',
      content: 'For Activity tasks, the system shows calculated output in real-time. Formula: (Duration in minutes ÷ 60 hours) × Rate = Output. Example: (90 min ÷ 60) × 30 m/hr = 45 meters output.'
    },
    {
      title: 'Managing Tasks',
      items: [
        {
          subtitle: 'Edit Task',
          description: 'Click Edit icon to modify any field. Changes take effect immediately in new schedules. Existing schedules are not affected.'
        },
        {
          subtitle: 'Reorder Tasks',
          description: 'Use up/down arrows to change task sequence. Confirm the reorder. This affects which task runs first, second, third, etc.'
        },
        {
          subtitle: 'Delete Task',
          description: 'Click Delete icon. Warning: Sites currently using this task as currentTask may need to be updated.'
        }
      ]
    },
    {
      title: 'Import/Export',
      items: [
        {
          subtitle: 'Download Template',
          description: 'Get Excel template with required columns and format. Fill it with your task data.'
        },
        {
          subtitle: 'Import Excel',
          description: 'Upload completed template. System validates and imports tasks in bulk. Shows success/failed counts.'
        },
        {
          subtitle: 'Export',
          description: 'Download all tasks to Excel for backup or offline editing.'
        }
      ]
    },
    {
      title: 'Best Practices',
      items: [
        {
          subtitle: 'Task IDs',
          description: 'Keep IDs short (2-3 characters) for clear grid display. Use logical abbreviations (DR=Drill, CH=Charge).'
        },
        {
          subtitle: 'Colors',
          description: 'Use distinct, high-contrast colors. Avoid similar shades (e.g., don\'t use light blue and dark blue).'
        },
        {
          subtitle: 'Rates',
          description: 'Base rates on actual equipment performance data, not theoretical maximums. Update periodically.'
        },
        {
          subtitle: 'Limits',
          description: 'Set limits based on available equipment count. Example: 3 drills available → DR limit = 3.'
        },
        {
          subtitle: 'Task Order',
          description: 'Order tasks in logical mining sequence: Drill → Charge → Fire → Bog → Backfill. Matches real operations.'
        }
      ]
    }
  ]
};

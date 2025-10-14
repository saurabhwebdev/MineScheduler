export const sitesHelp = {
  title: 'Sites Management',
  icon: 'EnvironmentOutlined',
  sections: [
    {
      title: 'Overview',
      content: 'Sites are mining locations (stopes, panels, drives) that appear as rows in the schedule grid. Each site has planning data, priority, and current task status that the scheduler uses to allocate tasks.'
    },
    {
      title: 'Creating a Site',
      items: [
        {
          subtitle: 'Site ID',
          description: 'Unique identifier (e.g., "G7-001", "G8-002"). Auto-uppercase. This appears as the row label in schedule grid.'
        },
        {
          subtitle: 'Site Name',
          description: 'Descriptive name (e.g., "G7 Panel 001", "North Stope"). Used in displays and reports.'
        },
        {
          subtitle: 'Priority',
          description: 'Scheduling order (1 = first, 2 = second, etc.). Lower numbers scheduled first. Sites with priority 1 get their tasks before priority 2.'
        },
        {
          subtitle: 'Active Status',
          description: 'Check to include in scheduling. Uncheck to exclude without deleting. Inactive sites show grayed out in grid with no tasks.'
        },
        {
          subtitle: 'Location',
          description: 'Geographic location or zone (optional). For reference only, not used in scheduling.'
        },
        {
          subtitle: 'Site Type',
          description: 'Category: Mining, Backfill, Development, Exploration, Other. For classification, not used in scheduling.'
        }
      ]
    },
    {
      title: 'Planning Data (Critical for Scheduling)',
      items: [
        {
          subtitle: 'Total Plan Meters',
          description: 'Total meters to drill/develop. Used in AREA and BOGT calculations. Example: 100 meters → DR task calculates (100 / 30 rate) × 60 = 200 minutes.'
        },
        {
          subtitle: 'Total Backfill Tonnes',
          description: 'Total tonnes of backfill material. Used in BFP and TON calculations. If 0, backfill tasks are skipped.'
        },
        {
          subtitle: 'Remote Tonnes',
          description: 'Tonnes for bogger/LHD to haul. Used in BOGT calculations. Formula: (remoteTonnes / duration) × 60.'
        },
        {
          subtitle: 'Width',
          description: 'Site-specific width in meters. If 0 or blank, uses WIDTH constant from Settings. Used in volume calculations.'
        },
        {
          subtitle: 'Height',
          description: 'Site-specific height in meters. If 0 or blank, uses HEIGHT constant from Settings. Used in volume calculations.'
        }
      ]
    },
    {
      title: 'Task Cycle Control',
      items: [
        {
          subtitle: 'Current Task',
          description: 'Task to start with (e.g., "DR", "CH"). If blank, starts with first task (order=1). Scheduler continues from this task through the cycle.'
        },
        {
          subtitle: 'Firings',
          description: 'Number of blast cycles: 0 or 1 = one cycle (currentTask to end). 2+ = repeat full cycle that many times. Example: firings=2 runs DR→CH→FI→BO→BF twice.'
        },
        {
          subtitle: 'Time to Complete',
          description: 'Override duration (in HOURS) for first occurrence of currentTask. If > 0, uses this instead of calculating. Example: 5 hours → DR runs 5 hours instead of calculated 4.'
        }
      ]
    },
    {
      title: 'How Priority Works',
      content: 'Scheduler sorts sites by priority (1, 2, 3...). Site 1 gets hours 1-10, Site 2 gets hours 11-20, etc. If grid runs out of hours (24 or 48), lower priority sites may not get all tasks completed.'
    },
    {
      title: 'Planning Data Requirements',
      content: 'For tasks to run: Area tasks (DR, CH) need totalPlanMeters. Bogging (BO) needs totalPlanMeters + remoteTonnes. Backfill (BF) needs totalBackfillTonnes. If values are 0, those tasks are skipped.'
    },
    {
      title: 'Managing Sites',
      items: [
        {
          subtitle: 'Edit Site',
          description: 'Modify any field. Changes take effect in new schedules. Update planning data as mining progresses.'
        },
        {
          subtitle: 'Toggle Status',
          description: 'Click Active checkbox to enable/disable. Also available as quick toggle in schedule grid (click site name).'
        },
        {
          subtitle: 'Delete Site',
          description: 'Permanently remove. Warning: Removes all associations. Use inactive status instead if site may return.'
        }
      ]
    },
    {
      title: 'Import/Export',
      items: [
        {
          subtitle: 'Import Excel',
          description: 'Bulk upload sites. Required: Site ID, Site Name, Priority. Optional: Planning data, width, height, current task.'
        },
        {
          subtitle: 'Export',
          description: 'Download all sites with complete data for backup or offline editing.'
        }
      ]
    },
    {
      title: 'Best Practices',
      items: [
        {
          subtitle: 'Priority Strategy',
          description: 'Assign priority based on: ore quality, accessibility, mining sequence, safety requirements, equipment availability.'
        },
        {
          subtitle: 'Planning Data Accuracy',
          description: 'Keep totalPlanMeters, tonnes, and dimensions current. Outdated data leads to incorrect durations.'
        },
        {
          subtitle: 'Width/Height Override',
          description: 'Use site-specific width/height for non-standard stopes. Leave 0 for standard dimensions (uses constants).'
        },
        {
          subtitle: 'Current Task Tracking',
          description: 'Update currentTask as work progresses. Ensures schedule continues from correct point.'
        },
        {
          subtitle: 'Regular Updates',
          description: 'Review and update site data weekly. Adjust priorities as mining plan evolves.'
        }
      ]
    }
  ]
};

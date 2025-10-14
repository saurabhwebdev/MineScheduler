export const scheduleHelp = {
  title: 'Schedule Management',
  icon: 'CalendarOutlined',
  sections: [
    {
      title: 'Overview',
      content: 'The Schedule module generates optimized mining schedules by allocating tasks to sites over 24 or 48 hours. It uses priorities, task limits, delays, and planning data to create realistic, executable schedules.'
    },
    {
      title: 'Generating a Schedule',
      items: [
        {
          subtitle: 'Select Grid Hours',
          description: 'Choose 24 Hours (one day) or 48 Hours (two days). Longer schedules allow more task completion but take slightly longer to calculate.'
        },
        {
          subtitle: 'Click Generate Schedule',
          description: 'System fetches all sites, tasks, constants, and delays. Calculates task durations. Allocates tasks in priority order. Returns interactive grid in 1-3 seconds.'
        },
        {
          subtitle: 'View Results',
          description: 'Grid shows: Rows = Sites (sorted by priority). Columns = Hours (1-24 or 1-48). Cells = Task IDs (colored by task). Red cells = Delays. Empty cells = No task assigned.'
        }
      ]
    },
    {
      title: 'Understanding the Grid',
      items: [
        {
          subtitle: 'Column Headers',
          description: 'P = Priority number. Site = Site ID (clickable to toggle status). 1, 2, 3... = Hour numbers.'
        },
        {
          subtitle: 'Task Cells',
          description: 'Colored cells show Task ID (DR, CH, FI, BO, BF). Color matches task color. Tasks span multiple hours based on duration. Same task appears in consecutive cells.'
        },
        {
          subtitle: 'Delayed Cells',
          description: 'Red cells with ⚠ icon. No task can be allocated here. Delays persist in session (saved even after refresh).'
        },
        {
          subtitle: 'Inactive Sites',
          description: 'Grayed out rows. Site name has strikethrough. All cells empty (no tasks). Moved to bottom of grid.'
        }
      ]
    },
    {
      title: 'Site Sorting',
      items: [
        {
          subtitle: 'Click Site Column Header',
          description: 'Cycles through 3 modes: None (⬍) = Priority order. Asc (▲) = G8 sites first, then G7. Desc (▼) = G7 sites first, then G8.'
        },
        {
          subtitle: 'G7/G8 Grouping',
          description: 'System detects G7/G8 from 3rd character of site ID. Groups sites by geology zone. Maintains alphabetical order within groups.'
        }
      ]
    },
    {
      title: 'Managing Delays',
      items: [
        {
          subtitle: 'Add Delay',
          description: 'Click any cell (empty or with task). Delay Modal opens. Select Category (Operational, Safety, Production). Select Code (filtered by category). Duration auto-fills if standard delay. Add optional comments. Click Add Delay. Regenerate schedule to apply.'
        },
        {
          subtitle: 'Remove Delay',
          description: 'Click red delayed cell (⚠). Confirm removal. Regenerate schedule. Cell becomes available for task allocation.'
        },
        {
          subtitle: 'Delay Badge',
          description: 'Shows count: "X Delays Applied". Orange badge in top controls. Delays persist in browser session.'
        }
      ]
    },
    {
      title: 'Toggle Site Status',
      items: [
        {
          subtitle: 'Quick Toggle',
          description: 'Click site name (green link in grid). Confirm status change. Schedule regenerates automatically. Site activates/deactivates instantly.'
        },
        {
          subtitle: 'Effect',
          description: 'Deactivated: Row grays out, no tasks allocated, stays in list. Reactivated: Returns to normal, gets tasks assigned.'
        }
      ]
    },
    {
      title: 'How the Algorithm Works',
      items: [
        {
          subtitle: 'Step 1: Sort Sites',
          description: 'Sites sorted by priority (1, 2, 3...). Active sites only (inactive skipped).'
        },
        {
          subtitle: 'Step 2: Build Task Cycle',
          description: 'For each site: Starts at currentTask (or first if blank). Follows task order (DR→CH→FI→BO→BF). Repeats based on firings count.'
        },
        {
          subtitle: 'Step 3: Calculate Durations',
          description: 'Uses UOM + planning data + constants. Area tasks: (planMeters / rate) × 60. BOGT: (planM × width × height × DENSITY) / rate. BFP: Uses fixed duration if tonnes > 0. Task: Uses taskDuration directly.'
        },
        {
          subtitle: 'Step 4: Allocate Hours',
          description: 'For each task in cycle: Finds next available hour. Checks: Not delayed. Not already filled. Task limit not exceeded. Allocates task to that hour. Repeats until duration complete.'
        },
        {
          subtitle: 'Step 5: Hourly Limits',
          description: 'Max sites per hour per task. Example: DR limit = 3 → Only 3 sites can drill at hour 5. 4th site waits for hour 6.'
        }
      ]
    },
    {
      title: 'Regenerate vs New Schedule',
      items: [
        {
          subtitle: 'Generate Schedule',
          description: 'Creates fresh schedule with current data. Uses all delays from session. Takes 1-3 seconds.'
        },
        {
          subtitle: 'Regenerate Button',
          description: 'Appears after first generation. Same as Generate but explicitly shows "recalculating".'
        },
        {
          subtitle: 'When to Regenerate',
          description: 'After adding/removing delays. After toggling site status. After changing grid hours (24 ↔ 48). Changes do not apply until you regenerate.'
        }
      ]
    },
    {
      title: 'Session Persistence',
      content: 'Delays are saved in browser sessionStorage. Persist through page refresh. Clear when browser tab closes. Always regenerate schedule after refresh to reapply delays.'
    },
    {
      title: 'Reading the Schedule',
      items: [
        {
          subtitle: 'Task Duration',
          description: 'Count consecutive cells with same task ID. Example: DR in hours 1, 2, 3, 4 = 4 hours duration.'
        },
        {
          subtitle: 'Task Sequence',
          description: 'Read left to right for each site. Shows order tasks run in. Gaps indicate delays or waiting for hourly limits.'
        },
        {
          subtitle: 'Resource Conflicts',
          description: 'Look at single hour column. Count same task across sites. Should not exceed task limit.'
        },
        {
          subtitle: 'Site Progress',
          description: 'Compare sites: Higher priority → More tasks completed. Lower priority → May have incomplete cycles.'
        }
      ]
    },
    {
      title: 'Best Practices',
      items: [
        {
          subtitle: 'Start with 24 Hours',
          description: 'Easier to visualize and manage. Extend to 48 hours for longer-duration tasks or complex cycles.'
        },
        {
          subtitle: 'Review Before Delays',
          description: 'Generate clean schedule first. Review task allocation. Then add delays as needed.'
        },
        {
          subtitle: 'Delay Strategy',
          description: 'Add delays for: Equipment maintenance windows. Safety inspections. Shift changes. Known constraints. Update delays daily based on actual operations.'
        },
        {
          subtitle: 'Priority Management',
          description: 'Keep priorities current. Critical sites = 1-3. Standard sites = 4-7. Low priority = 8-10. Review weekly.'
        },
        {
          subtitle: 'Task Color Coding',
          description: 'Use consistent colors across schedules. High-contrast colors for adjacent tasks. Document color meanings for team.'
        }
      ]
    },
    {
      title: 'Troubleshooting',
      items: [
        {
          subtitle: 'No Tasks Appear',
          description: 'Check: Site is Active. Planning data not zero (totalPlanMeters, tonnes). Constants defined (WIDTH, HEIGHT, DENSITY). Tasks exist and have colors.'
        },
        {
          subtitle: 'Tasks End Too Soon',
          description: 'Check: Planning data is sufficient. Task rates are realistic (not too high). Hourly limits not too restrictive.'
        },
        {
          subtitle: 'Delays Not Working',
          description: 'After adding delay: Must click "Generate Schedule". Delay badge should show count. Red cells should appear.'
        },
        {
          subtitle: 'Wrong Task Order',
          description: 'Check: Task order (up/down arrows in Tasks module). Site currentTask is correct. Firings count matches expectations.'
        }
      ]
    }
  ]
};

export const dashboardHelp = {
  title: 'Dashboard',
  icon: 'DashboardOutlined',
  sections: [
    {
      title: 'Overview',
      content: 'The Dashboard provides a comprehensive overview of your mine scheduling system with real-time KPIs, equipment status, schedule utilization metrics, and visual analytics. All data is based on the latest generated schedule.'
    },
    {
      title: 'Schedule KPI Cards',
      items: [
        {
          subtitle: 'Active Sites',
          description: 'Shows the number of currently active sites out of total sites. Active sites are those marked as operational and available for scheduling. Calculated as: Active Sites / Total Sites.'
        },
        {
          subtitle: 'Total Tasks',
          description: 'Displays the total count of tasks in the system that can be scheduled across all sites. This includes all task types like Production Drill, Back Fill, CHARGE, Site Setup, etc.'
        },
        {
          subtitle: 'Schedule Utilization',
          description: 'Percentage of scheduled time cells that are filled with tasks. Calculated as: (Scheduled Cells / Total Available Cells) × 100. Higher percentages indicate better resource utilization.'
        },
        {
          subtitle: 'Total Delays',
          description: 'Count of all delays recorded in the latest schedule. Delays occur when dependencies or constraints prevent optimal scheduling.'
        }
      ]
    },
    {
      title: 'Equipment KPI Cards',
      items: [
        {
          subtitle: 'Total Equipment',
          description: 'Total number of equipment items registered in the system, including all types like Drills, Trucks, Loaders, etc.'
        },
        {
          subtitle: 'Operational',
          description: 'Number and percentage of equipment currently in operational status. Calculated as: (Operational Equipment / Total Equipment) × 100. This shows fleet health.'
        },
        {
          subtitle: 'Maintenance Due Soon',
          description: 'Equipment with maintenance usage between 80-99%. These items need attention soon to prevent overdue status. Usage is calculated based on hours operated vs maintenance interval.'
        },
        {
          subtitle: 'Maintenance Overdue',
          description: 'Equipment with maintenance usage at 100% or more. These items have exceeded their maintenance interval and require immediate attention to remain operational.'
        }
      ]
    },
    {
      title: 'Visual Analytics',
      items: [
        {
          subtitle: 'Hourly Schedule Utilization',
          description: 'Area chart showing capacity usage for each hour of the schedule. Calculated as: (Tasks Allocated in Hour / Total Capacity) × 100. Helps identify peak usage times and capacity gaps.'
        },
        {
          subtitle: 'Task Allocation Distribution',
          description: 'Pie chart showing proportional distribution of scheduled tasks. Each slice represents a task type with its count and percentage. Hover over slices to see detailed breakdown. Legend shows all task names with color coding.'
        },
        {
          subtitle: 'Equipment Status',
          description: 'Bar chart showing distribution across three statuses: Operational (green), Maintenance (blue), and Out of Service (red). Click bars to view detailed equipment list.'
        },
        {
          subtitle: 'Equipment Maintenance Status',
          description: 'Bar chart categorizing equipment by maintenance urgency: Good (<80% usage), Due Soon (80-99% usage), and Overdue (≥100% usage). Click bars for equipment details.'
        },
        {
          subtitle: 'Equipment by Type',
          description: 'Pie chart showing fleet composition by equipment type (Drill, Truck, Loader, etc.). Percentages show the proportion of each type in the total fleet.'
        },
        {
          subtitle: 'Site Status',
          description: 'Donut chart displaying active vs inactive sites. Active sites are available for scheduling, while inactive sites are temporarily offline or under maintenance.'
        },
        {
          subtitle: 'Equipment Utilization by Type',
          description: 'Bar chart showing operational rate for each equipment type. Calculated as: (Operational Equipment of Type / Total Equipment of Type) × 100. Helps identify which types have maintenance issues.'
        },
        {
          subtitle: 'Upcoming Maintenance (7 Days)',
          description: 'Line chart showing count of equipment scheduled for maintenance over the next 7 days. Helps plan maintenance resources and identify busy maintenance periods.'
        },
        {
          subtitle: 'Delays by Site',
          description: 'Bar chart showing which sites have the most scheduling delays. Helps identify problematic sites that may need attention or constraint adjustments. Only visible when delays exist in the schedule.'
        }
      ]
    },
    {
      title: 'How Data is Calculated',
      items: [
        {
          subtitle: 'Schedule Utilization',
          description: 'Total scheduled cells divided by total available cells (equipment count × hours in grid), multiplied by 100 for percentage.'
        },
        {
          subtitle: 'Task Distribution',
          description: 'Counts how many times each task appears across all hours in the hourlyAllocation data from the latest schedule. Top 8 tasks are displayed.'
        },
        {
          subtitle: 'Maintenance Percentage',
          description: 'Equipment hours used divided by maintenance interval, multiplied by 100. When it reaches 80%, equipment shows as "Due Soon". At 100%+, it\'s "Overdue".'
        },
        {
          subtitle: 'Hourly Utilization',
          description: 'For each hour: sum of all task allocations in that hour divided by total task capacity (sum of all task limits), multiplied by 100.'
        }
      ]
    },
    {
      title: 'Tips for Using the Dashboard',
      items: [
        {
          subtitle: 'Real-Time Data',
          description: 'All metrics update based on the latest generated schedule. The banner at top shows when the schedule was last generated.'
        },
        {
          subtitle: 'Interactive Charts',
          description: 'Hover over chart elements to see detailed information. Some charts are clickable to view underlying data in a modal.'
        },
        {
          subtitle: 'Color Coding',
          description: 'Green indicates good/operational status, orange/yellow indicates warnings (maintenance due soon), and red indicates critical issues (overdue maintenance, out of service).'
        },
        {
          subtitle: 'No Data Available',
          description: 'If you see empty charts or zero values, generate a schedule from the Schedule page to populate the dashboard with data.'
        }
      ]
    }
  ]
};

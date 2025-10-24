export const dashboardHelp = {
  title: 'Dashboard',
  icon: 'DashboardOutlined',
  sections: [
    {
      title: 'Overview',
      content: 'The Dashboard provides a comprehensive real-time overview of your mine scheduling operations. Monitor critical KPIs, equipment health, maintenance costs, schedule quality, and operational metrics. All data updates dynamically based on the selected date range (7, 30, or 90 days, or custom range).'
    },
    {
      title: 'Hero KPI Cards',
      items: [
        {
          subtitle: 'Fleet Availability',
          description: 'Shows operational equipment vs total fleet. Displays the ratio (e.g., 8/10) and percentage of available equipment. Color-coded: Green (≥90%), Orange (75-89%), Red (<75%). Critical for understanding operational capacity.'
        },
        {
          subtitle: 'Critical Alerts',
          description: 'Total count of critical issues requiring immediate attention. Includes overdue maintenance and offline equipment. Click the card to view detailed list. Red border appears when severity is critical.'
        },
        {
          subtitle: 'Maintenance Cost',
          description: 'Total maintenance expenditure for the selected period, broken down into Labor and Parts costs. Shows trend indicator (up/down arrow) comparing to previous period to track cost changes.'
        },
        {
          subtitle: 'Schedule Quality',
          description: 'Overall schedule optimization score (0-100). Higher scores indicate better task allocation, fewer conflicts, and optimal resource utilization. Progress bar color-coded by performance level.'
        }
      ]
    },
    {
      title: 'Secondary Operations KPIs',
      items: [
        {
          subtitle: 'Active Sites',
          description: 'Number of currently active mining sites out of total sites. Active sites are operational and available for task scheduling. Essential for capacity planning.'
        },
        {
          subtitle: 'Total Tasks',
          description: 'Count of all scheduled tasks across all sites. Indicates overall operational workload and scheduling complexity.'
        },
        {
          subtitle: 'Delays',
          description: 'Total number of scheduling delays recorded. Red indicator shows issues that may affect productivity. Investigate causes in the Delays page.'
        },
        {
          subtitle: 'Due Soon (7 days)',
          description: 'Equipment scheduled for maintenance within the next 7 days. Orange indicator helps plan maintenance resources and prevent service disruptions.'
        }
      ]
    },
    {
      title: 'Visual Analytics',
      items: [
        {
          subtitle: 'Fleet Performance Timeline',
          description: 'Full-width 24-hour timeline showing equipment status distribution (Operational, In Maintenance, Out of Service) and overall utilization percentage by hour. Helps identify peak operational times and maintenance patterns. Dual Y-axis shows equipment count and utilization percentage.'
        },
        {
          subtitle: 'Critical Equipment Attention',
          description: 'Horizontal bar chart showing equipment requiring immediate action, grouped by type. Three categories: Overdue (red), Due Soon (orange), and Offline (gray). Stacked bars show cumulative issues per equipment type. Prioritize types with most overdue items.'
        },
        {
          subtitle: 'Delay Impact Analysis',
          description: 'Vertical bar chart displaying delays by category (Equipment, Weather, Resource, etc.). Red bars indicate delay frequency. Use this to identify root causes of scheduling inefficiencies and target improvement areas.'
        },
        {
          subtitle: 'Fleet Health Score',
          description: 'Progress bars showing operational status for each equipment type. Displays ratio (e.g., 8/10) and percentage. Color-coded: Green (≥90% operational), Orange (75-89%), Red (<75%). Quick visual health check of fleet categories.'
        },
        {
          subtitle: 'Schedule Quality Breakdown',
          description: 'Circular progress gauge showing overall quality score with detailed component metrics below: Utilization %, Conflicts count, and Task Completion %. The circular score provides at-a-glance schedule optimization status.'
        }
      ]
    },
    {
      title: 'How Data is Calculated',
      items: [
        {
          subtitle: 'Fleet Availability',
          description: 'Counts equipment with "operational" status divided by total equipment count. Excludes equipment in maintenance or out-of-service status. Updated in real-time as equipment status changes.'
        },
        {
          subtitle: 'Critical Alerts',
          description: 'Sum of: (1) Equipment with nextMaintenance date in the past (overdue), and (2) Equipment with "out-of-service" status. Severity is "critical" when count exceeds threshold or fleet availability drops below 80%.'
        },
        {
          subtitle: 'Maintenance Cost',
          description: 'Aggregates all maintenance records within selected date range. Labor Cost = sum of (labor hours × hourly rate). Parts Cost = sum of parts expenses. Trend compares current period to previous equivalent period.'
        },
        {
          subtitle: 'Schedule Quality Score',
          description: 'Weighted composite: 40% Utilization (tasks scheduled vs capacity), 30% Task Completion (completed vs planned), 30% Conflicts (penalty for scheduling conflicts). Score ranges 0-100, where 80+ is excellent.'
        },
        {
          subtitle: 'Fleet Performance Timeline',
          description: 'For each hour (0-23): counts equipment in each status category. Utilization % = (scheduled equipment-hours / total available equipment-hours) × 100. Data aggregated from schedule grid and equipment status logs.'
        }
      ]
    },
    {
      title: 'Quick Actions & Date Range',
      content: 'Use the Quick Actions bar to access common workflows: View Critical Items, check Maintenance Logs, Generate Schedule, or view Cost Reports. Select date range (7d, 30d, 90d) or use custom date picker to adjust the time period for all metrics and charts. All dashboard data updates immediately when date range changes.'
    },
    {
      title: 'Tips for Using the Dashboard',
      items: [
        {
          subtitle: 'Monitor Critical Alerts',
          description: 'Red alert banner appears when critical issues are detected. Click "View Details" or the Critical Alerts card to see specific equipment requiring attention. Address overdue maintenance immediately to prevent operational disruptions.'
        },
        {
          subtitle: 'Date Range Selection',
          description: 'Use 7-day view for daily operations monitoring, 30-day for monthly reporting, 90-day for trend analysis. Custom date range allows precise period selection for auditing or reporting purposes.'
        },
        {
          subtitle: 'Color Coding System',
          description: 'Green = Good/Operational (≥90%), Orange = Warning/Due Soon (75-89% or due within 7 days), Red = Critical/Overdue (<75% or past due). Gray = Offline/Inactive. Consistent across all dashboard elements.'
        },
        {
          subtitle: 'Interactive Elements',
          description: 'Hover over charts for detailed tooltips. Critical Alerts card is clickable for full equipment list. Charts use modern tooltips showing exact values and context. Legend items can be clicked to filter data (where applicable).'
        },
        {
          subtitle: 'Performance Optimization',
          description: 'Use Fleet Performance Timeline to identify operational patterns and optimize shift planning. Compare Delay Impact across categories to prioritize process improvements. Monitor Schedule Quality trend to measure scheduling effectiveness over time.'
        }
      ]
    }
  ]
};

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';
import { 
  CheckCircleFilled, 
  RightOutlined,
  CalendarFilled,
  FileTextFilled,
  ClockCircleFilled,
  EnvironmentFilled,
  ToolFilled,
  SettingFilled,
  PlayCircleFilled,
  BulbFilled,
  ThunderboltFilled
} from '@ant-design/icons';
import './Help.css';

const Help = () => {
  const { t, i18n } = useTranslation();
  const [expandedSection, setExpandedSection] = useState(null);
  const [helpContent, setHelpContent] = useState({ sections: [] });

  useEffect(() => {
    // Load help content based on current language
    const loadHelpContent = async () => {
      try {
        const content = await import(`../locales/${i18n.language}/helpContent.json`);
        setHelpContent(content.default || content);
      } catch (error) {
        // Fallback to English if translation not available
        const content = await import(`../locales/en/helpContent.json`);
        setHelpContent(content.default || content);
      }
    };
    loadHelpContent();
  }, [i18n.language]);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Icon mapping for sections
  const getIcon = (id) => {
    const iconMap = {
      'getting-started': <PlayCircleFilled />,
      'setup': <SettingFilled />,
      'tasks': <FileTextFilled />,
      'sites': <EnvironmentFilled />,
      'equipment': <ToolFilled />,
      'delays': <ClockCircleFilled />,
      'maintenance-logs': <ToolFilled />,
      'scheduling': <CalendarFilled />,
      'core-logic': <ThunderboltFilled />,
      'tips': <BulbFilled />
    };
    return iconMap[id] || <FileTextFilled />;
  };

  // OLD CODE REMOVED - Now using dynamic helpContent loaded from JSON files
  const userJourney_OLD_REMOVED = [
    {
      id: 'getting-started',
      icon: <PlayCircleFilled />,
      title: 'Getting Started',
      description: 'Set up your system and understand the basics',
      steps: [
        {
          number: 1,
          title: 'Login to the System',
          content: 'Use your credentials to access MineScheduler. First-time users will be required to reset their password for security.'
        },
        {
          number: 2,
          title: 'Understand the Dashboard',
          content: 'The Home dashboard provides an overview of equipment status, maintenance schedules, and KPIs. Use this as your starting point each day.'
        },
        {
          number: 3,
          title: 'Navigate the Sidebar',
          content: 'Access all modules from the left sidebar: Schedule, Tasks, Delays, Sites, Equipment, and Settings. Hover over icons to see labels.'
        }
      ]
    },
    {
      id: 'setup',
      icon: <SettingFilled />,
      title: 'Initial Configuration',
      description: 'Configure your system before creating schedules',
      steps: [
        {
          number: 1,
          title: 'Configure Constants',
          content: 'Go to Settings → Constants. Set mining parameters like WIDTH, HEIGHT, and DENSITY. These are used in task duration calculations.'
        },
        {
          number: 2,
          title: 'Set Up Shifts',
          content: 'Go to Settings → Shift Configuration. Define your work shifts (e.g., Day Shift 06:00-18:00). Configure shift changeover durations for automatic delays.'
        },
        {
          number: 3,
          title: 'Define Equipment Types',
          content: 'Go to Settings → Equipment Types. Create categories for your equipment (e.g., Drills, Loaders, Trucks). This helps in organizing your fleet.'
        },
        {
          number: 4,
          title: 'Configure UOMs',
          content: 'Go to Settings → UOM Configuration. Set up Units of Measure for tasks (meters/hour, tonnes/hour, etc.). This determines how task durations are calculated.'
        }
      ]
    },
    {
      id: 'tasks',
      icon: <FileTextFilled />,
      title: 'Creating Tasks',
      description: 'Define the tasks that will be scheduled',
      steps: [
        {
          number: 1,
          title: 'Add New Task',
          content: 'Navigate to Tasks page. Click "Add Task" button. Each task represents an activity in your mining cycle (e.g., Drilling, Charging, Blasting).'
        },
        {
          number: 2,
          title: 'Configure Task Properties',
          content: 'Set Task ID (unique code), Name, UOM type, Rate/Duration, Color, and Order. The Order determines the sequence in the mining cycle.'
        },
        {
          number: 3,
          title: 'Set Task Limits',
          content: 'Configure how many sites can perform this task simultaneously per hour. This prevents resource conflicts.'
        },
        {
          number: 4,
          title: 'Import Tasks via Excel',
          content: 'For bulk setup, download the template, fill in task details, and import. This is faster for multiple tasks.'
        }
      ]
    },
    {
      id: 'sites',
      icon: <EnvironmentFilled />,
      title: 'Managing Sites',
      description: 'Set up mining sites and their parameters',
      steps: [
        {
          number: 1,
          title: 'Add Site',
          content: 'Go to Sites page. Click "Add Site". Enter Site ID (e.g., G701), name, location, and priority. Lower priority numbers are scheduled first.'
        },
        {
          number: 2,
          title: 'Set Site Parameters',
          content: 'Configure Total Plan Meters, Backfill Tonnes, Remote Tonnes, Width, and Height. These values are used to calculate task durations.'
        },
        {
          number: 3,
          title: 'Set Current Task and Firings',
          content: 'Specify which task the site is currently on and number of blast cycles (firings). The system will schedule tasks in sequence for each cycle.'
        },
        {
          number: 4,
          title: 'Use Time to Complete Override',
          content: 'If you know exactly how long the current task will take, enter it in "Time to Complete (hrs)". This overrides the calculated duration for the first task.'
        }
      ]
    },
    {
      id: 'equipment',
      icon: <ToolFilled />,
      title: 'Equipment Management',
      description: 'Track and assign equipment to tasks',
      steps: [
        {
          number: 1,
          title: 'Add Equipment',
          content: 'Navigate to Equipment page. Add your fleet with Equipment ID, Name, Type, and Status. Track specifications, location, and serial numbers.'
        },
        {
          number: 2,
          title: 'Assign Tasks to Equipment',
          content: 'In the "Tasks" tab of equipment form, select which tasks this equipment can perform. This links equipment to the scheduling system.'
        },
        {
          number: 3,
          title: 'Configure Maintenance',
          content: 'Set Maintenance Interval (hours) and track Operating Hours. The system calculates when maintenance is due.'
        },
        {
          number: 4,
          title: 'View Maintenance Opportunities',
          content: 'The Maintenance Grid shows hourly availability of equipment. Blue cells indicate good times for maintenance when equipment is not in use.'
        }
      ]
    },
    {
      id: 'delays',
      icon: <ClockCircleFilled />,
      title: 'Delay Management',
      description: 'Define and track operational delays',
      steps: [
        {
          number: 1,
          title: 'Set Up Delay Codes',
          content: 'Go to Delays page. Create delay codes with Category (e.g., Equipment, Operational) and Code (e.g., EQ-001). Add descriptions for clarity.'
        },
        {
          number: 2,
          title: 'Import Standard Delays',
          content: 'Download the delay template, define your standard delay codes, and import them. This creates a consistent delay tracking system.'
        },
        {
          number: 3,
          title: 'Standard vs Custom Delays',
          content: 'Standard delays have predefined durations. Custom delays are entered on-the-fly during scheduling.'
        }
      ]
    },
    {
      id: 'maintenance-logs',
      icon: <ToolFilled />,
      title: 'Maintenance Logs',
      description: 'Track and analyze equipment maintenance history',
      steps: [
        {
          number: 1,
          title: 'Record Maintenance Events',
          content: 'Go to Maintenance Logs page. Click "New Log" to record maintenance activities. Select equipment, maintenance type (scheduled/unscheduled/preventive/breakdown), date performed, and duration.'
        },
        {
          number: 2,
          title: 'Track Costs',
          content: 'Enter labor costs and parts costs for each maintenance event. This helps analyze total cost of ownership and identify expensive equipment.'
        },
        {
          number: 3,
          title: 'Set Next Due Date',
          content: 'When recording maintenance, set the next maintenance due date. This integrates with the equipment maintenance tracking system.'
        },
        {
          number: 4,
          title: 'View Analytics',
          content: 'Switch to Analytics tab to see maintenance trends, costs by equipment, breakdown frequency, and compliance metrics. Use filters to analyze specific equipment or time periods.'
        },
        {
          number: 5,
          title: 'Import Maintenance History',
          content: 'Click "Import" to bulk upload historical maintenance data via Excel. Download the template, fill in maintenance records, and import to build your maintenance history database.'
        },
        {
          number: 6,
          title: 'Export Reports',
          content: 'Click "Export to Excel" to download maintenance logs for reporting or analysis. Filtered results will be exported based on your current filter selections.'
        }
      ]
    },
    {
      id: 'scheduling',
      icon: <CalendarFilled />,
      title: 'Creating a Schedule',
      description: 'Generate and manage your mine schedule',
      steps: [
        {
          number: 1,
          title: 'Navigate to Schedule Page',
          content: 'Click Schedule in the sidebar. Choose between 24-hour or 48-hour grid view using the toggle at the top.'
        },
        {
          number: 2,
          title: 'Generate Schedule',
          content: 'Click "Generate Schedule" button. The system calculates task allocations based on your sites, tasks, and configuration. This takes a few seconds.'
        },
        {
          number: 3,
          title: 'Understand the Grid',
          content: 'Each row is a site, each column is an hour. Color-coded cells show which task is scheduled. Priority sites appear first. Inactive sites are grayed out.'
        },
        {
          number: 4,
          title: 'Add Delays',
          content: 'Click any cell or hour header to mark delays. Select delay category, code, duration, and notes. Delays block task allocation for that period.'
        },
        {
          number: 5,
          title: 'Regenerate with Delays',
          content: 'After adding delays, click "Generate Schedule" again. The system will reschedule around the blocked hours.'
        },
        {
          number: 6,
          title: 'Save as Snapshot',
          content: 'Click "Save Snapshot" to preserve this schedule version. Give it a name and description. Access historical snapshots anytime.'
        },
        {
          number: 7,
          title: 'Toggle Site Status',
          content: 'Click site name in grid to toggle active/inactive. Inactive sites are skipped in scheduling but remain visible for reference.'
        }
      ]
    },
    {
      id: 'core-logic',
      icon: <ThunderboltFilled />,
      title: 'How the Core Logic Works',
      description: 'Understanding the scheduling and maintenance algorithms',
      steps: [
        {
          number: 1,
          title: 'Task Duration Calculation',
          content: 'The system calculates task durations based on Unit of Measure (UOM) types: (1) Area-based: Duration = (Total Plan Meters ÷ Rate m/h) × 60. For example, 100m at 10m/h = 10 hours. (2) Tonnage-based: Duration = (Total Backfill Tonnes × 60) ÷ Rate t/h. If tonnes not provided, calculates from Width × Height × Length × Density. (3) BOGT (Bogger/Trolley): Duration = (Remote Tonnes ÷ Rate) × 60. (4) BFP (Backfill Prep): Uses fixed duration only if tonnes > 0, skips if no backfill. (5) Task (Fixed): Uses configured duration in minutes directly. All durations are rounded up to next whole hour.'
        },
        {
          number: 2,
          title: 'Priority-Based Allocation',
          content: 'Sites are sorted by Priority (lower number = higher priority) before scheduling. Active sites come first, then inactive. The scheduler processes sites in this order, allocating tasks sequentially. This ensures critical sites get scheduled first when resources are limited.'
        },
        {
          number: 3,
          title: 'Task Cycling & Firings',
          content: 'Firings represent blast cycles. For Firings = 1: System schedules tasks from current task to end of cycle (no wrap). For Firings > 1: System schedules complete mining cycle (drill → charge → blast → ventilate → etc.) and repeats it "Firings" times. Tasks follow the Order sequence defined in Tasks page.'
        },
        {
          number: 4,
          title: 'Time to Complete Override',
          content: 'When "Time to Complete" is set for a site, it overrides the calculated duration ONLY for the first occurrence of the current task. Subsequent tasks and cycles use normal duration calculations. This is useful when you know exact remaining time for an in-progress task.'
        },
        {
          number: 5,
          title: 'Task Limits Enforcement',
          content: 'Each task has a "Limit" defining max simultaneous sites per hour. For example, if Drill limit = 2, only 2 sites can drill in the same hour. The scheduler checks hourly allocation and skips hours where limit is reached, moving to the next available hour. This prevents equipment conflicts.'
        },
        {
          number: 6,
          title: 'Delay Handling',
          content: 'Delays block specific hours for specific sites. When generating schedule, the system builds a delay map and skips those hours during allocation. This forces tasks to be scheduled around delays. Shift changeover delays are automatically generated based on shift configuration.'
        },
        {
          number: 7,
          title: 'Hour Allocation Algorithm',
          content: 'For each site, the scheduler: (1) Starts at hour 0 or last filled hour. (2) Checks if hour is delayed - if yes, skip to next hour. (3) Checks if cell already filled - if yes, skip to next hour. (4) Checks task limit for that hour - if reached, skip to next hour. (5) If all checks pass, allocate task to that hour and increment counter. (6) Repeat until all hours for task are allocated or grid ends.'
        },
        {
          number: 8,
          title: 'Maintenance Opportunity Grid Logic',
          content: 'Equipment is assigned to specific tasks via "Assigned Tasks" field. The system: (1) Checks each hour to see which tasks are running (from schedule grid). (2) If ANY task assigned to an equipment is running, marks equipment as "In Use" (Green). (3) If equipment is operational AND not in use, marks hour as "Maintenance Window" (Blue). (4) Considers operating hours vs maintenance interval to show status: Good (< 80%), Due Soon (80-99%), Overdue (≥ 100%).'
        },
        {
          number: 9,
          title: 'Equipment Maintenance Calculation',
          content: 'Maintenance status is calculated as: Percent Used = (Operating Hours ÷ Maintenance Interval) × 100. For example, equipment with 450 hours operated and 500-hour interval = 90% (Due Soon). Hours Until Maintenance = Maintenance Interval - Operating Hours. The system tracks this automatically and shows visual indicators (Green/Orange/Red).'
        },
        {
          number: 10,
          title: 'Shift Changeover Auto-Delay',
          content: 'When shifts are configured with changeover duration (e.g., 30 minutes), the system automatically blocks the hour BEFORE each shift starts. For example: Day shift starts at 06:00 with 30-min changeover → Hour 5 (05:00-06:00) is automatically blocked for ALL active sites. This prevents task allocation during crew changes.'
        },
        {
          number: 11,
          title: 'Schedule Grid Color Coding',
          content: 'Each task has a unique color defined in Tasks page. The grid uses these colors to visualize the schedule. Empty cells = white (available), Colored cells = task assigned, Gray cells = inactive site, Delayed cells show with visual indicators. This provides instant visual understanding of the schedule.'
        },
        {
          number: 12,
          title: 'Snapshot & History',
          content: 'Snapshots save complete schedule state including: grid allocation, task durations, site priorities, delays, and all parameters. This allows: (1) Historical comparison - see how schedules evolved. (2) Rollback capability - restore previous versions. (3) Audit trail - track schedule changes over time. Snapshots are immutable once saved.'
        }
      ]
    },
    {
      id: 'tips',
      icon: <BulbFilled />,
      title: 'Best Practices & Tips',
      description: 'Optimize your scheduling workflow',
      steps: [
        {
          number: 1,
          title: 'Set Priorities Correctly',
          content: 'Lower priority numbers = higher importance. Use priorities to control which sites get scheduled first when resources are limited.'
        },
        {
          number: 2,
          title: 'Use Task Orders',
          content: 'Task order defines the mining cycle sequence. Ensure tasks are numbered correctly (e.g., 1=Drill, 2=Charge, 3=Blast, 4=Ventilate).'
        },
        {
          number: 3,
          title: 'Leverage Excel Import',
          content: 'For initial setup or bulk updates, use Excel import. Download templates, fill offline, and import. This is much faster than manual entry.'
        },
        {
          number: 4,
          title: 'Monitor Equipment Maintenance',
          content: 'Check the Equipment Dashboard regularly. Schedule maintenance during "blue" hours in the Maintenance Grid when equipment is available.'
        },
        {
          number: 5,
          title: 'Use Shift Changeover',
          content: 'Configure shift changeover durations in Settings. The system automatically blocks those hours, preventing task allocation during crew changes.'
        },
        {
          number: 6,
          title: 'Review Audit Logs',
          content: 'Admins can check Audit page to see who made changes and when. This helps track schedule modifications and maintain accountability.'
        },
        {
          number: 7,
          title: 'Save Snapshots Regularly',
          content: 'Create snapshots before major changes. This lets you compare schedules and revert if needed. Name them clearly (e.g., "Week 12 - Initial").'
        },
        {
          number: 8,
          title: 'Understand UOM Types',
          content: 'Area-based (m/h), Tonnage-based (t/h), BOGT (trolley), BFP (backfill prep), and Task (fixed time). Choose the right UOM for accurate duration calculations.'
        }
      ]
    }
  ];

  return (
    <DashboardLayout 
      title={t('help.title')}
      subtitle={t('help.subtitle')}
    >
      <div className="help-page">
        {/* Introduction Card */}
        <div className="help-intro-card">
          <div className="help-intro-icon">📖</div>
          <div className="help-intro-content">
            <h1>{t('help.intro.title')}</h1>
            <p>{t('help.intro.description')}</p>
          </div>
        </div>

        {/* Journey Steps */}
        <div className="help-journey">
          {helpContent.sections.map((section, index) => (
            <div 
              key={section.id} 
              className={`help-section ${expandedSection === section.id ? 'expanded' : ''}`}
            >
              <div 
                className="help-section-header"
                onClick={() => toggleSection(section.id)}
              >
                <div className="help-section-left">
                  <div className="help-section-number">{index + 1}</div>
                  <div className="help-section-icon">{getIcon(section.id)}</div>
                  <div className="help-section-info">
                    <h2>{section.title}</h2>
                    <p>{section.description}</p>
                  </div>
                </div>
                <div className="help-section-toggle">
                  <RightOutlined className={expandedSection === section.id ? 'rotated' : ''} />
                </div>
              </div>

              {expandedSection === section.id && (
                <div className="help-section-content">
                  {section.steps.map((step, stepIndex) => (
                    <div key={stepIndex} className="help-step">
                      <div className="help-step-number">
                        <CheckCircleFilled />
                      </div>
                      <div className="help-step-content">
                        <h3>{stepIndex + 1}. {step.title}</h3>
                        <p>{step.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Reference Card */}
        <div className="help-reference-card">
          <h3>{t('help.quickRef.title')}</h3>
          <div className="help-reference-grid">
            <div className="help-reference-item">
              <strong>Priority:</strong> {t('help.quickRef.priority')}
            </div>
            <div className="help-reference-item">
              <strong>Firings:</strong> {t('help.quickRef.firings')}
            </div>
            <div className="help-reference-item">
              <strong>Task Limits:</strong> {t('help.quickRef.taskLimits')}
            </div>
            <div className="help-reference-item">
              <strong>UOM:</strong> {t('help.quickRef.uom')}
            </div>
            <div className="help-reference-item">
              <strong>Snapshot:</strong> {t('help.quickRef.snapshot')}
            </div>
            <div className="help-reference-item">
              <strong>Active/Inactive:</strong> {t('help.quickRef.activeInactive')}
            </div>
          </div>
        </div>

        {/* Support Card */}
        <div className="help-support-card">
          <h3>{t('help.support.title')}</h3>
          <p>{t('help.support.description')}</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Help;

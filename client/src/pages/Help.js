import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { 
  CheckCircleOutlined, 
  RightOutlined,
  CalendarOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  ToolOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  BulbOutlined
} from '@ant-design/icons';
import './Help.css';

const Help = () => {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const userJourney = [
    {
      id: 'getting-started',
      icon: <PlayCircleOutlined />,
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
      icon: <SettingOutlined />,
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
      icon: <FileTextOutlined />,
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
      icon: <EnvironmentOutlined />,
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
      icon: <ToolOutlined />,
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
      icon: <ClockCircleOutlined />,
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
      id: 'scheduling',
      icon: <CalendarOutlined />,
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
      id: 'tips',
      icon: <BulbOutlined />,
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
      title="Help & User Guide"
      subtitle="Learn how to use MineScheduler effectively"
    >
      <div className="help-page">
        {/* Introduction Card */}
        <div className="help-intro-card">
          <div className="help-intro-icon">📖</div>
          <div className="help-intro-content">
            <h1>Welcome to MineScheduler</h1>
            <p>This guide will walk you through the complete user journey from setup to creating your first schedule. Follow the steps in order for the best experience.</p>
          </div>
        </div>

        {/* Journey Steps */}
        <div className="help-journey">
          {userJourney.map((section, index) => (
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
                  <div className="help-section-icon">{section.icon}</div>
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
                  {section.steps.map((step) => (
                    <div key={step.number} className="help-step">
                      <div className="help-step-number">
                        <CheckCircleOutlined />
                      </div>
                      <div className="help-step-content">
                        <h3>{step.number}. {step.title}</h3>
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
          <h3>Quick Reference</h3>
          <div className="help-reference-grid">
            <div className="help-reference-item">
              <strong>Priority:</strong> Lower number = Higher priority
            </div>
            <div className="help-reference-item">
              <strong>Firings:</strong> Number of blast cycles to schedule
            </div>
            <div className="help-reference-item">
              <strong>Task Limits:</strong> Max sites per hour for a task
            </div>
            <div className="help-reference-item">
              <strong>UOM:</strong> Unit of Measure for duration calculation
            </div>
            <div className="help-reference-item">
              <strong>Snapshot:</strong> Saved version of a schedule
            </div>
            <div className="help-reference-item">
              <strong>Active/Inactive:</strong> Control if site is scheduled
            </div>
          </div>
        </div>

        {/* Support Card */}
        <div className="help-support-card">
          <h3>Need More Help?</h3>
          <p>If you have questions not covered in this guide, please contact your system administrator or IT support team.</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Help;

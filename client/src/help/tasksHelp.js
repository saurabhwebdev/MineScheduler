export const tasksHelp = {
  title: 'Tasks Management',
  icon: 'CheckSquareOutlined',
  sections: [
    {
      title: 'Overview',
      content: 'Tasks are the core building blocks of your mine scheduling system. Each task represents a specific mining operation that needs to be scheduled and tracked.'
    },
    {
      title: 'Creating a Task',
      items: [
        {
          subtitle: 'Task Name',
          description: 'Enter a descriptive name for the task (e.g., "Excavation - Block A", "Drilling - Zone 3").'
        },
        {
          subtitle: 'Task Type',
          description: 'Select the type of mining operation: Drilling, Blasting, Excavation, Loading, Hauling, or Other.'
        },
        {
          subtitle: 'Unit of Measurement (UOM)',
          description: 'Choose the UOM that defines how this task is measured (e.g., Tonnes, Area, Task count). This determines how duration is calculated.'
        },
        {
          subtitle: 'Value',
          description: 'Enter the quantity value based on the selected UOM (e.g., 1000 tonnes, 500 m²).'
        },
        {
          subtitle: 'Equipment',
          description: 'Select the equipment required to perform this task. Only available equipment will be shown.'
        },
        {
          subtitle: 'Priority',
          description: 'Set task priority: High (urgent/critical), Medium (standard), or Low (can be delayed).'
        },
        {
          subtitle: 'Status',
          description: 'Mark as Active (ready to schedule) or Inactive (not ready/on hold).'
        }
      ]
    },
    {
      title: 'Task Duration Calculation',
      content: 'Task duration is automatically calculated based on the UOM, value, and mining constants (WIDTH, HEIGHT, DENSITY) configured in Settings. The system uses predefined formulas to estimate realistic completion times.'
    },
    {
      title: 'Editing Tasks',
      content: 'Click the Edit icon to modify task details. Changes are tracked in the audit log.'
    },
    {
      title: 'Deleting Tasks',
      content: 'Click the Delete icon to remove a task. This action cannot be undone and will be logged in the audit trail.'
    },
    {
      title: 'Import/Export',
      items: [
        {
          subtitle: 'Import',
          description: 'Upload an Excel file (.xlsx) with task data. The system will validate and import tasks in bulk. Required columns: Task Name, Task Type, UOM, Value, Priority.'
        },
        {
          subtitle: 'Export',
          description: 'Download all tasks as an Excel file for backup or external analysis.'
        }
      ]
    },
    {
      title: 'Filtering & Search',
      items: [
        {
          subtitle: 'Status Filter',
          description: 'Filter tasks by Active or Inactive status.'
        },
        {
          subtitle: 'Task Type Filter',
          description: 'Filter by specific task types (Drilling, Blasting, etc.).'
        },
        {
          subtitle: 'Priority Filter',
          description: 'Filter by High, Medium, or Low priority.'
        },
        {
          subtitle: 'Sorting',
          description: 'Click column headers to sort by Task Name, Type, Priority, Duration, or Created Date.'
        }
      ]
    }
  ]
};

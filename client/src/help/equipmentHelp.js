export const equipmentHelp = {
  title: 'Equipment Management',
  icon: 'ToolOutlined',
  sections: [
    {
      title: 'Overview',
      content: 'Equipment represents the machinery, vehicles, and tools used in mining operations. Proper equipment management ensures optimal resource allocation and prevents scheduling conflicts.'
    },
    {
      title: 'Creating Equipment',
      items: [
        {
          subtitle: 'Equipment Name',
          description: 'Enter a descriptive name (e.g., "Excavator 001", "Haul Truck #5", "Drill Rig A").'
        },
        {
          subtitle: 'Equipment Type',
          description: 'Select the category: Excavator, Drill, Truck, Loader, Dozer, Grader, or Other.'
        },
        {
          subtitle: 'Model',
          description: 'Specify the manufacturer model (e.g., "CAT 390F", "Komatsu PC5500").'
        },
        {
          subtitle: 'Serial Number',
          description: 'Enter the unique serial or fleet number for identification and tracking.'
        },
        {
          subtitle: 'Capacity',
          description: 'Define equipment capacity with value and unit (e.g., "50 tonnes", "300 HP").'
        },
        {
          subtitle: 'Site Assignment',
          description: 'Assign equipment to a specific site or leave unassigned for flexible allocation.'
        },
        {
          subtitle: 'Status',
          description: 'Available: Ready for use. In Use: Currently assigned to a task. Maintenance: Under repair/service. Out of Service: Not operational.'
        }
      ]
    },
    {
      title: 'Equipment Status Types',
      items: [
        {
          subtitle: 'Available',
          description: 'Equipment is operational and ready to be assigned to tasks.'
        },
        {
          subtitle: 'In Use',
          description: 'Currently assigned to an active task. Cannot be double-booked.'
        },
        {
          subtitle: 'Maintenance',
          description: 'Undergoing scheduled maintenance or repairs. Not available for scheduling.'
        },
        {
          subtitle: 'Out of Service',
          description: 'Equipment is broken down or decommissioned. Requires repair or replacement.'
        }
      ]
    },
    {
      title: 'Equipment Scheduling',
      content: 'The scheduling algorithm automatically checks equipment availability before assigning tasks. Equipment marked as "In Use", "Maintenance", or "Out of Service" will not be assigned to new tasks until status changes to "Available".'
    },
    {
      title: 'Managing Equipment',
      items: [
        {
          subtitle: 'Edit Equipment',
          description: 'Update equipment details, capacity, or site assignment.'
        },
        {
          subtitle: 'Change Status',
          description: 'Update equipment status as operational conditions change.'
        },
        {
          subtitle: 'Delete Equipment',
          description: 'Remove equipment from the system. Warning: May affect tasks requiring this equipment.'
        }
      ]
    },
    {
      title: 'Import/Export',
      items: [
        {
          subtitle: 'Import',
          description: 'Bulk upload equipment from Excel. Required columns: Equipment Name, Type, Model, Serial Number, Capacity Value, Capacity Unit, Status.'
        },
        {
          subtitle: 'Export',
          description: 'Download equipment inventory for maintenance planning or reporting.'
        }
      ]
    },
    {
      title: 'Best Practices',
      items: [
        {
          subtitle: 'Regular Updates',
          description: 'Keep equipment status current to ensure accurate scheduling.'
        },
        {
          subtitle: 'Maintenance Planning',
          description: 'Schedule maintenance during low-activity periods to minimize impact.'
        },
        {
          subtitle: 'Capacity Tracking',
          description: 'Accurate capacity information helps optimize task assignments.'
        }
      ]
    }
  ]
};

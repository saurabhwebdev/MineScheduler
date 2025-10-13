export const delaysHelp = {
  title: 'Delays Management',
  icon: 'ClockCircleOutlined',
  sections: [
    {
      title: 'Overview',
      content: 'Delays are incidents or events that affect the scheduling timeline. Tracking delays helps identify bottlenecks and improve operational efficiency.'
    },
    {
      title: 'Creating a Delay',
      items: [
        {
          subtitle: 'Delay Code',
          description: 'Enter a unique code for quick identification (e.g., "WTH-001", "MECH-015").'
        },
        {
          subtitle: 'Delay Name',
          description: 'Provide a descriptive name for the delay type (e.g., "Weather Delay", "Equipment Breakdown").'
        },
        {
          subtitle: 'Category',
          description: 'Select the delay category: Weather, Equipment, Safety, Operational, or Other.'
        },
        {
          subtitle: 'Duration (Minutes)',
          description: 'Specify how long this delay typically lasts in minutes.'
        },
        {
          subtitle: 'Site',
          description: 'Associate the delay with a specific mining site.'
        },
        {
          subtitle: 'Description',
          description: 'Add detailed notes about the delay cause and impact (optional).'
        },
        {
          subtitle: 'Status',
          description: 'Set as Active (currently affecting operations) or Resolved (delay has ended).'
        }
      ]
    },
    {
      title: 'Delay Categories',
      items: [
        {
          subtitle: 'Weather',
          description: 'Rain, storms, extreme temperatures, or other weather-related delays.'
        },
        {
          subtitle: 'Equipment',
          description: 'Mechanical failures, breakdowns, or equipment unavailability.'
        },
        {
          subtitle: 'Safety',
          description: 'Safety incidents, inspections, or safety protocol implementations.'
        },
        {
          subtitle: 'Operational',
          description: 'Process delays, coordination issues, or resource constraints.'
        },
        {
          subtitle: 'Other',
          description: 'Any other delay types not covered by standard categories.'
        }
      ]
    },
    {
      title: 'Managing Delays',
      items: [
        {
          subtitle: 'Edit Delay',
          description: 'Update delay information or status as situations change.'
        },
        {
          subtitle: 'Delete Delay',
          description: 'Remove delay records. Use caution as this affects historical data.'
        },
        {
          subtitle: 'Resolve Delay',
          description: 'Mark delays as resolved when issues are fixed. This updates the status to inactive.'
        }
      ]
    },
    {
      title: 'Import/Export',
      items: [
        {
          subtitle: 'Import',
          description: 'Bulk import delays from Excel. Required columns: Delay Code, Delay Name, Category, Duration, Site.'
        },
        {
          subtitle: 'Export',
          description: 'Export delay data for reporting and analysis.'
        }
      ]
    },
    {
      title: 'Impact on Scheduling',
      content: 'Active delays are automatically factored into the scheduling algorithm. The system adjusts task timelines and resource allocation based on delay durations and affected sites.'
    }
  ]
};

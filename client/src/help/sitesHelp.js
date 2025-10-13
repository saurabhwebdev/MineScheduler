export const sitesHelp = {
  title: 'Sites Management',
  icon: 'EnvironmentOutlined',
  sections: [
    {
      title: 'Overview',
      content: 'Sites represent different mining locations or areas within your operation. Each site can have its own priority, status, and associated tasks and equipment.'
    },
    {
      title: 'Creating a Site',
      items: [
        {
          subtitle: 'Site Name',
          description: 'Enter a unique identifier for the site (e.g., "North Pit", "Block A", "Zone 3").'
        },
        {
          subtitle: 'Location',
          description: 'Specify the geographic location or coordinates of the site.'
        },
        {
          subtitle: 'Priority',
          description: 'Set site priority (1-10). Higher priority sites are scheduled first. Use 1 for highest priority, 10 for lowest.'
        },
        {
          subtitle: 'Task Limit',
          description: 'Maximum number of concurrent tasks allowed at this site. Prevents overloading a single location.'
        },
        {
          subtitle: 'Description',
          description: 'Add notes about the site characteristics, geology, or special considerations (optional).'
        },
        {
          subtitle: 'Status',
          description: 'Active sites can be scheduled. Inactive sites are excluded from scheduling operations.'
        }
      ]
    },
    {
      title: 'Site Priority System',
      content: 'The scheduling algorithm uses site priorities to determine the order in which tasks are assigned. Sites with lower priority numbers (e.g., 1, 2, 3) are given preference over sites with higher numbers (e.g., 8, 9, 10). This ensures critical mining areas receive attention first.'
    },
    {
      title: 'Task Limits',
      content: 'Task limits prevent too many operations from running simultaneously at one site. This helps manage: resource conflicts, safety constraints, physical space limitations, and equipment congestion. When a site reaches its task limit, additional tasks are queued or reassigned.'
    },
    {
      title: 'Managing Sites',
      items: [
        {
          subtitle: 'Edit Site',
          description: 'Update site details, priority, or task limits as operational needs change.'
        },
        {
          subtitle: 'Toggle Status',
          description: 'Quickly activate or deactivate sites without deleting them.'
        },
        {
          subtitle: 'Delete Site',
          description: 'Permanently remove a site. Warning: This may affect associated tasks and delays.'
        }
      ]
    },
    {
      title: 'Import/Export',
      items: [
        {
          subtitle: 'Import',
          description: 'Bulk upload sites from Excel. Required columns: Site Name, Location, Priority, Task Limit.'
        },
        {
          subtitle: 'Export',
          description: 'Download site data for backup or external analysis.'
        }
      ]
    },
    {
      title: 'Best Practices',
      items: [
        {
          subtitle: 'Priority Planning',
          description: 'Assign priorities based on mining plan, ore quality, accessibility, and business objectives.'
        },
        {
          subtitle: 'Task Limit Setting',
          description: 'Consider site size, equipment capacity, and safety requirements when setting limits.'
        },
        {
          subtitle: 'Regular Reviews',
          description: 'Update site priorities and limits as mining progresses and conditions change.'
        }
      ]
    }
  ]
};

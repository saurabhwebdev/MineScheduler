export const dashboardHelp = {
  title: 'Dashboard',
  icon: 'DashboardOutlined',
  sections: [
    {
      title: 'Overview',
      content: 'The Dashboard provides a quick overview of your mine scheduling system with real-time statistics and quick actions.'
    },
    {
      title: 'Statistics Cards',
      items: [
        {
          subtitle: 'Active Tasks',
          description: 'Shows the total number of tasks currently active in the system.'
        },
        {
          subtitle: 'Active Sites',
          description: 'Displays the count of mining sites that are currently operational.'
        },
        {
          subtitle: 'Equipment Available',
          description: 'Shows the number of equipment items that are available for use.'
        },
        {
          subtitle: 'Total Users',
          description: 'Displays the total count of users registered in the system.'
        }
      ]
    },
    {
      title: 'Quick Actions',
      items: [
        {
          subtitle: 'Add Task',
          description: 'Quickly create a new mining task from the dashboard.'
        },
        {
          subtitle: 'Add Delay',
          description: 'Record a delay incident that affects scheduling.'
        },
        {
          subtitle: 'Add Site',
          description: 'Add a new mining site to the system.'
        },
        {
          subtitle: 'Add Equipment',
          description: 'Register new equipment in the system.'
        }
      ]
    },
    {
      title: 'Recent Activity',
      content: 'View the latest changes and actions performed across all modules including tasks, delays, sites, equipment, and system configurations.'
    }
  ]
};

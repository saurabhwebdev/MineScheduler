export const auditHelp = {
  title: 'Audit Logs',
  icon: 'FileTextOutlined',
  sections: [
    {
      title: 'Overview',
      content: 'Audit Logs provide a comprehensive record of all system activities. Every create, update, and delete operation is tracked with user information, timestamps, and detailed change history.'
    },
    {
      title: 'Audit Log Information',
      items: [
        {
          subtitle: 'User',
          description: 'Name of the user who performed the action.'
        },
        {
          subtitle: 'Action',
          description: 'Type of operation: CREATE (new record), UPDATE (modified record), DELETE (removed record).'
        },
        {
          subtitle: 'Module',
          description: 'System module affected: TASK, DELAY, SITE, EQUIPMENT, CONSTANT, UOM, SHIFT, USER.'
        },
        {
          subtitle: 'Resource',
          description: 'Specific item affected by the action (e.g., task name, site name).'
        },
        {
          subtitle: 'Timestamp',
          description: 'Date and time when the action occurred.'
        },
        {
          subtitle: 'Details',
          description: 'Click the eye icon to view detailed change information including old and new values.'
        }
      ]
    },
    {
      title: 'Change Details',
      content: 'The detail view shows: Old Values - Data before the change, New Values - Data after the change, IP Address - Source IP of the request, User Agent - Browser and device information. This helps track exactly what changed and who made the change.'
    },
    {
      title: 'Filtering & Search',
      items: [
        {
          subtitle: 'Action Filter',
          description: 'Filter by CREATE, UPDATE, or DELETE actions to focus on specific types of changes.'
        },
        {
          subtitle: 'Module Filter',
          description: 'View logs for specific modules like Tasks, Sites, or Equipment.'
        },
        {
          subtitle: 'User Filter',
          description: 'See all actions performed by a specific user.'
        },
        {
          subtitle: 'Date Range',
          description: 'Filter logs by date to review activities during specific time periods.'
        },
        {
          subtitle: 'Sorting',
          description: 'Sort by any column to organize the audit trail. Most recent actions appear first by default.'
        }
      ]
    },
    {
      title: 'Use Cases',
      items: [
        {
          subtitle: 'Compliance & Accountability',
          description: 'Track who made what changes for regulatory compliance and internal governance.'
        },
        {
          subtitle: 'Troubleshooting',
          description: 'Identify when and by whom problematic changes were made.'
        },
        {
          subtitle: 'Security Monitoring',
          description: 'Monitor for unauthorized access or suspicious activities.'
        },
        {
          subtitle: 'Data Recovery',
          description: 'View previous values to understand data history or restore information.'
        },
        {
          subtitle: 'Training & Review',
          description: 'Review user actions for training purposes or performance evaluation.'
        }
      ]
    },
    {
      title: 'Best Practices',
      items: [
        {
          subtitle: 'Regular Reviews',
          description: 'Periodically review audit logs to ensure system integrity and user accountability.'
        },
        {
          subtitle: 'Incident Investigation',
          description: 'Use detailed change logs to investigate data issues or discrepancies.'
        },
        {
          subtitle: 'Export for Records',
          description: 'Export audit logs periodically for long-term archival and compliance requirements.'
        }
      ]
    },
    {
      title: 'Data Retention',
      content: 'Audit logs are permanently retained in the database. They cannot be modified or deleted by users, ensuring an immutable record of all system activities.'
    }
  ]
};

export const usersHelp = {
  title: 'User Management',
  icon: 'TeamOutlined',
  sections: [
    {
      title: 'Overview',
      content: 'User Management allows administrators to create, edit, and manage system users. Each user has a role that determines their access permissions and capabilities within the application.'
    },
    {
      title: 'User Roles',
      items: [
        {
          subtitle: 'Administrator',
          description: 'Full system access including: User management, Settings and constants configuration, All CRUD operations, Audit log access, System-wide permissions.'
        },
        {
          subtitle: 'User',
          description: 'Standard access for daily operations: View and manage tasks, delays, sites, equipment, Create and update data entries, View audit logs, Limited settings access.'
        }
      ]
    },
    {
      title: 'Creating Users (Admin Only)',
      items: [
        {
          subtitle: 'Name',
          description: 'User\'s full name for identification and audit trails.'
        },
        {
          subtitle: 'Email',
          description: 'Unique email address used for login. Must be valid and unique in the system.'
        },
        {
          subtitle: 'Password',
          description: 'Secure password meeting minimum requirements. Users can change their password later.'
        },
        {
          subtitle: 'Role',
          description: 'Assign Admin or User role. Choose carefully as this determines system permissions.'
        }
      ]
    },
    {
      title: 'Managing Users',
      items: [
        {
          subtitle: 'Edit User',
          description: 'Update user information including name and email. Password changes require special handling for security.'
        },
        {
          subtitle: 'Change Role',
          description: 'Administrators can promote users to admin or demote admins to standard users.'
        },
        {
          subtitle: 'Delete User',
          description: 'Permanently remove users from the system. Historical data (audit logs, created records) remains intact.'
        }
      ]
    },
    {
      title: 'Profile Management',
      content: 'All users can manage their own profile including: Basic Information (Name, Email), Employee Details (Phone, Department, Designation, Employee ID, Location, Gender, Bio). Changes to your own profile are reflected immediately and logged in the audit trail.'
    },
    {
      title: 'Profile Sections',
      items: [
        {
          subtitle: 'Basic Information',
          description: 'Essential login credentials: Full Name and Email address. These are required fields.'
        },
        {
          subtitle: 'Employee Details',
          description: 'Optional information for organizational purposes: Employee ID, Phone number, Department, Designation, Work location, Gender, Bio/Description.'
        }
      ]
    },
    {
      title: 'Role Management (Admin Only)',
      content: 'Administrators can create and manage custom roles to define granular permissions for users. This provides flexibility in access control beyond the default Admin and User roles.'
    },
    {
      title: 'Creating Roles',
      items: [
        {
          subtitle: 'Role Name',
          description: 'Unique identifier for the role (e.g., "Supervisor", "Viewer", "Data Entry").'
        },
        {
          subtitle: 'Description',
          description: 'Optional description explaining the purpose and scope of the role.'
        },
        {
          subtitle: 'Permissions',
          description: 'Define specific permissions for: Tasks, Delays, Equipment, Sites, Charts, Reports, Users, Settings, Audit Logs. Each module can have Read, Create, Update, and Delete permissions.'
        }
      ]
    },
    {
      title: 'Managing Roles',
      items: [
        {
          subtitle: 'Edit Role',
          description: 'Update role name, description, and permissions. Changes affect all users assigned to this role immediately.'
        },
        {
          subtitle: 'Delete Role',
          description: 'Remove custom roles from the system. Cannot delete default roles (Admin, User). Users with deleted roles may need to be reassigned.'
        },
        {
          subtitle: 'View Roles',
          description: 'Browse all roles and their permissions. See which users are assigned to each role.'
        }
      ]
    },
    {
      title: 'Security & Permissions',
      items: [
        {
          subtitle: 'Access Control',
          description: 'Users can only modify their own profile. Administrators can manage all user accounts and roles.'
        },
        {
          subtitle: 'Audit Trail',
          description: 'All user-related actions are logged including: User creation and deletion, Role changes and assignments, Profile updates, Login activities.'
        },
        {
          subtitle: 'Data Privacy',
          description: 'Passwords are encrypted and never displayed. Email addresses must be unique for security.'
        }
      ]
    }
  ]
};

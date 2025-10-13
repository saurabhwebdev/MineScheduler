import { dashboardHelp } from './dashboardHelp';
import { tasksHelp } from './tasksHelp';
import { delaysHelp } from './delaysHelp';
import { sitesHelp } from './sitesHelp';
import { equipmentHelp } from './equipmentHelp';
import { settingsHelp } from './settingsHelp';
import { usersHelp } from './usersHelp';
import { auditHelp } from './auditHelp';

export const helpContent = {
  dashboard: dashboardHelp,
  tasks: tasksHelp,
  delays: delaysHelp,
  sites: sitesHelp,
  equipment: equipmentHelp,
  settings: settingsHelp,
  users: usersHelp,
  profile: usersHelp, // Profile uses same help as users
  audit: auditHelp,
};

export const getHelpForPage = (pageName) => {
  return helpContent[pageName?.toLowerCase()] || null;
};

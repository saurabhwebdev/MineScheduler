export const settingsHelp = {
  title: 'Settings & Configuration',
  icon: 'SettingOutlined',
  sections: [
    {
      title: 'Overview',
      content: 'Settings allow you to configure the fundamental parameters that drive the scheduling system, including units of measurement, work shifts, and mining constants.'
    },
    {
      title: 'Unit of Measurement (UOM)',
      items: [
        {
          subtitle: 'Purpose',
          description: 'UOMs define how task durations are calculated using pattern matching. The UOM NAME determines which formula the scheduler uses. No formulas are stored - system matches names to built-in calculations.'
        },
        {
          subtitle: 'Creating a UOM',
          description: 'Name: Unique identifier (e.g., "area", "ton", "bogt", "bfp", "task"). The NAME triggers specific formulas. Description: Optional notes about the UOM. Click Add UOM to save.'
        },
        {
          subtitle: 'Pattern Matching',
          description: 'UOM names trigger formulas: "area"/"meter" → Area-based (planMeters/rate). "ton"/"tonne" → Tonnage-based. "bogt"/"bogger" → Bogging calculation. "bfp"/"backfill" → Backfill. Any other name → Fixed duration (task).'
        },
        {
          subtitle: 'Standard UOMs',
          description: 'Create these 5: "area" (drilling/charging), "ton" (tonnage), "bogt" (bogging), "bfp" (backfill), "task" (fixed). These cover all mining operation types.'
        },
        {
          subtitle: 'Managing UOMs',
          description: 'Edit: Change name or description. Delete: Warning - Tasks using this UOM will need updating. Import/Export: Bulk manage UOMs via Excel.'
        }
      ]
    },
    {
      title: 'Shift Management',
      items: [
        {
          subtitle: 'Purpose',
          description: 'Shifts define work periods and shift change durations. The scheduling algorithm uses this to allocate tasks within available working hours.'
        },
        {
          subtitle: 'Shift Configuration',
          description: 'Shift Name: Descriptive name (e.g., "Day Shift", "Night Shift"). Shift Code: Unique identifier (auto-uppercase). Start/End Time: Define working hours. Shift Change Duration: Time allocated for handover (minutes). Color: Visual identification in schedules.'
        },
        {
          subtitle: 'Shift Types',
          description: 'Create multiple shifts for 24/7 operations: Day (e.g., 06:00-18:00), Night (e.g., 18:00-06:00), General (for administrative tasks).'
        },
        {
          subtitle: 'Shift Change Impact',
          description: 'Shift change durations are automatically deducted from available working hours to account for handover time.'
        }
      ]
    },
    {
      title: 'Mining Constants',
      items: [
        {
          subtitle: 'Purpose',
          description: 'Constants are fixed values used in scheduling calculations (e.g., WIDTH, HEIGHT, DENSITY). These drive duration estimates for different task types.'
        },
        {
          subtitle: 'Creating Constants',
          description: 'Keyword: Uppercase name (e.g., "WIDTH", "DENSITY"). Value: Numeric value. Unit: Measurement unit (e.g., "meters", "tonnes/m³"). Category: Mining, Calculation, System, or Other. Status: Active constants are used in calculations.'
        },
        {
          subtitle: 'Admin Access',
          description: 'Only administrators can create, edit, or delete constants to maintain system integrity.'
        },
        {
          subtitle: 'Common Constants',
          description: 'WIDTH: Standard excavation width. HEIGHT: Standard excavation height. DENSITY: Material density for tonnage calculations. These are used in formulas to calculate task durations.'
        }
      ]
    },
    {
      title: 'Import/Export',
      content: 'All settings modules support bulk import/export via Excel files. This enables: Backup and restore of configurations, Quick setup for new installations, Sharing configurations across systems, Offline editing and batch updates.'
    },
    {
      title: 'Best Practices',
      items: [
        {
          subtitle: 'UOM Planning',
          description: 'Create UOMs that match your actual measurement practices. Consistency is key for accurate scheduling.'
        },
        {
          subtitle: 'Shift Planning',
          description: 'Ensure shift times align with actual operations. Update shift change durations based on real handover times.'
        },
        {
          subtitle: 'Constant Accuracy',
          description: 'Use accurate mining constants based on geological surveys and operational data. Review and update constants periodically.'
        },
        {
          subtitle: 'Regular Backups',
          description: 'Export settings regularly for backup. This protects against accidental changes or data loss.'
        }
      ]
    }
  ]
};

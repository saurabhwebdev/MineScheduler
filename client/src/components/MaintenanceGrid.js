import React from 'react';
import { Tooltip } from 'antd';
import { ToolOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import './MaintenanceGrid.css';

const MaintenanceGrid = ({ equipment }) => {
  const gridDays = 30; // Show 30 days

  const getMaintenanceColor = (percentUsed) => {
    if (percentUsed >= 100) return '#ff4d4f'; // Red - Overdue
    if (percentUsed >= 80) return '#fa8c16'; // Orange - Due Soon
    return '#52c41a'; // Green - Good
  };

  const getMaintenanceIcon = (percentUsed) => {
    if (percentUsed >= 100) return <WarningOutlined />;
    if (percentUsed >= 80) return <WarningOutlined />;
    return <CheckCircleOutlined />;
  };

  const getStatusText = (percentUsed) => {
    if (percentUsed >= 100) return 'OVERDUE';
    if (percentUsed >= 80) return 'DUE SOON';
    return 'GOOD';
  };

  // Calculate projected maintenance days
  const getMaintenanceDays = (eq) => {
    if (!eq.maintenanceInterval || eq.maintenanceInterval === 0) return [];
    
    const hoursPerDay = 8; // Assume 8 hours operation per day
    const daysUntilMaintenance = eq.hoursUntilMaintenance / hoursPerDay;
    
    const maintenanceDays = [];
    for (let day = 0; day < gridDays; day++) {
      if (day === Math.floor(daysUntilMaintenance)) {
        maintenanceDays.push(day);
      }
    }
    
    return maintenanceDays;
  };

  return (
    <div className="maintenance-grid-wrapper">
      <div className="maintenance-grid-scroll">
        <table className="maintenance-grid">
          <thead>
            <tr>
              <th className="equipment-col">Equipment</th>
              <th className="status-col">Status</th>
              <th className="hours-col">Hours</th>
              {Array.from({ length: gridDays }, (_, i) => (
                <th key={i} className="day-col">
                  D{i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {equipment.map(eq => {
              const percentUsed = parseFloat(eq.percentUsed);
              const color = getMaintenanceColor(percentUsed);
              const maintenanceDays = getMaintenanceDays(eq);
              const statusText = getStatusText(percentUsed);

              return (
                <tr key={eq._id} className={eq.status !== 'operational' ? 'equipment-inactive' : ''}>
                  <td className="equipment-cell">
                    <strong>{eq.equipmentId}</strong>
                    <div className="equipment-name">{eq.name}</div>
                  </td>
                  <td className="status-cell">
                    <div className="status-indicator" style={{ backgroundColor: color }}>
                      {getMaintenanceIcon(percentUsed)}
                      <span>{statusText}</span>
                    </div>
                  </td>
                  <td className="hours-cell">
                    <div>{eq.operatingHours}h</div>
                    <div className="interval-text">/ {eq.maintenanceInterval}h</div>
                  </td>
                  {Array.from({ length: gridDays }, (_, day) => {
                    const isMaintenanceDay = maintenanceDays.includes(day);
                    const isOperational = eq.status === 'operational';
                    
                    return (
                      <Tooltip 
                        key={day}
                        title={isMaintenanceDay ? `Maintenance scheduled` : `Day ${day + 1}`}
                      >
                        <td 
                          className={`day-cell ${isMaintenanceDay ? 'maintenance-day' : ''}`}
                          style={{
                            backgroundColor: isMaintenanceDay 
                              ? color 
                              : isOperational 
                                ? '#f0f0f0' 
                                : '#ffffff'
                          }}
                        >
                          {isMaintenanceDay && (
                            <div className="maintenance-marker">
                              <ToolOutlined />
                            </div>
                          )}
                        </td>
                      </Tooltip>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaintenanceGrid;

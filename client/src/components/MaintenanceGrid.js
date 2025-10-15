import React, { useState, useEffect } from 'react';
import { Tooltip, Spin } from 'antd';
import { ToolOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import config from '../config/config';
import './MaintenanceGrid.css';

const MaintenanceGrid = ({ equipment }) => {
  const gridHours = 24; // Show 24 hours
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch current schedule to see equipment usage
  useEffect(() => {
    fetchSchedule();
  }, []);

  // Update current time every second for time indicator
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/schedule/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ gridHours, delayedSlots: [] }),
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        setScheduleData(data.data);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // Check if equipment is assigned to a task
  const isEquipmentInUse = (eq, hour) => {
    if (!scheduleData || !scheduleData.grid) return false;
    
    // Check if any site is running a task that this equipment is assigned to
    for (const siteId in scheduleData.grid) {
      const taskId = scheduleData.grid[siteId][hour];
      if (taskId && eq.assignedTasks && eq.assignedTasks.includes(taskId)) {
        return { inUse: true, taskId, siteId };
      }
    }
    return { inUse: false };
  };

  // Check if hour is suitable for maintenance (equipment not in use)
  const isMaintenanceWindow = (eq, hour) => {
    const usage = isEquipmentInUse(eq, hour);
    return !usage.inUse && eq.status === 'operational';
  };

  // Calculate time indicator position
  const getTimeIndicatorPosition = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();
    
    // Column labeled "11h" (index 10) represents time 11:00-11:59
    // At 11:29 AM, hours=11, should be in column index 10 (labeled "11h")
    // Formula: columnIndex = hours - 1 (since column "1h" is index 0)
    // At 00:29 AM (midnight), hours=0, should be in column index 0 (labeled "1h") - but 0-1=-1!
    // Special case: hour 0 wraps to hour 24 in 24h display, OR it's in column 0
    
    // For correct positioning: columns 1-24 represent hours 1-24 (not 0-23)
    // But getHours() returns 0-23, so we need to convert
    // Hour 0 (midnight) should show in column "24h" (index 23) OR column "1h" (index 0)
    // Typically, hour 0 = column "1h" for daily schedules
    
    const hourIn24Format = hours === 0 ? 24 : hours; // Convert 0 to 24
    const currentHourDecimal = (hourIn24Format - 1) + minutes / 60 + seconds / 3600;
    
    const gridWidthPx = gridHours * 45;
    const percentageWithinGrid = (currentHourDecimal / gridHours) * 100;
    
    return { gridWidthPx, percentageWithinGrid };
  };

  const { gridWidthPx, percentageWithinGrid } = getTimeIndicatorPosition();
  const showTimeIndicator = percentageWithinGrid >= 0 && percentageWithinGrid <= 100;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" tip="Loading equipment schedule..." />
      </div>
    );
  }

  return (
    <div className="maintenance-grid-wrapper">
      <div className="maintenance-grid-scroll">
        {showTimeIndicator && (
          <div 
            className="time-indicator-line" 
            style={{ left: `calc(490px + (${gridWidthPx}px * ${percentageWithinGrid} / 100))` }}
            title={`Current Time: ${currentTime.toLocaleTimeString()}`}
          >
            <div className="time-indicator-dot"></div>
          </div>
        )}
        <table className="maintenance-grid">
          <thead>
            <tr>
              <th className="equipment-col">Equipment</th>
              <th className="status-col">Status</th>
              <th className="hours-col">Hours</th>
              <th className="task-col">Assigned Tasks</th>
              {Array.from({ length: gridHours }, (_, i) => (
                <th key={i} className="hour-col">
                  {i + 1}h
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {equipment.map(eq => {
              const percentUsed = parseFloat(eq.percentUsed);
              const color = getMaintenanceColor(percentUsed);
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
                  <td className="task-cell">
                    {eq.assignedTasks && eq.assignedTasks.length > 0 
                      ? eq.assignedTasks.join(', ') 
                      : 'None'}
                  </td>
                  {Array.from({ length: gridHours }, (_, hour) => {
                    const usage = isEquipmentInUse(eq, hour);
                    const isMaintWindow = isMaintenanceWindow(eq, hour);
                    
                    let cellColor = '#ffffff';
                    let cellIcon = null;
                    let tooltipText = `Hour ${hour + 1}`;
                    
                    if (usage.inUse) {
                      // Equipment in use (task running)
                      cellColor = '#52c41a'; // Green
                      tooltipText = `IN USE: ${usage.taskId} at ${usage.siteId}`;
                    } else if (isMaintWindow) {
                      // Available for maintenance
                      cellColor = '#1890ff'; // Blue
                      cellIcon = <ToolOutlined />;
                      tooltipText = 'Available for Maintenance';
                    } else if (eq.status !== 'operational') {
                      // Equipment not operational
                      cellColor = '#f0f0f0';
                      tooltipText = `${eq.status}`;
                    } else {
                      // Idle/Available
                      cellColor = '#f9f9f9';
                      tooltipText = 'Idle';
                    }
                    
                    return (
                      <Tooltip key={hour} title={tooltipText}>
                        <td 
                          className={`hour-cell ${usage.inUse ? 'in-use' : ''} ${isMaintWindow ? 'maintenance-available' : ''}`}
                          style={{ backgroundColor: cellColor }}
                        >
                          {usage.inUse && <span className="usage-marker">{usage.taskId}</span>}
                          {cellIcon && <div className="maintenance-marker">{cellIcon}</div>}
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

import React, { useState } from 'react';
import { Tooltip } from 'antd';
import DelayModal from './DelayModal';

const ScheduleCell = ({ 
  siteId, 
  hour, 
  taskId, 
  taskColor, 
  isActive, 
  isDelayed,
  isCurrentHour,
  onAddDelay,
  onRemoveDelay 
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  const handleClick = () => {
    if (isDelayed) {
      // If already delayed, offer to remove
      if (window.confirm(`Remove delay from ${siteId} at hour ${hour + 1}?`)) {
        onRemoveDelay(siteId, hour);
      }
    } else {
      // Open modal to add delay
      setModalVisible(true);
    }
  };

  const handleModalSubmit = (delayData) => {
    onAddDelay(delayData);
    setModalVisible(false);
  };

  const getCellStyle = () => {
    const baseStyle = {};

    if (!isActive) {
      return {
        backgroundColor: '#444',
        color: '#aaa'
      };
    }

    if (isDelayed) {
      return {
        backgroundColor: '#ff4d4f',
        position: 'relative'
      };
    }

    if (taskId && taskColor) {
      baseStyle.backgroundColor = taskColor;
    }

    // Add current hour indicator overlay
    if (isCurrentHour && !isDelayed) {
      baseStyle.boxShadow = 'inset 0 0 0 2px #fa8c16';
      baseStyle.position = 'relative';
    }

    return baseStyle;
  };

  const tooltipTitle = () => {
    if (isDelayed) return `Delayed - Click to remove`;
    if (taskId) return `${taskId} - Click to add delay`;
    return 'Empty - Click to add delay';
  };

  return (
    <>
      <Tooltip title={tooltipTitle()} placement="top">
        <td 
          className={`schedule-cell ${isDelayed ? 'delayed' : ''} ${taskId ? 'has-task' : ''} ${isCurrentHour ? 'current-hour-col' : ''}`}
          style={getCellStyle()}
          onClick={handleClick}
          data-site={siteId}
          data-hour={hour}
        >
          {isDelayed && (
            <div className="delay-overlay">
              <span className="delay-icon">⚠</span>
            </div>
          )}
          {taskId && !isDelayed && (
            <span className="task-label">{taskId}</span>
          )}
          {!taskId && !isDelayed && (
            <span className="empty-label">&nbsp;</span>
          )}
        </td>
      </Tooltip>
      
      <DelayModal
        visible={modalVisible}
        siteId={siteId}
        hour={hour}
        onClose={() => setModalVisible(false)}
        onSubmit={handleModalSubmit}
      />
    </>
  );
};

export default ScheduleCell;

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
      return {
        backgroundColor: taskColor
      };
    }

    return {};
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
          className={`schedule-cell ${isDelayed ? 'delayed' : ''} ${taskId ? 'has-task' : ''}`}
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

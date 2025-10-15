import React, { useState } from 'react';
import { Tooltip, notification } from 'antd';
import DelayModal from './DelayModal';

const ScheduleCell = ({ 
  siteId, 
  hour, 
  taskId, 
  taskColor, 
  isActive, 
  isDelayed,
  delayInfo,
  delayColor,
  isCurrentHour,
  onAddDelay,
  onRemoveDelay 
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  const handleClick = () => {
    if (isDelayed) {
      // Check if this is an automatic shift changeover delay
      if (delayInfo && delayInfo.isAutomatic && delayInfo.code === 'SHIFT_CHANGE') {
        // Don't allow removal of automatic shift changeover delays
        notification.warning({
          message: 'Automatic Delay',
          description: 'Shift changeover delays are automatic and cannot be removed manually. Configure shifts in Settings.',
          duration: 4
        });
        return;
      }
      
      // Allow removal of manual delays
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
        color: '#aaa',
        ...(isCurrentHour ? { boxShadow: 'inset 0 0 0 2px rgba(255, 255, 255, 0.3)' } : {})
      };
    }

    if (isDelayed) {
      return {
        backgroundColor: delayColor || '#ff4d4f',
        position: 'relative',
        ...(isCurrentHour ? { boxShadow: 'inset 0 0 0 2px rgba(255, 255, 255, 0.4)' } : {})
      };
    }

    if (taskId && taskColor) {
      return {
        backgroundColor: taskColor,
        ...(isCurrentHour ? { boxShadow: 'inset 0 0 0 2px rgba(255, 255, 255, 0.4)' } : {})
      };
    }

    // Empty cell
    if (isCurrentHour) {
      return {
        backgroundColor: 'rgba(60, 202, 112, 0.08)',
        boxShadow: 'inset 0 0 0 2px rgba(60, 202, 112, 0.2)'
      };
    }

    return baseStyle;
  };

  const tooltipTitle = () => {
    if (isDelayed) {
      if (delayInfo && delayInfo.isAutomatic && delayInfo.code === 'SHIFT_CHANGE') {
        return `Shift Changeover: ${delayInfo.comments || 'Automatic delay'}`;
      }
      return `Delayed - Click to remove`;
    }
    if (taskId) return `${taskId} - Click to add delay`;
    return 'Empty - Click to add delay';
  };

  return (
    <>
      <Tooltip title={tooltipTitle()} placement="top">
        <td 
          className={`schedule-cell ${isDelayed ? 'delayed' : ''} ${taskId ? 'has-task' : ''} ${isCurrentHour ? 'current-hour-cell' : ''}`}
          style={getCellStyle()}
          onClick={handleClick}
          data-site={siteId}
          data-hour={hour}
        >
          {isDelayed && (
            <div className="delay-overlay">
              {delayInfo && delayInfo.isAutomatic && delayInfo.code === 'SHIFT_CHANGE' ? (
                <>
                  <span className="delay-icon shift-change-icon">↻</span>
                  <span className="shift-change-label">{delayInfo.shiftCode || 'SHIFT'}</span>
                </>
              ) : (
                <span className="delay-icon">⚠</span>
              )}
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

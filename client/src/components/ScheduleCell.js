import React, { useState } from 'react';
import { Tooltip, notification, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import DelayModal from './DelayModal';

const ScheduleCell = ({ 
  siteId, 
  hour, 
  taskId, 
  taskColor, 
  isActive, 
  isDelayed,
  delayInfo,
  allDelays = [],
  hasMultipleDelays = false,
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
      
      // Show styled confirmation modal for removing manual delays
      Modal.confirm({
        title: 'Remove Delay',
        icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
        content: (
          <div>
            <p style={{ marginBottom: '12px', fontSize: '14px' }}>Are you sure you want to remove this delay?</p>
            <div style={{ 
              background: '#f5f5f5', 
              padding: '12px', 
              borderRadius: '8px',
              fontSize: '13px'
            }}>
              <div><strong>Site:</strong> {siteId}</div>
              <div><strong>Hour:</strong> {hour + 1}</div>
              {delayInfo?.category && <div><strong>Category:</strong> {delayInfo.category}</div>}
              {delayInfo?.code && <div><strong>Code:</strong> {delayInfo.code}</div>}
            </div>
          </div>
        ),
        okText: 'Remove',
        cancelText: 'Cancel',
        okButtonProps: {
          danger: true,
          style: {
            background: '#ff4d4f',
            borderColor: '#ff4d4f',
            height: '38px',
            fontWeight: 600
          }
        },
        cancelButtonProps: {
          style: {
            height: '38px',
            fontWeight: 600
          }
        },
        centered: true,
        width: 440,
        onOk: () => {
          onRemoveDelay(siteId, hour);
        }
      });
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
      if (hasMultipleDelays && allDelays.length > 1) {
        // Get colors for diagonal split (first two delays)
        const delay1Color = allDelays[0]?.color || (allDelays[0]?.isAutomatic && allDelays[0]?.code === 'SHIFT_CHANGE' ? '#d3d3d3' : '#ff4d4f');
        const delay2Color = allDelays[1]?.color || (allDelays[1]?.isAutomatic && allDelays[1]?.code === 'SHIFT_CHANGE' ? '#d3d3d3' : '#ff4d4f');
        
        return {
          background: `linear-gradient(to bottom right, ${delay1Color} 0%, ${delay1Color} 49%, transparent 49%, transparent 51%, ${delay2Color} 51%, ${delay2Color} 100%)`,
          position: 'relative'
        };
      }
      
      return {
        backgroundColor: delayColor || '#ff4d4f',
        position: 'relative'
      };
    }

    if (taskId && taskColor) {
      // Desaturate task colors for a more minimal, professional look
      return {
        backgroundColor: `${taskColor}30`, // 30 = ~19% opacity for pastel effect
        borderLeft: `4px solid ${taskColor}`
      };
    }

    return baseStyle;
  };

  const tooltipTitle = () => {
    if (isDelayed) {
      if (hasMultipleDelays && allDelays.length > 0) {
        // Show all delays in tooltip
        const delayDescriptions = allDelays.map((d, idx) => {
          if (d.isAutomatic && d.code === 'SHIFT_CHANGE') {
            return `${idx + 1}. Shift Changeover: ${d.shiftCode || d.comments || 'Automatic'}`;
          }
          return `${idx + 1}. ${d.category || ''} - ${d.code || ''}: ${d.comments || 'Manual delay'}`;
        });
        return (
          <div style={{ textAlign: 'left' }}>
            <strong>Multiple Delays ({allDelays.length}):</strong>
            {delayDescriptions.map((desc, idx) => (
              <div key={idx} style={{ marginTop: '4px', fontSize: '11px' }}>{desc}</div>
            ))}
            <div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.8 }}>Click to remove</div>
          </div>
        );
      }
      if (delayInfo && delayInfo.isAutomatic && delayInfo.code === 'SHIFT_CHANGE') {
        return `Shift Changeover: ${delayInfo.comments || 'Automatic delay'}`;
      }
      return `${delayInfo?.category || ''} - ${delayInfo?.code || ''} - Click to remove`;
    }
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
              {hasMultipleDelays ? (
                <>
                  <span className="delay-icon">D</span>
                  <span className="multiple-delay-badge">{allDelays.length}</span>
                </>
              ) : delayInfo && delayInfo.isAutomatic && delayInfo.code === 'SHIFT_CHANGE' ? (
                <>
                  <span className="delay-icon shift-change-icon">SC</span>
                  <span className="shift-change-label">{delayInfo.shiftCode || 'SHIFT'}</span>
                </>
              ) : (
                <span className="delay-icon">D</span>
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

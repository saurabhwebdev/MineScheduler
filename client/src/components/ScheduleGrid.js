import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from 'antd';
import ScheduleCell from './ScheduleCell';
import './ScheduleGrid.css';

const ScheduleGrid = ({ scheduleData, delayedSlots, onToggleSite, onAddDelay, onRemoveDelay }) => {
  const [sortDirection, setSortDirection] = useState('desc'); // 'none', 'asc', 'desc'
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [toggleModalVisible, setToggleModalVisible] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);

  const { grid, gridHours, sitePriority, siteActive, taskColors, shifts = [] } = scheduleData;

  // Update current hour every minute
  useEffect(() => {
    const updateCurrentHour = () => {
      setCurrentHour(new Date().getHours());
    };
    
    updateCurrentHour(); // Set immediately
    const interval = setInterval(updateCurrentHour, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Calculate shift for a given hour based on shifts from backend
  // Supports both 24-hour and 48-hour grids
  const getShiftForHour = (hour) => {
    // For 48-hour grids, map hours 24-47 back to 0-23
    const hourIn24 = hour % 24;
    
    if (!shifts || shifts.length === 0) {
      // Fallback to default shifts if none configured
      if (hourIn24 >= 6 && hourIn24 < 14) return { name: 'A', code: 'A', color: '#52c41a' };
      if (hourIn24 >= 14 && hourIn24 < 22) return { name: 'B', code: 'B', color: '#1890ff' };
      return { name: 'C', code: 'C', color: '#722ed1' };
    }

    // Find which shift this hour belongs to
    for (const shift of shifts) {
      const [startHour] = shift.startTime.split(':').map(Number);
      const [endHour] = shift.endTime.split(':').map(Number);

      if (startHour < endHour) {
        // Same-day shift
        if (hourIn24 >= startHour && hourIn24 < endHour) {
          return { name: shift.shiftName, code: shift.shiftCode, color: shift.color };
        }
      } else {
        // Overnight shift
        if (hourIn24 >= startHour || hourIn24 < endHour) {
          return { name: shift.shiftName, code: shift.shiftCode, color: shift.color };
        }
      }
    }

    // Default if no match
    return { name: 'N/A', code: 'N/A', color: '#8c8c8c' };
  };

  // Check if a given hour column is the current hour
  const isCurrentHour = (hour) => {
    // Only highlight the actual current hour, not repeating hours in multi-day grids
    // For 6/12/24-hour grids: highlight if hour matches current hour
    // For 48-hour grid: only highlight current hour (0-23), not tomorrow's same hour (24-47)
    return hour === currentHour;
  };

  // Sort sites: Active first, then inactive, with sorting within each group
  const sortedSites = useMemo(() => {
    const sites = Object.keys(grid);
    const activeSites = sites.filter(s => siteActive[s]);
    const inactiveSites = sites.filter(s => !siteActive[s]);

    const sortSiteGroup = (siteList) => {
      if (sortDirection === 'none') {
        // Original order (by priority)
        return siteList.sort((a, b) => sitePriority[a] - sitePriority[b]);
      }

      // Sort with G7/G8 grouping
      return siteList.sort((a, b) => {
        // Extract group (3rd character)
        const getGroup = (name) => {
          const s = (name || '').replace(/\s+/g, '');
          const ch = s.length >= 3 ? s[2] : '';
          if (ch === '7') return 'G7';
          if (ch === '8') return 'G8';
          return 'OTHER';
        };

        const groupA = getGroup(a);
        const groupB = getGroup(b);

        // Group rank based on direction
        const getGroupRank = (group) => {
          if (sortDirection === 'asc') {
            if (group === 'G8') return 0;
            if (group === 'G7') return 1;
            return 2;
          } else {
            if (group === 'G7') return 0;
            if (group === 'G8') return 1;
            return 2;
          }
        };

        const rankA = getGroupRank(groupA);
        const rankB = getGroupRank(groupB);

        if (rankA !== rankB) return rankA - rankB;

        // Tie-breaker: string compare
        const cmp = a.toLowerCase().localeCompare(b.toLowerCase(), undefined, {
          numeric: true,
          sensitivity: 'base'
        });
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    };

    // Combine: active sites first, then inactive sites
    return [...sortSiteGroup(activeSites), ...sortSiteGroup(inactiveSites)];
  }, [grid, sortDirection, siteActive, sitePriority]);

  const handleSortClick = () => {
    setSortDirection(prev => {
      if (prev === 'none') return 'asc';
      if (prev === 'asc') return 'desc';
      return 'none';
    });
  };

  const getSortIndicator = () => {
    if (sortDirection === 'none') return '⬍';
    if (sortDirection === 'asc') return '▲';
    return '▼';
  };

  const getDelayInfo = (site, hour) => {
    return delayedSlots.find(d => d.row === site && d.hourIndex === hour);
  };

  // Get shift color for a delay if it's a shift changeover
  const getDelayColor = (delayInfo) => {
    if (!delayInfo) return null;
    
    // If this is an automatic shift changeover delay
    if (delayInfo.isAutomatic && delayInfo.code === 'SHIFT_CHANGE') {
      console.log('SHIFT CHANGEOVER DELAY:', delayInfo);
      console.log('Available shifts:', shifts);
      
      // ALWAYS return light grey for shift changeover
      return '#d3d3d3'; // Light grey
      
      // Original logic (commented for debugging):
      // const shift = shifts.find(s => s.shiftCode === delayInfo.shiftCode);
      // if (shift && shift.color) {
      //   return shift.color;
      // }
    }
    
    // Default delay color (red for manual delays)
    return '#ff4d4f';
  };

  const handleSiteClick = (siteId) => {
    setSelectedSite({ id: siteId, isActive: siteActive[siteId] });
    setToggleModalVisible(true);
  };

  const handleConfirmToggle = () => {
    if (selectedSite) {
      onToggleSite(selectedSite.id);
      setToggleModalVisible(false);
      setSelectedSite(null);
    }
  };

  const handleCancelToggle = () => {
    setToggleModalVisible(false);
    setSelectedSite(null);
  };

  return (
    <div className="schedule-grid-wrapper">
      <div className="schedule-grid-scroll">
        <table className="schedule-grid">
          <thead>
            {/* Shift Row */}
            <tr className="shift-row">
              <th className="priority-col shift-cell"></th>
              <th className="site-col shift-cell">Shift</th>
              {Array.from({ length: gridHours }, (_, i) => {
                const shift = getShiftForHour(i);
                return (
                  <th 
                    key={i} 
                    className="hour-col shift-cell"
                    style={{ backgroundColor: shift.color, color: '#ffffff' }}
                    title={`${shift.name} - ${shift.code}`}
                  >
                    {shift.code}
                  </th>
                );
              })}
            </tr>
            {/* Hour Row */}
            <tr>
              <th className="priority-col">P</th>
              <th 
                className="site-col sortable" 
                onClick={handleSortClick}
                data-sort-direction={sortDirection}
              >
                <span>Site</span>
                <span className="sort-indicator">{getSortIndicator()}</span>
              </th>
              {Array.from({ length: gridHours }, (_, i) => (
                <th 
                  key={i} 
                  className={`hour-col ${isCurrentHour(i) ? 'current-hour' : ''}`}
                >
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedSites.map(siteId => {
              const isActive = siteActive[siteId];
              const priority = sitePriority[siteId];

              return (
                <tr 
                  key={siteId} 
                  className={!isActive ? 'inactive-site' : ''}
                >
                  <td className="priority-cell">{priority}</td>
                  <td className="site-cell">
                    <a 
                      href="#!" 
                      className="site-toggle"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSiteClick(siteId);
                      }}
                      title={`Click to ${isActive ? 'deactivate' : 'activate'} site`}
                    >
                      {siteId}
                    </a>
                  </td>
                  {Array.from({ length: gridHours }, (_, hour) => {
                    const taskId = grid[siteId][hour];
                    const taskColor = taskId ? taskColors[taskId] : null;
                    const delayInfo = getDelayInfo(siteId, hour);
                    const delayed = !!delayInfo;
                    const delayColor = getDelayColor(delayInfo);

                    return (
                      <ScheduleCell
                        key={hour}
                        siteId={siteId}
                        hour={hour}
                        taskId={taskId}
                        taskColor={taskColor}
                        isActive={isActive}
                        isDelayed={delayed}
                        delayInfo={delayInfo}
                        delayColor={delayColor}
                        isCurrentHour={isCurrentHour(hour)}
                        onAddDelay={onAddDelay}
                        onRemoveDelay={onRemoveDelay}
                      />
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modern Toggle Modal */}
      <Modal
        open={toggleModalVisible}
        onOk={handleConfirmToggle}
        onCancel={handleCancelToggle}
        okText={selectedSite?.isActive ? 'Deactivate' : 'Activate'}
        cancelText="Cancel"
        centered
        width={480}
        okButtonProps={{ 
          style: { 
            backgroundColor: selectedSite?.isActive ? '#ff4d4f' : '#3cca70',
            borderColor: selectedSite?.isActive ? '#ff4d4f' : '#3cca70',
            height: '40px',
            fontSize: '14px',
            fontWeight: 600
          } 
        }}
        cancelButtonProps={{
          style: {
            height: '40px',
            fontSize: '14px',
            borderColor: '#d9d9d9'
          }
        }}
      >
        <div style={{ padding: '20px 0' }}>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 600, 
            color: '#1f2937', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: selectedSite?.isActive ? '#fff1f0' : '#e6f9f0',
              color: selectedSite?.isActive ? '#ff4d4f' : '#3cca70',
              fontSize: '20px'
            }}>
              {selectedSite?.isActive ? '⏸' : '▶'}
            </span>
            Toggle Site Status
          </div>
          <div style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            lineHeight: 1.6,
            marginBottom: '16px'
          }}>
            {selectedSite?.isActive ? (
              <>
                Are you sure you want to <strong style={{ color: '#ff4d4f' }}>deactivate</strong> site <strong style={{ color: '#062d54' }}>{selectedSite?.id}</strong>?
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fff7e6', borderRadius: '8px', fontSize: '13px' }}>
                  ⚠️ Deactivated sites will be <strong>excluded from scheduling</strong> but remain visible in the grid.
                </div>
              </>
            ) : (
              <>
                Are you sure you want to <strong style={{ color: '#3cca70' }}>activate</strong> site <strong style={{ color: '#062d54' }}>{selectedSite?.id}</strong>?
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#e6f9f0', borderRadius: '8px', fontSize: '13px' }}>
                  ✓ Activated sites will be <strong>included in scheduling</strong> on the next generation.
                </div>
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ScheduleGrid;

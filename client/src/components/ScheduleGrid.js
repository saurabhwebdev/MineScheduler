import React, { useState, useMemo, useEffect } from 'react';
import { Modal, Button, Radio, Tag } from 'antd';
import { FullscreenExitOutlined, FilterOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import ScheduleCell from './ScheduleCell';
import DelayModal from './DelayModal';
import './ScheduleGrid.css';

const ScheduleGrid = ({ scheduleData, delayedSlots, onToggleSite, onAddDelay, onRemoveDelay }) => {
  const { t } = useTranslation();
  const [sortDirection, setSortDirection] = useState('desc'); // 'none', 'asc', 'desc'
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [toggleModalVisible, setToggleModalVisible] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [globalDelayModalVisible, setGlobalDelayModalVisible] = useState(false);
  const [selectedHourForGlobalDelay, setSelectedHourForGlobalDelay] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedShiftFilter, setSelectedShiftFilter] = useState('all');

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

  // Handle fullscreen changes and apply scaling
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFS = !!document.fullscreenElement;
      setIsFullscreen(isFS);
      
      if (isFS) {
        // Wait for fullscreen transition, then calculate scale
        setTimeout(() => {
          const table = document.querySelector('.schedule-grid');
          const wrapper = document.querySelector('.schedule-grid-wrapper');
          
          if (table && wrapper) {
            const tableWidth = table.offsetWidth;
            const tableHeight = table.offsetHeight;
            const viewportWidth = window.innerWidth - 32; // padding
            const viewportHeight = window.innerHeight - 32; // padding
            
            // Calculate scale to fit both width and height
            const scaleX = viewportWidth / tableWidth;
            const scaleY = viewportHeight / tableHeight;
            const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
            
            table.style.transform = `scale(${scale})`;
          }
        }, 100);
      } else {
        // Reset scale when exiting fullscreen
        const table = document.querySelector('.schedule-grid');
        if (table) {
          table.style.transform = '';
        }
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
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

  // Get filtered hours based on selected shift
  const getFilteredHours = useMemo(() => {
    if (selectedShiftFilter === 'all') {
      return Array.from({ length: gridHours }, (_, i) => i);
    }

    const selectedShift = shifts.find(s => s._id === selectedShiftFilter);
    if (!selectedShift) {
      return Array.from({ length: gridHours }, (_, i) => i);
    }

    const [startHour] = selectedShift.startTime.split(':').map(Number);
    const [endHour] = selectedShift.endTime.split(':').map(Number);
    const hoursArray = [];

    // Handle same-day shift
    if (startHour < endHour) {
      for (let h = startHour; h < endHour; h++) {
        hoursArray.push(h);
        // For 48-hour grids, also include next day's hours
        if (gridHours > 24 && h + 24 < gridHours) {
          hoursArray.push(h + 24);
        }
      }
    } else {
      // Handle overnight shift (e.g., 22:00 - 06:00)
      // First part: from startHour to end of day
      for (let h = startHour; h < 24; h++) {
        hoursArray.push(h);
      }
      // Second part: from start of day to endHour
      for (let h = 0; h < endHour; h++) {
        hoursArray.push(h);
      }
      // For 48-hour grids
      if (gridHours > 24) {
        for (let h = startHour + 24; h < gridHours; h++) {
          hoursArray.push(h);
        }
        for (let h = 24; h < 24 + endHour && h < gridHours; h++) {
          hoursArray.push(h);
        }
      }
    }

    return hoursArray.sort((a, b) => a - b);
  }, [selectedShiftFilter, shifts, gridHours]);

  // Get active shifts (only show active shifts in filter)
  const activeShifts = useMemo(() => {
    if (!shifts || shifts.length === 0) {
      // Return default shifts if none configured
      return [
        { _id: 'shift-a', shiftName: 'Day Shift', shiftCode: 'A', startTime: '06:00', endTime: '14:00', color: '#52c41a', isActive: true },
        { _id: 'shift-b', shiftName: 'Night Shift', shiftCode: 'B', startTime: '14:00', endTime: '22:00', color: '#1890ff', isActive: true },
        { _id: 'shift-c', shiftName: 'General', shiftCode: 'C', startTime: '22:00', endTime: '06:00', color: '#722ed1', isActive: true }
      ];
    }
    return shifts.filter(s => s.isActive);
  }, [shifts]);

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
    // Return ALL delays for this cell (can be multiple)
    return delayedSlots.filter(d => d.row === site && d.hourIndex === hour);
  };

  const getPrimaryDelay = (delays) => {
    if (!delays || delays.length === 0) return null;
    // Prioritize manual delays over automatic shift changeovers
    const manualDelay = delays.find(d => !d.isAutomatic);
    return manualDelay || delays[0];
  };

  // Get delay color - uses color from delay model or defaults
  const getDelayColor = (delayInfo) => {
    if (!delayInfo) return null;
    
    // If this is an automatic shift changeover delay
    if (delayInfo.isAutomatic && delayInfo.code === 'SHIFT_CHANGE') {
      // ALWAYS return light grey for shift changeover
      return '#d3d3d3'; // Light grey
    }
    
    // Use the color from the delay object (fetched from Delay model)
    if (delayInfo.color) {
      return delayInfo.color;
    }
    
    // Fallback to default red if no color specified
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

  const handleHourHeaderClick = (hour) => {
    setSelectedHourForGlobalDelay(hour);
    setGlobalDelayModalVisible(true);
  };

  const handleGlobalDelaySubmit = (delayData) => {
    // Mark as global delay for all sites
    const globalDelay = {
      ...delayData,
      row: '__ALL__',
      isGlobal: true
    };
    onAddDelay(globalDelay);
    setGlobalDelayModalVisible(false);
    setSelectedHourForGlobalDelay(null);
  };

  const handleExitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
    } catch (error) {
      console.error('Error exiting fullscreen:', error);
    }
  };

  return (
    <div className="schedule-grid-wrapper">
      {/* Exit Fullscreen Button (only visible in fullscreen mode) */}
      <Button
        className="fullscreen-exit-btn"
        icon={<FullscreenExitOutlined />}
        onClick={handleExitFullscreen}
        size="large"
      >
        Exit Fullscreen (ESC)
      </Button>

      {/* Shift Filter */}
      {activeShifts.length > 0 && (
        <div className="shift-filter-container">
          <div className="shift-filter-label">
            <FilterOutlined /> {t('schedule.shiftFilter.label')}
          </div>
          <Radio.Group
            value={selectedShiftFilter}
            onChange={(e) => setSelectedShiftFilter(e.target.value)}
            className="shift-filter-group"
          >
            <Radio.Button value="all" className="shift-filter-option">
              {t('schedule.shiftFilter.allShifts')}
            </Radio.Button>
            {activeShifts.map(shift => (
              <Radio.Button 
                key={shift._id} 
                value={shift._id}
                className="shift-filter-option"
              >
                <span 
                  className="shift-color-indicator" 
                  style={{ backgroundColor: shift.color }}
                ></span>
                {shift.shiftName}
                <span className="shift-time-range">({shift.startTime}-{shift.endTime})</span>
              </Radio.Button>
            ))}
          </Radio.Group>
          {selectedShiftFilter !== 'all' && (
            <Tag 
              color="blue" 
              className="shift-filter-active-tag"
            >
              {t('schedule.shiftFilter.viewing')}: {activeShifts.find(s => s._id === selectedShiftFilter)?.shiftName}
            </Tag>
          )}
        </div>
      )}

      <div className="schedule-grid-scroll">
        <table className="schedule-grid" data-grid-hours={getFilteredHours.length}>
          <thead>
            {/* Shift Row */}
            <tr className="shift-row">
              <th className="priority-col shift-cell"></th>
              <th className="site-col shift-cell">Shift</th>
              {getFilteredHours.map((hourIndex) => {
                const shift = getShiftForHour(hourIndex);
                // Subtle shift color indication
                const shiftBg = shift.color ? `${shift.color}15` : '#fafafa';
                return (
                  <th 
                    key={hourIndex} 
                    className="hour-col shift-cell"
                    style={{ backgroundColor: shiftBg }}
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
              {getFilteredHours.map((hourIndex) => (
                <th 
                  key={hourIndex} 
                  className={`hour-col hour-header-clickable ${isCurrentHour(hourIndex) ? 'current-hour' : ''}`}
                  onClick={() => handleHourHeaderClick(hourIndex)}
                  title="Click to add delay for all active sites"
                >
                  {hourIndex + 1}
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
                  {getFilteredHours.map((hour) => {
                    const taskId = grid[siteId][hour];
                    const taskColor = taskId ? taskColors[taskId] : null;
                    const allDelays = getDelayInfo(siteId, hour);
                    const hasMultipleDelays = allDelays && allDelays.length > 1;
                    const primaryDelay = getPrimaryDelay(allDelays);
                    const delayed = allDelays && allDelays.length > 0;
                    const delayColor = primaryDelay ? getDelayColor(primaryDelay) : null;

                    return (
                      <ScheduleCell
                        key={hour}
                        siteId={siteId}
                        hour={hour}
                        taskId={taskId}
                        taskColor={taskColor}
                        isActive={isActive}
                        isDelayed={delayed}
                        delayInfo={primaryDelay}
                        allDelays={allDelays}
                        hasMultipleDelays={hasMultipleDelays}
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

      {/* Global Delay Modal (All Sites) */}
      <DelayModal
        visible={globalDelayModalVisible}
        siteId="__ALL__"
        hour={selectedHourForGlobalDelay}
        isGlobal={true}
        onClose={() => {
          setGlobalDelayModalVisible(false);
          setSelectedHourForGlobalDelay(null);
        }}
        onSubmit={handleGlobalDelaySubmit}
      />
    </div>
  );
};

export default ScheduleGrid;

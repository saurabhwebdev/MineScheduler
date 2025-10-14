import React, { useState, useMemo, useEffect } from 'react';
import ScheduleCell from './ScheduleCell';
import './ScheduleGrid.css';

const ScheduleGrid = ({ scheduleData, delayedSlots, onToggleSite, onAddDelay, onRemoveDelay }) => {
  const [sortDirection, setSortDirection] = useState('desc'); // 'none', 'asc', 'desc'
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  const { grid, gridHours, sitePriority, siteActive, taskColors } = scheduleData;

  // Update current hour every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Calculate shift for a given hour (0-23)
  const getShiftForHour = (hour) => {
    // Shift A: 6:00 - 14:00 (hours 6-13)
    // Shift B: 14:00 - 22:00 (hours 14-21)
    // Shift C: 22:00 - 6:00 (hours 22-23, 0-5)
    if (hour >= 6 && hour < 14) return { name: 'A', color: '#52c41a' };
    if (hour >= 14 && hour < 22) return { name: 'B', color: '#1890ff' };
    return { name: 'C', color: '#722ed1' };
  };

  // Sort sites based on sort direction with G7/G8 grouping
  const sortedSites = useMemo(() => {
    const sites = Object.keys(grid);

    if (sortDirection === 'none') {
      // Original order (by priority)
      return sites.sort((a, b) => {
        if (siteActive[a] !== siteActive[b]) {
          return siteActive[b] ? -1 : 1; // Active first
        }
        return sitePriority[a] - sitePriority[b];
      });
    }

    // Sort with G7/G8 grouping
    return sites.sort((a, b) => {
      // Active sites first
      if (siteActive[a] !== siteActive[b]) {
        return siteActive[b] ? -1 : 1;
      }

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

  const isDelayed = (site, hour) => {
    return delayedSlots.some(d => d.row === site && d.hourIndex === hour);
  };

  const handleSiteClick = (siteId) => {
    if (window.confirm(`Toggle active status for ${siteId}?`)) {
      onToggleSite(siteId);
    }
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
                    title={`Shift ${shift.name}`}
                  >
                    {shift.name}
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
              {Array.from({ length: gridHours }, (_, i) => {
                const isCurrentHour = i === currentHour;
                return (
                  <th 
                    key={i} 
                    className={`hour-col ${isCurrentHour ? 'current-hour' : ''}`}
                    title={isCurrentHour ? 'Current Hour' : `Hour ${i + 1}`}
                  >
                    {i + 1}
                    {isCurrentHour && <div className="current-hour-indicator">●</div>}
                  </th>
                );
              })}
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
                    const delayed = isDelayed(siteId, hour);
                    const isCurrentHourCol = hour === currentHour;

                    return (
                      <ScheduleCell
                        key={hour}
                        siteId={siteId}
                        hour={hour}
                        taskId={taskId}
                        taskColor={taskColor}
                        isActive={isActive}
                        isDelayed={delayed}
                        isCurrentHour={isCurrentHourCol}
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
    </div>
  );
};

export default ScheduleGrid;

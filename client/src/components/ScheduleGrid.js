import React, { useState, useMemo } from 'react';
import ScheduleCell from './ScheduleCell';
import './ScheduleGrid.css';

const ScheduleGrid = ({ scheduleData, delayedSlots, onToggleSite, onAddDelay, onRemoveDelay }) => {
  const [sortDirection, setSortDirection] = useState('desc'); // 'none', 'asc', 'desc'

  const { grid, gridHours, sitePriority, siteActive, taskColors } = scheduleData;

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
                <th key={i} className="hour-col">
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
                    const delayed = isDelayed(siteId, hour);

                    return (
                      <ScheduleCell
                        key={hour}
                        siteId={siteId}
                        hour={hour}
                        taskId={taskId}
                        taskColor={taskColor}
                        isActive={isActive}
                        isDelayed={delayed}
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

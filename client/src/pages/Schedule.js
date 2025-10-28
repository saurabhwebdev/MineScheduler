import React, { useState, useEffect } from 'react';
import { Button, notification, Radio, Spin, Tag, Space, Modal, Collapse, Tooltip } from 'antd';
import { CalendarOutlined, ReloadOutlined, ClockCircleOutlined, DownloadOutlined, SaveOutlined, FolderOpenOutlined, DeleteOutlined, ExclamationCircleOutlined, DownOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';
import ScheduleGrid from '../components/ScheduleGrid';
import SnapshotManager from '../components/SnapshotManager';
import config from '../config/config';
import './Schedule.css';

const Schedule = () => {
  const { t } = useTranslation();
  const [gridHours, setGridHours] = useState(24);
  const [scheduleData, setScheduleData] = useState(null);
  const [delayedSlots, setDelayedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [controlsCollapsed, setControlsCollapsed] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch latest schedule on mount
  useEffect(() => {
    fetchLatestSchedule();
  }, []);

  // Load delayed slots from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('delayedSlots');
      if (saved) {
        setDelayedSlots(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading delayed slots:', error);
    }
  }, []);

  // Save delayed slots to sessionStorage whenever they change
  useEffect(() => {
    try {
      sessionStorage.setItem('delayedSlots', JSON.stringify(delayedSlots));
    } catch (error) {
      console.error('Error saving delayed slots:', error);
    }
  }, [delayedSlots]);

  // Listen for fullscreen changes (ESC key, etc.)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
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

  const fetchLatestSchedule = async () => {
    setLoadingLatest(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/schedule/latest`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setScheduleData(data.data);
        setGeneratedAt(data.data.generatedAt);
        setGridHours(data.data.gridHours);
        // Load delays from the saved schedule
        if (data.data.delayedSlots && data.data.delayedSlots.length > 0) {
          setDelayedSlots(data.data.delayedSlots);
        }
      } else if (response.status === 404) {
        // No schedule found yet - this is fine
        console.log('No schedule found. User needs to generate first.');
      }
    } catch (error) {
      console.error('Error fetching latest schedule:', error);
    } finally {
      setLoadingLatest(false);
    }
  };

  const generateSchedule = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/schedule/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          gridHours,
          delayedSlots
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setScheduleData(data.data);
        setGeneratedAt(data.data.generatedAt);
        notification.success({
          message: t('schedule.messages.success'),
          description: t('schedule.messages.scheduleGenerated'),
          duration: 2
        });
      } else {
        notification.error({
          message: t('schedule.messages.error'),
          description: data.message || t('schedule.messages.generateError'),
        });
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
      notification.error({
        message: t('schedule.messages.networkError'),
        description: t('schedule.messages.generateRetry'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHoursChange = (e) => {
    const newHours = e.target.value;
    setGridHours(newHours);
    
    // Auto-regenerate if schedule exists
    if (scheduleData) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        generateScheduleWithHours(newHours);
      }, 100);
    }
  };

  const generateScheduleWithHours = async (hours) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/schedule/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          gridHours: hours,
          delayedSlots
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setScheduleData(data.data);
        setGeneratedAt(data.data.generatedAt);
        notification.success({
          message: t('schedule.messages.success'),
          description: t('schedule.messages.scheduleUpdated', { hours }),
          duration: 2
        });
      } else {
        notification.error({
          message: t('schedule.messages.error'),
          description: data.message || t('schedule.messages.generateError'),
        });
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
      notification.error({
        message: t('schedule.messages.networkError'),
        description: t('schedule.messages.generateRetry'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSite = async (siteId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/schedule/sites/${siteId}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        notification.success({
          message: t('schedule.messages.success'),
          description: t('schedule.messages.siteToggled', { siteId }),
          duration: 2
        });
        // Regenerate schedule to reflect changes
        generateSchedule();
      } else {
        notification.error({
          message: t('schedule.messages.error'),
          description: data.message || t('schedule.messages.siteToggleError'),
        });
      }
    } catch (error) {
      console.error('Error toggling site:', error);
      notification.error({
        message: t('schedule.messages.networkError'),
        description: t('schedule.messages.siteToggleError'),
      });
    }
  };

  const handleAddDelay = async (delay) => {
    // Add delays for multiple consecutive hours based on duration
    const duration = delay.duration || 1;
    const isGlobal = delay.isGlobal || delay.row === '__ALL__';
    const newDelays = [];
    
    // Fetch delay color from backend based on delay code
    let delayColor = '#ff4d4f'; // Default red
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/delays`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        const matchingDelay = data.data.delays.find(
          d => d.delayCode === delay.code && d.delayCategory === delay.category
        );
        if (matchingDelay && matchingDelay.color) {
          delayColor = matchingDelay.color;
        }
      }
    } catch (error) {
      console.error('Error fetching delay color:', error);
      // Continue with default color
    }
    
    // Get list of sites to apply delay to
    let sitesToDelay = [];
    if (isGlobal && scheduleData) {
      // Apply to all ACTIVE sites only
      const allSites = Object.keys(scheduleData.grid || {});
      sitesToDelay = allSites.filter(site => scheduleData.siteActive[site]);
    } else {
      // Apply to single site
      sitesToDelay = [delay.row];
    }
    
    // Remove any existing delays in the range that will be affected
    let updatedDelayedSlots = delayedSlots.filter(d => {
      if (isGlobal) {
        // For global delays, remove delays from ALL sites in the hour range
        return !(
          sitesToDelay.includes(d.row) && 
          d.hourIndex >= delay.hourIndex && 
          d.hourIndex < delay.hourIndex + duration
        );
      } else {
        // For single site, remove only from that site
        return !(
          d.row === delay.row && 
          d.hourIndex >= delay.hourIndex && 
          d.hourIndex < delay.hourIndex + duration
        );
      }
    });
    
    // Add delay for each site and each hour in the duration
    for (const site of sitesToDelay) {
      for (let i = 0; i < duration; i++) {
        newDelays.push({
          row: site,
          hourIndex: delay.hourIndex + i,
          category: delay.category,
          code: delay.code,
          comments: delay.comments,
          color: delayColor, // Store the fetched color
          duration: 1 // Each cell is 1 hour
        });
      }
    }
    
    // Combine with existing delays
    updatedDelayedSlots = [...updatedDelayedSlots, ...newDelays];
    setDelayedSlots(updatedDelayedSlots);

    // Auto-regenerate schedule
    const delayMessage = isGlobal 
      ? t('schedule.messages.addingDelayGlobal', { duration, count: sitesToDelay.length })
      : t('schedule.messages.addingDelayLocal', { duration });
    
    notification.info({
      message: t('schedule.messages.addingDelay'),
      description: delayMessage,
      duration: 2
    });

    // Wait a moment for state to update, then regenerate
    setTimeout(async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.apiUrl}/schedule/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            gridHours,
            delayedSlots: updatedDelayedSlots
          }),
        });

        const data = await response.json();

        if (response.ok && data.status === 'success') {
          setScheduleData(data.data);
          setGeneratedAt(data.data.generatedAt);
          const successMsg = isGlobal
            ? t('schedule.messages.delayAddedGlobal', { duration, count: sitesToDelay.length })
            : t('schedule.messages.delayAddedLocal', { duration });
          notification.success({
            message: t('schedule.messages.delayAdded'),
            description: successMsg,
            duration: 2
          });
        } else {
          notification.error({
            message: t('schedule.messages.error'),
            description: data.message || t('schedule.messages.regenerateError'),
          });
        }
      } catch (error) {
        console.error('Error regenerating schedule:', error);
        notification.error({
          message: t('schedule.messages.networkError'),
          description: t('schedule.messages.regenerateRetry'),
        });
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  const handleRemoveDelay = (row, hourIndex) => {
    setDelayedSlots(
      delayedSlots.filter(d => !(d.row === row && d.hourIndex === hourIndex))
    );
    notification.info({
      message: t('schedule.messages.delayRemoved'),
      description: t('schedule.messages.delayRemovedDesc'),
      duration: 2
    });
  };

  const handleClearAllDelays = () => {
    const delayCount = delayedSlots.length;
    
    if (delayCount === 0) {
      notification.info({
        message: t('schedule.messages.noDelays'),
        description: t('schedule.messages.noDelaysDesc'),
        duration: 2
      });
      return;
    }

    Modal.confirm({
      title: t('schedule.clearDelaysModal.title'),
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          <p style={{ marginBottom: '12px', fontSize: '14px' }}>
            {t('schedule.clearDelaysModal.message')} <strong>{t('schedule.clearDelaysModal.allDelays', { count: delayCount })}</strong> {t('schedule.clearDelaysModal.andRegenerate')}
          </p>
          <div style={{ 
            background: '#fff7e6', 
            padding: '12px', 
            borderRadius: '8px',
            border: '1px solid #ffd591',
            fontSize: '13px'
          }}>
            ⚠️ <strong>{t('schedule.clearDelaysModal.warning')}</strong> {t('schedule.clearDelaysModal.warningMessage')}
          </div>
        </div>
      ),
      okText: t('schedule.clearDelaysModal.okText'),
      cancelText: t('schedule.clearDelaysModal.cancel'),
      okButtonProps: {
        danger: true,
        style: {
          background: '#ff4d4f',
          borderColor: '#ff4d4f',
          height: '40px',
          fontWeight: 600
        }
      },
      cancelButtonProps: {
        style: {
          height: '40px',
          fontWeight: 600
        }
      },
      centered: true,
      width: 480,
      onOk: async () => {
        // Clear all delays
        setDelayedSlots([]);
        
        // Auto-regenerate schedule
        notification.info({
          message: t('schedule.messages.clearingDelays'),
          description: t('schedule.messages.clearingDelaysDesc'),
          duration: 2
        });

        setTimeout(async () => {
          setLoading(true);
          try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${config.apiUrl}/schedule/generate`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                gridHours,
                delayedSlots: [] // Empty array - no delays
              }),
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
              setScheduleData(data.data);
              setGeneratedAt(data.data.generatedAt);
              notification.success({
                message: t('schedule.messages.allDelaysCleared'),
                description: t('schedule.messages.allDelaysClearedDesc', { count: delayCount }),
                duration: 3
              });
            } else {
              notification.error({
                message: t('schedule.messages.error'),
                description: data.message || t('schedule.messages.regenerateError'),
              });
            }
          } catch (error) {
            console.error('Error regenerating schedule:', error);
            notification.error({
              message: t('schedule.messages.networkError'),
              description: t('schedule.messages.regenerateRetry'),
            });
          } finally {
            setLoading(false);
          }
        }, 100);
      }
    });
  };

  const handleLoadSnapshot = (loadedScheduleData, loadedDelayedSlots, loadedGridHours) => {
    setScheduleData(loadedScheduleData);
    setDelayedSlots(loadedDelayedSlots);
    setGridHours(loadedGridHours);
  };

  const handleFullscreenToggle = async () => {
    const gridWrapper = document.querySelector('.schedule-grid-wrapper');
    
    if (!gridWrapper) return;
    
    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        if (gridWrapper.requestFullscreen) {
          await gridWrapper.requestFullscreen();
        } else if (gridWrapper.webkitRequestFullscreen) {
          await gridWrapper.webkitRequestFullscreen();
        } else if (gridWrapper.mozRequestFullScreen) {
          await gridWrapper.mozRequestFullScreen();
        } else if (gridWrapper.msRequestFullscreen) {
          await gridWrapper.msRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
      notification.error({
        message: t('schedule.messages.fullscreenError'),
        description: t('schedule.messages.fullscreenErrorDesc'),
      });
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/schedule/export/latest`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download schedule');
      }

      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'MineSchedule.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Convert response to blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      notification.success({
        message: t('schedule.messages.downloadStarted'),
        description: t('schedule.messages.downloadStartedDesc'),
        duration: 2
      });
    } catch (error) {
      console.error('Error downloading schedule:', error);
      notification.error({
        message: t('schedule.messages.downloadFailed'),
        description: t('schedule.messages.downloadFailedDesc'),
      });
    }
  };

  return (
    <DashboardLayout 
      title={t('schedule.title')}
      subtitle={t('schedule.subtitle')}
    >
      <div className="schedule-container">
        {/* Controls */}
        <Collapse 
          className="schedule-controls-collapse"
          activeKey={controlsCollapsed ? [] : ['controls']}
          onChange={() => setControlsCollapsed(!controlsCollapsed)}
          expandIcon={({ isActive }) => <DownOutlined rotate={isActive ? 180 : 0} />}
          items={[{
            key: 'controls',
            label: (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', fontWeight: 600 }}>
                <span>{t('schedule.controls', 'Schedule Controls')}</span>
                {delayedSlots.length > 0 && (
                  <Tag color="warning">{delayedSlots.length} {t('schedule.delaysApplied')}</Tag>
                )}
                {generatedAt && scheduleData && (
                  <Tooltip 
                    title={
                      <span>
                        {t('schedule.lastGenerated')} {new Date(generatedAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    }
                    placement="right"
                  >
                    <ClockCircleOutlined style={{ color: '#3cca70', fontSize: '16px', cursor: 'pointer', marginLeft: '4px' }} />
                  </Tooltip>
                )}
              </div>
            ),
            children: (
              <div className="schedule-controls">
                <div className="controls-single-row">
                  <div className="control-group">
                    <label className="control-label">{t('schedule.gridHours')}</label>
                    <Radio.Group value={gridHours} onChange={handleHoursChange} size="large">
                      <Radio.Button value={6}>{t('schedule.hours', { count: 6 })}</Radio.Button>
                      <Radio.Button value={12}>{t('schedule.hours', { count: 12 })}</Radio.Button>
                      <Radio.Button value={24}>{t('schedule.hours', { count: 24 })}</Radio.Button>
                      <Radio.Button value={48}>{t('schedule.hours', { count: 48 })}</Radio.Button>
                    </Radio.Group>
                  </div>

                  {delayedSlots.length > 0 && (
                    <div className="delay-count">
                      <span className="delay-badge">{delayedSlots.length}</span>
                      <span className="delay-text">{t('schedule.delaysApplied')}</span>
                    </div>
                  )}

                  <div className="action-buttons">
                    <Button
                      type="primary"
                      size="large"
                      icon={<CalendarOutlined />}
                      onClick={generateSchedule}
                      loading={loading}
                      className="generate-btn"
                    >
                      {t('schedule.generateSchedule')}
                    </Button>

                    {scheduleData && (
                      <Button
                        size="large"
                        icon={<ReloadOutlined />}
                        onClick={generateSchedule}
                        loading={loading}
                        className="regenerate-btn"
                      >
                        {t('schedule.regenerate')}
                      </Button>
                    )}

                    {scheduleData && (
                      <Button
                        size="large"
                        icon={<DownloadOutlined />}
                        onClick={handleDownloadExcel}
                        className="download-btn"
                      >
                        {t('schedule.downloadExcel')}
                      </Button>
                    )}

                    {scheduleData && (
                      <Button
                        size="large"
                        icon={<SaveOutlined />}
                        onClick={() => document.querySelector('.snapshot-manager button[title*="Save"]')?.click()}
                        className="save-btn"
                      >
                        {t('schedule.saveSnapshot')}
                      </Button>
                    )}

                    <Button
                      size="large"
                      icon={<FolderOpenOutlined />}
                      onClick={() => document.querySelector('.snapshot-manager button[title*="Load"]')?.click()}
                      className="load-btn"
                    >
                      {t('schedule.loadSnapshot')}
                    </Button>

                    {scheduleData && gridHours === 48 && (
                      <Tooltip title={t('schedule.fullscreenTooltip', 'View schedule in fullscreen mode (no scroll)')}>
                        <Button
                          size="large"
                          icon={<FullscreenOutlined />}
                          onClick={handleFullscreenToggle}
                          style={{
                            background: '#13c2c2',
                            borderColor: '#13c2c2',
                            color: '#ffffff'
                          }}
                        >
                          {t('schedule.fullscreen', 'Fullscreen')}
                        </Button>
                      </Tooltip>
                    )}

                    {scheduleData && delayedSlots.length > 0 && (
                      <Button
                        size="large"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={handleClearAllDelays}
                        className="clear-delays-btn"
                        style={{
                          background: '#ff4d4f',
                          borderColor: '#ff4d4f',
                          color: '#ffffff'
                        }}
                      >
                        {t('schedule.clearAllDelays', { count: delayedSlots.length })}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          }]}
        />

        {/* Hidden SnapshotManager for modal functionality */}
        <div style={{ display: 'none' }}>
          <SnapshotManager
            scheduleData={scheduleData}
            delayedSlots={delayedSlots}
            gridHours={gridHours}
            onLoadSnapshot={handleLoadSnapshot}
          />
        </div>

        {/* Loading State */}
        {(loading || loadingLatest) && (
          <div className="loading-container">
            <Spin size="large" tip={loading ? t('schedule.generating') : t('schedule.loadingLatest')} />
          </div>
        )}

        {/* Schedule Grid */}
        {!loading && !loadingLatest && scheduleData && (
          <ScheduleGrid
            scheduleData={scheduleData}
            delayedSlots={scheduleData.allDelays || delayedSlots}
            onToggleSite={handleToggleSite}
            onAddDelay={handleAddDelay}
            onRemoveDelay={handleRemoveDelay}
          />
        )}

        {/* Empty State */}
        {!loading && !loadingLatest && !scheduleData && (
          <div className="empty-state">
            <CalendarOutlined className="empty-icon" />
            <h3>{t('schedule.noScheduleTitle')}</h3>
            <p>{t('schedule.noScheduleDesc')}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Schedule;

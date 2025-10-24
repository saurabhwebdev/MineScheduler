import React, { useState, useEffect } from 'react';
import { Button, notification, Radio, Spin, Tag, Space } from 'antd';
import { CalendarOutlined, ReloadOutlined, ClockCircleOutlined, DownloadOutlined, SaveOutlined, FolderOpenOutlined } from '@ant-design/icons';
import DashboardLayout from '../components/DashboardLayout';
import ScheduleGrid from '../components/ScheduleGrid';
import SnapshotManager from '../components/SnapshotManager';
import config from '../config/config';
import './Schedule.css';

const Schedule = () => {
  const [gridHours, setGridHours] = useState(24);
  const [scheduleData, setScheduleData] = useState(null);
  const [delayedSlots, setDelayedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [loadingLatest, setLoadingLatest] = useState(true);

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
          message: 'Success',
          description: 'Schedule generated successfully',
          duration: 2
        });
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to generate schedule',
        });
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to generate schedule. Please try again.',
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
          message: 'Success',
          description: `Schedule updated to ${hours} hours`,
          duration: 2
        });
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to generate schedule',
        });
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to generate schedule. Please try again.',
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
          message: 'Success',
          description: `Site ${siteId} status toggled`,
          duration: 2
        });
        // Regenerate schedule to reflect changes
        generateSchedule();
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to toggle site status',
        });
      }
    } catch (error) {
      console.error('Error toggling site:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to toggle site status',
      });
    }
  };

  const handleAddDelay = async (delay) => {
    // Add delays for multiple consecutive hours based on duration
    const duration = delay.duration || 1;
    const newDelays = [];
    
    // Remove any existing delays in the range that will be affected
    let updatedDelayedSlots = delayedSlots.filter(
      d => !(d.row === delay.row && d.hourIndex >= delay.hourIndex && d.hourIndex < delay.hourIndex + duration)
    );
    
    // Add delay for each hour in the duration
    for (let i = 0; i < duration; i++) {
      newDelays.push({
        row: delay.row,
        hourIndex: delay.hourIndex + i,
        category: delay.category,
        code: delay.code,
        comments: delay.comments,
        duration: 1 // Each cell is 1 hour
      });
    }
    
    // Combine with existing delays
    updatedDelayedSlots = [...updatedDelayedSlots, ...newDelays];
    setDelayedSlots(updatedDelayedSlots);

    // Auto-regenerate schedule
    notification.info({
      message: 'Adding Delay',
      description: `Adding ${duration} hour(s) delay and regenerating schedule...`,
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
          notification.success({
            message: 'Delay Added',
            description: `${duration} hour(s) delay added and schedule regenerated`,
            duration: 2
          });
        } else {
          notification.error({
            message: 'Error',
            description: data.message || 'Failed to regenerate schedule',
          });
        }
      } catch (error) {
        console.error('Error regenerating schedule:', error);
        notification.error({
          message: 'Network Error',
          description: 'Failed to regenerate schedule. Please try again.',
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
      message: 'Delay Removed',
      description: 'Click "Generate Schedule" to apply changes.',
      duration: 2
    });
  };

  const handleLoadSnapshot = (loadedScheduleData, loadedDelayedSlots, loadedGridHours) => {
    setScheduleData(loadedScheduleData);
    setDelayedSlots(loadedDelayedSlots);
    setGridHours(loadedGridHours);
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
        message: 'Download Started',
        description: 'Schedule is being downloaded as Excel file',
        duration: 2
      });
    } catch (error) {
      console.error('Error downloading schedule:', error);
      notification.error({
        message: 'Download Failed',
        description: 'Failed to download schedule. Please try again.',
      });
    }
  };

  return (
    <DashboardLayout 
      title="Schedule"
      subtitle="Generate and manage your mine scheduling"
    >
      <div className="schedule-container">
        {/* Generation Info */}
        {generatedAt && scheduleData && (
          <div className="schedule-info" style={{ marginBottom: '16px', padding: '12px 16px', background: '#f9f9f9', borderRadius: '6px', border: '1px solid #e8e8e8' }}>
            <Space>
              <ClockCircleOutlined style={{ color: '#3cca70' }} />
              <span style={{ fontWeight: 500 }}>Last Generated:</span>
              <Tag color="green">
                {new Date(generatedAt).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </Tag>
            </Space>
          </div>
        )}

        {/* Controls */}
        <div className="schedule-controls">
          <div className="controls-top">
            <div className="control-group">
              <label className="control-label">Grid Hours:</label>
              <Radio.Group value={gridHours} onChange={handleHoursChange} size="large">
                <Radio.Button value={6}>6 Hours</Radio.Button>
                <Radio.Button value={12}>12 Hours</Radio.Button>
                <Radio.Button value={24}>24 Hours</Radio.Button>
                <Radio.Button value={48}>48 Hours</Radio.Button>
              </Radio.Group>
            </div>

            {delayedSlots.length > 0 && (
              <div className="delay-count">
                <span className="delay-badge">{delayedSlots.length}</span>
                <span className="delay-text">Delays Applied</span>
              </div>
            )}
          </div>

          <div className="controls-bottom">
            <div className="action-buttons">
              <Button
                type="primary"
                size="large"
                icon={<CalendarOutlined />}
                onClick={generateSchedule}
                loading={loading}
                className="generate-btn"
              >
                Generate Schedule
              </Button>

              {scheduleData && (
                <Button
                  size="large"
                  icon={<ReloadOutlined />}
                  onClick={generateSchedule}
                  loading={loading}
                  className="regenerate-btn"
                >
                  Regenerate
                </Button>
              )}

              {scheduleData && (
                <Button
                  size="large"
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadExcel}
                  className="download-btn"
                >
                  Download Excel
                </Button>
              )}

              {scheduleData && (
                <Button
                  size="large"
                  icon={<SaveOutlined />}
                  onClick={() => document.querySelector('.snapshot-manager button[title*="Save"]')?.click()}
                  className="save-btn"
                >
                  Save Snapshot
                </Button>
              )}

              <Button
                size="large"
                icon={<FolderOpenOutlined />}
                onClick={() => document.querySelector('.snapshot-manager button[title*="Load"]')?.click()}
                className="load-btn"
              >
                Load Snapshot
              </Button>
            </div>
          </div>

          {/* Hidden SnapshotManager for modal functionality */}
          <div style={{ display: 'none' }}>
            <SnapshotManager
              scheduleData={scheduleData}
              delayedSlots={delayedSlots}
              gridHours={gridHours}
              onLoadSnapshot={handleLoadSnapshot}
            />
          </div>
        </div>

        {/* Loading State */}
        {(loading || loadingLatest) && (
          <div className="loading-container">
            <Spin size="large" tip={loading ? "Generating schedule..." : "Loading latest schedule..."} />
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
            <h3>No Schedule Generated</h3>
            <p>Click "Generate Schedule" to create your mine schedule</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Schedule;

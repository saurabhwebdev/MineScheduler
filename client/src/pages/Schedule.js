import React, { useState, useEffect } from 'react';
import { Button, notification, Radio, Space, Spin, Tag } from 'antd';
import { CalendarOutlined, ReloadOutlined, ClockCircleOutlined } from '@ant-design/icons';
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
    setGridHours(e.target.value);
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

  const handleAddDelay = (delay) => {
    // Add or update delay
    const existingIndex = delayedSlots.findIndex(
      d => d.row === delay.row && d.hourIndex === delay.hourIndex
    );

    if (existingIndex >= 0) {
      // Update existing delay
      const updated = [...delayedSlots];
      updated[existingIndex] = delay;
      setDelayedSlots(updated);
    } else {
      // Add new delay
      setDelayedSlots([...delayedSlots, delay]);
    }

    notification.success({
      message: 'Delay Added',
      description: 'Delay has been added. Click "Generate Schedule" to apply.',
      duration: 3
    });
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
          <Space size="large" wrap>
            <div className="control-group">
              <label>Grid Hours:</label>
              <Radio.Group value={gridHours} onChange={handleHoursChange}>
                <Radio.Button value={6}>6 Hours</Radio.Button>
                <Radio.Button value={12}>12 Hours</Radio.Button>
                <Radio.Button value={24}>24 Hours</Radio.Button>
                <Radio.Button value={48}>48 Hours</Radio.Button>
              </Radio.Group>
            </div>

            <Button
              type="primary"
              size="large"
              icon={<CalendarOutlined />}
              onClick={generateSchedule}
              loading={loading}
            >
              Generate Schedule
            </Button>

            {scheduleData && (
              <Button
                size="large"
                icon={<ReloadOutlined />}
                onClick={generateSchedule}
                loading={loading}
              >
                Regenerate
              </Button>
            )}

            <SnapshotManager
              scheduleData={scheduleData}
              delayedSlots={delayedSlots}
              gridHours={gridHours}
              onLoadSnapshot={handleLoadSnapshot}
            />
          </Space>

          {delayedSlots.length > 0 && (
            <div className="delay-count">
              <span className="delay-badge">{delayedSlots.length}</span>
              <span className="delay-text">Delays Applied</span>
            </div>
          )}
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

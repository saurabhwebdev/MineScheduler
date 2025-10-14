import React, { useState, useEffect } from 'react';
import { Button, Modal, Input, List, notification, Popconfirm, Space, Empty, Tag } from 'antd';
import { SaveOutlined, FolderOpenOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons';
import config from '../config/config';
import './SnapshotManager.css';

const { TextArea } = Input;

const SnapshotManager = ({ scheduleData, delayedSlots, gridHours, onLoadSnapshot }) => {
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [loadModalVisible, setLoadModalVisible] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotDescription, setSnapshotDescription] = useState('');
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState({});

  // Fetch snapshots when load modal opens
  useEffect(() => {
    if (loadModalVisible) {
      fetchSnapshots();
    }
  }, [loadModalVisible]);

  const fetchSnapshots = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/snapshots`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setSnapshots(data.data.snapshots);
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to fetch snapshots',
        });
      }
    } catch (error) {
      console.error('Error fetching snapshots:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to fetch snapshots',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSnapshot = async () => {
    if (!snapshotName.trim()) {
      notification.warning({
        message: 'Validation Error',
        description: 'Please enter a snapshot name',
      });
      return;
    }

    if (!scheduleData) {
      notification.warning({
        message: 'No Schedule',
        description: 'Please generate a schedule first',
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/snapshots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: snapshotName,
          description: snapshotDescription,
          gridData: scheduleData.grid,
          gridHours: scheduleData.gridHours,
          delayedSlots: delayedSlots,
          sitePriority: scheduleData.sitePriority,
          siteActive: scheduleData.siteActive,
          taskColors: scheduleData.taskColors,
          taskLimits: scheduleData.taskLimits
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        notification.success({
          message: 'Success',
          description: 'Snapshot saved successfully',
          duration: 2
        });
        setSaveModalVisible(false);
        setSnapshotName('');
        setSnapshotDescription('');
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to save snapshot',
        });
      }
    } catch (error) {
      console.error('Error saving snapshot:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to save snapshot',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSnapshot = async (snapshotId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch snapshot data
      const snapshotResponse = await fetch(`${config.apiUrl}/snapshots/${snapshotId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const snapshotData = await snapshotResponse.json();

      if (snapshotResponse.ok && snapshotData.status === 'success') {
        const snapshot = snapshotData.data.snapshot;
        
        // Fetch CURRENT shifts from database (not from snapshot)
        const shiftsResponse = await fetch(`${config.apiUrl}/shifts`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        const shiftsData = await shiftsResponse.json();
        const currentShifts = shiftsData.status === 'success' ? shiftsData.data.shifts : [];
        
        // Construct schedule data from snapshot + current shifts
        const loadedScheduleData = {
          grid: snapshot.gridData,
          gridHours: snapshot.gridHours,
          sitePriority: snapshot.sitePriority,
          siteActive: snapshot.siteActive,
          taskColors: snapshot.taskColors,
          taskLimits: snapshot.taskLimits,
          shifts: currentShifts.filter(s => s.isActive).map(s => ({
            shiftCode: s.shiftCode,
            shiftName: s.shiftName,
            startTime: s.startTime,
            endTime: s.endTime,
            color: s.color
          }))
        };

        onLoadSnapshot(loadedScheduleData, snapshot.delayedSlots, snapshot.gridHours);
        
        notification.success({
          message: 'Success',
          description: `Snapshot "${snapshot.name}" loaded successfully`,
          duration: 2
        });
        setLoadModalVisible(false);
      } else {
        notification.error({
          message: 'Error',
          description: snapshotData.message || 'Failed to load snapshot',
        });
      }
    } catch (error) {
      console.error('Error loading snapshot:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to load snapshot',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSnapshot = async (snapshotId, snapshotName) => {
    setDeleteLoading({ ...deleteLoading, [snapshotId]: true });
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/snapshots/${snapshotId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        notification.success({
          message: 'Success',
          description: `Snapshot "${snapshotName}" deleted successfully`,
          duration: 2
        });
        // Refresh the list
        fetchSnapshots();
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to delete snapshot',
        });
      }
    } catch (error) {
      console.error('Error deleting snapshot:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to delete snapshot',
      });
    } finally {
      setDeleteLoading({ ...deleteLoading, [snapshotId]: false });
    }
  };

  return (
    <div className="snapshot-manager">
      <Space>
        <Button
          icon={<SaveOutlined />}
          onClick={() => setSaveModalVisible(true)}
          disabled={!scheduleData}
          title="Save current schedule as snapshot"
        >
          Save Snapshot
        </Button>
        <Button
          icon={<FolderOpenOutlined />}
          onClick={() => setLoadModalVisible(true)}
          title="Load a saved snapshot"
        >
          Load Snapshot
        </Button>
      </Space>

      {/* Save Snapshot Modal */}
      <Modal
        title="Save Snapshot"
        open={saveModalVisible}
        onOk={handleSaveSnapshot}
        onCancel={() => {
          setSaveModalVisible(false);
          setSnapshotName('');
          setSnapshotDescription('');
        }}
        okText="Save"
        confirmLoading={loading}
        width={500}
      >
        <div className="snapshot-form">
          <div className="form-group">
            <label>Snapshot Name *</label>
            <Input
              placeholder="e.g., Week 1 - Day Shift"
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              maxLength={100}
              showCount
            />
          </div>
          <div className="form-group">
            <label>Description (Optional)</label>
            <TextArea
              placeholder="Add notes about this snapshot..."
              value={snapshotDescription}
              onChange={(e) => setSnapshotDescription(e.target.value)}
              rows={4}
              maxLength={500}
              showCount
            />
          </div>
          {scheduleData && (
            <div className="snapshot-preview">
              <h4>Snapshot will include:</h4>
              <ul>
                <li>Grid Hours: <strong>{scheduleData.gridHours}h</strong></li>
                <li>Total Sites: <strong>{Object.keys(scheduleData.grid || {}).length}</strong></li>
                <li>Active Sites: <strong>{Object.values(scheduleData.siteActive || {}).filter(Boolean).length}</strong></li>
                <li>Delays: <strong>{delayedSlots.length}</strong></li>
              </ul>
            </div>
          )}
        </div>
      </Modal>

      {/* Load Snapshot Modal */}
      <Modal
        title="Load Snapshot"
        open={loadModalVisible}
        onCancel={() => setLoadModalVisible(false)}
        footer={null}
        width={700}
      >
        <List
          className="snapshot-list"
          loading={loading}
          dataSource={snapshots}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No snapshots saved yet"
              />
            )
          }}
          renderItem={(snapshot) => (
            <List.Item
              key={snapshot._id}
              actions={[
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleLoadSnapshot(snapshot._id)}
                  loading={loading}
                >
                  Load
                </Button>,
                <Popconfirm
                  title="Delete Snapshot"
                  description="Are you sure you want to delete this snapshot?"
                  onConfirm={() => handleDeleteSnapshot(snapshot._id, snapshot.name)}
                  okText="Yes"
                  cancelText="No"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    loading={deleteLoading[snapshot._id]}
                  >
                    Delete
                  </Button>
                </Popconfirm>
              ]}
            >
              <List.Item.Meta
                title={
                  <div className="snapshot-title">
                    <span className="snapshot-name">{snapshot.name}</span>
                    <Tag color="blue">{snapshot.gridHours}h</Tag>
                  </div>
                }
                description={
                  <div className="snapshot-description">
                    {snapshot.description && (
                      <p className="description-text">{snapshot.description}</p>
                    )}
                    <div className="snapshot-stats">
                      <span>Sites: {snapshot.totalSites}</span>
                      <span>Active: {snapshot.activeSites}</span>
                      <span>Tasks: {snapshot.totalTasks}</span>
                      {snapshot.totalDelays > 0 && (
                        <span>Delays: {snapshot.totalDelays}</span>
                      )}
                    </div>
                    <div className="snapshot-meta">
                      <ClockCircleOutlined />
                      <span>{snapshot.age || 'Just now'}</span>
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};

export default SnapshotManager;

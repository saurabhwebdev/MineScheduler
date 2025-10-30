import React, { useState, useEffect } from 'react';
import { Button, Modal, Input, notification, Popconfirm, Empty, Tag, DatePicker, Card, Row, Col, Divider, Segmented, Space, Table } from 'antd';
import { SaveOutlined, FolderOpenOutlined, DeleteOutlined, CalendarOutlined, SearchOutlined, FileTextOutlined } from '@ant-design/icons';
import moment from 'moment';
import config from '../config/config';
import './SnapshotManager.css';

const { TextArea } = Input;

const SnapshotManager = ({ scheduleData, delayedSlots, gridHours, onLoadSnapshot }) => {
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [loadModalVisible, setLoadModalVisible] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotDescription, setSnapshotDescription] = useState('');
  const [snapshotDate, setSnapshotDate] = useState(moment());
  const [snapshots, setSnapshots] = useState([]);
  const [filteredSnapshots, setFilteredSnapshots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState({});
  const [searchText, setSearchText] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  // Fetch snapshots when load modal opens
  useEffect(() => {
    if (loadModalVisible) {
      fetchSnapshots();
    }
  }, [loadModalVisible]);

  // Filter snapshots when search, date filter, or snapshots change
  useEffect(() => {
    filterSnapshots();
  }, [searchText, dateFilter, snapshots]);

  const filterSnapshots = () => {
    let filtered = [...snapshots];

    // Text search filter
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(search) || 
        (s.description && s.description.toLowerCase().includes(search))
      );
    }

    // Date filter
    const now = moment();
    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(s => moment(s.snapshotDate).isSame(now, 'day'));
        break;
      case 'week':
        filtered = filtered.filter(s => moment(s.snapshotDate).isSame(now, 'week'));
        break;
      case 'month':
        filtered = filtered.filter(s => moment(s.snapshotDate).isSame(now, 'month'));
        break;
      default:
        // 'all' - no filter
        break;
    }

    setFilteredSnapshots(filtered);
  };

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
          snapshotDate: snapshotDate.toISOString(),
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
        setSnapshotDate(moment());
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

      {/* Save Snapshot Modal - Modern Design */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <SaveOutlined style={{ color: '#3cca70', fontSize: '20px' }} />
            <span>Save Snapshot</span>
          </div>
        }
        open={saveModalVisible}
        onOk={handleSaveSnapshot}
        onCancel={() => {
          setSaveModalVisible(false);
          setSnapshotName('');
          setSnapshotDescription('');
          setSnapshotDate(moment());
        }}
        okText="Save Snapshot"
        confirmLoading={loading}
        width={600}
        okButtonProps={{
          style: {
            backgroundColor: '#3cca70',
            borderColor: '#3cca70',
            height: '40px',
            fontSize: '14px',
            fontWeight: 600
          }
        }}
        cancelButtonProps={{
          style: {
            height: '40px',
            fontSize: '14px'
          }
        }}
      >
        <div className="modern-snapshot-form">
          <div className="form-field">
            <label className="field-label">
              <FileTextOutlined style={{ marginRight: '6px' }} />
              Snapshot Name *
            </label>
            <Input
              size="large"
              placeholder="e.g., Week 1 - Day Shift Schedule"
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              maxLength={100}
              showCount
              style={{ borderRadius: '8px' }}
            />
          </div>

          <div className="form-field">
            <label className="field-label">
              <CalendarOutlined style={{ marginRight: '6px' }} />
              Snapshot Date *
            </label>
            <DatePicker
              size="large"
              value={snapshotDate}
              onChange={(date) => setSnapshotDate(date || moment())}
              format="MMMM D, YYYY"
              style={{ width: '100%', borderRadius: '8px' }}
            />
            <div style={{ marginTop: '6px', fontSize: '12px', color: '#8c8c8c' }}>
              💡 Select the date this schedule is for
            </div>
          </div>

          <div className="form-field">
            <label className="field-label">
              Description (Optional)
            </label>
            <TextArea
              size="large"
              placeholder="Add notes about this snapshot (e.g., special considerations, changes made...)" 
              value={snapshotDescription}
              onChange={(e) => setSnapshotDescription(e.target.value)}
              rows={4}
              maxLength={500}
              showCount
              style={{ borderRadius: '8px' }}
            />
          </div>

          {scheduleData && (
            <Card className="snapshot-preview-card" size="small">
              <div className="preview-header">
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#595959' }}>📋 Snapshot Contents</span>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <Row gutter={[16, 12]}>
                <Col span={12}>
                  <div className="preview-stat">
                    <span className="stat-label">Grid Hours</span>
                    <span className="stat-value">{scheduleData.gridHours}h</span>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="preview-stat">
                    <span className="stat-label">Total Sites</span>
                    <span className="stat-value">{Object.keys(scheduleData.grid || {}).length}</span>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="preview-stat">
                    <span className="stat-label">Active Sites</span>
                    <span className="stat-value">{Object.values(scheduleData.siteActive || {}).filter(Boolean).length}</span>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="preview-stat">
                    <span className="stat-label">Delays</span>
                    <span className="stat-value">{delayedSlots.length}</span>
                  </div>
                </Col>
              </Row>
            </Card>
          )}
        </div>
      </Modal>

      {/* Load Snapshot Modal - Modern Design */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FolderOpenOutlined style={{ color: '#3cca70', fontSize: '20px' }} />
            <span>Load Snapshot</span>
          </div>
        }
        open={loadModalVisible}
        onCancel={() => {
          setLoadModalVisible(false);
          setSearchText('');
          setDateFilter('all');
        }}
        footer={null}
        width={900}
        className="load-snapshot-modal"
      >
        {/* Search and Filters */}
        <div className="snapshot-filters">
          <Input
            size="large"
            placeholder="Search snapshots by name or description..."
            prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ marginBottom: '16px', borderRadius: '8px' }}
          />
          <Segmented
            value={dateFilter}
            onChange={setDateFilter}
            size="large"
            options={[
              { label: 'All', value: 'all' },
              { label: 'Today', value: 'today' },
              { label: 'This Week', value: 'week' },
              { label: 'This Month', value: 'month' }
            ]}
            style={{ marginBottom: '24px' }}
          />
        </div>

        {/* Snapshots Table */}
        <Table
          dataSource={filteredSnapshots}
          loading={loading}
          rowKey={(record) => record._id}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `Total ${total} snapshots`
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: '#8c8c8c' }}>
                    {searchText || dateFilter !== 'all' ? 'No snapshots match your filters' : 'No snapshots saved yet'}
                  </span>
                }
              >
                {searchText || dateFilter !== 'all' ? (
                  <Button onClick={() => { setSearchText(''); setDateFilter('all'); }}>Clear Filters</Button>
                ) : null}
              </Empty>
            )
          }}
          columns={[
            {
              title: 'Snapshot Name',
              dataIndex: 'name',
              key: 'name',
              width: '30%',
              render: (text) => <strong style={{ color: '#262626' }}>{text}</strong>
            },
            {
              title: 'Date',
              dataIndex: 'snapshotDate',
              key: 'snapshotDate',
              width: '15%',
              sorter: (a, b) => moment(a.snapshotDate).unix() - moment(b.snapshotDate).unix(),
              defaultSortOrder: 'descend',
              render: (date) => (
                <span>
                  <CalendarOutlined style={{ marginRight: '6px', color: '#3cca70' }} />
                  {moment(date).format('MMM D, YYYY')}
                </span>
              )
            },
            {
              title: 'Description',
              dataIndex: 'description',
              key: 'description',
              width: '25%',
              ellipsis: true,
              render: (text) => <span style={{ color: '#595959' }}>{text || '—'}</span>
            },
            {
              title: 'Hours',
              dataIndex: 'gridHours',
              key: 'gridHours',
              width: '8%',
              align: 'center',
              render: (hours) => <Tag color="blue">{hours}h</Tag>
            },
            {
              title: 'Sites',
              dataIndex: 'totalSites',
              key: 'totalSites',
              width: '8%',
              align: 'center',
              render: (total) => <span style={{ color: '#595959' }}>{total}</span>
            },
            {
              title: 'Active',
              dataIndex: 'activeSites',
              key: 'activeSites',
              width: '8%',
              align: 'center',
              render: (active) => <Tag color="green">{active}</Tag>
            },
            {
              title: 'Actions',
              key: 'actions',
              width: '14%',
              align: 'center',
              render: (_, record) => (
                <Space size="small">
                  <Button
                    type="primary"
                    size="small"
                    icon={<FolderOpenOutlined />}
                    onClick={() => handleLoadSnapshot(record._id)}
                    loading={loading}
                    style={{
                      backgroundColor: '#3cca70',
                      borderColor: '#3cca70'
                    }}
                  >
                    Load
                  </Button>
                  <Popconfirm
                    title="Delete Snapshot?"
                    description="This action cannot be undone."
                    onConfirm={() => handleDeleteSnapshot(record._id, record.name)}
                    okText="Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      loading={deleteLoading[record._id]}
                    />
                  </Popconfirm>
                </Space>
              )
            }
          ]}
        />
      </Modal>
    </div>
  );
};

export default SnapshotManager;

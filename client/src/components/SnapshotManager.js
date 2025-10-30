import React, { useState, useEffect } from 'react';
import { Button, Modal, Input, notification, Popconfirm, Empty, Tag, DatePicker, Card, Row, Col, Divider, Segmented, Space, Table } from 'antd';
import { SaveOutlined, FolderOpenOutlined, DeleteOutlined, CalendarOutlined, SearchOutlined, FileTextOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import config from '../config/config';
import './SnapshotManager.css';

const { TextArea } = Input;

const SnapshotManager = ({ scheduleData, delayedSlots, gridHours, onLoadSnapshot }) => {
  const { t } = useTranslation();
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
          message: t('common.error'),
          description: data.message || t('schedule.snapshot.messages.fetchError'),
        });
      }
    } catch (error) {
      console.error('Error fetching snapshots:', error);
      notification.error({
        message: t('schedule.messages.networkError'),
        description: t('schedule.snapshot.messages.fetchError'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSnapshot = async () => {
    if (!snapshotName.trim()) {
      notification.warning({
        message: t('common.error'),
        description: t('schedule.snapshot.messages.nameRequired'),
      });
      return;
    }

    if (!scheduleData) {
      notification.warning({
        message: t('common.error'),
        description: t('schedule.snapshot.messages.noSchedule'),
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
          message: t('common.success'),
          description: t('schedule.snapshot.messages.saveSuccess'),
          duration: 2
        });
        setSaveModalVisible(false);
        setSnapshotName('');
        setSnapshotDescription('');
        setSnapshotDate(moment());
      } else {
        notification.error({
          message: t('common.error'),
          description: data.message || t('schedule.snapshot.messages.saveError'),
        });
      }
    } catch (error) {
      console.error('Error saving snapshot:', error);
      notification.error({
        message: t('schedule.messages.networkError'),
        description: t('schedule.snapshot.messages.saveError'),
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
          message: t('common.success'),
          description: t('schedule.snapshot.messages.loadSuccess', { name: snapshot.name }),
          duration: 2
        });
        setLoadModalVisible(false);
      } else {
        notification.error({
          message: t('common.error'),
          description: snapshotData.message || t('schedule.snapshot.messages.loadError'),
        });
      }
    } catch (error) {
      console.error('Error loading snapshot:', error);
      notification.error({
        message: t('schedule.messages.networkError'),
        description: t('schedule.snapshot.messages.loadError'),
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
          message: t('common.success'),
          description: t('schedule.snapshot.messages.deleteSuccess', { name: snapshotName }),
          duration: 2
        });
        // Refresh the list
        fetchSnapshots();
      } else {
        notification.error({
          message: t('common.error'),
          description: data.message || t('schedule.snapshot.messages.deleteError'),
        });
      }
    } catch (error) {
      console.error('Error deleting snapshot:', error);
      notification.error({
        message: t('schedule.messages.networkError'),
        description: t('schedule.snapshot.messages.deleteError'),
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
          title={t('schedule.saveSnapshot')}
          data-snapshot-action="save"
        >
          {t('schedule.saveSnapshot')}
        </Button>
        <Button
          icon={<FolderOpenOutlined />}
          onClick={() => setLoadModalVisible(true)}
          title={t('schedule.loadSnapshot')}
          data-snapshot-action="load"
        >
          {t('schedule.loadSnapshot')}
        </Button>
      </Space>

      {/* Save Snapshot Modal - Modern Design */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <SaveOutlined style={{ color: '#3cca70', fontSize: '20px' }} />
            <span>{t('schedule.snapshot.saveModal.title')}</span>
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
        okText={t('schedule.snapshot.saveModal.saveButton')}
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
              {t('schedule.snapshot.saveModal.nameLabel')} *
            </label>
            <Input
              size="large"
              placeholder={t('schedule.snapshot.saveModal.namePlaceholder')}
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
              {t('schedule.snapshot.saveModal.dateLabel')} *
            </label>
            <DatePicker
              size="large"
              value={snapshotDate}
              onChange={(date) => setSnapshotDate(date || moment())}
              format="MMMM D, YYYY"
              style={{ width: '100%', borderRadius: '8px' }}
            />
            <div style={{ marginTop: '6px', fontSize: '12px', color: '#8c8c8c' }}>
              {t('schedule.snapshot.saveModal.dateHint')}
            </div>
          </div>

          <div className="form-field">
            <label className="field-label">
              {t('schedule.snapshot.saveModal.descriptionLabel')}
            </label>
            <TextArea
              size="large"
              placeholder={t('schedule.snapshot.saveModal.descriptionPlaceholder')}
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
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#595959' }}>{t('schedule.snapshot.saveModal.previewTitle')}</span>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <Row gutter={[16, 12]}>
                <Col span={12}>
                  <div className="preview-stat">
                    <span className="stat-label">{t('schedule.snapshot.saveModal.gridHours')}</span>
                    <span className="stat-value">{scheduleData.gridHours}h</span>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="preview-stat">
                    <span className="stat-label">{t('schedule.snapshot.saveModal.totalSites')}</span>
                    <span className="stat-value">{Object.keys(scheduleData.grid || {}).length}</span>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="preview-stat">
                    <span className="stat-label">{t('schedule.snapshot.saveModal.activeSites')}</span>
                    <span className="stat-value">{Object.values(scheduleData.siteActive || {}).filter(Boolean).length}</span>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="preview-stat">
                    <span className="stat-label">{t('schedule.snapshot.saveModal.delays')}</span>
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
            <span>{t('schedule.snapshot.loadModal.title')}</span>
          </div>
        }
        open={loadModalVisible}
        onCancel={() => {
          setLoadModalVisible(false);
          setSearchText('');
          setDateFilter('all');
        }}
        footer={null}
        width={1100}
        className="load-snapshot-modal"
      >
        {/* Search and Filters */}
        <div className="snapshot-filters">
          <Input
            size="large"
            placeholder={t('schedule.snapshot.loadModal.searchPlaceholder')}
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
              { label: t('schedule.snapshot.loadModal.filterAll'), value: 'all' },
              { label: t('schedule.snapshot.loadModal.filterToday'), value: 'today' },
              { label: t('schedule.snapshot.loadModal.filterWeek'), value: 'week' },
              { label: t('schedule.snapshot.loadModal.filterMonth'), value: 'month' }
            ]}
            style={{ marginBottom: '24px' }}
          />
        </div>

        {/* Snapshots Table */}
        <Table
          dataSource={filteredSnapshots}
          loading={loading}
          rowKey={(record) => record._id}
          size="small"
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => total === 1 ? t('schedule.snapshot.loadModal.paginationTotal', { total }) : t('schedule.snapshot.loadModal.paginationTotal_plural', { total }),
            size: 'small'
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: '#8c8c8c', fontSize: '13px' }}>
                    {searchText || dateFilter !== 'all' ? t('schedule.snapshot.loadModal.emptyNoMatch') : t('schedule.snapshot.loadModal.emptyNoSnapshots')}
                  </span>
                }
              >
                {searchText || dateFilter !== 'all' ? (
                  <Button size="small" onClick={() => { setSearchText(''); setDateFilter('all'); }}>{t('schedule.snapshot.loadModal.clearFilters')}</Button>
                ) : null}
              </Empty>
            )
          }}
          style={{ fontSize: '13px' }}
          columns={[
            {
              title: t('schedule.snapshot.loadModal.columns.name'),
              dataIndex: 'name',
              key: 'name',
              ellipsis: true,
              render: (text) => <strong style={{ color: '#262626', fontSize: '13px' }}>{text}</strong>
            },
            {
              title: t('schedule.snapshot.loadModal.columns.date'),
              dataIndex: 'snapshotDate',
              key: 'snapshotDate',
              width: 140,
              sorter: (a, b) => moment(a.snapshotDate).unix() - moment(b.snapshotDate).unix(),
              defaultSortOrder: 'descend',
              render: (date) => (
                <span style={{ fontSize: '13px', color: '#595959' }}>
                  <CalendarOutlined style={{ marginRight: '4px', color: '#3cca70', fontSize: '12px' }} />
                  {moment(date).format('MMM D, YYYY')}
                </span>
              )
            },
            {
              title: t('schedule.snapshot.loadModal.columns.description'),
              dataIndex: 'description',
              key: 'description',
              ellipsis: true,
              render: (text) => <span style={{ color: '#8c8c8c', fontSize: '12px' }}>{text || '—'}</span>
            },
            {
              title: t('schedule.snapshot.loadModal.columns.hours'),
              dataIndex: 'gridHours',
              key: 'gridHours',
              width: 70,
              align: 'center',
              render: (hours) => <Tag color="blue" style={{ fontSize: '11px', margin: 0 }}>{hours}h</Tag>
            },
            {
              title: t('schedule.snapshot.loadModal.columns.sites'),
              dataIndex: 'totalSites',
              key: 'totalSites',
              width: 60,
              align: 'center',
              render: (total) => <span style={{ color: '#595959', fontSize: '12px' }}>{total}</span>
            },
            {
              title: t('schedule.snapshot.loadModal.columns.active'),
              dataIndex: 'activeSites',
              key: 'activeSites',
              width: 65,
              align: 'center',
              render: (active) => <Tag color="green" style={{ fontSize: '11px', margin: 0 }}>{active}</Tag>
            },
            {
              title: t('schedule.snapshot.loadModal.columns.actions'),
              key: 'actions',
              width: 120,
              align: 'center',
              render: (_, record) => (
                <Space size={4}>
                  <Button
                    type="primary"
                    size="small"
                    icon={<FolderOpenOutlined />}
                    onClick={() => handleLoadSnapshot(record._id)}
                    loading={loading}
                    style={{
                      backgroundColor: '#3cca70',
                      borderColor: '#3cca70',
                      fontSize: '12px',
                      height: '26px',
                      padding: '0 8px'
                    }}
                  />
                  <Popconfirm
                    title={t('schedule.snapshot.loadModal.deleteTitle')}
                    description={t('schedule.snapshot.loadModal.deleteDescription')}
                    onConfirm={() => handleDeleteSnapshot(record._id, record.name)}
                    okText={t('schedule.snapshot.loadModal.deleteOk')}
                    cancelText={t('schedule.snapshot.loadModal.deleteCancel')}
                    okButtonProps={{ danger: true, size: 'small' }}
                    cancelButtonProps={{ size: 'small' }}
                  >
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      loading={deleteLoading[record._id]}
                      style={{
                        fontSize: '12px',
                        height: '26px',
                        padding: '0 8px'
                      }}
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

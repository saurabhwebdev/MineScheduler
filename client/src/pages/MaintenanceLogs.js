import React, { useState, useEffect } from 'react';
import { Table, Modal, Form, Input, InputNumber, Select, DatePicker, notification, Upload, Alert, Tag, Card, Row, Col, Statistic, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, UploadOutlined, DownloadOutlined, EyeOutlined, DollarOutlined, ToolOutlined, CalendarOutlined, WarningOutlined, BarChartOutlined, UnorderedListOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import moment from 'moment';
import DashboardLayout from '../components/DashboardLayout';
import MaintenanceAnalytics from '../components/MaintenanceAnalytics';
import config from '../config/config';
import './MaintenanceLogs.css';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const MaintenanceLogs = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [deletingLog, setDeletingLog] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [form] = Form.useForm();

  // Filters
  const [filters, setFilters] = useState({
    equipment: null,
    type: null,
    dateRange: null,
    performedBy: null
  });

  useEffect(() => {
    fetchLogs();
    fetchEquipment();
    fetchStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Build query string
      const params = new URLSearchParams();
      if (filters.equipment) params.append('equipment', filters.equipment);
      if (filters.type) params.append('type', filters.type);
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.append('startDate', filters.dateRange[0].toISOString());
        params.append('endDate', filters.dateRange[1].toISOString());
      }
      if (filters.performedBy) params.append('performedBy', filters.performedBy);
      
      const queryString = params.toString();
      const url = `${config.apiUrl}/maintenance-logs${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setLogs(data.data.logs);
      } else {
        notification.error({
          message: t('maintenanceLogs.messages.error'),
          description: data.message || t('maintenanceLogs.messages.fetchError'),
        });
      }
    } catch (error) {
      console.error('Error fetching maintenance logs:', error);
      notification.error({
        message: t('maintenanceLogs.messages.networkError'),
        description: t('maintenanceLogs.messages.fetchError'),
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/equipment`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setEquipment(data.data.equipment);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/maintenance-logs/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateLog = () => {
    setEditingLog(null);
    form.resetFields();
    form.setFieldsValue({
      maintenanceType: 'scheduled',
      performedDate: moment(),
      laborCost: 0,
      partsCost: 0,
      duration: 0
    });
    setIsModalVisible(true);
  };

  const handleEditLog = (log) => {
    setEditingLog(log);
    form.setFieldsValue({
      equipment: log.equipment?._id,
      maintenanceType: log.maintenanceType,
      description: log.description,
      performedDate: moment(log.performedDate),
      nextDue: log.nextDue ? moment(log.nextDue) : null,
      laborCost: log.laborCost || 0,
      partsCost: log.partsCost || 0,
      duration: log.duration,
      performedBy: log.performedBy,
      notes: log.notes
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem('token');

      // Convert dates to ISO strings
      if (values.performedDate) {
        values.performedDate = values.performedDate.toISOString();
      }
      if (values.nextDue) {
        values.nextDue = values.nextDue.toISOString();
      }

      if (editingLog) {
        // Update log
        const response = await fetch(`${config.apiUrl}/maintenance-logs/${editingLog._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(values),
        });
        const data = await response.json();

        if (response.ok && data.status === 'success') {
          notification.success({
            message: t('maintenanceLogs.messages.success'),
            description: t('maintenanceLogs.messages.updateSuccess'),
          });
          fetchLogs();
          fetchStats();
        } else {
          notification.error({
            message: t('maintenanceLogs.messages.error'),
            description: data.message || t('maintenanceLogs.messages.updateError'),
          });
        }
      } else {
        // Create new log
        const response = await fetch(`${config.apiUrl}/maintenance-logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(values),
        });
        const data = await response.json();

        if (response.ok && data.status === 'success') {
          notification.success({
            message: t('maintenanceLogs.messages.success'),
            description: t('maintenanceLogs.messages.createSuccess'),
          });
          fetchLogs();
          fetchStats();
        } else {
          notification.error({
            message: t('maintenanceLogs.messages.error'),
            description: data.message || t('maintenanceLogs.messages.createError'),
          });
        }
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const showDeleteConfirm = (log) => {
    setDeletingLog(log);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteLog = async () => {
    if (!deletingLog) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/maintenance-logs/${deletingLog._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        notification.success({
          message: t('maintenanceLogs.messages.success'),
          description: t('maintenanceLogs.messages.deleteSuccess'),
        });
        fetchLogs();
        fetchStats();
      } else {
        notification.error({
          message: t('maintenanceLogs.messages.error'),
          description: data.message || t('maintenanceLogs.messages.deleteError'),
        });
      }
    } catch (error) {
      console.error('Error deleting maintenance log:', error);
      notification.error({
        message: t('maintenanceLogs.messages.networkError'),
        description: t('maintenanceLogs.messages.deleteError'),
      });
    } finally {
      setIsDeleteModalVisible(false);
      setDeletingLog(null);
    }
  };

  const showDetailModal = (log) => {
    setSelectedLog(log);
    setIsDetailModalVisible(true);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        equipmentId: 'EQ-001',
        maintenanceType: 'scheduled',
        description: 'Regular maintenance check',
        performedDate: new Date().toISOString(),
        nextDue: null,
        laborCost: 300,
        partsCost: 200,
        duration: 2,
        performedBy: 'John Doe',
        notes: 'All systems operational'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Maintenance Logs');
    XLSX.writeFile(workbook, 'maintenance_logs_template.xlsx');
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/maintenance-logs/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        const worksheet = XLSX.utils.json_to_sheet(data.data.logs);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Maintenance Logs');
        XLSX.writeFile(workbook, 'maintenance_logs_export.xlsx');
        notification.success({
          message: t('maintenanceLogs.messages.success'),
          description: t('maintenanceLogs.messages.exportSuccess'),
        });
      }
    } catch (error) {
      console.error('Error exporting maintenance logs:', error);
      notification.error({
        message: t('maintenanceLogs.messages.error'),
        description: t('maintenanceLogs.messages.exportError'),
      });
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      notification.error({
        message: t('maintenanceLogs.messages.error'),
        description: t('maintenanceLogs.messages.selectFileError'),
      });
      return;
    }

    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const token = localStorage.getItem('token');
        const response = await fetch(`${config.apiUrl}/maintenance-logs/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ logs: jsonData }),
        });
        const result = await response.json();

        if (response.ok && result.status === 'success') {
          setImportResults(result.data);
          notification.success({
            message: t('maintenanceLogs.messages.importComplete'),
            description: t('maintenanceLogs.messages.importSuccess', { count: result.data.imported }),
          });
          fetchLogs();
          fetchStats();
        } else {
          notification.error({
            message: t('maintenanceLogs.messages.error'),
            description: result.message || t('maintenanceLogs.messages.importError'),
          });
        }
      };
      reader.readAsArrayBuffer(importFile);
    } catch (error) {
      console.error('Error importing maintenance logs:', error);
      notification.error({
        message: t('maintenanceLogs.messages.error'),
        description: t('maintenanceLogs.messages.importError'),
      });
    } finally {
      setImporting(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      equipment: null,
      type: null,
      dateRange: null,
      performedBy: null
    });
  };

  const columns = [
    {
      title: t('maintenanceLogs.columns.date'),
      dataIndex: 'performedDate',
      key: 'performedDate',
      render: (date) => moment(date).format('MMM D, YYYY'),
      sorter: (a, b) => new Date(a.performedDate) - new Date(b.performedDate),
      width: 120,
    },
    {
      title: t('maintenanceLogs.columns.equipment'),
      dataIndex: ['equipment', 'equipmentId'],
      key: 'equipment',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.equipment?.equipmentId}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{record.equipment?.name}</div>
        </div>
      ),
      width: 150,
    },
    {
      title: t('maintenanceLogs.columns.type'),
      dataIndex: 'maintenanceType',
      key: 'maintenanceType',
      render: (type) => {
        const colors = {
          scheduled: 'blue',
          unscheduled: 'orange',
          emergency: 'red',
          inspection: 'green'
        };
        return <Tag color={colors[type] || 'default'}>{type.toUpperCase()}</Tag>;
      },
      width: 130,
    },
    {
      title: t('maintenanceLogs.columns.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: t('maintenanceLogs.columns.performedBy'),
      dataIndex: 'performedBy',
      key: 'performedBy',
      render: (by) => by || '-',
      width: 140,
    },
    {
      title: t('maintenanceLogs.columns.labor'),
      dataIndex: 'laborCost',
      key: 'laborCost',
      render: (cost) => cost ? `$${cost.toFixed(2)}` : '-',
      width: 90,
    },
    {
      title: t('maintenanceLogs.columns.parts'),
      dataIndex: 'partsCost',
      key: 'partsCost',
      render: (cost) => cost ? `$${cost.toFixed(2)}` : '-',
      width: 90,
    },
    {
      title: t('maintenanceLogs.columns.total'),
      dataIndex: 'cost',
      key: 'cost',
      render: (cost) => cost ? `$${cost.toFixed(2)}` : '-',
      sorter: (a, b) => (a.cost || 0) - (b.cost || 0),
      width: 90,
    },
    {
      title: t('maintenanceLogs.columns.duration'),
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => duration ? `${duration}h` : '-',
      width: 90,
    },
    {
      title: t('maintenanceLogs.columns.nextDue'),
      dataIndex: 'nextDue',
      key: 'nextDue',
      render: (date) => date ? moment(date).format('MMM D, YYYY') : '-',
      width: 120,
    },
    {
      title: t('maintenanceLogs.columns.actions'),
      key: 'actions',
      align: 'center',
      width: 120,
      render: (_, record) => (
        <div className="action-buttons">
          <button className="icon-btn" onClick={() => showDetailModal(record)} title={t('maintenanceLogs.tooltips.viewDetails')}>
            <EyeOutlined />
          </button>
          <button className="icon-btn" onClick={() => handleEditLog(record)}>
            <EditOutlined />
          </button>
          <button 
            className="icon-btn delete"
            onClick={() => showDeleteConfirm(record)}
          >
            <DeleteOutlined />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout
      title={t('maintenanceLogs.title')}
      subtitle={t('maintenanceLogs.subtitle')}
      page="maintenance-logs"
    >
      <div className="maintenance-logs-page">
        <Tabs
          defaultActiveKey="logs"
          size="large"
          style={{ marginBottom: 16 }}
          items={[
            {
              key: 'logs',
              label: (
                <span>
                  <UnorderedListOutlined /> {t('maintenanceLogs.tabs.logs')}
                </span>
              ),
              children: (
                <div>
        {/* Statistics Cards */}
        {stats && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card className="stat-card">
                <Statistic
                  title={t('maintenanceLogs.stats.totalLogs')}
                  value={stats.totalLogs}
                  prefix={<ToolOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="stat-card">
                <Statistic
                  title={t('maintenanceLogs.stats.thisMonth')}
                  value={stats.currentMonth?.cost || 0}
                  prefix={<DollarOutlined />}
                  precision={2}
                  valueStyle={{ color: '#1890ff' }}
                  suffix={`(${stats.currentMonth?.count || 0})`}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="stat-card">
                <Statistic
                  title={t('maintenanceLogs.stats.upcoming')}
                  value={stats.upcoming || 0}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="stat-card">
                <Statistic
                  title={t('maintenanceLogs.stats.overdue')}
                  value={stats.overdue || 0}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Filters */}
        <div className="filters-section">
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder={t('maintenanceLogs.filters.equipment')}
                style={{ width: '100%' }}
                allowClear
                showSearch
                value={filters.equipment}
                onChange={(value) => handleFilterChange('equipment', value)}
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {equipment.map(eq => (
                  <Option key={eq._id} value={eq._id}>
                    {eq.equipmentId} - {eq.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder={t('maintenanceLogs.filters.type')}
                style={{ width: '100%' }}
                allowClear
                value={filters.type}
                onChange={(value) => handleFilterChange('type', value)}
              >
                <Option value="scheduled">{t('maintenanceLogs.types.scheduled')}</Option>
                <Option value="unscheduled">{t('maintenanceLogs.types.unscheduled')}</Option>
                <Option value="emergency">{t('maintenanceLogs.types.emergency')}</Option>
                <Option value="inspection">{t('maintenanceLogs.types.inspection')}</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <RangePicker
                style={{ width: '100%' }}
                value={filters.dateRange}
                onChange={(dates) => handleFilterChange('dateRange', dates)}
              />
            </Col>
            <Col xs={24} sm={12} md={4}>
              <button className="btn-secondary" style={{ width: '100%' }} onClick={clearFilters}>
                {t('maintenanceLogs.clearFilters')}
              </button>
            </Col>
          </Row>
        </div>

        {/* Action Buttons */}
        <div className="page-header">
          <div className="header-actions">
            <button className="btn-secondary" onClick={handleDownloadTemplate}>
              <DownloadOutlined /> {t('maintenanceLogs.template')}
            </button>
            <button className="btn-secondary" onClick={() => setIsImportModalVisible(true)}>
              <UploadOutlined /> {t('maintenanceLogs.import')}
            </button>
            <button className="btn-secondary" onClick={handleExport}>
              <DownloadOutlined /> {t('maintenanceLogs.export')}
            </button>
            <button className="btn-primary" onClick={handleCreateLog}>
              <PlusOutlined /> {t('maintenanceLogs.newLog')}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <Table
            columns={columns}
            dataSource={logs}
            loading={loading}
            rowKey="_id"
            pagination={{
              pageSize: 15,
              showSizeChanger: false,
              simple: false,
            }}
            scroll={{ x: 1200 }}
          />
        </div>

        {/* Create/Edit Modal */}
        <Modal
          title={editingLog ? t('maintenanceLogs.editLog') : t('maintenanceLogs.newLog')}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
          }}
          okText={editingLog ? t('maintenanceLogs.save') : t('maintenanceLogs.create')}
          cancelText={t('maintenanceLogs.cancel')}
          width={700}
          className="simple-modal"
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label={t('maintenanceLogs.form.equipment')}
              name="equipment"
              rules={[{ required: true, message: t('maintenanceLogs.form.required') }]}
            >
              <Select placeholder={t('maintenanceLogs.form.selectEquipment')} showSearch allowClear>
                {equipment.map(eq => (
                  <Option key={eq._id} value={eq._id}>
                    {eq.equipmentId} - {eq.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={t('maintenanceLogs.form.maintenanceType')}
              name="maintenanceType"
              rules={[{ required: true, message: t('maintenanceLogs.form.required') }]}
            >
              <Select>
                <Option value="scheduled">{t('maintenanceLogs.types.scheduled')}</Option>
                <Option value="unscheduled">{t('maintenanceLogs.types.unscheduled')}</Option>
                <Option value="emergency">{t('maintenanceLogs.types.emergency')}</Option>
                <Option value="inspection">{t('maintenanceLogs.types.inspection')}</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={t('maintenanceLogs.form.description')}
              name="description"
              rules={[{ required: true, message: t('maintenanceLogs.form.required') }]}
            >
              <TextArea rows={3} placeholder={t('maintenanceLogs.form.descriptionPlaceholder')} />
            </Form.Item>

            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item
                label={t('maintenanceLogs.form.performedDate')}
                name="performedDate"
                rules={[{ required: true, message: t('maintenanceLogs.form.required') }]}
                style={{ flex: 1 }}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>

              <Form.Item label={t('maintenanceLogs.form.nextDue')} name="nextDue" style={{ flex: 1 }}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item label={t('maintenanceLogs.form.laborCost')} name="laborCost" style={{ flex: 1 }}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder={t('maintenanceLogs.form.laborCostPlaceholder')} />
              </Form.Item>

              <Form.Item label={t('maintenanceLogs.form.partsCost')} name="partsCost" style={{ flex: 1 }}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder={t('maintenanceLogs.form.partsCostPlaceholder')} />
              </Form.Item>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item label={t('maintenanceLogs.form.duration')} name="duration" style={{ flex: 1 }}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <div style={{ flex: 1 }} />
            </div>

            <Form.Item label={t('maintenanceLogs.form.performedBy')} name="performedBy">
              <Input placeholder={t('maintenanceLogs.form.performedByPlaceholder')} />
            </Form.Item>

            <Form.Item label={t('maintenanceLogs.form.additionalNotes')} name="notes">
              <TextArea rows={2} placeholder={t('maintenanceLogs.form.additionalNotesPlaceholder')} />
            </Form.Item>
          </Form>
        </Modal>

        {/* Delete Modal */}
        <Modal
          title={t('maintenanceLogs.deleteLog')}
          open={isDeleteModalVisible}
          onOk={handleDeleteLog}
          onCancel={() => {
            setIsDeleteModalVisible(false);
            setDeletingLog(null);
          }}
          okText={t('maintenanceLogs.delete')}
          cancelText={t('maintenanceLogs.cancel')}
          width={400}
          className="delete-modal"
          okButtonProps={{ danger: true }}
        >
          <div className="delete-modal-content">
            <ExclamationCircleOutlined className="delete-icon" />
            <div>
              <p className="delete-message">
                {t('maintenanceLogs.deleteModal.message')} <strong>{deletingLog?.equipment?.equipmentId}</strong>?
              </p>
              <p className="delete-warning">
                {t('maintenanceLogs.deleteModal.warning')}
              </p>
            </div>
          </div>
        </Modal>

        {/* Detail Modal */}
        <Modal
          title={t('maintenanceLogs.logDetails')}
          open={isDetailModalVisible}
          onCancel={() => {
            setIsDetailModalVisible(false);
            setSelectedLog(null);
          }}
          footer={null}
          width={800}
          className="simple-modal"
        >
          {selectedLog && (
            <div className="maintenance-details">
              <div className="detail-section">
                <h4>{t('maintenanceLogs.details.equipmentInformation')}</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>{t('maintenanceLogs.details.equipmentId')}:</label>
                    <span>{selectedLog.equipment?.equipmentId}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('maintenanceLogs.details.name')}:</label>
                    <span>{selectedLog.equipment?.name}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('maintenanceLogs.details.type')}:</label>
                    <Tag color="blue">{selectedLog.equipment?.type}</Tag>
                  </div>
                  <div className="detail-item">
                    <label>{t('maintenanceLogs.details.status')}:</label>
                    <Tag color={selectedLog.equipment?.status === 'operational' ? 'green' : 'orange'}>
                      {selectedLog.equipment?.status}
                    </Tag>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>{t('maintenanceLogs.details.maintenanceDetails')}</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>{t('maintenanceLogs.details.type')}:</label>
                    <Tag color={
                      selectedLog.maintenanceType === 'scheduled' ? 'blue' :
                      selectedLog.maintenanceType === 'emergency' ? 'red' :
                      selectedLog.maintenanceType === 'inspection' ? 'green' : 'orange'
                    }>
                      {selectedLog.maintenanceType.toUpperCase()}
                    </Tag>
                  </div>
                  <div className="detail-item">
                    <label>{t('maintenanceLogs.details.performedDate')}:</label>
                    <span>{moment(selectedLog.performedDate).format('MMM D, YYYY')}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('maintenanceLogs.details.nextDue')}:</label>
                    <span>{selectedLog.nextDue ? moment(selectedLog.nextDue).format('MMM D, YYYY') : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('maintenanceLogs.details.performedBy')}:</label>
                    <span>{selectedLog.performedBy || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('maintenanceLogs.details.laborCost')}:</label>
                    <span>{selectedLog.laborCost ? `$${selectedLog.laborCost.toFixed(2)}` : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('maintenanceLogs.details.partsCost')}:</label>
                    <span>{selectedLog.partsCost ? `$${selectedLog.partsCost.toFixed(2)}` : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('maintenanceLogs.details.totalCost')}:</label>
                    <span>{selectedLog.cost ? `$${selectedLog.cost.toFixed(2)}` : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('maintenanceLogs.details.duration')}:</label>
                    <span>{selectedLog.duration ? `${selectedLog.duration}h` : '-'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>{t('maintenanceLogs.details.description')}</h4>
                <p>{selectedLog.description}</p>
              </div>

              {selectedLog.notes && (
                <div className="detail-section">
                  <h4>{t('maintenanceLogs.details.notes')}</h4>
                  <p>{selectedLog.notes}</p>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Import Modal */}
        <Modal
          title={t('maintenanceLogs.importModal.title')}
          open={isImportModalVisible}
          onOk={handleImport}
          onCancel={() => {
            setIsImportModalVisible(false);
            setImportFile(null);
            setImportResults(null);
          }}
          okText={t('maintenanceLogs.import')}
          cancelText={t('maintenanceLogs.cancel')}
          confirmLoading={importing}
          width={500}
          className="simple-modal"
        >
          <Alert
            message={t('maintenanceLogs.importModal.instructions')}
            description={t('maintenanceLogs.importModal.description')}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Upload
            beforeUpload={(file) => {
              setImportFile(file);
              return false;
            }}
            onRemove={() => setImportFile(null)}
            maxCount={1}
            accept=".xlsx,.xls"
          >
            <button className="btn-secondary" style={{ marginBottom: 16 }}>
              <UploadOutlined /> {t('maintenanceLogs.importModal.selectFile')}
            </button>
          </Upload>

          {importResults && (
            <Alert
              message={t('maintenanceLogs.importModal.results', { succeeded: importResults.imported, failed: importResults.failed })}
              type={importResults.failed > 0 ? 'warning' : 'success'}
              showIcon
              description={
                importResults.failed > 0 && (
                  <div style={{ maxHeight: 150, overflow: 'auto', marginTop: 8 }}>
                    {importResults.results.failed.map((fail, idx) => (
                      <div key={idx} style={{ fontSize: 12 }}>
                        {fail.data.equipmentId}: {fail.error}
                      </div>
                    ))}
                  </div>
                )
              }
            />
          )}
        </Modal>
                </div>
              )
            },
            {
              key: 'analytics',
              label: (
                <span>
                  <BarChartOutlined /> {t('maintenanceLogs.analyticsDashboard')}
                </span>
              ),
              children: (
                <MaintenanceAnalytics />
              )
            }
          ]}
        />
      </div>
    </DashboardLayout>
  );
};

export default MaintenanceLogs;

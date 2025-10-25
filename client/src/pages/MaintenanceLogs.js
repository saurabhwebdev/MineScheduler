import React, { useState, useEffect } from 'react';
import { Table, Modal, Form, Input, InputNumber, Select, DatePicker, notification, Upload, Alert, Tag, Card, Row, Col, Statistic, Tabs } from 'antd';
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
          message: 'Error',
          description: data.message || 'Failed to fetch maintenance logs',
        });
      }
    } catch (error) {
      console.error('Error fetching maintenance logs:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to fetch maintenance logs',
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
            message: 'Success',
            description: 'Maintenance log updated successfully',
          });
          fetchLogs();
          fetchStats();
        } else {
          notification.error({
            message: 'Error',
            description: data.message || 'Failed to update maintenance log',
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
            message: 'Success',
            description: 'Maintenance log created successfully',
          });
          fetchLogs();
          fetchStats();
        } else {
          notification.error({
            message: 'Error',
            description: data.message || 'Failed to create maintenance log',
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
          message: 'Success',
          description: 'Maintenance log deleted successfully',
        });
        fetchLogs();
        fetchStats();
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to delete maintenance log',
        });
      }
    } catch (error) {
      console.error('Error deleting maintenance log:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to delete maintenance log',
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
          message: 'Success',
          description: 'Maintenance logs exported successfully',
        });
      }
    } catch (error) {
      console.error('Error exporting maintenance logs:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to export maintenance logs',
      });
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      notification.error({
        message: 'Error',
        description: 'Please select a file to import',
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
            message: 'Import Complete',
            description: `Imported ${result.data.imported} maintenance logs successfully`,
          });
          fetchLogs();
          fetchStats();
        } else {
          notification.error({
            message: 'Error',
            description: result.message || 'Failed to import maintenance logs',
          });
        }
      };
      reader.readAsArrayBuffer(importFile);
    } catch (error) {
      console.error('Error importing maintenance logs:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to import maintenance logs',
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
      title: 'DATE',
      dataIndex: 'performedDate',
      key: 'performedDate',
      render: (date) => moment(date).format('MMM D, YYYY'),
      sorter: (a, b) => new Date(a.performedDate) - new Date(b.performedDate),
      width: 120,
    },
    {
      title: 'EQUIPMENT',
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
      title: 'TYPE',
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
      title: 'DESCRIPTION',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'PERFORMED BY',
      dataIndex: 'performedBy',
      key: 'performedBy',
      render: (by) => by || '-',
      width: 140,
    },
    {
      title: 'LABOR',
      dataIndex: 'laborCost',
      key: 'laborCost',
      render: (cost) => cost ? `$${cost.toFixed(2)}` : '-',
      width: 90,
    },
    {
      title: 'PARTS',
      dataIndex: 'partsCost',
      key: 'partsCost',
      render: (cost) => cost ? `$${cost.toFixed(2)}` : '-',
      width: 90,
    },
    {
      title: 'TOTAL',
      dataIndex: 'cost',
      key: 'cost',
      render: (cost) => cost ? `$${cost.toFixed(2)}` : '-',
      sorter: (a, b) => (a.cost || 0) - (b.cost || 0),
      width: 90,
    },
    {
      title: 'DURATION',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => duration ? `${duration}h` : '-',
      width: 90,
    },
    {
      title: 'NEXT DUE',
      dataIndex: 'nextDue',
      key: 'nextDue',
      render: (date) => date ? moment(date).format('MMM D, YYYY') : '-',
      width: 120,
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      align: 'center',
      width: 120,
      render: (_, record) => (
        <div className="action-buttons">
          <button className="icon-btn" onClick={() => showDetailModal(record)} title="View Details">
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
      title="Maintenance Logs"
      subtitle="Track and manage equipment maintenance records"
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
                  <UnorderedListOutlined /> Maintenance Logs
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
                  title="Total Logs"
                  value={stats.totalLogs}
                  prefix={<ToolOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="stat-card">
                <Statistic
                  title="This Month"
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
                  title="Upcoming (7 days)"
                  value={stats.upcoming || 0}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="stat-card">
                <Statistic
                  title="Overdue"
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
                placeholder="Filter by Equipment"
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
                placeholder="Filter by Type"
                style={{ width: '100%' }}
                allowClear
                value={filters.type}
                onChange={(value) => handleFilterChange('type', value)}
              >
                <Option value="scheduled">Scheduled</Option>
                <Option value="unscheduled">Unscheduled</Option>
                <Option value="emergency">Emergency</Option>
                <Option value="inspection">Inspection</Option>
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
                Clear Filters
              </button>
            </Col>
          </Row>
        </div>

        {/* Action Buttons */}
        <div className="page-header">
          <div className="header-actions">
            <button className="btn-secondary" onClick={handleDownloadTemplate}>
              <DownloadOutlined /> Template
            </button>
            <button className="btn-secondary" onClick={() => setIsImportModalVisible(true)}>
              <UploadOutlined /> Import
            </button>
            <button className="btn-secondary" onClick={handleExport}>
              <DownloadOutlined /> Export
            </button>
            <button className="btn-primary" onClick={handleCreateLog}>
              <PlusOutlined /> New Log
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
          title={editingLog ? 'Edit Maintenance Log' : 'New Maintenance Log'}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
          }}
          okText={editingLog ? 'Save' : 'Create'}
          cancelText="Cancel"
          width={700}
          className="simple-modal"
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label="Equipment"
              name="equipment"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select placeholder="Select equipment" showSearch allowClear>
                {equipment.map(eq => (
                  <Option key={eq._id} value={eq._id}>
                    {eq.equipmentId} - {eq.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Maintenance Type"
              name="maintenanceType"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select>
                <Option value="scheduled">Scheduled</Option>
                <Option value="unscheduled">Unscheduled</Option>
                <Option value="emergency">Emergency</Option>
                <Option value="inspection">Inspection</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Description"
              name="description"
              rules={[{ required: true, message: 'Required' }]}
            >
              <TextArea rows={3} placeholder="Describe the maintenance performed..." />
            </Form.Item>

            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item
                label="Performed Date"
                name="performedDate"
                rules={[{ required: true, message: 'Required' }]}
                style={{ flex: 1 }}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>

              <Form.Item label="Next Due Date" name="nextDue" style={{ flex: 1 }}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item label="Labor Cost ($)" name="laborCost" style={{ flex: 1 }}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="Enter labor cost" />
              </Form.Item>

              <Form.Item label="Parts Cost ($)" name="partsCost" style={{ flex: 1 }}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="Enter parts cost" />
              </Form.Item>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item label="Duration (hours)" name="duration" style={{ flex: 1 }}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <div style={{ flex: 1 }} />
            </div>

            <Form.Item label="Performed By" name="performedBy">
              <Input placeholder="Enter technician/company name" />
            </Form.Item>

            <Form.Item label="Additional Notes" name="notes">
              <TextArea rows={2} placeholder="Any additional notes..." />
            </Form.Item>
          </Form>
        </Modal>

        {/* Delete Modal */}
        <Modal
          title="Delete Maintenance Log"
          open={isDeleteModalVisible}
          onOk={handleDeleteLog}
          onCancel={() => {
            setIsDeleteModalVisible(false);
            setDeletingLog(null);
          }}
          okText="Delete"
          cancelText="Cancel"
          width={400}
          className="delete-modal"
          okButtonProps={{ danger: true }}
        >
          <div className="delete-modal-content">
            <ExclamationCircleOutlined className="delete-icon" />
            <div>
              <p className="delete-message">
                Are you sure you want to delete this maintenance log for <strong>{deletingLog?.equipment?.equipmentId}</strong>?
              </p>
              <p className="delete-warning">
                This action cannot be undone.
              </p>
            </div>
          </div>
        </Modal>

        {/* Detail Modal */}
        <Modal
          title="Maintenance Log Details"
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
                <h4>Equipment Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Equipment ID:</label>
                    <span>{selectedLog.equipment?.equipmentId}</span>
                  </div>
                  <div className="detail-item">
                    <label>Name:</label>
                    <span>{selectedLog.equipment?.name}</span>
                  </div>
                  <div className="detail-item">
                    <label>Type:</label>
                    <Tag color="blue">{selectedLog.equipment?.type}</Tag>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <Tag color={selectedLog.equipment?.status === 'operational' ? 'green' : 'orange'}>
                      {selectedLog.equipment?.status}
                    </Tag>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Maintenance Details</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Type:</label>
                    <Tag color={
                      selectedLog.maintenanceType === 'scheduled' ? 'blue' :
                      selectedLog.maintenanceType === 'emergency' ? 'red' :
                      selectedLog.maintenanceType === 'inspection' ? 'green' : 'orange'
                    }>
                      {selectedLog.maintenanceType.toUpperCase()}
                    </Tag>
                  </div>
                  <div className="detail-item">
                    <label>Performed Date:</label>
                    <span>{moment(selectedLog.performedDate).format('MMM D, YYYY')}</span>
                  </div>
                  <div className="detail-item">
                    <label>Next Due:</label>
                    <span>{selectedLog.nextDue ? moment(selectedLog.nextDue).format('MMM D, YYYY') : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Performed By:</label>
                    <span>{selectedLog.performedBy || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Labor Cost:</label>
                    <span>{selectedLog.laborCost ? `$${selectedLog.laborCost.toFixed(2)}` : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Parts Cost:</label>
                    <span>{selectedLog.partsCost ? `$${selectedLog.partsCost.toFixed(2)}` : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Total Cost:</label>
                    <span>{selectedLog.cost ? `$${selectedLog.cost.toFixed(2)}` : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Duration:</label>
                    <span>{selectedLog.duration ? `${selectedLog.duration}h` : '-'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Description</h4>
                <p>{selectedLog.description}</p>
              </div>

              {selectedLog.notes && (
                <div className="detail-section">
                  <h4>Notes</h4>
                  <p>{selectedLog.notes}</p>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Import Modal */}
        <Modal
          title="Import Maintenance Logs"
          open={isImportModalVisible}
          onOk={handleImport}
          onCancel={() => {
            setIsImportModalVisible(false);
            setImportFile(null);
            setImportResults(null);
          }}
          okText="Import"
          cancelText="Cancel"
          confirmLoading={importing}
          width={500}
          className="simple-modal"
        >
          <Alert
            message="Import Instructions"
            description="Download the template, fill it with your maintenance log data, and upload it here."
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
              <UploadOutlined /> Select Excel File
            </button>
          </Upload>

          {importResults && (
            <Alert
              message={`Import Results: ${importResults.imported} succeeded, ${importResults.failed} failed`}
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
                  <BarChartOutlined /> Analytics Dashboard
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

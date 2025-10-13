import React, { useState, useEffect } from 'react';
import { Table, Modal, Form, Input, InputNumber, Select, Switch, notification, Tabs, Upload, Alert, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, UploadOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import DashboardLayout from '../components/DashboardLayout';
import config from '../config/config';
import './Sites.css';

const { Option } = Select;
const { TextArea } = Input;

const Sites = () => {
  const [sites, setSites] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [deletingSite, setDeletingSite] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSites();
    fetchTasks();
  }, []);

  const fetchSites = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/sites`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setSites(data.data.sites);
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to fetch sites',
        });
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to fetch sites',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setTasks(data.data.tasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleCreateSite = () => {
    setEditingSite(null);
    form.resetFields();
    form.setFieldsValue({ 
      isActive: true,
      siteType: 'mining',
      priority: 1,
      totalBackfillTonnes: 0,
      totalPlanMeters: 0,
      remoteTonnes: 0,
      timeToComplete: 0,
      firings: 0,
      width: 0,
      height: 0
    });
    setIsModalVisible(true);
  };

  const handleEditSite = (site) => {
    setEditingSite(site);
    form.setFieldsValue({
      siteId: site.siteId,
      siteName: site.siteName,
      priority: site.priority,
      isActive: site.isActive,
      location: site.location,
      siteType: site.siteType,
      totalBackfillTonnes: site.totalBackfillTonnes,
      totalPlanMeters: site.totalPlanMeters,
      remoteTonnes: site.remoteTonnes,
      currentTask: site.currentTask,
      timeToComplete: site.timeToComplete,
      firings: site.firings,
      width: site.width,
      height: site.height,
      notes: site.notes
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem('token');

      if (editingSite) {
        // Update site
        const response = await fetch(`${config.apiUrl}/sites/${editingSite._id}`, {
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
            description: 'Site updated successfully',
          });
          fetchSites();
        } else {
          notification.error({
            message: 'Error',
            description: data.message || 'Failed to update site',
          });
        }
      } else {
        // Create new site
        const response = await fetch(`${config.apiUrl}/sites`, {
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
            description: 'Site created successfully',
          });
          fetchSites();
        } else {
          notification.error({
            message: 'Error',
            description: data.message || 'Failed to create site',
          });
        }
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const showDeleteConfirm = (site) => {
    setDeletingSite(site);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteSite = async () => {
    if (!deletingSite) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/sites/${deletingSite._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        notification.success({
          message: 'Success',
          description: 'Site deleted successfully',
        });
        fetchSites();
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to delete site',
        });
      }
    } catch (error) {
      console.error('Error deleting site:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to delete site',
      });
    } finally {
      setIsDeleteModalVisible(false);
      setDeletingSite(null);
    }
  };

  const handleToggleStatus = async (site) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/sites/${site._id}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        notification.success({
          message: 'Success',
          description: `Site ${data.data.site.isActive ? 'activated' : 'deactivated'} successfully`,
        });
        fetchSites();
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to toggle site status',
        });
      }
    } catch (error) {
      console.error('Error toggling site status:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to toggle site status',
      });
    }
  };

  const showDetailModal = (site) => {
    setSelectedSite(site);
    setIsDetailModalVisible(true);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        siteId: 'SITE-001',
        siteName: 'Example Site',
        priority: 1,
        isActive: true,
        location: 'Area A',
        siteType: 'mining',
        totalBackfillTonnes: 1000,
        totalPlanMeters: 500,
        remoteTonnes: 200,
        currentTask: 'DRI',
        timeToComplete: 8,
        firings: 2,
        width: 5,
        height: 3,
        notes: 'Example notes'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sites Template');
    XLSX.writeFile(workbook, 'sites_template.xlsx');
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/sites/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        const worksheet = XLSX.utils.json_to_sheet(data.data.sites);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sites');
        XLSX.writeFile(workbook, 'sites_export.xlsx');
        notification.success({
          message: 'Success',
          description: 'Sites exported successfully',
        });
      }
    } catch (error) {
      console.error('Error exporting sites:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to export sites',
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
        const response = await fetch(`${config.apiUrl}/sites/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ sites: jsonData }),
        });
        const result = await response.json();

        if (response.ok && result.status === 'success') {
          setImportResults(result.data);
          notification.success({
            message: 'Import Complete',
            description: `Imported ${result.data.imported} sites successfully`,
          });
          fetchSites();
        } else {
          notification.error({
            message: 'Error',
            description: result.message || 'Failed to import sites',
          });
        }
      };
      reader.readAsArrayBuffer(importFile);
    } catch (error) {
      console.error('Error importing sites:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to import sites',
      });
    } finally {
      setImporting(false);
    }
  };

  const columns = [
    {
      title: 'PRIORITY',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      sorter: (a, b) => a.priority - b.priority,
      render: (priority) => (
        <span className="priority-badge">{priority}</span>
      ),
    },
    {
      title: 'SITE ID',
      dataIndex: 'siteId',
      key: 'siteId',
      sorter: (a, b) => a.siteId.localeCompare(b.siteId),
    },
    {
      title: 'SITE NAME',
      dataIndex: 'siteName',
      key: 'siteName',
      sorter: (a, b) => a.siteName.localeCompare(b.siteName),
    },
    {
      title: 'TYPE',
      dataIndex: 'siteType',
      key: 'siteType',
      filters: [
        { text: 'Mining', value: 'mining' },
        { text: 'Backfill', value: 'backfill' },
        { text: 'Development', value: 'development' },
        { text: 'Exploration', value: 'exploration' },
        { text: 'Other', value: 'other' },
      ],
      onFilter: (value, record) => record.siteType === value,
      render: (type) => (
        <Tag color="blue">{type.charAt(0).toUpperCase() + type.slice(1)}</Tag>
      ),
    },
    {
      title: 'LOCATION',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'STATUS',
      dataIndex: 'isActive',
      key: 'isActive',
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
      render: (isActive, record) => (
        <span 
          className={`status-badge ${isActive ? 'active' : 'inactive'}`}
          onClick={() => handleToggleStatus(record)}
          style={{ cursor: 'pointer' }}
        >
          {isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'CURRENT TASK',
      dataIndex: 'currentTask',
      key: 'currentTask',
      render: (task) => task || '-',
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
          <button className="icon-btn" onClick={() => handleEditSite(record)}>
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
      title="Site Management"
      subtitle="Manage mining sites and scheduling priorities"
      page="sites"
    >
      <div className="site-page">
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
            <button className="btn-primary" onClick={handleCreateSite}>
              <PlusOutlined /> New Site
            </button>
          </div>
        </div>

        <div className="table-container">
          <Table
            columns={columns}
            dataSource={sites}
            loading={loading}
            rowKey="_id"
            pagination={{
              pageSize: 15,
              showSizeChanger: false,
              simple: false,
            }}
          />
        </div>

        {/* Create/Edit Modal */}
        <Modal
          title={editingSite ? 'Edit Site' : 'New Site'}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
          }}
          okText={editingSite ? 'Save' : 'Create'}
          cancelText="Cancel"
          width={600}
          className="simple-modal"
        >
          <Form form={form} layout="vertical">
            <Tabs defaultActiveKey="1">
              <Tabs.TabPane tab="Basic Info" key="1">
                <Form.Item
                  label="Site ID"
                  name="siteId"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input placeholder="e.g., SITE-001" disabled={editingSite} />
                </Form.Item>

                <Form.Item
                  label="Site Name"
                  name="siteName"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input placeholder="Enter site name" />
                </Form.Item>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <Form.Item
                    label="Priority"
                    name="priority"
                    rules={[{ required: true, message: 'Required' }]}
                    style={{ flex: 1 }}
                  >
                    <InputNumber min={1} style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item
                    label="Type"
                    name="siteType"
                    rules={[{ required: true, message: 'Required' }]}
                    style={{ flex: 1 }}
                  >
                    <Select>
                      <Option value="mining">Mining</Option>
                      <Option value="backfill">Backfill</Option>
                      <Option value="development">Development</Option>
                      <Option value="exploration">Exploration</Option>
                      <Option value="other">Other</Option>
                    </Select>
                  </Form.Item>
                </div>

                <Form.Item
                  label="Location"
                  name="location"
                >
                  <Input placeholder="Enter location/area" />
                </Form.Item>

                <Form.Item
                  label="Active"
                  name="isActive"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Tabs.TabPane>

              <Tabs.TabPane tab="Planning Data" key="2">
                <div style={{ display: 'flex', gap: '16px' }}>
                  <Form.Item
                    label="Total Backfill Tonnes"
                    name="totalBackfillTonnes"
                    style={{ flex: 1 }}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item
                    label="Total Plan Meters"
                    name="totalPlanMeters"
                    style={{ flex: 1 }}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <Form.Item
                    label="Remote Tonnes"
                    name="remoteTonnes"
                    style={{ flex: 1 }}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item
                    label="Firings"
                    name="firings"
                    style={{ flex: 1 }}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <Form.Item
                    label="Width (m)"
                    name="width"
                    style={{ flex: 1 }}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item
                    label="Height (m)"
                    name="height"
                    style={{ flex: 1 }}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </div>

                <Form.Item
                  label="Current Task"
                  name="currentTask"
                >
                  <Select placeholder="Select task" allowClear>
                    {tasks.map(task => (
                      <Option key={task._id} value={task.taskId}>{task.taskId} - {task.taskName}</Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Time to Complete (hours)"
                  name="timeToComplete"
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Tabs.TabPane>

              <Tabs.TabPane tab="Notes" key="3">
                <Form.Item
                  label="Notes"
                  name="notes"
                >
                  <TextArea rows={6} placeholder="Additional notes..." />
                </Form.Item>
              </Tabs.TabPane>
            </Tabs>
          </Form>
        </Modal>

        {/* Delete Modal */}
        <Modal
          title="Delete Site"
          open={isDeleteModalVisible}
          onOk={handleDeleteSite}
          onCancel={() => {
            setIsDeleteModalVisible(false);
            setDeletingSite(null);
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
                Are you sure you want to delete <strong>{deletingSite?.siteId}</strong>?
              </p>
              <p className="delete-warning">
                This action cannot be undone.
              </p>
            </div>
          </div>
        </Modal>

        {/* Import Modal */}
        <Modal
          title="Import Sites"
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
            description="Download the template, fill it with your site data, and upload it here."
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
                        {fail.siteId}: {fail.error}
                      </div>
                    ))}
                  </div>
                )
              }
            />
          )}
        </Modal>

        {/* Detail Modal */}
        <Modal
          title="Site Details"
          open={isDetailModalVisible}
          onCancel={() => {
            setIsDetailModalVisible(false);
            setSelectedSite(null);
          }}
          footer={null}
          width={700}
          className="simple-modal"
        >
          {selectedSite && (
            <div className="site-details">
              <div className="detail-section">
                <h4>Basic Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Site ID:</label>
                    <span>{selectedSite.siteId}</span>
                  </div>
                  <div className="detail-item">
                    <label>Site Name:</label>
                    <span>{selectedSite.siteName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Priority:</label>
                    <span className="priority-badge">{selectedSite.priority}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span className={`status-badge ${selectedSite.isActive ? 'active' : 'inactive'}`}>
                      {selectedSite.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Type:</label>
                    <Tag color="blue">{selectedSite.siteType}</Tag>
                  </div>
                  <div className="detail-item">
                    <label>Location:</label>
                    <span>{selectedSite.location || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Planning Data</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Backfill Tonnes:</label>
                    <span>{selectedSite.totalBackfillTonnes}</span>
                  </div>
                  <div className="detail-item">
                    <label>Plan Meters:</label>
                    <span>{selectedSite.totalPlanMeters}</span>
                  </div>
                  <div className="detail-item">
                    <label>Remote Tonnes:</label>
                    <span>{selectedSite.remoteTonnes}</span>
                  </div>
                  <div className="detail-item">
                    <label>Firings:</label>
                    <span>{selectedSite.firings}</span>
                  </div>
                  <div className="detail-item">
                    <label>Width (m):</label>
                    <span>{selectedSite.width}</span>
                  </div>
                  <div className="detail-item">
                    <label>Height (m):</label>
                    <span>{selectedSite.height}</span>
                  </div>
                  <div className="detail-item">
                    <label>Current Task:</label>
                    <span>{selectedSite.currentTask || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Time to Complete:</label>
                    <span>{selectedSite.timeToComplete} hours</span>
                  </div>
                </div>
              </div>

              {selectedSite.notes && (
                <div className="detail-section">
                  <h4>Notes</h4>
                  <p>{selectedSite.notes}</p>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Sites;

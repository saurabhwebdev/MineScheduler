import React, { useState, useEffect } from 'react';
import { Table, Modal, Form, Input, Switch, notification, Upload, Alert, Descriptions, Tag, Select, InputNumber, Radio } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, UploadOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import moment from 'moment';
import DashboardLayout from '../components/DashboardLayout';
import config from '../config/config';
import './Delays.css';

const { TextArea } = Input;
const { Option } = Select;

const Delays = () => {
  const [delays, setDelays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [editingDelay, setEditingDelay] = useState(null);
  const [deletingDelay, setDeletingDelay] = useState(null);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [selectedDelay, setSelectedDelay] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [delayType, setDelayType] = useState('custom');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 15,
  });
  const [form] = Form.useForm();

  useEffect(() => {
    fetchDelays();
  }, []);

  const fetchDelays = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/delays`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setDelays(data.data.delays);
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to fetch delays',
        });
      }
    } catch (error) {
      console.error('Error fetching delays:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to fetch delays',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDelay = () => {
    setEditingDelay(null);
    form.resetFields();
    form.setFieldsValue({ 
      isActive: true,
      delayType: 'custom'
    });
    setDelayType('custom');
    setIsModalVisible(true);
  };

  const handleEditDelay = (delay) => {
    setEditingDelay(delay);
    setDelayType(delay.delayType || 'custom');
    form.setFieldsValue({
      delayCategory: delay.delayCategory,
      delayCode: delay.delayCode,
      delayType: delay.delayType || 'custom',
      description: delay.description,
      delayDuration: delay.delayDuration || null,
      isActive: delay.isActive,
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem('token');

      if (editingDelay) {
        // Update delay
        const response = await fetch(`${config.apiUrl}/delays/${editingDelay._id}`, {
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
            description: 'Delay updated successfully',
          });
          fetchDelays();
        } else {
          notification.error({
            message: 'Error',
            description: data.message || 'Failed to update delay',
          });
        }
      } else {
        // Create new delay
        const response = await fetch(`${config.apiUrl}/delays`, {
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
            description: 'Delay created successfully',
          });
          fetchDelays();
        } else {
          notification.error({
            message: 'Error',
            description: data.message || 'Failed to create delay',
          });
        }
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const showDeleteConfirm = (delay) => {
    setDeletingDelay(delay);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteDelay = async () => {
    if (!deletingDelay) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/delays/${deletingDelay._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        notification.success({
          message: 'Success',
          description: 'Delay deleted successfully',
        });
        fetchDelays();
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to delete delay',
        });
      }
    } catch (error) {
      console.error('Error deleting delay:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to delete delay',
      });
    } finally {
      setIsDeleteModalVisible(false);
      setDeletingDelay(null);
    }
  };

  const handleDownloadTemplate = () => {
    // Create template data
    const templateData = [
      {
        delayCategory: 'Equipment',
        delayCode: 'EQ-001',
        delayType: 'standard',
        delayDuration: 60,
        description: 'Equipment breakdown or maintenance delay',
        isActive: 'Active'
      },
      {
        delayCategory: 'Safety',
        delayCode: 'SF-001',
        delayType: 'standard',
        delayDuration: 30,
        description: 'Safety inspection delay',
        isActive: 'Active'
      },
      {
        delayCategory: 'Weather',
        delayCode: 'WT-001',
        delayType: 'custom',
        delayDuration: '',
        description: 'Heavy rain delay (custom duration)',
        isActive: 'Active'
      }
    ];

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 20 },  // delayCategory
      { wch: 15 },  // delayCode
      { wch: 15 },  // delayType
      { wch: 15 },  // delayDuration
      { wch: 50 },  // description
      { wch: 12 }   // isActive
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Delays');

    // Download
    XLSX.writeFile(wb, 'Delay_Import_Template.xlsx');
    
    notification.success({
      message: 'Template Downloaded',
      description: 'Excel template has been downloaded successfully',
    });
  };

  const handleImportExcel = () => {
    setImportFile(null);
    setImportResults(null);
    setIsImportModalVisible(true);
  };

  const handleFileChange = (info) => {
    const file = info.file.originFileObj || info.file;
    setImportFile(file);
  };

  const handleRowClick = (record, event) => {
    // Don't open detail modal if clicking on action buttons
    if (event.target.closest('.action-buttons')) {
      return;
    }
    setSelectedDelay(record);
    setIsDetailModalVisible(true);
  };

  const handleDetailModalClose = () => {
    setIsDetailModalVisible(false);
    setSelectedDelay(null);
  };

  const handleTableChange = (newPagination, filters, sorter) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  const handleImportSubmit = async () => {
    if (!importFile) {
      notification.error({
        message: 'No File Selected',
        description: 'Please select an Excel file to import',
      });
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/delays/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setImportResults(data.data);
        notification.success({
          message: 'Import Completed',
          description: data.message,
        });
        fetchDelays();
      } else {
        notification.error({
          message: 'Import Failed',
          description: data.message || 'Failed to import Excel file',
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to import Excel file',
      });
    } finally {
      setImporting(false);
    }
  };

  const columns = [
    {
      title: 'DELAY CATEGORY',
      dataIndex: 'delayCategory',
      key: 'delayCategory',
      width: 150,
      sorter: (a, b) => a.delayCategory.localeCompare(b.delayCategory),
    },
    {
      title: 'DELAY CODE',
      dataIndex: 'delayCode',
      key: 'delayCode',
      width: 120,
      sorter: (a, b) => a.delayCode.localeCompare(b.delayCode),
    },
    {
      title: 'TYPE',
      dataIndex: 'delayType',
      key: 'delayType',
      width: 110,
      render: (type) => (
        <Tag color={type === 'standard' ? 'blue' : 'default'}>
          {type === 'standard' ? 'Standard' : 'Custom'}
        </Tag>
      ),
      filters: [
        { text: 'Standard', value: 'standard' },
        { text: 'Custom', value: 'custom' },
      ],
      onFilter: (value, record) => record.delayType === value,
    },
    {
      title: 'DESCRIPTION',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'DURATION (MIN)',
      dataIndex: 'delayDuration',
      key: 'delayDuration',
      width: 130,
      render: (duration, record) => 
        record.delayType === 'standard' && duration !== null ? `${duration} min` : '-',
      sorter: (a, b) => (a.delayDuration || 0) - (b.delayDuration || 0),
    },
    {
      title: 'STATUS',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      render: (isActive) => (
        <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      ),
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: 'CREATED',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      align: 'center',
      width: 100,
      render: (_, record) => (
        <div className="action-buttons">
          <button className="icon-btn" onClick={() => handleEditDelay(record)}>
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
      title="Delay Management"
      subtitle="Manage delay categories and codes"
    >
      <div className="delay-page">
        <div className="page-header">
          <div className="header-actions">
            <button className="btn-secondary" onClick={handleDownloadTemplate}>
              <DownloadOutlined /> Download Template
            </button>
            <button className="btn-secondary" onClick={handleImportExcel}>
              <UploadOutlined /> Import Excel
            </button>
            <button className="btn-primary" onClick={handleCreateDelay}>
              <PlusOutlined /> New Delay
            </button>
          </div>
        </div>

        <div className="table-container">
          <Table
            columns={columns}
            dataSource={delays}
            loading={loading}
            rowKey="_id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              showSizeChanger: true,
              pageSizeOptions: ['10', '15', '25', '50', '100'],
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
              simple: false,
            }}
            onChange={handleTableChange}
            onRow={(record) => ({
              onClick: (event) => handleRowClick(record, event),
              style: { cursor: 'pointer' }
            })}
          />
        </div>

        <Modal
          title={editingDelay ? 'Edit Delay' : 'New Delay'}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
          }}
          okText={editingDelay ? 'Save' : 'Create'}
          cancelText="Cancel"
          width={480}
          className="simple-modal"
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label="Delay Category"
              name="delayCategory"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="e.g., Equipment, Safety, Weather" />
            </Form.Item>

            <Form.Item
              label="Delay Code"
              name="delayCode"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="e.g., EQ-001, SF-001" />
            </Form.Item>

            <Form.Item
              label="Delay Type"
              name="delayType"
              rules={[{ required: true, message: 'Required' }]}
              tooltip="Standard delays have pre-defined durations, Custom delays are ad-hoc"
            >
              <Radio.Group 
                onChange={(e) => setDelayType(e.target.value)}
                buttonStyle="solid"
              >
                <Radio.Button value="standard">Standard Delay</Radio.Button>
                <Radio.Button value="custom">Custom Delay</Radio.Button>
              </Radio.Group>
            </Form.Item>

            {delayType === 'standard' && (
              <Form.Item
                label="Delay Duration (Minutes)"
                name="delayDuration"
                rules={[
                  { required: true, message: 'Duration is required for standard delays' },
                  { type: 'number', min: 0, message: 'Must be positive' }
                ]}
                tooltip="Typical duration for this standard delay in minutes"
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="e.g., 30, 60, 120"
                  addonAfter="minutes"
                />
              </Form.Item>
            )}

            <Form.Item
              label="Description"
              name="description"
              rules={[{ required: true, message: 'Required' }]}
            >
              <TextArea 
                placeholder="Enter detailed description" 
                rows={4}
                maxLength={500}
                showCount
              />
            </Form.Item>

            <Form.Item
              label="Status"
              name="isActive"
              valuePropName="checked"
            >
              <Switch 
                checkedChildren="Active" 
                unCheckedChildren="Inactive"
              />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Delete Delay"
          open={isDeleteModalVisible}
          onOk={handleDeleteDelay}
          onCancel={() => {
            setIsDeleteModalVisible(false);
            setDeletingDelay(null);
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
                Are you sure you want to delete <strong>{deletingDelay?.delayCode}</strong>?
              </p>
              <p className="delete-warning">
                This action cannot be undone.
              </p>
            </div>
          </div>
        </Modal>

        <Modal
          title="Import Delays from Excel"
          open={isImportModalVisible}
          onOk={handleImportSubmit}
          onCancel={() => {
            setIsImportModalVisible(false);
            setImportFile(null);
            setImportResults(null);
          }}
          okText={importing ? 'Importing...' : 'Import'}
          cancelText="Close"
          width={600}
          className="simple-modal"
          confirmLoading={importing}
        >
          <div style={{ marginBottom: '16px' }}>
            <Alert
              message="Excel Format Instructions"
              description={
                <div>
                  <p style={{ marginBottom: '8px' }}>The Excel file should contain the following columns:</p>
                  <ul style={{ marginLeft: '20px', marginBottom: '8px' }}>
                    <li><strong>delayCategory</strong> - Category of the delay (required)</li>
                    <li><strong>delayCode</strong> - Unique code for the delay (required)</li>
                    <li><strong>delayType</strong> - Type: "standard" or "custom" (optional, defaults to custom)</li>
                    <li><strong>delayDuration</strong> - Duration in minutes (required for standard delays)</li>
                    <li><strong>description</strong> - Description of the delay (required)</li>
                    <li><strong>isActive</strong> - Status: Active/Inactive (optional, defaults to Active)</li>
                  </ul>
                  <p style={{ marginBottom: 0 }}>Download the template below to see the format.</p>
                </div>
              }
              type="info"
              showIcon
            />
          </div>

          <Upload
            accept=".xlsx,.xls"
            beforeUpload={() => false}
            onChange={handleFileChange}
            maxCount={1}
            fileList={importFile ? [importFile] : []}
          >
            <button className="btn-secondary" style={{ width: '100%', marginBottom: '12px' }}>
              <UploadOutlined /> Select Excel File
            </button>
          </Upload>

          {importResults && (
            <div style={{ marginTop: '16px' }}>
              <Alert
                message="Import Results"
                description={
                  <div>
                    <p><strong>Successful:</strong> {importResults.success.length} delays created</p>
                    <p><strong>Skipped:</strong> {importResults.skipped.length} delays (already exist or invalid)</p>
                    <p><strong>Failed:</strong> {importResults.failed.length} delays (errors)</p>
                    
                    {importResults.skipped.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <strong>Skipped Items:</strong>
                        <ul style={{ marginLeft: '20px', fontSize: '12px' }}>
                          {importResults.skipped.slice(0, 5).map((item, index) => (
                            <li key={index}>
                              {item.row.delayCode} - {item.reason}
                            </li>
                          ))}
                          {importResults.skipped.length > 5 && (
                            <li>... and {importResults.skipped.length - 5} more</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {importResults.failed.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <strong>Failed Items:</strong>
                        <ul style={{ marginLeft: '20px', fontSize: '12px' }}>
                          {importResults.failed.slice(0, 5).map((item, index) => (
                            <li key={index}>
                              {item.row.delayCode} - {item.reason}
                            </li>
                          ))}
                          {importResults.failed.length > 5 && (
                            <li>... and {importResults.failed.length - 5} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                }
                type={importResults.failed.length > 0 ? 'warning' : 'success'}
                showIcon
              />
            </div>
          )}
        </Modal>

        <Modal
          title="Delay Details"
          open={isDetailModalVisible}
          onCancel={handleDetailModalClose}
          footer={[
            <button key="close" className="btn-secondary" onClick={handleDetailModalClose}>
              Close
            </button>,
            <button 
              key="edit" 
              className="btn-primary" 
              onClick={() => {
                handleDetailModalClose();
                handleEditDelay(selectedDelay);
              }}
            >
              <EditOutlined /> Edit
            </button>
          ]}
          width={600}
          className="simple-modal"
        >
          {selectedDelay && (
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Delay Category">
                <strong>{selectedDelay.delayCategory}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Delay Code">
                <strong style={{ color: '#062d54' }}>{selectedDelay.delayCode}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Delay Type">
                <Tag color={selectedDelay.delayType === 'standard' ? 'blue' : 'default'}>
                  {selectedDelay.delayType === 'standard' ? 'Standard Delay' : 'Custom Delay'}
                </Tag>
              </Descriptions.Item>
              {selectedDelay.delayType === 'standard' && selectedDelay.delayDuration && (
                <Descriptions.Item label="Delay Duration">
                  <strong>{selectedDelay.delayDuration} minutes</strong>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Description">
                {selectedDelay.description}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={selectedDelay.isActive ? 'green' : 'red'}>
                  {selectedDelay.isActive ? 'Active' : 'Inactive'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created By">
                {selectedDelay.createdBy?.name || 'N/A'}
                {selectedDelay.createdBy?.email && (
                  <span style={{ color: '#8c8c8c', marginLeft: '8px' }}>({selectedDelay.createdBy.email})</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {moment(selectedDelay.createdAt).format('MMMM D, YYYY [at] h:mm A')}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {moment(selectedDelay.updatedAt).format('MMMM D, YYYY [at] h:mm A')}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Delays;

import React, { useState, useEffect } from 'react';
import { Table, Modal, Form, Input, InputNumber, Select, notification, Tabs, Upload, Alert, Tag, DatePicker, Badge } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, UploadOutlined, DownloadOutlined, EyeOutlined, ToolOutlined, HistoryOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import moment from 'moment';
import DashboardLayout from '../components/DashboardLayout';
import config from '../config/config';
import './Equipment.css';

const { Option } = Select;
const { TextArea } = Input;

const Equipment = () => {
  const [equipment, setEquipment] = useState([]);
  const [sites, setSites] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isMaintenanceModalVisible, setIsMaintenanceModalVisible] = useState(false);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [deletingEquipment, setDeletingEquipment] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [form] = Form.useForm();
  const [maintenanceForm] = Form.useForm();

  useEffect(() => {
    fetchEquipment();
    fetchSites();
    fetchTasks();
  }, []);

  const fetchEquipment = async () => {
    setLoading(true);
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
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to fetch equipment',
        });
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to fetch equipment',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
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
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
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

  const handleCreateEquipment = () => {
    setEditingEquipment(null);
    form.resetFields();
    form.setFieldsValue({ 
      status: 'operational',
      type: 'Excavator',
      maintenanceInterval: 500,
      operatingHours: 0,
      isActive: true
    });
    setIsModalVisible(true);
  };

  const handleEditEquipment = (equipment) => {
    setEditingEquipment(equipment);
    form.setFieldsValue({
      equipmentId: equipment.equipmentId,
      name: equipment.name,
      type: equipment.type,
      status: equipment.status,
      location: equipment.location,
      manufacturer: equipment.manufacturer,
      model: equipment.model,
      year: equipment.year,
      capacity: equipment.capacity,
      serialNumber: equipment.serialNumber,
      lastMaintenance: equipment.lastMaintenance ? moment(equipment.lastMaintenance) : null,
      nextMaintenance: equipment.nextMaintenance ? moment(equipment.nextMaintenance) : null,
      maintenanceInterval: equipment.maintenanceInterval,
      operatingHours: equipment.operatingHours,
      assignedTasks: equipment.assignedTasks || [],
      notes: equipment.notes
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem('token');

      // Convert dates to ISO strings
      if (values.lastMaintenance) {
        values.lastMaintenance = values.lastMaintenance.toISOString();
      }
      if (values.nextMaintenance) {
        values.nextMaintenance = values.nextMaintenance.toISOString();
      }

      if (editingEquipment) {
        // Update equipment
        const response = await fetch(`${config.apiUrl}/equipment/${editingEquipment._id}`, {
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
            description: 'Equipment updated successfully',
          });
          fetchEquipment();
        } else {
          notification.error({
            message: 'Error',
            description: data.message || 'Failed to update equipment',
          });
        }
      } else {
        // Create new equipment
        const response = await fetch(`${config.apiUrl}/equipment`, {
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
            description: 'Equipment created successfully',
          });
          fetchEquipment();
        } else {
          notification.error({
            message: 'Error',
            description: data.message || 'Failed to create equipment',
          });
        }
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const showDeleteConfirm = (equipment) => {
    setDeletingEquipment(equipment);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteEquipment = async () => {
    if (!deletingEquipment) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/equipment/${deletingEquipment._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        notification.success({
          message: 'Success',
          description: 'Equipment deleted successfully',
        });
        fetchEquipment();
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to delete equipment',
        });
      }
    } catch (error) {
      console.error('Error deleting equipment:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to delete equipment',
      });
    } finally {
      setIsDeleteModalVisible(false);
      setDeletingEquipment(null);
    }
  };

  const showMaintenanceModal = (equipment) => {
    setSelectedEquipment(equipment);
    maintenanceForm.resetFields();
    maintenanceForm.setFieldsValue({
      maintenanceType: 'scheduled',
      performedDate: moment(),
      cost: 0,
      duration: 0
    });
    setIsMaintenanceModalVisible(true);
  };

  const handleMaintenanceSubmit = async () => {
    try {
      const values = await maintenanceForm.validateFields();
      const token = localStorage.getItem('token');

      // Convert date to ISO string
      if (values.performedDate) {
        values.performedDate = values.performedDate.toISOString();
      }
      if (values.nextDue) {
        values.nextDue = values.nextDue.toISOString();
      }

      const response = await fetch(`${config.apiUrl}/equipment/${selectedEquipment._id}/maintenance`, {
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
          description: 'Maintenance logged successfully',
        });
        fetchEquipment();
        setIsMaintenanceModalVisible(false);
        maintenanceForm.resetFields();
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to log maintenance',
        });
      }
    } catch (error) {
      console.error('Error logging maintenance:', error);
    }
  };

  const showMaintenanceHistory = async (equipment) => {
    setSelectedEquipment(equipment);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/equipment/${equipment._id}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setMaintenanceHistory(data.data.history);
        setIsHistoryModalVisible(true);
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to fetch maintenance history',
        });
      }
    } catch (error) {
      console.error('Error fetching maintenance history:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to fetch maintenance history',
      });
    }
  };

  const showDetailModal = (equipment) => {
    setSelectedEquipment(equipment);
    setIsDetailModalVisible(true);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        equipmentId: 'EQ-001',
        name: 'Excavator EX-001',
        type: 'Excavator',
        status: 'operational',
        location: 'Site A',
        manufacturer: 'Caterpillar',
        model: '320D',
        year: 2020,
        capacity: '20 ton',
        serialNumber: 'CAT12345',
        maintenanceInterval: 500,
        operatingHours: 100,
        assignedTasks: 'DRI,CHP',
        notes: 'Example equipment'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Equipment Template');
    XLSX.writeFile(workbook, 'equipment_template.xlsx');
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/equipment/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        const worksheet = XLSX.utils.json_to_sheet(data.data.equipment);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Equipment');
        XLSX.writeFile(workbook, 'equipment_export.xlsx');
        notification.success({
          message: 'Success',
          description: 'Equipment exported successfully',
        });
      }
    } catch (error) {
      console.error('Error exporting equipment:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to export equipment',
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

        // Process assignedTasks (convert comma-separated string to array)
        jsonData.forEach(item => {
          if (item.assignedTasks && typeof item.assignedTasks === 'string') {
            item.assignedTasks = item.assignedTasks.split(',').map(t => t.trim());
          }
        });

        const token = localStorage.getItem('token');
        const response = await fetch(`${config.apiUrl}/equipment/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ equipment: jsonData }),
        });
        const result = await response.json();

        if (response.ok && result.status === 'success') {
          setImportResults(result.data);
          notification.success({
            message: 'Import Complete',
            description: `Imported ${result.data.imported} equipment successfully`,
          });
          fetchEquipment();
        } else {
          notification.error({
            message: 'Error',
            description: result.message || 'Failed to import equipment',
          });
        }
      };
      reader.readAsArrayBuffer(importFile);
    } catch (error) {
      console.error('Error importing equipment:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to import equipment',
      });
    } finally {
      setImporting(false);
    }
  };

  const getMaintenanceBadge = (equipment) => {
    if (!equipment.nextMaintenance) return null;
    
    const now = new Date();
    const nextMaintenance = new Date(equipment.nextMaintenance);
    const daysUntil = Math.ceil((nextMaintenance - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) {
      return <Badge count="Overdue" style={{ backgroundColor: '#ff4d4f' }} />;
    } else if (daysUntil <= 7) {
      return <Badge count="Due Soon" style={{ backgroundColor: '#faad14' }} />;
    }
    return null;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'equipmentId',
      key: 'equipmentId',
      width: 100,
      sorter: (a, b) => a.equipmentId.localeCompare(b.equipmentId),
    },
    {
      title: 'NAME',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'TYPE',
      dataIndex: 'type',
      key: 'type',
      filters: [
        { text: 'Excavator', value: 'Excavator' },
        { text: 'Haul Truck', value: 'Haul Truck' },
        { text: 'Drill', value: 'Drill' },
        { text: 'Loader', value: 'Loader' },
        { text: 'Grader', value: 'Grader' },
        { text: 'Dozer', value: 'Dozer' },
        { text: 'Bogger', value: 'Bogger' },
        { text: 'Other', value: 'Other' },
      ],
      onFilter: (value, record) => record.type === value,
      render: (type) => (
        <Tag color="blue">{type}</Tag>
      ),
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Operational', value: 'operational' },
        { text: 'Maintenance', value: 'maintenance' },
        { text: 'Out of Service', value: 'out-of-service' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <span className={`status-badge ${status}`}>
          {status === 'operational' ? 'Operational' : 
           status === 'maintenance' ? 'Maintenance' : 
           'Out of Service'}
        </span>
      ),
    },
    {
      title: 'LOCATION',
      dataIndex: 'location',
      key: 'location',
      render: (location) => location || '-',
    },
    {
      title: 'TASKS',
      dataIndex: 'assignedTasks',
      key: 'assignedTasks',
      render: (tasks) => tasks && tasks.length > 0 ? (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {tasks.slice(0, 2).map((task, idx) => (
            <Tag key={idx} color="green" style={{ margin: 0 }}>{task}</Tag>
          ))}
          {tasks.length > 2 && <Tag style={{ margin: 0 }}>+{tasks.length - 2}</Tag>}
        </div>
      ) : '-',
    },
    {
      title: 'MAINTENANCE',
      key: 'maintenance',
      render: (_, record) => (
        <div>
          {record.lastMaintenance ? (
            <div style={{ fontSize: 12 }}>
              <div>Last: {moment(record.lastMaintenance).format('MMM D, YYYY')}</div>
              {record.nextMaintenance && (
                <div>Next: {moment(record.nextMaintenance).format('MMM D, YYYY')}</div>
              )}
              {getMaintenanceBadge(record)}
            </div>
          ) : '-'}
        </div>
      ),
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      align: 'center',
      width: 150,
      render: (_, record) => (
        <div className="action-buttons">
          <button className="icon-btn" onClick={() => showDetailModal(record)} title="View Details">
            <EyeOutlined />
          </button>
          <button className="icon-btn" onClick={() => showMaintenanceModal(record)} title="Log Maintenance">
            <ToolOutlined />
          </button>
          <button className="icon-btn" onClick={() => showMaintenanceHistory(record)} title="View History">
            <HistoryOutlined />
          </button>
          <button className="icon-btn" onClick={() => handleEditEquipment(record)}>
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

  const historyColumns = [
    {
      title: 'DATE',
      dataIndex: 'performedDate',
      key: 'performedDate',
      render: (date) => moment(date).format('MMM D, YYYY'),
    },
    {
      title: 'TYPE',
      dataIndex: 'maintenanceType',
      key: 'maintenanceType',
      render: (type) => (
        <Tag color={
          type === 'scheduled' ? 'blue' :
          type === 'emergency' ? 'red' :
          type === 'inspection' ? 'orange' : 'default'
        }>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'DESCRIPTION',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'PERFORMED BY',
      dataIndex: 'performedBy',
      key: 'performedBy',
      render: (by) => by || '-',
    },
    {
      title: 'COST',
      dataIndex: 'cost',
      key: 'cost',
      render: (cost) => cost ? `$${cost.toFixed(2)}` : '-',
    },
    {
      title: 'DURATION',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => duration ? `${duration}h` : '-',
    },
  ];

  return (
    <DashboardLayout
      title="Equipment Management"
      subtitle="Manage mining equipment and track maintenance"
      page="equipment"
    >
      <div className="equipment-page">
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
            <button className="btn-primary" onClick={handleCreateEquipment}>
              <PlusOutlined /> New Equipment
            </button>
          </div>
        </div>

        <div className="table-container">
          <Table
            columns={columns}
            dataSource={equipment}
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
          title={editingEquipment ? 'Edit Equipment' : 'New Equipment'}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
          }}
          okText={editingEquipment ? 'Save' : 'Create'}
          cancelText="Cancel"
          width={700}
          className="simple-modal"
        >
          <Form form={form} layout="vertical">
            <Tabs defaultActiveKey="1">
              <Tabs.TabPane tab="Basic Info" key="1">
                <Form.Item
                  label="Equipment ID"
                  name="equipmentId"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input placeholder="e.g., EQ-001" disabled={editingEquipment} />
                </Form.Item>

                <Form.Item
                  label="Name"
                  name="name"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input placeholder="Enter equipment name" />
                </Form.Item>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <Form.Item
                    label="Type"
                    name="type"
                    rules={[{ required: true, message: 'Required' }]}
                    style={{ flex: 1 }}
                  >
                    <Select>
                      <Option value="Excavator">Excavator</Option>
                      <Option value="Haul Truck">Haul Truck</Option>
                      <Option value="Drill">Drill</Option>
                      <Option value="Loader">Loader</Option>
                      <Option value="Grader">Grader</Option>
                      <Option value="Dozer">Dozer</Option>
                      <Option value="Bogger">Bogger</Option>
                      <Option value="Other">Other</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    label="Status"
                    name="status"
                    rules={[{ required: true, message: 'Required' }]}
                    style={{ flex: 1 }}
                  >
                    <Select>
                      <Option value="operational">Operational</Option>
                      <Option value="maintenance">Maintenance</Option>
                      <Option value="out-of-service">Out of Service</Option>
                    </Select>
                  </Form.Item>
                </div>

                <Form.Item
                  label="Location"
                  name="location"
                >
                  <Select placeholder="Select location" allowClear showSearch>
                    {sites.map(site => (
                      <Option key={site._id} value={site.location || site.siteName}>
                        {site.siteId} - {site.siteName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Tabs.TabPane>

              <Tabs.TabPane tab="Specifications" key="2">
                <Form.Item label="Manufacturer" name="manufacturer">
                  <Input placeholder="e.g., Caterpillar" />
                </Form.Item>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <Form.Item label="Model" name="model" style={{ flex: 1 }}>
                    <Input placeholder="e.g., 320D" />
                  </Form.Item>

                  <Form.Item label="Year" name="year" style={{ flex: 1 }}>
                    <InputNumber min={1900} max={2100} style={{ width: '100%' }} />
                  </Form.Item>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <Form.Item label="Capacity" name="capacity" style={{ flex: 1 }}>
                    <Input placeholder="e.g., 20 ton" />
                  </Form.Item>

                  <Form.Item label="Serial Number" name="serialNumber" style={{ flex: 1 }}>
                    <Input placeholder="Enter serial number" />
                  </Form.Item>
                </div>
              </Tabs.TabPane>

              <Tabs.TabPane tab="Maintenance" key="3">
                <div style={{ display: 'flex', gap: '16px' }}>
                  <Form.Item label="Last Maintenance" name="lastMaintenance" style={{ flex: 1 }}>
                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                  </Form.Item>

                  <Form.Item label="Next Maintenance" name="nextMaintenance" style={{ flex: 1 }}>
                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                  </Form.Item>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <Form.Item label="Maintenance Interval (hours)" name="maintenanceInterval" style={{ flex: 1 }}>
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item label="Operating Hours" name="operatingHours" style={{ flex: 1 }}>
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </div>
              </Tabs.TabPane>

              <Tabs.TabPane tab="Tasks" key="4">
                <Form.Item
                  label="Assigned Tasks"
                  name="assignedTasks"
                >
                  <Select mode="multiple" placeholder="Select tasks" allowClear>
                    {tasks.map(task => (
                      <Option key={task._id} value={task.taskId}>
                        {task.taskId} - {task.taskName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Tabs.TabPane>

              <Tabs.TabPane tab="Notes" key="5">
                <Form.Item label="Notes" name="notes">
                  <TextArea rows={6} placeholder="Additional notes..." />
                </Form.Item>
              </Tabs.TabPane>
            </Tabs>
          </Form>
        </Modal>

        {/* Delete Modal */}
        <Modal
          title="Delete Equipment"
          open={isDeleteModalVisible}
          onOk={handleDeleteEquipment}
          onCancel={() => {
            setIsDeleteModalVisible(false);
            setDeletingEquipment(null);
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
                Are you sure you want to delete <strong>{deletingEquipment?.equipmentId}</strong>?
              </p>
              <p className="delete-warning">
                This action cannot be undone. All maintenance history will also be deleted.
              </p>
            </div>
          </div>
        </Modal>

        {/* Maintenance Log Modal */}
        <Modal
          title="Log Maintenance"
          open={isMaintenanceModalVisible}
          onOk={handleMaintenanceSubmit}
          onCancel={() => {
            setIsMaintenanceModalVisible(false);
            maintenanceForm.resetFields();
          }}
          okText="Log Maintenance"
          cancelText="Cancel"
          width={600}
          className="simple-modal"
        >
          <Form form={maintenanceForm} layout="vertical">
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
              <Form.Item label="Cost ($)" name="cost" style={{ flex: 1 }}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item label="Duration (hours)" name="duration" style={{ flex: 1 }}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </div>

            <Form.Item label="Performed By" name="performedBy">
              <Input placeholder="Enter technician/company name" />
            </Form.Item>

            <Form.Item label="Additional Notes" name="notes">
              <TextArea rows={2} placeholder="Any additional notes..." />
            </Form.Item>
          </Form>
        </Modal>

        {/* Maintenance History Modal */}
        <Modal
          title={`Maintenance History - ${selectedEquipment?.equipmentId}`}
          open={isHistoryModalVisible}
          onCancel={() => {
            setIsHistoryModalVisible(false);
            setMaintenanceHistory([]);
          }}
          footer={null}
          width={900}
          className="simple-modal"
        >
          <Table
            columns={historyColumns}
            dataSource={maintenanceHistory}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
            size="small"
          />
        </Modal>

        {/* Import Modal */}
        <Modal
          title="Import Equipment"
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
            description="Download the template, fill it with your equipment data, and upload it here."
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
                        {fail.equipmentId}: {fail.error}
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
          title="Equipment Details"
          open={isDetailModalVisible}
          onCancel={() => {
            setIsDetailModalVisible(false);
            setSelectedEquipment(null);
          }}
          footer={null}
          width={800}
          className="simple-modal"
        >
          {selectedEquipment && (
            <div className="equipment-details">
              <div className="detail-section">
                <h4>Basic Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Equipment ID:</label>
                    <span>{selectedEquipment.equipmentId}</span>
                  </div>
                  <div className="detail-item">
                    <label>Name:</label>
                    <span>{selectedEquipment.name}</span>
                  </div>
                  <div className="detail-item">
                    <label>Type:</label>
                    <Tag color="blue">{selectedEquipment.type}</Tag>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span className={`status-badge ${selectedEquipment.status}`}>
                      {selectedEquipment.status === 'operational' ? 'Operational' : 
                       selectedEquipment.status === 'maintenance' ? 'Maintenance' : 
                       'Out of Service'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Location:</label>
                    <span>{selectedEquipment.location || '-'}</span>
                  </div>
                </div>
              </div>

              {(selectedEquipment.manufacturer || selectedEquipment.model) && (
                <div className="detail-section">
                  <h4>Specifications</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Manufacturer:</label>
                      <span>{selectedEquipment.manufacturer || '-'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Model:</label>
                      <span>{selectedEquipment.model || '-'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Year:</label>
                      <span>{selectedEquipment.year || '-'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Capacity:</label>
                      <span>{selectedEquipment.capacity || '-'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Serial Number:</label>
                      <span>{selectedEquipment.serialNumber || '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h4>Maintenance Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Last Maintenance:</label>
                    <span>{selectedEquipment.lastMaintenance ? moment(selectedEquipment.lastMaintenance).format('MMM D, YYYY') : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Next Maintenance:</label>
                    <span>{selectedEquipment.nextMaintenance ? moment(selectedEquipment.nextMaintenance).format('MMM D, YYYY') : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Maintenance Interval:</label>
                    <span>{selectedEquipment.maintenanceInterval} hours</span>
                  </div>
                  <div className="detail-item">
                    <label>Operating Hours:</label>
                    <span>{selectedEquipment.operatingHours} hours</span>
                  </div>
                </div>
              </div>

              {selectedEquipment.assignedTasks && selectedEquipment.assignedTasks.length > 0 && (
                <div className="detail-section">
                  <h4>Assigned Tasks</h4>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedEquipment.assignedTasks.map((task, idx) => (
                      <Tag key={idx} color="green">{task}</Tag>
                    ))}
                  </div>
                </div>
              )}

              {selectedEquipment.notes && (
                <div className="detail-section">
                  <h4>Notes</h4>
                  <p>{selectedEquipment.notes}</p>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Equipment;

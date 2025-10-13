import React, { useState } from 'react';
import { Table, Modal, Form, Input, Select, notification } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import DashboardLayout from '../components/DashboardLayout';
import './Equipment.css';

const { Option } = Select;

const Equipment = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [deletingEquipment, setDeletingEquipment] = useState(null);
  const [form] = Form.useForm();

  // Placeholder data - will be replaced with API calls later
  const placeholderData = [
    {
      _id: '1',
      name: 'Excavator EX-001',
      type: 'Excavator',
      status: 'operational',
      location: 'Site A',
      lastMaintenance: new Date('2025-10-01'),
    },
    {
      _id: '2',
      name: 'Haul Truck HT-002',
      type: 'Haul Truck',
      status: 'maintenance',
      location: 'Site B',
      lastMaintenance: new Date('2025-09-15'),
    },
    {
      _id: '3',
      name: 'Drill DR-003',
      type: 'Drill',
      status: 'operational',
      location: 'Site A',
      lastMaintenance: new Date('2025-10-05'),
    },
  ];

  const handleCreateEquipment = () => {
    setEditingEquipment(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditEquipment = (record) => {
    setEditingEquipment(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Placeholder - API integration will be added later
      notification.info({
        message: 'Coming Soon',
        description: 'Equipment management functionality will be implemented soon.',
      });
      
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const showDeleteConfirm = (record) => {
    setDeletingEquipment(record);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteEquipment = async () => {
    // Placeholder - API integration will be added later
    notification.info({
      message: 'Coming Soon',
      description: 'Equipment management functionality will be implemented soon.',
    });
    
    setIsDeleteModalVisible(false);
    setDeletingEquipment(null);
  };

  const columns = [
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
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span className={`status-badge ${status}`}>
          {status === 'operational' ? 'Operational' : 
           status === 'maintenance' ? 'Maintenance' : 
           'Out of Service'}
        </span>
      ),
      filters: [
        { text: 'Operational', value: 'operational' },
        { text: 'Maintenance', value: 'maintenance' },
        { text: 'Out of Service', value: 'out-of-service' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'LOCATION',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'LAST MAINTENANCE',
      dataIndex: 'lastMaintenance',
      key: 'lastMaintenance',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.lastMaintenance) - new Date(b.lastMaintenance),
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      align: 'center',
      width: 100,
      render: (_, record) => (
        <div className="action-buttons">
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

  return (
    <DashboardLayout
      title="Equipment Management"
      subtitle="Manage mining equipment and track maintenance"
    >
      <div className="equipment-page">
        <div className="page-header">
          <button className="btn-primary" onClick={handleCreateEquipment}>
            <PlusOutlined /> New Equipment
          </button>
        </div>

        <div className="table-container">
          <Table
            columns={columns}
            dataSource={placeholderData}
            loading={loading}
            rowKey="_id"
            pagination={{
              pageSize: 15,
              showSizeChanger: false,
              simple: false,
            }}
          />
        </div>

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
          width={440}
          className="simple-modal"
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label="Equipment Name"
              name="name"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="Enter equipment name" />
            </Form.Item>

            <Form.Item
              label="Type"
              name="type"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select placeholder="Select type">
                <Option value="Excavator">Excavator</Option>
                <Option value="Haul Truck">Haul Truck</Option>
                <Option value="Drill">Drill</Option>
                <Option value="Loader">Loader</Option>
                <Option value="Grader">Grader</Option>
                <Option value="Dozer">Dozer</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Status"
              name="status"
              rules={[{ required: true, message: 'Required' }]}
              initialValue="operational"
            >
              <Select placeholder="Select status">
                <Option value="operational">Operational</Option>
                <Option value="maintenance">Maintenance</Option>
                <Option value="out-of-service">Out of Service</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Location"
              name="location"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="Enter location" />
            </Form.Item>
          </Form>
        </Modal>

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
                Are you sure you want to delete <strong>{deletingEquipment?.name}</strong>?
              </p>
              <p className="delete-warning">
                This action cannot be undone.
              </p>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Equipment;

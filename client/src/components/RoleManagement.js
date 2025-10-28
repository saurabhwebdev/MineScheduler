import React, { useState, useEffect } from 'react';
import { Table, Modal, Form, Input, Select, notification, Tag, Button } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, LockOutlined } from '@ant-design/icons';
import config from '../config/config';

const { TextArea } = Input;

const RoleManagement = ({ visible, onClose }) => {
  const [roles, setRoles] = useState([]);
  const [availableRoutes, setAvailableRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [deletingRole, setDeletingRole] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      fetchRoles();
      fetchAvailableRoutes();
    }
  }, [visible]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setRoles(data.data.roles);
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to fetch roles',
        });
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch roles',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRoutes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/roles/available-routes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setAvailableRoutes(data.data.routes);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const handleCreateRole = () => {
    setEditingRole(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    form.setFieldsValue({
      name: role.name,
      description: role.description,
      permissions: role.permissions
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem('token');

      if (editingRole) {
        // Update role
        const response = await fetch(`${config.apiUrl}/roles/${editingRole._id}`, {
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
            description: 'Role updated successfully',
          });
          fetchRoles();
        } else {
          notification.error({
            message: 'Error',
            description: data.message || 'Failed to update role',
          });
        }
      } else {
        // Create new role
        const response = await fetch(`${config.apiUrl}/roles`, {
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
            description: 'Role created successfully',
          });
          fetchRoles();
        } else {
          notification.error({
            message: 'Error',
            description: data.message || 'Failed to create role',
          });
        }
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const showDeleteConfirm = (role) => {
    setDeletingRole(role);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteRole = async () => {
    if (!deletingRole) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/roles/${deletingRole._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        notification.success({
          message: 'Success',
          description: 'Role deleted successfully',
        });
        fetchRoles();
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to delete role',
        });
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to delete role',
      });
    } finally {
      setIsDeleteModalVisible(false);
      setDeletingRole(null);
    }
  };

  const columns = [
    {
      title: 'Role Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <span>
          {text} {!record.isCustom && <LockOutlined style={{ marginLeft: 8, color: '#999' }} />}
        </span>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions) => (
        <span>
          {permissions.length} route{permissions.length !== 1 ? 's' : ''}
        </span>
      ),
    },
    {
      title: 'Users',
      dataIndex: 'userCount',
      key: 'userCount',
      align: 'center',
      render: (count) => <Tag color="blue">{count || 0}</Tag>,
    },
    {
      title: 'Type',
      dataIndex: 'isCustom',
      key: 'isCustom',
      render: (isCustom) => (
        <Tag color={isCustom ? 'green' : 'orange'}>
          {isCustom ? 'Custom' : 'System'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      width: 100,
      render: (_, record) => (
        <div className="action-buttons">
          <button 
            className="icon-btn" 
            onClick={() => handleEditRole(record)}
            disabled={!record.isCustom}
            style={{ opacity: record.isCustom ? 1 : 0.5, cursor: record.isCustom ? 'pointer' : 'not-allowed' }}
            title={record.isCustom ? 'Edit role' : 'Cannot edit system role'}
          >
            <EditOutlined />
          </button>
          <button 
            className="icon-btn delete"
            onClick={() => showDeleteConfirm(record)}
            disabled={!record.isCustom}
            style={{ opacity: record.isCustom ? 1 : 0.5, cursor: record.isCustom ? 'pointer' : 'not-allowed' }}
            title={record.isCustom ? 'Delete role' : 'Cannot delete system role'}
          >
            <DeleteOutlined />
          </button>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title="Role Management"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      className="role-management-modal"
    >
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateRole}
        >
          Create New Role
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={roles}
        loading={loading}
        rowKey="_id"
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
        }}
      />

      {/* Create/Edit Role Modal */}
      <Modal
        title={editingRole ? 'Edit Role' : 'Create New Role'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        okText={editingRole ? 'Update' : 'Create'}
        cancelText="Cancel"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Role Name"
            name="name"
            rules={[
              { required: true, message: 'Please enter role name' },
              { min: 3, message: 'Role name must be at least 3 characters' }
            ]}
          >
            <Input placeholder="e.g., Site Manager, Operator" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
          >
            <TextArea 
              rows={3}
              placeholder="Brief description of this role's purpose" 
            />
          </Form.Item>

          <Form.Item
            label="Permissions (Routes)"
            name="permissions"
            rules={[
              { required: true, message: 'Please select at least one permission' }
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Select routes this role can access"
              style={{ width: '100%' }}
            >
              {availableRoutes.map(route => (
                <Select.Option key={route.path} value={route.path}>
                  {route.label} {route.adminOnly && <Tag color="red" style={{ marginLeft: 8 }}>Admin Only</Tag>}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Role"
        open={isDeleteModalVisible}
        onOk={handleDeleteRole}
        onCancel={() => {
          setIsDeleteModalVisible(false);
          setDeletingRole(null);
        }}
        okText="Delete"
        cancelText="Cancel"
        width={400}
        okButtonProps={{ danger: true }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <ExclamationCircleOutlined style={{ fontSize: 24, color: '#ff4d4f', marginTop: 4 }} />
          <div>
            <p style={{ marginBottom: 8, fontSize: 15, fontWeight: 500 }}>
              Are you sure you want to delete role "{deletingRole?.name}"?
            </p>
            <p style={{ margin: 0, color: '#8c8c8c', fontSize: 13 }}>
              This action cannot be undone. Make sure no users are assigned to this role.
            </p>
          </div>
        </div>
      </Modal>
    </Modal>
  );
};

export default RoleManagement;

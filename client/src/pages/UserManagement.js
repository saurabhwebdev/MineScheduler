import React, { useState, useEffect } from 'react';
import { Table, Modal, Form, Input, Select, notification } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import DashboardLayout from '../components/DashboardLayout';
import config from '../config/config';
import './UserManagement.css';

const { Option } = Select;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setUsers(data.data.users);
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to fetch users',
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to fetch users',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditRole = (user) => {
    setEditingUser(user);
    form.setFieldsValue({ role: user.role });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem('token');

      if (editingUser) {
        // Update role
        const response = await fetch(`${config.apiUrl}/users/${editingUser._id}/role`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ role: values.role }),
        });
        const data = await response.json();

        if (response.ok && data.status === 'success') {
          notification.success({
            message: 'Success',
            description: 'User role updated successfully',
          });
          fetchUsers();
        } else {
          notification.error({
            message: 'Error',
            description: data.message || 'Failed to update role',
          });
        }
      } else {
        // Create new user
        const response = await fetch(`${config.apiUrl}/users`, {
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
            description: 'User created successfully',
          });
          fetchUsers();
        } else {
          notification.error({
            message: 'Error',
            description: data.message || 'Failed to create user',
          });
        }
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const showDeleteConfirm = (user) => {
    // Check if this is the last admin
    const adminCount = users.filter(u => u.role === 'admin').length;
    
    if (user.role === 'admin' && adminCount === 1) {
      notification.warning({
        message: 'Cannot Delete',
        description: 'You cannot delete the last admin user. There must be at least one admin.',
      });
      return;
    }
    
    setDeletingUser(user);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/users/${deletingUser._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        notification.success({
          message: 'Success',
          description: 'User deleted successfully',
        });
        fetchUsers();
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to delete user',
        });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to delete user',
      });
    } finally {
      setIsDeleteModalVisible(false);
      setDeletingUser(null);
    }
  };

  const columns = [
    {
      title: 'NAME',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'EMAIL',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'ROLE',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <span className={`role-badge ${role}`}>
          {role === 'admin' ? 'Admin' : 'User'}
        </span>
      ),
      filters: [
        { text: 'Admin', value: 'admin' },
        { text: 'User', value: 'user' },
      ],
      onFilter: (value, record) => record.role === value,
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
      render: (_, record) => {
        const adminCount = users.filter(u => u.role === 'admin').length;
        const isLastAdmin = record.role === 'admin' && adminCount === 1;
        
        return (
          <div className="action-buttons">
            <button className="icon-btn" onClick={() => handleEditRole(record)}>
              <EditOutlined />
            </button>
            <button 
              className={`icon-btn delete ${isLastAdmin ? 'disabled' : ''}`}
              onClick={() => showDeleteConfirm(record)}
              disabled={isLastAdmin}
              title={isLastAdmin ? 'Cannot delete the last admin' : 'Delete user'}
            >
              <DeleteOutlined />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <DashboardLayout
      title="User Management"
      subtitle="Manage users and their roles"
    >
      <div className="user-page">
        <div className="page-header">
          <button className="btn-primary" onClick={handleCreateUser}>
            <PlusOutlined /> New User
          </button>
        </div>

        <div className="table-container">
          <Table
            columns={columns}
            dataSource={users}
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
          title={editingUser ? 'Edit User Role' : 'New User'}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
          }}
          okText={editingUser ? 'Save' : 'Create'}
          cancelText="Cancel"
          width={440}
          className="simple-modal"
        >
          <Form form={form} layout="vertical">
            {!editingUser && (
              <>
                <Form.Item
                  label="Name"
                  name="name"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input placeholder="Enter name" />
                </Form.Item>

                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: 'Required' },
                    { type: 'email', message: 'Invalid email' },
                  ]}
                >
                  <Input placeholder="Enter email" />
                </Form.Item>

                <Form.Item
                  label="Password"
                  name="password"
                  rules={[
                    { required: true, message: 'Required' },
                    { min: 6, message: 'Min 6 characters' },
                  ]}
                >
                  <Input.Password placeholder="Enter password" />
                </Form.Item>
              </>
            )}

            <Form.Item
              label="Role"
              name="role"
              rules={[{ required: true, message: 'Required' }]}
              initialValue="user"
            >
              <Select placeholder="Select role">
                <Option value="user">User</Option>
                <Option value="admin">Admin</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Delete User"
          open={isDeleteModalVisible}
          onOk={handleDeleteUser}
          onCancel={() => {
            setIsDeleteModalVisible(false);
            setDeletingUser(null);
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
                Are you sure you want to delete <strong>{deletingUser?.name}</strong>?
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

export default UserManagement;

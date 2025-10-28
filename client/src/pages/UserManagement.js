import React, { useState, useEffect } from 'react';
import { Table, Modal, Form, Input, Select, notification, Button } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, SafetyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';
import RoleManagement from '../components/RoleManagement';
import config from '../config/config';
import './UserManagement.css';

const { Option } = Select;

const UserManagement = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [form] = Form.useForm();
  const [roleManagementVisible, setRoleManagementVisible] = useState(false);
  const [customRoles, setCustomRoles] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchCustomRoles();
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
          message: t('common.error'),
          description: data.message || t('users.messages.fetchError'),
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      notification.error({
        message: t('common.error'),
        description: t('users.messages.fetchError'),
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setCustomRoles(data.data.roles);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditRole = (user) => {
    setEditingUser(user);
    // Set the role value - use customRole name if exists, otherwise use system role
    const roleValue = user.customRole ? user.customRole.name : user.role;
    form.setFieldsValue({ role: roleValue });
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
            message: t('common.success'),
            description: t('users.messages.updateSuccess'),
          });
          fetchUsers();
        } else {
          notification.error({
            message: t('common.error'),
            description: data.message || t('users.messages.updateError'),
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
            message: t('common.success'),
            description: t('users.messages.createSuccess'),
          });
          fetchUsers();
        } else {
          notification.error({
            message: t('common.error'),
            description: data.message || t('users.messages.createError'),
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
        message: t('users.messages.cannotDeleteTitle'),
        description: t('users.messages.cannotDeleteLastAdmin'),
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
          message: t('common.success'),
          description: t('users.messages.deleteSuccess'),
        });
        fetchUsers();
      } else {
        notification.error({
          message: t('common.error'),
          description: data.message || t('users.messages.deleteError'),
        });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      notification.error({
        message: t('common.error'),
        description: t('users.messages.deleteError'),
      });
    } finally {
      setIsDeleteModalVisible(false);
      setDeletingUser(null);
    }
  };

  const columns = [
    {
      title: t('users.columns.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t('users.columns.email'),
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: t('users.columns.role'),
      dataIndex: 'role',
      key: 'role',
      render: (role, record) => {
        // If user has customRole, display that instead
        const displayRole = record.customRole ? record.customRole.name : role;
        const roleClass = record.customRole ? 'custom' : role;
        
        return (
          <span className={`role-badge ${roleClass}`}>
            {record.customRole ? displayRole : (role === 'admin' ? t('users.roles.admin') : t('users.roles.user'))}
          </span>
        );
      },
      filters: [
        { text: t('users.roles.admin'), value: 'admin' },
        { text: t('users.roles.user'), value: 'user' },
      ],
      onFilter: (value, record) => record.role === value,
    },
    {
      title: t('users.columns.created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: t('users.columns.actions'),
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
              title={isLastAdmin ? t('users.tooltips.cannotDeleteLastAdmin') : t('users.tooltips.deleteUser')}
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
      title={t('users.title')}
      subtitle={t('users.subtitle')}
      page="users"
    >
      <div className="user-page">
        <div className="page-header">
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={handleCreateUser}>
              <PlusOutlined /> {t('users.newUser')}
            </button>
            <Button
              icon={<SafetyOutlined />}
              onClick={() => setRoleManagementVisible(true)}
              style={{ height: '36px' }}
            >
              Manage Roles
            </Button>
          </div>
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
          title={editingUser ? t('users.modal.editTitle') : t('users.modal.createTitle')}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
          }}
          okText={editingUser ? t('users.modal.save') : t('users.modal.create')}
          cancelText={t('common.cancel')}
          width={440}
          className="simple-modal"
        >
          <Form form={form} layout="vertical">
            {!editingUser && (
              <>
                <Form.Item
                  label={t('users.modal.labels.name')}
                  name="name"
                  rules={[{ required: true, message: t('users.modal.validation.required') }]}
                >
                  <Input placeholder={t('users.modal.placeholders.name')} />
                </Form.Item>

                <Form.Item
                  label={t('users.modal.labels.email')}
                  name="email"
                  rules={[
                    { required: true, message: t('users.modal.validation.required') },
                    { type: 'email', message: t('users.modal.validation.invalidEmail') },
                  ]}
                >
                  <Input placeholder={t('users.modal.placeholders.email')} />
                </Form.Item>

                <Form.Item
                  label={t('users.modal.labels.password')}
                  name="password"
                  rules={[
                    { required: true, message: t('users.modal.validation.required') },
                    { min: 6, message: t('users.modal.validation.minPassword') },
                  ]}
                >
                  <Input.Password placeholder={t('users.modal.placeholders.password')} />
                </Form.Item>
              </>
            )}

            <Form.Item
              label={t('users.modal.labels.role')}
              name="role"
              rules={[{ required: true, message: t('users.modal.validation.required') }]}
              initialValue="user"
            >
              <Select placeholder={t('users.modal.placeholders.role')}>
                <Select.OptGroup label="System Roles">
                  <Option value="user">{t('users.roles.user')}</Option>
                  <Option value="admin">{t('users.roles.admin')}</Option>
                </Select.OptGroup>
                {customRoles.length > 0 && (
                  <Select.OptGroup label="Custom Roles">
                    {customRoles.map(role => (
                      <Option key={role._id} value={role.name}>{role.name}</Option>
                    ))}
                  </Select.OptGroup>
                )}
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={t('users.deleteModal.title')}
          open={isDeleteModalVisible}
          onOk={handleDeleteUser}
          onCancel={() => {
            setIsDeleteModalVisible(false);
            setDeletingUser(null);
          }}
          okText={t('users.deleteModal.delete')}
          cancelText={t('common.cancel')}
          width={400}
          className="delete-modal"
          okButtonProps={{ danger: true }}
        >
          <div className="delete-modal-content">
            <ExclamationCircleOutlined className="delete-icon" />
            <div>
              <p className="delete-message">
                {t('users.deleteModal.message')} <strong>{deletingUser?.name}</strong>?
              </p>
              <p className="delete-warning">
                {t('users.deleteModal.warning')}
              </p>
            </div>
          </div>
        </Modal>

        <RoleManagement 
          visible={roleManagementVisible} 
          onClose={() => {
            setRoleManagementVisible(false);
            fetchCustomRoles(); // Refresh roles after closing
          }} 
        />
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;

import React, { useState, useEffect } from 'react';
import { Table, Modal, Form, Input, InputNumber, Select, Switch, notification, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import config from '../config/config';

const { TextArea } = Input;
const { Option } = Select;

const ConstantsConfig = () => {
  const [constants, setConstants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [editingConstant, setEditingConstant] = useState(null);
  const [deletingConstant, setDeletingConstant] = useState(null);
  const [form] = Form.useForm();

  // Get user info to check admin status
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchConstants();
  }, []);

  const fetchConstants = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/constants`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setConstants(data.data.constants);
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to fetch constants',
        });
      }
    } catch (error) {
      console.error('Error fetching constants:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to fetch constants',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConstant = () => {
    if (!isAdmin) {
      notification.warning({
        message: 'Permission Denied',
        description: 'Only administrators can create constants',
      });
      return;
    }
    setEditingConstant(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditConstant = (constant) => {
    if (!isAdmin) {
      notification.warning({
        message: 'Permission Denied',
        description: 'Only administrators can edit constants',
      });
      return;
    }
    setEditingConstant(constant);
    form.setFieldsValue({
      keyword: constant.keyword,
      value: constant.value,
      unit: constant.unit,
      description: constant.description,
      category: constant.category,
      isActive: constant.isActive
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem('token');

      if (editingConstant) {
        // Update constant
        const response = await fetch(`${config.apiUrl}/constants/${editingConstant._id}`, {
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
            description: 'Constant updated successfully',
          });
          fetchConstants();
        } else {
          notification.error({
            message: 'Error',
            description: data.message || 'Failed to update constant',
          });
        }
      } else {
        // Create new constant
        const response = await fetch(`${config.apiUrl}/constants`, {
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
            description: 'Constant created successfully',
          });
          fetchConstants();
        } else {
          notification.error({
            message: 'Error',
            description: data.message || 'Failed to create constant',
          });
        }
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const showDeleteConfirm = (constant) => {
    if (!isAdmin) {
      notification.warning({
        message: 'Permission Denied',
        description: 'Only administrators can delete constants',
      });
      return;
    }
    setDeletingConstant(constant);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteConstant = async () => {
    if (!deletingConstant) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/constants/${deletingConstant._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        notification.success({
          message: 'Success',
          description: 'Constant deleted successfully',
        });
        fetchConstants();
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to delete constant',
        });
      }
    } catch (error) {
      console.error('Error deleting constant:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to delete constant',
      });
    } finally {
      setIsDeleteModalVisible(false);
      setDeletingConstant(null);
    }
  };

  const columns = [
    {
      title: 'KEYWORD',
      dataIndex: 'keyword',
      key: 'keyword',
      sorter: (a, b) => a.keyword.localeCompare(b.keyword),
      render: (text) => <strong style={{ color: '#ff8906' }}>{text}</strong>
    },
    {
      title: 'VALUE',
      dataIndex: 'value',
      key: 'value',
      align: 'center',
      render: (value) => <strong>{value}</strong>
    },
    {
      title: 'UNIT',
      dataIndex: 'unit',
      key: 'unit',
      align: 'center',
    },
    {
      title: 'CATEGORY',
      dataIndex: 'category',
      key: 'category',
      align: 'center',
      filters: [
        { text: 'Mining', value: 'Mining' },
        { text: 'Calculation', value: 'Calculation' },
        { text: 'System', value: 'System' },
        { text: 'Other', value: 'Other' },
      ],
      onFilter: (value, record) => record.category === value,
      render: (category) => {
        const colors = {
          Mining: 'orange',
          Calculation: 'blue',
          System: 'green',
          Other: 'default'
        };
        return <Tag color={colors[category] || 'default'}>{category}</Tag>;
      }
    },
    {
      title: 'DESCRIPTION',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: 'STATUS',
      dataIndex: 'isActive',
      key: 'isActive',
      align: 'center',
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'CREATED BY',
      dataIndex: 'createdBy',
      key: 'createdBy',
      render: (createdBy) => createdBy?.name || '-',
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      align: 'center',
      width: 100,
      render: (_, record) => (
        <div className="action-buttons">
          <button 
            className="icon-btn" 
            onClick={() => handleEditConstant(record)}
            disabled={!isAdmin}
            style={{ opacity: isAdmin ? 1 : 0.5, cursor: isAdmin ? 'pointer' : 'not-allowed' }}
          >
            <EditOutlined />
          </button>
          <button 
            className="icon-btn delete"
            onClick={() => showDeleteConfirm(record)}
            disabled={!isAdmin}
            style={{ opacity: isAdmin ? 1 : 0.5, cursor: isAdmin ? 'pointer' : 'not-allowed' }}
          >
            <DeleteOutlined />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="uom-actions">
        <button 
          className="btn-primary" 
          onClick={handleCreateConstant}
          disabled={!isAdmin}
          style={{ opacity: isAdmin ? 1 : 0.7, cursor: isAdmin ? 'pointer' : 'not-allowed' }}
        >
          <PlusOutlined /> New Constant
        </button>
        {!isAdmin && (
          <span style={{ marginLeft: '10px', color: '#999', fontSize: '12px' }}>
            (Admin access required)
          </span>
        )}
      </div>

      <div className="uom-table-container">
        <Table
          columns={columns}
          dataSource={constants}
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
        title={editingConstant ? 'Edit Constant' : 'New Constant'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        okText={editingConstant ? 'Save' : 'Create'}
        cancelText="Cancel"
        width={600}
        className="simple-modal"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Keyword"
            name="keyword"
            rules={[
              { required: true, message: 'Required' },
              { pattern: /^[A-Z_]+$/, message: 'Only uppercase letters and underscores' }
            ]}
            extra="Use uppercase letters and underscores only (e.g., WIDTH, MAX_DEPTH)"
          >
            <Input 
              placeholder="Enter keyword (e.g., WIDTH)" 
              disabled={!!editingConstant}
              style={{ textTransform: 'uppercase' }}
            />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              label="Value"
              name="value"
              rules={[
                { required: true, message: 'Required' },
                { type: 'number', min: 0, message: 'Must be positive' }
              ]}
            >
              <InputNumber 
                placeholder="Enter value" 
                style={{ width: '100%' }}
                step={0.1}
                precision={2}
              />
            </Form.Item>

            <Form.Item
              label="Unit"
              name="unit"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="Enter unit (e.g., meters, tonnes/m³)" />
            </Form.Item>
          </div>

          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true, message: 'Required' }]}
            initialValue="Mining"
          >
            <Select placeholder="Select category">
              <Option value="Mining">Mining</Option>
              <Option value="Calculation">Calculation</Option>
              <Option value="System">System</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
          >
            <TextArea 
              rows={3}
              placeholder="Enter description (optional)" 
            />
          </Form.Item>

          {editingConstant && (
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
          )}
        </Form>
      </Modal>

      <Modal
        title="Delete Constant"
        open={isDeleteModalVisible}
        onOk={handleDeleteConstant}
        onCancel={() => {
          setIsDeleteModalVisible(false);
          setDeletingConstant(null);
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
              Are you sure you want to delete <strong>{deletingConstant?.keyword}</strong>?
            </p>
            <p className="delete-warning">
              This action cannot be undone. This constant is used in scheduling calculations.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ConstantsConfig;

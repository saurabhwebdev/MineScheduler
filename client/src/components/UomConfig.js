import React, { useState, useEffect } from 'react';
import { Table, Modal, Form, Input, notification } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import config from '../config/config';

const { TextArea } = Input;

const UomConfig = () => {
  const [uoms, setUoms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [editingUom, setEditingUom] = useState(null);
  const [deletingUom, setDeletingUom] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchUoms();
  }, []);

  const fetchUoms = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/uoms`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setUoms(data.data.uoms);
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to fetch UOMs',
        });
      }
    } catch (error) {
      console.error('Error fetching UOMs:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to fetch UOMs',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUom = () => {
    setEditingUom(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditUom = (uom) => {
    setEditingUom(uom);
    form.setFieldsValue({
      name: uom.name,
      description: uom.description,
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem('token');

      if (editingUom) {
        // Update UOM
        const response = await fetch(`${config.apiUrl}/uoms/${editingUom._id}`, {
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
            description: 'UOM updated successfully',
          });
          fetchUoms();
        } else {
          notification.error({
            message: 'Error',
            description: data.message || 'Failed to update UOM',
          });
        }
      } else {
        // Create new UOM
        const response = await fetch(`${config.apiUrl}/uoms`, {
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
            description: 'UOM created successfully',
          });
          fetchUoms();
        } else {
          notification.error({
            message: 'Error',
            description: data.message || 'Failed to create UOM',
          });
        }
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const showDeleteConfirm = (uom) => {
    setDeletingUom(uom);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteUom = async () => {
    if (!deletingUom) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/uoms/${deletingUom._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        notification.success({
          message: 'Success',
          description: 'UOM deleted successfully',
        });
        fetchUoms();
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to delete UOM',
        });
      }
    } catch (error) {
      console.error('Error deleting UOM:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to delete UOM',
      });
    } finally {
      setIsDeleteModalVisible(false);
      setDeletingUom(null);
    }
  };

  const columns = [
    {
      title: 'UOM NAME',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'DESCRIPTION',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || '-',
    },
    {
      title: 'CREATED BY',
      dataIndex: 'createdBy',
      key: 'createdBy',
      render: (createdBy) => createdBy?.name || '-',
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
          <button className="icon-btn" onClick={() => handleEditUom(record)}>
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
    <div>
      <div className="uom-actions">
        <button className="btn-primary" onClick={handleCreateUom}>
          <PlusOutlined /> New UOM
        </button>
      </div>

      <div className="uom-table-container">
        <Table
          columns={columns}
          dataSource={uoms}
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
        title={editingUom ? 'Edit UOM' : 'New UOM'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        okText={editingUom ? 'Save' : 'Create'}
        cancelText="Cancel"
        width={500}
        className="simple-modal"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="UOM Name"
            name="name"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="Enter UOM name (e.g., Ton, Area, Task)" />
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
        </Form>
      </Modal>

      <Modal
        title="Delete UOM"
        open={isDeleteModalVisible}
        onOk={handleDeleteUom}
        onCancel={() => {
          setIsDeleteModalVisible(false);
          setDeletingUom(null);
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
              Are you sure you want to delete <strong>{deletingUom?.name}</strong>?
            </p>
            <p className="delete-warning">
              This action cannot be undone. Tasks using this UOM may be affected.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UomConfig;

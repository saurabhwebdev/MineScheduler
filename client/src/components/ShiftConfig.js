import React, { useState, useEffect } from 'react';
import { Table, Modal, Form, Input, notification, TimePicker, InputNumber, ColorPicker, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, ClockCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import moment from 'moment';
import config from '../config/config';

const { TextArea } = Input;

const ShiftConfig = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [deletingShift, setDeletingShift] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/shifts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setShifts(data.data.shifts);
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to fetch shifts',
        });
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to fetch shifts',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShift = () => {
    setEditingShift(null);
    form.resetFields();
    form.setFieldsValue({ 
      color: '#1890ff',
      shiftChangeDuration: 30,
      isActive: true
    });
    setIsModalVisible(true);
  };

  const handleEditShift = (shift) => {
    setEditingShift(shift);
    form.setFieldsValue({
      shiftName: shift.shiftName,
      shiftCode: shift.shiftCode,
      startTime: moment(shift.startTime, 'HH:mm'),
      endTime: moment(shift.endTime, 'HH:mm'),
      shiftChangeDuration: shift.shiftChangeDuration,
      color: shift.color,
      description: shift.description,
      isActive: shift.isActive,
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem('token');

      // Format time values
      const formattedValues = {
        ...values,
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime.format('HH:mm'),
        color: typeof values.color === 'string' ? values.color : values.color?.toHexString(),
      };

      if (editingShift) {
        const response = await fetch(`${config.apiUrl}/shifts/${editingShift._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(formattedValues),
        });
        const data = await response.json();

        if (response.ok && data.status === 'success') {
          notification.success({
            message: 'Success',
            description: 'Shift updated successfully',
          });
          fetchShifts();
        } else {
          notification.error({
            message: 'Error',
            description: data.message || 'Failed to update shift',
          });
        }
      } else {
        const response = await fetch(`${config.apiUrl}/shifts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(formattedValues),
        });
        const data = await response.json();

        if (response.ok && data.status === 'success') {
          notification.success({
            message: 'Success',
            description: 'Shift created successfully',
          });
          fetchShifts();
        } else {
          notification.error({
            message: 'Error',
            description: data.message || 'Failed to create shift',
          });
        }
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const showDeleteConfirm = (shift) => {
    setDeletingShift(shift);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteShift = async () => {
    if (!deletingShift) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/shifts/${deletingShift._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        notification.success({
          message: 'Success',
          description: 'Shift deleted successfully',
        });
        fetchShifts();
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to delete shift',
        });
      }
    } catch (error) {
      console.error('Error deleting shift:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to delete shift',
      });
    } finally {
      setIsDeleteModalVisible(false);
      setDeletingShift(null);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/shifts/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'shifts_export.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        notification.success({
          message: 'Export Successful',
          description: 'Shifts exported successfully',
        });
      } else {
        notification.error({
          message: 'Export Failed',
          description: 'Failed to export shifts',
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      notification.error({
        message: 'Export Error',
        description: 'An error occurred during export',
      });
    }
  };

  const columns = [
    {
      title: 'COLOR',
      dataIndex: 'color',
      key: 'color',
      width: 80,
      align: 'center',
      render: (color) => (
        <div style={{
          width: '32px',
          height: '32px',
          backgroundColor: color || '#1890ff',
          borderRadius: '4px',
          margin: '0 auto',
          border: '2px solid #e0e0e0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
        }} />
      ),
    },
    {
      title: 'SHIFT NAME',
      dataIndex: 'shiftName',
      key: 'shiftName',
      sorter: (a, b) => a.shiftName.localeCompare(b.shiftName),
    },
    {
      title: 'SHIFT CODE',
      dataIndex: 'shiftCode',
      key: 'shiftCode',
      sorter: (a, b) => a.shiftCode.localeCompare(b.shiftCode),
    },
    {
      title: 'START TIME',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time) => (
        <span>
          <ClockCircleOutlined style={{ marginRight: 6, color: '#52c41a' }} />
          {time}
        </span>
      ),
    },
    {
      title: 'END TIME',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (time) => (
        <span>
          <ClockCircleOutlined style={{ marginRight: 6, color: '#ff4d4f' }} />
          {time}
        </span>
      ),
    },
    {
      title: 'SHIFT CHANGE (MIN)',
      dataIndex: 'shiftChangeDuration',
      key: 'shiftChangeDuration',
      align: 'center',
      render: (duration) => `${duration} min`,
      sorter: (a, b) => a.shiftChangeDuration - b.shiftChangeDuration,
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
      title: 'ACTIONS',
      key: 'actions',
      align: 'center',
      width: 100,
      render: (_, record) => (
        <div className="action-buttons">
          <button className="icon-btn" onClick={() => handleEditShift(record)}>
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
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: 0, color: '#595959', fontSize: '14px' }}>
            Configure work shifts and shift change durations for scheduling
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-primary" onClick={handleCreateShift}>
            <PlusOutlined /> New Shift
          </button>
          <button className="btn-secondary" onClick={handleExport}>
            <DownloadOutlined /> Export
          </button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={shifts}
        loading={loading}
        rowKey="_id"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '25', '50'],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} shifts`,
        }}
      />

      <Modal
        title={editingShift ? 'Edit Shift' : 'New Shift'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        okText={editingShift ? 'Save' : 'Create'}
        cancelText="Cancel"
        width={600}
        className="simple-modal"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Shift Name"
            name="shiftName"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="e.g., Day Shift, Night Shift" />
          </Form.Item>

          <Form.Item
            label="Shift Code"
            name="shiftCode"
            rules={[{ required: true, message: 'Required' }]}
            tooltip="Unique code for this shift (auto-converted to uppercase)"
          >
            <Input placeholder="e.g., DAY, NIGHT, GENERAL" style={{ textTransform: 'uppercase' }} />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              label="Start Time"
              name="startTime"
              rules={[{ required: true, message: 'Required' }]}
            >
              <TimePicker 
                format="HH:mm" 
                style={{ width: '100%' }}
                placeholder="Select start time"
              />
            </Form.Item>

            <Form.Item
              label="End Time"
              name="endTime"
              rules={[{ required: true, message: 'Required' }]}
            >
              <TimePicker 
                format="HH:mm" 
                style={{ width: '100%' }}
                placeholder="Select end time"
              />
            </Form.Item>
          </div>

          <Form.Item
            label="Shift Change Duration (Minutes)"
            name="shiftChangeDuration"
            rules={[
              { required: true, message: 'Required' },
              { type: 'number', min: 0, message: 'Must be positive' }
            ]}
            tooltip="Time allocated for shift handover/changeover"
          >
            <InputNumber 
              style={{ width: '100%' }}
              min={0}
              placeholder="e.g., 30"
              addonAfter="minutes"
            />
          </Form.Item>

          <Form.Item
            label="Shift Color"
            name="color"
            rules={[{ required: true, message: 'Required' }]}
            getValueFromEvent={(color) => {
              return typeof color === 'string' ? color : color?.toHexString();
            }}
            tooltip="Color for visual identification in schedules"
          >
            <ColorPicker 
              showText
              format="hex"
              presets={[
                {
                  label: 'Recommended',
                  colors: [
                    '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
                    '#13c2c2', '#eb2f96', '#fa8c16', '#2f54eb', '#a0d911'
                  ],
                },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
          >
            <TextArea 
              placeholder="Additional notes about this shift" 
              rows={3}
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
        title="Delete Shift"
        open={isDeleteModalVisible}
        onOk={handleDeleteShift}
        onCancel={() => {
          setIsDeleteModalVisible(false);
          setDeletingShift(null);
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
              Are you sure you want to delete <strong>{deletingShift?.shiftName}</strong>?
            </p>
            <p className="delete-warning">
              This action cannot be undone.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ShiftConfig;

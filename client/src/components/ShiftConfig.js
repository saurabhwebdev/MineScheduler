import React, { useState, useEffect, useMemo } from 'react';
import { Table, Modal, Form, Input, notification, TimePicker, InputNumber, ColorPicker, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, ClockCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import config from '../config/config';

const { TextArea } = Input;

const ShiftConfig = () => {
  const { t } = useTranslation();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [deletingShift, setDeletingShift] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchShifts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
          message: t('settings.shiftConfig.error'),
          description: data.message || t('settings.shiftConfig.fetchError'),
        });
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
      notification.error({
        message: t('settings.shiftConfig.networkError'),
        description: t('settings.shiftConfig.fetchError'),
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
            message: t('settings.shiftConfig.success'),
            description: t('settings.shiftConfig.updateSuccess'),
          });
          fetchShifts();
        } else {
          notification.error({
            message: t('settings.shiftConfig.error'),
            description: data.message || t('settings.shiftConfig.updateError'),
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
            message: t('settings.shiftConfig.success'),
            description: t('settings.shiftConfig.createSuccess'),
          });
          fetchShifts();
        } else {
          notification.error({
            message: t('settings.shiftConfig.error'),
            description: data.message || t('settings.shiftConfig.createError'),
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
          message: t('settings.shiftConfig.success'),
          description: t('settings.shiftConfig.deleteSuccess'),
        });
        fetchShifts();
      } else {
        notification.error({
          message: t('settings.shiftConfig.error'),
          description: data.message || t('settings.shiftConfig.deleteError'),
        });
      }
    } catch (error) {
      console.error('Error deleting shift:', error);
      notification.error({
        message: t('settings.shiftConfig.networkError'),
        description: t('settings.shiftConfig.deleteError'),
      });
    } finally {
      setIsDeleteModalVisible(false);
      setDeletingShift(null);
    }
  };

  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) {
      notification.warning({
        message: t('common.warning', 'Warning'),
        description: t('settings.shiftConfig.noItemsSelected', 'Please select items to delete'),
      });
      return;
    }

    Modal.confirm({
      title: t('settings.shiftConfig.bulkDeleteTitle', 'Delete Selected Shifts'),
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          <p>{t('settings.shiftConfig.bulkDeleteMessage', 'Are you sure you want to delete')} <strong>{selectedRowKeys.length}</strong> {t('settings.shiftConfig.shifts', 'shift(s)')}?</p>
          <p style={{ color: '#ff4d4f', marginTop: '8px' }}>{t('settings.shiftConfig.bulkDeleteWarning', 'This action cannot be undone.')}</p>
        </div>
      ),
      okText: t('common.delete', 'Delete'),
      okType: 'danger',
      cancelText: t('common.cancel', 'Cancel'),
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          const deletePromises = selectedRowKeys.map(id =>
            fetch(`${config.apiUrl}/shifts/${id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            })
          );

          const results = await Promise.all(deletePromises);
          const successCount = results.filter(r => r.ok).length;
          const failCount = results.length - successCount;

          if (successCount > 0) {
            notification.success({
              message: t('settings.shiftConfig.success'),
              description: t('settings.shiftConfig.bulkDeleteSuccess', {
                defaultValue: `Successfully deleted ${successCount} shift(s)`,
                count: successCount
              }),
            });
          }

          if (failCount > 0) {
            notification.error({
              message: t('settings.shiftConfig.error'),
              description: t('settings.shiftConfig.bulkDeleteFail', {
                defaultValue: `Failed to delete ${failCount} shift(s)`,
                count: failCount
              }),
            });
          }

          setSelectedRowKeys([]);
          fetchShifts();
        } catch (error) {
          console.error('Error bulk deleting:', error);
          notification.error({
            message: t('settings.shiftConfig.networkError'),
            description: t('settings.shiftConfig.deleteError'),
          });
        }
      },
    });
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
          message: t('settings.shiftConfig.exportSuccess'),
          description: t('settings.shiftConfig.exportSuccessDesc'),
        });
      } else {
        notification.error({
          message: t('settings.shiftConfig.exportFailed'),
          description: t('settings.shiftConfig.exportError'),
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      notification.error({
        message: t('settings.shiftConfig.exportError'),
        description: t('settings.shiftConfig.exportErrorOccurred'),
      });
    }
  };

  const columns = useMemo(() => [
    {
      title: t('settings.shiftConfig.columnColor'),
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
      title: t('settings.shiftConfig.columnShiftName'),
      dataIndex: 'shiftName',
      key: 'shiftName',
      sorter: (a, b) => a.shiftName.localeCompare(b.shiftName),
    },
    {
      title: t('settings.shiftConfig.columnShiftCode'),
      dataIndex: 'shiftCode',
      key: 'shiftCode',
      sorter: (a, b) => a.shiftCode.localeCompare(b.shiftCode),
    },
    {
      title: t('settings.shiftConfig.columnStartTime'),
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
      title: t('settings.shiftConfig.columnEndTime'),
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
      title: t('settings.shiftConfig.columnShiftChange'),
      dataIndex: 'shiftChangeDuration',
      key: 'shiftChangeDuration',
      align: 'center',
      render: (duration) => `${duration} min`,
      sorter: (a, b) => a.shiftChangeDuration - b.shiftChangeDuration,
    },
    {
      title: t('settings.shiftConfig.columnStatus'),
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      render: (isActive) => (
        <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
          {isActive ? t('settings.shiftConfig.active') : t('settings.shiftConfig.inactive')}
        </span>
      ),
      filters: [
        { text: t('settings.shiftConfig.active'), value: true },
        { text: t('settings.shiftConfig.inactive'), value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: t('settings.shiftConfig.columnActions'),
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t]);

  return (
    <div>
      <div className="uom-actions">
        <button className="btn-primary" onClick={handleCreateShift}>
          <PlusOutlined /> {t('settings.shiftConfig.newShift')}
        </button>
        {selectedRowKeys.length > 0 && (
          <button className="btn-secondary" onClick={handleBulkDelete}>
            <DeleteOutlined /> {t('settings.shiftConfig.deleteSelected', `Delete Selected (${selectedRowKeys.length}`)}
          </button>
        )}
        <button className="btn-secondary" onClick={handleExport}>
          <DownloadOutlined /> {t('settings.shiftConfig.export')}
        </button>
      </div>

      <Table
        columns={columns}
        dataSource={shifts}
        loading={loading}
        rowKey="_id"
        rowSelection={{
          selectedRowKeys,
          onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
          preserveSelectedRowKeys: true,
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '25', '50'],
          showTotal: (total, range) => t('settings.shiftConfig.paginationText', { start: range[0], end: range[1], total }),
        }}
      />

      <Modal
        title={editingShift ? t('settings.shiftConfig.editShift') : t('settings.shiftConfig.newShift')}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        okText={editingShift ? t('settings.shiftConfig.save') : t('settings.shiftConfig.create')}
        cancelText={t('settings.shiftConfig.cancel')}
        width={600}
        className="simple-modal"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={t('settings.shiftConfig.shiftName')}
            name="shiftName"
            rules={[{ required: true, message: t('settings.shiftConfig.required') }]}
          >
            <Input placeholder={t('settings.shiftConfig.shiftNamePlaceholder')} />
          </Form.Item>

          <Form.Item
            label={t('settings.shiftConfig.shiftCode')}
            name="shiftCode"
            rules={[{ required: true, message: t('settings.shiftConfig.required') }]}
            tooltip={t('settings.shiftConfig.shiftCodeTooltip')}
          >
            <Input placeholder={t('settings.shiftConfig.shiftCodePlaceholder')} style={{ textTransform: 'uppercase' }} />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              label={t('settings.shiftConfig.startTime')}
              name="startTime"
              rules={[{ required: true, message: t('settings.shiftConfig.required') }]}
            >
              <TimePicker 
                format="HH:mm" 
                style={{ width: '100%' }}
                placeholder={t('settings.shiftConfig.startTimePlaceholder')}
              />
            </Form.Item>

            <Form.Item
              label={t('settings.shiftConfig.endTime')}
              name="endTime"
              rules={[{ required: true, message: t('settings.shiftConfig.required') }]}
            >
              <TimePicker 
                format="HH:mm" 
                style={{ width: '100%' }}
                placeholder={t('settings.shiftConfig.endTimePlaceholder')}
              />
            </Form.Item>
          </div>

          <Form.Item
            label={t('settings.shiftConfig.shiftChangeDuration')}
            name="shiftChangeDuration"
            rules={[
              { required: true, message: t('settings.shiftConfig.required') },
              { type: 'number', min: 0, message: t('settings.shiftConfig.mustBePositive') }
            ]}
            tooltip={t('settings.shiftConfig.shiftChangeTooltip')}
          >
            <InputNumber 
              style={{ width: '100%' }}
              min={0}
              placeholder={t('settings.shiftConfig.shiftChangePlaceholder')}
              addonAfter="minutes"
            />
          </Form.Item>

          <Form.Item
            label={t('settings.shiftConfig.shiftColor')}
            name="color"
            rules={[{ required: true, message: t('settings.shiftConfig.required') }]}
            getValueFromEvent={(color) => {
              return typeof color === 'string' ? color : color?.toHexString();
            }}
            tooltip={t('settings.shiftConfig.shiftColorTooltip')}
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
            label={t('settings.shiftConfig.description')}
            name="description"
          >
            <TextArea 
              placeholder={t('settings.shiftConfig.descriptionPlaceholder')} 
              rows={3}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            label={t('settings.shiftConfig.status')}
            name="isActive"
            valuePropName="checked"
          >
            <Switch 
              checkedChildren={t('settings.shiftConfig.active')} 
              unCheckedChildren={t('settings.shiftConfig.inactive')}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('settings.shiftConfig.deleteShift')}
        open={isDeleteModalVisible}
        onOk={handleDeleteShift}
        onCancel={() => {
          setIsDeleteModalVisible(false);
          setDeletingShift(null);
        }}
        okText={t('settings.shiftConfig.delete')}
        cancelText={t('settings.shiftConfig.cancel')}
        width={400}
        className="delete-modal"
        okButtonProps={{ danger: true }}
      >
        <div className="delete-modal-content">
          <ExclamationCircleOutlined className="delete-icon" />
          <div>
            <p className="delete-message">
              {t('settings.shiftConfig.deleteConfirm', { name: deletingShift?.shiftName })}
            </p>
            <p className="delete-warning">
              {t('settings.shiftConfig.deleteWarning')}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ShiftConfig;

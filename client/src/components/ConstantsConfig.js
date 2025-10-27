import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Table, Modal, Form, Input, InputNumber, Select, Switch, notification, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import config from '../config/config';

const { TextArea } = Input;
const { Option } = Select;

const ConstantsConfig = () => {
  const { t } = useTranslation();
  const [constants, setConstants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [editingConstant, setEditingConstant] = useState(null);
  const [deletingConstant, setDeletingConstant] = useState(null);
  const [form] = Form.useForm();
  const fileInputRef = useRef(null);

  // Get user info to check admin status
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchConstants();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
          message: t('settings.constantsConfig.error'),
          description: data.message || t('settings.constantsConfig.fetchError'),
        });
      }
    } catch (error) {
      console.error('Error fetching constants:', error);
      notification.error({
        message: t('settings.constantsConfig.networkError'),
        description: t('settings.constantsConfig.fetchError'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConstant = () => {
    if (!isAdmin) {
      notification.warning({
        message: t('settings.constantsConfig.permissionDenied'),
        description: t('settings.constantsConfig.adminOnlyCreate'),
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
        message: t('settings.constantsConfig.permissionDenied'),
        description: t('settings.constantsConfig.adminOnlyEdit'),
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
            message: t('settings.constantsConfig.success'),
            description: t('settings.constantsConfig.updateSuccess'),
          });
          fetchConstants();
        } else {
          notification.error({
            message: t('settings.constantsConfig.error'),
            description: data.message || t('settings.constantsConfig.updateError'),
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
            message: t('settings.constantsConfig.success'),
            description: t('settings.constantsConfig.createSuccess'),
          });
          fetchConstants();
        } else {
          notification.error({
            message: t('settings.constantsConfig.error'),
            description: data.message || t('settings.constantsConfig.createError'),
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
        message: t('settings.constantsConfig.permissionDenied'),
        description: t('settings.constantsConfig.adminOnlyDelete'),
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
          message: t('settings.constantsConfig.success'),
          description: t('settings.constantsConfig.deleteSuccess'),
        });
        fetchConstants();
      } else {
        notification.error({
          message: t('settings.constantsConfig.error'),
          description: data.message || t('settings.constantsConfig.deleteError'),
        });
      }
    } catch (error) {
      console.error('Error deleting constant:', error);
      notification.error({
        message: t('settings.constantsConfig.networkError'),
        description: t('settings.constantsConfig.deleteError'),
      });
    } finally {
      setIsDeleteModalVisible(false);
      setDeletingConstant(null);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/constants/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        notification.success({
          message: t('settings.constantsConfig.importSuccess'),
          description: t('settings.constantsConfig.importDetails', {
            success: data.data.success.length,
            skipped: data.data.skipped.length,
            failed: data.data.failed.length
          }),
          duration: 5,
        });
        fetchConstants();
      } else {
        notification.error({
          message: t('settings.constantsConfig.importFailed'),
          description: data.message || t('settings.constantsConfig.importError'),
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      notification.error({
        message: t('settings.constantsConfig.importError'),
        description: t('settings.constantsConfig.importErrorOccurred'),
      });
    }

    event.target.value = '';
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/constants/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'constants_export.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        notification.success({
          message: t('settings.constantsConfig.exportSuccess'),
          description: t('settings.constantsConfig.exportSuccessDesc'),
        });
      } else {
        notification.error({
          message: t('settings.constantsConfig.exportFailed'),
          description: t('settings.constantsConfig.exportError'),
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      notification.error({
        message: t('settings.constantsConfig.exportError'),
        description: t('settings.constantsConfig.exportErrorOccurred'),
      });
    }
  };

  const columns = useMemo(() => [
    {
      title: t('settings.constantsConfig.columnKeyword'),
      dataIndex: 'keyword',
      key: 'keyword',
      sorter: (a, b) => a.keyword.localeCompare(b.keyword),
      render: (text) => <strong style={{ color: '#ff8906' }}>{text}</strong>
    },
    {
      title: t('settings.constantsConfig.columnValue'),
      dataIndex: 'value',
      key: 'value',
      align: 'center',
      render: (value) => <strong>{value}</strong>
    },
    {
      title: t('settings.constantsConfig.columnUnit'),
      dataIndex: 'unit',
      key: 'unit',
      align: 'center',
    },
    {
      title: t('settings.constantsConfig.columnCategory'),
      dataIndex: 'category',
      key: 'category',
      align: 'center',
      filters: [
        { text: t('settings.constantsConfig.categoryMining'), value: 'Mining' },
        { text: t('settings.constantsConfig.categoryCalculation'), value: 'Calculation' },
        { text: t('settings.constantsConfig.categorySystem'), value: 'System' },
        { text: t('settings.constantsConfig.categoryOther'), value: 'Other' },
      ],
      onFilter: (value, record) => record.category === value,
      render: (category) => {
        const colors = {
          Mining: 'orange',
          Calculation: 'blue',
          System: 'green',
          Other: 'default'
        };
        const categoryLabels = {
          Mining: t('settings.constantsConfig.categoryMining'),
          Calculation: t('settings.constantsConfig.categoryCalculation'),
          System: t('settings.constantsConfig.categorySystem'),
          Other: t('settings.constantsConfig.categoryOther')
        };
        return <Tag color={colors[category] || 'default'}>{categoryLabels[category] || category}</Tag>;
      }
    },
    {
      title: t('settings.constantsConfig.columnDescription'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: t('settings.constantsConfig.columnStatus'),
      dataIndex: 'isActive',
      key: 'isActive',
      align: 'center',
      filters: [
        { text: t('settings.constantsConfig.active'), value: true },
        { text: t('settings.constantsConfig.inactive'), value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? t('settings.constantsConfig.active') : t('settings.constantsConfig.inactive')}
        </Tag>
      ),
    },
    {
      title: t('settings.constantsConfig.columnCreatedBy'),
      dataIndex: 'createdBy',
      key: 'createdBy',
      render: (createdBy) => createdBy?.name || '-',
    },
    {
      title: t('settings.constantsConfig.columnActions'),
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t, isAdmin]);

  return (
    <div>
      <div className="uom-actions">
        <button 
          className="btn-primary" 
          onClick={handleCreateConstant}
          disabled={!isAdmin}
          style={{ opacity: isAdmin ? 1 : 0.7, cursor: isAdmin ? 'pointer' : 'not-allowed' }}
        >
          <PlusOutlined /> {t('settings.constantsConfig.newConstant')}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImport}
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
        />
        <button 
          className="btn-secondary" 
          onClick={() => fileInputRef.current?.click()}
          disabled={!isAdmin}
          style={{ opacity: isAdmin ? 1 : 0.7, cursor: isAdmin ? 'pointer' : 'not-allowed' }}
        >
          <UploadOutlined /> {t('settings.constantsConfig.import')}
        </button>
        <button className="btn-secondary" onClick={handleExport}>
          <DownloadOutlined /> {t('settings.constantsConfig.export')}
        </button>
        {!isAdmin && (
          <span style={{ marginLeft: '10px', color: '#999', fontSize: '12px' }}>
            {t('settings.constantsConfig.adminRequired')}
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
        title={editingConstant ? t('settings.constantsConfig.editConstant') : t('settings.constantsConfig.newConstant')}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        okText={editingConstant ? t('settings.constantsConfig.save') : t('settings.constantsConfig.create')}
        cancelText={t('settings.constantsConfig.cancel')}
        width={600}
        className="simple-modal"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={t('settings.constantsConfig.keyword')}
            name="keyword"
            rules={[
              { required: true, message: t('settings.constantsConfig.required') },
              { pattern: /^[A-Z_]+$/, message: t('settings.constantsConfig.onlyUppercaseUnderscore') }
            ]}
            extra={t('settings.constantsConfig.keywordExtra')}
          >
            <Input 
              placeholder={t('settings.constantsConfig.keywordPlaceholder')} 
              disabled={!!editingConstant}
              style={{ textTransform: 'uppercase' }}
            />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              label={t('settings.constantsConfig.value')}
              name="value"
              rules={[
                { required: true, message: t('settings.constantsConfig.required') },
                { type: 'number', min: 0, message: t('settings.constantsConfig.mustBePositive') }
              ]}
            >
              <InputNumber 
                placeholder={t('settings.constantsConfig.valuePlaceholder')} 
                style={{ width: '100%' }}
                step={0.1}
                precision={2}
              />
            </Form.Item>

            <Form.Item
              label={t('settings.constantsConfig.unit')}
              name="unit"
              rules={[{ required: true, message: t('settings.constantsConfig.required') }]}
            >
              <Input placeholder={t('settings.constantsConfig.unitPlaceholder')} />
            </Form.Item>
          </div>

          <Form.Item
            label={t('settings.constantsConfig.category')}
            name="category"
            rules={[{ required: true, message: t('settings.constantsConfig.required') }]}
            initialValue="Mining"
          >
            <Select placeholder={t('settings.constantsConfig.categoryPlaceholder')}>
              <Option value="Mining">{t('settings.constantsConfig.categoryMining')}</Option>
              <Option value="Calculation">{t('settings.constantsConfig.categoryCalculation')}</Option>
              <Option value="System">{t('settings.constantsConfig.categorySystem')}</Option>
              <Option value="Other">{t('settings.constantsConfig.categoryOther')}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={t('settings.constantsConfig.description')}
            name="description"
          >
            <TextArea 
              rows={3}
              placeholder={t('settings.constantsConfig.descriptionPlaceholder')} 
            />
          </Form.Item>

          {editingConstant && (
            <Form.Item
              label={t('settings.constantsConfig.status')}
              name="isActive"
              valuePropName="checked"
            >
              <Switch 
                checkedChildren={t('settings.constantsConfig.active')} 
                unCheckedChildren={t('settings.constantsConfig.inactive')}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title={t('settings.constantsConfig.deleteConstant')}
        open={isDeleteModalVisible}
        onOk={handleDeleteConstant}
        onCancel={() => {
          setIsDeleteModalVisible(false);
          setDeletingConstant(null);
        }}
        okText={t('settings.constantsConfig.delete')}
        cancelText={t('settings.constantsConfig.cancel')}
        width={400}
        className="delete-modal"
        okButtonProps={{ danger: true }}
      >
        <div className="delete-modal-content">
          <ExclamationCircleOutlined className="delete-icon" />
          <div>
            <p className="delete-message">
              {t('settings.constantsConfig.deleteConfirm', { keyword: deletingConstant?.keyword })}
            </p>
            <p className="delete-warning">
              {t('settings.constantsConfig.deleteWarning')}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ConstantsConfig;

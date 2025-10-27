import React, { useState, useEffect, useRef } from 'react';
import { Table, Modal, Form, Input, notification } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import config from '../config/config';

const { TextArea } = Input;

const UomConfig = () => {
  const { t } = useTranslation();
  const [uoms, setUoms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [editingUom, setEditingUom] = useState(null);
  const [deletingUom, setDeletingUom] = useState(null);
  const [form] = Form.useForm();
  const fileInputRef = useRef(null);

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
          message: t('uomConfig.error'),
          description: data.message || t('uomConfig.fetchError'),
        });
      }
    } catch (error) {
      console.error('Error fetching UOMs:', error);
      notification.error({
        message: t('uomConfig.networkError'),
        description: t('uomConfig.fetchError'),
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
            message: t('uomConfig.success'),
            description: t('uomConfig.updateSuccess'),
          });
          fetchUoms();
        } else {
          notification.error({
            message: t('uomConfig.error'),
            description: data.message || t('uomConfig.updateError'),
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
            message: t('uomConfig.success'),
            description: t('uomConfig.createSuccess'),
          });
          fetchUoms();
        } else {
          notification.error({
            message: t('uomConfig.error'),
            description: data.message || t('uomConfig.createError'),
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
          message: t('uomConfig.success'),
          description: t('uomConfig.deleteSuccess'),
        });
        fetchUoms();
      } else {
        notification.error({
          message: t('uomConfig.error'),
          description: data.message || t('uomConfig.deleteError'),
        });
      }
    } catch (error) {
      console.error('Error deleting UOM:', error);
      notification.error({
        message: t('uomConfig.networkError'),
        description: t('uomConfig.deleteError'),
      });
    } finally {
      setIsDeleteModalVisible(false);
      setDeletingUom(null);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/uoms/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        notification.success({
          message: t('uomConfig.importSuccess'),
          description: t('uomConfig.importDetails', {
            success: data.data.success.length,
            skipped: data.data.skipped.length,
            failed: data.data.failed.length
          }),
          duration: 5,
        });
        fetchUoms();
      } else {
        notification.error({
          message: t('uomConfig.importFailed'),
          description: data.message || t('uomConfig.importError'),
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      notification.error({
        message: t('uomConfig.importError'),
        description: t('uomConfig.importErrorOccurred'),
      });
    }

    event.target.value = '';
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/uoms/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'uoms_export.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        notification.success({
          message: t('uomConfig.exportSuccess'),
          description: t('uomConfig.exportSuccessDesc'),
        });
      } else {
        notification.error({
          message: t('uomConfig.exportFailed'),
          description: t('uomConfig.exportError'),
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      notification.error({
        message: t('uomConfig.exportError'),
        description: t('uomConfig.exportErrorOccurred'),
      });
    }
  };

  const columns = [
    {
      title: t('uomConfig.columnName'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t('uomConfig.columnDescription'),
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || '-',
    },
    {
      title: t('uomConfig.columnCreatedBy'),
      dataIndex: 'createdBy',
      key: 'createdBy',
      render: (createdBy) => createdBy?.name || '-',
    },
    {
      title: t('uomConfig.columnCreated'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: t('uomConfig.columnActions'),
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
          <PlusOutlined /> {t('uomConfig.newUom')}
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
        >
          <UploadOutlined /> {t('uomConfig.import')}
        </button>
        <button className="btn-secondary" onClick={handleExport}>
          <DownloadOutlined /> {t('uomConfig.export')}
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
        title={editingUom ? t('uomConfig.editUom') : t('uomConfig.newUom')}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        okText={editingUom ? t('uomConfig.save') : t('uomConfig.create')}
        cancelText={t('uomConfig.cancel')}
        width={500}
        className="simple-modal"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={t('uomConfig.uomName')}
            name="name"
            rules={[{ required: true, message: t('uomConfig.required') }]}
          >
            <Input placeholder={t('uomConfig.uomNamePlaceholder')} />
          </Form.Item>

          <Form.Item
            label={t('uomConfig.description')}
            name="description"
          >
            <TextArea 
              rows={3}
              placeholder={t('uomConfig.descriptionPlaceholder')} 
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('uomConfig.deleteUom')}
        open={isDeleteModalVisible}
        onOk={handleDeleteUom}
        onCancel={() => {
          setIsDeleteModalVisible(false);
          setDeletingUom(null);
        }}
        okText={t('uomConfig.delete')}
        cancelText={t('uomConfig.cancel')}
        width={400}
        className="delete-modal"
        okButtonProps={{ danger: true }}
      >
        <div className="delete-modal-content">
          <ExclamationCircleOutlined className="delete-icon" />
          <div>
            <p className="delete-message">
              {t('uomConfig.deleteConfirm', { name: deletingUom?.name })}
            </p>
            <p className="delete-warning">
              {t('uomConfig.deleteWarning')}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UomConfig;

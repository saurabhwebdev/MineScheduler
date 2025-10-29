import React, { useState, useEffect, useMemo } from 'react';
import { Table, Modal, Form, Input, Switch, notification, Upload, Alert, Descriptions, Tag, ColorPicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';
import config from '../config/config';
import './Delays.css';

const { TextArea } = Input;

const Delays = () => {
  const { t } = useTranslation();
  const [delays, setDelays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [editingDelay, setEditingDelay] = useState(null);
  const [deletingDelay, setDeletingDelay] = useState(null);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [selectedDelay, setSelectedDelay] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 15,
  });
  const [form] = Form.useForm();

  useEffect(() => {
    fetchDelays();
  }, []);

  const fetchDelays = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/delays`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setDelays(data.data.delays);
      } else {
        notification.error({
          message: t('delays.messages.error'),
          description: data.message || t('delays.messages.fetchError'),
        });
      }
    } catch (error) {
      console.error('Error fetching delays:', error);
      notification.error({
        message: t('delays.messages.networkError'),
        description: t('delays.messages.fetchError'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDelay = () => {
    setEditingDelay(null);
    form.resetFields();
    form.setFieldsValue({ 
      isActive: true,
      color: '#ff4d4f'
    });
    setIsModalVisible(true);
  };

  const handleEditDelay = (delay) => {
    setEditingDelay(delay);
    form.setFieldsValue({
      delayCategory: delay.delayCategory,
      delayCode: delay.delayCode,
      description: delay.description,
      color: delay.color || '#ff4d4f',
      isActive: delay.isActive,
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      // Convert color object to hex string if needed
      if (values.color && typeof values.color === 'object') {
        values.color = values.color.toHexString();
      }
      const token = localStorage.getItem('token');

      if (editingDelay) {
        // Update delay
        const response = await fetch(`${config.apiUrl}/delays/${editingDelay._id}`, {
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
            message: t('delays.messages.success'),
            description: t('delays.messages.updateSuccess'),
          });
          fetchDelays();
        } else {
          notification.error({
            message: t('delays.messages.error'),
            description: data.message || t('delays.messages.updateError'),
          });
        }
      } else {
        // Create new delay
        const response = await fetch(`${config.apiUrl}/delays`, {
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
            message: t('delays.messages.success'),
            description: t('delays.messages.createSuccess'),
          });
          fetchDelays();
        } else {
          notification.error({
            message: t('delays.messages.error'),
            description: data.message || t('delays.messages.createError'),
          });
        }
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const showDeleteConfirm = (delay) => {
    setDeletingDelay(delay);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteDelay = async () => {
    if (!deletingDelay) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/delays/${deletingDelay._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        notification.success({
          message: t('delays.messages.success'),
          description: t('delays.messages.deleteSuccess'),
        });
        fetchDelays();
      } else {
        notification.error({
          message: t('delays.messages.error'),
          description: data.message || t('delays.messages.deleteError'),
        });
      }
    } catch (error) {
      console.error('Error deleting delay:', error);
      notification.error({
        message: t('delays.messages.networkError'),
        description: t('delays.messages.deleteError'),
      });
    } finally {
      setIsDeleteModalVisible(false);
      setDeletingDelay(null);
    }
  };

  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) {
      notification.warning({
        message: t('common.warning', 'Warning'),
        description: t('delays.messages.noDelaysSelected', 'Please select delays to delete'),
      });
      return;
    }

    Modal.confirm({
      title: t('delays.bulkDelete.title', 'Delete Selected Delays'),
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          <p>{t('delays.bulkDelete.message', 'Are you sure you want to delete')} <strong>{selectedRowKeys.length}</strong> {t('delays.bulkDelete.delays', 'delays')}?</p>
          <p style={{ color: '#ff4d4f', marginTop: '8px' }}>{t('delays.bulkDelete.warning', 'This action cannot be undone.')}</p>
        </div>
      ),
      okText: t('common.delete', 'Delete'),
      okType: 'danger',
      cancelText: t('common.cancel', 'Cancel'),
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          const deletePromises = selectedRowKeys.map(delayId =>
            fetch(`${config.apiUrl}/delays/${delayId}`, {
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
              message: t('delays.messages.success'),
              description: t('delays.bulkDelete.successMessage', {
                defaultValue: `Successfully deleted ${successCount} delay(s)`,
                count: successCount
              }),
            });
          }

          if (failCount > 0) {
            notification.error({
              message: t('delays.messages.error'),
              description: t('delays.bulkDelete.failMessage', {
                defaultValue: `Failed to delete ${failCount} delay(s)`,
                count: failCount
              }),
            });
          }

          setSelectedRowKeys([]);
          fetchDelays();
        } catch (error) {
          console.error('Error bulk deleting delays:', error);
          notification.error({
            message: t('delays.messages.networkError'),
            description: t('delays.messages.deleteError'),
          });
        }
      },
    });
  };

  const handleDownloadTemplate = () => {
    // Create template data
    const templateData = [
      {
        delayCategory: 'Equipment',
        delayCode: 'EQ-001',
        description: 'Equipment breakdown or maintenance delay',
        color: '#ff4d4f',
        isActive: 'Active'
      },
      {
        delayCategory: 'Safety',
        delayCode: 'SF-001',
        description: 'Safety inspection delay',
        color: '#faad14',
        isActive: 'Active'
      },
      {
        delayCategory: 'Weather',
        delayCode: 'WT-001',
        description: 'Heavy rain delay',
        color: '#1890ff',
        isActive: 'Active'
      }
    ];

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 20 },  // delayCategory
      { wch: 15 },  // delayCode
      { wch: 50 },  // description
      { wch: 12 },  // color
      { wch: 12 }   // isActive
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Delays');

    // Download
    XLSX.writeFile(wb, 'Delay_Import_Template.xlsx');
    
    notification.success({
      message: t('delays.messages.templateDownloaded'),
      description: t('delays.messages.templateDownloadedDesc'),
    });
  };

  const handleImportExcel = () => {
    setImportFile(null);
    setImportResults(null);
    setIsImportModalVisible(true);
  };

  const handleFileChange = (info) => {
    const file = info.file.originFileObj || info.file;
    setImportFile(file);
  };

  const handleRowClick = (record, event) => {
    // Don't open detail modal if clicking on action buttons
    if (event.target.closest('.action-buttons')) {
      return;
    }
    setSelectedDelay(record);
    setIsDetailModalVisible(true);
  };

  const handleDetailModalClose = () => {
    setIsDetailModalVisible(false);
    setSelectedDelay(null);
  };

  const handleTableChange = (newPagination, filters, sorter) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  const handleImportSubmit = async () => {
    if (!importFile) {
      notification.error({
        message: t('delays.messages.noFileSelected'),
        description: t('delays.messages.selectFileError'),
      });
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/delays/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setImportResults(data.data);
        notification.success({
          message: t('delays.messages.importCompleted'),
          description: data.message,
        });
        fetchDelays();
      } else {
        notification.error({
          message: t('delays.messages.importFailed'),
          description: data.message || t('delays.messages.importError'),
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      notification.error({
        message: t('delays.messages.networkError'),
        description: t('delays.messages.importError'),
      });
    } finally {
      setImporting(false);
    }
  };

  const columns = useMemo(() => [
    {
      title: t('delays.columns.delayCategory'),
      dataIndex: 'delayCategory',
      key: 'delayCategory',
      sorter: (a, b) => a.delayCategory.localeCompare(b.delayCategory),
    },
    {
      title: t('delays.columns.delayCode'),
      dataIndex: 'delayCode',
      key: 'delayCode',
      sorter: (a, b) => a.delayCode.localeCompare(b.delayCode),
    },
    {
      title: t('delays.columns.description'),
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: t('delays.columns.color'),
      dataIndex: 'color',
      key: 'color',
      render: (color) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
          <div 
            style={{ 
              width: '20px', 
              height: '20px', 
              backgroundColor: color || '#ff4d4f',
              border: '1px solid #d9d9d9',
              borderRadius: '2px'
            }}
          />
          <span style={{ fontSize: '11px', color: '#666' }}>{color || '#ff4d4f'}</span>
        </div>
      ),
    },
    {
      title: t('delays.columns.status'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
          {isActive ? t('delays.status.active') : t('delays.status.inactive')}
        </span>
      ),
      filters: [
        { text: t('delays.filters.active'), value: true },
        { text: t('delays.filters.inactive'), value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: t('delays.columns.created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: t('delays.columns.actions'),
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <div className="action-buttons" style={{ display: 'inline-flex', gap: '4px' }}>
          <button className="icon-btn" onClick={(e) => { e.stopPropagation(); handleEditDelay(record); }}>
            <EditOutlined />
          </button>
          <button 
            className="icon-btn delete"
            onClick={(e) => { e.stopPropagation(); showDeleteConfirm(record); }}
          >
            <DeleteOutlined />
          </button>
        </div>
      ),
    },
  ], [t]);

  return (
    <DashboardLayout
      title={t('delays.title')}
      subtitle={t('delays.subtitle')}
      page="delays"
    >
      <div className="delay-page">
        <div className="page-header">
          <div className="header-actions">
            <button className="btn-secondary" onClick={handleDownloadTemplate}>
              <DownloadOutlined /> {t('delays.downloadTemplate')}
            </button>
            <button className="btn-secondary" onClick={handleImportExcel}>
              <UploadOutlined /> {t('delays.importExcel')}
            </button>
            <button className="btn-primary" onClick={handleCreateDelay}>
              <PlusOutlined /> {t('delays.newDelay')}
            </button>
          </div>
        </div>

        {selectedRowKeys.length > 0 && (
          <div style={{ marginBottom: '16px', padding: '12px', background: '#fff7e6', borderRadius: '8px', border: '1px solid #ffd591' }}>
            <span style={{ marginRight: '12px', fontWeight: 500 }}>
              {selectedRowKeys.length} {t('delays.bulkDelete.selected', 'delay(s) selected')}
            </span>
            <button 
              className="btn-danger" 
              onClick={handleBulkDelete}
              style={{ background: '#ff4d4f', border: 'none', color: 'white', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer' }}
            >
              <DeleteOutlined /> {t('delays.bulkDelete.deleteSelected', 'Delete Selected')}
            </button>
          </div>
        )}

        <div className="table-container">
          <Table
            columns={columns}
            dataSource={delays}
            loading={loading}
            rowKey="_id"
            rowSelection={{
              selectedRowKeys,
              onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
              preserveSelectedRowKeys: true,
            }}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              showSizeChanger: true,
              pageSizeOptions: ['10', '15', '25', '50', '100'],
              showTotal: (total, range) => t('delays.pagination.total', { start: range[0], end: range[1], total }),
              simple: false,
            }}
            onChange={handleTableChange}
            onRow={(record) => ({
              onClick: (event) => handleRowClick(record, event),
              style: { cursor: 'pointer' }
            })}
          />
        </div>

        <Modal
          title={editingDelay ? t('delays.editDelay') : t('delays.newDelay')}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
          }}
          okText={editingDelay ? t('delays.save') : t('delays.create')}
          cancelText={t('delays.cancel')}
          width={480}
          className="simple-modal"
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label={t('delays.form.delayCategory')}
              name="delayCategory"
              rules={[{ required: true, message: t('delays.form.required') }]}
            >
              <Input placeholder={t('delays.form.delayCategoryPlaceholder')} />
            </Form.Item>

            <Form.Item
              label={t('delays.form.delayCode')}
              name="delayCode"
              rules={[{ required: true, message: t('delays.form.required') }]}
            >
              <Input placeholder={t('delays.form.delayCodePlaceholder')} />
            </Form.Item>

            <Form.Item
              label={t('delays.form.delayColor')}
              name="color"
              tooltip={t('delays.form.colorTooltip')}
            >
              <ColorPicker 
                showText
                format="hex"
                presets={[
                  {
                    label: t('delays.form.recommended'),
                    colors: [
                      '#ff4d4f',
                      '#faad14',
                      '#1890ff',
                      '#52c41a',
                      '#722ed1',
                      '#eb2f96',
                      '#fa8c16',
                      '#13c2c2',
                    ],
                  },
                ]}
              />
            </Form.Item>

            <Form.Item
              label={t('delays.form.description')}
              name="description"
              rules={[{ required: true, message: t('delays.form.required') }]}
            >
              <TextArea 
                placeholder={t('delays.form.descriptionPlaceholder')} 
                rows={4}
                maxLength={500}
                showCount
              />
            </Form.Item>

            <Form.Item
              label={t('delays.form.status')}
              name="isActive"
              valuePropName="checked"
            >
              <Switch 
                checkedChildren={t('delays.form.active')} 
                unCheckedChildren={t('delays.form.inactive')}
              />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={t('delays.deleteModal.title')}
          open={isDeleteModalVisible}
          onOk={handleDeleteDelay}
          onCancel={() => {
            setIsDeleteModalVisible(false);
            setDeletingDelay(null);
          }}
          okText={t('delays.delete')}
          cancelText={t('delays.cancel')}
          width={400}
          className="delete-modal"
          okButtonProps={{ danger: true }}
        >
          <div className="delete-modal-content">
            <ExclamationCircleOutlined className="delete-icon" />
            <div>
              <p className="delete-message">
                {t('delays.deleteModal.message')} <strong>{deletingDelay?.delayCode}</strong>?
              </p>
              <p className="delete-warning">
                {t('delays.deleteModal.warning')}
              </p>
            </div>
          </div>
        </Modal>

        <Modal
          title={t('delays.importModal.title')}
          open={isImportModalVisible}
          onOk={handleImportSubmit}
          onCancel={() => {
            setIsImportModalVisible(false);
            setImportFile(null);
            setImportResults(null);
          }}
          okText={importing ? t('delays.importing') : t('delays.import')}
          cancelText={t('delays.close')}
          width={600}
          className="simple-modal"
          confirmLoading={importing}
        >
          <div style={{ marginBottom: '16px' }}>
            <Alert
              message={t('delays.importModal.formatInstructions')}
              description={
                <div>
                  <p style={{ marginBottom: '12px', fontWeight: 500 }}>{t('delays.importModal.requiredColumns')}</p>
                  <table style={{ width: '100%', fontSize: '12px', marginBottom: '12px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#fafafa' }}>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #d9d9d9' }}>{t('delays.importModal.column')}</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #d9d9d9' }}>{t('delays.importModal.required')}</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #d9d9d9' }}>{t('delays.importModal.example')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '6px', borderBottom: '1px solid #f0f0f0' }}><strong>delayCategory</strong></td>
                        <td style={{ padding: '6px', borderBottom: '1px solid #f0f0f0' }}><Tag color="red">{t('delays.importModal.yes')}</Tag></td>
                        <td style={{ padding: '6px', borderBottom: '1px solid #f0f0f0' }}>Equipment, Safety, Weather</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px', borderBottom: '1px solid #f0f0f0' }}><strong>delayCode</strong></td>
                        <td style={{ padding: '6px', borderBottom: '1px solid #f0f0f0' }}><Tag color="red">{t('delays.importModal.yes')}</Tag></td>
                        <td style={{ padding: '6px', borderBottom: '1px solid #f0f0f0' }}>EQ-001, SF-001, WT-001</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px', borderBottom: '1px solid #f0f0f0' }}><strong>description</strong></td>
                        <td style={{ padding: '6px', borderBottom: '1px solid #f0f0f0' }}><Tag color="red">{t('delays.importModal.yes')}</Tag></td>
                        <td style={{ padding: '6px', borderBottom: '1px solid #f0f0f0' }}>Equipment breakdown delay</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px', borderBottom: '1px solid #f0f0f0' }}><strong>color</strong></td>
                        <td style={{ padding: '6px', borderBottom: '1px solid #f0f0f0' }}><Tag color="blue">{t('delays.importModal.no')}</Tag></td>
                        <td style={{ padding: '6px', borderBottom: '1px solid #f0f0f0' }}>#ff4d4f, #faad14, #1890ff</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px' }}><strong>isActive</strong></td>
                        <td style={{ padding: '6px' }}><Tag color="blue">{t('delays.importModal.no')}</Tag></td>
                        <td style={{ padding: '6px' }}>Active, Inactive, Yes, No, 1, 0</td>
                      </tr>
                    </tbody>
                  </table>
                  <p style={{ marginBottom: 0, fontSize: '12px', color: '#666' }}>
                    💡 <strong>{t('delays.importModal.tip')}</strong> {t('delays.importModal.tipDescription')}
                  </p>
                </div>
              }
              type="info"
              showIcon
            />
          </div>

          <Upload
            accept=".xlsx,.xls"
            beforeUpload={() => false}
            onChange={handleFileChange}
            maxCount={1}
            fileList={importFile ? [importFile] : []}
          >
            <button className="btn-secondary" style={{ width: '100%', marginBottom: '12px' }}>
              <UploadOutlined /> {t('delays.importModal.selectFile')}
            </button>
          </Upload>

          {importResults && (
            <div style={{ marginTop: '16px' }}>
              <Alert
                message={t('delays.importModal.importResults')}
                description={
                  <div>
                    <p><strong>{t('delays.importModal.successful')}</strong> {importResults.success.length} {t('delays.importModal.successfulDesc')}</p>
                    <p><strong>{t('delays.importModal.skipped')}</strong> {importResults.skipped.length} {t('delays.importModal.skippedDesc')}</p>
                    <p><strong>{t('delays.importModal.failed')}</strong> {importResults.failed.length} {t('delays.importModal.failedDesc')}</p>
                    
                    {importResults.skipped.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <strong>{t('delays.importModal.skippedItems')}</strong>
                        <ul style={{ marginLeft: '20px', fontSize: '12px' }}>
                          {importResults.skipped.slice(0, 5).map((item, index) => (
                            <li key={index}>
                              {item.row.delayCode} - {item.reason}
                            </li>
                          ))}
                          {importResults.skipped.length > 5 && (
                            <li>{t('delays.importModal.andMore', { count: importResults.skipped.length - 5 })}</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {importResults.failed.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <strong>{t('delays.importModal.failedItems')}</strong>
                        <ul style={{ marginLeft: '20px', fontSize: '12px' }}>
                          {importResults.failed.slice(0, 5).map((item, index) => (
                            <li key={index}>
                              {item.row.delayCode} - {item.reason}
                            </li>
                          ))}
                          {importResults.failed.length > 5 && (
                            <li>{t('delays.importModal.andMore', { count: importResults.failed.length - 5 })}</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                }
                type={importResults.failed.length > 0 ? 'warning' : 'success'}
                showIcon
              />
            </div>
          )}
        </Modal>

        <Modal
          title={t('delays.detailModal.title')}
          open={isDetailModalVisible}
          onCancel={handleDetailModalClose}
          footer={[
            <button key="close" className="btn-secondary" onClick={handleDetailModalClose}>
              {t('delays.close')}
            </button>,
            <button 
              key="edit" 
              className="btn-primary" 
              onClick={() => {
                handleDetailModalClose();
                handleEditDelay(selectedDelay);
              }}
            >
              <EditOutlined /> {t('delays.edit')}
            </button>
          ]}
          width={600}
          className="simple-modal"
        >
          {selectedDelay && (
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label={t('delays.detailModal.delayCategory')}>
                <strong>{selectedDelay.delayCategory}</strong>
              </Descriptions.Item>
              <Descriptions.Item label={t('delays.detailModal.delayCode')}>
                <strong style={{ color: '#062d54' }}>{selectedDelay.delayCode}</strong>
              </Descriptions.Item>
              <Descriptions.Item label={t('delays.detailModal.color')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div 
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      backgroundColor: selectedDelay.color || '#ff4d4f',
                      border: '2px solid #d9d9d9',
                      borderRadius: '6px'
                    }}
                  />
                  <span style={{ fontWeight: 500 }}>{selectedDelay.color || '#ff4d4f'}</span>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label={t('delays.detailModal.description')}>
                {selectedDelay.description}
              </Descriptions.Item>
              <Descriptions.Item label={t('delays.detailModal.status')}>
                <Tag color={selectedDelay.isActive ? 'green' : 'red'}>
                  {selectedDelay.isActive ? t('delays.status.active') : t('delays.status.inactive')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('delays.detailModal.createdBy')}>
                {selectedDelay.createdBy?.name || t('delays.detailModal.na')}
                {selectedDelay.createdBy?.email && (
                  <span style={{ color: '#8c8c8c', marginLeft: '8px' }}>({selectedDelay.createdBy.email})</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label={t('delays.detailModal.createdAt')}>
                {moment(selectedDelay.createdAt).format('MMMM D, YYYY [at] h:mm A')}
              </Descriptions.Item>
              <Descriptions.Item label={t('delays.detailModal.lastUpdated')}>
                {moment(selectedDelay.updatedAt).format('MMMM D, YYYY [at] h:mm A')}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Delays;

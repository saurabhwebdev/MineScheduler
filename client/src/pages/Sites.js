import React, { useState, useEffect, useMemo } from 'react';
import { Table, Modal, Form, Input, InputNumber, Select, Switch, notification, Tabs, Upload, Alert, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, UploadOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';
import config from '../config/config';
import './Sites.css';

const { Option } = Select;
const { TextArea } = Input;

const Sites = () => {
  const { t } = useTranslation();
  const [sites, setSites] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [deletingSite, setDeletingSite] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSites();
    fetchTasks();
  }, []);

  const fetchSites = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/sites`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setSites(data.data.sites);
      } else {
        notification.error({
          message: t('sites.messages.error'),
          description: data.message || t('sites.messages.fetchError'),
        });
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
      notification.error({
        message: t('sites.messages.networkError'),
        description: t('sites.messages.fetchError'),
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setTasks(data.data.tasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleCreateSite = () => {
    setEditingSite(null);
    form.resetFields();
    form.setFieldsValue({ 
      isActive: true,
      siteType: 'mining',
      priority: 1,
      totalBackfillTonnes: 0,
      totalPlanMeters: 0,
      remoteTonnes: 0,
      timeToComplete: 0,
      firings: 0,
      width: 0,
      height: 0
    });
    setIsModalVisible(true);
  };

  const handleEditSite = (site) => {
    setEditingSite(site);
    form.setFieldsValue({
      siteId: site.siteId,
      siteName: site.siteName,
      priority: site.priority,
      isActive: site.isActive,
      location: site.location,
      siteType: site.siteType,
      totalBackfillTonnes: site.totalBackfillTonnes,
      totalPlanMeters: site.totalPlanMeters,
      remoteTonnes: site.remoteTonnes,
      currentTask: site.currentTask,
      timeToComplete: site.timeToComplete,
      firings: site.firings,
      width: site.width,
      height: site.height,
      notes: site.notes
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem('token');

      if (editingSite) {
        // Update site
        const response = await fetch(`${config.apiUrl}/sites/${editingSite._id}`, {
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
            message: t('sites.messages.success'),
            description: t('sites.messages.updateSuccess'),
          });
          fetchSites();
        } else {
          notification.error({
            message: t('sites.messages.error'),
            description: data.message || t('sites.messages.updateError'),
          });
        }
      } else {
        // Create new site
        const response = await fetch(`${config.apiUrl}/sites`, {
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
            message: t('sites.messages.success'),
            description: t('sites.messages.createSuccess'),
          });
          fetchSites();
        } else {
          notification.error({
            message: t('sites.messages.error'),
            description: data.message || t('sites.messages.createError'),
          });
        }
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const showDeleteConfirm = (site) => {
    setDeletingSite(site);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteSite = async () => {
    if (!deletingSite) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/sites/${deletingSite._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        notification.success({
          message: t('sites.messages.success'),
          description: t('sites.messages.deleteSuccess'),
        });
        fetchSites();
      } else {
        notification.error({
          message: t('sites.messages.error'),
          description: data.message || t('sites.messages.deleteError'),
        });
      }
    } catch (error) {
      console.error('Error deleting site:', error);
      notification.error({
        message: t('sites.messages.networkError'),
        description: t('sites.messages.deleteError'),
      });
    } finally {
      setIsDeleteModalVisible(false);
      setDeletingSite(null);
    }
  };

  const handleToggleStatus = async (site) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/sites/${site._id}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        notification.success({
          message: t('sites.messages.success'),
          description: t('sites.messages.toggleSuccess', { 
            status: data.data.site.isActive ? t('sites.messages.activated') : t('sites.messages.deactivated') 
          }),
        });
        fetchSites();
      } else {
        notification.error({
          message: t('sites.messages.error'),
          description: data.message || t('sites.messages.toggleError'),
        });
      }
    } catch (error) {
      console.error('Error toggling site status:', error);
      notification.error({
        message: t('sites.messages.networkError'),
        description: t('sites.messages.toggleError'),
      });
    }
  };

  const showDetailModal = (site) => {
    setSelectedSite(site);
    setIsDetailModalVisible(true);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        siteId: 'SITE-001',
        siteName: 'Example Site',
        priority: 1,
        isActive: true,
        location: 'Area A',
        siteType: 'mining',
        totalBackfillTonnes: 1000,
        totalPlanMeters: 500,
        remoteTonnes: 200,
        currentTask: 'DRI',
        timeToComplete: 8,
        firings: 2,
        width: 5,
        height: 3,
        notes: 'Example notes'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sites Template');
    XLSX.writeFile(workbook, 'sites_template.xlsx');
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/sites/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        const worksheet = XLSX.utils.json_to_sheet(data.data.sites);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sites');
        XLSX.writeFile(workbook, 'sites_export.xlsx');
        notification.success({
          message: t('sites.messages.success'),
          description: t('sites.messages.exportSuccess'),
        });
      }
    } catch (error) {
      console.error('Error exporting sites:', error);
      notification.error({
        message: t('sites.messages.error'),
        description: t('sites.messages.exportError'),
      });
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      notification.error({
        message: t('sites.messages.error'),
        description: t('sites.messages.selectFileError'),
      });
      return;
    }

    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const token = localStorage.getItem('token');
        const response = await fetch(`${config.apiUrl}/sites/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ sites: jsonData }),
        });
        const result = await response.json();

        if (response.ok && result.status === 'success') {
          setImportResults(result.data);
          notification.success({
            message: t('sites.messages.importComplete'),
            description: t('sites.messages.importSuccess', { count: result.data.imported }),
          });
          fetchSites();
        } else {
          notification.error({
            message: t('sites.messages.error'),
            description: result.message || t('sites.messages.importError'),
          });
        }
      };
      reader.readAsArrayBuffer(importFile);
    } catch (error) {
      console.error('Error importing sites:', error);
      notification.error({
        message: t('sites.messages.error'),
        description: t('sites.messages.importError'),
      });
    } finally {
      setImporting(false);
    }
  };

  const columns = useMemo(() => [
    {
      title: t('sites.columns.priority'),
      dataIndex: 'priority',
      key: 'priority',
      sorter: (a, b) => a.priority - b.priority,
      render: (priority) => (
        <span className="priority-badge">{priority}</span>
      ),
    },
    {
      title: t('sites.columns.siteId'),
      dataIndex: 'siteId',
      key: 'siteId',
      sorter: (a, b) => a.siteId.localeCompare(b.siteId),
    },
    {
      title: t('sites.columns.siteName'),
      dataIndex: 'siteName',
      key: 'siteName',
      sorter: (a, b) => a.siteName.localeCompare(b.siteName),
    },
    {
      title: t('sites.columns.type'),
      dataIndex: 'siteType',
      key: 'siteType',
      filters: [
        { text: t('sites.types.mining'), value: 'mining' },
        { text: t('sites.types.backfill'), value: 'backfill' },
        { text: t('sites.types.development'), value: 'development' },
        { text: t('sites.types.exploration'), value: 'exploration' },
        { text: t('sites.types.other'), value: 'other' },
      ],
      onFilter: (value, record) => record.siteType === value,
      render: (type) => (
        <Tag color="blue">{t(`sites.types.${type}`)}</Tag>
      ),
    },
    {
      title: t('sites.columns.location'),
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: t('sites.columns.status'),
      dataIndex: 'isActive',
      key: 'isActive',
      filters: [
        { text: t('sites.filters.active'), value: true },
        { text: t('sites.filters.inactive'), value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
      render: (isActive, record) => (
        <span 
          className={`status-badge ${isActive ? 'active' : 'inactive'}`}
          onClick={() => handleToggleStatus(record)}
          style={{ cursor: 'pointer' }}
        >
          {isActive ? t('sites.status.active') : t('sites.status.inactive')}
        </span>
      ),
    },
    {
      title: t('sites.columns.currentTask'),
      dataIndex: 'currentTask',
      key: 'currentTask',
      render: (task) => task || '-',
    },
    {
      title: t('sites.columns.actions'),
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <div className="action-buttons">
          <button className="icon-btn" onClick={() => showDetailModal(record)} title={t('sites.viewDetails')}>
            <EyeOutlined />
          </button>
          <button className="icon-btn" onClick={() => handleEditSite(record)}>
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
  ], [t]);

  return (
    <DashboardLayout
      title={t('sites.title')}
      subtitle={t('sites.subtitle')}
      page="sites"
    >
      <div className="site-page">
        <div className="page-header">
          <div className="header-actions">
            <button className="btn-secondary" onClick={handleDownloadTemplate}>
              <DownloadOutlined /> {t('sites.template')}
            </button>
            <button className="btn-secondary" onClick={() => setIsImportModalVisible(true)}>
              <UploadOutlined /> {t('sites.import')}
            </button>
            <button className="btn-secondary" onClick={handleExport}>
              <DownloadOutlined /> {t('sites.export')}
            </button>
            <button className="btn-primary" onClick={handleCreateSite}>
              <PlusOutlined /> {t('sites.newSite')}
            </button>
          </div>
        </div>

        <div className="table-container">
          <Table
            columns={columns}
            dataSource={sites}
            loading={loading}
            rowKey="_id"
            pagination={{
              pageSize: 15,
              showSizeChanger: false,
              simple: false,
            }}
          />
        </div>

        {/* Create/Edit Modal */}
        <Modal
          title={editingSite ? t('sites.editSite') : t('sites.newSite')}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
          }}
          okText={editingSite ? t('sites.save') : t('sites.create')}
          cancelText={t('sites.cancel')}
          width={600}
          className="simple-modal"
        >
          <Form form={form} layout="vertical">
            <Tabs defaultActiveKey="1">
              <Tabs.TabPane tab={t('sites.tabs.basicInfo')} key="1">
                <Form.Item
                  label={t('sites.form.siteId')}
                  name="siteId"
                  rules={[{ required: true, message: t('sites.form.required') }]}
                >
                  <Input placeholder={t('sites.form.siteIdPlaceholder')} disabled={editingSite} />
                </Form.Item>

                <Form.Item
                  label={t('sites.form.siteName')}
                  name="siteName"
                  rules={[{ required: true, message: t('sites.form.required') }]}
                >
                  <Input placeholder={t('sites.form.siteNamePlaceholder')} />
                </Form.Item>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <Form.Item
                    label={t('sites.form.priority')}
                    name="priority"
                    rules={[{ required: true, message: t('sites.form.required') }]}
                    style={{ flex: 1 }}
                  >
                    <InputNumber min={1} style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item
                    label={t('sites.form.type')}
                    name="siteType"
                    rules={[{ required: true, message: t('sites.form.required') }]}
                    style={{ flex: 1 }}
                  >
                    <Select>
                      <Option value="mining">{t('sites.types.mining')}</Option>
                      <Option value="backfill">{t('sites.types.backfill')}</Option>
                      <Option value="development">{t('sites.types.development')}</Option>
                      <Option value="exploration">{t('sites.types.exploration')}</Option>
                      <Option value="other">{t('sites.types.other')}</Option>
                    </Select>
                  </Form.Item>
                </div>

                <Form.Item
                  label={t('sites.form.location')}
                  name="location"
                >
                  <Input placeholder={t('sites.form.locationPlaceholder')} />
                </Form.Item>

                <Form.Item
                  label={t('sites.form.active')}
                  name="isActive"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Tabs.TabPane>

              <Tabs.TabPane tab={t('sites.tabs.planningData')} key="2">
                <div style={{ display: 'flex', gap: '16px' }}>
                  <Form.Item
                    label={t('sites.form.totalBackfillTonnes')}
                    name="totalBackfillTonnes"
                    style={{ flex: 1 }}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item
                    label={t('sites.form.totalPlanMeters')}
                    name="totalPlanMeters"
                    style={{ flex: 1 }}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <Form.Item
                    label={t('sites.form.remoteTonnes')}
                    name="remoteTonnes"
                    style={{ flex: 1 }}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item
                    label={t('sites.form.firings')}
                    name="firings"
                    style={{ flex: 1 }}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <Form.Item
                    label={t('sites.form.width')}
                    name="width"
                    style={{ flex: 1 }}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item
                    label={t('sites.form.height')}
                    name="height"
                    style={{ flex: 1 }}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </div>

                <Form.Item
                  label={t('sites.form.currentTask')}
                  name="currentTask"
                >
                  <Select placeholder={t('sites.form.selectTask')} allowClear>
                    {tasks.map(task => (
                      <Option key={task._id} value={task.taskId}>{task.taskId} - {task.taskName}</Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  label={t('sites.form.timeToComplete')}
                  name="timeToComplete"
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Tabs.TabPane>

              <Tabs.TabPane tab={t('sites.tabs.notes')} key="3">
                <Form.Item
                  label={t('sites.form.notes')}
                  name="notes"
                >
                  <TextArea rows={6} placeholder={t('sites.form.notesPlaceholder')} />
                </Form.Item>
              </Tabs.TabPane>
            </Tabs>
          </Form>
        </Modal>

        {/* Delete Modal */}
        <Modal
          title={t('sites.deleteModal.title')}
          open={isDeleteModalVisible}
          onOk={handleDeleteSite}
          onCancel={() => {
            setIsDeleteModalVisible(false);
            setDeletingSite(null);
          }}
          okText={t('sites.delete')}
          cancelText={t('sites.cancel')}
          width={400}
          className="delete-modal"
          okButtonProps={{ danger: true }}
        >
          <div className="delete-modal-content">
            <ExclamationCircleOutlined className="delete-icon" />
            <div>
              <p className="delete-message">
                {t('sites.deleteModal.message')} <strong>{deletingSite?.siteId}</strong>?
              </p>
              <p className="delete-warning">
                {t('sites.deleteModal.warning')}
              </p>
            </div>
          </div>
        </Modal>

        {/* Import Modal */}
        <Modal
          title={t('sites.importModal.title')}
          open={isImportModalVisible}
          onOk={handleImport}
          onCancel={() => {
            setIsImportModalVisible(false);
            setImportFile(null);
            setImportResults(null);
          }}
          okText={t('sites.import')}
          cancelText={t('sites.cancel')}
          confirmLoading={importing}
          width={500}
          className="simple-modal"
        >
          <Alert
            message={t('sites.importModal.instructions')}
            description={t('sites.importModal.instructionsDesc')}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Upload
            beforeUpload={(file) => {
              setImportFile(file);
              return false;
            }}
            onRemove={() => setImportFile(null)}
            maxCount={1}
            accept=".xlsx,.xls"
          >
            <button className="btn-secondary" style={{ marginBottom: 16 }}>
              <UploadOutlined /> {t('sites.importModal.selectFile')}
            </button>
          </Upload>

          {importResults && (
            <Alert
              message={t('sites.importModal.importResults', { imported: importResults.imported, failed: importResults.failed })}
              type={importResults.failed > 0 ? 'warning' : 'success'}
              showIcon
              description={
                importResults.failed > 0 && (
                  <div style={{ maxHeight: 150, overflow: 'auto', marginTop: 8 }}>
                    {importResults.results.failed.map((fail, idx) => (
                      <div key={idx} style={{ fontSize: 12 }}>
                        {fail.siteId}: {fail.error}
                      </div>
                    ))}
                  </div>
                )
              }
            />
          )}
        </Modal>

        {/* Detail Modal */}
        <Modal
          title={t('sites.detailModal.title')}
          open={isDetailModalVisible}
          onCancel={() => {
            setIsDetailModalVisible(false);
            setSelectedSite(null);
          }}
          footer={null}
          width={700}
          className="simple-modal"
        >
          {selectedSite && (
            <div className="site-details">
              <div className="detail-section">
                <h4>{t('sites.detailModal.basicInfo')}</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>{t('sites.detailModal.siteId')}</label>
                    <span>{selectedSite.siteId}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('sites.detailModal.siteName')}</label>
                    <span>{selectedSite.siteName}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('sites.detailModal.priority')}</label>
                    <span className="priority-badge">{selectedSite.priority}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('sites.detailModal.status')}</label>
                    <span className={`status-badge ${selectedSite.isActive ? 'active' : 'inactive'}`}>
                      {selectedSite.isActive ? t('sites.status.active') : t('sites.status.inactive')}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>{t('sites.detailModal.type')}</label>
                    <Tag color="blue">{t(`sites.types.${selectedSite.siteType}`)}</Tag>
                  </div>
                  <div className="detail-item">
                    <label>{t('sites.detailModal.location')}</label>
                    <span>{selectedSite.location || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>{t('sites.detailModal.planningData')}</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>{t('sites.detailModal.backfillTonnes')}</label>
                    <span>{selectedSite.totalBackfillTonnes}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('sites.detailModal.planMeters')}</label>
                    <span>{selectedSite.totalPlanMeters}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('sites.detailModal.remoteTonnes')}</label>
                    <span>{selectedSite.remoteTonnes}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('sites.detailModal.firings')}</label>
                    <span>{selectedSite.firings}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('sites.detailModal.width')}</label>
                    <span>{selectedSite.width}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('sites.detailModal.height')}</label>
                    <span>{selectedSite.height}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('sites.detailModal.currentTask')}</label>
                    <span>{selectedSite.currentTask || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('sites.detailModal.timeToComplete')}</label>
                    <span>{selectedSite.timeToComplete} {t('sites.detailModal.hours')}</span>
                  </div>
                </div>
              </div>

              {selectedSite.notes && (
                <div className="detail-section">
                  <h4>{t('sites.detailModal.notes')}</h4>
                  <p>{selectedSite.notes}</p>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Sites;

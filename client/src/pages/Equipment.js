import React, { useState, useEffect } from 'react';
import { Table, Modal, Form, Input, InputNumber, Select, notification, Tabs, Upload, Alert, Tag, DatePicker, Badge } from 'antd';
import { useTranslation } from 'react-i18next';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, UploadOutlined, DownloadOutlined, EyeOutlined, ToolOutlined, HistoryOutlined, AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import moment from 'moment';
import DashboardLayout from '../components/DashboardLayout';
import MaintenanceGrid from '../components/MaintenanceGrid';
import config from '../config/config';
import './Equipment.css';

const { Option } = Select;
const { TextArea } = Input;

const Equipment = () => {
  const { t } = useTranslation();
  const [equipment, setEquipment] = useState([]);
  const [sites, setSites] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isMaintenanceModalVisible, setIsMaintenanceModalVisible] = useState(false);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [deletingEquipment, setDeletingEquipment] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [form] = Form.useForm();
  const [maintenanceForm] = Form.useForm();

  useEffect(() => {
    fetchEquipment();
    fetchSites();
    fetchTasks();
    fetchEquipmentTypes();
  }, []);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/equipment`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setEquipment(data.data.equipment);
      } else {
        notification.error({
          message: t('equipment.messages.error'),
          description: data.message || t('equipment.messages.fetchError'),
        });
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
      notification.error({
        message: t('equipment.messages.networkError'),
        description: t('equipment.messages.fetchError'),
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
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
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
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

  const fetchEquipmentTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/equipment-types`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setEquipmentTypes(data.data.equipmentTypes.filter(t => t.isActive));
      }
    } catch (error) {
      console.error('Error fetching equipment types:', error);
    }
  };

  const handleCreateEquipment = () => {
    setEditingEquipment(null);
    form.resetFields();
    form.setFieldsValue({ 
      status: 'operational',
      type: equipmentTypes.length > 0 ? equipmentTypes[0].name : '',
      maintenanceInterval: 500,
      operatingHours: 0,
      isActive: true
    });
    setIsModalVisible(true);
  };

  const handleEditEquipment = (equipment) => {
    setEditingEquipment(equipment);
    form.setFieldsValue({
      equipmentId: equipment.equipmentId,
      name: equipment.name,
      type: equipment.type,
      status: equipment.status,
      location: equipment.location,
      manufacturer: equipment.manufacturer,
      model: equipment.model,
      year: equipment.year,
      capacity: equipment.capacity,
      serialNumber: equipment.serialNumber,
      lastMaintenance: equipment.lastMaintenance ? moment(equipment.lastMaintenance) : null,
      nextMaintenance: equipment.nextMaintenance ? moment(equipment.nextMaintenance) : null,
      maintenanceInterval: equipment.maintenanceInterval,
      operatingHours: equipment.operatingHours,
      assignedTasks: equipment.assignedTasks || [],
      notes: equipment.notes
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem('token');

      // Convert dates to ISO strings
      if (values.lastMaintenance) {
        values.lastMaintenance = values.lastMaintenance.toISOString();
      }
      if (values.nextMaintenance) {
        values.nextMaintenance = values.nextMaintenance.toISOString();
      }

      if (editingEquipment) {
        // Update equipment
        const response = await fetch(`${config.apiUrl}/equipment/${editingEquipment._id}`, {
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
            message: t('equipment.messages.success'),
            description: t('equipment.messages.updateSuccess'),
          });
          fetchEquipment();
        } else {
          notification.error({
            message: t('equipment.messages.error'),
            description: data.message || t('equipment.messages.updateError'),
          });
        }
      } else {
        // Create new equipment
        const response = await fetch(`${config.apiUrl}/equipment`, {
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
            message: t('equipment.messages.success'),
            description: t('equipment.messages.createSuccess'),
          });
          fetchEquipment();
        } else {
          notification.error({
            message: t('equipment.messages.error'),
            description: data.message || t('equipment.messages.createError'),
          });
        }
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const showDeleteConfirm = (equipment) => {
    setDeletingEquipment(equipment);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteEquipment = async () => {
    if (!deletingEquipment) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/equipment/${deletingEquipment._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        notification.success({
          message: t('equipment.messages.success'),
          description: t('equipment.messages.deleteSuccess'),
        });
        fetchEquipment();
      } else {
        notification.error({
          message: t('equipment.messages.error'),
          description: data.message || t('equipment.messages.deleteError'),
        });
      }
    } catch (error) {
      console.error('Error deleting equipment:', error);
      notification.error({
        message: t('equipment.messages.networkError'),
        description: t('equipment.messages.deleteError'),
      });
    } finally {
      setIsDeleteModalVisible(false);
      setDeletingEquipment(null);
    }
  };

  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) {
      notification.warning({
        message: t('common.warning', 'Warning'),
        description: t('equipment.messages.noEquipmentSelected', 'Please select equipment to delete'),
      });
      return;
    }

    Modal.confirm({
      title: t('equipment.bulkDelete.title', 'Delete Selected Equipment'),
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          <p>{t('equipment.bulkDelete.message', 'Are you sure you want to delete')} <strong>{selectedRowKeys.length}</strong> {t('equipment.bulkDelete.equipment', 'equipment')}?</p>
          <p style={{ color: '#ff4d4f', marginTop: '8px' }}>{t('equipment.bulkDelete.warning', 'This action cannot be undone. All maintenance history will also be deleted.')}</p>
        </div>
      ),
      okText: t('common.delete', 'Delete'),
      okType: 'danger',
      cancelText: t('common.cancel', 'Cancel'),
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          const deletePromises = selectedRowKeys.map(equipmentId =>
            fetch(`${config.apiUrl}/equipment/${equipmentId}`, {
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
              message: t('equipment.messages.success'),
              description: t('equipment.bulkDelete.successMessage', {
                defaultValue: `Successfully deleted ${successCount} equipment`,
                count: successCount
              }),
            });
          }

          if (failCount > 0) {
            notification.error({
              message: t('equipment.messages.error'),
              description: t('equipment.bulkDelete.failMessage', {
                defaultValue: `Failed to delete ${failCount} equipment`,
                count: failCount
              }),
            });
          }

          setSelectedRowKeys([]);
          fetchEquipment();
        } catch (error) {
          console.error('Error bulk deleting equipment:', error);
          notification.error({
            message: t('equipment.messages.networkError'),
            description: t('equipment.messages.deleteError'),
          });
        }
      },
    });
  };

  const showMaintenanceModal = (equipment) => {
    setSelectedEquipment(equipment);
    maintenanceForm.resetFields();
    maintenanceForm.setFieldsValue({
      maintenanceType: 'scheduled',
      performedDate: moment(),
      laborCost: 0,
      partsCost: 0,
      duration: 0
    });
    setIsMaintenanceModalVisible(true);
  };

  const handleMaintenanceSubmit = async () => {
    try {
      const values = await maintenanceForm.validateFields();
      const token = localStorage.getItem('token');

      // Convert date to ISO string
      if (values.performedDate) {
        values.performedDate = values.performedDate.toISOString();
      }
      if (values.nextDue) {
        values.nextDue = values.nextDue.toISOString();
      }

      const response = await fetch(`${config.apiUrl}/equipment/${selectedEquipment._id}/maintenance`, {
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
          message: t('equipment.messages.success'),
          description: t('equipment.messages.maintenanceSuccess'),
        });
        fetchEquipment();
        setIsMaintenanceModalVisible(false);
        maintenanceForm.resetFields();
      } else {
        notification.error({
          message: t('equipment.messages.error'),
          description: data.message || t('equipment.messages.maintenanceError'),
        });
      }
    } catch (error) {
      console.error('Error logging maintenance:', error);
    }
  };

  const showMaintenanceHistory = async (equipment) => {
    setSelectedEquipment(equipment);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/equipment/${equipment._id}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setMaintenanceHistory(data.data.history);
        setIsHistoryModalVisible(true);
      } else {
        notification.error({
          message: t('equipment.messages.error'),
          description: data.message || t('equipment.messages.historyError'),
        });
      }
    } catch (error) {
      console.error('Error fetching maintenance history:', error);
      notification.error({
        message: t('equipment.messages.networkError'),
        description: t('equipment.messages.historyError'),
      });
    }
  };

  const showDetailModal = (equipment) => {
    setSelectedEquipment(equipment);
    setIsDetailModalVisible(true);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        equipmentId: 'EQ-001',
        name: 'Excavator EX-001',
        type: 'Excavator',
        status: 'operational',
        location: 'Site A',
        manufacturer: 'Caterpillar',
        model: '320D',
        year: 2020,
        capacity: '20 ton',
        serialNumber: 'CAT12345',
        maintenanceInterval: 500,
        operatingHours: 100,
        assignedTasks: 'DRI,CHP',
        notes: 'Example equipment'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Equipment Template');
    XLSX.writeFile(workbook, 'equipment_template.xlsx');
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/equipment/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        const worksheet = XLSX.utils.json_to_sheet(data.data.equipment);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Equipment');
        XLSX.writeFile(workbook, 'equipment_export.xlsx');
        notification.success({
          message: t('equipment.messages.success'),
          description: t('equipment.messages.exportSuccess'),
        });
      }
    } catch (error) {
      console.error('Error exporting equipment:', error);
      notification.error({
        message: t('equipment.messages.error'),
        description: t('equipment.messages.exportError'),
      });
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      notification.error({
        message: t('equipment.messages.error'),
        description: t('equipment.messages.selectFileError'),
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

        // Process assignedTasks (convert comma-separated string to array)
        jsonData.forEach(item => {
          if (item.assignedTasks && typeof item.assignedTasks === 'string') {
            item.assignedTasks = item.assignedTasks.split(',').map(t => t.trim());
          }
        });

        const token = localStorage.getItem('token');
        const response = await fetch(`${config.apiUrl}/equipment/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ equipment: jsonData }),
        });
        const result = await response.json();

        if (response.ok && result.status === 'success') {
          setImportResults(result.data);
          notification.success({
            message: t('equipment.messages.importComplete'),
            description: t('equipment.messages.importSuccess', { count: result.data.imported }),
          });
          fetchEquipment();
        } else {
          notification.error({
            message: t('equipment.messages.error'),
            description: result.message || t('equipment.messages.importError'),
          });
        }
      };
      reader.readAsArrayBuffer(importFile);
    } catch (error) {
      console.error('Error importing equipment:', error);
      notification.error({
        message: t('equipment.messages.error'),
        description: t('equipment.messages.importError'),
      });
    } finally {
      setImporting(false);
    }
  };

  const getMaintenanceBadge = (equipment) => {
    if (!equipment.nextMaintenance) return null;
    
    const now = new Date();
    const nextMaintenance = new Date(equipment.nextMaintenance);
    const daysUntil = Math.ceil((nextMaintenance - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) {
      return <Badge count={t('equipment.badges.overdue')} style={{ backgroundColor: '#ff4d4f' }} />;
    } else if (daysUntil <= 7) {
      return <Badge count={t('equipment.badges.dueSoon')} style={{ backgroundColor: '#faad14' }} />;
    }
    return null;
  };

  const columns = [
    {
      title: t('equipment.columns.id'),
      dataIndex: 'equipmentId',
      key: 'equipmentId',
      sorter: (a, b) => a.equipmentId.localeCompare(b.equipmentId),
    },
    {
      title: t('equipment.columns.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t('equipment.columns.type'),
      dataIndex: 'type',
      key: 'type',
      filters: equipmentTypes.map(type => ({ text: type.name, value: type.name })),
      onFilter: (value, record) => record.type === value,
      render: (type) => (
        <Tag color="blue">{type}</Tag>
      ),
    },
    {
      title: t('equipment.columns.status'),
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: t('equipment.status.operational'), value: 'operational' },
        { text: t('equipment.status.maintenance'), value: 'maintenance' },
        { text: t('equipment.status.outOfService'), value: 'out-of-service' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <span className={`status-badge ${status}`}>
          {status === 'operational' ? t('equipment.status.operational') : 
           status === 'maintenance' ? t('equipment.status.maintenance') : 
           t('equipment.status.outOfService')}
        </span>
      ),
    },
    {
      title: t('equipment.columns.location'),
      dataIndex: 'location',
      key: 'location',
      render: (location) => location || '-',
    },
    {
      title: t('equipment.columns.tasks'),
      dataIndex: 'assignedTasks',
      key: 'assignedTasks',
      render: (tasks) => tasks && tasks.length > 0 ? (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {tasks.slice(0, 2).map((task, idx) => (
            <Tag key={idx} color="green" style={{ margin: 0 }}>{task}</Tag>
          ))}
          {tasks.length > 2 && <Tag style={{ margin: 0 }}>+{tasks.length - 2}</Tag>}
        </div>
      ) : '-',
    },
    {
      title: t('equipment.columns.maintenance'),
      key: 'maintenance',
      render: (_, record) => (
        <div>
          {record.lastMaintenance ? (
            <div style={{ fontSize: 12 }}>
              <div>{t('equipment.labels.last')}: {moment(record.lastMaintenance).format('MMM D, YYYY')}</div>
              {record.nextMaintenance && (
                <div>{t('equipment.labels.next')}: {moment(record.nextMaintenance).format('MMM D, YYYY')}</div>
              )}
              {getMaintenanceBadge(record)}
            </div>
          ) : '-'}
        </div>
      ),
    },
    {
      title: t('equipment.columns.actions'),
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <div className="action-buttons">
          <button className="icon-btn" onClick={() => showDetailModal(record)} title={t('equipment.tooltips.viewDetails')}>
            <EyeOutlined />
          </button>
          <button className="icon-btn" onClick={() => showMaintenanceModal(record)} title={t('equipment.tooltips.logMaintenance')}>
            <ToolOutlined />
          </button>
          <button className="icon-btn" onClick={() => showMaintenanceHistory(record)} title={t('equipment.tooltips.viewHistory')}>
            <HistoryOutlined />
          </button>
          <button className="icon-btn" onClick={() => handleEditEquipment(record)}>
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

  const historyColumns = [
    {
      title: t('equipment.historyColumns.date'),
      dataIndex: 'performedDate',
      key: 'performedDate',
      render: (date) => moment(date).format('MMM D, YYYY'),
    },
    {
      title: t('equipment.historyColumns.type'),
      dataIndex: 'maintenanceType',
      key: 'maintenanceType',
      render: (type) => (
        <Tag color={
          type === 'scheduled' ? 'blue' :
          type === 'emergency' ? 'red' :
          type === 'inspection' ? 'orange' : 'default'
        }>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: t('equipment.historyColumns.description'),
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: t('equipment.historyColumns.performedBy'),
      dataIndex: 'performedBy',
      key: 'performedBy',
      render: (by) => by || '-',
    },
    {
      title: t('equipment.historyColumns.labor'),
      dataIndex: 'laborCost',
      key: 'laborCost',
      render: (cost) => cost ? `$${cost.toFixed(2)}` : '-',
      width: 100,
    },
    {
      title: t('equipment.historyColumns.parts'),
      dataIndex: 'partsCost',
      key: 'partsCost',
      render: (cost) => cost ? `$${cost.toFixed(2)}` : '-',
      width: 100,
    },
    {
      title: t('equipment.historyColumns.total'),
      dataIndex: 'cost',
      key: 'cost',
      render: (cost) => cost ? `$${cost.toFixed(2)}` : '-',
      width: 100,
    },
    {
      title: t('equipment.historyColumns.duration'),
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => duration ? `${duration}h` : '-',
    },
  ];

  return (
    <DashboardLayout
      title={t('equipment.title')}
      subtitle={t('equipment.subtitle')}
      page="equipment"
    >
      <div className="equipment-page">
        <div className="page-header">
          <div className="header-actions">
            <button className="btn-secondary" onClick={handleDownloadTemplate}>
              <DownloadOutlined /> {t('equipment.template')}
            </button>
            <button className="btn-secondary" onClick={() => setIsImportModalVisible(true)}>
              <UploadOutlined /> {t('equipment.import')}
            </button>
            <button className="btn-secondary" onClick={handleExport}>
              <DownloadOutlined /> {t('equipment.export')}
            </button>
            <button className="btn-primary" onClick={handleCreateEquipment}>
              <PlusOutlined /> {t('equipment.newEquipment')}
            </button>
          </div>
        </div>

        <Tabs
          defaultActiveKey="list"
          size="large"
          style={{ marginTop: 16 }}
          items={[
            {
              key: 'list',
              label: (
                <span>
                  <UnorderedListOutlined /> {t('equipment.tabs.equipmentList')}
                </span>
              ),
              children: (
                <div>
                  {selectedRowKeys.length > 0 && (
                    <div style={{ marginBottom: '16px', padding: '12px', background: '#fff7e6', borderRadius: '8px', border: '1px solid #ffd591' }}>
                      <span style={{ marginRight: '12px', fontWeight: 500 }}>
                        {selectedRowKeys.length} {t('equipment.bulkDelete.selected', 'equipment selected')}
                      </span>
                      <button 
                        className="btn-danger" 
                        onClick={handleBulkDelete}
                        style={{ background: '#ff4d4f', border: 'none', color: 'white', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <DeleteOutlined /> {t('equipment.bulkDelete.deleteSelected', 'Delete Selected')}
                      </button>
                    </div>
                  )}
                  <div className="table-container">
                    <Table
                      columns={columns}
                      dataSource={equipment}
                      loading={loading}
                      rowKey="_id"
                      rowSelection={{
                        selectedRowKeys,
                        onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
                        preserveSelectedRowKeys: true,
                      }}
                      pagination={{
                        pageSize: 15,
                        showSizeChanger: false,
                        simple: false,
                      }}
                    />
                  </div>
                </div>
              )
            },
            {
              key: 'schedule',
              label: (
                <span>
                  <AppstoreOutlined /> {t('equipment.tabs.usageSchedule')}
                </span>
              ),
              children: (
                <div style={{ padding: '16px 0', maxWidth: '100%' }}>
                  <Alert
                    message={t('equipment.usageSchedule.title')}
                    description={t('equipment.usageSchedule.description')}
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <MaintenanceGrid equipment={equipment} />
                </div>
              )
            }
          ]}
        />

        {/* Create/Edit Modal */}
        <Modal
          title={editingEquipment ? t('equipment.editEquipment') : t('equipment.newEquipment')}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
          }}
          okText={editingEquipment ? t('equipment.save') : t('equipment.create')}
          cancelText={t('equipment.cancel')}
          width={700}
          className="simple-modal"
        >
          <Form form={form} layout="vertical">
            <Tabs defaultActiveKey="1">
              <Tabs.TabPane tab={t('equipment.formTabs.basicInfo')} key="1">
                <Form.Item
                  label={t('equipment.form.equipmentId')}
                  name="equipmentId"
                  rules={[{ required: true, message: t('equipment.form.required') }]}
                >
                  <Input placeholder={t('equipment.form.equipmentIdPlaceholder')} disabled={editingEquipment} />
                </Form.Item>

                <Form.Item
                  label={t('equipment.form.name')}
                  name="name"
                  rules={[{ required: true, message: t('equipment.form.required') }]}
                >
                  <Input placeholder={t('equipment.form.namePlaceholder')} />
                </Form.Item>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <Form.Item
                    label={t('equipment.form.type')}
                    name="type"
                    rules={[{ required: true, message: t('equipment.form.required') }]}
                    style={{ flex: 1 }}
                  >
                    <Select placeholder={t('equipment.form.selectType')} showSearch>
                      {equipmentTypes.map(type => (
                        <Option key={type._id} value={type.name}>
                          {type.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    label={t('equipment.form.status')}
                    name="status"
                    rules={[{ required: true, message: t('equipment.form.required') }]}
                    style={{ flex: 1 }}
                  >
                    <Select>
                      <Option value="operational">{t('equipment.status.operational')}</Option>
                      <Option value="maintenance">{t('equipment.status.maintenance')}</Option>
                      <Option value="out-of-service">{t('equipment.status.outOfService')}</Option>
                    </Select>
                  </Form.Item>
                </div>

                <Form.Item
                  label={t('equipment.form.location')}
                  name="location"
                >
                  <Select placeholder={t('equipment.form.selectLocation')} allowClear showSearch>
                    {sites.map(site => (
                      <Option key={site._id} value={site.location || site.siteName}>
                        {site.siteId} - {site.siteName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Tabs.TabPane>

              <Tabs.TabPane tab={t('equipment.formTabs.specifications')} key="2">
                <Form.Item label={t('equipment.form.manufacturer')} name="manufacturer">
                  <Input placeholder={t('equipment.form.manufacturerPlaceholder')} />
                </Form.Item>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <Form.Item label={t('equipment.form.model')} name="model" style={{ flex: 1 }}>
                    <Input placeholder={t('equipment.form.modelPlaceholder')} />
                  </Form.Item>

                  <Form.Item label={t('equipment.form.year')} name="year" style={{ flex: 1 }}>
                    <InputNumber min={1900} max={2100} style={{ width: '100%' }} />
                  </Form.Item>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <Form.Item label={t('equipment.form.capacity')} name="capacity" style={{ flex: 1 }}>
                    <Input placeholder={t('equipment.form.capacityPlaceholder')} />
                  </Form.Item>

                  <Form.Item label={t('equipment.form.serialNumber')} name="serialNumber" style={{ flex: 1 }}>
                    <Input placeholder={t('equipment.form.serialNumberPlaceholder')} />
                  </Form.Item>
                </div>
              </Tabs.TabPane>

              <Tabs.TabPane tab={t('equipment.formTabs.maintenance')} key="3">
                <div style={{ display: 'flex', gap: '16px' }}>
                  <Form.Item label={t('equipment.form.lastMaintenance')} name="lastMaintenance" style={{ flex: 1 }}>
                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                  </Form.Item>

                  <Form.Item label={t('equipment.form.nextMaintenance')} name="nextMaintenance" style={{ flex: 1 }}>
                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                  </Form.Item>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <Form.Item label={t('equipment.form.maintenanceInterval')} name="maintenanceInterval" style={{ flex: 1 }}>
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item label={t('equipment.form.operatingHours')} name="operatingHours" style={{ flex: 1 }}>
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </div>
              </Tabs.TabPane>

              <Tabs.TabPane tab={t('equipment.formTabs.tasks')} key="4">
                <Form.Item
                  label={t('equipment.form.assignedTasks')}
                  name="assignedTasks"
                >
                  <Select mode="multiple" placeholder={t('equipment.form.selectTasks')} allowClear>
                    {tasks.map(task => (
                      <Option key={task._id} value={task.taskId}>
                        {task.taskId} - {task.taskName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Tabs.TabPane>

              <Tabs.TabPane tab={t('equipment.formTabs.notes')} key="5">
                <Form.Item label={t('equipment.form.notes')} name="notes">
                  <TextArea rows={6} placeholder={t('equipment.form.notesPlaceholder')} />
                </Form.Item>
              </Tabs.TabPane>
            </Tabs>
          </Form>
        </Modal>

        {/* Delete Modal */}
        <Modal
          title={t('equipment.deleteEquipment')}
          open={isDeleteModalVisible}
          onOk={handleDeleteEquipment}
          onCancel={() => {
            setIsDeleteModalVisible(false);
            setDeletingEquipment(null);
          }}
          okText={t('equipment.delete')}
          cancelText={t('equipment.cancel')}
          width={400}
          className="delete-modal"
          okButtonProps={{ danger: true }}
        >
          <div className="delete-modal-content">
            <ExclamationCircleOutlined className="delete-icon" />
            <div>
              <p className="delete-message">
                {t('equipment.deleteModal.message')} <strong>{deletingEquipment?.equipmentId}</strong>?
              </p>
              <p className="delete-warning">
                {t('equipment.deleteModal.warning')}
              </p>
            </div>
          </div>
        </Modal>

        {/* Maintenance Log Modal */}
        <Modal
          title={t('equipment.logMaintenance')}
          open={isMaintenanceModalVisible}
          onOk={handleMaintenanceSubmit}
          onCancel={() => {
            setIsMaintenanceModalVisible(false);
            maintenanceForm.resetFields();
          }}
          okText={t('equipment.logMaintenance')}
          cancelText={t('equipment.cancel')}
          width={600}
          className="simple-modal"
        >
          <Form form={maintenanceForm} layout="vertical">
            <Form.Item
              label={t('equipment.maintenanceForm.type')}
              name="maintenanceType"
              rules={[{ required: true, message: t('equipment.form.required') }]}
            >
              <Select>
                <Option value="scheduled">{t('equipment.maintenanceTypes.scheduled')}</Option>
                <Option value="unscheduled">{t('equipment.maintenanceTypes.unscheduled')}</Option>
                <Option value="emergency">{t('equipment.maintenanceTypes.emergency')}</Option>
                <Option value="inspection">{t('equipment.maintenanceTypes.inspection')}</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={t('equipment.maintenanceForm.description')}
              name="description"
              rules={[{ required: true, message: t('equipment.form.required') }]}
            >
              <TextArea rows={3} placeholder={t('equipment.maintenanceForm.descriptionPlaceholder')} />
            </Form.Item>

            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item
                label={t('equipment.maintenanceForm.performedDate')}
                name="performedDate"
                rules={[{ required: true, message: t('equipment.form.required') }]}
                style={{ flex: 1 }}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>

              <Form.Item label={t('equipment.maintenanceForm.nextDue')} name="nextDue" style={{ flex: 1 }}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item label={t('equipment.maintenanceForm.laborCost')} name="laborCost" style={{ flex: 1 }}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder={t('equipment.maintenanceForm.laborCostPlaceholder')} />
              </Form.Item>

              <Form.Item label={t('equipment.maintenanceForm.partsCost')} name="partsCost" style={{ flex: 1 }}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder={t('equipment.maintenanceForm.partsCostPlaceholder')} />
              </Form.Item>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item label={t('equipment.maintenanceForm.duration')} name="duration" style={{ flex: 1 }}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <div style={{ flex: 1 }} />
            </div>

            <Form.Item label={t('equipment.maintenanceForm.performedBy')} name="performedBy">
              <Input placeholder={t('equipment.maintenanceForm.performedByPlaceholder')} />
            </Form.Item>

            <Form.Item label={t('equipment.maintenanceForm.additionalNotes')} name="notes">
              <TextArea rows={2} placeholder={t('equipment.maintenanceForm.additionalNotesPlaceholder')} />
            </Form.Item>
          </Form>
        </Modal>

        {/* Maintenance History Modal */}
        <Modal
          title={`${t('equipment.maintenanceHistory')} - ${selectedEquipment?.equipmentId}`}
          open={isHistoryModalVisible}
          onCancel={() => {
            setIsHistoryModalVisible(false);
            setMaintenanceHistory([]);
          }}
          footer={null}
          width={900}
          className="simple-modal"
        >
          <Table
            columns={historyColumns}
            dataSource={maintenanceHistory}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
            size="small"
          />
        </Modal>

        {/* Import Modal */}
        <Modal
          title={t('equipment.importEquipment')}
          open={isImportModalVisible}
          onOk={handleImport}
          onCancel={() => {
            setIsImportModalVisible(false);
            setImportFile(null);
            setImportResults(null);
          }}
          okText={t('equipment.import')}
          cancelText={t('equipment.cancel')}
          confirmLoading={importing}
          width={500}
          className="simple-modal"
        >
          <Alert
            message={t('equipment.importModal.title')}
            description={t('equipment.importModal.description')}
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
              <UploadOutlined /> {t('equipment.importModal.selectFile')}
            </button>
          </Upload>

          {importResults && (
            <Alert
              message={t('equipment.importModal.results', { imported: importResults.imported, failed: importResults.failed })}
              type={importResults.failed > 0 ? 'warning' : 'success'}
              showIcon
              description={
                importResults.failed > 0 && (
                  <div style={{ maxHeight: 150, overflow: 'auto', marginTop: 8 }}>
                    {importResults.results.failed.map((fail, idx) => (
                      <div key={idx} style={{ fontSize: 12 }}>
                        {fail.equipmentId}: {fail.error}
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
          title={t('equipment.equipmentDetails')}
          open={isDetailModalVisible}
          onCancel={() => {
            setIsDetailModalVisible(false);
            setSelectedEquipment(null);
          }}
          footer={null}
          width={800}
          className="simple-modal"
        >
          {selectedEquipment && (
            <div className="equipment-details">
              <div className="detail-section">
                <h4>{t('equipment.detailModal.basicInfo')}</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>{t('equipment.detailModal.equipmentId')}:</label>
                    <span>{selectedEquipment.equipmentId}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('equipment.detailModal.name')}:</label>
                    <span>{selectedEquipment.name}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('equipment.detailModal.type')}:</label>
                    <Tag color="blue">{selectedEquipment.type}</Tag>
                  </div>
                  <div className="detail-item">
                    <label>{t('equipment.detailModal.status')}:</label>
                    <span className={`status-badge ${selectedEquipment.status}`}>
                      {selectedEquipment.status === 'operational' ? t('equipment.status.operational') : 
                       selectedEquipment.status === 'maintenance' ? t('equipment.status.maintenance') : 
                       t('equipment.status.outOfService')}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>{t('equipment.detailModal.location')}:</label>
                    <span>{selectedEquipment.location || '-'}</span>
                  </div>
                </div>
              </div>

              {(selectedEquipment.manufacturer || selectedEquipment.model) && (
                <div className="detail-section">
                  <h4>{t('equipment.detailModal.specifications')}</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>{t('equipment.detailModal.manufacturer')}:</label>
                      <span>{selectedEquipment.manufacturer || '-'}</span>
                    </div>
                    <div className="detail-item">
                      <label>{t('equipment.detailModal.model')}:</label>
                      <span>{selectedEquipment.model || '-'}</span>
                    </div>
                    <div className="detail-item">
                      <label>{t('equipment.detailModal.year')}:</label>
                      <span>{selectedEquipment.year || '-'}</span>
                    </div>
                    <div className="detail-item">
                      <label>{t('equipment.detailModal.capacity')}:</label>
                      <span>{selectedEquipment.capacity || '-'}</span>
                    </div>
                    <div className="detail-item">
                      <label>{t('equipment.detailModal.serialNumber')}:</label>
                      <span>{selectedEquipment.serialNumber || '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h4>{t('equipment.detailModal.maintenanceInfo')}</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>{t('equipment.detailModal.lastMaintenance')}:</label>
                    <span>{selectedEquipment.lastMaintenance ? moment(selectedEquipment.lastMaintenance).format('MMM D, YYYY') : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('equipment.detailModal.nextMaintenance')}:</label>
                    <span>{selectedEquipment.nextMaintenance ? moment(selectedEquipment.nextMaintenance).format('MMM D, YYYY') : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('equipment.detailModal.maintenanceInterval')}:</label>
                    <span>{selectedEquipment.maintenanceInterval} {t('equipment.detailModal.hours')}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('equipment.detailModal.operatingHours')}:</label>
                    <span>{selectedEquipment.operatingHours} {t('equipment.detailModal.hours')}</span>
                  </div>
                </div>
              </div>

              {selectedEquipment.assignedTasks && selectedEquipment.assignedTasks.length > 0 && (
                <div className="detail-section">
                  <h4>{t('equipment.detailModal.assignedTasks')}</h4>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedEquipment.assignedTasks.map((task, idx) => (
                      <Tag key={idx} color="green">{task}</Tag>
                    ))}
                  </div>
                </div>
              )}

              {selectedEquipment.notes && (
                <div className="detail-section">
                  <h4>{t('equipment.detailModal.notes')}</h4>
                  <p>{selectedEquipment.notes}</p>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Equipment;

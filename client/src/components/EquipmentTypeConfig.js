import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Table, Modal, Form, Input, Switch, notification } from 'antd';
import { useTranslation } from 'react-i18next';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, 
  UploadOutlined, DownloadOutlined, ToolOutlined, CarOutlined, 
  RocketOutlined, BuildOutlined, ApiOutlined, ThunderboltOutlined,
  FireOutlined, BulbOutlined, CompassOutlined, DashboardOutlined,
  ExperimentOutlined, HeatMapOutlined, RadarChartOutlined, 
  SafetyCertificateOutlined, SettingOutlined, StockOutlined,
  TruckOutlined, CameraOutlined, BellOutlined, AlertOutlined,
  ControlOutlined, FormatPainterOutlined, GoldOutlined,
  BarcodeOutlined, BoxPlotOutlined, DeploymentUnitOutlined
} from '@ant-design/icons';
import config from '../config/config';

const { TextArea } = Input;

// Available equipment icons for selection
const EQUIPMENT_ICONS = [
  { name: 'ToolOutlined', component: ToolOutlined, label: 'Tool' },
  { name: 'CarOutlined', component: CarOutlined, label: 'Car' },
  { name: 'TruckOutlined', component: TruckOutlined, label: 'Truck' },
  { name: 'RocketOutlined', component: RocketOutlined, label: 'Rocket' },
  { name: 'BuildOutlined', component: BuildOutlined, label: 'Build' },
  { name: 'ApiOutlined', component: ApiOutlined, label: 'API' },
  { name: 'ThunderboltOutlined', component: ThunderboltOutlined, label: 'Thunder' },
  { name: 'FireOutlined', component: FireOutlined, label: 'Fire' },
  { name: 'BulbOutlined', component: BulbOutlined, label: 'Bulb' },
  { name: 'CompassOutlined', component: CompassOutlined, label: 'Compass' },
  { name: 'DashboardOutlined', component: DashboardOutlined, label: 'Dashboard' },
  { name: 'ExperimentOutlined', component: ExperimentOutlined, label: 'Experiment' },
  { name: 'HeatMapOutlined', component: HeatMapOutlined, label: 'HeatMap' },
  { name: 'RadarChartOutlined', component: RadarChartOutlined, label: 'Radar' },
  { name: 'SafetyCertificateOutlined', component: SafetyCertificateOutlined, label: 'Safety' },
  { name: 'SettingOutlined', component: SettingOutlined, label: 'Setting' },
  { name: 'StockOutlined', component: StockOutlined, label: 'Stock' },
  { name: 'CameraOutlined', component: CameraOutlined, label: 'Camera' },
  { name: 'BellOutlined', component: BellOutlined, label: 'Bell' },
  { name: 'AlertOutlined', component: AlertOutlined, label: 'Alert' },
  { name: 'ControlOutlined', component: ControlOutlined, label: 'Control' },
  { name: 'FormatPainterOutlined', component: FormatPainterOutlined, label: 'Paint' },
  { name: 'GoldOutlined', component: GoldOutlined, label: 'Gold' },
  { name: 'BarcodeOutlined', component: BarcodeOutlined, label: 'Barcode' },
  { name: 'BoxPlotOutlined', component: BoxPlotOutlined, label: 'BoxPlot' },
  { name: 'DeploymentUnitOutlined', component: DeploymentUnitOutlined, label: 'Deploy' }
];

const EquipmentTypeConfig = () => {
  const { t } = useTranslation();
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [deletingType, setDeletingType] = useState(null);
  const [selectedIcon, setSelectedIcon] = useState('');
  const [form] = Form.useForm();
  const fileInputRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchEquipmentTypes();
  }, []);

  const fetchEquipmentTypes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/equipment-types`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setEquipmentTypes(data.data.equipmentTypes);
      } else {
        notification.error({
          message: t('settings.equipmentTypeConfig.error'),
          description: data.message || t('settings.equipmentTypeConfig.fetchError'),
        });
      }
    } catch (error) {
      console.error('Error fetching equipment types:', error);
      notification.error({
        message: t('settings.equipmentTypeConfig.networkError'),
        description: t('settings.equipmentTypeConfig.fetchError'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateType = () => {
    if (!isAdmin) {
      notification.warning({
        message: t('settings.equipmentTypeConfig.permissionDenied'),
        description: t('settings.equipmentTypeConfig.adminOnlyCreate'),
      });
      return;
    }
    setEditingType(null);
    setSelectedIcon('');
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditType = (type) => {
    if (!isAdmin) {
      notification.warning({
        message: t('settings.equipmentTypeConfig.permissionDenied'),
        description: t('settings.equipmentTypeConfig.adminOnlyEdit'),
      });
      return;
    }
    setEditingType(type);
    setSelectedIcon(type.icon || '');
    form.setFieldsValue({
      name: type.name,
      description: type.description,
      icon: type.icon,
      isActive: type.isActive
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      // Use selected icon from picker
      values.icon = selectedIcon;
      const token = localStorage.getItem('token');

      if (editingType) {
        const response = await fetch(`${config.apiUrl}/equipment-types/${editingType._id}`, {
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
            message: t('settings.equipmentTypeConfig.success'),
            description: t('settings.equipmentTypeConfig.updateSuccess'),
          });
          fetchEquipmentTypes();
        } else {
          notification.error({
            message: t('settings.equipmentTypeConfig.error'),
            description: data.message || t('settings.equipmentTypeConfig.updateError'),
          });
        }
      } else {
        const response = await fetch(`${config.apiUrl}/equipment-types`, {
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
            message: t('settings.equipmentTypeConfig.success'),
            description: t('settings.equipmentTypeConfig.createSuccess'),
          });
          fetchEquipmentTypes();
        } else {
          notification.error({
            message: t('settings.equipmentTypeConfig.error'),
            description: data.message || t('settings.equipmentTypeConfig.createError'),
          });
        }
      }

      setIsModalVisible(false);
      setSelectedIcon('');
      form.resetFields();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const showDeleteConfirm = (type) => {
    if (!isAdmin) {
      notification.warning({
        message: t('settings.equipmentTypeConfig.permissionDenied'),
        description: t('settings.equipmentTypeConfig.adminOnlyDelete'),
      });
      return;
    }
    setDeletingType(type);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteType = async () => {
    if (!deletingType) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/equipment-types/${deletingType._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        notification.success({
          message: t('settings.equipmentTypeConfig.success'),
          description: t('settings.equipmentTypeConfig.deleteSuccess'),
        });
        fetchEquipmentTypes();
      } else {
        notification.error({
          message: t('settings.equipmentTypeConfig.error'),
          description: data.message || t('settings.equipmentTypeConfig.deleteError'),
        });
      }
    } catch (error) {
      console.error('Error deleting equipment type:', error);
      notification.error({
        message: t('settings.equipmentTypeConfig.networkError'),
        description: t('settings.equipmentTypeConfig.deleteError'),
      });
    } finally {
      setIsDeleteModalVisible(false);
      setDeletingType(null);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/equipment-types/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        notification.success({
          message: t('settings.equipmentTypeConfig.importSuccess'),
          description: data.message,
          duration: 5,
        });
        fetchEquipmentTypes();
      } else {
        notification.error({
          message: t('settings.equipmentTypeConfig.importFailed'),
          description: data.message || t('settings.equipmentTypeConfig.importError'),
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      notification.error({
        message: t('settings.equipmentTypeConfig.importError'),
        description: t('settings.equipmentTypeConfig.importErrorOccurred'),
      });
    }

    event.target.value = '';
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/equipment-types/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'equipment_types_export.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        notification.success({
          message: t('settings.equipmentTypeConfig.exportSuccess'),
          description: t('settings.equipmentTypeConfig.exportSuccessDesc'),
        });
      } else {
        notification.error({
          message: t('settings.equipmentTypeConfig.exportFailed'),
          description: t('settings.equipmentTypeConfig.exportError'),
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      notification.error({
        message: t('settings.equipmentTypeConfig.exportError'),
        description: t('settings.equipmentTypeConfig.exportErrorOccurred'),
      });
    }
  };

  const columns = useMemo(() => [
    {
      title: t('settings.equipmentTypeConfig.columnTypeName'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t('settings.equipmentTypeConfig.columnDescription'),
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || '-',
    },
    {
      title: t('settings.equipmentTypeConfig.columnIcon'),
      dataIndex: 'icon',
      key: 'icon',
      render: (iconName) => {
        if (!iconName) return '-';
        const iconObj = EQUIPMENT_ICONS.find(i => i.name === iconName);
        if (iconObj) {
          const IconComponent = iconObj.component;
          return <IconComponent style={{ fontSize: '18px', color: '#1890ff' }} />;
        }
        return iconName;
      },
    },
    {
      title: t('settings.equipmentTypeConfig.columnStatus'),
      dataIndex: 'isActive',
      key: 'isActive',
      filters: [
        { text: t('settings.equipmentTypeConfig.active'), value: true },
        { text: t('settings.equipmentTypeConfig.inactive'), value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
      render: (isActive) => (
        <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
          {isActive ? t('settings.equipmentTypeConfig.active') : t('settings.equipmentTypeConfig.inactive')}
        </span>
      ),
    },
    {
      title: t('settings.equipmentTypeConfig.columnCreatedBy'),
      dataIndex: 'createdBy',
      key: 'createdBy',
      render: (createdBy) => createdBy?.name || '-',
    },
    {
      title: t('settings.equipmentTypeConfig.columnActions'),
      key: 'actions',
      align: 'center',
      width: 100,
      render: (_, record) => (
        <div className="action-buttons">
          <button 
            className="icon-btn" 
            onClick={() => handleEditType(record)}
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
  ], [t, isAdmin]);

  return (
    <div>
      <div className="uom-actions">
        <button 
          className="btn-primary" 
          onClick={handleCreateType}
          disabled={!isAdmin}
          style={{ opacity: isAdmin ? 1 : 0.7, cursor: isAdmin ? 'pointer' : 'not-allowed' }}
        >
          <PlusOutlined /> {t('settings.equipmentTypeConfig.newEquipmentType')}
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
          <UploadOutlined /> {t('settings.equipmentTypeConfig.import')}
        </button>
        <button className="btn-secondary" onClick={handleExport}>
          <DownloadOutlined /> {t('settings.equipmentTypeConfig.export')}
        </button>
        {!isAdmin && (
          <span style={{ marginLeft: '10px', color: '#999', fontSize: '12px' }}>
            {t('settings.equipmentTypeConfig.adminRequired')}
          </span>
        )}
      </div>

      <div className="uom-table-container">
        <Table
          columns={columns}
          dataSource={equipmentTypes}
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
        title={editingType ? t('settings.equipmentTypeConfig.editEquipmentType') : t('settings.equipmentTypeConfig.newEquipmentType')}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedIcon('');
          form.resetFields();
        }}
        okText={editingType ? t('settings.equipmentTypeConfig.save') : t('settings.equipmentTypeConfig.create')}
        cancelText={t('settings.equipmentTypeConfig.cancel')}
        width={500}
        className="simple-modal"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={t('settings.equipmentTypeConfig.typeName')}
            name="name"
            rules={[{ required: true, message: t('settings.equipmentTypeConfig.required') }]}
          >
            <Input placeholder={t('settings.equipmentTypeConfig.typeNamePlaceholder')} />
          </Form.Item>

          <Form.Item
            label={t('settings.equipmentTypeConfig.description')}
            name="description"
          >
            <TextArea 
              rows={3}
              placeholder={t('settings.equipmentTypeConfig.descriptionPlaceholder')} 
            />
          </Form.Item>

          <Form.Item
            label={t('settings.equipmentTypeConfig.icon')}
            name="icon"
          >
            <div className="icon-picker">
              <div className="icon-picker-label">{t('settings.equipmentTypeConfig.iconPickerLabel')}</div>
              <div className="icon-picker-grid">
                {EQUIPMENT_ICONS.map((icon) => {
                  const IconComponent = icon.component;
                  return (
                    <div
                      key={icon.name}
                      className={`icon-picker-item ${
                        selectedIcon === icon.name ? 'selected' : ''
                      }`}
                      onClick={() => {
                        setSelectedIcon(icon.name);
                        form.setFieldsValue({ icon: icon.name });
                      }}
                      title={icon.label}
                    >
                      <IconComponent />
                      <span className="icon-picker-label-small">{icon.label}</span>
                    </div>
                  );
                })}
              </div>
              {selectedIcon && (
                <div className="icon-picker-selected">
                  {t('settings.equipmentTypeConfig.iconSelected')} <strong>{EQUIPMENT_ICONS.find(i => i.name === selectedIcon)?.label || selectedIcon}</strong>
                </div>
              )}
            </div>
          </Form.Item>

          {editingType && (
            <Form.Item
              label={t('settings.equipmentTypeConfig.status')}
              name="isActive"
              valuePropName="checked"
            >
              <Switch 
                checkedChildren={t('settings.equipmentTypeConfig.active')} 
                unCheckedChildren={t('settings.equipmentTypeConfig.inactive')}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title={t('settings.equipmentTypeConfig.deleteEquipmentType')}
        open={isDeleteModalVisible}
        onOk={handleDeleteType}
        onCancel={() => {
          setIsDeleteModalVisible(false);
          setDeletingType(null);
        }}
        okText={t('settings.equipmentTypeConfig.delete')}
        cancelText={t('settings.equipmentTypeConfig.cancel')}
        width={400}
        className="delete-modal"
        okButtonProps={{ danger: true }}
      >
        <div className="delete-modal-content">
          <ExclamationCircleOutlined className="delete-icon" />
          <div>
            <p className="delete-message">
              {t('settings.equipmentTypeConfig.deleteConfirm', { name: deletingType?.name })}
            </p>
            <p className="delete-warning">
              {t('settings.equipmentTypeConfig.deleteWarning')}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EquipmentTypeConfig;

import React, { useState, useEffect, useRef } from 'react';
import { Table, Modal, Form, Input, Switch, notification } from 'antd';
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
          message: 'Error',
          description: data.message || 'Failed to fetch equipment types',
        });
      }
    } catch (error) {
      console.error('Error fetching equipment types:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to fetch equipment types',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateType = () => {
    if (!isAdmin) {
      notification.warning({
        message: 'Permission Denied',
        description: 'Only administrators can create equipment types',
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
        message: 'Permission Denied',
        description: 'Only administrators can edit equipment types',
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
            message: 'Success',
            description: 'Equipment type updated successfully',
          });
          fetchEquipmentTypes();
        } else {
          notification.error({
            message: 'Error',
            description: data.message || 'Failed to update equipment type',
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
            message: 'Success',
            description: 'Equipment type created successfully',
          });
          fetchEquipmentTypes();
        } else {
          notification.error({
            message: 'Error',
            description: data.message || 'Failed to create equipment type',
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
        message: 'Permission Denied',
        description: 'Only administrators can delete equipment types',
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
          message: 'Success',
          description: 'Equipment type deleted successfully',
        });
        fetchEquipmentTypes();
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to delete equipment type',
        });
      }
    } catch (error) {
      console.error('Error deleting equipment type:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to delete equipment type',
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
          message: 'Import Successful',
          description: data.message,
          duration: 5,
        });
        fetchEquipmentTypes();
      } else {
        notification.error({
          message: 'Import Failed',
          description: data.message || 'Failed to import equipment types',
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      notification.error({
        message: 'Import Error',
        description: 'An error occurred during import',
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
          message: 'Export Successful',
          description: 'Equipment types exported successfully',
        });
      } else {
        notification.error({
          message: 'Export Failed',
          description: 'Failed to export equipment types',
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
      title: 'TYPE NAME',
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
      title: 'ICON',
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
      title: 'STATUS',
      dataIndex: 'isActive',
      key: 'isActive',
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
      render: (isActive) => (
        <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
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
  ];

  return (
    <div>
      <div className="uom-actions">
        <button 
          className="btn-primary" 
          onClick={handleCreateType}
          disabled={!isAdmin}
          style={{ opacity: isAdmin ? 1 : 0.7, cursor: isAdmin ? 'pointer' : 'not-allowed' }}
        >
          <PlusOutlined /> New Equipment Type
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
          <UploadOutlined /> Import
        </button>
        <button className="btn-secondary" onClick={handleExport}>
          <DownloadOutlined /> Export
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
        title={editingType ? 'Edit Equipment Type' : 'New Equipment Type'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedIcon('');
          form.resetFields();
        }}
        okText={editingType ? 'Save' : 'Create'}
        cancelText="Cancel"
        width={500}
        className="simple-modal"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Type Name"
            name="name"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="Enter equipment type name (e.g., Excavator, Drill)" />
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

          <Form.Item
            label="Icon"
            name="icon"
          >
            <div className="icon-picker">
              <div className="icon-picker-label">Select an icon for this equipment type:</div>
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
                  Selected: <strong>{EQUIPMENT_ICONS.find(i => i.name === selectedIcon)?.label || selectedIcon}</strong>
                </div>
              )}
            </div>
          </Form.Item>

          {editingType && (
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
        title="Delete Equipment Type"
        open={isDeleteModalVisible}
        onOk={handleDeleteType}
        onCancel={() => {
          setIsDeleteModalVisible(false);
          setDeletingType(null);
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
              Are you sure you want to delete <strong>{deletingType?.name}</strong>?
            </p>
            <p className="delete-warning">
              This action cannot be undone. Existing equipment using this type may be affected.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EquipmentTypeConfig;

import React, { useState, useEffect, useMemo } from 'react';
import { Table, Modal, Form, Input, Select, InputNumber, notification, ColorPicker, Upload, Alert, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, UpOutlined, DownOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';
import config from '../config/config';
import { generateTaskColor } from '../utils/colorGenerator';
import './Tasks.css';

const { Option } = Select;
const { TextArea } = Input;

// Utility function to extract the numerator from UOM (e.g., "meter/hour" -> "meter", "ton/hour" -> "ton")
const getUomNumerator = (uom) => {
  if (!uom) return '';
  // If UOM contains '/', extract the part before it (numerator)
  if (uom.includes('/')) {
    return uom.split('/')[0].trim();
  }
  // Otherwise return the UOM as is
  return uom;
};

const Tasks = () => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isMoveModalVisible, setIsMoveModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [movingTask, setMovingTask] = useState(null);
  const [moveDirection, setMoveDirection] = useState(null);
  
  // New states for task type and calculations
  const [taskType, setTaskType] = useState('task');
  const [calculatedOutput, setCalculatedOutput] = useState(0);
  
  // Import states
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [importResults, setImportResults] = useState(null);
  
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTasks();
    fetchUoms();
  }, []);

  // Calculate output - handled by handleFormValuesChange callback instead

  const calculateOutput = (type, rate, duration) => {
    if (type === 'activity' && rate && duration) {
      const hours = duration / 60;
      return (hours * rate).toFixed(2);
    }
    return 0;
  };

  const fetchTasks = async () => {
    setLoading(true);
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
      } else {
        notification.error({
          message: t('tasks.messages.error'),
          description: data.message || t('tasks.messages.fetchError'),
        });
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      notification.error({
        message: t('tasks.messages.networkError'),
        description: t('tasks.messages.fetchError'),
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUoms = async () => {
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
      }
    } catch (error) {
      console.error('Error fetching UOMs:', error);
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    form.resetFields();
    form.setFieldsValue({ 
      color: generateTaskColor(),
      taskType: 'task',
      uom: 'NA',
      rate: 0,
      limits: 1
    });
    setTaskType('task');
    setCalculatedOutput(0);
    setIsModalVisible(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setTaskType(task.taskType || 'task');
    form.setFieldsValue({
      taskId: task.taskId,
      taskName: task.taskName,
      taskType: task.taskType || 'task',
      uom: task.uom,
      rate: task.rate || 0,
      taskDuration: task.taskDuration,
      formula: task.formula,
      limits: task.limits,
      color: task.color || '#3498db',
    });
    
    // Calculate output for editing
    if (task.taskType === 'activity' && task.rate && task.taskDuration) {
      const output = calculateOutput(task.taskType, task.rate, task.taskDuration);
      setCalculatedOutput(output);
    } else {
      setCalculatedOutput(0);
    }
    
    setIsModalVisible(true);
  };

  const handleTaskTypeChange = (value) => {
    setTaskType(value);
    form.setFieldsValue({ taskType: value });
    
    if (value === 'task') {
      form.setFieldsValue({ rate: 0 });
      setCalculatedOutput(0);
    }
  };

  const handleFormValuesChange = (changedValues, allValues) => {
    if (allValues.taskType === 'activity' && allValues.rate && allValues.taskDuration) {
      const output = calculateOutput(allValues.taskType, allValues.rate, allValues.taskDuration);
      setCalculatedOutput(output);
    } else {
      setCalculatedOutput(0);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem('token');

      if (editingTask) {
        const response = await fetch(`${config.apiUrl}/tasks/${editingTask._id}`, {
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
            message: t('tasks.messages.success'),
            description: t('tasks.messages.updateSuccess'),
          });
          fetchTasks();
        } else {
          notification.error({
            message: t('tasks.messages.error'),
            description: data.message || t('tasks.messages.updateError'),
          });
        }
      } else {
        const response = await fetch(`${config.apiUrl}/tasks`, {
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
            message: t('tasks.messages.success'),
            description: t('tasks.messages.createSuccess'),
          });
          fetchTasks();
        } else {
          notification.error({
            message: t('tasks.messages.error'),
            description: data.message || t('tasks.messages.createError'),
          });
        }
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const showDeleteConfirm = (task) => {
    setDeletingTask(task);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteTask = async () => {
    if (!deletingTask) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/tasks/${deletingTask._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        notification.success({
          message: t('tasks.messages.success'),
          description: t('tasks.messages.deleteSuccess'),
        });
        fetchTasks();
      } else {
        notification.error({
          message: t('tasks.messages.error'),
          description: data.message || t('tasks.messages.deleteError'),
        });
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      notification.error({
        message: t('tasks.messages.networkError'),
        description: t('tasks.messages.deleteError'),
      });
    } finally {
      setIsDeleteModalVisible(false);
      setDeletingTask(null);
    }
  };

  const showMoveConfirm = (task, direction) => {
    setMovingTask(task);
    setMoveDirection(direction);
    setIsMoveModalVisible(true);
  };

  const handleMoveTask = async () => {
    if (!movingTask || !moveDirection) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/tasks/${movingTask._id}/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ direction: moveDirection }),
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setTasks(data.data.tasks);
        notification.success({
          message: t('tasks.messages.success'),
          description: t('tasks.messages.moveSuccess', { direction: moveDirection }),
        });
      } else {
        notification.error({
          message: t('tasks.messages.error'),
          description: data.message || t('tasks.messages.moveError'),
        });
      }
    } catch (error) {
      console.error('Error moving task:', error);
      notification.error({
        message: t('tasks.messages.networkError'),
        description: t('tasks.messages.moveError'),
      });
    } finally {
      setIsMoveModalVisible(false);
      setMovingTask(null);
      setMoveDirection(null);
    }
  };

  // Excel Import/Export Functions
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        taskId: 'DR001',
        taskName: 'Drilling Operation',
        taskType: 'activity',
        uom: 'm',
        rate: 30,
        taskDuration: 100,
        formula: '',
        limits: 2
      },
      {
        taskId: 'MT001',
        taskName: 'Maintenance Check',
        taskType: 'task',
        uom: 'NA',
        rate: 0,
        taskDuration: 60,
        formula: '',
        limits: 1
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    
    ws['!cols'] = [
      { wch: 12 },  // taskId
      { wch: 30 },  // taskName
      { wch: 15 },  // taskType
      { wch: 10 },  // uom
      { wch: 12 },  // rate
      { wch: 15 },  // taskDuration
      { wch: 30 },  // formula
      { wch: 30 }   // limits
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tasks');

    XLSX.writeFile(wb, 'Task_Import_Template.xlsx');
    
    notification.success({
      message: t('tasks.messages.templateDownloaded'),
      description: t('tasks.messages.templateDownloadedDesc'),
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

  const handleImportSubmit = async () => {
    if (!importFile) {
      notification.error({
        message: t('tasks.messages.noFileSelected'),
        description: t('tasks.messages.selectFileError'),
      });
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/tasks/import`, {
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
          message: t('tasks.messages.importCompleted'),
          description: data.message,
        });
        fetchTasks();
      } else {
        notification.error({
          message: t('tasks.messages.importFailed'),
          description: data.message || t('tasks.messages.importError'),
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      notification.error({
        message: t('tasks.messages.networkError'),
        description: t('tasks.messages.importError'),
      });
    } finally {
      setImporting(false);
    }
  };

  const columns = useMemo(() => [
    {
      title: t('tasks.columns.seq'),
      key: 'seq',
      align: 'center',
      width: 60,
      fixed: 'left',
      render: (_, record) => record.order + 1,
    },
    {
      title: t('tasks.columns.color'),
      key: 'color',
      align: 'center',
      width: 70,
      fixed: 'left',
      render: (_, record) => (
        <div style={{
          width: '28px',
          height: '28px',
          backgroundColor: record.color || '#3498db',
          borderRadius: '4px',
          margin: '0 auto',
          border: '2px solid #e0e0e0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
        }} />
      ),
    },
    {
      title: t('tasks.columns.taskId'),
      dataIndex: 'taskId',
      key: 'taskId',
      width: 100,
      fixed: 'left',
    },
    {
      title: t('tasks.columns.taskName'),
      dataIndex: 'taskName',
      key: 'taskName',
      width: 180,
    },
    {
      title: t('tasks.columns.type'),
      dataIndex: 'taskType',
      key: 'taskType',
      width: 90,
      render: (type) => (
        <Tag color={type === 'activity' ? 'blue' : 'default'}>
          {type === 'activity' ? t('tasks.types.activity') : t('tasks.types.task')}
        </Tag>
      ),
      filters: [
        { text: t('tasks.filters.activity'), value: 'activity' },
        { text: t('tasks.filters.task'), value: 'task' },
      ],
      onFilter: (value, record) => record.taskType === value,
    },
    {
      title: t('tasks.columns.uom'),
      dataIndex: 'uom',
      key: 'uom',
      width: 70,
    },
    {
      title: t('tasks.columns.rate'),
      dataIndex: 'rate',
      key: 'rate',
      width: 80,
      render: (rate, record) => 
        record.taskType === 'activity' ? `${rate}/hr` : '-'
    },
    {
      title: t('tasks.columns.duration'),
      dataIndex: 'taskDuration',
      key: 'taskDuration',
      width: 90,
      render: (duration) => `${duration} min`
    },
    {
      title: t('tasks.columns.output'),
      dataIndex: 'calculatedOutput',
      key: 'calculatedOutput',
      width: 100,
      render: (output, record) => {
        if (record.taskType === 'activity' && output && output > 0) {
          // Use uomNumerator from API if available, otherwise extract from uom
          const uomNumerator = record.uomNumerator || getUomNumerator(record.uom);
          return `${Number(output).toFixed(2)} ${uomNumerator}`;
        }
        return '-';
      }
    },
    {
      title: t('tasks.columns.limits'),
      dataIndex: 'limits',
      key: 'limits',
      width: 70,
      align: 'center',
      render: (limits) => limits || 1
    },
    {
      title: t('tasks.columns.order'),
      key: 'order',
      align: 'center',
      width: 80,
      fixed: 'right',
      render: (_, record, index) => (
        <div className="order-buttons">
          <button 
            className="icon-btn"
            onClick={() => showMoveConfirm(record, 'up')}
            disabled={index === 0}
            title={t('tasks.moveUp')}
          >
            <UpOutlined />
          </button>
          <button 
            className="icon-btn"
            onClick={() => showMoveConfirm(record, 'down')}
            disabled={index === tasks.length - 1}
            title={t('tasks.moveDown')}
          >
            <DownOutlined />
          </button>
        </div>
      ),
    },
    {
      title: t('tasks.columns.actions'),
      key: 'actions',
      align: 'center',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <div className="action-buttons">
          <button className="icon-btn" onClick={() => handleEditTask(record)}>
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
  ], [t, tasks.length]);

  return (
    <DashboardLayout
      title={t('tasks.title')}
      subtitle={t('tasks.subtitle')}
      page="tasks"
    >
      <div className="task-page">
        <div className="page-header">
          <div className="header-actions">
            <button className="btn-secondary" onClick={handleDownloadTemplate}>
              <DownloadOutlined /> {t('tasks.downloadTemplate')}
            </button>
            <button className="btn-secondary" onClick={handleImportExcel}>
              <UploadOutlined /> {t('tasks.importExcel')}
            </button>
            <button className="btn-primary" onClick={handleCreateTask}>
              <PlusOutlined /> {t('tasks.newTask')}
            </button>
          </div>
        </div>

        <div className="table-container">
          <Table
            columns={columns}
            dataSource={tasks}
            loading={loading}
            rowKey="_id"
            pagination={{
              defaultPageSize: 10,
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '15', '25', '50', '100'],
              showTotal: (total, range) => t('tasks.pagination.total', { start: range[0], end: range[1], total }),
            }}
            scroll={{ x: 1100 }}
          />
        </div>

        {/* Create/Edit Modal */}
        <Modal
          title={editingTask ? t('tasks.editTask') : t('tasks.newTask')}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
            setTaskType('task');
            setCalculatedOutput(0);
          }}
          okText={editingTask ? t('tasks.save') : t('tasks.create')}
          cancelText={t('tasks.cancel')}
          width={650}
          className="simple-modal"
        >
          <Form 
            form={form} 
            layout="vertical"
            onValuesChange={handleFormValuesChange}
          >
            <Form.Item
              label={t('tasks.form.taskId')}
              name="taskId"
              rules={[{ required: true, message: t('tasks.form.required') }]}
            >
              <Input placeholder={t('tasks.form.taskIdPlaceholder')} />
            </Form.Item>

            <Form.Item
              label={t('tasks.form.taskName')}
              name="taskName"
              rules={[{ required: true, message: t('tasks.form.required') }]}
            >
              <Input placeholder={t('tasks.form.taskNamePlaceholder')} />
            </Form.Item>

            <Form.Item
              label={t('tasks.form.taskType')}
              name="taskType"
              rules={[{ required: true, message: t('tasks.form.required') }]}
              tooltip={t('tasks.form.taskTypeTooltip')}
            >
              <Select onChange={handleTaskTypeChange}>
                <Option value="task">{t('tasks.form.simpleTask')}</Option>
                <Option value="activity">{t('tasks.form.activityTask')}</Option>
              </Select>
            </Form.Item>

            {taskType === 'activity' && (
              <Alert
                message={t('tasks.form.activityModeTitle')}
                description={t('tasks.form.activityModeDesc')}
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )}

            <Form.Item
              label={t('tasks.form.uom')}
              name="uom"
              rules={[{ required: true, message: t('tasks.form.required') }]}
            >
              <Select 
                placeholder={t('tasks.form.selectUom')}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }
              >
                <Option value="NA">{t('tasks.form.naNotApplicable')}</Option>
                {uoms.map(uom => (
                  <Option key={uom._id} value={uom.name}>{uom.name}</Option>
                ))}
              </Select>
            </Form.Item>

            {taskType === 'activity' && (
              <Form.Item
                label={t('tasks.form.rate')}
                name="rate"
                rules={[
                  { required: true, message: t('tasks.form.rateRequiredForActivities') },
                  { type: 'number', min: 0, message: t('tasks.form.mustBePositive') }
                ]}
                tooltip={t('tasks.form.rateTooltip')}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  min={0}
                  placeholder={t('tasks.form.ratePlaceholder')}
                  step={0.1}
                />
              </Form.Item>
            )}

            <Form.Item
              label={t('tasks.form.taskDuration')}
              name="taskDuration"
              rules={[
                { required: true, message: t('tasks.form.required') },
                { type: 'number', min: 0, message: t('tasks.form.mustBePositiveNumber') }
              ]}
            >
              <InputNumber 
                placeholder={t('tasks.form.durationPlaceholder')}
                style={{ width: '100%' }}
                min={0}
              />
            </Form.Item>

            {taskType === 'activity' && calculatedOutput > 0 && (
              <Alert
                message={t('tasks.form.calculatedOutputTitle')}
                description={
                  <div>
                    <strong>{t('tasks.form.totalOutput', { output: calculatedOutput, unit: getUomNumerator(form.getFieldValue('uom')) || 'units' })}</strong>
                    <br />
                    <small>
                      {t('tasks.form.calculation', { duration: form.getFieldValue('taskDuration'), rate: form.getFieldValue('rate'), rateUnit: form.getFieldValue('uom'), output: calculatedOutput, unit: getUomNumerator(form.getFieldValue('uom')) })}
                    </small>
                  </div>
                }
                type="success"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )}

            <Form.Item
              label={t('tasks.form.taskColor')}
              name="color"
              rules={[{ required: true, message: t('tasks.form.required') }]}
              getValueFromEvent={(color) => {
                return typeof color === 'string' ? color : color?.toHexString();
              }}
            >
              <ColorPicker 
                showText
                format="hex"
                presets={[
                  {
                    label: t('tasks.form.recommended'),
                    colors: [
                      '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
                      '#1abc9c', '#e67e22', '#34495e', '#16a085', '#27ae60',
                      '#2980b9', '#8e44ad', '#c0392b', '#d35400', '#7f8c8d'
                    ],
                  },
                ]}
              />
            </Form.Item>

            <Form.Item
              label={t('tasks.form.formula')}
              name="formula"
            >
              <TextArea 
                rows={2}
                placeholder={t('tasks.form.formulaPlaceholder')}
              />
            </Form.Item>

            <Form.Item
              label={t('tasks.form.limits')}
              name="limits"
              rules={[{ required: true, message: t('tasks.form.required') }]}
              tooltip={t('tasks.form.limitsTooltip')}
            >
              <Select placeholder={t('tasks.form.limitsPlaceholder')}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <Option key={num} value={num}>{num}</Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        {/* Delete Modal */}
        <Modal
          title={t('tasks.deleteModal.title')}
          open={isDeleteModalVisible}
          onOk={handleDeleteTask}
          onCancel={() => {
            setIsDeleteModalVisible(false);
            setDeletingTask(null);
          }}
          okText={t('tasks.delete')}
          cancelText={t('tasks.cancel')}
          width={400}
          className="delete-modal"
          okButtonProps={{ danger: true }}
        >
          <div className="delete-modal-content">
            <ExclamationCircleOutlined className="delete-icon" />
            <div>
              <p className="delete-message">
                {t('tasks.deleteModal.message')} <strong>{deletingTask?.taskName}</strong>?
              </p>
              <p className="delete-warning">
                {t('tasks.deleteModal.warning')}
              </p>
            </div>
          </div>
        </Modal>

        {/* Move Modal */}
        <Modal
          title={t('tasks.moveModal.title')}
          open={isMoveModalVisible}
          onOk={handleMoveTask}
          onCancel={() => {
            setIsMoveModalVisible(false);
            setMovingTask(null);
            setMoveDirection(null);
          }}
          okText={t('tasks.yesMove')}
          cancelText={t('tasks.cancel')}
          width={450}
          className="delete-modal"
        >
          <div className="delete-modal-content">
            <ExclamationCircleOutlined className="delete-icon" />
            <div>
              <p className="delete-message">
                {t('tasks.moveModal.message')} <strong>{movingTask?.taskName}</strong>?
              </p>
              <div className="move-details">
                <div className="position-info">
                  <span className="position-label">{t('tasks.moveModal.currentPosition')}</span>
                  <span className="position-value">#{movingTask?.order + 1}</span>
                </div>
                <div className="arrow-icon">→</div>
                <div className="position-info">
                  <span className="position-label">{t('tasks.moveModal.newPosition')}</span>
                  <span className="position-value">
                    #{moveDirection === 'up' ? movingTask?.order : movingTask?.order + 2}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Modal>

        {/* Import Modal */}
        <Modal
          title={t('tasks.importModal.title')}
          open={isImportModalVisible}
          onOk={handleImportSubmit}
          onCancel={() => {
            setIsImportModalVisible(false);
            setImportFile(null);
            setImportResults(null);
          }}
          okText={importing ? t('tasks.importing') : t('tasks.import')}
          cancelText={t('tasks.close')}
          width={600}
          className="simple-modal"
          confirmLoading={importing}
        >
          <div style={{ marginBottom: '16px' }}>
            <Alert
              message={t('tasks.importModal.formatInstructions')}
              description={
                <div>
                  <p style={{ marginBottom: '8px' }}>{t('tasks.importModal.columnsDesc')}</p>
                  <ul style={{ marginLeft: '20px', marginBottom: '8px' }}>
                    <li>{t('tasks.importModal.taskIdCol')}</li>
                    <li>{t('tasks.importModal.taskNameCol')}</li>
                    <li>{t('tasks.importModal.taskTypeCol')}</li>
                    <li>{t('tasks.importModal.uomCol')}</li>
                    <li>{t('tasks.importModal.rateCol')}</li>
                    <li>{t('tasks.importModal.taskDurationCol')}</li>
                    <li>{t('tasks.importModal.formulaCol')}</li>
                    <li>{t('tasks.importModal.limitsCol')}</li>
                  </ul>
                  <p style={{ marginBottom: 0 }}>{t('tasks.importModal.downloadTemplate')}</p>
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
              <UploadOutlined /> {t('tasks.importModal.selectFile')}
            </button>
          </Upload>

          {importResults && (
            <div style={{ marginTop: '16px' }}>
              <Alert
                message={t('tasks.importModal.importResults')}
                description={
                  <div>
                    <p><strong>{t('tasks.importModal.successful')}</strong> {importResults.success.length} {t('tasks.importModal.successfulDesc')}</p>
                    <p><strong>{t('tasks.importModal.skipped')}</strong> {importResults.skipped.length} {t('tasks.importModal.skippedDesc')}</p>
                    <p><strong>{t('tasks.importModal.failed')}</strong> {importResults.failed.length} {t('tasks.importModal.failedDesc')}</p>
                    
                    {importResults.skipped.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <strong>{t('tasks.importModal.skippedItems')}</strong>
                        <ul style={{ marginLeft: '20px', fontSize: '12px' }}>
                          {importResults.skipped.slice(0, 5).map((item, index) => (
                            <li key={index}>
                              {item.row.taskId} - {item.reason}
                            </li>
                          ))}
                          {importResults.skipped.length > 5 && (
                            <li>{t('tasks.importModal.andMore', { count: importResults.skipped.length - 5 })}</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {importResults.failed.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <strong>{t('tasks.importModal.failedItems')}</strong>
                        <ul style={{ marginLeft: '20px', fontSize: '12px' }}>
                          {importResults.failed.slice(0, 5).map((item, index) => (
                            <li key={index}>
                              {item.row.taskId} - {item.reason}
                            </li>
                          ))}
                          {importResults.failed.length > 5 && (
                            <li>{t('tasks.importModal.andMore', { count: importResults.failed.length - 5 })}</li>
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
      </div>
    </DashboardLayout>
  );
};

export default Tasks;

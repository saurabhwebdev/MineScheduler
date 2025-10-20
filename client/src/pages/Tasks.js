import React, { useState, useEffect } from 'react';
import { Table, Modal, Form, Input, Select, InputNumber, notification, ColorPicker, Upload, Alert, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, UpOutlined, DownOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
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

  // Calculate output when form values change
  useEffect(() => {
    form.getFieldsValue();
    const type = form.getFieldValue('taskType');
    const rate = form.getFieldValue('rate');
    const duration = form.getFieldValue('taskDuration');
    
    if (type === 'activity' && rate && duration) {
      const hours = duration / 60;
      const output = (hours * rate).toFixed(2);
      setCalculatedOutput(output);
    } else {
      setCalculatedOutput(0);
    }
  }, [form]);

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
          message: 'Error',
          description: data.message || 'Failed to fetch tasks',
        });
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to fetch tasks',
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
            message: 'Success',
            description: 'Task updated successfully',
          });
          fetchTasks();
        } else {
          notification.error({
            message: 'Error',
            description: data.message || 'Failed to update task',
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
            message: 'Success',
            description: 'Task created successfully',
          });
          fetchTasks();
        } else {
          notification.error({
            message: 'Error',
            description: data.message || 'Failed to create task',
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
          message: 'Success',
          description: 'Task deleted successfully',
        });
        fetchTasks();
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to delete task',
        });
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to delete task',
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
          message: 'Success',
          description: `Task moved ${moveDirection} successfully`,
        });
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to move task',
        });
      }
    } catch (error) {
      console.error('Error moving task:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to move task',
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
      message: 'Template Downloaded',
      description: 'Excel template has been downloaded successfully',
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
        message: 'No File Selected',
        description: 'Please select an Excel file to import',
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
          message: 'Import Completed',
          description: data.message,
        });
        fetchTasks();
      } else {
        notification.error({
          message: 'Import Failed',
          description: data.message || 'Failed to import Excel file',
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to import Excel file',
      });
    } finally {
      setImporting(false);
    }
  };

  const columns = [
    {
      title: 'SEQ',
      key: 'seq',
      align: 'center',
      width: 60,
      fixed: 'left',
      render: (_, record) => record.order + 1,
    },
    {
      title: 'COLOR',
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
      title: 'TASK ID',
      dataIndex: 'taskId',
      key: 'taskId',
      width: 100,
      fixed: 'left',
    },
    {
      title: 'TASK NAME',
      dataIndex: 'taskName',
      key: 'taskName',
      width: 180,
    },
    {
      title: 'TYPE',
      dataIndex: 'taskType',
      key: 'taskType',
      width: 90,
      render: (type) => (
        <Tag color={type === 'activity' ? 'blue' : 'default'}>
          {type === 'activity' ? 'Activity' : 'Task'}
        </Tag>
      ),
      filters: [
        { text: 'Activity', value: 'activity' },
        { text: 'Task', value: 'task' },
      ],
      onFilter: (value, record) => record.taskType === value,
    },
    {
      title: 'UOM',
      dataIndex: 'uom',
      key: 'uom',
      width: 70,
    },
    {
      title: 'RATE',
      dataIndex: 'rate',
      key: 'rate',
      width: 80,
      render: (rate, record) => 
        record.taskType === 'activity' ? `${rate}/hr` : '-'
    },
    {
      title: 'DURATION',
      dataIndex: 'taskDuration',
      key: 'taskDuration',
      width: 90,
      render: (duration) => `${duration} min`
    },
    {
      title: 'OUTPUT',
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
      title: 'LIMITS',
      dataIndex: 'limits',
      key: 'limits',
      width: 70,
      align: 'center',
      render: (limits) => limits || 1
    },
    {
      title: 'ORDER',
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
            title="Move up"
          >
            <UpOutlined />
          </button>
          <button 
            className="icon-btn"
            onClick={() => showMoveConfirm(record, 'down')}
            disabled={index === tasks.length - 1}
            title="Move down"
          >
            <DownOutlined />
          </button>
        </div>
      ),
    },
    {
      title: 'ACTIONS',
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
  ];

  return (
    <DashboardLayout
      title="Tasks"
      subtitle="Manage mining tasks and activities"
      page="tasks"
    >
      <div className="task-page">
        <div className="page-header">
          <div className="header-actions">
            <button className="btn-secondary" onClick={handleDownloadTemplate}>
              <DownloadOutlined /> Download Template
            </button>
            <button className="btn-secondary" onClick={handleImportExcel}>
              <UploadOutlined /> Import Excel
            </button>
            <button className="btn-primary" onClick={handleCreateTask}>
              <PlusOutlined /> New Task
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
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            }}
            scroll={{ x: 1100 }}
          />
        </div>

        {/* Create/Edit Modal */}
        <Modal
          title={editingTask ? 'Edit Task' : 'New Task'}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
            setTaskType('task');
            setCalculatedOutput(0);
          }}
          okText={editingTask ? 'Save' : 'Create'}
          cancelText="Cancel"
          width={650}
          className="simple-modal"
        >
          <Form 
            form={form} 
            layout="vertical"
            onValuesChange={handleFormValuesChange}
          >
            <Form.Item
              label="Task ID"
              name="taskId"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="Enter task ID (e.g., DR001)" />
            </Form.Item>

            <Form.Item
              label="Task Name"
              name="taskName"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="Enter task name" />
            </Form.Item>

            <Form.Item
              label="Task Type"
              name="taskType"
              rules={[{ required: true, message: 'Required' }]}
              tooltip="Task: Simple time-based | Activity: Quantifiable with rate"
            >
              <Select onChange={handleTaskTypeChange}>
                <Option value="task">Simple Task (Time-based only)</Option>
                <Option value="activity">Activity (Quantifiable with UOM & Rate)</Option>
              </Select>
            </Form.Item>

            {taskType === 'activity' && (
              <Alert
                message="Activity Mode"
                description="For activities, you can specify a rate (e.g., 30 m/hour for drilling). The system will automatically calculate the output based on duration."
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )}

            <Form.Item
              label="UOM (Unit of Measurement)"
              name="uom"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select 
                placeholder="Select UOM" 
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }
              >
                <Option value="NA">NA (Not Applicable)</Option>
                {uoms.map(uom => (
                  <Option key={uom._id} value={uom.name}>{uom.name}</Option>
                ))}
              </Select>
            </Form.Item>

            {taskType === 'activity' && (
              <Form.Item
                label="Rate (per hour)"
                name="rate"
                rules={[
                  { required: true, message: 'Rate is required for activities' },
                  { type: 'number', min: 0, message: 'Must be positive' }
                ]}
                tooltip="Example: For drilling, enter 30 if the rate is 30 meters per hour"
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="e.g., 30 (meters per hour)"
                  step={0.1}
                />
              </Form.Item>
            )}

            <Form.Item
              label="Task Duration (Minutes)"
              name="taskDuration"
              rules={[
                { required: true, message: 'Required' },
                { type: 'number', min: 0, message: 'Must be a positive number' }
              ]}
            >
              <InputNumber 
                placeholder="Enter duration in minutes" 
                style={{ width: '100%' }}
                min={0}
              />
            </Form.Item>

            {taskType === 'activity' && calculatedOutput > 0 && (
              <Alert
                message="Calculated Output"
                description={
                  <div>
                    <strong>Total Output: {calculatedOutput} {getUomNumerator(form.getFieldValue('uom')) || 'units'}</strong>
                    <br />
                    <small>
                      Calculation: ({form.getFieldValue('taskDuration')} minutes ÷ 60 hours) × {form.getFieldValue('rate')} {form.getFieldValue('uom')}/hr = {calculatedOutput} {getUomNumerator(form.getFieldValue('uom'))}
                    </small>
                  </div>
                }
                type="success"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )}

            <Form.Item
              label="Task Color"
              name="color"
              rules={[{ required: true, message: 'Required' }]}
              getValueFromEvent={(color) => {
                return typeof color === 'string' ? color : color?.toHexString();
              }}
            >
              <ColorPicker 
                showText
                format="hex"
                presets={[
                  {
                    label: 'Recommended',
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
              label="Formula"
              name="formula"
            >
              <TextArea 
                rows={2}
                placeholder="Enter formula (optional)" 
              />
            </Form.Item>

            <Form.Item
              label="Limits/Equipments"
              name="limits"
              rules={[{ required: true, message: 'Required' }]}
              tooltip="Select number of equipment/resources (1-10)"
            >
              <Select placeholder="Select number of equipment/resources">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <Option key={num} value={num}>{num}</Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        {/* Delete Modal */}
        <Modal
          title="Delete Task"
          open={isDeleteModalVisible}
          onOk={handleDeleteTask}
          onCancel={() => {
            setIsDeleteModalVisible(false);
            setDeletingTask(null);
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
                Are you sure you want to delete <strong>{deletingTask?.taskName}</strong>?
              </p>
              <p className="delete-warning">
                This action cannot be undone.
              </p>
            </div>
          </div>
        </Modal>

        {/* Move Modal */}
        <Modal
          title="Move Task"
          open={isMoveModalVisible}
          onOk={handleMoveTask}
          onCancel={() => {
            setIsMoveModalVisible(false);
            setMovingTask(null);
            setMoveDirection(null);
          }}
          okText="Yes, Move"
          cancelText="Cancel"
          width={450}
          className="delete-modal"
        >
          <div className="delete-modal-content">
            <ExclamationCircleOutlined className="delete-icon" />
            <div>
              <p className="delete-message">
                Are you sure you want to move <strong>{movingTask?.taskName}</strong>?
              </p>
              <div className="move-details">
                <div className="position-info">
                  <span className="position-label">Current Position:</span>
                  <span className="position-value">#{movingTask?.order + 1}</span>
                </div>
                <div className="arrow-icon">→</div>
                <div className="position-info">
                  <span className="position-label">New Position:</span>
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
          title="Import Tasks from Excel"
          open={isImportModalVisible}
          onOk={handleImportSubmit}
          onCancel={() => {
            setIsImportModalVisible(false);
            setImportFile(null);
            setImportResults(null);
          }}
          okText={importing ? 'Importing...' : 'Import'}
          cancelText="Close"
          width={600}
          className="simple-modal"
          confirmLoading={importing}
        >
          <div style={{ marginBottom: '16px' }}>
            <Alert
              message="Excel Format Instructions"
              description={
                <div>
                  <p style={{ marginBottom: '8px' }}>The Excel file should contain the following columns:</p>
                  <ul style={{ marginLeft: '20px', marginBottom: '8px' }}>
                    <li><strong>taskId</strong> - Unique task identifier (required)</li>
                    <li><strong>taskName</strong> - Name of the task (required)</li>
                    <li><strong>taskType</strong> - "task" or "activity" (required)</li>
                    <li><strong>uom</strong> - Unit of measurement</li>
                    <li><strong>rate</strong> - Rate per hour (required for activities)</li>
                    <li><strong>taskDuration</strong> - Duration in minutes (required)</li>
                    <li><strong>formula</strong> - Formula (optional)</li>
                    <li><strong>limits</strong> - Limits/Equipments (optional)</li>
                  </ul>
                  <p style={{ marginBottom: 0 }}>Download the template below to see the format.</p>
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
              <UploadOutlined /> Select Excel File
            </button>
          </Upload>

          {importResults && (
            <div style={{ marginTop: '16px' }}>
              <Alert
                message="Import Results"
                description={
                  <div>
                    <p><strong>Successful:</strong> {importResults.success.length} tasks created</p>
                    <p><strong>Skipped:</strong> {importResults.skipped.length} tasks (already exist or invalid)</p>
                    <p><strong>Failed:</strong> {importResults.failed.length} tasks (errors)</p>
                    
                    {importResults.skipped.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <strong>Skipped Items:</strong>
                        <ul style={{ marginLeft: '20px', fontSize: '12px' }}>
                          {importResults.skipped.slice(0, 5).map((item, index) => (
                            <li key={index}>
                              {item.row.taskId} - {item.reason}
                            </li>
                          ))}
                          {importResults.skipped.length > 5 && (
                            <li>... and {importResults.skipped.length - 5} more</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {importResults.failed.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <strong>Failed Items:</strong>
                        <ul style={{ marginLeft: '20px', fontSize: '12px' }}>
                          {importResults.failed.slice(0, 5).map((item, index) => (
                            <li key={index}>
                              {item.row.taskId} - {item.reason}
                            </li>
                          ))}
                          {importResults.failed.length > 5 && (
                            <li>... and {importResults.failed.length - 5} more</li>
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

import React, { useState, useEffect } from 'react';
import { Modal, Spin, Row, Col, Table, Tag } from 'antd';
import { 
  ToolOutlined, 
  CheckCircleOutlined, 
  WarningOutlined,
  CalendarOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import moment from 'moment';
import config from '../config/config';
import './EquipmentDashboard.css';

const Dashboard = () => {
  const [equipment, setEquipment] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [sites, setSites] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedChart, setSelectedChart] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch equipment
      const eqResponse = await fetch(`${config.apiUrl}/equipment`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const eqData = await eqResponse.json();
      if (eqData.status === 'success') setEquipment(eqData.data.equipment);

      // Fetch latest schedule
      const schedResponse = await fetch(`${config.apiUrl}/schedule/latest`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const schedData = await schedResponse.json();
      if (schedData.status === 'success') setSchedule(schedData.data);

      // Fetch sites
      const sitesResponse = await fetch(`${config.apiUrl}/sites`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const sitesData = await sitesResponse.json();
      if (sitesData.status === 'success') setSites(sitesData.data.sites);

      // Fetch tasks
      const tasksResponse = await fetch(`${config.apiUrl}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const tasksData = await tasksResponse.json();
      if (tasksData.status === 'success') setTasks(tasksData.data.tasks);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate Equipment KPIs
  const calculateEquipmentKPIs = () => {
    const total = equipment.length;
    const operational = equipment.filter(eq => eq.status === 'operational').length;
    const maintenance = equipment.filter(eq => eq.status === 'maintenance').length;
    const outOfService = equipment.filter(eq => eq.status === 'out-of-service').length;
    const overdue = equipment.filter(eq => parseFloat(eq.percentUsed) >= 100).length;
    const dueSoon = equipment.filter(eq => parseFloat(eq.percentUsed) >= 80 && parseFloat(eq.percentUsed) < 100).length;

    return {
      total,
      operational,
      maintenance,
      outOfService,
      overdue,
      dueSoon,
      operationalRate: total > 0 ? ((operational / total) * 100).toFixed(0) : 0
    };
  };

  // Calculate Schedule KPIs
  const calculateScheduleKPIs = () => {
    if (!schedule || !schedule.grid) {
      return {
        totalSites: sites.length,
        activeSites: sites.filter(s => s.isActive).length,
        totalTasks: tasks.length,
        scheduledHours: 0,
        utilization: 0,
        delays: 0,
        lastGenerated: null
      };
    }

    const gridHours = schedule.gridHours || 24;
    const totalCells = Object.keys(schedule.grid).length * gridHours;
    let scheduledCells = 0;

    Object.values(schedule.grid).forEach(row => {
      row.forEach(cell => {
        if (cell && cell !== '') scheduledCells++;
      });
    });

    const utilization = totalCells > 0 ? ((scheduledCells / totalCells) * 100).toFixed(0) : 0;

    return {
      totalSites: sites.length,
      activeSites: sites.filter(s => s.isActive).length,
      totalTasks: tasks.length,
      scheduledHours: scheduledCells,
      utilization,
      delays: schedule.allDelays ? schedule.allDelays.length : 0,
      lastGenerated: schedule.generatedAt
    };
  };

  // Hourly Utilization from latest schedule
  const getHourlyUtilization = () => {
    if (!schedule || !schedule.hourlyAllocation) {
      return [];
    }

    const gridHours = schedule.gridHours || 24;
    const limits = schedule.taskLimits || {};
    const totalCapacity = Object.values(limits).reduce((sum, limit) => sum + limit, 0);

    return Array.from({ length: gridHours }, (_, hour) => {
      const hourData = schedule.hourlyAllocation[hour] || {};
      const used = Object.values(hourData).reduce((sum, count) => sum + count, 0);
      const utilization = totalCapacity > 0 ? ((used / totalCapacity) * 100).toFixed(0) : 0;
      
      return {
        hour: `${hour + 1}h`,
        utilization: parseFloat(utilization)
      };
    });
  };

  // Task Distribution from latest schedule
  const getTaskDistribution = () => {
    if (!schedule || !schedule.hourlyAllocation) {
      return [];
    }

    const taskCounts = {};
    Object.values(schedule.hourlyAllocation).forEach(hourData => {
      Object.entries(hourData).forEach(([taskId, count]) => {
        taskCounts[taskId] = (taskCounts[taskId] || 0) + count;
      });
    });

    // Map taskId to task name for better display
    const taskNameMap = {};
    tasks.forEach(task => {
      taskNameMap[task.taskId] = task.taskName || task.taskId;
    });

    return Object.entries(taskCounts)
      .map(([taskId, value]) => ({ 
        name: taskNameMap[taskId] || taskId, 
        value 
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 tasks
  };

  const handleChartClick = (chartType, data) => {
    setSelectedChart(chartType);
    let filteredData = [];
    
    if (chartType === 'equipment-status') {
      if (data.name === 'Operational') filteredData = equipment.filter(eq => eq.status === 'operational');
      else if (data.name === 'Maintenance') filteredData = equipment.filter(eq => eq.status === 'maintenance');
      else filteredData = equipment.filter(eq => eq.status === 'out-of-service');
    } else if (chartType === 'equipment-maintenance') {
      const percent = parseFloat(equipment.find(eq => eq.percentUsed)?.percentUsed || 0);
      if (data.name === 'Good') filteredData = equipment.filter(eq => parseFloat(eq.percentUsed) < 80);
      else if (data.name === 'Due Soon') filteredData = equipment.filter(eq => parseFloat(eq.percentUsed) >= 80 && parseFloat(eq.percentUsed) < 100);
      else filteredData = equipment.filter(eq => parseFloat(eq.percentUsed) >= 100);
    }
    
    setModalData(filteredData);
    setModalVisible(true);
  };

  const eqKPIs = calculateEquipmentKPIs();
  const schedKPIs = calculateScheduleKPIs();
  const hourlyUtil = getHourlyUtilization();
  const taskDist = getTaskDistribution();

  const equipmentStatusData = [
    { name: 'Operational', value: eqKPIs.operational, fill: '#52c41a' },
    { name: 'Maintenance', value: eqKPIs.maintenance, fill: '#faad14' },
    { name: 'Out of Service', value: eqKPIs.outOfService, fill: '#ff4d4f' }
  ].filter(item => item.value > 0);

  const equipmentMaintenanceData = [
    { name: 'Good', value: eqKPIs.total - eqKPIs.dueSoon - eqKPIs.overdue, fill: '#52c41a' },
    { name: 'Due Soon', value: eqKPIs.dueSoon, fill: '#faad14' },
    { name: 'Overdue', value: eqKPIs.overdue, fill: '#ff4d4f' }
  ].filter(item => item.value > 0);

  const modalColumns = [
    {
      title: 'Equipment ID',
      dataIndex: 'equipmentId',
      key: 'equipmentId',
      width: 120
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          operational: 'green',
          maintenance: 'orange',
          'out-of-service': 'red'
        };
        return <Tag color={colors[status]}>{status.replace('-', ' ').toUpperCase()}</Tag>;
      }
    }
  ];

  if (loading) {
    return (
      <div className="equipment-dashboard-loading">
        <Spin size="large" tip="Loading dashboard data..." />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{payload[0].payload.name || payload[0].name}</p>
          <p className="tooltip-value" style={{ color: payload[0].fill || payload[0].stroke }}>
            {`Value: ${payload[0].value}${payload[0].name === 'utilization' ? '%' : ''}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="equipment-dashboard">
      {/* Last Schedule Info Banner */}
      {schedKPIs.lastGenerated && (
        <div className="schedule-info-banner">
          <CalendarOutlined style={{ fontSize: '20px', color: '#3cca70' }} />
          <div className="schedule-info-text">
            <strong>Last Schedule Generated:</strong> {moment(schedKPIs.lastGenerated).format('MMM DD, YYYY [at] HH:mm')} 
            <span className="schedule-info-note">({moment(schedKPIs.lastGenerated).fromNow()})</span>
          </div>
          <div className="schedule-info-note">Dashboard shows data from this schedule run</div>
        </div>
      )}

      {/* Scheduler KPIs */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ backgroundColor: '#e6f7ff' }}>
              <EnvironmentOutlined style={{ color: '#1890ff' }} />
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{schedKPIs.activeSites}/{schedKPIs.totalSites}</div>
              <div className="kpi-label">Active Sites</div>
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ backgroundColor: '#f0f5ff' }}>
              <FileTextOutlined style={{ color: '#597ef7' }} />
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{schedKPIs.totalTasks}</div>
              <div className="kpi-label">Total Tasks</div>
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ backgroundColor: '#f6ffed' }}>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{schedKPIs.utilization}%</div>
              <div className="kpi-label">Schedule Utilization</div>
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ backgroundColor: '#fff7e6' }}>
              <ClockCircleOutlined style={{ color: '#fa8c16' }} />
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{schedKPIs.delays}</div>
              <div className="kpi-label">Total Delays</div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Equipment KPIs */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ backgroundColor: '#e6f7ff' }}>
              <ToolOutlined style={{ color: '#1890ff' }} />
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{eqKPIs.total}</div>
              <div className="kpi-label">Total Equipment</div>
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ backgroundColor: '#f6ffed' }}>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{eqKPIs.operational}</div>
              <div className="kpi-label">Operational</div>
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ backgroundColor: '#fffbe6' }}>
              <WarningOutlined style={{ color: '#faad14' }} />
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{eqKPIs.dueSoon}</div>
              <div className="kpi-label">Maintenance Due Soon</div>
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ backgroundColor: '#fff1f0' }}>
              <WarningOutlined style={{ color: '#ff4d4f' }} />
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{eqKPIs.overdue}</div>
              <div className="kpi-label">Maintenance Overdue</div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]}>
        {/* Hourly Utilization */}
        <Col xs={24} lg={12}>
          <div className="dashboard-chart">
            <div className="chart-header">
              <h3>Hourly Schedule Utilization</h3>
              <span className="chart-subtitle">Per hour capacity usage</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={hourlyUtil}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#8c8c8c' }} />
                <YAxis tick={{ fontSize: 12, fill: '#8c8c8c' }} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="utilization" stroke="#3cca70" strokeWidth={2} dot={{ fill: '#3cca70', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Col>

        {/* Task Distribution */}
        <Col xs={24} lg={12}>
          <div className="dashboard-chart clickable">
            <div className="chart-header">
              <h3>Task Distribution</h3>
              <span className="chart-subtitle">Most allocated tasks</span>
            </div>
            {taskDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={taskDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#8c8c8c' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#8c8c8c' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#597ef7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#8c8c8c', padding: '20px', textAlign: 'center' }}>
                <FileTextOutlined style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
                <div style={{ fontSize: '14px', fontWeight: 500 }}>No task allocation data available</div>
                <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>Generate a schedule to see task distribution</div>
              </div>
            )}
          </div>
        </Col>

        {/* Equipment Status */}
        <Col xs={24} lg={12}>
          <div className="dashboard-chart clickable" onClick={() => handleChartClick('equipment-status', equipmentStatusData[0])}>
            <div className="chart-header">
              <h3>Equipment Status</h3>
              <span className="chart-subtitle">Click to view details</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={equipmentStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#8c8c8c' }} />
                <YAxis tick={{ fontSize: 12, fill: '#8c8c8c' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {equipmentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Col>

        {/* Equipment Maintenance */}
        <Col xs={24} lg={12}>
          <div className="dashboard-chart clickable" onClick={() => handleChartClick('equipment-maintenance', equipmentMaintenanceData[0])}>
            <div className="chart-header">
              <h3>Equipment Maintenance Status</h3>
              <span className="chart-subtitle">Click to view details</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={equipmentMaintenanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#8c8c8c' }} />
                <YAxis tick={{ fontSize: 12, fill: '#8c8c8c' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {equipmentMaintenanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Col>
      </Row>

      {/* Modal for Equipment Details */}
      <Modal
        title={`${selectedChart?.replace('-', ' ').toUpperCase()} Details`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Table
          dataSource={modalData}
          columns={modalColumns}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
        />
      </Modal>
    </div>
  );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import { Row, Col, Spin, Modal, Table, Tag, Alert } from 'antd';
import { 
  ToolOutlined, 
  CheckCircleOutlined, 
  WarningOutlined,
  CalendarOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, AreaChart, Area } from 'recharts';
import moment from 'moment';
import DashboardLayout from '../components/DashboardLayout';
import config from '../config/config';
import '../components/EquipmentDashboard.css';

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

    return Object.entries(taskCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 tasks
  };

  // Equipment Type Distribution
  const getEquipmentTypeDistribution = () => {
    const typeCounts = {};
    equipment.forEach(eq => {
      typeCounts[eq.type] = (typeCounts[eq.type] || 0) + 1;
    });
    
    const colors = ['#3cca70', '#062d54', '#1890ff', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#52c41a'];
    return Object.entries(typeCounts)
      .map(([name, value], index) => ({ 
        name, 
        value,
        fill: colors[index % colors.length]
      }));
  };

  // Site Status Distribution
  const getSiteStatusDistribution = () => {
    const active = sites.filter(s => s.isActive).length;
    const inactive = sites.filter(s => !s.isActive).length;
    return [
      { name: 'Active', value: active, fill: '#3cca70' },
      { name: 'Inactive', value: inactive, fill: '#8c8c8c' }
    ].filter(item => item.value > 0);
  };

  // Maintenance Timeline (Next 7 days)
  const getMaintenanceTimeline = () => {
    const today = moment();
    const timeline = Array.from({ length: 7 }, (_, i) => {
      const date = moment().add(i, 'days');
      const count = equipment.filter(eq => {
        if (!eq.nextMaintenance) return false;
        const nextDate = moment(eq.nextMaintenance);
        return nextDate.isSame(date, 'day');
      }).length;
      
      return {
        date: date.format('MMM DD'),
        count,
        day: date.format('ddd')
      };
    });
    return timeline;
  };

  // Equipment Utilization by Type
  const getEquipmentUtilizationByType = () => {
    const typeUtilization = {};
    equipment.forEach(eq => {
      if (!typeUtilization[eq.type]) {
        typeUtilization[eq.type] = { total: 0, operational: 0 };
      }
      typeUtilization[eq.type].total++;
      if (eq.status === 'operational') {
        typeUtilization[eq.type].operational++;
      }
    });

    return Object.entries(typeUtilization)
      .map(([name, data]) => ({
        name,
        utilization: data.total > 0 ? ((data.operational / data.total) * 100).toFixed(0) : 0
      }))
      .sort((a, b) => b.utilization - a.utilization);
  };

  // Delays by Site
  const getDelaysBySite = () => {
    if (!schedule || !schedule.allDelays) return [];
    
    const delayCounts = {};
    schedule.allDelays.forEach(delay => {
      const siteId = delay.siteId || 'Unknown';
      delayCounts[siteId] = (delayCounts[siteId] || 0) + 1;
    });

    return Object.entries(delayCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  };

  const handleChartClick = (chartType, data) => {
    setSelectedChart(chartType);
    let filteredData = [];
    
    if (chartType === 'equipment-status') {
      if (data.name === 'Operational') filteredData = equipment.filter(eq => eq.status === 'operational');
      else if (data.name === 'Maintenance') filteredData = equipment.filter(eq => eq.status === 'maintenance');
      else filteredData = equipment.filter(eq => eq.status === 'out-of-service');
    } else if (chartType === 'equipment-maintenance') {
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
  const equipmentTypeDist = getEquipmentTypeDistribution();
  const siteStatusDist = getSiteStatusDistribution();
  const maintenanceTimeline = getMaintenanceTimeline();
  const equipmentUtilByType = getEquipmentUtilizationByType();
  const delaysBySite = getDelaysBySite();

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

  if (loading) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Overview of equipment and schedule metrics" page="dashboard">
        <div className="equipment-dashboard-loading">
          <Spin size="large" tip="Loading dashboard data..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard" subtitle="Overview of equipment and schedule metrics" page="dashboard">
      <div className="equipment-dashboard">
        {/* Last Schedule Info Banner */}
        {schedKPIs.lastGenerated && (
          <div className="schedule-info-banner">
            <CalendarOutlined style={{ fontSize: '20px', color: '#3cca70' }} />
            <div className="schedule-info-text">
              <strong>Last Schedule Generated:</strong> {moment(schedKPIs.lastGenerated).format('MMM DD, YYYY [at] HH:mm')} 
              <span className="schedule-info-note">({moment(schedKPIs.lastGenerated).fromNow()})</span>
            </div>
            <div className="schedule-info-note" style={{ color: '#3cca70', fontWeight: 600 }}>Dashboard shows data from this schedule run</div>
          </div>
        )}

        {!schedKPIs.lastGenerated && (
          <Alert
            message="No Schedule Generated Yet"
            description="Please generate a schedule from the Schedule page to view schedule-related metrics."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        {/* Scheduler KPIs */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <div className="kpi-card" style={{ borderLeft: '4px solid #062d54' }}>
              <div className="kpi-icon" style={{ backgroundColor: '#e8f4ff' }}>
                <EnvironmentOutlined style={{ color: '#062d54' }} />
              </div>
              <div className="kpi-content">
                <div className="kpi-value" style={{ color: '#062d54' }}>{schedKPIs.activeSites}/{schedKPIs.totalSites}</div>
                <div className="kpi-label">Active Sites</div>
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div className="kpi-card" style={{ borderLeft: '4px solid #3cca70' }}>
              <div className="kpi-icon" style={{ backgroundColor: '#e6f9f0' }}>
                <FileTextOutlined style={{ color: '#3cca70' }} />
              </div>
              <div className="kpi-content">
                <div className="kpi-value" style={{ color: '#3cca70' }}>{schedKPIs.totalTasks}</div>
                <div className="kpi-label">Total Tasks</div>
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div className="kpi-card" style={{ borderLeft: '4px solid #3cca70' }}>
              <div className="kpi-icon" style={{ backgroundColor: '#e6f9f0' }}>
                <CheckCircleOutlined style={{ color: '#3cca70' }} />
              </div>
              <div className="kpi-content">
                <div className="kpi-value" style={{ color: '#3cca70' }}>{schedKPIs.utilization}%</div>
                <div className="kpi-label">Schedule Utilization</div>
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div className="kpi-card" style={{ borderLeft: '4px solid #ff4d4f' }}>
              <div className="kpi-icon" style={{ backgroundColor: '#fff1f0' }}>
                <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
              </div>
              <div className="kpi-content">
                <div className="kpi-value" style={{ color: '#ff4d4f' }}>{schedKPIs.delays}</div>
                <div className="kpi-label">Total Delays</div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Equipment KPIs */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <div className="kpi-card" style={{ borderLeft: '4px solid #062d54' }}>
              <div className="kpi-icon" style={{ backgroundColor: '#e8f4ff' }}>
                <ToolOutlined style={{ color: '#062d54' }} />
              </div>
              <div className="kpi-content">
                <div className="kpi-value" style={{ color: '#062d54' }}>{eqKPIs.total}</div>
                <div className="kpi-label">Total Equipment</div>
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div className="kpi-card" style={{ borderLeft: '4px solid #3cca70' }}>
              <div className="kpi-icon" style={{ backgroundColor: '#e6f9f0' }}>
                <CheckCircleOutlined style={{ color: '#3cca70' }} />
              </div>
              <div className="kpi-content">
                <div className="kpi-value" style={{ color: '#3cca70' }}>{eqKPIs.operational}</div>
                <div className="kpi-label">Operational ({eqKPIs.operationalRate}%)</div>
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div className="kpi-card" style={{ borderLeft: '4px solid #faad14' }}>
              <div className="kpi-icon" style={{ backgroundColor: '#fffbe6' }}>
                <WarningOutlined style={{ color: '#faad14' }} />
              </div>
              <div className="kpi-content">
                <div className="kpi-value" style={{ color: '#faad14' }}>{eqKPIs.dueSoon}</div>
                <div className="kpi-label">Maintenance Due Soon</div>
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div className="kpi-card" style={{ borderLeft: '4px solid #ff4d4f' }}>
              <div className="kpi-icon" style={{ backgroundColor: '#fff1f0' }}>
                <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
              </div>
              <div className="kpi-content">
                <div className="kpi-value" style={{ color: '#ff4d4f' }}>{eqKPIs.overdue}</div>
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
                <span className="chart-subtitle">Real-time capacity usage per hour</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={hourlyUtil}>
                  <defs>
                    <linearGradient id="colorUtilization" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3cca70" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3cca70" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#8c8c8c' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#8c8c8c' }} domain={[0, 100]} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="utilization" stroke="#3cca70" strokeWidth={3} fill="url(#colorUtilization)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Col>

          {/* Task Distribution */}
          <Col xs={24} lg={12}>
            <div className="dashboard-chart">
              <div className="chart-header">
                <h3>Top Task Allocations</h3>
                <span className="chart-subtitle">Most frequently scheduled tasks</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={taskDist} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#8c8c8c' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#8c8c8c' }} width={80} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#062d54" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Col>

          {/* Equipment Status */}
          <Col xs={24} lg={12}>
            <div className="dashboard-chart clickable" onClick={() => equipmentStatusData.length > 0 && handleChartClick('equipment-status', equipmentStatusData[0])}>
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
            <div className="dashboard-chart clickable" onClick={() => equipmentMaintenanceData.length > 0 && handleChartClick('equipment-maintenance', equipmentMaintenanceData[0])}>
              <div className="chart-header">
                <h3>Equipment Maintenance Status</h3>
                <span className="chart-subtitle">Click to view details</span>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={equipmentMaintenanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8c8c8c' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#8c8c8c' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {equipmentMaintenanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Col>

          {/* Equipment Type Distribution */}
          <Col xs={24} lg={8}>
            <div className="dashboard-chart">
              <div className="chart-header">
                <h3>Equipment by Type</h3>
                <span className="chart-subtitle">Fleet composition</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={equipmentTypeDist}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {equipmentTypeDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Col>

          {/* Site Status */}
          <Col xs={24} lg={8}>
            <div className="dashboard-chart">
              <div className="chart-header">
                <h3>Site Status</h3>
                <span className="chart-subtitle">Active vs Inactive</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={siteStatusDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label
                  >
                    {siteStatusDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Col>

          {/* Equipment Utilization by Type */}
          <Col xs={24} lg={8}>
            <div className="dashboard-chart">
              <div className="chart-header">
                <h3>Equipment Utilization by Type</h3>
                <span className="chart-subtitle">Operational rate per type</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={equipmentUtilByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8c8c8c' }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize: 11, fill: '#8c8c8c' }} domain={[0, 100]} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="utilization" fill="#3cca70" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Col>

          {/* Maintenance Timeline (Next 7 Days) */}
          <Col xs={24} lg={12}>
            <div className="dashboard-chart">
              <div className="chart-header">
                <h3>Upcoming Maintenance (7 Days)</h3>
                <span className="chart-subtitle">Scheduled maintenance count</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={maintenanceTimeline}>
                  <defs>
                    <linearGradient id="colorMaintenance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#062d54" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#062d54" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8c8c8c' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#8c8c8c' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="custom-tooltip">
                            <p className="tooltip-label">{payload[0].payload.date} ({payload[0].payload.day})</p>
                            <p className="tooltip-value" style={{ color: '#062d54' }}>
                              {`Maintenance: ${payload[0].value}`}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#062d54" strokeWidth={3} fill="url(#colorMaintenance)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Col>

          {/* Delays by Site */}
          {delaysBySite.length > 0 && (
            <Col xs={24} lg={12}>
              <div className="dashboard-chart">
                <div className="chart-header">
                  <h3>Delays by Site</h3>
                  <span className="chart-subtitle">Sites with most scheduling delays</span>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={delaysBySite}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8c8c8c' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#8c8c8c' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#ff4d4f" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Col>
          )}
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
    </DashboardLayout>
  );
};

export default Dashboard;

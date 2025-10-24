import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Spin, Modal, Table, Tag, Alert, DatePicker, Button, Progress, Statistic, Space } from 'antd';
import { 
  ToolOutlined, 
  CalendarOutlined,
  ExclamationCircleOutlined,
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  LineChartOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import { 
  BarChart, Bar, Line, PieChart, Pie, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, 
  Area, ComposedChart 
} from 'recharts';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import config from '../config/config';
import '../components/EquipmentDashboard.css';

const { RangePicker } = DatePicker;

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState(30); // days
  const [customDateRange, setCustomDateRange] = useState(null);
  
  // Dashboard data
  const [metrics, setMetrics] = useState(null);
  const [trends, setTrends] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [equipment, setEquipment] = useState([]);
  
  // Modal states
  const [criticalModalVisible, setCriticalModalVisible] = useState(false);
  const [criticalEquipment, setCriticalEquipment] = useState([]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const days = customDateRange ? 
        moment(customDateRange[1]).diff(moment(customDateRange[0]), 'days') : 
        dateRange;
      
      // Fetch metrics
      const metricsRes = await fetch(`${config.apiUrl}/dashboard/metrics?days=${days}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const metricsData = await metricsRes.json();
      if (metricsData.status === 'success') setMetrics(metricsData.data);

      // Fetch trends
      const trendsRes = await fetch(`${config.apiUrl}/dashboard/trends?days=${days}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const trendsData = await trendsRes.json();
      if (trendsData.status === 'success') setTrends(trendsData.data);

      // Fetch equipment performance
      const perfRes = await fetch(`${config.apiUrl}/dashboard/equipment-performance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const perfData = await perfRes.json();
      if (perfData.status === 'success') setPerformance(perfData.data.performance);

      // Fetch equipment for modals
      const eqRes = await fetch(`${config.apiUrl}/equipment`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const eqData = await eqRes.json();
      if (eqData.status === 'success') setEquipment(eqData.data.equipment);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, customDateRange]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleShowCritical = () => {
    const now = new Date();
    const critical = equipment.filter(eq => {
      const isOverdue = eq.nextMaintenance && new Date(eq.nextMaintenance) < now;
      const isOutOfService = eq.status === 'out-of-service';
      return isOverdue || isOutOfService;
    });
    setCriticalEquipment(critical);
    setCriticalModalVisible(true);
  };

  const handleDateRangeChange = (value) => {
    setDateRange(value);
    setCustomDateRange(null);
  };

  const handleCustomDateRange = (dates) => {
    setCustomDateRange(dates);
    if (dates) {
      setDateRange(null);
    }
  };

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'rgba(31, 41, 55, 0.95)',
          padding: '12px',
          border: 'none',
          borderRadius: '6px',
          boxShadow: '0 3px 10px rgba(0,0,0,0.3)'
        }}>
          <p style={{ color: '#fff', margin: '0 0 8px 0', fontWeight: 600, fontSize: '13px' }}>
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: '4px 0', fontSize: '12px' }}>
              {entry.name}: <strong>{typeof entry.value === 'number' ? entry.value.toFixed(entry.name.includes('Cost') || entry.name.includes('$') ? 2 : 0) : entry.value}</strong>
              {entry.name.includes('Cost') || entry.name.includes('$') ? ' $' : entry.name.includes('utilization') || entry.name.includes('%') ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading && !metrics) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Comprehensive business overview" page="dashboard">
        <div className="equipment-dashboard-loading">
          <Spin size="large" tip="Loading dashboard data..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard" subtitle="Comprehensive business overview" page="dashboard">
      <div className="equipment-dashboard">
        {/* Smart Alerts Banner */}
        {metrics && metrics.criticalAlerts && metrics.criticalAlerts.count > 0 && (
          <Alert
            message="Critical Attention Required"
            description={
              <div>
                {metrics.criticalAlerts.overdue > 0 && <div>⚠️ {metrics.criticalAlerts.overdue} equipment overdue for maintenance</div>}
                {metrics.criticalAlerts.outOfService > 0 && <div>🔴 {metrics.criticalAlerts.outOfService} equipment out of service</div>}
                {metrics.fleetAvailability && parseFloat(metrics.fleetAvailability.percentage) < 80 && <div>📉 Fleet availability below 80%</div>}
                {metrics.maintenanceCost && metrics.maintenanceCost.trend > 20 && <div>💰 Maintenance costs up {metrics.maintenanceCost.trend}% this period</div>}
              </div>
            }
            type="error"
            showIcon
            closable
            style={{ marginBottom: 24 }}
            action={
              <Button size="small" danger onClick={handleShowCritical}>
                View Details
              </Button>
            }
          />
        )}

        {/* Quick Action Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Button 
              block 
              size="large" 
              icon={<EyeOutlined />}
              onClick={handleShowCritical}
              style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              View Critical Items
            </Button>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button 
              block 
              size="large"
              icon={<CalendarOutlined />}
              onClick={() => navigate('/maintenance-logs')}
              style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              Schedule Maintenance
            </Button>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button 
              block 
              size="large"
              type="primary"
              icon={<LineChartOutlined />}
              onClick={() => navigate('/schedule')}
              style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              Generate Schedule
            </Button>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button 
              block 
              size="large"
              icon={<PieChartOutlined />}
              onClick={() => navigate('/maintenance-logs?tab=analytics')}
              style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              View Cost Report
            </Button>
          </Col>
        </Row>

        {/* Date Range Filter */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }} align="middle">
          <Col>
            <span style={{ fontWeight: 600, marginRight: 16 }}>Time Period:</span>
          </Col>
          <Col>
            <Space>
              <Button 
                type={dateRange === 7 ? 'primary' : 'default'}
                onClick={() => handleDateRangeChange(7)}
              >
                7 Days
              </Button>
              <Button 
                type={dateRange === 30 ? 'primary' : 'default'}
                onClick={() => handleDateRangeChange(30)}
              >
                30 Days
              </Button>
              <Button 
                type={dateRange === 90 ? 'primary' : 'default'}
                onClick={() => handleDateRangeChange(90)}
              >
                90 Days
              </Button>
              <RangePicker
                value={customDateRange}
                onChange={handleCustomDateRange}
                format="YYYY-MM-DD"
              />
            </Space>
          </Col>
        </Row>

        {/* Hero KPIs - 5 Large Cards */}
        {metrics && (
          <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
            {/* Fleet Availability */}
            <Col xs={24} sm={12} lg={12} xl={12} xxl={12}>
              <div className="kpi-card" style={{ height: '140px', cursor: 'default' }}>
                <div className="kpi-header">
                  <span className="kpi-icon" style={{ backgroundColor: '#e6f9f0', width: '48px', height: '48px' }}>
                    <ToolOutlined style={{ color: '#3cca70', fontSize: '24px' }} />
                  </span>
                </div>
                <Row align="middle" style={{ marginTop: 16 }}>
                  <Col flex="auto">
                    <div style={{ fontSize: '36px', fontWeight: 700, color: '#1f2937', lineHeight: 1 }}>
                      {metrics.fleetAvailability.operational}/{metrics.fleetAvailability.total}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginTop: 8 }}>
                      Fleet Availability
                    </div>
                  </Col>
                  <Col>
                    <div style={{ 
                      fontSize: '32px', 
                      fontWeight: 700, 
                      color: parseFloat(metrics.fleetAvailability.percentage) >= 90 ? '#3cca70' : 
                             parseFloat(metrics.fleetAvailability.percentage) >= 75 ? '#faad14' : '#ff4d4f'
                    }}>
                      {metrics.fleetAvailability.percentage}%
                    </div>
                  </Col>
                </Row>
              </div>
            </Col>

            {/* Critical Alerts */}
            <Col xs={24} sm={12} lg={6} xl={6} xxl={6}>
              <div 
                className="kpi-card" 
                style={{ 
                  height: '140px', 
                  cursor: 'pointer',
                  border: metrics.criticalAlerts.severity === 'critical' ? '2px solid #ff4d4f' : undefined
                }}
                onClick={handleShowCritical}
              >
                <div className="kpi-header">
                  <span className="kpi-icon" style={{ 
                    backgroundColor: metrics.criticalAlerts.severity === 'critical' ? '#fff1f0' : '#fffbe6',
                    width: '48px', 
                    height: '48px' 
                  }}>
                    <ExclamationCircleOutlined style={{ 
                      color: metrics.criticalAlerts.severity === 'critical' ? '#ff4d4f' : '#faad14',
                      fontSize: '24px' 
                    }} />
                  </span>
                </div>
                <div style={{ fontSize: '48px', fontWeight: 700, color: '#1f2937', marginTop: 16, lineHeight: 1 }}>
                  {metrics.criticalAlerts.count}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: 8 }}>
                  Critical Alerts
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: 4 }}>
                  {metrics.criticalAlerts.overdue} overdue · {metrics.criticalAlerts.outOfService} out-of-service
                </div>
              </div>
            </Col>

            {/* Schedule Efficiency */}
            <Col xs={24} sm={12} lg={6} xl={6} xxl={6}>
              <div className="kpi-card" style={{ height: '140px', cursor: 'default' }}>
                <div className="kpi-header">
                  <span className="kpi-icon" style={{ backgroundColor: '#e8f4ff', width: '48px', height: '48px' }}>
                    <LineChartOutlined style={{ color: '#062d54', fontSize: '24px' }} />
                  </span>
                </div>
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#1f2937', lineHeight: 1 }}>
                    {metrics.scheduleEfficiency.quality}
                    <span style={{ fontSize: '18px', color: '#6b7280' }}>/100</span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginTop: 8 }}>
                    Schedule Quality
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Progress 
                      percent={metrics.scheduleEfficiency.quality} 
                      size="small"
                      strokeColor={
                        metrics.scheduleEfficiency.quality >= 80 ? '#3cca70' :
                        metrics.scheduleEfficiency.quality >= 60 ? '#faad14' : '#ff4d4f'
                      }
                      showInfo={false}
                    />
                  </div>
                </div>
              </div>
            </Col>

            {/* Maintenance Cost */}
            <Col xs={24} sm={12} lg={12} xl={12} xxl={12}>
              <div className="kpi-card" style={{ height: '140px', cursor: 'default' }}>
                <div className="kpi-header">
                  <span className="kpi-icon" style={{ backgroundColor: '#fffbe6', width: '48px', height: '48px' }}>
                    <DollarOutlined style={{ color: '#faad14', fontSize: '24px' }} />
                  </span>
                </div>
                <Row align="middle" style={{ marginTop: 16 }}>
                  <Col flex="auto">
                    <div style={{ fontSize: '36px', fontWeight: 700, color: '#1f2937', lineHeight: 1 }}>
                      ${(metrics.maintenanceCost.total / 1000).toFixed(1)}k
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginTop: 8 }}>
                      Maintenance Cost ({dateRange}d)
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: 4 }}>
                      Labor: ${(metrics.maintenanceCost.laborCost / 1000).toFixed(1)}k · Parts: ${(metrics.maintenanceCost.partsCost / 1000).toFixed(1)}k
                    </div>
                  </Col>
                  <Col>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      fontSize: '20px',
                      fontWeight: 600,
                      color: metrics.maintenanceCost.trend > 0 ? '#ff4d4f' : '#3cca70'
                    }}>
                      {metrics.maintenanceCost.trend > 0 ? <RiseOutlined /> : <FallOutlined />}
                      {Math.abs(metrics.maintenanceCost.trend)}%
                    </div>
                  </Col>
                </Row>
              </div>
            </Col>

            {/* Active Operations */}
            <Col xs={24} sm={12} lg={12} xl={12} xxl={12}>
              <div className="kpi-card" style={{ height: '140px', cursor: 'default' }}>
                <div className="kpi-header">
                  <span className="kpi-icon" style={{ backgroundColor: '#e8f4ff', width: '48px', height: '48px' }}>
                    <ThunderboltOutlined style={{ color: '#062d54', fontSize: '24px' }} />
                  </span>
                </div>
                <div style={{ marginTop: 16 }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Statistic 
                        title="Active Sites" 
                        value={metrics.activeOperations.activeSites}
                        suffix={`/${metrics.activeOperations.totalSites}`}
                        valueStyle={{ fontSize: '24px', fontWeight: 700 }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic 
                        title="Total Tasks" 
                        value={metrics.activeOperations.totalTasks}
                        valueStyle={{ fontSize: '24px', fontWeight: 700 }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic 
                        title="Delays" 
                        value={metrics.activeOperations.delays}
                        valueStyle={{ fontSize: '24px', fontWeight: 700, color: '#ff4d4f' }}
                      />
                    </Col>
                  </Row>
                </div>
              </div>
            </Col>
          </Row>
        )}

        {/* Charts Section */}
        <Row gutter={[16, 16]}>
          {/* Fleet Performance Timeline - Full Width */}
          {performance && performance.length > 0 && (
            <Col xs={24}>
              <div className="dashboard-chart">
                <div className="chart-header">
                  <h3>Fleet Performance Timeline (24 Hours)</h3>
                  <span className="chart-subtitle">Equipment status and schedule utilization by hour</span>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={performance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis 
                      dataKey="hour" 
                      tick={{ fontSize: 11, fill: '#8c8c8c' }} 
                      axisLine={false} 
                      tickLine={false}
                      label={{ value: 'Hour', position: 'insideBottom', offset: -5, style: { fontSize: 12, fill: '#6b7280' } }}
                    />
                    <YAxis 
                      yAxisId="left"
                      tick={{ fontSize: 11, fill: '#8c8c8c' }} 
                      axisLine={false} 
                      tickLine={false}
                      label={{ value: 'Equipment Count', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11, fill: '#8c8c8c' }} 
                      axisLine={false} 
                      tickLine={false}
                      domain={[0, 100]}
                      label={{ value: 'Utilization %', angle: 90, position: 'insideRight', style: { fontSize: 12, fill: '#6b7280' } }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="operational" 
                      stroke="#3cca70" 
                      strokeWidth={3}
                      name="Operational"
                      dot={{ fill: '#3cca70', r: 3 }}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="maintenance" 
                      stroke="#faad14" 
                      strokeWidth={2}
                      name="In Maintenance"
                      dot={{ fill: '#faad14', r: 3 }}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="outOfService" 
                      stroke="#ff4d4f" 
                      strokeWidth={2}
                      name="Out of Service"
                      dot={{ fill: '#ff4d4f', r: 3 }}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="utilization"
                      fill="#062d54"
                      fillOpacity={0.1}
                      stroke="#062d54"
                      strokeWidth={2}
                      name="Utilization %"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Col>
          )}

          {/* Critical Equipment Attention Board */}
          {equipment && equipment.length > 0 && (
            <Col xs={24} lg={12}>
              <div className="dashboard-chart">
                <div className="chart-header">
                  <h3>Critical Equipment Attention Board</h3>
                  <span className="chart-subtitle">Equipment requiring immediate action by type</span>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={getCriticalEquipmentData(equipment)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#8c8c8c' }} axisLine={false} tickLine={false} />
                    <YAxis 
                      type="category" 
                      dataKey="type" 
                      tick={{ fontSize: 11, fill: '#8c8c8c' }} 
                      axisLine={false} 
                      tickLine={false}
                      width={90}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="overdue" stackId="a" fill="#ff4d4f" name="Overdue" radius={[0, 8, 8, 0]} />
                    <Bar dataKey="dueSoon" stackId="a" fill="#faad14" name="Due Soon" radius={[0, 8, 8, 0]} />
                    <Bar dataKey="outOfService" stackId="a" fill="#8c8c8c" name="Out of Service" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Col>
          )}

          {/* Maintenance Cost Breakdown */}
          {trends && trends.costByEquipmentType && trends.costByEquipmentType.length > 0 && (
            <Col xs={24} lg={12}>
              <div className="dashboard-chart">
                <div className="chart-header">
                  <h3>Maintenance Cost Breakdown ({dateRange} Days)</h3>
                  <span className="chart-subtitle">Total: ${metrics?.maintenanceCost.total.toFixed(0)}</span>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={trends.costByEquipmentType.slice(0, 8)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      innerRadius={60}
                      fill="#8884d8"
                      dataKey="cost"
                      nameKey="type"
                    >
                      {trends.costByEquipmentType.slice(0, 8).map((entry, index) => {
                        const colors = ['#ff4d4f', '#faad14', '#3cca70', '#062d54', '#597ef7', '#13c2c2', '#eb2f96', '#722ed1'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Col>
          )}

          {/* Schedule Quality Score */}
          {metrics && metrics.scheduleEfficiency && (
            <Col xs={24} lg={8}>
              <div className="dashboard-chart">
                <div className="chart-header">
                  <h3>Schedule Quality Score</h3>
                  <span className="chart-subtitle">Overall scheduling effectiveness</span>
                </div>
                <div style={{ 
                  height: 300, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: '20px'
                }}>
                  <div style={{ 
                    fontSize: '72px', 
                    fontWeight: 700,
                    color: metrics.scheduleEfficiency.quality >= 80 ? '#3cca70' :
                           metrics.scheduleEfficiency.quality >= 60 ? '#faad14' : '#ff4d4f'
                  }}>
                    {metrics.scheduleEfficiency.quality}
                  </div>
                  <div style={{ fontSize: '20px', color: '#6b7280', marginBottom: 20 }}>
                    out of 100
                  </div>
                  <Progress 
                    type="dashboard" 
                    percent={metrics.scheduleEfficiency.quality}
                    strokeColor={{
                      '0%': metrics.scheduleEfficiency.quality >= 80 ? '#3cca70' :
                            metrics.scheduleEfficiency.quality >= 60 ? '#faad14' : '#ff4d4f',
                      '100%': metrics.scheduleEfficiency.quality >= 80 ? '#3cca70' :
                              metrics.scheduleEfficiency.quality >= 60 ? '#faad14' : '#ff4d4f',
                    }}
                    style={{ marginBottom: 20 }}
                  />
                  <div style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
                    <div>Utilization: {metrics.scheduleEfficiency.utilization.toFixed(1)}%</div>
                    <div>Conflicts: {metrics.scheduleEfficiency.conflicts}</div>
                    <div>Task Completion: {metrics.scheduleEfficiency.taskCompletion}%</div>
                  </div>
                </div>
              </div>
            </Col>
          )}

          {/* Delay Impact Analysis */}
          {trends && trends.delaysByCategory && trends.delaysByCategory.length > 0 && (
            <Col xs={24} lg={8}>
              <div className="dashboard-chart">
                <div className="chart-header">
                  <h3>Delay Impact Analysis</h3>
                  <span className="chart-subtitle">Delays by category</span>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trends.delaysByCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis 
                      dataKey="category" 
                      tick={{ fontSize: 10, fill: '#8c8c8c' }} 
                      axisLine={false} 
                      tickLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#8c8c8c' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#ff4d4f" radius={[8, 8, 0, 0]} name="Delay Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Col>
          )}

          {/* Fleet Health Score */}
          {equipment && equipment.length > 0 && (
            <Col xs={24} lg={8}>
              <div className="dashboard-chart">
                <div className="chart-header">
                  <h3>Fleet Health Score</h3>
                  <span className="chart-subtitle">Status distribution by equipment type</span>
                </div>
                <div style={{ padding: '20px' }}>
                  {getFleetHealthData(equipment).map((item, index) => (
                    <div key={index} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>{item.type}</span>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          {item.operational}/{item.total}
                        </span>
                      </div>
                      <Progress 
                        percent={item.percentage}
                        strokeColor={item.percentage >= 90 ? '#3cca70' : item.percentage >= 75 ? '#faad14' : '#ff4d4f'}
                        size="small"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </Col>
          )}
        </Row>

        {/* Critical Equipment Modal */}
        <Modal
          title="Critical Equipment Attention Required"
          open={criticalModalVisible}
          onCancel={() => setCriticalModalVisible(false)}
          footer={null}
          width={900}
        >
          <Table
            dataSource={criticalEquipment}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
            columns={[
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
              },
              {
                title: 'Issue',
                key: 'issue',
                render: (_, record) => {
                  const now = new Date();
                  const isOverdue = record.nextMaintenance && new Date(record.nextMaintenance) < now;
                  const isOutOfService = record.status === 'out-of-service';
                  
                  if (isOverdue) {
                    const daysOverdue = Math.floor((now - new Date(record.nextMaintenance)) / (1000 * 60 * 60 * 24));
                    return <Tag color="red">Maintenance Overdue ({daysOverdue} days)</Tag>;
                  }
                  if (isOutOfService) {
                    return <Tag color="red">Out of Service</Tag>;
                  }
                  return '-';
                }
              }
            ]}
          />
        </Modal>
      </div>
    </DashboardLayout>
  );
};

// Helper function for critical equipment data
const getCriticalEquipmentData = (equipment) => {
  const now = new Date();
  const typeData = {};
  
  equipment.forEach(eq => {
    if (!typeData[eq.type]) {
      typeData[eq.type] = { type: eq.type, overdue: 0, dueSoon: 0, outOfService: 0 };
    }
    
    if (eq.nextMaintenance) {
      const nextDate = new Date(eq.nextMaintenance);
      const daysUntil = (nextDate - now) / (1000 * 60 * 60 * 24);
      
      if (daysUntil < 0) {
        typeData[eq.type].overdue++;
      } else if (daysUntil <= 7) {
        typeData[eq.type].dueSoon++;
      }
    }
    
    if (eq.status === 'out-of-service') {
      typeData[eq.type].outOfService++;
    }
  });
  
  return Object.values(typeData)
    .filter(item => item.overdue > 0 || item.dueSoon > 0 || item.outOfService > 0)
    .sort((a, b) => (b.overdue + b.outOfService) - (a.overdue + a.outOfService));
};

// Helper function for fleet health data
const getFleetHealthData = (equipment) => {
  const typeData = {};
  
  equipment.forEach(eq => {
    if (!typeData[eq.type]) {
      typeData[eq.type] = { type: eq.type, total: 0, operational: 0 };
    }
    typeData[eq.type].total++;
    if (eq.status === 'operational') {
      typeData[eq.type].operational++;
    }
  });
  
  return Object.values(typeData).map(item => ({
    ...item,
    percentage: item.total > 0 ? ((item.operational / item.total) * 100).toFixed(1) : 0
  })).sort((a, b) => b.total - a.total);
};

export default Dashboard;

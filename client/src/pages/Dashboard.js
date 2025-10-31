import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Spin, Modal, Table, Tag, Alert, DatePicker, Button, Progress, Space, Card, Statistic, Divider, Segmented } from 'antd';
import { useTranslation } from 'react-i18next';
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
  PieChartOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { 
  BarChart, Bar, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, 
  Area, ComposedChart 
} from 'recharts';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import config from '../config/config';
import './Dashboard.css';

const { RangePicker } = DatePicker;

const Dashboard = () => {
  const { t } = useTranslation();
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
  const [qualityInfoVisible, setQualityInfoVisible] = useState(false);
  const [maintenanceCostModalVisible, setMaintenanceCostModalVisible] = useState(false);
  const [maintenanceCostData, setMaintenanceCostData] = useState(null);
  const [delayFilter, setDelayFilter] = useState('all'); // 'all', 'user', 'shift'

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
      const percentUsed = parseFloat(eq.percentUsed) || 0;
      let isOverdue = false;
      
      // Check if maintenance date/time has passed OR usage >= 100%
      if (eq.nextMaintenance) {
        const nextMaintenance = new Date(eq.nextMaintenance);
        isOverdue = nextMaintenance < now;
      }
      
      const isOutOfService = eq.status === 'out-of-service';
      return isOverdue || percentUsed >= 100 || isOutOfService;
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

  const fetchMaintenanceCostHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/maintenance-logs/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setMaintenanceCostData(data.data);
        setMaintenanceCostModalVisible(true);
      }
    } catch (error) {
      console.error('Error fetching maintenance cost data:', error);
    }
  };

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="modern-tooltip">
          <div className="tooltip-label">{label}</div>
          {payload.map((entry, index) => (
            <div key={index} className="tooltip-item" style={{ color: entry.color }}>
              <span className="tooltip-name">{entry.name}:</span>
              <span className="tooltip-value">
                {typeof entry.value === 'number' ? 
                  entry.value.toFixed(entry.name.includes('Cost') || entry.name.includes('$') ? 2 : 0) : 
                  entry.value}
                {entry.name.includes('Cost') || entry.name.includes('$') ? ' $' : 
                 entry.name.includes('utilization') || entry.name.includes('%') ? '%' : ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading && !metrics) {
    return (
      <DashboardLayout title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} page="dashboard">
        <div className="dashboard-loading">
          <Spin size="large" tip={t('dashboard.loading')} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} page="dashboard">
      <div className="modern-dashboard">
        {/* Smart Alerts Banner */}
        {metrics && metrics.criticalAlerts && metrics.criticalAlerts.count > 0 && (
          <Alert
            message={`⚠️ ${metrics.criticalAlerts.count} ${t('dashboard.alerts.criticalIssue', { count: metrics.criticalAlerts.count })} ${t('dashboard.alerts.detected')}`}
            description={
              <Space direction="vertical" size={4}>
                {metrics.criticalAlerts.overdue > 0 && <span>• {t('dashboard.alerts.overdueEquipment', { count: metrics.criticalAlerts.overdue })}</span>}
                {metrics.criticalAlerts.outOfService > 0 && <span>• {t('dashboard.alerts.outOfService', { count: metrics.criticalAlerts.outOfService })}</span>}
                {metrics.fleetAvailability && parseFloat(metrics.fleetAvailability.percentage) < 80 && <span>• {t('dashboard.alerts.fleetAvailabilityLow')}</span>}
              </Space>
            }
            type="error"
            showIcon
            closable
            className="alert-banner"
            action={
              <Button size="small" danger onClick={handleShowCritical}>
                {t('dashboard.alerts.viewDetails')}
              </Button>
            }
          />
        )}

        {/* Quick Actions Bar */}
        <Card className="actions-card">
          <div className="actions-header">
            <div>
              <h3>{t('dashboard.quickActions.title')}</h3>
              <p>{t('dashboard.quickActions.subtitle')}</p>
            </div>
            <Space>
              <Button 
                type={dateRange === 7 ? 'primary' : 'default'}
                onClick={() => handleDateRangeChange(7)}
                size="small"
              >
                7d
              </Button>
              <Button 
                type={dateRange === 30 ? 'primary' : 'default'}
                onClick={() => handleDateRangeChange(30)}
                size="small"
              >
                30d
              </Button>
              <Button 
                type={dateRange === 90 ? 'primary' : 'default'}
                onClick={() => handleDateRangeChange(90)}
                size="small"
              >
                90d
              </Button>
              <RangePicker
                value={customDateRange}
                onChange={handleCustomDateRange}
                format="YYYY-MM-DD"
                size="small"
              />
            </Space>
          </div>
          <div className="actions-buttons">
            <Button 
              icon={<EyeOutlined />}
              onClick={handleShowCritical}
              className="action-btn"
            >
              {t('dashboard.quickActions.criticalItems')}
            </Button>
            <Button 
              icon={<CalendarOutlined />}
              onClick={() => navigate('/maintenance-logs')}
              className="action-btn"
            >
              {t('dashboard.quickActions.maintenance')}
            </Button>
            <Button 
              type="primary"
              icon={<LineChartOutlined />}
              onClick={() => navigate('/schedule')}
              className="action-btn"
            >
              {t('dashboard.quickActions.generateSchedule')}
            </Button>
            <Button 
              icon={<PieChartOutlined />}
              onClick={() => navigate('/maintenance-logs')}
              className="action-btn"
            >
              {t('dashboard.quickActions.costReports')}
            </Button>
          </div>
        </Card>

        {/* Hero KPIs Row */}
        {metrics && (
          <Row gutter={[16, 16]} className="kpis-row">
            {/* Fleet Availability */}
            <Col xs={24} sm={12} lg={6}>
              <Card className="hero-kpi-card fleet-card">
                <div className="kpi-icon-wrapper fleet">
                  <ToolOutlined />
                </div>
                <div className="kpi-content">
                  <div className="kpi-main">
                    <span className="kpi-value">{metrics.fleetAvailability.operational}</span>
                    <span className="kpi-separator">/</span>
                    <span className="kpi-total">{metrics.fleetAvailability.total}</span>
                  </div>
                  <div className="kpi-label">{t('dashboard.kpis.fleetAvailability')}</div>
                  <div className="kpi-percentage" style={{
                    color: parseFloat(metrics.fleetAvailability.percentage) >= 90 ? '#10b981' : 
                           parseFloat(metrics.fleetAvailability.percentage) >= 75 ? '#f59e0b' : '#ef4444'
                  }}>
                    {metrics.fleetAvailability.percentage}% {t('dashboard.kpis.available')}
                  </div>
                </div>
              </Card>
            </Col>

            {/* Critical Alerts */}
            <Col xs={24} sm={12} lg={6}>
              <Card 
                className={`hero-kpi-card critical-card ${metrics.criticalAlerts.severity === 'critical' ? 'severity-critical' : ''}`}
                onClick={handleShowCritical}
              >
                <div className="kpi-icon-wrapper critical">
                  <ExclamationCircleOutlined />
                </div>
                <div className="kpi-content">
                  <div className="kpi-value-large">{metrics.criticalAlerts.count}</div>
                  <div className="kpi-label">{t('dashboard.kpis.criticalAlerts')}</div>
                  <div className="kpi-sublabel">
                    {metrics.criticalAlerts.overdue} {t('dashboard.kpis.overdue')} · {metrics.criticalAlerts.outOfService} {t('dashboard.kpis.offline')}
                  </div>
                </div>
              </Card>
            </Col>

            {/* Maintenance Cost */}
            <Col xs={24} sm={12} lg={6}>
              <Card className="hero-kpi-card cost-card clickable" onClick={fetchMaintenanceCostHistory}>
                <div className="kpi-icon-wrapper cost">
                  <DollarOutlined />
                </div>
                <div className="kpi-content">
                  <div className="kpi-value-large">
                    ${(metrics.maintenanceCost.total / 1000).toFixed(1)}k
                  </div>
                  <div className="kpi-label">{t('dashboard.kpis.maintenanceCost', { days: dateRange })}</div>
                  <div className="kpi-trend-row">
                    <span className="kpi-sublabel">
                      {t('dashboard.kpis.labor')} ${(metrics.maintenanceCost.laborCost / 1000).toFixed(1)}k · {t('dashboard.kpis.parts')} ${(metrics.maintenanceCost.partsCost / 1000).toFixed(1)}k
                    </span>
                    <span className={`kpi-trend ${metrics.maintenanceCost.trend > 0 ? 'negative' : 'positive'}`}>
                      {metrics.maintenanceCost.trend > 0 ? <RiseOutlined /> : <FallOutlined />}
                      {Math.abs(metrics.maintenanceCost.trend)}%
                    </span>
                  </div>
                  <div className="kpi-hint">Click for history</div>
                </div>
              </Card>
            </Col>

            {/* Schedule Quality */}
            <Col xs={24} sm={12} lg={6}>
              <Card className="hero-kpi-card quality-card">
                <Button
                  type="text"
                  icon={<InfoCircleOutlined />}
                  className="card-info-button"
                  onClick={() => setQualityInfoVisible(true)}
                  title={t('dashboard.kpis.howCalculated')}
                />
                <div className="kpi-icon-wrapper quality">
                  <LineChartOutlined />
                </div>
                <div className="kpi-content">
                  <div className="kpi-value-with-max">
                    <span className="kpi-value-large">{metrics.scheduleEfficiency.quality}</span>
                    <span className="kpi-max">/100</span>
                  </div>
                  <div className="kpi-label">{t('dashboard.kpis.scheduleQuality')}</div>
                  <div className="kpi-sublabel" style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
                    {
                      delayFilter === 'user' ? `${metrics.activeOperations.userDelays} user delays` :
                      delayFilter === 'shift' ? `${metrics.activeOperations.shiftDelays} shift delays` :
                      `${metrics.activeOperations.allDelays} total delays`
                    }
                  </div>
                  <Progress 
                    percent={metrics.scheduleEfficiency.quality} 
                    strokeColor={
                      metrics.scheduleEfficiency.quality >= 80 ? '#10b981' :
                      metrics.scheduleEfficiency.quality >= 60 ? '#f59e0b' : '#ef4444'
                    }
                    showInfo={false}
                    size="small"
                    className="quality-progress"
                  />
                </div>
              </Card>
            </Col>
          </Row>
        )}

        {/* Secondary KPIs Row */}
        {metrics && (
          <Row gutter={[16, 16]} className="secondary-kpis-row">
            <Col xs={12} sm={12} lg={6}>
              <Card className="mini-kpi-card" style={{ minHeight: '140px' }}>
                <Statistic
                  title={t('dashboard.kpis.activeSites')}
                  value={metrics.activeOperations.activeSites}
                  suffix={`/${metrics.activeOperations.totalSites}`}
                  prefix={<ThunderboltOutlined />}
                  valueStyle={{ fontSize: '20px', fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} lg={6}>
              <Card className="mini-kpi-card" style={{ minHeight: '140px' }}>
                <Statistic
                  title={t('dashboard.kpis.totalTasks')}
                  value={metrics.activeOperations.totalTasks}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} lg={6}>
              <Card className="mini-kpi-card" style={{ minHeight: '140px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <Segmented
                    size="small"
                    value={delayFilter}
                    onChange={setDelayFilter}
                    options={[
                      { label: 'All', value: 'all' },
                      { label: 'User', value: 'user' },
                      { label: 'Shift', value: 'shift' }
                    ]}
                    style={{ fontSize: '11px' }}
                  />
                </div>
                <Statistic
                  title={t('dashboard.kpis.delays')}
                  value={
                    delayFilter === 'user' ? metrics.activeOperations.userDelays :
                    delayFilter === 'shift' ? metrics.activeOperations.shiftDelays :
                    metrics.activeOperations.allDelays
                  }
                  prefix={<WarningOutlined />}
                  valueStyle={{ fontSize: '20px', fontWeight: 700, color: '#ef4444' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} lg={6}>
              <Card className="mini-kpi-card" style={{ minHeight: '140px' }}>
                <Statistic
                  title={t('dashboard.kpis.dueSoon')}
                  value={metrics.criticalAlerts.dueSoon}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Charts Section */}
        <Row gutter={[16, 16]} className="charts-section">
          {/* Fleet Performance Timeline - Full Width */}
          {performance && performance.length > 0 && (
            <Col xs={24}>
              <Card className="chart-card">
                <div className="chart-header">
                  <h3>{t('dashboard.charts.fleetPerformance')}</h3>
                  <p>{t('dashboard.charts.fleetPerformanceDesc')}</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={performance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis 
                      dataKey="hour" 
                      tick={{ fontSize: 11, fill: '#6b7280' }} 
                      axisLine={false} 
                      tickLine={false}
                    />
                    <YAxis 
                      yAxisId="left"
                      tick={{ fontSize: 11, fill: '#6b7280' }} 
                      axisLine={false} 
                      tickLine={false}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11, fill: '#6b7280' }} 
                      axisLine={false} 
                      tickLine={false}
                      domain={[0, 100]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="operational" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      name={t('dashboard.charts.operational')}
                      dot={{ fill: '#10b981', r: 3 }}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="maintenance" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      name={t('dashboard.charts.inMaintenance')}
                      dot={{ fill: '#f59e0b', r: 3 }}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="outOfService" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name={t('dashboard.charts.outOfService')}
                      dot={{ fill: '#ef4444', r: 3 }}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="utilization"
                      fill="#3b82f6"
                      fillOpacity={0.1}
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name={t('dashboard.charts.utilization')}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          )}

          {/* Row 1: Critical Equipment & Maintenance Cost */}
          {equipment && equipment.length > 0 && (
            <Col xs={24} lg={12}>
              <Card className="chart-card">
                <div className="chart-header">
                  <h3>{t('dashboard.charts.criticalEquipment')}</h3>
                  <p>{t('dashboard.charts.criticalEquipmentDesc')}</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={getCriticalEquipmentData(equipment)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis 
                      type="category" 
                      dataKey="type" 
                      tick={{ fontSize: 11, fill: '#374151' }} 
                      axisLine={false} 
                      tickLine={false}
                      width={90}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="overdue" stackId="a" fill="#ef4444" name={t('dashboard.charts.overdue')} radius={[0, 8, 8, 0]} />
                    <Bar dataKey="dueSoon" stackId="a" fill="#f59e0b" name={t('dashboard.charts.dueSoon')} radius={[0, 8, 8, 0]} />
                    <Bar dataKey="outOfService" stackId="a" fill="#6b7280" name={t('dashboard.charts.offline')} radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          )}

          {trends && trends.delaysByCategory && trends.delaysByCategory.length > 0 && (
            <Col xs={24} lg={12}>
              <Card className="chart-card">
                <div className="chart-header">
                  <h3>{t('dashboard.charts.delayImpact')}</h3>
                  <p>{t('dashboard.charts.delayImpactDesc')}</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trends.delaysByCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis 
                      dataKey="category" 
                      tick={{ fontSize: 10, fill: '#6b7280' }} 
                      axisLine={false} 
                      tickLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#ef4444" radius={[8, 8, 0, 0]} name={t('dashboard.charts.delays')} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          )}

          {/* Row 2: Fleet Health & Schedule Quality */}
          {equipment && equipment.length > 0 && (
            <Col xs={24} lg={12}>
              <Card className="chart-card fleet-health-card">
                <div className="chart-header">
                  <h3>{t('dashboard.charts.fleetHealth')}</h3>
                  <p>{t('dashboard.charts.fleetHealthDesc')}</p>
                </div>
                <div className="health-list" style={{ minHeight: '300px' }}>
                  {getFleetHealthData(equipment).slice(0, 5).map((item, index) => (
                    <div key={index} className="health-item">
                      <div className="health-header">
                        <span className="health-type">{item.type}</span>
                        <span className="health-stats">{item.operational}/{item.total}</span>
                      </div>
                      <Progress 
                        percent={parseFloat(item.percentage)}
                        strokeColor={
                          parseFloat(item.percentage) >= 90 ? '#10b981' : 
                          parseFloat(item.percentage) >= 75 ? '#f59e0b' : '#ef4444'
                        }
                        size="small"
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          )}

          {metrics && metrics.scheduleEfficiency && (
            <Col xs={24} lg={12}>
              <Card className="chart-card quality-detail-card">
                <Button
                  type="text"
                  icon={<InfoCircleOutlined />}
                  className="chart-info-button"
                  onClick={() => setQualityInfoVisible(true)}
                  title={t('dashboard.kpis.howCalculated')}
                />
                <div className="chart-header">
                  <h3>{t('dashboard.charts.qualityBreakdown')}</h3>
                  <p>{t('dashboard.charts.qualityBreakdownDesc')}</p>
                </div>
                <div className="quality-breakdown" style={{ minHeight: '300px' }}>
                  <div className="quality-score-circle">
                    <Progress 
                      type="circle" 
                      percent={metrics.scheduleEfficiency.quality}
                      strokeColor={{
                        '0%': metrics.scheduleEfficiency.quality >= 80 ? '#10b981' :
                              metrics.scheduleEfficiency.quality >= 60 ? '#f59e0b' : '#ef4444',
                        '100%': metrics.scheduleEfficiency.quality >= 80 ? '#10b981' :
                                metrics.scheduleEfficiency.quality >= 60 ? '#f59e0b' : '#ef4444',
                      }}
                      format={() => <div className="score-text">{metrics.scheduleEfficiency.quality}<span className="score-label">/100</span></div>}
                      width={120}
                    />
                  </div>
                  <div className="quality-metrics">
                    <div className="quality-metric">
                      <span className="metric-label">{t('dashboard.quality.utilization')}</span>
                      <span className="metric-value">{metrics.scheduleEfficiency.utilization.toFixed(1)}%</span>
                    </div>
                    <div className="quality-metric">
                      <span className="metric-label">{t('dashboard.quality.conflicts')}</span>
                      <span className="metric-value">
                        {
                          delayFilter === 'user' ? metrics.activeOperations.userDelays :
                          delayFilter === 'shift' ? metrics.activeOperations.shiftDelays :
                          metrics.scheduleEfficiency.conflicts
                        }
                      </span>
                    </div>
                    <div className="quality-metric">
                      <span className="metric-label">{t('dashboard.quality.completion')}</span>
                      <span className="metric-value">{metrics.scheduleEfficiency.taskCompletion}%</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          )}
        </Row>

        {/* Critical Equipment Modal */}
        <Modal
          title={t('dashboard.modals.criticalEquipmentTitle')}
          open={criticalModalVisible}
          onCancel={() => setCriticalModalVisible(false)}
          footer={null}
          width={900}
          className="modern-modal"
        >
          <Table
            dataSource={criticalEquipment}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
            columns={[
              {
                title: t('dashboard.modals.equipmentId'),
                dataIndex: 'equipmentId',
                key: 'equipmentId',
                width: 120,
                render: (text) => <strong>{text}</strong>
              },
              {
                title: t('dashboard.modals.name'),
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: t('dashboard.modals.type'),
                dataIndex: 'type',
                key: 'type',
              },
              {
                title: t('dashboard.modals.status'),
                dataIndex: 'status',
                key: 'status',
                render: (status) => {
                  const colors = {
                    operational: 'success',
                    maintenance: 'warning',
                    'out-of-service': 'error'
                  };
                  return <Tag color={colors[status]}>{status.replace('-', ' ').toUpperCase()}</Tag>;
                }
              },
              {
                title: t('dashboard.modals.issue'),
                key: 'issue',
                render: (_, record) => {
                  const now = new Date();
                  const isOverdue = record.nextMaintenance && new Date(record.nextMaintenance) < now;
                  const isOutOfService = record.status === 'out-of-service';
                  
                  if (isOverdue) {
                    const daysOverdue = Math.floor((now - new Date(record.nextMaintenance)) / (1000 * 60 * 60 * 24));
                    return <Tag color="error">{t('dashboard.modals.maintenanceOverdue', { days: daysOverdue })}</Tag>;
                  }
                  if (isOutOfService) {
                    return <Tag color="error">{t('dashboard.modals.outOfService')}</Tag>;
                  }
                  return '-';
                }
              }
            ]}
          />
        </Modal>

        {/* Schedule Quality Info Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LineChartOutlined style={{ color: '#2563eb' }} />
              <span>{t('dashboard.qualityModal.title')}</span>
            </div>
          }
          open={qualityInfoVisible}
          onCancel={() => setQualityInfoVisible(false)}
          footer={[
            <Button key="close" type="primary" onClick={() => setQualityInfoVisible(false)}>
              {t('dashboard.qualityModal.gotIt')}
            </Button>
          ]}
          width={700}
          className="modern-modal quality-info-modal"
        >
          <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                {t('dashboard.qualityModal.whatIs')}
              </p>
              <p style={{ color: '#6b7280', margin: 0 }}>
                {t('dashboard.qualityModal.whatIsDesc')}
              </p>
            </div>

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
                {t('dashboard.qualityModal.howCalculated')}
              </p>
              <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: '#374151' }}>{t('dashboard.qualityModal.utilizationLabel')}</span>
                    <span style={{ color: '#6b7280' }}>{metrics?.scheduleEfficiency.utilization.toFixed(1)}%</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                    {t('dashboard.qualityModal.utilizationDesc')}
                  </p>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: '#374151' }}>{t('dashboard.qualityModal.completionLabel')}</span>
                    <span style={{ color: '#6b7280' }}>{metrics?.scheduleEfficiency.taskCompletion}%</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                    {t('dashboard.qualityModal.completionDesc')}
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: '#374151' }}>{t('dashboard.qualityModal.conflictsLabel')}</span>
                    <span style={{ color: '#6b7280' }}>{t('dashboard.qualityModal.conflictsValue', { count: metrics?.scheduleEfficiency.conflicts })}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                    {t('dashboard.qualityModal.conflictsDesc')}
                  </p>
                </div>
              </div>

              <div style={{ padding: '12px', background: '#dbeafe', borderRadius: '8px', borderLeft: '4px solid #2563eb' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#1e40af', fontWeight: 500 }}>
                  <strong>{t('dashboard.qualityModal.formula')}</strong> {t('dashboard.qualityModal.formulaText')}
                </p>
              </div>
            </div>

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
                {t('dashboard.qualityModal.scoreRanges')}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '60px', padding: '4px 8px', background: '#d1fae5', color: '#059669', borderRadius: '4px', textAlign: 'center', fontSize: '12px', fontWeight: 600 }}>
                    80-100
                  </div>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>{t('dashboard.qualityModal.excellent')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '60px', padding: '4px 8px', background: '#fef3c7', color: '#d97706', borderRadius: '4px', textAlign: 'center', fontSize: '12px', fontWeight: 600 }}>
                    60-79
                  </div>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>{t('dashboard.qualityModal.good')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '60px', padding: '4px 8px', background: '#fee2e2', color: '#dc2626', borderRadius: '4px', textAlign: 'center', fontSize: '12px', fontWeight: 600 }}>
                    0-59
                  </div>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>{t('dashboard.qualityModal.needsAttention')}</span>
                </div>
              </div>
            </div>

            <Divider style={{ margin: '16px 0' }} />

            <div>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
                {t('dashboard.qualityModal.howToImprove')}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#10b981', fontSize: '16px' }}>✓</span>
                  <span style={{ fontSize: '13px', color: '#374151' }} dangerouslySetInnerHTML={{ __html: t('dashboard.qualityModal.tip1') }} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#10b981', fontSize: '16px' }}>✓</span>
                  <span style={{ fontSize: '13px', color: '#374151' }} dangerouslySetInnerHTML={{ __html: t('dashboard.qualityModal.tip2') }} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#10b981', fontSize: '16px' }}>✓</span>
                  <span style={{ fontSize: '13px', color: '#374151' }} dangerouslySetInnerHTML={{ __html: t('dashboard.qualityModal.tip3') }} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#10b981', fontSize: '16px' }}>✓</span>
                  <span style={{ fontSize: '13px', color: '#374151' }} dangerouslySetInnerHTML={{ __html: t('dashboard.qualityModal.tip4') }} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#10b981', fontSize: '16px' }}>✓</span>
                  <span style={{ fontSize: '13px', color: '#374151' }} dangerouslySetInnerHTML={{ __html: t('dashboard.qualityModal.tip5') }} />
                </div>
              </div>
            </div>
          </div>
        </Modal>

        {/* Maintenance Cost History Modal */}
        <Modal
          title="Maintenance Cost History"
          open={maintenanceCostModalVisible}
          onCancel={() => setMaintenanceCostModalVisible(false)}
          width={1100}
          footer={null}
          className="maintenance-cost-modal"
        >
          {maintenanceCostData && (
            <div>
              {/* Summary Cards */}
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                  <Card className="cost-summary-card" style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Cost</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                      ${(maintenanceCostData.summary?.totalCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>{maintenanceCostData.summary?.totalEvents || 0} events</div>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card className="cost-summary-card" style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Labor Cost</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                      ${(maintenanceCostData.summary?.totalLaborCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '14px', color: '#059669', fontWeight: 600 }}>
                      {maintenanceCostData.summary?.totalCost > 0
                        ? `${((maintenanceCostData.summary.totalLaborCost / maintenanceCostData.summary.totalCost) * 100).toFixed(0)}%`
                        : '0%'}
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card className="cost-summary-card" style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Parts Cost</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                      ${(maintenanceCostData.summary?.totalPartsCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '14px', color: '#059669', fontWeight: 600 }}>
                      {maintenanceCostData.summary?.totalCost > 0
                        ? `${((maintenanceCostData.summary.totalPartsCost / maintenanceCostData.summary.totalCost) * 100).toFixed(0)}%`
                        : '0%'}
                    </div>
                  </Card>
                </Col>
              </Row>

              {/* Monthly Trend Chart */}
              {maintenanceCostData.monthlyCostTrend && maintenanceCostData.monthlyCostTrend.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ marginBottom: 16, fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>Monthly Cost Trend</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={maintenanceCostData.monthlyCostTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12, fill: '#8c8c8c' }}
                        tickFormatter={(month) => moment(month).format('MMM YY')}
                      />
                      <YAxis tick={{ fontSize: 12, fill: '#8c8c8c' }} />
                      <Tooltip 
                        content={<CustomTooltip />}
                        labelFormatter={(month) => moment(month).format('MMMM YYYY')}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="cost" fill="#fecaca" stroke="#ef4444" strokeWidth={0} name="Total Cost" />
                      <Bar dataKey="laborCost" fill="#60a5fa" name="Labor" />
                      <Bar dataKey="partsCost" fill="#34d399" name="Parts" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Cost by Equipment Type */}
              {maintenanceCostData.costByEquipmentType && maintenanceCostData.costByEquipmentType.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ marginBottom: 16, fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>Cost by Equipment Type</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={maintenanceCostData.costByEquipmentType}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="type" tick={{ fontSize: 12, fill: '#8c8c8c' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#8c8c8c' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="cost" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Total Cost" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Monthly Breakdown Table */}
              {maintenanceCostData.monthlyCostTrend && maintenanceCostData.monthlyCostTrend.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ marginBottom: 16, fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>Monthly Breakdown</h4>
                  <Table
                    dataSource={maintenanceCostData.monthlyCostTrend.slice().reverse()}
                    columns={[
                      {
                        title: 'Month',
                        dataIndex: 'month',
                        key: 'month',
                        render: (month) => moment(month).format('MMM YYYY'),
                        width: 120
                      },
                      {
                        title: 'Events',
                        dataIndex: 'count',
                        key: 'count',
                        width: 80,
                        align: 'center'
                      },
                      {
                        title: 'Labor Cost',
                        dataIndex: 'laborCost',
                        key: 'laborCost',
                        render: (cost) => `$${(cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        align: 'right'
                      },
                      {
                        title: 'Parts Cost',
                        dataIndex: 'partsCost',
                        key: 'partsCost',
                        render: (cost) => `$${(cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        align: 'right'
                      },
                      {
                        title: 'Total Cost',
                        dataIndex: 'cost',
                        key: 'cost',
                        render: (cost) => (
                          <strong style={{ color: '#ef4444' }}>${(cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        ),
                        sorter: (a, b) => a.cost - b.cost,
                        align: 'right'
                      }
                    ]}
                    rowKey="month"
                    pagination={{ pageSize: 12, showSizeChanger: false }}
                    scroll={{ x: 600 }}
                    size="small"
                  />
                </div>
              )}

              {/* Top Equipment by Cost */}
              {maintenanceCostData.topEquipment && maintenanceCostData.topEquipment.length > 0 && (
                <div>
                  <h4 style={{ marginBottom: 16, fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>Top Equipment by Maintenance Cost</h4>
                  <Table
                    dataSource={maintenanceCostData.topEquipment}
                    columns={[
                      { 
                        title: 'Equipment ID', 
                        dataIndex: 'equipmentId', 
                        key: 'equipmentId',
                        width: 130
                      },
                      { 
                        title: 'Name', 
                        dataIndex: 'name', 
                        key: 'name'
                      },
                      { 
                        title: 'Type', 
                        dataIndex: 'type', 
                        key: 'type'
                      },
                      {
                        title: 'Total Cost',
                        dataIndex: 'cost',
                        key: 'cost',
                        render: (cost) => (
                          <strong style={{ color: '#ef4444' }}>${(cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        ),
                        sorter: (a, b) => a.cost - b.cost,
                        align: 'right'
                      },
                      { 
                        title: 'Events', 
                        dataIndex: 'count', 
                        key: 'count',
                        align: 'center',
                        width: 80
                      }
                    ]}
                    rowKey="equipmentId"
                    pagination={false}
                    size="small"
                  />
                </div>
              )}
            </div>
          )}
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

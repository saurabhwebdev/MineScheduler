import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Spin, DatePicker } from 'antd';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { DollarOutlined, ToolOutlined, ClockCircleOutlined } from '@ant-design/icons';
import moment from 'moment';
import config from '../config/config';
import './MaintenanceAnalytics.css';

const { RangePicker } = DatePicker;

const COLORS = {
  green: '#3cca70',
  blue: '#062d54',
  lightBlue: '#1890ff',
  orange: '#faad14',
  red: '#ff4d4f',
  purple: '#722ed1',
  cyan: '#13c2c2',
  gray: '#8c8c8c'
};

const CHART_COLORS = [COLORS.green, COLORS.blue, COLORS.lightBlue, COLORS.orange, COLORS.purple, COLORS.cyan];

const MaintenanceAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      let url = `${config.apiUrl}/maintenance-logs/analytics`;
      if (dateRange && dateRange.length === 2) {
        const params = new URLSearchParams({
          startDate: dateRange[0].toISOString(),
          endDate: dateRange[1].toISOString()
        });
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="tooltip-value" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading || !analytics) {
    return (
      <div className="analytics-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="maintenance-analytics">
      {/* Date Range Filter */}
      <div className="analytics-header">
        <h3>Analytics Dashboard</h3>
        <RangePicker
          value={dateRange}
          onChange={setDateRange}
          format="YYYY-MM-DD"
          style={{ width: 300 }}
        />
      </div>

      {/* KPI Cards */}
      <Row gutter={16} className="kpi-cards">
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon" style={{ background: '#e6f7ff', color: COLORS.lightBlue }}>
                <DollarOutlined />
              </div>
            </div>
            <div className="kpi-value">${(analytics.kpis.totalCost || 0).toLocaleString()}</div>
            <div className="kpi-label">Total Cost</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon" style={{ background: '#f6ffed', color: COLORS.green }}>
                <ToolOutlined />
              </div>
            </div>
            <div className="kpi-value">{analytics.kpis.totalEvents}</div>
            <div className="kpi-label">Total Events</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon" style={{ background: '#fff7e6', color: COLORS.orange }}>
                <DollarOutlined />
              </div>
            </div>
            <div className="kpi-value">${(analytics.kpis.avgCost || 0).toFixed(0)}</div>
            <div className="kpi-label">Avg Cost per Event</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon" style={{ background: '#fff1f0', color: COLORS.red }}>
                <ClockCircleOutlined />
              </div>
            </div>
            <div className="kpi-value">{(analytics.kpis.avgDuration || 0).toFixed(1)}h</div>
            <div className="kpi-label">Avg Repair Time</div>
          </Card>
        </Col>
      </Row>

      {/* Row 1: Cost by Equipment Type & Monthly Trend */}
      <Row gutter={16} className="charts-row">
        <Col xs={24} lg={12}>
          <Card className="chart-card">
            <div className="chart-header">
              <h3>Cost by Equipment Type</h3>
              <p className="chart-subtitle">Total maintenance cost breakdown</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.costByEquipmentType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cost" fill={COLORS.blue} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card className="chart-card">
            <div className="chart-header">
              <h3>Monthly Cost Trend</h3>
              <p className="chart-subtitle">Cost progression over time</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.monthlyCostTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => moment(value).format('MMM YY')}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="cost" 
                  stroke={COLORS.blue} 
                  strokeWidth={3}
                  dot={{ fill: COLORS.blue, r: 4 }}
                  name="Total Cost"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Row 2: Maintenance Type Distribution & Labor vs Parts */}
      <Row gutter={16} className="charts-row">
        <Col xs={24} lg={12}>
          <Card className="chart-card">
            <div className="chart-header">
              <h3>Maintenance Type Distribution</h3>
              <p className="chart-subtitle">Breakdown by maintenance category</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.maintenanceTypeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.maintenanceTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card className="chart-card">
            <div className="chart-header">
              <h3>Labor vs Parts Cost</h3>
              <p className="chart-subtitle">Cost breakdown analysis</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.laborVsParts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cost" radius={[8, 8, 0, 0]}>
                  {analytics.laborVsParts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.category === 'Labor' ? COLORS.green : COLORS.blue} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Row 3: Top 10 Most Expensive Equipment */}
      <Row gutter={16} className="charts-row">
        <Col xs={24}>
          <Card className="chart-card">
            <div className="chart-header">
              <h3>Top 10 Most Expensive Equipment</h3>
              <p className="chart-subtitle">Highest maintenance costs by equipment</p>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart 
                data={analytics.topEquipment} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis 
                  dataKey="equipmentId" 
                  type="category" 
                  tick={{ fontSize: 11 }}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cost" fill={COLORS.red} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Row 4: MTBF & MTTR */}
      <Row gutter={16} className="charts-row">
        <Col xs={24} lg={12}>
          <Card className="chart-card">
            <div className="chart-header">
              <h3>MTBF by Equipment Type</h3>
              <p className="chart-subtitle">Mean Time Between Failures (hours)</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.mtbfData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="mtbf" fill={COLORS.green} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card className="chart-card">
            <div className="chart-header">
              <h3>MTTR by Equipment Type</h3>
              <p className="chart-subtitle">Mean Time To Repair (hours)</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.mttrData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="mttr" fill={COLORS.orange} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Row 5: Overdue Maintenance */}
      {analytics.overdueData && analytics.overdueData.length > 0 && (
        <Row gutter={16} className="charts-row">
          <Col xs={24}>
            <Card className="chart-card">
              <div className="chart-header">
                <h3>Overdue Maintenance by Equipment Type</h3>
                <p className="chart-subtitle">Equipment requiring immediate attention</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.overdueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill={COLORS.red} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default MaintenanceAnalytics;

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Spin, DatePicker, Modal, Button, Divider, Tooltip as AntTooltip } from 'antd';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { DollarOutlined, ToolOutlined, ClockCircleOutlined, InfoCircleOutlined, BarChartOutlined, LineChartOutlined, PieChartOutlined } from '@ant-design/icons';
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
  const [activeModal, setActiveModal] = useState(null);

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
            <AntTooltip title="Click for detailed explanation and tips" placement="left">
              <Button
                type="text"
                icon={<InfoCircleOutlined />}
                className="card-info-button"
                onClick={() => setActiveModal('totalCost')}
                title="How is this calculated?"
              />
            </AntTooltip>
            <AntTooltip title="Sum of all maintenance costs" placement="bottom">
              <div className="kpi-header">
                <div className="kpi-icon" style={{ background: '#e6f7ff', color: COLORS.lightBlue }}>
                  <DollarOutlined />
                </div>
              </div>
              <div className="kpi-value">${(analytics.kpis.totalCost || 0).toLocaleString()}</div>
              <div className="kpi-label">Total Cost</div>
            </AntTooltip>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card">
            <AntTooltip title="Click for detailed explanation and tips" placement="left">
              <Button
                type="text"
                icon={<InfoCircleOutlined />}
                className="card-info-button"
                onClick={() => setActiveModal('totalEvents')}
                title="How is this calculated?"
              />
            </AntTooltip>
            <AntTooltip title="Total number of maintenance events" placement="bottom">
              <div className="kpi-header">
                <div className="kpi-icon" style={{ background: '#f6ffed', color: COLORS.green }}>
                  <ToolOutlined />
                </div>
              </div>
              <div className="kpi-value">{analytics.kpis.totalEvents}</div>
              <div className="kpi-label">Total Events</div>
            </AntTooltip>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card">
            <AntTooltip title="Click for detailed explanation and tips" placement="left">
              <Button
                type="text"
                icon={<InfoCircleOutlined />}
                className="card-info-button"
                onClick={() => setActiveModal('avgCost')}
                title="How is this calculated?"
              />
            </AntTooltip>
            <AntTooltip title="Average maintenance cost per event" placement="bottom">
              <div className="kpi-header">
                <div className="kpi-icon" style={{ background: '#fff7e6', color: COLORS.orange }}>
                  <DollarOutlined />
                </div>
              </div>
              <div className="kpi-value">${(analytics.kpis.avgCost || 0).toFixed(0)}</div>
              <div className="kpi-label">Avg Cost per Event</div>
            </AntTooltip>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card">
            <AntTooltip title="Click for detailed explanation and tips" placement="left">
              <Button
                type="text"
                icon={<InfoCircleOutlined />}
                className="card-info-button"
                onClick={() => setActiveModal('avgDuration')}
                title="How is this calculated?"
              />
            </AntTooltip>
            <AntTooltip title="Average time to complete maintenance" placement="bottom">
              <div className="kpi-header">
                <div className="kpi-icon" style={{ background: '#fff1f0', color: COLORS.red }}>
                  <ClockCircleOutlined />
                </div>
              </div>
              <div className="kpi-value">{(analytics.kpis.avgDuration || 0).toFixed(1)}h</div>
              <div className="kpi-label">Avg Repair Time</div>
            </AntTooltip>
          </Card>
        </Col>
      </Row>

      {/* Row 1: Cost by Equipment Type & Monthly Trend */}
      <Row gutter={16} className="charts-row">
        <Col xs={24} lg={12}>
          <Card className="chart-card">
            <Button
              type="text"
              icon={<InfoCircleOutlined />}
              className="chart-info-button"
              onClick={() => setActiveModal('costByType')}
              title="How is this calculated?"
            />
            <AntTooltip title="Click the info button for detailed explanation" placement="top">
              <div className="chart-header">
                <h3>Cost by Equipment Type</h3>
                <p className="chart-subtitle">Total maintenance cost breakdown</p>
              </div>
            </AntTooltip>
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
            <Button
              type="text"
              icon={<InfoCircleOutlined />}
              className="chart-info-button"
              onClick={() => setActiveModal('monthlyTrend')}
              title="How is this calculated?"
            />
            <AntTooltip title="Click the info button for detailed explanation" placement="top">
              <div className="chart-header">
                <h3>Monthly Cost Trend</h3>
                <p className="chart-subtitle">Cost progression over time</p>
              </div>
            </AntTooltip>
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
            <Button
              type="text"
              icon={<InfoCircleOutlined />}
              className="chart-info-button"
              onClick={() => setActiveModal('typeDistribution')}
              title="How is this calculated?"
            />
            <AntTooltip title="Click the info button for detailed explanation" placement="top">
              <div className="chart-header">
                <h3>Maintenance Type Distribution</h3>
                <p className="chart-subtitle">Breakdown by maintenance category</p>
              </div>
            </AntTooltip>
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
            <Button
              type="text"
              icon={<InfoCircleOutlined />}
              className="chart-info-button"
              onClick={() => setActiveModal('laborVsParts')}
              title="How is this calculated?"
            />
            <AntTooltip title="Click the info button for detailed explanation" placement="top">
              <div className="chart-header">
                <h3>Labor vs Parts Cost</h3>
                <p className="chart-subtitle">Cost breakdown analysis</p>
              </div>
            </AntTooltip>
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
            <Button
              type="text"
              icon={<InfoCircleOutlined />}
              className="chart-info-button"
              onClick={() => setActiveModal('topEquipment')}
              title="How is this calculated?"
            />
            <AntTooltip title="Click the info button for detailed explanation" placement="top">
              <div className="chart-header">
                <h3>Top 10 Most Expensive Equipment</h3>
                <p className="chart-subtitle">Highest maintenance costs by equipment</p>
              </div>
            </AntTooltip>
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
            <Button
              type="text"
              icon={<InfoCircleOutlined />}
              className="chart-info-button"
              onClick={() => setActiveModal('mtbf')}
              title="How is this calculated?"
            />
            <AntTooltip title="Click the info button for detailed explanation" placement="top">
              <div className="chart-header">
                <h3>MTBF by Equipment Type</h3>
                <p className="chart-subtitle">Mean Time Between Failures (hours)</p>
              </div>
            </AntTooltip>
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
            <Button
              type="text"
              icon={<InfoCircleOutlined />}
              className="chart-info-button"
              onClick={() => setActiveModal('mttr')}
              title="How is this calculated?"
            />
            <AntTooltip title="Click the info button for detailed explanation" placement="top">
              <div className="chart-header">
                <h3>MTTR by Equipment Type</h3>
                <p className="chart-subtitle">Mean Time To Repair (hours)</p>
              </div>
            </AntTooltip>
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
              <Button
                type="text"
                icon={<InfoCircleOutlined />}
                className="chart-info-button"
                onClick={() => setActiveModal('overdue')}
                title="How is this calculated?"
              />
              <AntTooltip title="Click the info button for detailed explanation" placement="top">
                <div className="chart-header">
                  <h3>Overdue Maintenance by Equipment Type</h3>
                  <p className="chart-subtitle">Equipment requiring immediate attention</p>
                </div>
              </AntTooltip>
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

      {/* Info Modals */}
      {renderInfoModal()}
    </div>
  );

  function renderInfoModal() {
    const modalContent = {
      totalCost: {
        title: 'Total Cost',
        icon: <DollarOutlined style={{ color: '#1890ff' }} />,
        description: 'Sum of all maintenance costs within the selected date range. Includes both labor and parts expenses.',
        calculation: 'Total Cost = Sum of (Labor Cost + Parts Cost) for all maintenance events',
        formula: 'Labor Cost = Hours Worked × Hourly Rate\nParts Cost = Sum of all parts expenses',
        improve: [
          'Schedule preventive maintenance to reduce costly emergency repairs',
          'Negotiate bulk parts purchases to reduce parts costs',
          'Train technicians to improve repair efficiency and reduce labor hours',
          'Track warranty coverage to avoid paying for covered repairs',
          'Compare costs across equipment types to identify problem assets'
        ]
      },
      totalEvents: {
        title: 'Total Events',
        icon: <ToolOutlined style={{ color: '#3cca70' }} />,
        description: 'Total number of maintenance events (preventive, corrective, breakdown) recorded within the selected date range.',
        calculation: 'Count of all maintenance log entries in the selected period',
        formula: 'Total Events = Preventive + Corrective + Breakdown + Emergency maintenance records',
        improve: [
          'Increase preventive maintenance to reduce breakdown events',
          'Implement condition-based monitoring to predict failures',
          'Review equipment with high event counts for replacement',
          'Standardize maintenance procedures to improve quality',
          'Track event types to identify improvement opportunities'
        ]
      },
      avgCost: {
        title: 'Average Cost per Event',
        icon: <DollarOutlined style={{ color: '#faad14' }} />,
        description: 'Average maintenance cost per event. Lower values indicate more efficient maintenance operations.',
        calculation: 'Total maintenance cost divided by total number of events',
        formula: 'Avg Cost = Total Cost ÷ Total Events',
        improve: [
          'Increase preventive maintenance ratio (typically cheaper than corrective)',
          'Maintain parts inventory to reduce emergency procurement costs',
          'Train staff to handle common repairs in-house',
          'Negotiate service contracts with vendors for predictable costs',
          'Use standardized parts across equipment types when possible'
        ]
      },
      avgDuration: {
        title: 'Average Repair Time',
        icon: <ClockCircleOutlined style={{ color: '#ff4d4f' }} />,
        description: 'Average time (hours) to complete maintenance events. Lower values mean faster repairs and less equipment downtime.',
        calculation: 'Sum of all repair durations divided by number of events',
        formula: 'Avg Repair Time = Sum of (Repair End Time - Repair Start Time) ÷ Total Events',
        improve: [
          'Maintain organized parts inventory for quick access',
          'Provide technician training on common repairs',
          'Use standardized repair procedures and checklists',
          'Pre-stage tools and parts before scheduled maintenance',
          'Analyze high-duration repairs to identify bottlenecks'
        ]
      },
      costByType: {
        title: 'Cost by Equipment Type',
        icon: <BarChartOutlined style={{ color: '#062d54' }} />,
        description: 'Bar chart showing total maintenance costs grouped by equipment type (Drill, Truck, Loader, etc.).',
        calculation: 'Aggregates all maintenance costs for equipment within each type category',
        formula: 'For each equipment type: Sum all maintenance costs for equipment of that type',
        improve: [
          'Focus preventive maintenance on high-cost equipment types',
          'Evaluate ROI for replacing vs. repairing high-cost equipment',
          'Compare costs to industry benchmarks for your equipment fleet',
          'Consider extended warranties or service contracts for expensive types',
          'Review if certain types need operator retraining to reduce damage'
        ]
      },
      monthlyTrend: {
        title: 'Monthly Cost Trend',
        icon: <LineChartOutlined style={{ color: '#062d54' }} />,
        description: 'Line chart showing maintenance cost trends over time. Helps identify seasonal patterns and cost escalation.',
        calculation: 'Groups all maintenance costs by month and displays chronologically',
        formula: 'For each month: Sum of all maintenance costs in that month',
        improve: [
          'Investigate months with cost spikes to identify root causes',
          'Plan preventive maintenance during low-utilization periods',
          'Budget based on historical trends and seasonal variations',
          'Track if cost reduction initiatives show improvement over time',
          'Identify gradual cost increases that may indicate aging equipment'
        ]
      },
      typeDistribution: {
        title: 'Maintenance Type Distribution',
        icon: <PieChartOutlined style={{ color: '#3cca70' }} />,
        description: 'Pie chart showing proportion of different maintenance types: Preventive, Corrective, Breakdown, etc.',
        calculation: 'Counts maintenance events by type and calculates percentage of total',
        formula: 'Type % = (Events of Type ÷ Total Events) × 100',
        improve: [
          'Target 60-70% preventive maintenance for optimal fleet health',
          'Reduce breakdown maintenance through better preventive scheduling',
          'Track improvement in ratio over time as you optimize maintenance',
          'High breakdown % indicates reactive maintenance culture - improve planning',
          'Use condition monitoring to shift from time-based to condition-based maintenance'
        ]
      },
      laborVsParts: {
        title: 'Labor vs Parts Cost',
        icon: <BarChartOutlined style={{ color: '#3cca70' }} />,
        description: 'Compares total labor costs vs. parts costs. Helps identify if issues are labor-intensive or parts-intensive.',
        calculation: 'Sums all labor costs separately from all parts costs',
        formula: 'Labor Cost = Sum(Hours × Hourly Rate)\nParts Cost = Sum of all parts expenses',
        improve: [
          'High labor costs: Consider technician training or better diagnostic tools',
          'High parts costs: Negotiate vendor contracts or buy in bulk',
          'Balance ratio is typically 50-60% labor, 40-50% parts',
          'Extreme imbalance may indicate inefficiency in one area',
          'Track ratio changes over time to measure improvement initiatives'
        ]
      },
      topEquipment: {
        title: 'Top 10 Most Expensive Equipment',
        icon: <BarChartOutlined style={{ color: '#ff4d4f' }} />,
        description: 'Horizontal bar chart ranking equipment by total maintenance cost. Identifies problem equipment consuming most resources.',
        calculation: 'Aggregates all maintenance costs by equipment ID, then sorts descending',
        formula: 'For each equipment: Sum all maintenance costs, then rank top 10',
        improve: [
          'Investigate top equipment for recurring issues or operator problems',
          'Calculate repair-vs-replace break-even for high-cost equipment',
          'Assign best operators to problem equipment to reduce damage',
          'Consider extended warranties or total care contracts for chronic issues',
          'Track if specific equipment types dominate the list - fleet composition issue'
        ]
      },
      mtbf: {
        title: 'MTBF (Mean Time Between Failures)',
        icon: <BarChartOutlined style={{ color: '#3cca70' }} />,
        description: 'Average operating hours between failures for each equipment type. Higher MTBF = more reliable equipment.',
        calculation: 'Total operating hours divided by number of failures',
        formula: 'MTBF = Total Operating Hours ÷ Number of Failures',
        improve: [
          'Low MTBF indicates reliability issues - increase preventive maintenance frequency',
          'Compare to manufacturer specifications or industry benchmarks',
          'Investigate root causes for equipment types with declining MTBF',
          'Consider replacement if MTBF is significantly below expected',
          'Track MTBF trends to validate effectiveness of maintenance improvements'
        ]
      },
      mttr: {
        title: 'MTTR (Mean Time To Repair)',
        icon: <BarChartOutlined style={{ color: '#faad14' }} />,
        description: 'Average time (hours) to complete repairs for each equipment type. Lower MTTR = faster repairs and less downtime.',
        calculation: 'Sum of all repair durations divided by number of repairs',
        formula: 'MTTR = Sum of Repair Durations ÷ Number of Repairs',
        improve: [
          'Maintain parts inventory for equipment with high MTTR',
          'Provide specialized training for complex equipment types',
          'Pre-stage tools and create repair kits for common failures',
          'Consider backup equipment for types with high MTTR',
          'Analyze high-MTTR events to identify process improvements'
        ]
      },
      overdue: {
        title: 'Overdue Maintenance',
        icon: <BarChartOutlined style={{ color: '#ff4d4f' }} />,
        description: 'Count of equipment past their scheduled maintenance date, grouped by type. Critical indicator of maintenance backlog.',
        calculation: 'Counts equipment where current date > next scheduled maintenance date',
        formula: 'For each type: Count equipment where Next Maintenance Date < Today',
        improve: [
          'Address overdue maintenance immediately - leads to breakdowns and safety issues',
          'Increase maintenance crew capacity if consistently overdue',
          'Prioritize by criticality - production equipment before support equipment',
          'Review if maintenance intervals are realistic for operational demands',
          'Set up automated alerts 7-14 days before maintenance due dates'
        ]
      }
    };

    const content = modalContent[activeModal];
    if (!content) return null;

    return (
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {content.icon}
            <span>{content.title} Explained</span>
          </div>
        }
        open={!!activeModal}
        onCancel={() => setActiveModal(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setActiveModal(null)}>
            Got it!
          </Button>
        ]}
        width={700}
        className="modern-modal quality-info-modal"
      >
        <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
              What is {content.title}?
            </p>
            <p style={{ color: '#6b7280', margin: 0 }}>
              {content.description}
            </p>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
              How is it Calculated?
            </p>
            <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#374151' }}>
                {content.calculation}
              </p>
            </div>
            <div style={{ padding: '12px', background: '#dbeafe', borderRadius: '8px', borderLeft: '4px solid #2563eb' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#1e40af', fontWeight: 500, whiteSpace: 'pre-line' }}>
                <strong>Formula:</strong> {content.formula}
              </p>
            </div>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          <div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
              💡 How to Improve This Metric
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {content.improve.map((tip, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#3cca70', fontSize: '16px' }}>✓</span>
                  <span style={{ fontSize: '13px', color: '#374151' }}>
                    {tip}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    );
  }
};

export default MaintenanceAnalytics;

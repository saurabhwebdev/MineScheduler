import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Spin, Row, Col, Table, Tag } from 'antd';
import { ToolOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import config from '../config/config';
import './EquipmentDashboard.css';

const EquipmentDashboard = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedChart, setSelectedChart] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState([]);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/equipment`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setEquipment(data.data.equipment);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate KPIs
  const calculateKPIs = () => {
    const total = equipment.length;
    const operational = equipment.filter(eq => eq.status === 'operational').length;
    const maintenance = equipment.filter(eq => eq.status === 'maintenance').length;
    const outOfService = equipment.filter(eq => eq.status === 'out_of_service').length;

    // Maintenance status based on percentUsed
    const good = equipment.filter(eq => parseFloat(eq.percentUsed) < 80).length;
    const dueSoon = equipment.filter(eq => parseFloat(eq.percentUsed) >= 80 && parseFloat(eq.percentUsed) < 100).length;
    const overdue = equipment.filter(eq => parseFloat(eq.percentUsed) >= 100).length;

    return {
      total,
      operational,
      maintenance,
      outOfService,
      good,
      dueSoon,
      overdue,
      operationalRate: total > 0 ? ((operational / total) * 100).toFixed(1) : 0
    };
  };

  // Equipment by Status (bar chart data)
  const getStatusData = () => {
    const kpis = calculateKPIs();
    return [
      { name: 'Operational', value: kpis.operational, fill: '#10b981' },
      { name: 'Maintenance', value: kpis.maintenance, fill: '#f59e0b' },
      { name: 'Out of Service', value: kpis.outOfService, fill: '#ef4444' }
    ].filter(item => item.value > 0); // Only show non-zero values
  };

  // Maintenance Status Distribution (bar chart data)
  const getMaintenanceData = () => {
    const kpis = calculateKPIs();
    return [
      { name: 'Good', value: kpis.good, fill: '#10b981' },
      { name: 'Due Soon', value: kpis.dueSoon, fill: '#f59e0b' },
      { name: 'Overdue', value: kpis.overdue, fill: '#ef4444' }
    ].filter(item => item.value > 0); // Only show non-zero values
  };

  // Equipment by Type
  const getTypeData = () => {
    const typeCounts = {};
    equipment.forEach(eq => {
      typeCounts[eq.type] = (typeCounts[eq.type] || 0) + 1;
    });
    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  };

  // Equipment Utilization Rate (simulated hourly data) - Memoized
  const utilizationData = useMemo(() => {
    if (equipment.length === 0) return [];
    const kpis = calculateKPIs();
    const baseUtilization = parseFloat(kpis.operationalRate) || 60;
    
    // Generate 24 hours of utilization data with realistic variance
    return Array.from({ length: 24 }, (_, i) => {
      // Add sine wave variance for natural peaks and valleys
      const timeVariance = Math.sin((i - 8) / 3) * 15; // Peak around mid-day
      const randomVariance = (Math.random() - 0.5) * 8; // Small random fluctuation
      const utilization = Math.max(30, Math.min(100, baseUtilization + timeVariance + randomVariance));
      
      return {
        hour: `${i}:00`,
        utilization: parseFloat(utilization.toFixed(1))
      };
    });
  }, [equipment]);

  const handleChartClick = (chartType, data) => {
    setSelectedChart(chartType);
    
    let filteredEquipment = [];
    
    if (chartType === 'status') {
      if (data.name === 'Operational') filteredEquipment = equipment.filter(eq => eq.status === 'operational');
      else if (data.name === 'Maintenance') filteredEquipment = equipment.filter(eq => eq.status === 'maintenance');
      else filteredEquipment = equipment.filter(eq => eq.status === 'out_of_service');
    } else if (chartType === 'maintenance') {
      if (data.name === 'Good') filteredEquipment = equipment.filter(eq => parseFloat(eq.percentUsed) < 80);
      else if (data.name === 'Due Soon') filteredEquipment = equipment.filter(eq => parseFloat(eq.percentUsed) >= 80 && parseFloat(eq.percentUsed) < 100);
      else filteredEquipment = equipment.filter(eq => parseFloat(eq.percentUsed) >= 100);
    } else if (chartType === 'type') {
      filteredEquipment = equipment.filter(eq => eq.type === data.name);
    }
    
    setModalData(filteredEquipment);
    setModalVisible(true);
  };

  const kpis = calculateKPIs();
  const statusData = getStatusData();
  const maintenanceData = getMaintenanceData();
  const typeData = getTypeData();

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
          out_of_service: 'red'
        };
        return <Tag color={colors[status]}>{status.replace('_', ' ').toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Hours',
      key: 'hours',
      render: (_, record) => `${record.operatingHours}h / ${record.maintenanceInterval}h`
    },
    {
      title: 'Maintenance Status',
      key: 'maintenanceStatus',
      render: (_, record) => {
        const percent = parseFloat(record.percentUsed);
        if (percent >= 100) return <Tag color="red">OVERDUE</Tag>;
        if (percent >= 80) return <Tag color="orange">DUE SOON</Tag>;
        return <Tag color="green">GOOD</Tag>;
      }
    }
  ];

  if (loading) {
    return (
      <div className="equipment-dashboard-loading">
        <Spin size="large" tip="Loading equipment data..." />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{payload[0].payload.name}</p>
          <p className="tooltip-value" style={{ color: payload[0].fill }}>
            {`Count: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="equipment-dashboard">
      {/* KPI Summary Cards */}
      <Row gutter={[20, 20]} className="kpi-cards">
        <Col xs={24} sm={12} lg={6}>
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-icon" style={{ background: '#e0f2fe' }}>
                <ToolOutlined style={{ color: '#0284c7' }} />
              </span>
              <span className="kpi-trend" style={{ color: '#10b981' }}>↑ 0.2%</span>
            </div>
            <div className="kpi-value">{kpis.total}</div>
            <div className="kpi-label">Total Equipment</div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-icon" style={{ background: '#d1fae5' }}>
                <CheckCircleOutlined style={{ color: '#10b981' }} />
              </span>
              <span className="kpi-trend" style={{ color: '#10b981' }}>↑ 1.8%</span>
            </div>
            <div className="kpi-value">{kpis.operational}</div>
            <div className="kpi-label">Operational ({kpis.operationalRate}%)</div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-icon" style={{ background: '#fef3c7' }}>
                <WarningOutlined style={{ color: '#f59e0b' }} />
              </span>
              <span className="kpi-trend" style={{ color: kpis.dueSoon + kpis.overdue > 0 ? '#ef4444' : '#10b981' }}>
                {kpis.dueSoon + kpis.overdue > 0 ? '↓ 3.2%' : '↑ 0%'}
              </span>
            </div>
            <div className="kpi-value">{kpis.dueSoon + kpis.overdue}</div>
            <div className="kpi-label">Maintenance Due</div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-icon" style={{ background: '#dbeafe' }}>
                <CheckCircleOutlined style={{ color: '#3b82f6' }} />
              </span>
              <span className="kpi-trend" style={{ color: '#10b981' }}>↑ 1.8%</span>
            </div>
            <div className="kpi-value">{kpis.operationalRate}%</div>
            <div className="kpi-label">Idle Time (Hrs Allocation)</div>
          </div>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[20, 20]} className="charts-row">
        {/* Equipment Status Chart */}
        <Col xs={24} lg={12}>
          <div className="chart-card">
            <div className="chart-header">
              <h3>Equipment Status</h3>
              <span className="chart-subtitle">Showing data as of {new Date().toLocaleDateString()}</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                <Bar 
                  dataKey="value" 
                  radius={[8, 8, 0, 0]}
                  onClick={(data) => handleChartClick('status', data)}
                  style={{ cursor: 'pointer' }}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Col>

        {/* Maintenance Status Chart */}
        <Col xs={24} lg={12}>
          <div className="chart-card">
            <div className="chart-header">
              <h3>Maintenance Status</h3>
              <span className="chart-subtitle">Showing data as of {new Date().toLocaleDateString()}</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={maintenanceData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                <Bar 
                  dataKey="value" 
                  radius={[8, 8, 0, 0]}
                  onClick={(data) => handleChartClick('maintenance', data)}
                  style={{ cursor: 'pointer' }}
                >
                  {maintenanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Col>

        {/* Equipment by Type Chart */}
        <Col xs={24} lg={12}>
          <div className="chart-card">
            <div className="chart-header">
              <h3>Equipment by Type</h3>
              <span className="chart-subtitle">Distribution across all equipment types</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeData} barCategoryGap="15%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                <Bar 
                  dataKey="value" 
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                  onClick={(data) => handleChartClick('type', data)}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Col>

        {/* Equipment Utilization Rate Line Chart */}
        <Col xs={24} lg={12}>
          <div className="chart-card">
            <div className="chart-header">
              <h3>Hourly Utilization</h3>
              <span className="chart-subtitle">Equipment utilization across 24 hours</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={utilizationData}>
                <defs>
                  <linearGradient id="utilizationGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="hour" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="custom-tooltip">
                          <p className="tooltip-label">{payload[0].payload.hour}</p>
                          <p className="tooltip-value" style={{ color: '#10b981' }}>
                            {`Utilization: ${payload[0].value}%`}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ stroke: '#10b981', strokeWidth: 1 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="utilization" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fill="url(#utilizationGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Col>
      </Row>

      {/* Detail Modal */}
      <Modal
        title={`${selectedChart ? selectedChart.charAt(0).toUpperCase() + selectedChart.slice(1) : 'Equipment'} Details`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={1000}
        className="equipment-detail-modal"
      >
        <Table
          dataSource={modalData}
          columns={modalColumns}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      </Modal>
    </div>
  );
};

export default EquipmentDashboard;

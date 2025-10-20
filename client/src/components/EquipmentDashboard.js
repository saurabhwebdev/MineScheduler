import React, { useState, useEffect } from 'react';
import { Modal, Spin, Card, Statistic, Row, Col, Table, Tag } from 'antd';
import { ToolOutlined, CheckCircleOutlined, WarningOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

  // Equipment by Status
  const getStatusData = () => {
    const kpis = calculateKPIs();
    return [
      { name: 'Operational', value: kpis.operational, color: '#52c41a' },
      { name: 'Maintenance', value: kpis.maintenance, color: '#faad14' },
      { name: 'Out of Service', value: kpis.outOfService, color: '#ff4d4f' }
    ];
  };

  // Maintenance Status Distribution
  const getMaintenanceData = () => {
    const kpis = calculateKPIs();
    return [
      { name: 'Good', value: kpis.good, color: '#52c41a' },
      { name: 'Due Soon', value: kpis.dueSoon, color: '#faad14' },
      { name: 'Overdue', value: kpis.overdue, color: '#ff4d4f' }
    ];
  };

  // Equipment by Type
  const getTypeData = () => {
    const typeCounts = {};
    equipment.forEach(eq => {
      typeCounts[eq.type] = (typeCounts[eq.type] || 0) + 1;
    });
    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  };

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

  return (
    <div className="equipment-dashboard">
      {/* KPI Summary Cards */}
      <Row gutter={[16, 16]} className="kpi-cards">
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card">
            <Statistic
              title="Total Equipment"
              value={kpis.total}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card">
            <Statistic
              title="Operational"
              value={kpis.operational}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix={`/ ${kpis.total}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card">
            <Statistic
              title="Maintenance Due"
              value={kpis.dueSoon + kpis.overdue}
              prefix={<WarningOutlined />}
              valueStyle={{ color: kpis.dueSoon + kpis.overdue > 0 ? '#faad14' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card">
            <Statistic
              title="Operational Rate"
              value={kpis.operationalRate}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: kpis.operationalRate >= 80 ? '#52c41a' : '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} className="charts-row">
        {/* Equipment Status Chart */}
        <Col xs={24} lg={12}>
          <Card 
            title="Equipment Status Distribution" 
            className="chart-card"
            extra={<span className="chart-hint">Click to view details</span>}
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={(data) => handleChartClick('status', data)}
                  style={{ cursor: 'pointer' }}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Maintenance Status Chart */}
        <Col xs={24} lg={12}>
          <Card 
            title="Maintenance Status" 
            className="chart-card"
            extra={<span className="chart-hint">Click to view details</span>}
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={maintenanceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={(data) => handleChartClick('maintenance', data)}
                  style={{ cursor: 'pointer' }}
                >
                  {maintenanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Equipment by Type Chart */}
        <Col xs={24}>
          <Card 
            title="Equipment by Type" 
            className="chart-card"
            extra={<span className="chart-hint">Click bars to view details</span>}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="value" 
                  fill="#1890ff" 
                  name="Count"
                  onClick={(data) => handleChartClick('type', data)}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
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

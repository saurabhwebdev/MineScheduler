import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, notification, Spin, Progress, Tabs } from 'antd';
import { ToolOutlined, CheckCircleOutlined, WarningOutlined, CloseCircleOutlined, ReloadOutlined, CalendarOutlined, TableOutlined } from '@ant-design/icons';
import DashboardLayout from '../components/DashboardLayout';
import MaintenanceGrid from '../components/MaintenanceGrid';
import config from '../config/config';
import './Maintenance.css';

const Maintenance = () => {
  const [loading, setLoading] = useState(false);
  const [maintenanceData, setMaintenanceData] = useState(null);

  useEffect(() => {
    fetchMaintenanceData();
  }, []);

  const fetchMaintenanceData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/maintenance/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setMaintenanceData(data.data);
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to fetch maintenance data',
        });
      }
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to fetch maintenance data',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetMaintenance = async (equipmentId, equipmentName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/maintenance/equipment/${equipmentId}/reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        notification.success({
          message: 'Success',
          description: `Maintenance reset for ${equipmentName}`,
          duration: 2
        });
        fetchMaintenanceData();
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to reset maintenance',
        });
      }
    } catch (error) {
      console.error('Error resetting maintenance:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to reset maintenance',
      });
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'operational': { color: 'green', text: 'Operational' },
      'maintenance': { color: 'orange', text: 'In Maintenance' },
      'out-of-service': { color: 'red', text: 'Out of Service' }
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getMaintenanceTag = (maintenanceStatus) => {
    const statusMap = {
      'good': { color: 'green', icon: <CheckCircleOutlined />, text: 'Good' },
      'due-soon': { color: 'orange', icon: <WarningOutlined />, text: 'Due Soon' },
      'overdue': { color: 'red', icon: <CloseCircleOutlined />, text: 'Overdue' },
      'unknown': { color: 'default', text: 'Unknown' }
    };
    const config = statusMap[maintenanceStatus] || { color: 'default', text: maintenanceStatus };
    return (
      <Tag icon={config.icon} color={config.color}>
        {config.text}
      </Tag>
    );
  };

  const columns = [
    {
      title: 'Equipment ID',
      dataIndex: 'equipmentId',
      key: 'equipmentId',
      fixed: 'left',
      width: 120,
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 150
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Operating Hours',
      dataIndex: 'operatingHours',
      key: 'operatingHours',
      width: 130,
      render: (hours) => `${hours} hrs`
    },
    {
      title: 'Maintenance Interval',
      dataIndex: 'maintenanceInterval',
      key: 'maintenanceInterval',
      width: 160,
      render: (interval) => `${interval} hrs`
    },
    {
      title: 'Usage',
      key: 'usage',
      width: 200,
      render: (_, record) => (
        <div>
          <Progress 
            percent={parseFloat(record.percentUsed)} 
            status={record.maintenanceStatus === 'overdue' ? 'exception' : 
                    record.maintenanceStatus === 'due-soon' ? 'active' : 'normal'}
            size="small"
          />
          <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
            {record.hoursUntilMaintenance !== null 
              ? `${record.hoursUntilMaintenance} hrs remaining`
              : 'No data'}
          </div>
        </div>
      )
    },
    {
      title: 'Maintenance Status',
      dataIndex: 'maintenanceStatus',
      key: 'maintenanceStatus',
      width: 150,
      render: (status) => getMaintenanceTag(status)
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<ToolOutlined />}
          onClick={() => handleResetMaintenance(record._id, record.name)}
          disabled={record.status === 'out-of-service'}
        >
          Reset
        </Button>
      )
    }
  ];

  return (
    <DashboardLayout
      title="Maintenance"
      subtitle="Equipment maintenance tracking and management"
    >
      <div className="maintenance-container">
        {/* Statistics Cards */}
        {maintenanceData && (
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Equipment"
                  value={maintenanceData.stats.total}
                  prefix={<ToolOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Operational"
                  value={maintenanceData.stats.operational}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Due Soon"
                  value={maintenanceData.stats.dueSoon}
                  valueStyle={{ color: '#fa8c16' }}
                  prefix={<WarningOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Overdue"
                  value={maintenanceData.stats.overdue}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<CloseCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Equipment Tabs - Table and Grid Views */}
        <Card 
          title="Equipment Maintenance Overview"
          extra={
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchMaintenanceData}
              loading={loading}
            >
              Refresh
            </Button>
          }
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spin size="large" tip="Loading maintenance data..." />
            </div>
          ) : (
            <Tabs
              defaultActiveKey="table"
              items={[
                {
                  key: 'table',
                  label: (
                    <span>
                      <TableOutlined /> Table View
                    </span>
                  ),
                  children: (
                    <Table
                      columns={columns}
                      dataSource={maintenanceData?.equipment || []}
                      rowKey="_id"
                      scroll={{ x: 1400 }}
                      pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} equipment`
                      }}
                    />
                  )
                },
                {
                  key: 'grid',
                  label: (
                    <span>
                      <CalendarOutlined /> Timeline View
                    </span>
                  ),
                  children: (
                    <MaintenanceGrid equipment={maintenanceData?.equipment || []} />
                  )
                }
              ]}
            />
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Maintenance;

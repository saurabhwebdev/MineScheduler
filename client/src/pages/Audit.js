import React, { useState, useEffect } from 'react';
import { Table, Modal, Descriptions, message } from 'antd';
import axios from 'axios';
import moment from 'moment';
import DashboardLayout from '../components/DashboardLayout';
import config from '../config/config';
import './Audit.css';

const Audit = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    module: null,
    action: null,
    dateRange: null
  });
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Fetch audit logs
  const fetchAuditLogs = async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = {
        page,
        limit: pagination.pageSize,
        ...(filters.search && { search: filters.search }),
        ...(filters.module && { module: filters.module }),
        ...(filters.action && { action: filters.action }),
        ...(filters.dateRange && filters.dateRange[0] && { 
          startDate: filters.dateRange[0].toISOString(),
          endDate: filters.dateRange[1].toISOString()
        })
      };

      const response = await axios.get(`${config.apiUrl}/audit`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.status === 'success') {
        setAuditLogs(response.data.data.auditLogs);
        setPagination({
          ...pagination,
          current: response.data.page,
          total: response.data.total
        });
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      message.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [filters]);

  const handleRowClick = (record) => {
    setSelectedAudit(record);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedAudit(null);
  };

  const renderChanges = () => {
    if (!selectedAudit) return null;

    if (selectedAudit.action === 'CREATE') {
      return (
        <div className="audit-changes">
          <h4>New Values:</h4>
          <pre>{JSON.stringify(selectedAudit.newValues, null, 2)}</pre>
        </div>
      );
    } else if (selectedAudit.action === 'DELETE') {
      return (
        <div className="audit-changes">
          <h4>Deleted Values:</h4>
          <pre>{JSON.stringify(selectedAudit.oldValues, null, 2)}</pre>
        </div>
      );
    } else if (selectedAudit.action === 'UPDATE') {
      return (
        <div className="audit-changes">
          <h4>Changes Made:</h4>
          {Object.keys(selectedAudit.changes || {}).length > 0 ? (
            <table className="changes-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Old Value</th>
                  <th>New Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(selectedAudit.changes).map(([field, change]) => (
                  <tr key={field}>
                    <td><strong>{field}</strong></td>
                    <td>{JSON.stringify(change.old)}</td>
                    <td>{JSON.stringify(change.new)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No changes detected</p>
          )}
        </div>
      );
    }
    return null;
  };


  const columns = [
    {
      title: 'TIMESTAMP',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => moment(timestamp).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    },
    {
      title: 'USER',
      dataIndex: 'userName',
      key: 'userName',
      render: (name) => name
    },
    {
      title: 'ACTION',
      dataIndex: 'action',
      key: 'action',
      render: (action) => (
        <span className={`action-badge ${action.toLowerCase()}`}>{action}</span>
      ),
      filters: [
        { text: 'Create', value: 'CREATE' },
        { text: 'Update', value: 'UPDATE' },
        { text: 'Delete', value: 'DELETE' },
      ],
      onFilter: (value, record) => record.action === value,
    },
    {
      title: 'MODULE',
      dataIndex: 'module',
      key: 'module',
      filters: [
        { text: 'UOM', value: 'UOM' },
        { text: 'Task', value: 'TASK' },
        { text: 'User', value: 'USER' },
      ],
      onFilter: (value, record) => record.module === value,
    },
    {
      title: 'RESOURCE',
      dataIndex: 'resourceName',
      key: 'resourceName',
    },
    {
      title: 'IP ADDRESS',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
    }
  ];

  return (
    <DashboardLayout 
      title="Audit Log"
      subtitle="Track all system activities and changes"
      page="audit"
    >
      <div className="audit-page">
        <div className="table-container">
          <Table
            columns={columns}
            dataSource={auditLogs}
            rowKey="_id"
            loading={loading}
            pagination={{
              pageSize: 15,
              showSizeChanger: false,
              simple: false,
            }}
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
              style: { cursor: 'pointer' }
            })}
          />
        </div>

        <Modal
          title="Audit Log Details"
          open={isModalVisible}
          onCancel={handleModalClose}
          footer={null}
          width={700}
          className="simple-modal audit-detail-modal"
        >
          {selectedAudit && (
            <div className="audit-detail-content">
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Timestamp">
                  {moment(selectedAudit.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="User">
                  {selectedAudit.userName} ({selectedAudit.userEmail})
                </Descriptions.Item>
                <Descriptions.Item label="Action">
                  <span className={`action-badge ${selectedAudit.action.toLowerCase()}`}>
                    {selectedAudit.action}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Module">
                  {selectedAudit.module}
                </Descriptions.Item>
                <Descriptions.Item label="Resource Type">
                  {selectedAudit.resourceType}
                </Descriptions.Item>
                <Descriptions.Item label="Resource Name">
                  {selectedAudit.resourceName}
                </Descriptions.Item>
                <Descriptions.Item label="Resource ID">
                  {selectedAudit.resourceId}
                </Descriptions.Item>
                <Descriptions.Item label="IP Address">
                  {selectedAudit.ipAddress || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="User Agent">
                  <div style={{ wordBreak: 'break-all' }}>
                    {selectedAudit.userAgent || 'N/A'}
                  </div>
                </Descriptions.Item>
              </Descriptions>
              
              <div style={{ marginTop: 20 }}>
                {renderChanges()}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Audit;

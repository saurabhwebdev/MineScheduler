import React, { useState, useEffect } from 'react';
import { Table, Modal, Descriptions, message } from 'antd';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import moment from 'moment';
import DashboardLayout from '../components/DashboardLayout';
import config from '../config/config';
import './Audit.css';

const Audit = () => {
  const { t } = useTranslation();
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0
  });
  const [filters] = useState({
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
      message.error(t('audit.messages.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <h4>{t('audit.modal.changes.newValues')}</h4>
          <pre>{JSON.stringify(selectedAudit.newValues, null, 2)}</pre>
        </div>
      );
    } else if (selectedAudit.action === 'DELETE') {
      return (
        <div className="audit-changes">
          <h4>{t('audit.modal.changes.deletedValues')}</h4>
          <pre>{JSON.stringify(selectedAudit.oldValues, null, 2)}</pre>
        </div>
      );
    } else if (selectedAudit.action === 'UPDATE') {
      return (
        <div className="audit-changes">
          <h4>{t('audit.modal.changes.changesMade')}</h4>
          {Object.keys(selectedAudit.changes || {}).length > 0 ? (
            <table className="changes-table">
              <thead>
                <tr>
                  <th>{t('audit.modal.changes.field')}</th>
                  <th>{t('audit.modal.changes.oldValue')}</th>
                  <th>{t('audit.modal.changes.newValue')}</th>
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
            <p>{t('audit.modal.changes.noChanges')}</p>
          )}
        </div>
      );
    }
    return null;
  };


  const columns = [
    {
      title: t('audit.columns.timestamp'),
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => moment(timestamp).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    },
    {
      title: t('audit.columns.user'),
      dataIndex: 'userName',
      key: 'userName',
      render: (name) => name
    },
    {
      title: t('audit.columns.action'),
      dataIndex: 'action',
      key: 'action',
      render: (action) => (
        <span className={`action-badge ${action.toLowerCase()}`}>{action}</span>
      ),
      filters: [
        { text: t('audit.actions.create'), value: 'CREATE' },
        { text: t('audit.actions.update'), value: 'UPDATE' },
        { text: t('audit.actions.delete'), value: 'DELETE' },
      ],
      onFilter: (value, record) => record.action === value,
    },
    {
      title: t('audit.columns.module'),
      dataIndex: 'module',
      key: 'module',
      filters: [
        { text: t('audit.modules.uom'), value: 'UOM' },
        { text: t('audit.modules.task'), value: 'TASK' },
        { text: t('audit.modules.user'), value: 'USER' },
      ],
      onFilter: (value, record) => record.module === value,
    },
    {
      title: t('audit.columns.resource'),
      dataIndex: 'resourceName',
      key: 'resourceName',
    },
    {
      title: t('audit.columns.ipAddress'),
      dataIndex: 'ipAddress',
      key: 'ipAddress',
    }
  ];

  return (
    <DashboardLayout 
      title={t('audit.title')}
      subtitle={t('audit.subtitle')}
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
          title={t('audit.modal.title')}
          open={isModalVisible}
          onCancel={handleModalClose}
          footer={null}
          width={700}
          className="simple-modal audit-detail-modal"
        >
          {selectedAudit && (
            <div className="audit-detail-content">
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label={t('audit.modal.labels.timestamp')}>
                  {moment(selectedAudit.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label={t('audit.modal.labels.user')}>
                  {selectedAudit.userName} ({selectedAudit.userEmail})
                </Descriptions.Item>
                <Descriptions.Item label={t('audit.modal.labels.action')}>
                  <span className={`action-badge ${selectedAudit.action.toLowerCase()}`}>
                    {selectedAudit.action}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label={t('audit.modal.labels.module')}>
                  {selectedAudit.module}
                </Descriptions.Item>
                <Descriptions.Item label={t('audit.modal.labels.resourceType')}>
                  {selectedAudit.resourceType}
                </Descriptions.Item>
                <Descriptions.Item label={t('audit.modal.labels.resourceName')}>
                  {selectedAudit.resourceName}
                </Descriptions.Item>
                <Descriptions.Item label={t('audit.modal.labels.resourceId')}>
                  {selectedAudit.resourceId}
                </Descriptions.Item>
                <Descriptions.Item label={t('audit.modal.labels.ipAddress')}>
                  {selectedAudit.ipAddress || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label={t('audit.modal.labels.userAgent')}>
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

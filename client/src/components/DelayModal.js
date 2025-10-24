import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Input, InputNumber, notification } from 'antd';
import { ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import config from '../config/config';
import './DelayModal.css';

const { TextArea } = Input;
const { Option } = Select;

const DelayModal = ({ visible, siteId, hour, onClose, onSubmit }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [delays, setDelays] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredCodes, setFilteredCodes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Fetch delays from API
  useEffect(() => {
    const fetchDelays = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.apiUrl}/delays`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (response.ok && data.status === 'success') {
          const activeDelays = data.data.delays.filter(d => d.isActive);
          setDelays(activeDelays);
          
          // Extract unique categories
          const uniqueCategories = [...new Set(activeDelays.map(d => d.delayCategory))];
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error('Error fetching delays:', error);
      }
    };

    if (visible) {
      fetchDelays();
      // Reset form when modal opens
      form.resetFields();
      setSelectedCategory(null);
      setFilteredCodes([]);
    }
  }, [visible, form]);

  // Filter codes based on selected category
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    const codes = delays
      .filter(d => d.delayCategory === category)
      .map(d => ({
        code: d.delayCode,
        description: d.description,
        duration: d.delayDuration
      }));
    setFilteredCodes(codes);
    // Reset code field when category changes
    form.setFieldsValue({ code: undefined, duration: 1 });
  };

  // Auto-fill duration when code is selected
  const handleCodeChange = (code) => {
    const selectedDelay = delays.find(d => d.delayCode === code);
    if (selectedDelay && selectedDelay.delayDuration) {
      form.setFieldsValue({ duration: selectedDelay.delayDuration });
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const delayData = {
        row: siteId,
        hourIndex: hour,
        category: values.category,
        code: values.code,
        comments: values.comments || '',
        duration: values.duration || 1
      };

      onSubmit(delayData);
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Add Delay"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={480}
      okText="Add Delay"
      cancelText="Cancel"
      className="delay-modal"
      okButtonProps={{
        style: { 
          background: '#062d54', 
          borderColor: '#062d54',
          height: '38px',
          fontWeight: 600
        }
      }}
      cancelButtonProps={{
        style: {
          height: '38px',
          fontWeight: 600
        }
      }}
    >
      <div className="delay-modal-info">
        <div className="info-item">
          <span className="info-label">Site:</span>
          <span className="info-value">{siteId}</span>
        </div>
        <div className="info-divider">•</div>
        <div className="info-item">
          <span className="info-label">Hour:</span>
          <span className="info-value">{hour + 1}</span>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{ duration: 1 }}
        className="delay-form"
      >
        <Form.Item
          name="category"
          label="Delay Category"
          rules={[{ required: true, message: 'Please select a delay category' }]}
        >
          <Select
            placeholder="Select category"
            onChange={handleCategoryChange}
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {categories.map(cat => (
              <Option key={cat} value={cat}>{cat}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="code"
          label="Delay Code"
          rules={[{ required: true, message: 'Please select a delay code' }]}
        >
          <Select
            placeholder="Select code"
            disabled={!selectedCategory}
            onChange={handleCodeChange}
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {filteredCodes.map(item => (
              <Option key={item.code} value={item.code}>
                <span style={{ fontSize: '13px' }}>
                  <strong>{item.code}</strong> - {item.description}
                </span>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="duration"
          label="Duration (hours)"
          rules={[
            { required: true, message: 'Please enter duration' },
            { type: 'number', min: 1, message: 'Duration must be at least 1 hour' }
          ]}
        >
          <InputNumber
            min={1}
            max={48}
            style={{ width: '100%' }}
            prefix={<ClockCircleOutlined />}
            placeholder="Duration in hours"
          />
        </Form.Item>

        <Form.Item
          name="comments"
          label="Comments (Optional)"
        >
          <TextArea
            rows={3}
            placeholder="Add any additional comments..."
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DelayModal;

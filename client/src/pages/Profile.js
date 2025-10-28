import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Avatar, notification, Select } from 'antd';
import { UserOutlined, MailOutlined, EnvironmentOutlined, IdcardOutlined, TeamOutlined, EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import config from '../config/config';
import { generateAvatar, getInitials } from '../utils/avatarUtils';
import './Profile.css';

const { TextArea } = Input;
const { Option } = Select;

const Profile = () => {
  const { user, login } = useAuth();
  const [form] = Form.useForm();
  const [employeeForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [editingBasic, setEditingBasic] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);

  // Fetch fresh user data from database on mount
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = user?._id || user?.id;
      
      if (!userId || !token) return;

      const response = await fetch(`${config.apiUrl}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        const freshUserData = data.data.user;
        setCurrentUser(freshUserData);
        // Update localStorage and context with fresh data
        login(freshUserData, token);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    // Fetch fresh data on mount
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Update forms when currentUser changes
    if (currentUser) {
      form.setFieldsValue({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
      });
      
      employeeForm.setFieldsValue({
        phone: currentUser?.phone || '',
        department: currentUser?.department || '',
        designation: currentUser?.designation || '',
        employeeId: currentUser?.employeeId || '',
        location: currentUser?.location || '',
        gender: currentUser?.gender || '',
        bio: currentUser?.bio || '',
      });
    }
  }, [currentUser, form, employeeForm]);

  const handleBasicUpdate = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = user?._id || user?.id;
      
      if (!userId) {
        notification.error({
          message: 'Error',
          description: 'User ID not found. Please log in again.',
        });
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${config.apiUrl}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        // Update user in context and localStorage
        const updatedUser = data.data.user;
        setCurrentUser(updatedUser);
        login(updatedUser, token);
        
        notification.success({
          message: 'Success',
          description: 'Basic information updated successfully',
        });
        setEditingBasic(false);
        
        // Fetch fresh data to ensure sync
        await fetchUserData();
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to update profile',
        });
      }
    } catch (error) {
      console.error('Update error:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to update profile',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeUpdate = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = user?._id || user?.id;
      
      if (!userId) {
        notification.error({
          message: 'Error',
          description: 'User ID not found. Please log in again.',
        });
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${config.apiUrl}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        // Update user in context and localStorage
        const updatedUser = data.data.user;
        setCurrentUser(updatedUser);
        login(updatedUser, token);
        
        notification.success({
          message: 'Success',
          description: 'Employee details updated successfully',
        });
        setEditingEmployee(false);
        
        // Fetch fresh data to ensure sync
        await fetchUserData();
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to update profile',
        });
      }
    } catch (error) {
      console.error('Update error:', error);
      notification.error({
        message: 'Network Error',
        description: 'Failed to update profile',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout 
      title="Profile"
      subtitle="Manage your account information"
      page="profile"
    >
      <div className="profile-page">
        {/* Profile Header Section */}
        <div className="profile-header">
          <div className="profile-header-left">
            <Avatar 
              size={64} 
              className="profile-avatar"
              src={generateAvatar(currentUser)}
            >
              {!generateAvatar(currentUser) && getInitials(currentUser?.name)}
            </Avatar>
            <div className="profile-info">
              <h2>{currentUser?.name || 'User'}</h2>
              <p>{currentUser?.email}</p>
            </div>
          </div>
          <div className="profile-header-right">
            <span className={`role-badge ${currentUser?.customRole ? 'custom' : currentUser?.role}`}>
              {currentUser?.customRole ? currentUser.customRole.name : (currentUser?.role === 'admin' ? 'Admin' : 'User')}
            </span>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="profile-content">
          {/* Left Column - Basic Information */}
          <div className="profile-card">
            <div className="card-header">
              <h3>Basic Information</h3>
              {!editingBasic ? (
                <button className="btn-edit" onClick={() => setEditingBasic(true)}>
                  <EditOutlined /> Edit
                </button>
              ) : (
                <button 
                  className="btn-cancel" 
                  onClick={() => {
                    setEditingBasic(false);
                    form.setFieldsValue({
                      name: currentUser?.name || '',
                      email: currentUser?.email || '',
                    });
                  }}
                >
                  <CloseOutlined /> Cancel
                </button>
              )}
            </div>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleBasicUpdate}
              className="profile-form"
            >
              <Form.Item
                label="Full Name"
                name="name"
                rules={[{ required: true, message: 'Name is required' }]}
              >
                <Input 
                  prefix={<UserOutlined />}
                  placeholder="Enter your name" 
                  disabled={!editingBasic}
                />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Email is required' },
                  { type: 'email', message: 'Invalid email' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />}
                  placeholder="Enter your email" 
                  disabled={!editingBasic}
                />
              </Form.Item>

              {editingBasic && (
                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    icon={<SaveOutlined />}
                    className="btn-save"
                  >
                    Save Changes
                  </Button>
                </Form.Item>
              )}
            </Form>
          </div>

          {/* Right Column - Employee Details */}
          <div className="profile-card">
            <div className="card-header">
              <h3>Employee Details <span className="optional-text">(Optional)</span></h3>
              {!editingEmployee ? (
                <button className="btn-edit" onClick={() => setEditingEmployee(true)}>
                  <EditOutlined /> Edit
                </button>
              ) : (
                <button 
                  className="btn-cancel" 
                  onClick={() => {
                    setEditingEmployee(false);
                    employeeForm.setFieldsValue({
                      phone: currentUser?.phone || '',
                      department: currentUser?.department || '',
                      designation: currentUser?.designation || '',
                      employeeId: currentUser?.employeeId || '',
                      location: currentUser?.location || '',
                      gender: currentUser?.gender || '',
                      bio: currentUser?.bio || '',
                    });
                  }}
                >
                  <CloseOutlined /> Cancel
                </button>
              )}
            </div>
            <Form
              form={employeeForm}
              layout="vertical"
              onFinish={handleEmployeeUpdate}
              className="profile-form"
            >
              <Form.Item label="Employee ID" name="employeeId">
                <Input 
                  prefix={<IdcardOutlined />}
                  placeholder="Employee ID" 
                  disabled={!editingEmployee}
                />
              </Form.Item>

              <Form.Item label="Phone" name="phone">
                <PhoneInput
                  country={'us'}
                  disabled={!editingEmployee}
                  enableSearch={true}
                  disableSearchIcon={false}
                  placeholder="Enter phone number"
                  containerClass="phone-input-container"
                  inputClass="phone-input-field"
                  buttonClass="phone-input-button"
                  searchClass="phone-input-search"
                  dropdownClass="phone-input-dropdown"
                />
              </Form.Item>

              <Form.Item label="Department" name="department">
                <Input 
                  prefix={<TeamOutlined />}
                  placeholder="Department" 
                  disabled={!editingEmployee}
                />
              </Form.Item>

              <Form.Item label="Designation" name="designation">
                <Input 
                  prefix={<UserOutlined />}
                  placeholder="Designation" 
                  disabled={!editingEmployee}
                />
              </Form.Item>

              <Form.Item label="Location" name="location">
                <Input 
                  prefix={<EnvironmentOutlined />}
                  placeholder="Work location" 
                  disabled={!editingEmployee}
                />
              </Form.Item>

              <Form.Item label="Gender" name="gender">
                <Select 
                  placeholder="Select gender" 
                  disabled={!editingEmployee}
                  allowClear
                >
                  <Option value="male">Male</Option>
                  <Option value="female">Female</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Bio" name="bio">
                <TextArea 
                  rows={4}
                  placeholder="Tell us about yourself" 
                  disabled={!editingEmployee}
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              {editingEmployee && (
                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    icon={<SaveOutlined />}
                    className="btn-save"
                  >
                    Save Changes
                  </Button>
                </Form.Item>
              )}
            </Form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;

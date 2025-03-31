import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import axios from 'axios';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import './Registration.css'; // Import the new CSS file

axios.defaults.baseURL = 'http://localhost:8080';

const Registration = () => {
  const [form] = Form.useForm();
  const [registrationType, setRegistrationType] = useState('customer');
  const navigate = useNavigate();

  const onFinish = async (values) => {
    // Build the payload. For customers, SSN remains a string.
    const payload = {
      fullName: values.fullName,
      address: values.address,
      ssn: registrationType === 'employee' ? parseInt(values.ssn, 10) : values.ssn
    };
  
    // For customers, include the registration date
    if (registrationType === 'customer') {
      payload.registrationDate = moment().format('YYYY-MM-DD');
    }
  
    try {
      if (registrationType === 'customer') {
        const response = await axios.post('/api/customers/with-id', payload);
        const customerId = response.data.customerId;
        message.success('Customer registered successfully');
        navigate(`/customer-dashboard/${customerId}`);
      } else {
        const response = await axios.post('/api/employees', payload);
        const employeeId = response.data.employeeId;
        message.success('Employee registered successfully');
        navigate(`/employee-dashboard/${employeeId}`);
      }
      form.resetFields();
    } catch (error) {
      console.error('Registration error:', error);
      message.error('Registration failed: ' + (error.response?.data || error.message));
    }
  };
  
    

  return (
    <div className="registration-container">
      <div className="header">
        <h1>Registration</h1>
        <p>Please fill in your details below</p>
      </div>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <Button
          onClick={() => setRegistrationType('customer')}
          type={registrationType === 'customer' ? 'primary' : 'default'}
          style={{ marginRight: '8px' }}
        >
          Customer
        </Button>
        <Button
          onClick={() => setRegistrationType('employee')}
          type={registrationType === 'employee' ? 'primary' : 'default'}
        >
          Employee
        </Button>
      </div>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="fullName"
          label="Full Name"
          rules={[{ required: true, message: 'Please enter your full name' }]}
        >
          <Input placeholder="Full Name" />
        </Form.Item>
        <Form.Item
          name="ssn"
          label="SSN"
          rules={[{ required: true, message: 'Please enter your SSN' }]}
        >
          <Input placeholder="SSN" />
        </Form.Item>
        <Form.Item
          name="address"
          label="Address"
          rules={[{ required: true, message: 'Please enter your address' }]}
        >
          <Input.TextArea rows={2} placeholder="Address" />
        </Form.Item>
        <Form.Item>
          <Button className="registration-btn" type="primary" htmlType="submit">
            Register as {registrationType === 'customer' ? 'Customer' : 'Employee'}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Registration;

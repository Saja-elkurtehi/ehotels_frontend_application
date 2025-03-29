import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Modal, Form, Input, DatePicker, Select, Card, Tabs, message, Tag, Button, Space, InputNumber, Radio } from 'antd';
import moment from 'moment';

const { TabPane } = Tabs;
const { Option } = Select;

axios.defaults.baseURL = 'http://localhost:8080'; 

const EmployeeDashboard = () => {
  // States
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [rentings, setRentings] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [isCheckInModalVisible, setIsCheckInModalVisible] = useState(false);
  const [isDirectRentingModalVisible, setIsDirectRentingModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedRenting, setSelectedRenting] = useState(null);
  
  const [bookingForm] = Form.useForm();
  const [checkInForm] = Form.useForm();
  const [directRentingForm] = Form.useForm();
  const [paymentForm] = Form.useForm();

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);
    
    try {
      // Fetch bookings
      const bookingsRes = await axios.get('/api/bookings');
      setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
      
      // Fetch customers
      const customersRes = await axios.get('/api/customers');
      setCustomers(Array.isArray(customersRes.data) ? customersRes.data : []);
      
      // Fetch rooms
      const roomsRes = await axios.get('/api/rooms');
      setRooms(Array.isArray(roomsRes.data) ? roomsRes.data : []);
      
      // Fetch rentings
      const rentingsRes = await axios.get('/api/rentings');
      setRentings(Array.isArray(rentingsRes.data) ? rentingsRes.data : []);
      
      // Fetch employees - assuming you have this endpoint
      try {
        const employeesRes = await axios.get('/api/employees');
        setEmployees(Array.isArray(employeesRes.data) ? employeesRes.data : []);
      } catch (error) {
        console.warn('Could not fetch employees, using default ID of 1');
        setEmployees([{ employeeId: 1, name: 'Current Employee' }]);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setFetchError(`Failed to load data: ${error.message}`);
      message.error('Failed to load data.');
    }
    
    setLoading(false);
  };
  
  // Show modal for adding new booking
  const showAddBookingModal = () => {
    bookingForm.resetFields();
    setIsBookingModalVisible(true);
  };

  // Handle form submission for new booking
  const handleAddBooking = async () => {
    try {
      const values = await bookingForm.validateFields();
      setSubmitLoading(true);
      
      // Format dates for API
      const bookingData = {
        customerId: values.customerId,
        roomId: values.roomId,
        status: values.status || 'Reserved', // Default status
        bookingDate: values.bookingDate.format('YYYY-MM-DD'),
        checkInDate: values.checkInDate.format('YYYY-MM-DD'),
        checkOutDate: values.checkOutDate.format('YYYY-MM-DD')
      };
      
      // Submit to API
      await axios.post('/api/bookings', bookingData);
      
      message.success('Booking added successfully');
      setIsBookingModalVisible(false);
      fetchData(); // Refresh the data
    } catch (error) {
      console.error('Error adding booking:', error);
      message.error('Failed to add booking: ' + (error.response?.data || error.message));
    } finally {
      setSubmitLoading(false);
    }
  };

  // Show check-in modal to convert a booking to renting
  const showCheckInModal = (booking) => {
    setSelectedBooking(booking);
    
    // Pre-fill the form with booking data
    checkInForm.setFieldsValue({
      customerId: booking.customerId,
      roomId: booking.roomId,
      employeeId: employees.length > 0 ? employees[0].employeeId : 1,
      checkInDate: moment(),
      checkOutDate: moment(booking.checkOutDate),
      status: 'Active'
    });
    
    setIsCheckInModalVisible(true);
  };

  // Handle converting booking to renting
  const handleCheckIn = async () => {
    try {
      const values = await checkInForm.validateFields();
      setSubmitLoading(true);
      
      // Format data for renting API
      const rentingData = {
        customerId: values.customerId,
        roomId: values.roomId,
        employeeId: values.employeeId,
        checkInDate: values.checkInDate.format('YYYY-MM-DD'),
        checkOutDate: values.checkOutDate.format('YYYY-MM-DD'),
        status: values.status || 'Active'
      };
      
      // Create renting
      await axios.post('/api/rentings', rentingData);
      
      // Update booking status to CheckedIn
      if (selectedBooking) {
        await axios.put(`/api/bookings/${selectedBooking.bookingId}`, {
          ...selectedBooking,
          status: 'CheckedIn'
        });
      }
      
      message.success('Check-in completed successfully');
      setIsCheckInModalVisible(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error during check-in:', error);
      message.error('Check-in failed: ' + (error.response?.data || error.message));
    } finally {
      setSubmitLoading(false);
    }
  };

  // Show direct renting modal (no previous booking)
  const showDirectRentingModal = () => {
    directRentingForm.resetFields();
    
    // Set default values
    directRentingForm.setFieldsValue({
      employeeId: employees.length > 0 ? employees[0].employeeId : 1,
      checkInDate: moment(),
      checkOutDate: moment().add(1, 'days'),
      status: 'Active'
    });
    
    setIsDirectRentingModalVisible(true);
  };

  // Handle direct renting creation
  const handleDirectRenting = async () => {
    try {
      const values = await directRentingForm.validateFields();
      setSubmitLoading(true);
      
      // Format data for renting API
      const rentingData = {
        customerId: values.customerId,
        roomId: values.roomId,
        employeeId: values.employeeId,
        checkInDate: values.checkInDate.format('YYYY-MM-DD'),
        checkOutDate: values.checkOutDate.format('YYYY-MM-DD'),
        status: values.status || 'Active'
      };
      
      // Create renting
      await axios.post('/api/rentings', rentingData);
      
      message.success('Direct renting created successfully');
      setIsDirectRentingModalVisible(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error creating direct renting:', error);
      message.error('Failed to create renting: ' + (error.response?.data || error.message));
    } finally {
      setSubmitLoading(false);
    }
  };

  // Show payment modal for a renting
  const showPaymentModal = (renting) => {
    setSelectedRenting(renting);
    
    // Calculate days stayed and total amount
    const checkInDate = moment(renting.checkInDate);
    const checkOutDate = moment(renting.checkOutDate);
    const daysStayed = checkOutDate.diff(checkInDate, 'days');
    
    // We'll assume a daily rate of $100, but you can replace this with actual room rates
    const dailyRate = 100;
    const totalAmount = daysStayed * dailyRate;
    
    paymentForm.setFieldsValue({
      amount: totalAmount,
      paymentType: 'Credit Card'
    });
    
    setIsPaymentModalVisible(true);
  };

  // Handle payment submission
  const handlePayment = async () => {
    try {
      const values = await paymentForm.validateFields();
      setSubmitLoading(true);
      
      // Since you don't have a payment API, we'll just simulate it
      // and update the renting status to Completed
      if (selectedRenting) {
        await axios.put(`/api/rentings/${selectedRenting.rentingId}`, {
          ...selectedRenting,
          status: 'Completed'
        });
        
        // Add payment record logic would go here if you had a payment API
        
        message.success(`Payment of $${values.amount} processed via ${values.paymentType}`);
        setIsPaymentModalVisible(false);
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      message.error('Payment failed: ' + (error.response?.data || error.message));
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle update booking (placeholder for now)
  const handleUpdateBooking = (record) => {
    message.info('Update functionality coming soon');
    // Implementation will go here
  };

  // Handle delete booking
  const handleDeleteBooking = async (bookingId) => {
    try {
      await axios.delete(`/api/bookings/${bookingId}`);
      message.success('Booking deleted successfully');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error deleting booking:', error);
      message.error('Failed to delete booking');
    }
  };
  
  // Table columns
  const bookingColumns = [
    {
      title: 'Booking ID',
      dataIndex: 'bookingId',
      key: 'bookingId',
    },
    {
      title: 'Hotel',
      dataIndex: 'roomId',
      key: 'hotel',
      render: (roomId) => {
        const room = rooms.find(r => r.roomId === roomId);
        if (room) {
          return `${room.hotelId}`;
        }
        return 'N/A';
      }
    },
    {
      title: 'Room',
      dataIndex: 'roomId',
      key: 'roomId',
      render: (roomId) => {
        const room = rooms.find(r => r.roomId === roomId);
        return room ? `${roomId}` : 'N/A';
      }
    },
    {
      title: 'Customer',
      dataIndex: 'customerId',
      key: 'customerId',
      render: (customerId) => {
        const customer = customers.find(c => c.customerId === customerId);
        return customer ? customer.fullName : 'N/A';
      }
    },
    {
      title: 'Booking Date',
      dataIndex: 'bookingDate',
      key: 'bookingDate',
      render: (date) => moment(date).format('MMM DD, YYYY')
    },
    {
      title: 'Check In',
      dataIndex: 'checkInDate',
      key: 'checkInDate',
      render: (date) => moment(date).format('MMM DD, YYYY')
    },
    {
      title: 'Check Out',
      dataIndex: 'checkOutDate',
      key: 'checkOutDate',
      render: (date) => moment(date).format('MMM DD, YYYY')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'blue';
        if (status === 'CheckedIn') color = 'green';
        if (status === 'Cancelled') color = 'red';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          {record.status !== 'CheckedIn' && record.status !== 'Cancelled' && (
            <Button size="small" type="primary" onClick={() => showCheckInModal(record)}>
              Check In
            </Button>
          )}
          <Button size="small" type="default" onClick={() => handleUpdateBooking(record)}>
            Edit
          </Button>
          <Button size="small" danger onClick={() => handleDeleteBooking(record.bookingId)}>
            Delete
          </Button>
        </Space>
      )
    }
  ];

  const rentingColumns = [
    {
      title: 'Renting ID',
      dataIndex: 'rentingId',
      key: 'rentingId',
    },
    {
      title: 'Hotel',
      dataIndex: 'roomId',
      key: 'hotel',
      render: (roomId) => {
        const room = rooms.find(r => r.roomId === roomId);
        if (room) {
          return `${room.hotelId}`;
        }
        return 'N/A';
      }
    },
    {
      title: 'Employee ID',
      dataIndex: 'employeeId',
      key: 'employeeId',
    },
    {
      title: 'Room',
      dataIndex: 'roomId',
      key: 'roomId',
      render: (roomId) => {
        const room = rooms.find(r => r.roomId === roomId);
        return room ? `Room ${roomId}` : 'N/A';
      }
    },
    {
      title: 'Customer',
      dataIndex: 'customerId',
      key: 'customerId',
      render: (customerId) => {
        const customer = customers.find(c => c.customerId === customerId);
        return customer ? customer.fullName : 'N/A';
      }
    },
    {
      title: 'Check In',
      dataIndex: 'checkInDate',
      key: 'checkInDate',
      render: (date) => moment(date).format('MMM DD, YYYY')
    },
    {
      title: 'Check Out',
      dataIndex: 'checkOutDate',
      key: 'checkOutDate',
      render: (date) => moment(date).format('MMM DD, YYYY')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'blue';
        if (status === 'Completed') color = 'green';
        if (status === 'Cancelled') color = 'red';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          {record.status === 'Active' && (
            <Button size="small" type="primary" onClick={() => showPaymentModal(record)}>
              Process Payment
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1>Employee Dashboard</h1>
      
      {fetchError && (
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#FFF0F0', border: '1px solid #FFD6D6', borderRadius: '4px' }}>
          <p><strong>Note:</strong> {fetchError}</p>
        </div>
      )}
      
      <Tabs defaultActiveKey="1">
        <TabPane tab="Bookings" key="1">
          <Card 
            title="Current Bookings"
            extra={
              <Button type="primary" onClick={showAddBookingModal}>
                Add New Booking
              </Button>
            }
          >
            <Table 
              dataSource={bookings} 
              columns={bookingColumns} 
              rowKey="bookingId" 
              loading={loading}
              pagination={{ pageSize: 8 }}
            />
          </Card>
        </TabPane>
        
        <TabPane tab="Rentings" key="2">
          <Card 
            title="Current Rentings"
            extra={
              <Button type="primary" onClick={showDirectRentingModal}>
                Create Direct Renting
              </Button>
            }
          >
            <Table 
              dataSource={rentings} 
              columns={rentingColumns} 
              rowKey="rentingId" 
              loading={loading}
              pagination={{ pageSize: 8 }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Add Booking Modal */}
      <Modal
        title="Add New Booking"
        visible={isBookingModalVisible}
        onOk={handleAddBooking}
        onCancel={() => setIsBookingModalVisible(false)}
        confirmLoading={submitLoading}
      >
        <Form
          form={bookingForm}
          layout="vertical"
        >
          <Form.Item
            name="customerId"
            label="Customer"
            rules={[{ required: true, message: 'Please select a customer' }]}
          >
            <Select placeholder="Select a customer">
              {customers.map(customer => (
                <Option key={customer.customerId} value={customer.customerId}>
                  {customer.fullName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="roomId"
            label="Room"
            rules={[{ required: true, message: 'Please select a room' }]}
          >
            <Select placeholder="Select a room">
              {rooms.map(room => (
                <Option key={room.roomId} value={room.roomId}>
                  Room {room.roomId} (Hotel {room.hotelId})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            initialValue="Reserved"
          >
            <Select>
              <Option value="Reserved">Reserved</Option>
              <Option value="Confirmed">Confirmed</Option>
              <Option value="CheckedIn">Checked In</Option>
              <Option value="Cancelled">Cancelled</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="bookingDate"
            label="Booking Date"
            initialValue={moment()}
            rules={[{ required: true, message: 'Please select booking date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="checkInDate"
            label="Check In Date"
            rules={[{ required: true, message: 'Please select check-in date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="checkOutDate"
            label="Check Out Date"
            rules={[{ required: true, message: 'Please select check-out date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Check-In Modal (Convert Booking to Renting) */}
      <Modal
        title="Check In Customer"
        visible={isCheckInModalVisible}
        onOk={handleCheckIn}
        onCancel={() => setIsCheckInModalVisible(false)}
        confirmLoading={submitLoading}
      >
        <Form
          form={checkInForm}
          layout="vertical"
        >
          <Form.Item
            name="customerId"
            label="Customer"
            rules={[{ required: true }]}
          >
            <Select disabled>
              {customers.map(customer => (
                <Option key={customer.customerId} value={customer.customerId}>
                  {customer.fullName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="roomId"
            label="Room"
            rules={[{ required: true }]}
          >
            <Select disabled>
              {rooms.map(room => (
                <Option key={room.roomId} value={room.roomId}>
                  Room {room.roomId} (Hotel {room.hotelId})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="employeeId"
            label="Employee"
            rules={[{ required: true, message: 'Please select an employee' }]}
          >
            <Select placeholder="Select employee handling check-in">
              {employees.map(employee => (
                <Option key={employee.employeeId} value={employee.employeeId}>
                  {employee.name || `Employee ${employee.employeeId}`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="checkInDate"
            label="Check In Date"
            rules={[{ required: true, message: 'Please select check-in date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="checkOutDate"
            label="Expected Check Out Date"
            rules={[{ required: true, message: 'Please select check-out date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            initialValue="Active"
          >
            <Select>
              <Option value="Active">Active</Option>
              <Option value="Completed">Completed</Option>
              <Option value="Cancelled">Cancelled</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Direct Renting Modal (No Previous Booking) */}
      <Modal
        title="Create Direct Renting"
        visible={isDirectRentingModalVisible}
        onOk={handleDirectRenting}
        onCancel={() => setIsDirectRentingModalVisible(false)}
        confirmLoading={submitLoading}
      >
        <Form
          form={directRentingForm}
          layout="vertical"
        >
          <Form.Item
            name="customerId"
            label="Customer"
            rules={[{ required: true, message: 'Please select a customer' }]}
          >
            <Select placeholder="Select a customer">
              {customers.map(customer => (
                <Option key={customer.customerId} value={customer.customerId}>
                  {customer.fullName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="roomId"
            label="Room"
            rules={[{ required: true, message: 'Please select a room' }]}
          >
            <Select placeholder="Select a room">
              {rooms.map(room => (
                <Option key={room.roomId} value={room.roomId}>
                  Room {room.roomId} (Hotel {room.hotelId})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="employeeId"
            label="Employee"
            rules={[{ required: true, message: 'Please select an employee' }]}
          >
            <Select placeholder="Select employee handling check-in">
              {employees.map(employee => (
                <Option key={employee.employeeId} value={employee.employeeId}>
                  {employee.name || `Employee ${employee.employeeId}`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="checkInDate"
            label="Check In Date"
            rules={[{ required: true, message: 'Please select check-in date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="checkOutDate"
            label="Expected Check Out Date"
            rules={[{ required: true, message: 'Please select check-out date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            initialValue="Active"
          >
            <Select>
              <Option value="Active">Active</Option>
              <Option value="Completed">Completed</Option>
              <Option value="Cancelled">Cancelled</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Payment Modal */}
      <Modal
        title="Process Payment"
        visible={isPaymentModalVisible}
        onOk={handlePayment}
        onCancel={() => setIsPaymentModalVisible(false)}
        confirmLoading={submitLoading}
      >
        <Form
          form={paymentForm}
          layout="vertical"
        >
          <Form.Item label="Customer">
            {selectedRenting && customers.find(c => c.customerId === selectedRenting.customerId)?.fullName}
          </Form.Item>

          <Form.Item label="Room">
            {selectedRenting && `Room ${selectedRenting.roomId}`}
          </Form.Item>

          <Form.Item label="Stay Duration">
            {selectedRenting && `${moment(selectedRenting.checkInDate).format('MMM DD, YYYY')} to ${moment(selectedRenting.checkOutDate).format('MMM DD, YYYY')}`}
          </Form.Item>

          <Form.Item
            name="amount"
            label="Payment Amount ($)"
            rules={[{ required: true, message: 'Please enter payment amount' }]}
          >
            <InputNumber 
              min={0} 
              precision={2}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="paymentType"
            label="Payment Method"
            rules={[{ required: true, message: 'Please select payment method' }]}
          >
            <Radio.Group>
              <Radio value="Cash">Cash</Radio>
              <Radio value="Credit Card">Credit Card</Radio>
              <Radio value="Debit Card">Debit Card</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeDashboard;
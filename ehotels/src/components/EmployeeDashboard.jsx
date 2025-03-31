import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Modal, Form, Input, DatePicker, Select, Card, Tabs, message, Tag, Button, Space, InputNumber, Radio, Row, Col, Statistic, Progress, Pie, Alert } from 'antd';
import moment from 'moment';
import { CalendarOutlined } from '@ant-design/icons';

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
  const [availableRooms, setAvailableRooms] = useState([]);
  const [roomCapacity, setRoomCapacity] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [bookingError, setBookingError] = useState(null);

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

  const [isNewCustomer, setIsNewCustomer] = useState(false);

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
      
      // Fetch the new view data
      try {
        const availableRoomsRes = await axios.get('/api/views/available-rooms');
        setAvailableRooms(Array.isArray(availableRoomsRes.data) ? availableRoomsRes.data : []);
        
        const roomCapacityRes = await axios.get('/api/views/room-capacity');
        setRoomCapacity(Array.isArray(roomCapacityRes.data) ? roomCapacityRes.data : []);
      } catch (error) {
        console.warn('Could not fetch view data:', error);
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
      
      let customerId = values.customerId;
      
      // If creating a new customer, create it first and get the ID
      if (isNewCustomer) {
        const customerData = {
          fullName: values.customerName,
          address: values.customerAddress,
          ssn: values.customerSSN,
          registrationDate: moment().format('YYYY-MM-DD')
        };
        
        // Create the customer and get the ID
        const response = await axios.post('/api/customers', customerData);
        
        // If your API returns the created customer with ID, use that
        // Otherwise, you might need to fetch the newly created customer
        const newCustomersResponse = await axios.get('/api/customers');
        const newCustomers = Array.isArray(newCustomersResponse.data) ? newCustomersResponse.data : [];
        
        // Find the customer by matching the SSN or name (depending on your API)
        const newCustomer = newCustomers.find(c => 
          c.fullName === customerData.fullName && c.ssn === customerData.ssn);
        
        if (newCustomer) {
          customerId = newCustomer.customerId;
        } else {
          throw new Error('Failed to create new customer');
        }
      }
      
      // Format dates for API
      const bookingData = {
        customerId: customerId,
        roomId: values.roomId,
        status: values.status || 'Reserved', // Default status
        bookingDate: values.bookingDate.format('YYYY-MM-DD'),
        checkInDate: values.checkInDate.format('YYYY-MM-DD'),
        checkOutDate: values.checkOutDate.format('YYYY-MM-DD')
      };
      
      // Submit booking to API
      await axios.post('/api/bookings', bookingData);
      
      // only close modal on success
      message.success('Booking added successfully');
      setIsBookingModalVisible(false);
      fetchData(); // Refresh the data

    } catch (error) {
      console.error('Booking:', error);

      // handle booking conflicts
      if (error.response?.data?.error === 'booking_conflict') {
        setBookingError({
          title: "Room Unavailable",
          message: "This room is already booked for your selected dates",
          roomId: error.response.data.roomId,
          conflictDates: {
            checkIn: error.response.data.conflictingDates?.checkIn,
            checkOut: error.response.data.conflictingDates?.checkOut
          }
        });
      } 
      // Handle customer creation errors
      else if (error.config?.url.includes('/api/customers')) {
        message.error('Failed to create customer: ' + (error.response?.data?.message || error.message));
      }
      // General errors
      else {
        message.error('Failed to add booking: ' + (error.response?.data?.message || error.message));
      }
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
      
      let customerId = values.customerId;
      
      // If creating a new customer, create it first and get the ID
      if (isNewCustomer) {
        const customerData = {
          fullName: values.customerName,
          address: values.customerAddress,
          ssn: values.customerSSN,
          registrationDate: moment().format('YYYY-MM-DD')
        };
        
        // Create the customer and get the ID
        const response = await axios.post('/api/customers', customerData);
        
        // If your API returns the created customer with ID, use that
        // Otherwise, you might need to fetch the newly created customer
        const newCustomersResponse = await axios.get('/api/customers');
        const newCustomers = Array.isArray(newCustomersResponse.data) ? newCustomersResponse.data : [];
        
        // Find the customer by matching the SSN or name (depending on your API)
        const newCustomer = newCustomers.find(c => 
          c.fullName === customerData.fullName && c.ssn === customerData.ssn);
        
        if (newCustomer) {
          customerId = newCustomer.customerId;
        } else {
          throw new Error('Failed to create new customer');
        }
      }
      
      // Format data for renting API
      const rentingData = {
        customerId: customerId,
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
      title: 'Hotel ID',
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
      title: 'Room #',
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
      title: 'Price/Night',
      dataIndex: 'roomId',
      key: 'price',
      render: (roomId) => {
        const room = rooms.find(r => r.roomId === roomId);
        return room ? `$${room.price}` : 'N/A';
      }
    },
    {
      title: 'Total Cost',
      key: 'total',
      render: (_, record) => {
        const days = moment(record.checkOutDate).diff(record.checkInDate, 'days');
        const room = rooms.find(r => r.roomId === record.roomId);
        return room ? `$${days * room.price}` : 'N/A';
      }
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
      title: 'Hotel ID',
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

  // Columns for the available rooms per area view
  const availableRoomsColumns = [
    {
      title: 'Hotel Address/Area',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Available Rooms',
      dataIndex: 'available_rooms',
      key: 'available_rooms',
    },
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
        
        <TabPane tab="Room Availability" key="3">
          <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
            <Col span={24}>
              <Card title="Available Rooms by Area">
                <Row gutter={[16, 16]}>
                  {availableRooms.map((area, index) => (
                    <Col span={8} key={index}>
                      <Card>
                        <Statistic
                          title={`Available at ${area.address}`}
                          value={area.available_rooms}
                          suffix="rooms"
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
          </Row>
        </TabPane>
        
        <TabPane tab="Dashboard Overview" key="5">
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Total Bookings"
                  value={bookings.length}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Active Rentings"
                  value={rentings.filter(r => r.status === 'Active').length}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Total Available Rooms"
                  value={availableRooms.reduce((acc, curr) => acc + curr.available_rooms, 0)}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>
          
          <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
            <Col span={12}>
              <Card title="Available Rooms by Area Summary">
                <Table 
                  dataSource={availableRooms} 
                  columns={[
                    { title: 'Hotel ID', dataIndex: 'hotel_id', key: 'hotel_id' },
                    { title: 'Address', dataIndex: 'address', key: 'address' },
                    { title: 'Available Rooms', dataIndex: 'available_rooms', key: 'available' }
                  ]} 
                  rowKey="address" 
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Hotel Capacity Summary">
                <Table 
                  dataSource={roomCapacity} 
                  columns={[
                    { title: 'Hotel ID', dataIndex: 'hotel_id', key: 'hotel_id' },
                    { title: 'Capacity', dataIndex: 'total_capacity', key: 'capacity' }
                  ]} 
                  rowKey="hotel_id" 
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* Add Booking Modal */}
      <Modal
        title="Add New Booking"
        visible={isBookingModalVisible}
        onOk={handleAddBooking}
        onCancel={() => {
          setIsBookingModalVisible(false);
          setIsNewCustomer(false);
          setBookingError(null);
        }}
        confirmLoading={submitLoading}
        okButtonProps={{ disabled: submitLoading }}
        width={800}
      >
        {/* Error Alert - Add this at the top of modal content */}
        {bookingError && (
          <Alert
            type="error"
            message={bookingError.title}
            description={
              <>
                <p>{bookingError.message}</p>
                {bookingError.roomId && (
                  <p><strong>Room #{bookingError.roomId}</strong></p>
                )}
                {bookingError.conflictDates && (
            <p style={{ color: '#ff4d4f', marginTop: 8 }}>
              <CalendarOutlined /> Conflicting dates: {bookingError.conflictDates.checkIn} to {bookingError.conflictDates.checkOut}
            </p>
          )}
        </>
      }
      showIcon
      closable
      onClose={() => setBookingError(null)}
      style={{ 
        marginBottom: 24,
        //animation: 'fadeIn 0.3s' // Optional: Add CSS animation
      }}
    />
        )}
        <Form
          form={bookingForm}
          layout="vertical"
        >
          {/* Customer Selection or Creation */}
          <div style={{ marginBottom: 16 }}>
            <Radio.Group 
              value={isNewCustomer ? 'new' : 'existing'} 
              onChange={e => setIsNewCustomer(e.target.value === 'new')}
              buttonStyle="solid"
            >
              <Radio.Button value="existing">Select Existing Customer</Radio.Button>
              <Radio.Button value="new">Create New Customer</Radio.Button>
            </Radio.Group>
          </div>

          {isNewCustomer ? (
            // New Customer Form
            <>
              <Form.Item
                name="customerName"
                label="Customer Name"
                rules={[{ required: true, message: 'Please enter customer name' }]}
              >
                <Input placeholder="Full Name" />
              </Form.Item>

              <Form.Item
                name="customerSSN"
                label="SSN"
                rules={[{ required: true, message: 'Please enter SSN' }]}
              >
                <Input placeholder="SSN" />
              </Form.Item>

              <Form.Item
                name="customerAddress"
                label="Address"
                rules={[{ required: true, message: 'Please enter address' }]}
              >
                <Input.TextArea rows={2} placeholder="Customer Address" />
              </Form.Item>
            </>
          ) : (
            // Existing Customer Selection
            <Form.Item
              name="customerId"
              label="Customer"
              rules={[{ required: !isNewCustomer, message: 'Please select a customer' }]}
            >
              <Select placeholder="Select a customer">
                {customers.map(customer => (
                  <Option key={customer.customerId} value={customer.customerId}>
                    {customer.fullName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

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
            <DatePicker
              disabledDate={(current) => current && current < moment().startOf('day')}
              format="YYYY-MM-DD"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="checkInDate"
            label="Check In Date"
            rules={[{ required: true, message: 'Please select check-in date' }]}
          >
            <DatePicker
              disabledDate={(current) => current && current < moment().startOf('day')}
              format="YYYY-MM-DD"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="checkOutDate"
            label="Check Out Date"
            rules={[{ required: true, message: 'Please select check-out date' }]}
          >
            <DatePicker
              disabledDate={(current) => current && current < moment().startOf('day')}
              format="YYYY-MM-DD"
              style={{ width: '100%' }}
            />
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
            <DatePicker
              disabledDate={(current) => current && current < moment().startOf('day')}
              format="YYYY-MM-DD"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="checkOutDate"
            label="Expected Check Out Date"
            rules={[{ required: true, message: 'Please select check-out date' }]}
          >
            <DatePicker
              disabledDate={(current) => current && current < moment().startOf('day')}
              format="YYYY-MM-DD"
              style={{ width: '100%' }}
            />
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
          {/* Customer Selection or Creation */}
          <div style={{ marginBottom: 16 }}>
            <Radio.Group 
              value={isNewCustomer ? 'new' : 'existing'} 
              onChange={e => setIsNewCustomer(e.target.value === 'new')}
              buttonStyle="solid"
            >
              <Radio.Button value="existing">Select Existing Customer</Radio.Button>
              <Radio.Button value="new">Create New Customer</Radio.Button>
            </Radio.Group>
          </div>

          {isNewCustomer ? (
            // New Customer Form
            <>
              <Form.Item
                name="customerName"
                label="Customer Name"
                rules={[{ required: true, message: 'Please enter customer name' }]}
              >
                <Input placeholder="Full Name" />
              </Form.Item>

              <Form.Item
                name="customerSSN"
                label="SSN"
                rules={[{ required: true, message: 'Please enter SSN' }]}
              >
                <Input placeholder="SSN" />
              </Form.Item>

              <Form.Item
                name="customerAddress"
                label="Address"
                rules={[{ required: true, message: 'Please enter address' }]}
              >
                <Input.TextArea rows={2} placeholder="Customer Address" />
              </Form.Item>
            </>
          ) : (
            // Existing Customer Selection
            <Form.Item
              name="customerId"
              label="Customer"
              rules={[{ required: !isNewCustomer, message: 'Please select a customer' }]}
            >
              <Select placeholder="Select a customer">
                {customers.map(customer => (
                  <Option key={customer.customerId} value={customer.customerId}>
                    {customer.fullName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

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
            <DatePicker
              disabledDate={(current) => current && current < moment().startOf('day')}
              format="YYYY-MM-DD"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="checkOutDate"
            label="Expected Check Out Date"
            rules={[{ required: true, message: 'Please select check-out date' }]}
          >
            <DatePicker
              disabledDate={(current) => current && current < moment().startOf('day')}
              format="YYYY-MM-DD"
              style={{ width: '100%' }}
            />
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
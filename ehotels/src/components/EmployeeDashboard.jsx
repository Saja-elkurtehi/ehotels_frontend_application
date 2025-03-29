import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Modal, Form, Input, DatePicker, Select, Card, Tabs, message, Tag } from 'antd';
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
  
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [isRentingModalVisible, setIsRentingModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedRenting, setSelectedRenting] = useState(null);
  const [newBooking, setNewBooking] = useState({
    status: 'Reserved',
    checkInDate: '',
    checkOutDate: '',
    customerId: '',
    roomId: ''
  });
  const [newRenting, setNewRenting] = useState({
    checkInDate: '',
    checkOutDate: '',
    status: 'Active',
    customerId: '',
    roomId: ''
  });
  const [payment, setPayment] = useState({
    amount: 0,
    method: 'Credit Card'
  });
  
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

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
      console.log('Bookings data:', bookingsRes.data);
      setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
      
      // Fetch customers
      const customersRes = await axios.get('/api/customers');
      console.log('Customers data:', customersRes.data);
      setCustomers(Array.isArray(customersRes.data) ? customersRes.data : []);
      
      // Fetch rooms
      const roomsRes = await axios.get('/api/rooms');
      console.log('Rooms data:', roomsRes.data);
      setRooms(Array.isArray(roomsRes.data) ? roomsRes.data : []);
      
      // Fetch rentings
      const rentingsRes = await axios.get('/api/rentings');
      console.log('Rentings data:', rentingsRes.data);
      setRentings(Array.isArray(rentingsRes.data) ? rentingsRes.data : []);
      
      // If we have no data, add some sample data for testing
      if (bookingsRes.data.length === 0) {
        setBookings([
          {
            bookingId: 1,
            status: "Reserved",
            bookingDate: "2025-05-01",
            checkInDate: "2025-05-10",
            checkOutDate: "2025-05-12",
            customerId: 1,
            roomId: 2833
          },
          {
            bookingId: 2,
            status: "CheckedIn",
            bookingDate: "2025-05-02",
            checkInDate: "2025-05-08",
            checkOutDate: "2025-05-15",
            customerId: 1,
            roomId: 2834
          }
        ]);
      }
      
      if (customersRes.data.length === 0) {
        setCustomers([
          {
            customerId: 1,
            fullName: "John Doe",
            address: "123 Main St, New York, NY",
            registrationDate: "2025-01-10",
            ssn: "111-22-3333"
          }
        ]);
      }
      
      if (roomsRes.data.length === 0) {
        setRooms([
          {
            roomId: 2833,
            hotelId: 1,
            price: 250,
            extension: true,
            capacity: 1,
            viewType: "sea view",
            anyProblems: null
          },
          {
            roomId: 2834,
            hotelId: 1,
            price: 300,
            extension: true,
            capacity: 2,
            viewType: "mountain view",
            anyProblems: null
          }
        ]);
      }
      
      if (rentingsRes.data.length === 0) {
        setRentings([
          {
            rentingId: 1,
            checkInDate: "2025-05-10",
            checkOutDate: "2025-05-12",
            status: "Active",
            customerId: 1,
            roomId: 2833
          }
        ]);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setFetchError(`Failed to load data: ${error.message}`);
      message.error('Failed to load data. Using sample data instead.');
      
      // Set sample data for testing
      setBookings([
        {
          bookingId: 1,
          status: "Reserved",
          bookingDate: "2025-05-01",
          checkInDate: "2025-05-10",
          checkOutDate: "2025-05-12",
          customerId: 1,
          roomId: 2833
        },
        {
          bookingId: 2,
          status: "CheckedIn",
          bookingDate: "2025-05-02",
          checkInDate: "2025-05-08",
          checkOutDate: "2025-05-15",
          customerId: 1,
          roomId: 2834
        }
      ]);
      
      setCustomers([
        {
          customerId: 1,
          fullName: "John Doe",
          address: "123 Main St, New York, NY",
          registrationDate: "2025-01-10",
          ssn: "111-22-3333"
        }
      ]);
      
      setRooms([
        {
          roomId: 2833,
          hotelId: 1,
          price: 250,
          extension: true,
          capacity: 1,
          viewType: "sea view",
          anyProblems: null
        },
        {
          roomId: 2834,
          hotelId: 1,
          price: 300,
          extension: true,
          capacity: 2,
          viewType: "mountain view",
          anyProblems: null
        }
      ]);
      
      setRentings([
        {
          rentingId: 1,
          checkInDate: "2025-05-10",
          checkOutDate: "2025-05-12",
          status: "Active",
          customerId: 1,
          roomId: 2833
        }
      ]);
    }
    
    setLoading(false);
  };

  // Booking handlers
  const handleBookingCheckIn = (booking) => {
    setSelectedBooking(booking);
    
    const renting = {
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      status: 'Active',
      customerId: booking.customerId,
      roomId: booking.roomId
    };
    
    setNewRenting(renting);
    setIsRentingModalVisible(true);
  };

  const createRentingFromBooking = async () => {
    try {
      await axios.post('/api/rentings', newRenting);
      
      // Update booking status
      const updatedBooking = { ...selectedBooking, status: 'CheckedIn' };
      await axios.put(`/api/bookings/${selectedBooking.bookingId}`, updatedBooking);
      
      message.success('Customer checked in successfully');
      fetchData();
      setIsRentingModalVisible(false);
      setIsPaymentModalVisible(true);
    } catch (error) {
      console.error('Error creating renting:', error);
      message.error('Failed to check in customer');
    }
  };

  const createDirectRenting = async () => {
    try {
      await axios.post('/api/rentings', newRenting);
      message.success('Direct renting created successfully');
      fetchData();
      setIsRentingModalVisible(false);
      setIsPaymentModalVisible(true);
    } catch (error) {
      console.error('Error creating direct renting:', error);
      message.error('Failed to create direct renting');
    }
  };

  const processPayment = async () => {
    // This is a placeholder for payment processing
    message.success(`Payment of $${payment.amount} processed via ${payment.method}`);
    setIsPaymentModalVisible(false);
  };
  
  // Table columns
  const bookingColumns = [
    {
      title: 'Booking ID',
      dataIndex: 'bookingId',
      key: 'bookingId',
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
      title: 'Room',
      dataIndex: 'roomId',
      key: 'roomId',
      render: (roomId) => {
        const room = rooms.find(r => r.roomId === roomId);
        return room ? `Room ${roomId} (${room.viewType})` : 'N/A';
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
        record.status === 'Reserved' ? (
          <Button type="primary" onClick={() => handleBookingCheckIn(record)}>
            Check In
          </Button>
        ) : (
          <Button disabled>
            {record.status === 'CheckedIn' ? 'Checked In' : record.status}
          </Button>
        )
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
      title: 'Customer',
      dataIndex: 'customerId',
      key: 'customerId',
      render: (customerId) => {
        const customer = customers.find(c => c.customerId === customerId);
        return customer ? customer.fullName : 'N/A';
      }
    },
    {
      title: 'Room',
      dataIndex: 'roomId',
      key: 'roomId',
      render: (roomId) => {
        const room = rooms.find(r => r.roomId === roomId);
        return room ? `Room ${roomId} (${room.viewType})` : 'N/A';
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
        <Button onClick={() => {
          setSelectedRenting(record);
          setIsPaymentModalVisible(true);
        }}>
          Process Payment
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1>Employee Dashboard</h1>
      
      {fetchError && (
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#FFF0F0', border: '1px solid #FFD6D6', borderRadius: '4px' }}>
          <p><strong>Note:</strong> {fetchError}</p>
          <p>Using sample data for demonstration.</p>
        </div>
      )}
      
      <Tabs defaultActiveKey="1">
        <TabPane tab="Bookings" key="1">
          <Card title="Current Bookings" extra={<Button type="primary" onClick={() => setIsBookingModalVisible(true)}>New Booking</Button>}>
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
          <Card title="Current Rentings" extra={<Button type="primary" onClick={() => {
            setSelectedBooking(null);
            setNewRenting({
              checkInDate: moment().format('YYYY-MM-DD'),
              checkOutDate: moment().add(1, 'days').format('YYYY-MM-DD'),
              status: 'Active',
              customerId: '',
              roomId: ''
            });
            setIsRentingModalVisible(true);
          }}>New Direct Renting</Button>}>
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
      
      {/* Booking Modal */}
      <Modal
        title="Create New Booking"
        visible={isBookingModalVisible}
        onOk={async () => {
          try {
            const bookingData = { 
              ...newBooking, 
              bookingDate: moment().format('YYYY-MM-DD') 
            };
            await axios.post(`/api/bookings?customerId=${newBooking.customerId}&roomId=${newBooking.roomId}`, bookingData);
            message.success('Booking created successfully');
            fetchData();
            setIsBookingModalVisible(false);
          } catch (error) {
            console.error('Error creating booking:', error);
            message.error('Failed to create booking');
          }
        }}
        onCancel={() => setIsBookingModalVisible(false)}
      >
        <Form layout="vertical">
          <Form.Item label="Customer">
            <Select
              placeholder="Select customer"
              onChange={(value) => setNewBooking({ ...newBooking, customerId: value })}
            >
              {customers.map(customer => (
                <Option key={customer.customerId} value={customer.customerId}>
                  {customer.fullName}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item label="Room">
            <Select
              placeholder="Select room"
              onChange={(value) => setNewBooking({ ...newBooking, roomId: value })}
            >
              {rooms.map(room => (
                <Option key={room.roomId} value={room.roomId}>
                  Room {room.roomId} - {room.viewType} (${room.price}/night)
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item label="Check In Date">
            <DatePicker 
              style={{ width: '100%' }}
              onChange={(date) => setNewBooking({ 
                ...newBooking, 
                checkInDate: date ? date.format('YYYY-MM-DD') : '' 
              })}
            />
          </Form.Item>
          
          <Form.Item label="Check Out Date">
            <DatePicker 
              style={{ width: '100%' }}
              onChange={(date) => setNewBooking({ 
                ...newBooking, 
                checkOutDate: date ? date.format('YYYY-MM-DD') : '' 
              })}
            />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Renting Modal */}
      <Modal
        title={selectedBooking ? "Check In Customer" : "Create Direct Renting"}
        visible={isRentingModalVisible}
        onOk={selectedBooking ? createRentingFromBooking : createDirectRenting}
        onCancel={() => setIsRentingModalVisible(false)}
      >
        <Form layout="vertical">
          {!selectedBooking && (
            <>
              <Form.Item label="Customer">
                <Select
                  placeholder="Select customer"
                  onChange={(value) => setNewRenting({ ...newRenting, customerId: value })}
                >
                  {customers.map(customer => (
                    <Option key={customer.customerId} value={customer.customerId}>
                      {customer.fullName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item label="Room">
                <Select
                  placeholder="Select room"
                  onChange={(value) => setNewRenting({ ...newRenting, roomId: value })}
                >
                  {rooms.map(room => (
                    <Option key={room.roomId} value={room.roomId}>
                      Room {room.roomId} - {room.viewType} (${room.price}/night)
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </>
          )}
          
          <Form.Item label="Check In Date">
            <DatePicker 
              style={{ width: '100%' }}
              value={newRenting.checkInDate ? moment(newRenting.checkInDate) : null}
              onChange={(date) => setNewRenting({ 
                ...newRenting, 
                checkInDate: date ? date.format('YYYY-MM-DD') : '' 
              })}
              disabled={!!selectedBooking}
            />
          </Form.Item>
          
          <Form.Item label="Check Out Date">
            <DatePicker 
              style={{ width: '100%' }}
              value={newRenting.checkOutDate ? moment(newRenting.checkOutDate) : null}
              onChange={(date) => setNewRenting({ 
                ...newRenting, 
                checkOutDate: date ? date.format('YYYY-MM-DD') : '' 
              })}
              disabled={!!selectedBooking}
            />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Payment Modal */}
      <Modal
        title="Process Payment"
        visible={isPaymentModalVisible}
        onOk={processPayment}
        onCancel={() => setIsPaymentModalVisible(false)}
      >
        <Form layout="vertical">
          <Form.Item label="Amount">
            <Input
              type="number"
              prefix="$"
              onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
            />
          </Form.Item>
          
          <Form.Item label="Payment Method">
            <Select
              defaultValue="Credit Card"
              onChange={(value) => setPayment({ ...payment, method: value })}
            >
              <Option value="Credit Card">Credit Card</Option>
              <Option value="Debit Card">Debit Card</Option>
              <Option value="Cash">Cash</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeDashboard;
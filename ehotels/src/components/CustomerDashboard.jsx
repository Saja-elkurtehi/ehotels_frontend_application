// CustomerDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Table, message, Button, Modal, Form, DatePicker, Tag, Space } from 'antd';
import moment from 'moment';
import BookingPopup from './BookingPopup'; // Your booking popup component
import './CustomerDashboard.css';

axios.defaults.baseURL = 'http://localhost:8080';

const CustomerDashboard = ({ customerId = 1, customerName = "John Doe" }) => {
  // Navbar view state: "search" or "bookings"
  const [activeView, setActiveView] = useState("search");

  // ----- SEARCH ROOMS STATES -----
  const [rooms, setRooms] = useState([]);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [selectedHotelChain, setSelectedHotelChain] = useState('');
  const [hotelCategory, setHotelCategory] = useState('');
  const [area, setArea] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [fetchRoomsError, setFetchRoomsError] = useState(null);

  // Booking Popup states for room booking
  const [showBookingPopup, setShowBookingPopup] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
const [selectedRoom, setSelectedRoom] = useState(null);


  // ----- MY BOOKINGS STATES -----
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingForm] = Form.useForm();

  const fetchAllRooms = async () => {
    setLoadingRooms(true);
    setFetchRoomsError(null);
    try {
      const response = await axios.get('/api/rooms');
      console.log("Fetched all rooms:", response.data);
      setRooms(response.data);
    } catch (error) {
      console.error("Error fetching all rooms:", error);
      setFetchRoomsError(error.message);
      // Optionally, set fallback data if needed:
      setRooms([]);
    }
    setLoadingRooms(false);
  };




  // ----- FUNCTIONS: SEARCH ROOMS -----
  const fetchAvailableRooms = async () => {
    setLoadingRooms(true);
    setFetchRoomsError(null);
    try {
      const params = {
        start: checkIn,
        end: checkOut,
        guests: guests,
        ...(selectedHotelChain && { hotelChainId: selectedHotelChain }),
        ...(hotelCategory && { hotelCategory }),
        ...(area && { area }),
        ...(minPrice && maxPrice && { minPrice, maxPrice })
      };

      console.log("Searching with params:", params);
      const response = await axios.get('/api/rooms/available', { params });
      console.log("Fetched rooms:", response.data);
      if (Array.isArray(response.data) && response.data.length > 0) {
        setRooms(response.data);
      } else {
        message.warn("No rooms found, using fallback sample data.");
        setRooms([
          {
            roomId: 9991,
            hotelId: 1,
            price: 250,
            extension: true,
            capacity: 2,
            viewType: 'sea view',
            anyProblems: null,
            hotelName: 'Sample Hotel 1'
          },
          {
            roomId: 9992,
            hotelId: 2,
            price: 300,
            extension: false,
            capacity: 3,
            viewType: 'mountain view',
            anyProblems: 'Broken lamp',
            hotelName: 'Sample Hotel 2'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setFetchRoomsError(error.message);
      setRooms([
        {
          roomId: 9993,
          hotelId: 3,
          price: 200,
          extension: true,
          capacity: 2,
          viewType: 'Fallback view',
          anyProblems: null,
          hotelName: 'Fallback Hotel'
        }
      ]);
    }
    setLoadingRooms(false);
  };
  useEffect(() => {
    fetchAllRooms();
  }, []);

// Change the openBookingPopup function to accept the room object
const openBookingPopup = (room) => {
  setSelectedRoom(room);
  setSelectedRoomId(room.roomId); // if you still need the roomId separately
  setShowBookingPopup(true);
};


  // Function to handle booking submission from the popup
  const handleBookingSubmit = async ({ roomId, checkInDate, checkOutDate }) => {
    setShowBookingPopup(false);
    const bookingDate = new Date().toISOString().substring(0, 10);
    const bookingData = {
      status: "Reserved",
      bookingDate: bookingDate,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate
    };

    try {
      const response = await axios.post(
        `/api/bookings/with-params?customerId=${customerId}&roomId=${roomId}`,
        bookingData
      );
      console.log("Booking response:", response.data);
      message.success("Booking successful!");
      fetchBookings();
    } catch (error) {
      console.error("Error booking room:", error);
      message.error("Error booking room.");
    }
  };

  // ----- FUNCTIONS: MY BOOKINGS -----
  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const response = await axios.get(`/api/bookings?customerId=${customerId}`);
      setBookings(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching customer bookings:', error);
      message.error('Failed to load your bookings.');
    }
    setLoadingBookings(false);
  };

  useEffect(() => {
    // Fetch bookings on mount and when customerId changes
    fetchBookings();
  }, [customerId]);

  // Cancel a booking
  const handleCancelBooking = async (bookingId) => {
    try {
      await axios.delete(`/api/bookings/${bookingId}`);
      message.success('Booking cancelled successfully');
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      message.error('Failed to cancel booking.');
    }
  };

  // Show the modal to update a booking (e.g., modify dates)
  const showUpdateModal = (booking) => {
    setSelectedBooking(booking);
    bookingForm.setFieldsValue({
      checkInDate: moment(booking.checkInDate),
      checkOutDate: moment(booking.checkOutDate),
    });
    setBookingModalVisible(true);
  };

  // Update the booking with new data
  const handleUpdateBooking = async () => {
    try {
      const values = await bookingForm.validateFields();
      setSubmitLoading(true);
      const updateData = {
        ...selectedBooking,
        checkInDate: values.checkInDate.format('YYYY-MM-DD'),
        checkOutDate: values.checkOutDate.format('YYYY-MM-DD'),
      };
      await axios.put(`/api/bookings/${selectedBooking.bookingId}`, updateData);
      message.success('Booking updated successfully');
      setBookingModalVisible(false);
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      message.error('Failed to update booking.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Columns for the bookings table
  const bookingColumns = [
    {
      title: 'Booking ID',
      dataIndex: 'bookingId',
      key: 'bookingId',
    },
    {
      title: 'Room',
      dataIndex: 'roomId',
      key: 'roomId',
      render: (roomId) => `Room ${roomId}`,
    },
    {
      title: 'Booking Date',
      dataIndex: 'bookingDate',
      key: 'bookingDate',
      render: (date) => moment(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Check In',
      dataIndex: 'checkInDate',
      key: 'checkInDate',
      render: (date) => moment(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Check Out',
      dataIndex: 'checkOutDate',
      key: 'checkOutDate',
      render: (date) => moment(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'blue';
        if (status === 'Cancelled') color = 'red';
        if (status === 'CheckedIn') color = 'green';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          {record.status === 'Reserved' && (
            <Button size="small" type="primary" onClick={() => showUpdateModal(record)}>
              Update
            </Button>
          )}
          {record.status !== 'Cancelled' && (
            <Button size="small" danger onClick={() => handleCancelBooking(record.bookingId)}>
              Cancel
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // Sign out function (for now, simply redirect to login page)
  const handleSignOut = () => {
    // This can be replaced with your actual sign out logic
    window.location.href = '/login';
  };

  // ----- VIEWS -----
  // Search Rooms view
  const renderSearchRooms = () => (
    <div className="dashboard">
      <aside className="sidebar">
        <h2>Your search</h2>
        <label>Check-in Date</label>
        <input
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
        />
        <label>Check-out Date</label>
        <input
          type="date"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
        />
        <label>Guests</label>
        <input
          type="number"
          min="1"
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
        />
        <label>Hotel Chain</label>
        <select
          value={selectedHotelChain}
          onChange={(e) => setSelectedHotelChain(e.target.value)}
        >
          <option value="">All Hotel Chains</option>
          <option value="1">Hilton</option>
          <option value="2">Marriott</option>
          <option value="3">Hyatt</option>
          <option value="4">InterContinental</option>
          <option value="5">Accor</option>
        </select>
        <label>Hotel Category</label>
        <select
          value={hotelCategory}
          onChange={(e) => setHotelCategory(e.target.value)}
        >
          <option value="">Any</option>
          <option value="1">1 Star</option>
          <option value="2">2 Stars</option>
          <option value="3">3 Stars</option>
          <option value="4">4 Stars</option>
          <option value="5">5 Stars</option>
        </select>
        <label>Area</label>
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
        >
          <option value="">Any</option>
          <option value="Downtown">Downtown</option>
          <option value="Suburb">Suburb</option>
          <option value="Airport">Airport</option>
        </select>
        <label>Price Range</label>
        <div className="price-range">
          <input 
            type="number" 
            placeholder="Min Price" 
            value={minPrice} 
            onChange={(e) => setMinPrice(e.target.value)} 
          />
          <input 
            type="number" 
            placeholder="Max Price" 
            value={maxPrice} 
            onChange={(e) => setMaxPrice(e.target.value)} 
          />
        </div>
        <button onClick={fetchAvailableRooms}>Search</button>
      </aside>

      <main className="results">
        <h2>Available Rooms</h2>
        {fetchRoomsError && (
          <p className="error-message">
            Error: {fetchRoomsError}. Using sample data.
          </p>
        )}
        {loadingRooms ? (
          <p className="no-results">Loading...</p>
        ) : rooms.length === 0 ? (
          <p className="no-results">No rooms found.</p>
        ) : (
          <div className="room-list">
            {rooms.map((room, index) => (
            <div key={index} className="room-card">
              <h3>Room ID: {room.roomId}</h3>
              <p>Hotel: {room.hotelName || room.hotelId}</p>
              <p><strong>Price:</strong> ${room.price}</p>
              <p><strong>Capacity:</strong> {room.capacity} guests</p>
              <p><strong>View:</strong> {room.viewType}</p>
              {room.anyProblems && <p><strong>Note:</strong> {room.anyProblems}</p>}
              <button onClick={() => openBookingPopup(room)}>Book now</button>
            </div>
          ))}

          </div>
        )}
      </main>

      {/* Booking Popup Component */}
      <BookingPopup
      show={showBookingPopup}
      room={selectedRoom} // pass the full room object
      roomId={selectedRoom ? selectedRoom.roomId : null}
      customerId={customerId}  
      initialCheckIn={checkIn}
      initialCheckOut={checkOut}
      onSubmit={handleBookingSubmit}
      onClose={() => setShowBookingPopup(false)}
    />


    </div>
  );

  // My Bookings view
  const renderMyBookings = () => (
    <div>
      <Card title="My Bookings">
        <Table
          dataSource={bookings}
          columns={bookingColumns}
          rowKey="bookingId"
          loading={loadingBookings}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      {/* Modal for updating a booking */}
      <Modal
        title="Update Booking"
        visible={bookingModalVisible}
        onOk={handleUpdateBooking}
        onCancel={() => setBookingModalVisible(false)}
        confirmLoading={submitLoading}
      >
        <Form form={bookingForm} layout="vertical">
          <Form.Item
            name="checkInDate"
            label="Check In Date"
            rules={[{ required: true, message: 'Please select check-in date' }]}
          >
            <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="checkOutDate"
            label="Check Out Date"
            rules={[{ required: true, message: 'Please select check-out date' }]}
          >
            <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );

  return (
    <div className="customer-dashboard">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <span className="customer-name">Welcome, {customerName}</span>
        </div>
        <div className="navbar-right">
          <Button type="link" onClick={() => setActiveView("search")}>
            Search Rooms
          </Button>
          <Button type="link" onClick={() => setActiveView("bookings")}>
            My Bookings
          </Button>
          <Button type="link" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="content">
        {activeView === "search" && renderSearchRooms()}
        {activeView === "bookings" && renderMyBookings()}
      </div>
    </div>
  );
};

export default CustomerDashboard;

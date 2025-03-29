import React, { useState } from 'react';
import axios from 'axios';
import BookingPopup from './BookingPopup';  // Import the popup component
import './CustomerDashboard.css';

const CustomerDashboard = () => {
  // ... existing state variables
  const [rooms, setRooms] = useState([]);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [selectedHotelChain, setSelectedHotelChain] = useState('');
  const [hotelCategory, setHotelCategory] = useState('');
  const [area, setArea] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  
  // State to manage the booking popup
  const [showBookingPopup, setShowBookingPopup] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  const fetchAvailableRooms = async () => {
    // ... your existing fetchAvailableRooms code
    setLoading(true);
    setFetchError(null);
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

      const response = await axios.get('http://localhost:8080/api/rooms/available', { params });
      console.log("Fetched rooms:", response.data);
      if (Array.isArray(response.data) && response.data.length > 0) {
        setRooms(response.data);
      } else {
        console.warn("No rooms found. Using fallback sample data.");
        setRooms([
          {
            roomId: 9991,
            hotelId: 1,
            price: 250,
            extension: true,
            capacity: 2,
            viewType: 'sea view',
            anyProblems: null
          },
          {
            roomId: 9992,
            hotelId: 2,
            price: 300,
            extension: false,
            capacity: 3,
            viewType: 'mountain view',
            anyProblems: 'Broken lamp'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setFetchError(error.message);
      setRooms([
        {
          roomId: 9993,
          hotelId: 3,
          price: 200,
          extension: true,
          capacity: 2,
          viewType: 'Fallback view',
          anyProblems: null
        }
      ]);
    }
    setLoading(false);
  };

  // Function to open the booking popup
  const openBookingPopup = (roomId) => {
    setSelectedRoomId(roomId);
    setShowBookingPopup(true);
  };

  // Function to handle booking submission from the popup
  const handleBookingSubmit = async ({ roomId, checkInDate, checkOutDate }) => {
    setShowBookingPopup(false);
    const customerId = 1; // Assume logged in customer (replace with actual user info)
    const bookingDate = new Date().toISOString().substring(0, 10);
    const bookingData = {
      status: "Reserved",
      bookingDate: bookingDate,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate
    };

    try {
      const response = await axios.post(
        `http://localhost:8080/api/bookings?customerId=${customerId}&roomId=${roomId}`,
        bookingData
      );
      console.log("Booking response:", response.data);
      alert("Booking successful! " + response.data);
    } catch (error) {
      console.error("Error booking room:", error);
      alert("Error booking room.");
    }
  };

  return (
    <div className="dashboard">
      {/* Sidebar */}
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

      {/* Main content */}
      <main className="results">
        <h2>Available Rooms</h2>
        {fetchError && (
          <p className="error-message">
            Error: {fetchError}. Using sample data.
          </p>
        )}
        {loading ? (
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
                <button onClick={() => openBookingPopup(room.roomId)}>Book now</button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Booking Popup */}
      <BookingPopup
        show={showBookingPopup}
        roomId={selectedRoomId}
        initialCheckIn={checkIn}
        initialCheckOut={checkOut}
        onSubmit={handleBookingSubmit}
        onClose={() => setShowBookingPopup(false)}
      />
    </div>
  );
};

export default CustomerDashboard;

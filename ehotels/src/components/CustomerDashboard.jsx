import React, { useState } from 'react';
import axios from 'axios';
import './CustomerDashboard.css';

const CustomerDashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [selectedHotelChain, setSelectedHotelChain] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const fetchAvailableRooms = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const response = await axios.get('http://localhost:8080/api/rooms/available', {
        params: {
          start: checkIn,
          end: checkOut,
          guests: guests,
          ...(selectedHotelChain && { hotelChainId: selectedHotelChain })
        }
      });

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
      // Fallback sample data in case of error
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
                <p>Hotel: {room.hotelName}</p>
                <p><strong>Price:</strong> ${room.price}</p>
                <p><strong>Capacity:</strong> {room.capacity} guests</p>
                <p><strong>View:</strong> {room.viewType}</p>
                {room.anyProblems && <p><strong>Note:</strong> {room.anyProblems}</p>}
                <button>Book now</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerDashboard;

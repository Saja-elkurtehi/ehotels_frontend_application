import React, { useState, useEffect } from 'react';
import './CustomerDashboard.css';

const BookingPopup = ({ show, room, roomId, customerId, initialCheckIn, initialCheckOut, onSubmit, onClose }) => {
  // Local state for booking dates
  const [checkInDate, setCheckInDate] = useState(initialCheckIn || '');
  const [checkOutDate, setCheckOutDate] = useState(initialCheckOut || '');

  // Reset dates when popup is opened/changed
  useEffect(() => {
    setCheckInDate(initialCheckIn || '');
    setCheckOutDate(initialCheckOut || '');
  }, [initialCheckIn, initialCheckOut, show]);

  if (!show) return null; // Do not render the popup if show is false

  const handleSubmit = (e) => {
    e.preventDefault();
    // Pass the booking details (including customerId) back to the parent
    onSubmit({ roomId, customerId, checkInDate, checkOutDate });
  };

  return (
    <div className="booking-popup-overlay">
      <div className="booking-popup">
        <h2>Book Room {roomId}</h2>
        
        {/* Render extra room info if available */}
        {room && (
          <div className="room-details">
            <p><strong>Hotel:</strong> {room.hotelName || room.hotelId}</p>
            <p><strong>Price:</strong> ${room.price}</p>
            <p><strong>Capacity:</strong> {room.capacity} guests</p>
            <p><strong>View:</strong> {room.viewType}</p>
            {room.anyProblems && <p><strong>Note:</strong> {room.anyProblems}</p>}
            {/* Add any additional fields if available */}
          </div>
        )}


        
        
        <form onSubmit={handleSubmit}>
          <label>Check-In Date</label>
          <input
            type="date"
            value={checkInDate}
            onChange={(e) => setCheckInDate(e.target.value)}
            required
          />
          <label>Check-Out Date</label>
          <input
            type="date"
            value={checkOutDate}
            onChange={(e) => setCheckOutDate(e.target.value)}
            required
          />
          <div className="popup-buttons">
            <button type="submit">Confirm Booking</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingPopup;

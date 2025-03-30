import React, { useState, useEffect } from 'react';
import './BookingPopup.css';

const BookingPopup = ({ show, roomId, initialCheckIn, initialCheckOut, onSubmit, onClose }) => {
  // Local state for booking dates (can be pre-populated with initial values)
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
    // Pass the booking details back to the parent
    onSubmit({ roomId, checkInDate, checkOutDate });
  };

  return (
    <div className="booking-popup-overlay">
      <div className="booking-popup">
        <h2>Book Room {roomId}</h2>
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

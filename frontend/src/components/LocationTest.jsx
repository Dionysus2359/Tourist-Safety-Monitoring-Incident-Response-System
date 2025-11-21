import React, { useState } from 'react';

const LocationTest = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const getLocation = () => {
    setLoading(true);
    setError(null);
    
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Position:', position);
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setLoading(false);
      },
      (error) => {
        console.log('Error:', error);
        setError(error.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout for better accuracy
        maximumAge: 60000 // Reduced to 1 minute for fresher data
      }
    );
  };

  return (
    <div style={{ padding: '20px', background: '#f8f9fa', margin: '20px', borderRadius: '8px' }}>
      <h3>Location Test</h3>
      <button onClick={getLocation} disabled={loading} style={{
        padding: '10px 20px',
        background: loading ? '#6c757d' : '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: loading ? 'not-allowed' : 'pointer'
      }}>
        {loading ? 'Getting Location...' : 'Get My Location'}
      </button>
      
      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          Error: {error}
        </div>
      )}
      
      {location && (
        <div style={{ marginTop: '10px' }}>
          <h4>Location Found:</h4>
          <p>Latitude: {location.lat.toFixed(6)}</p>
          <p>Longitude: {location.lng.toFixed(6)}</p>
          <p>Accuracy: ±{location.accuracy.toFixed(0)} meters</p>
          <p style={{ 
            color: location.accuracy <= 50 ? '#28a745' : 
                   location.accuracy <= 100 ? '#ffc107' : '#dc3545',
            fontWeight: 'bold'
          }}>
            {location.accuracy <= 50 ? '✅ High Accuracy' : 
             location.accuracy <= 100 ? '⚠️ Medium Accuracy' : '❌ Low Accuracy'}
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationTest;

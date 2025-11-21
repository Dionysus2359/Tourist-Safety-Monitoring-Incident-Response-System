import React, { useState } from 'react';
import MapView from './MapView';
import LocationTest from './LocationTest';

const MapDemo = () => {
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedGeofence, setSelectedGeofence] = useState(null);

  // Sample data for demonstration
  const sampleIncidents = [
    {
      id: '1',
      description: 'Road accident on main highway',
      location: {
        coordinates: [77.2090, 28.6139] // [lng, lat]
      },
      severity: 'high',
      status: 'reported',
      address: 'Main Highway, Delhi',
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      description: 'Lost tourist near metro station',
      location: {
        coordinates: [77.2190, 28.6239] // [lng, lat]
      },
      severity: 'medium',
      status: 'inProgress',
      address: 'Rajiv Chowk Metro Station, Delhi',
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: '3',
      description: 'Minor injury at tourist spot',
      location: {
        coordinates: [77.1990, 28.6039] // [lng, lat]
      },
      severity: 'low',
      status: 'resolved',
      address: 'Red Fort, Delhi',
      createdAt: new Date(Date.now() - 7200000).toISOString()
    }
  ];

  const sampleGeofences = [
    {
      id: '1',
      center: {
        coordinates: [77.2090, 28.6139] // [lng, lat]
      },
      radius: 500, // meters
      alertType: 'danger',
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      center: {
        coordinates: [77.2190, 28.6239] // [lng, lat]
      },
      radius: 300, // meters
      alertType: 'warning',
      active: true,
      createdAt: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: '3',
      center: {
        coordinates: [77.1990, 28.6039] // [lng, lat]
      },
      radius: 200, // meters
      alertType: 'warning',
      active: false,
      createdAt: new Date(Date.now() - 3600000).toISOString()
    }
  ];

  const handleIncidentClick = (incident) => {
    setSelectedIncident(incident);
    console.log('Incident clicked:', incident);
  };

  const handleGeofenceClick = (geofence) => {
    setSelectedGeofence(geofence);
    console.log('Geofence clicked:', geofence);
  };

  return (
    <div className="map-demo-container" style={{ height: '100vh', display: 'flex' }}>
      {/* Map View */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapView
          incidents={sampleIncidents}
          geofences={sampleGeofences}
          center={[28.6139, 77.2090]} // Delhi, India (fallback)
          zoom={12}
          onIncidentClick={handleIncidentClick}
          onGeofenceClick={handleGeofenceClick}
          useCurrentLocation={true}
          style={{ height: '100%' }}
        />
        
        {/* Map Controls Overlay */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'white',
          padding: '10px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Map Legend</h4>
          <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                backgroundColor: '#007bff', 
                borderRadius: '50%', 
                marginRight: '8px' 
              }}></div>
              Your Current Location
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                backgroundColor: '#dc3545', 
                borderRadius: '50%', 
                marginRight: '8px' 
              }}></div>
              High Severity Incidents
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                backgroundColor: '#ffc107', 
                borderRadius: '50%', 
                marginRight: '8px' 
              }}></div>
              Medium Severity Incidents
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                backgroundColor: '#28a745', 
                borderRadius: '50%', 
                marginRight: '8px' 
              }}></div>
              Low Severity Incidents
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                backgroundColor: '#dc3545', 
                border: '2px solid #dc3545',
                borderRadius: '50%', 
                marginRight: '8px' 
              }}></div>
              Danger Zones
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                backgroundColor: '#ffc107', 
                border: '2px solid #ffc107',
                borderRadius: '50%', 
                marginRight: '8px' 
              }}></div>
              Warning Zones
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar for selected items */}
      <div style={{
        width: '300px',
        background: '#f8f9fa',
        borderLeft: '1px solid #dee2e6',
        padding: '20px',
        overflowY: 'auto'
      }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>Map Details</h3>
        
        {/* Selected Incident */}
        {selectedIncident && (
          <div style={{
            background: 'white',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #dee2e6'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#dc3545' }}>Selected Incident</h4>
            <p><strong>Description:</strong> {selectedIncident.description}</p>
            <p><strong>Severity:</strong> 
              <span style={{ 
                color: selectedIncident.severity === 'high' ? '#dc3545' : 
                       selectedIncident.severity === 'medium' ? '#ffc107' : '#28a745',
                marginLeft: '5px'
              }}>
                {selectedIncident.severity.toUpperCase()}
              </span>
            </p>
            <p><strong>Status:</strong> {selectedIncident.status}</p>
            <p><strong>Address:</strong> {selectedIncident.address}</p>
            <button 
              onClick={() => setSelectedIncident(null)}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Close
            </button>
          </div>
        )}

        {/* Selected Geofence */}
        {selectedGeofence && (
          <div style={{
            background: 'white',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #dee2e6'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#ffc107' }}>Selected Geofence</h4>
            <p><strong>Alert Type:</strong> 
              <span style={{ 
                color: selectedGeofence.alertType === 'danger' ? '#dc3545' : '#ffc107',
                marginLeft: '5px'
              }}>
                {selectedGeofence.alertType.toUpperCase()}
              </span>
            </p>
            <p><strong>Radius:</strong> {selectedGeofence.radius}m</p>
            <p><strong>Status:</strong> 
              <span style={{ 
                color: selectedGeofence.active ? '#28a745' : '#6c757d',
                marginLeft: '5px'
              }}>
                {selectedGeofence.active ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </p>
            <button 
              onClick={() => setSelectedGeofence(null)}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Close
            </button>
          </div>
        )}

        {/* Location Test */}
        <LocationTest />

        {/* Statistics */}
        <div style={{
          background: 'white',
          padding: '15px',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Statistics</h4>
          <p><strong>Total Incidents:</strong> {sampleIncidents.length}</p>
          <p><strong>High Severity:</strong> {sampleIncidents.filter(i => i.severity === 'high').length}</p>
          <p><strong>Medium Severity:</strong> {sampleIncidents.filter(i => i.severity === 'medium').length}</p>
          <p><strong>Low Severity:</strong> {sampleIncidents.filter(i => i.severity === 'low').length}</p>
          <hr style={{ margin: '10px 0' }} />
          <p><strong>Total Geofences:</strong> {sampleGeofences.length}</p>
          <p><strong>Active Zones:</strong> {sampleGeofences.filter(g => g.active).length}</p>
          <p><strong>Danger Zones:</strong> {sampleGeofences.filter(g => g.alertType === 'danger').length}</p>
        </div>
      </div>
    </div>
  );
};

export default MapDemo;

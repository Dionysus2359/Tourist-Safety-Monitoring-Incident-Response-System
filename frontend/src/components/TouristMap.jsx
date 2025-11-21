import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { usersAPI } from '../services/api';

// Fix for default markers in Leaflet with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom tourist icons based on status
const createTouristIcon = (status, name) => {
  const colors = {
    active: '#10b981',    // Green for active tourists
    inactive: '#6b7280',  // Gray for inactive tourists
  };

  const statusColors = {
    active: '#059669',
    inactive: '#6b7280',
  };

  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return L.divIcon({
    className: 'custom-tourist-marker',
    html: `
      <div style="
        position: relative;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, ${colors[status] || colors.active} 0%, ${statusColors[status] || statusColors.active} 100%);
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        animation: gentlePulse 3s infinite;
      ">
        ${initials}
        <div style="
          position: absolute;
          top: -2px;
          right: -2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: ${status === 'active' ? '#10b981' : '#6b7280'};
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        "></div>
      </div>
      <style>
        @keyframes gentlePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .custom-tourist-marker:hover div {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0,0,0,0.4);
        }
      </style>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -25]
  });
};

// Cluster icon for multiple tourists in one area
const createClusterIcon = (count) => {
  return L.divIcon({
    className: 'custom-cluster-marker',
    html: `
      <div style="
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s ease;
      ">
        ${count}
      </div>
    `,
    iconSize: [50, 50],
    iconAnchor: [25, 25],
    popupAnchor: [0, -30]
  });
};

const TouristMap = ({
  className = '',
  style = {},
  center = [28.6139, 77.2090], // Default to Delhi, India
  zoom = 10,
  showControls = true
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [tourists, setTourists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTourist, setSelectedTourist] = useState(null);

  // Fetch tourists data
  const fetchTourists = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await usersAPI.getAll();

      if (response.data.success) {
        setTourists(response.data.data.users || []);
      } else {
        setError('Failed to fetch tourist data');
      }
    } catch (err) {
      console.error('Error fetching tourists:', err);
      setError('Failed to load tourist locations');
    } finally {
      setLoading(false);
    }
  };

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: showControls,
        attributionControl: showControls
      });

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(mapInstanceRef.current);

      // Add scale control
      if (showControls) {
        L.control.scale({
          position: 'bottomright',
          metric: true,
          imperial: false
        }).addTo(mapInstanceRef.current);
      }

      // Fetch tourists on map load
      fetchTourists();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom, showControls]);

  // Update tourist markers
  useEffect(() => {
    if (!mapInstanceRef.current || loading) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add tourist markers
    const touristsWithLocation = tourists.filter(tourist =>
      tourist.location && tourist.location.coordinates
    );

    touristsWithLocation.forEach(tourist => {
      const [lng, lat] = tourist.location.coordinates;

      // Create marker
      const marker = L.marker([lat, lng], {
        icon: createTouristIcon('active', tourist.name) // You can customize status logic
      });

      // Create popup content
      const popupContent = `
        <div style="
          min-width: 280px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <div style="
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 12px;
            border-radius: 8px 8px 0 0;
            margin: -8px -8px 12px -8px;
          ">
            <h4 style="margin: 0; font-size: 16px; font-weight: 600;">👤 ${tourist.name}</h4>
            <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">ID: ${tourist.username}</p>
          </div>

          <div style="padding: 8px 0;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 14px; margin-right: 8px;">📧</span>
              <span style="font-size: 14px; color: #374151;">${tourist.email}</span>
            </div>

            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 14px; margin-right: 8px;">📱</span>
              <span style="font-size: 14px; color: #374151;">${tourist.phone}</span>
            </div>

            ${tourist.location.address ? `
              <div style="display: flex; align-items: start; margin-bottom: 8px;">
                <span style="font-size: 14px; margin-right: 8px;">📍</span>
                <span style="font-size: 14px; color: #374151; line-height: 1.4;">${tourist.location.address}</span>
              </div>
            ` : ''}

            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 14px; margin-right: 8px;">🎯</span>
              <span style="font-size: 12px; color: #6b7280;">
                ${lat.toFixed(6)}, ${lng.toFixed(6)}
                ${tourist.location.accuracy ? ` (±${tourist.location.accuracy}m)` : ''}
              </span>
            </div>

            ${tourist.tripInfo ? `
              <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px;">
                <div style="display: flex; align-items: center; margin-bottom: 4px;">
                  <span style="font-size: 14px; margin-right: 8px;">🚗</span>
                  <span style="font-size: 14px; color: #374151;">${tourist.tripInfo.startLocation || 'N/A'}</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="font-size: 14px; margin-right: 8px;">🏁</span>
                  <span style="font-size: 14px; color: #374151;">${tourist.tripInfo.endLocation || 'N/A'}</span>
                </div>
              </div>
            ` : ''}

            <div style="
              border-top: 1px solid #e5e7eb;
              padding-top: 8px;
              margin-top: 8px;
              font-size: 12px;
              color: #6b7280;
            ">
              Last updated: ${tourist.location.lastUpdated ?
                new Date(tourist.location.lastUpdated).toLocaleString() :
                'Unknown'
              }
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 320,
        minWidth: 280,
        className: 'tourist-popup'
      });

      // Add click event
      marker.on('click', () => {
        setSelectedTourist(tourist);
      });

      marker.addTo(mapInstanceRef.current);
      markersRef.current.push(marker);
    });

    // Fit bounds to show all tourists if there are any
    if (touristsWithLocation.length > 0) {
      const group = new L.featureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }

  }, [tourists, loading]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTourists();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`tourist-map-container ${className}`}
      style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          borderRadius: '8px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #10b981',
              borderTop: '4px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px'
            }}></div>
            <p style={{ color: '#374151', fontSize: '14px' }}>Loading tourist locations...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          borderRadius: '8px'
        }}>
          <div style={{ textAlign: 'center', color: '#dc2626' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
            <p style={{ fontSize: '16px', marginBottom: '12px' }}>{error}</p>
            <button
              onClick={fetchTourists}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Status info */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 1000,
        fontSize: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#10b981',
            border: '2px solid white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
          }}></div>
          <span style={{ color: '#374151' }}>
            {tourists.filter(t => t.location?.coordinates).length} tourists tracked
          </span>
          <button
            onClick={fetchTourists}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              marginLeft: '4px'
            }}
            title="Refresh locations"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Map container */}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '400px',
          borderRadius: '8px',
          ...style
        }}
      />

      <style jsx>{`
        .tourist-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          border: none;
        }
        .tourist-popup .leaflet-popup-content {
          margin: 8px;
        }
        .tourist-popup .leaflet-popup-tip {
          background: white;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TouristMap;

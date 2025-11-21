import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Layout from "../components/layout/Layout";
import MapView from "../components/MapView";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { Search as SearchIcon, Phone, LocateFixed, Siren, Building2, Shield, Users, X } from "lucide-react";
import { alertsAPI, incidentsAPI } from "../services/api";

export default function SafeTravels() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedGeofence, setSelectedGeofence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserLocation, setCurrentUserLocation] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incidentsResponse, geofencesResponse] = await Promise.all([
          axios.get('http://localhost:3000/incidents'),
          axios.get('http://localhost:3000/geofences')
        ]);

        if (incidentsResponse.data.success) {
          const incidentsData = incidentsResponse.data.data.incidents || [];
          setIncidents(incidentsData);
          console.log('Loaded incidents from backend:', incidentsData.length);
        }

        if (geofencesResponse.data.success) {
          const geofencesData = geofencesResponse.data.data.geofences || [];
          setGeofences(geofencesData);
          console.log('Loaded geofences from backend:', geofencesData.length);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // Fallback to sample data if backend is not available
        setIncidents([
          {
            id: '1',
            description: 'Road accident on main highway',
            location: { coordinates: [77.2090, 28.6139] },
            severity: 'high',
            status: 'reported',
            address: 'Main Highway, Delhi',
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            description: 'Medical emergency at tourist spot',
            location: { coordinates: [77.2150, 28.6189] },
            severity: 'high',
            status: 'inProgress',
            address: 'Red Fort Area, Delhi',
            createdAt: new Date().toISOString()
          },
          {
            id: '3',
            description: 'Pickpocket incident in market',
            location: { coordinates: [77.2050, 28.6089] },
            severity: 'medium',
            status: 'reported',
            address: 'Chandni Chowk Market, Delhi',
            createdAt: new Date().toISOString()
          },
          {
            id: '4',
            description: 'Lost wallet near hotel',
            location: { coordinates: [77.2200, 28.6200] },
            severity: 'medium',
            status: 'resolved',
            address: 'Connaught Place, Delhi',
            createdAt: new Date().toISOString()
          },
          {
            id: '5',
            description: 'Minor traffic violation',
            location: { coordinates: [77.2100, 28.6150] },
            severity: 'low',
            status: 'reported',
            address: 'Rajpath, Delhi',
            createdAt: new Date().toISOString()
          },
          {
            id: '6',
            description: 'Noise complaint at night',
            location: { coordinates: [77.2250, 28.6250] },
            severity: 'low',
            status: 'resolved',
            address: 'Karol Bagh, Delhi',
            createdAt: new Date().toISOString()
          }
        ]);
        setGeofences([
          {
            id: '1',
            center: { coordinates: [77.2090, 28.6139] },
            radius: 800,
            alertType: 'danger',
            active: true,
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            center: { coordinates: [77.2150, 28.6189] },
            radius: 600,
            alertType: 'danger',
            active: true,
            createdAt: new Date().toISOString()
          },
          {
            id: '3',
            center: { coordinates: [77.2050, 28.6089] },
            radius: 500,
            alertType: 'warning',
            active: true,
            createdAt: new Date().toISOString()
          },
          {
            id: '4',
            center: { coordinates: [77.2200, 28.6200] },
            radius: 700,
            alertType: 'warning',
            active: true,
            createdAt: new Date().toISOString()
          },
          {
            id: '5',
            center: { coordinates: [77.2100, 28.6150] },
            radius: 400,
            alertType: 'warning',
            active: false,
            createdAt: new Date().toISOString()
          },
          {
            id: '6',
            center: { coordinates: [77.2250, 28.6250] },
            radius: 300,
            alertType: 'danger',
            active: true,
            createdAt: new Date().toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleIncidentClick = (incident) => {
    setSelectedIncident(incident);
    console.log('Incident clicked:', incident);
  };

  const handleGeofenceClick = (geofence) => {
    setSelectedGeofence(geofence);
    console.log('Geofence clicked:', geofence);
  };

  const handleLocationUpdate = (location, position) => {
    setCurrentUserLocation(location);
    console.log('📍 Current location received from map:', location);
    console.log('📍 Position accuracy:', position?.coords?.accuracy, 'meters');
    console.log('📍 Position timestamp:', new Date(position?.timestamp).toLocaleString());
  };

  const handleSOSClick = async () => {
    try {
      console.log('🚨 SOS Button Clicked');
      console.log('🔐 User authentication status:', {
        user: user?.username || user?.name,
        userId: user?.id || user?._id,
        isAuthenticated: !!user
      });

      // Check if user is authenticated
      if (!user) {
        console.error('❌ User not authenticated for SOS');
        alert('You must be logged in to send an emergency alert.');
        return;
      }

      // Get current location coordinates, fallback to Delhi if not available
      const locationCoords = currentUserLocation
        ? [currentUserLocation[1], currentUserLocation[0]] // [longitude, latitude]
        : [77.2090, 28.6139]; // Delhi coordinates as fallback

      // Create emergency incident using authenticated API
      const emergencyIncident = {
        description: "EMERGENCY SOS ALERT - Immediate assistance required for tourist safety. Please respond urgently to the reported location.",
        location: {
          coordinates: locationCoords
        },
        severity: "high"
      };

      console.log('📍 Current user location:', currentUserLocation);
      console.log('📍 Using coordinates for SOS:', locationCoords);
      console.log('📝 Creating emergency incident with data:', emergencyIncident);

      // Create incident using authenticated API
      const incidentResponse = await incidentsAPI.create(emergencyIncident);
      console.log('Emergency incident created:', incidentResponse.data);

      // Create alert linked to the incident for ALL admin users
      if (incidentResponse.data.success && incidentResponse.data.data?.incident) {
        const incidentId = incidentResponse.data.data.incident.id;

        try {
          // Create alerts for all admin users via authenticated API
          const alertResponse = await alertsAPI.createEmergencySOS({
            incidentId: incidentId,
            location: {
              coordinates: locationCoords
            },
            touristInfo: {
              userId: user?.id || user?._id || 'unknown',
              name: user?.name || user?.username || 'Unknown Tourist'
            }
          });

          if (alertResponse.data.success) {
            console.log('Emergency alerts created for admins:', alertResponse.data);
          } else {
            console.error('Failed to create emergency alerts:', alertResponse.data);
          }
        } catch (alertError) {
          console.error('Error creating emergency alerts via SOS endpoint:', alertError);
          // Try fallback method - create alert using authenticated API
          try {
            const alertData = {
              message: `EMERGENCY SOS ALERT: Tourist ${user?.name || user?.username || 'Unknown'} has triggered an emergency SOS signal requiring immediate assistance. Location: ${emergencyIncident.location.coordinates.join(', ')}. Please respond urgently.`,
              incident: incidentId
            };
            await alertsAPI.create(alertData);
            console.log('Emergency alert created via fallback method');
          } catch (fallbackError) {
            console.error('Fallback alert creation also failed:', fallbackError);
          }
        }
      }

      alert('Emergency alert sent! Help is on the way.');
    } catch (error) {
      console.error('Error creating emergency incident:', error);
      alert('Failed to send emergency alert. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--background)] text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading map data...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout showFooter={false}>
      <div className="relative flex flex-col flex-1 min-h-0 bg-slate-950 text-white">
        <div className="absolute inset-0 bg-slate-950"></div>

        {/* Map container fills available space below the app header */}
        <div className="relative flex-1 min-h-0 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <MapView
              incidents={incidents}
              geofences={geofences}
              center={[28.6139, 77.2090]} // Delhi, India - will be overridden by current location if available
              zoom={12}
              onIncidentClick={handleIncidentClick}
              onGeofenceClick={handleGeofenceClick}
              onLocationUpdate={handleLocationUpdate}
              useCurrentLocation={true}
              style={{ height: '100%', width: '100%' }}
            />
          </div>

          {/* Map Legend - Top Right */}
          <div className="absolute top-6 right-6 z-[1000] w-64">
            <Card className="bg-white text-gray-900 shadow-xl border border-gray-200 rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Map Legend</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 p-4">
                <ul className="space-y-2 text-xs text-gray-700">
                  <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-600"></span> Your Location</li>
                  <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-600"></span> High Severity</li>
                  <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> Medium Severity</li>
                  <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-600"></span> Low Severity</li>
                  <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-red-600"></span> Danger Zones</li>
                  <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-yellow-500"></span> Warning Zones</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Left side tools - Top Left */}
          <div className="absolute top-6 left-6 z-[1000] space-y-4 w-[320px] max-w-[92vw]">
            {/* Search Bar */}
            <Card className="bg-white text-gray-900 border border-gray-200 rounded-xl shadow-md">
              <CardContent className="p-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    {/* <span className="material-symbols-outlined text-base"></span> */}
                  </div>
                  <Input
                    className="pl-10 h-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Search for locations, landmarks..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Map Layers */}
            <Card className="bg-white text-gray-900 border border-gray-200 rounded-xl shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Map Layers</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-1">
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                      <span className="text-sm font-medium text-gray-800">High-Alert Zones</span>
                    </div>
                    <Checkbox className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500" />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
                      <span className="text-sm font-medium text-gray-800">Safe Routes</span>
                    </div>
                    <Checkbox defaultChecked className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
                      <span className="text-sm font-medium text-gray-800">Police Stations</span>
                    </div>
                    <Checkbox className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" />
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right side controls - Bottom Right */}
          <div className="absolute bottom-6 right-6 z-[1000] flex flex-col items-end gap-4">
            {/* Location refresh button */}
            <div className="relative group">
              <Button
                size="icon"
                variant="secondary"
                className="w-12 h-12 bg-white text-blue-600 border border-gray-300 shadow-lg hover:bg-blue-50 hover:scale-105 transition-all duration-200"
                title="Refresh your location"
                onClick={() => {
                  console.log('Manual location refresh clicked');
                  // Force a page reload to refresh geolocation
                  window.location.reload();
                }}
              >
                <span className="material-symbols-outlined text-xl">location_searching</span>
              </Button>
              <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none shadow-md">
                Refresh Location
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>

            {/* SOS Emergency Button */}
            <div className="relative group">
              <Button
                onClick={handleSOSClick}
                className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white rounded-full shadow-2xl border-4 border-red-400/30 hover:border-red-300/50 hover:scale-105 transition-all duration-300 overflow-hidden group"
              >
                <div className="absolute inset-0 bg-red-400/20 rounded-full animate-ping"></div>
                <div className="absolute inset-1 bg-red-500/10 rounded-full animate-pulse"></div>
                <div className="relative flex flex-col items-center justify-center z-10">
                  {/* <span className="material-symbols-outlined text-3xl sm:text-4xl font-bold mb-1">sos</span> */}
                  <span className="text-sm sm:text-base font-bold tracking-widest">SOS</span>
                </div>
              </Button>
              <div className="absolute bottom-full right-0 mb-3 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none shadow-md">
                Emergency SOS - Press for immediate help
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>

          {/* Emergency Contacts - Bottom Left */}
          <div className="absolute bottom-6 left-6 z-[1000] w-[340px] max-w-[92vw]">
            <Card className="bg-white text-gray-900 border border-gray-200 rounded-xl shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Emergency Contacts</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-red-50 text-red-600 rounded-md flex items-center justify-center border border-red-200">⚠️</div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Local Police</p>
                        <p className="text-xs text-gray-500">Emergency: 100</p>
                      </div>
                    </div>
                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white rounded-md px-3">Call</Button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center border border-blue-200">🏛️</div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Embassy</p>
                        <p className="text-xs text-gray-500">Consular Services</p>
                      </div>
                    </div>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-3">Call</Button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-green-50 text-green-600 rounded-md flex items-center justify-center border border-green-200">👨‍👩‍👧‍👦</div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Emergency Contact</p>
                        <p className="text-xs text-gray-500">Family Member</p>
                      </div>
                    </div>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-md px-3">Call</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selected Item Details Modal */}
          {(selectedIncident || selectedGeofence) && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1100] max-w-md w-full mx-4">
              <Card className="bg-white text-gray-900 shadow-xl border border-gray-200 rounded-xl overflow-hidden">
                <CardHeader className="border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      {selectedIncident ? 'Incident Details' : 'Geofence Details'}
                    </CardTitle>
                    <Button
                      onClick={() => {
                        setSelectedIncident(null);
                        setSelectedGeofence(null);
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700 rounded-full w-8 h-8 p-0"
                    >
                      ✕
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {selectedIncident && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 mb-1">Description</h4>
                          <p className="text-sm text-gray-600">{selectedIncident.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Severity:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          selectedIncident.severity === 'high' ? 'bg-red-100 text-red-800' :
                          selectedIncident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {selectedIncident.severity?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        <span className="text-sm text-gray-600">{selectedIncident.status}</span>
                      </div>
                      {selectedIncident.address && (
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 mb-1">Location</h4>
                            <p className="text-sm text-gray-600">{selectedIncident.address}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {selectedGeofence && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Alert Type:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          selectedGeofence.alertType === 'danger' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedGeofence.alertType?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Radius:</span>
                        <span className="text-sm text-gray-600">{selectedGeofence.radius} meters</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          selectedGeofence.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedGeofence.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
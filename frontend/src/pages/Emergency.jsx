import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function EmergencyContacts() {
  const navigate = useNavigate();
  const [emergencyContacts, setEmergencyContacts] = useState([
    { name: "", relation: "", phone: "" },
    { name: "", relation: "", phone: "" }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await axios.get('http://localhost:3000/users/profile', {
          withCredentials: true
        });
        if (response.data.success) {
          setIsAuthenticated(true);
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate("/login");
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#111714]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  const handleContactChange = (index, field, value) => {
    const updatedContacts = [...emergencyContacts];
    updatedContacts[index][field] = value;
    setEmergencyContacts(updatedContacts);
  };

  const handleNext = async () => {
    setError("");
    setLoading(true);

    // Validate emergency contacts
    const validContacts = emergencyContacts.filter(contact => 
      contact.name.trim() && contact.relation.trim() && contact.phone.trim()
    );

    if (validContacts.length === 0) {
      setError("Please provide at least one emergency contact");
      setLoading(false);
      return;
    }

    try {
      // Update user profile with emergency contacts
      const response = await axios.put('http://localhost:3000/users/profile', {
        emergencyContacts: validContacts
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        console.log('Emergency contacts updated:', response.data);
        navigate("/tripdetails"); // Redirect to TripDetails page
      } else {
        setError(response.data.message || "Failed to save emergency contacts");
      }
    } catch (error) {
      console.error('Error updating emergency contacts:', error);
      setError("Failed to save emergency contacts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col dark group/design-root overflow-x-hidden" style={{ fontFamily: "Spline Sans, Noto Sans, sans-serif" }}>
      <main className="flex-grow">
        <div
          className="flex h-screen flex-col items-center justify-center bg-cover bg-center bg-no-repeat p-4"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.6) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuAt_ZYQ3apsArvgGfnX6mjRF9eh2dotLxjOcVF5PxQGXnru6PjW6jOmhPI7eYo3hUonlfgz2x3Ksvqh7c62mWMsUPle-0NzcCUgwKHRsE1C5_xgky6dZiPvIAgu9OG8eVs8JbT79xFmCt0ELE1SG9A6Ip77uwVIWo4cPrdUXH9Enr30DvjiUuMZ9YNWJbat4w7VkjFkYuS-wxRzDy-5rVgYIgZ_fs5Ego9GUwIM601EeIJ4ZWocyzk2Ctq1FbZSvNDEkzs957DhfVVz")',
          }}
        >
          <div className="w-full max-w-2xl space-y-8 rounded-2xl bg-black/30 p-8 backdrop-blur-sm">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tighter text-white sm:text-5xl">Emergency Contacts</h1>
              <p className="mt-4 text-gray-300">Please provide details for two emergency contacts.</p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Step Indicator */}
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-600 text-gray-400">1</div>
                <span className="text-gray-400">Basic Info</span>
              </div>
              <div className="h-px w-12 bg-gray-600"></div>
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#38e07b] text-black">2</div>
                <span className="text-white">Emergency</span>
              </div>
              <div className="h-px w-12 bg-gray-600"></div>
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-600 text-gray-400">3</div>
                <span className="text-gray-400">Trip</span>
              </div>
              <div className="h-px w-12 bg-gray-600"></div>
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-600 text-gray-400">4</div>
                <span className="text-gray-400">KYC</span>
              </div>
            </div>

            {/* Emergency Contact Forms */}
            <div className="space-y-6">
              {/* Contact 1 */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-white">Emergency Contact 1</h3>
                <div className="space-y-4">
                  <input
                    value={emergencyContacts[0].name}
                    onChange={(e) => handleContactChange(0, 'name', e.target.value)}
                    className="w-full rounded-full border-gray-600 bg-gray-900/50 px-4 py-3 text-white placeholder-gray-400 focus:border-[#38e07b] focus:ring-[#38e07b] focus:outline-none"
                    placeholder="Full Name"
                    type="text"
                  />
                  <input
                    value={emergencyContacts[0].relation}
                    onChange={(e) => handleContactChange(0, 'relation', e.target.value)}
                    className="w-full rounded-full border-gray-600 bg-gray-900/50 px-4 py-3 text-white placeholder-gray-400 focus:border-[#38e07b] focus:ring-[#38e07b] focus:outline-none"
                    placeholder="Relation (e.g., Father, Mother, Spouse)"
                    type="text"
                  />
                  <input
                    value={emergencyContacts[0].phone}
                    onChange={(e) => handleContactChange(0, 'phone', e.target.value)}
                    className="w-full rounded-full border-gray-600 bg-gray-900/50 px-4 py-3 text-white placeholder-gray-400 focus:border-[#38e07b] focus:ring-[#38e07b] focus:outline-none"
                    placeholder="Phone Number"
                    type="tel"
                  />
                </div>
              </div>

              {/* Contact 2 */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-white">Emergency Contact 2</h3>
                <div className="space-y-4">
                  <input
                    value={emergencyContacts[1].name}
                    onChange={(e) => handleContactChange(1, 'name', e.target.value)}
                    className="w-full rounded-full border-gray-600 bg-gray-900/50 px-4 py-3 text-white placeholder-gray-400 focus:border-[#38e07b] focus:ring-[#38e07b] focus:outline-none"
                    placeholder="Full Name"
                    type="text"
                  />
                  <input
                    value={emergencyContacts[1].relation}
                    onChange={(e) => handleContactChange(1, 'relation', e.target.value)}
                    className="w-full rounded-full border-gray-600 bg-gray-900/50 px-4 py-3 text-white placeholder-gray-400 focus:border-[#38e07b] focus:ring-[#38e07b] focus:outline-none"
                    placeholder="Relation (e.g., Father, Mother, Spouse)"
                    type="text"
                  />
                  <input
                    value={emergencyContacts[1].phone}
                    onChange={(e) => handleContactChange(1, 'phone', e.target.value)}
                    className="w-full rounded-full border-gray-600 bg-gray-900/50 px-4 py-3 text-white placeholder-gray-400 focus:border-[#38e07b] focus:ring-[#38e07b] focus:outline-none"
                    placeholder="Phone Number"
                    type="tel"
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-between pt-4">
              <button 
                onClick={() => navigate("/register")}
                className="flex items-center justify-center gap-2 rounded-full border border-gray-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-800"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-full border border-gray-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  "Next"
                )}
              </button>
            </div>

            <div className="text-center text-sm text-gray-400">
              Already have an account?{" "}
              <a className="font-medium text-[#38e07b] hover:underline" href="#">
                Log in
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto w-full bg-[#111714] py-8 text-center">
        <div className="container mx-auto px-4">
          <div className="mb-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm">
            <a className="text-gray-400 hover:text-white" href="#">
              About Us
            </a>
            <a className="text-gray-400 hover:text-white" href="#">
              Contact
            </a>
            <a className="text-gray-400 hover:text-white" href="#">
              Privacy Policy
            </a>
            <a className="text-gray-400 hover:text-white" href="#">
              Terms of Service
            </a>
          </div>
          <p className="text-sm text-gray-500">© 2024 SafeTravels. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

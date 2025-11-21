import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function KycOtpPage() {
  const [showOtp, setShowOtp] = useState(false);
  const [formData, setFormData] = useState({
    aadhaarNumber: "",
    otp: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendOtp = async () => {
    setError("");
    setLoading(true);

    if (!formData.aadhaarNumber || formData.aadhaarNumber.length !== 12) {
      setError("Please enter a valid 12-digit Aadhaar number");
      setLoading(false);
      return;
    }

    try {
      // Simulate OTP sending (you can integrate with actual KYC service later)
      console.log('Sending OTP to Aadhaar:', formData.aadhaarNumber);
      setShowOtp(true);
      setError("");
    } catch (error) {
      console.error('Error sending OTP:', error);
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setLoading(true);

    if (!formData.otp || formData.otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      setLoading(false);
      return;
    }

    try {
      // Simulate OTP verification (you can integrate with actual KYC service later)
      console.log('Verifying OTP:', formData.otp);
      
      // Store KYC verification status
      localStorage.setItem('kycVerified', 'true');
      localStorage.setItem('aadhaarNumber', formData.aadhaarNumber);
      
      navigate("/DigitalTouristId");
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex size-full min-h-screen flex-col dark justify-between group/design-root overflow-x-hidden bg-[#111714]"
      style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}
    >
      <main className="flex-grow">
        <div
          className="flex h-screen flex-col items-center justify-center bg-cover bg-center bg-no-repeat p-4"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.6) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuAt_ZYQ3apsArvgGfnX6mjRF9eh2dotLxjOcVF5PxQGXnru6PjW6jOmhPI7eYo3hUonlfgz2x3Ksvqh7c62mWMsUPle-0NzcCUgwKHRsE1C5_xgky6dZiPvIAgu9OG8eVs8JbT79xFmCt0ELE1SG9A6Ip77uwVIWo4cPrdUXH9Enr30DvjiUuMZ9YNWJbat4w7VkjFkYuS-wxRzDy-5rVgYIgZ_fs5Ego9GUwIM601EeIJ4ZWocyzk2Ctq1FbZSvNDEkzs957DhfVVz")',
          }}
        >
          <div className="w-full max-w-2xl space-y-8 rounded-2xl bg-black/30 p-8 backdrop-blur-sm">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tighter text-white sm:text-5xl">
                KYC Verification
              </h1>
              <p className="mt-4 text-gray-300">
                Please enter your Aadhaar and verify with OTP.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Steps */}
            <div className="space-y-6">
              {/* ...steps code remains same */}

              {/* Aadhaar Input + Send OTP */}
              <div className="space-y-4">
                <input
                  name="aadhaarNumber"
                  value={formData.aadhaarNumber}
                  onChange={handleInputChange}
                  type="text"
                  maxLength={12}
                  placeholder="Enter 12-digit Aadhaar Number"
                  className="w-full rounded-full border-gray-600 bg-gray-900/50 px-4 py-3 text-white placeholder-gray-400 focus:border-[#38e07b] focus:ring-[#38e07b]"
                  required
                />

                <button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-600 bg-transparent py-3 text-sm font-bold text-white transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </button>
              </div>

              {/* OTP Input */}
              {showOtp && (
                <div className="space-y-4">
                  <input
                    name="otp"
                    value={formData.otp}
                    onChange={handleInputChange}
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    className="w-full rounded-full border-gray-600 bg-gray-900/50 px-4 py-3 text-white placeholder-gray-400 focus:border-[#38e07b] focus:ring-[#38e07b]"
                    required
                  />
                  <button
                    onClick={handleVerifyOtp}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-600 bg-transparent py-3 text-sm font-bold text-white transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Verifying...
                      </>
                    ) : (
                      "Verify OTP"
                    )}
                  </button>
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-between pt-4">
                <button
                  onClick={() => navigate("/tripdetails")}
                  className="flex items-center justify-center gap-2 rounded-full border border-gray-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-800"
                >
                  Back
                </button>

                {showOtp && (
                  <button
                    onClick={handleVerifyOtp}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 rounded-full border border-gray-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Verifying...
                      </>
                    ) : (
                      "Verify & Continue"
                    )}
                  </button>
                )}
              </div>

              {/* Footer link */}
              <div className="text-center text-sm text-gray-400">
                Already have an account?{" "}
                <a href="#" className="font-medium text-[#38e07b] hover:underline">
                  Log in
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

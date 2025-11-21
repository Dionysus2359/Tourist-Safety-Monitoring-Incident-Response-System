import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants';

export default function Layout({ children, showFooter = true }) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.HOME);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Header */}
      {isAuthenticated && (
        <header className="bg-[#111714] border-b border-gray-700">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold text-white">SafeTravels</h1>
                {user && (
                  <span className="text-sm text-gray-300">
                    Welcome, {user.name} ({user.role})
                  </span>
                )}
              </div>

              <nav className="flex items-center space-x-4">
                <button
                  onClick={() => navigate(ROUTES.DIGITAL_TOURIST_ID)}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Dashboard
                </button>

                {user?.role === 'admin' && (
                  <button
                    onClick={() => navigate(ROUTES.ADMIN)}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Admin Panel
                  </button>
                )}

                <button
                  onClick={() => navigate(ROUTES.EMERGENCY)}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Emergency
                </button>

                <button
                  onClick={() => navigate(ROUTES.SAFE)}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Safe Zones
                </button>

                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
                >
                  Logout
                </button>
              </nav>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 min-h-0 flex flex-col">
        {children}
      </main>

      {/* Footer */}
      {showFooter && (
        <footer className="bg-[#111714] py-8 text-center border-t border-gray-700">
          <div className="container mx-auto px-4">
            <div className="mb-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                About Us
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Contact
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </a>
            </div>

            <p className="text-sm text-gray-500">
              © 2024 SafeTravels. All rights reserved.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}

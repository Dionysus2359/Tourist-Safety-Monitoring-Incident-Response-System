import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ROUTES } from "../constants";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    console.log('🔐 Admin login attempt for:', email);

    const result = await login({ email, password });
    console.log('🔐 Admin login result:', result);

    if (result.success) {
      const userRole = result.user?.role;
      console.log('🔐 User role:', userRole);

      if (userRole === 'admin') {
        console.log('✅ Admin login successful, redirecting to admin dashboard');
        // Add a small delay to ensure AuthContext state is updated
        setTimeout(() => {
          console.log('🔀 Navigating to admin dashboard at:', new Date().toISOString());
          console.log('🔀 Current location before navigation:', window.location.pathname);
          navigate(ROUTES.ADMIN, { replace: true });
          console.log('🔀 Navigation called, should redirect now');
        }, 200); // Increased delay slightly
      } else {
        console.log('❌ User does not have admin role');
        setError("You do not have admin access.");
      }
    } else {
      console.log('❌ Admin login failed:', result.message);
      setError(result.message || "Login failed");
    }
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col dark group/design-root overflow-x-hidden" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
      <main className="flex-grow">
        <div
          className="flex h-screen flex-col items-center justify-center bg-cover bg-center bg-no-repeat p-4"
          style={{
            backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.6) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuAt_ZYQ3apsArvgGfnX6mjRF9eh2dotLxjOcVF5PxQGXnru6PjW6jOmhPI7eYo3hUonlfgz2x3Ksvqh7c62mWMsUPle-0NzcCUgwKHRsE1C5_xgky6dZiPvIAgu9OG8eVs8JbT79xFmCt0ELE1SG9A6Ip77uwVIWo4cPrdUXH9Enr30DvjiUuMZ9YNWJbat4w7VkjFkYuS-wxRzDy-5rVgYIgZ_fs5Ego9GUwIM601EeIJ4ZWocyzk2Ctq1FbZSvNDEkzs957DhfVVz")',
          }}
        >
          <div className="w-full max-w-md space-y-8 rounded-2xl bg-black/30 p-8 backdrop-blur-sm">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tighter text-white sm:text-5xl">
                 Admin Login
              </h1>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                </span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-full border border-gray-600 bg-transparent py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:border-green-400 focus:ring-green-400"
                  placeholder="Gmail"
                  type="email"
                />
              </div>

              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                </span>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-full border border-gray-600 bg-transparent py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:border-green-400 focus:ring-green-400"
                  placeholder="Password"
                  type="password"
                  onKeyDown={(e) => { if (e.key === 'Enter') { handleLogin(); } }}
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm text-center">{error}</div>
              )}
              <button
                onClick={handleLogin}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#38e07b] py-3 text-sm font-bold text-white transition-colors hover:bg-green-400 disabled:opacity-60"
              >
                <span className="material-symbols-outlined"></span>
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto w-full bg-[#111714] py-8 text-center">
        <div className="container mx-auto px-4">
          <div className="mb-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm">
            <a className="text-gray-400 hover:text-white" href="#">About Us</a>
            <a className="text-gray-400 hover:text-white" href="#">Contact</a>
            <a className="text-gray-400 hover:text-white" href="#">Privacy Policy</a>
            <a className="text-gray-400 hover:text-white" href="#">Terms of Service</a>
          </div>

          <div className="mb-4 flex justify-center gap-6">
            <a className="text-gray-400 hover:text-white" href="#">
              <svg aria-hidden="true" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.71v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
              </svg>
            </a>

            <a className="text-gray-400 hover:text-white" href="#">
              <svg aria-hidden="true" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path clipRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" fillRule="evenodd"></path>
              </svg>
            </a>

            <a className="text-gray-400 hover:text-white" href="#">
              <svg aria-hidden="true" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path clipRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.024.06 1.378.06 3.808s-.012 2.784-.06 3.808c-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.024.048-1.378.06-3.808.06s-2.784-.013-3.808-.06c-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.048-1.024-.06-1.378-.06-3.808s.012-2.784.06-3.808c.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 016.08 2.525c.636-.247 1.363-.416 2.427-.465C9.53 2.013 9.884 2 12.315 2zM12 7a5 5 0 100 10 5 5 0 000-10zm0 8a3 3 0 110-6 3 3 0 010 6zm6.406-11.845a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5z" fillRule="evenodd"></path>
              </svg>
            </a>
          </div>

          <p className="text-sm text-gray-500">© 2024 SafeTravels. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default AdminLogin;

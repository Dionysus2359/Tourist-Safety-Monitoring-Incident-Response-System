// Navbar.jsx
import React from "react";

export default function Navbar() {
  return (
    <nav className="w-full bg-[#111714] px-8 py-4 flex items-center justify-between">
      <div className="text-white font-bold text-xl">SafeTravels</div>
      <ul className="flex items-center gap-6 text-white">
        <li>
          <a href="/" className="hover:text-green-400 transition-colors">
            Home
          </a>
        </li>
        <li>
          <a href="/register" className="hover:text-green-400 transition-colors">
            Register
          </a>
        </li>
      </ul>
    </nav>
  );
}

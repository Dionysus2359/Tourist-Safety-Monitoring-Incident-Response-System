import React from "react";

const TouristDetails = () => {
  return (
    <div className="relative flex size-full min-h-screen flex-col justify-between group/design-root overflow-x-hidden" style={{ fontFamily: '"Lexend", "Noto Sans", sans-serif' }}>
      
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <img
          alt="background image"
          className="absolute inset-0 h-full w-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHYTBL5VXFVtCvGzustPexbcB65RHiJ6Ok06g3nCZDWrQJyr6d8v2c4ArPehA2gUoKP4EgJUE0OpHjlI-Fxh6Fe3yD9PZ4BY2JpJfJp61b3U3oaYepaVI75WOvvJLES1SISNtznhtBUrM2_BeL3_l2lTfv4CFIDirpbh0h91wGSU5LNu_kj980AjgPir1UxLxpvliGqDUNd5enOGw7JmE82jF5FD3ciHuyP-Cr0R6Dtu0ILr7xxO4UG2PNz19NDhosqzr5m1mrXI2E"
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>
      </div>

      {/* Top Navbar */}
      <div className="flex-grow">
        <div className="flex items-center bg-transparent p-4 pb-2 justify-between sticky top-0 z-10">
          <button className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-white text-xl font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
            Tourist Details
          </h1>
          <div className="size-10"></div>
        </div>

        <div className="p-4 space-y-6">
          {/* Tourist Info */}
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4">
              <img
                alt="Ethan Carter"
                className="w-16 h-16 rounded-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQYvI8dVqoLDW64wUG3n69sdFPSds4QcCm9hEexDCZtO0151Ws0DPH_D2oa6bgrHnIrnbwFuYNkvvjxdB3Zz5W5kx-8EFvOvBORUnoTWVKYavEclmBKfKaam7vhmW_xIrcPbGOG5oSDXc9IFZYZgFO1ihINqE5JrujS_ZXvcQHxeQ9lePxhpRUqMVsmCiGZx74JlLCym9voLV4xK0HSY2kQ-TUOBGP_StxAfQM_DdEFyCAdYkcsaOHqqhcVzvK3Ouj44-sYo7yng1l"
              />
              <div>
                <p className="text-white font-bold text-xl">Ethan Carter</p>
                <p className="text-gray-300 text-sm">Online</p>
              </div>
            </div>
            <div className="aspect-video bg-gray-700/50 rounded-lg">
              <img
                alt="Map view of tourist location"
                className="w-full h-full object-cover rounded-lg"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9E9z5rB7P7gJ0B4e8t6O5B7F8P9T0B3c7G9h1K7Z6r4P3o2N1M0Xz0V6f8T7w6H5G4I3J2L1k0p8s7Y5u4r3o2n1m0x"
              />
            </div>
          </div>

          {/* Digital ID */}
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-xl">
            <h2 className="text-white font-bold text-lg mb-4">Digital ID</h2>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-gray-700/50 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-white/50 text-5xl">qr_code_2</span>
              </div>
              <div className="space-y-1">
                <p className="text-gray-300 text-sm">Name: <span className="text-white font-semibold">Ethan Carter</span></p>
                <p className="text-gray-300 text-sm">Nationality: <span className="text-white font-semibold">American</span></p>
                <p className="text-gray-300 text-sm">ID: <span className="text-white font-semibold">ST-12345</span></p>
                <p className="text-gray-300 text-sm">Status: <span className="text-green-400 font-semibold">Verified</span></p>
              </div>
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-xl">
            <h2 className="text-white font-bold text-lg mb-4">Emergency Contacts</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    alt="Jane Carter"
                    className="w-12 h-12 rounded-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_s1fQ5f9g6Z8o7L4p3y2a1s0t9b8c7r6p5o4n3m2l1k0j9h8g7f6e5d4c3b2a1s0t9"
                  />
                  <div>
                    <p className="text-white font-semibold">Jane Carter</p>
                    <p className="text-gray-300 text-sm">Spouse</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined">call</span>
                  </button>
                  <button className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined">chat</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    alt="US Embassy"
                    className="w-12 h-12 rounded-full object-cover bg-gray-500 flex items-center justify-center"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQF2e5f3t1q9z8x7v6o5p4n3m2l1k0j9h8g7f6e5d4c3b2a1s0t9b8c7r6p5o4"
                  />
                  <div>
                    <p className="text-white font-semibold">US Embassy</p>
                    <p className="text-gray-300 text-sm">Official</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined">call</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navbar */}
      <div className="sticky bottom-0 bg-black/50 backdrop-blur-lg">
        <div className="flex gap-2 px-4 pb-3 pt-2">
          <a className="flex flex-1 flex-col items-center justify-end gap-1 text-gray-400" href="#">
            <div className="flex h-8 items-center justify-center">
              <span className="material-symbols-outlined">dashboard</span>
            </div>
            <p className="text-xs font-medium leading-normal tracking-[0.015em]">Dashboard</p>
          </a>
          <a className="flex flex-1 flex-col items-center justify-end gap-1 rounded-full text-[var(--primary-color)]" href="#">
            <div className="flex h-8 w-16 items-center justify-center rounded-full bg-[var(--primary-color)]/[.15] text-[var(--primary-color)]">
              <span className="material-symbols-outlined">group</span>
            </div>
            <p className="text-xs font-medium leading-normal tracking-[0.015em]">Tourists</p>
          </a>
          <a className="flex flex-1 flex-col items-center justify-end gap-1 text-gray-400" href="#">
            <div className="flex h-8 items-center justify-center">
              <span className="material-symbols-outlined">notifications</span>
            </div>
            <p className="text-xs font-medium leading-normal tracking-[0.015em]">Alerts</p>
          </a>
          <a className="flex flex-1 flex-col items-center justify-end gap-1 text-gray-400" href="#">
            <div className="flex h-8 items-center justify-center">
              <span className="material-symbols-outlined">settings</span>
            </div>
            <p className="text-xs font-medium leading-normal tracking-[0.015em]">Settings</p>
          </a>
        </div>
        <div className="h-3"></div>
      </div>
    </div>
  );
};

export default TouristDetails;

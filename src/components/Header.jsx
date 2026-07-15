/**
 * Header.jsx — NexuCV Premium Navigation
 */
import React, { useState, useContext } from 'react';
import { Key, Menu, X, User, LogOut, Sparkles, Users } from 'lucide-react';
import { AuthContext } from '../App.jsx';

/** NexuCV inline SVG logo */
function NexuCVLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22" fill="url(#logoGrad)" />
      <rect x="24" y="28" width="52" height="6" rx="3" fill="white" opacity="0.95" />
      <rect x="24" y="42" width="40" height="5" rx="2.5" fill="white" opacity="0.75" />
      <rect x="24" y="55" width="46" height="5" rx="2.5" fill="white" opacity="0.75" />
      <rect x="24" y="68" width="30" height="5" rx="2.5" fill="white" opacity="0.55" />
      <circle cx="74" cy="72" r="15" fill="#f59e0b" />
      <path d="M69 72l3.5 3.5L79.5 67" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const auth = useContext(AuthContext);

  const handleLogout = async () => {
    if (auth?.logout) await auth.logout();
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Glass blur bar */}
      <div
        className="border-b border-white/[0.06]"
        style={{ background: 'rgba(6,11,24,0.85)', backdropFilter: 'blur(20px)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ── */}
            <a href="/" className="flex items-center gap-3 group flex-shrink-0">
              <div className="transition-transform duration-300 group-hover:scale-105">
                <NexuCVLogo size={38} />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-white tracking-tight">Nexu</span>
                  <span className="text-xl font-black text-brand-gradient tracking-tight">CV</span>
                </div>
                <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase -mt-0.5">
                  AI Resume Intelligence
                </p>
              </div>
            </a>

            {/* ── Desktop nav ── */}
            <nav className="hidden md:flex items-center gap-2">
              {/* Recruiter Mode */}
              <a
                href="/recruiter"
                className="flex items-center gap-2 text-gray-300 hover:text-white text-sm font-medium px-3 py-2 rounded-xl hover:bg-navy-700 transition-all duration-200"
              >
                <Users size={15} />
                Recruiter Mode
              </a>

              {/* API key guide */}
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline text-sm"
              >
                <Key size={14} />
                Free API Key
              </a>

              {/* Powered by badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-indigo/25 text-xs font-medium text-brand-indigo/80"
                   style={{ background: 'rgba(99,102,241,0.06)' }}>
                <Sparkles size={12} />
                AI Powered
              </div>

              {/* Auth */}
              {auth?.isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-gray-300 hover:text-white text-sm font-medium px-3 py-2 rounded-xl hover:bg-navy-700 transition-all duration-200"
                >
                  <LogOut size={15} /> Sign Out
                </button>
              ) : (
                <a
                  href="/login"
                  className="flex items-center gap-2 text-gray-300 hover:text-white text-sm font-medium px-3 py-2 rounded-xl hover:bg-navy-700 transition-all duration-200"
                >
                  <User size={15} /> Sign In
                </a>
              )}
            </nav>

            {/* ── Mobile menu toggle ── */}
            <button
              className="md:hidden p-2 text-gray-300 hover:text-white rounded-xl hover:bg-navy-700 transition-colors duration-200"
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        {mobileOpen && (
          <div className="md:hidden border-t border-navy-600/50 animate-slide-down">
            <div className="px-4 py-4 space-y-2">
              <a
                href="/recruiter"
                className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-navy-700 rounded-xl text-sm"
              >
                <Users size={16} /> Recruiter Mode
              </a>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-navy-700 rounded-xl text-sm"
              >
                <Key size={16} /> Free API Key
              </a>
              {auth?.isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-navy-700 rounded-xl w-full text-left text-sm"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              ) : (
                <a
                  href="/login"
                  className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-navy-700 rounded-xl text-sm"
                >
                  <User size={16} /> Sign In
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;

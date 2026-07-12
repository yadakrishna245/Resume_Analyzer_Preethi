/**
 * Footer.jsx — NexuCV Premium Footer
 */
import React from 'react';
import { Shield, Zap, Github } from 'lucide-react';

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-navy-600/50">
      <div
        className="py-8"
        style={{ background: 'rgba(6,11,24,0.80)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">

            {/* Left — brand */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                <Zap size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  Nexu<span className="text-brand-gradient">CV</span>
                </p>
                <p className="text-xs text-gray-500">© {year} AI Resume Intelligence</p>
              </div>
            </div>

            {/* Center — privacy */}
            <div className="flex items-center gap-2 text-xs text-gray-500 text-center">
              <Shield size={13} className="text-accent-green flex-shrink-0" />
              <span>Your resume stays in your browser — never stored, never transmitted.</span>
            </div>

            {/* Right — links */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="glow-dot" />
                <span className="text-accent-green font-medium">All systems operational</span>
              </span>
            </div>

          </div>

          {/* Bottom line */}
          <div className="mt-6 pt-4 border-t border-navy-600/40 text-center text-xs text-gray-600">
            AI feedback is guidance, not a guarantee — always review suggestions before applying them.
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

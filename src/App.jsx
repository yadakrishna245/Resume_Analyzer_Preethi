/**
 * App.jsx — NexuCV Main Application
 *
 * Premium AI Resume Intelligence Platform
 * Branding: deep-space dark + indigo/violet gradient identity
 */
import React, { useState, createContext, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Sparkles, Zap, Target, Shield, ChevronRight, BarChart3 } from 'lucide-react';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import AISettings from './components/AISettings.jsx';
import ResumeUpload from './components/ResumeUpload.jsx';
import ResultsTabs from './components/ResultsTabs.jsx';
import awsConfig from './config/awsConfig.js';

// ─── Global Context ────────────────────────────────────────────────────────────
export const AppContext  = createContext(null);
export const AuthContext = createContext(null);

// ─── Stats displayed in hero ───────────────────────────────────────────────────
const STATS = [
  { value: '100pt', label: 'ATS Scoring Engine',   icon: BarChart3  },
  { value: '6+',    label: 'AI Providers',          icon: Sparkles   },
  { value: '0%',    label: 'Data Uploaded',         icon: Shield     },
  { value: '< 3s',  label: 'Instant Analysis',      icon: Zap        },
];

// ─── Feature pills shown under hero ────────────────────────────────────────────
const FEATURES = [
  '📊 ATS Score',
  '🤖 AI Deep Analysis',
  '🎯 JD Keyword Match',
  '📄 PDF · DOCX · TXT',
  '🔒 100% Private',
  '⚡ No API Key Needed for ATS',
];

// ─── Hero section ─────────────────────────────────────────────────────────────
function Hero() {
  return (
    <div className="relative text-center py-14 px-4 overflow-hidden">
      {/* Background glow blobs */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-20"
             style={{ background: 'radial-gradient(ellipse, #6366f1 0%, transparent 70%)' }} />
        <div className="absolute top-12 left-1/4 w-[200px] h-[200px] opacity-10 animate-float"
             style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)' }} />
        <div className="absolute top-8 right-1/4 w-[160px] h-[160px] opacity-10 animate-float"
             style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', animationDelay: '3s' }} />
      </div>

      {/* Eyebrow badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-indigo/30 text-sm font-medium mb-6"
           style={{ background: 'rgba(99,102,241,0.10)', color: '#a5b4fc' }}>
        <Sparkles size={14} />
        AI-Powered Resume Intelligence
        <span className="w-1.5 h-1.5 rounded-full bg-accent-green" style={{ boxShadow: '0 0 6px #10b981' }} />
      </div>

      {/* Main headline */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-4 leading-[1.1]">
        Land Your Dream Job
        <span className="block mt-1">
          with{' '}
          <span className="text-brand-gradient">NexuCV</span>
        </span>
      </h1>

      {/* Subline */}
      <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
        Instant ATS score, AI-powered feedback, and job description matching —
        all running privately in your browser.{' '}
        <span className="text-white font-medium">Your resume never leaves your device.</span>
      </p>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mb-10">
        {STATS.map(({ value, label, icon: Icon }) => (
          <div key={label} className="stat-card">
            <Icon size={18} className="text-brand-indigo mb-1 opacity-80" />
            <span className="text-2xl font-black text-white">{value}</span>
            <span className="text-[11px] text-gray-400 font-medium text-center">{label}</span>
          </div>
        ))}
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
        {FEATURES.map(f => (
          <span key={f} className="feature-pill">{f}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Section divider ──────────────────────────────────────────────────────────
function SectionDivider() {
  return (
    <div className="flex items-center gap-4 max-w-5xl mx-auto px-4 mb-6">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-navy-600" />
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-widest">
        <div className="w-1.5 h-1.5 rounded-full bg-brand-indigo" />
        Analyze Your Resume
        <div className="w-1.5 h-1.5 rounded-full bg-brand-violet" />
      </div>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-navy-600" />
    </div>
  );
}

// ─── Home page ────────────────────────────────────────────────────────────────
function HomePage() {
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [results,    setResults]    = useState(null);
  const [activeTab,  setActiveTab]  = useState('ats');

  return (
    <div className="flex flex-col">
      <Hero />
      <SectionDivider />
      <div className="max-w-5xl mx-auto px-4 pb-16 w-full space-y-6">
        <AISettings />
        <ResumeUpload
          resumeText={resumeText}
          setResumeText={setResumeText}
          targetRole={targetRole}
          setTargetRole={setTargetRole}
          setResults={setResults}
          setActiveTab={setActiveTab}
        />
        {results && (
          <ResultsTabs
            results={results}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            resumeText={resumeText}
            targetRole={targetRole}
          />
        )}
      </div>
    </div>
  );
}

// ─── Auth Provider ────────────────────────────────────────────────────────────
function SimpleAuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    user: null, isAuthenticated: false, isLoading: true, amplifyReady: false,
  });

  useEffect(() => { initAuth(); }, []);

  async function initAuth() {
    try {
      const { Amplify } = await import('aws-amplify');
      const { getCurrentUser, fetchUserAttributes } = await import('aws-amplify/auth');
      Amplify.configure(awsConfig);
      setAuthState(prev => ({ ...prev, amplifyReady: true }));
      try {
        const currentUser = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        setAuthState({ user: { ...currentUser, attributes }, isAuthenticated: true, isLoading: false, amplifyReady: true });
      } catch {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (err) {
      console.warn('Auth init (non-critical):', err.message);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }

  const login = async (email, password) => {
    try {
      const { signIn } = await import('aws-amplify/auth');
      const result = await signIn({ username: email, password });
      if (result.isSignedIn) {
        const { getCurrentUser, fetchUserAttributes } = await import('aws-amplify/auth');
        const currentUser = await getCurrentUser();
        const attributes  = await fetchUserAttributes();
        setAuthState({ user: { ...currentUser, attributes }, isAuthenticated: true, isLoading: false, amplifyReady: true });
        return { success: true };
      }
      return { success: false, nextStep: result.nextStep?.signInStep };
    } catch (err) { return { success: false, error: err.message || 'Login failed' }; }
  };

  const signup = async (email, password, name) => {
    try {
      const { signUp } = await import('aws-amplify/auth');
      const result = await signUp({ username: email, password, options: { userAttributes: { email, name: name || '' } } });
      return { success: true, complete: result.isSignUpComplete, nextStep: result.nextStep };
    } catch (err) { return { success: false, error: err.message || 'Signup failed' }; }
  };

  const confirmSignup = async (email, code) => {
    try {
      const { confirmSignUp } = await import('aws-amplify/auth');
      await confirmSignUp({ username: email, confirmationCode: code });
      return { success: true };
    } catch (err) { return { success: false, error: err.message || 'Verification failed' }; }
  };

  const logout = async () => {
    try {
      const { signOut } = await import('aws-amplify/auth');
      await signOut();
      setAuthState({ user: null, isAuthenticated: false, isLoading: false, amplifyReady: true });
    } catch (err) { console.error('Logout error:', err); }
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, signup, confirmSignup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Login / Signup Page ──────────────────────────────────────────────────────
function LoginPage() {
  const auth     = React.useContext(AuthContext);
  const navigate = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');
  const [code,     setCode]     = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [mode,     setMode]     = useState('login'); // login | signup | confirm

  const switchMode = m => { setMode(m); setError(''); };

  const handleLogin = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    const r = await auth.login(email, password);
    setLoading(false);
    if (r.success) navigate('/');
    else setError(r.error || 'Login failed');
  };

  const handleSignup = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    const r = await auth.signup(email, password, name);
    setLoading(false);
    if (r.success) setMode('confirm');
    else setError(r.error || 'Signup failed');
  };

  const handleConfirm = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    const r = await auth.confirmSignup(email, code);
    setLoading(false);
    if (r.success) { switchMode('login'); alert('Email verified! You can now sign in.'); }
    else setError(r.error || 'Verification failed');
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Brand mark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-2xl font-black text-white">
            Nexu<span className="text-brand-gradient">CV</span>
          </div>
          <p className="text-gray-400 text-sm mt-1">AI Resume Intelligence Platform</p>
        </div>

        <div className="card-glass">
          {mode === 'login' && (
            <>
              <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
              <p className="text-gray-400 text-sm mb-6">Sign in to access your account</p>
              <form onSubmit={handleLogin} className="space-y-4">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" className="input-field" required />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="input-field" required />
                {error && <p className="text-accent-red text-sm">{error}</p>}
                <button type="submit" disabled={loading} className="btn-brand w-full py-3">{loading ? 'Signing in…' : 'Sign In'}</button>
              </form>
              <p className="mt-5 text-center text-sm text-gray-400">
                No account?{' '}
                <button onClick={() => switchMode('signup')} className="text-brand-indigo hover:text-brand-violet font-semibold transition-colors">Create one free</button>
              </p>
            </>
          )}

          {mode === 'signup' && (
            <>
              <h2 className="text-2xl font-bold text-white mb-1">Create account</h2>
              <p className="text-gray-400 text-sm mb-6">Free — no credit card required</p>
              <form onSubmit={handleSignup} className="space-y-4">
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className="input-field" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" className="input-field" required />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min 8 chars)" className="input-field" required minLength={8} />
                {error && <p className="text-accent-red text-sm">{error}</p>}
                <button type="submit" disabled={loading} className="btn-brand w-full py-3">{loading ? 'Creating account…' : 'Create Account'}</button>
              </form>
              <p className="mt-5 text-center text-sm text-gray-400">
                Already have one?{' '}
                <button onClick={() => switchMode('login')} className="text-brand-indigo hover:text-brand-violet font-semibold transition-colors">Sign in</button>
              </p>
            </>
          )}

          {mode === 'confirm' && (
            <>
              <h2 className="text-2xl font-bold text-white mb-1">Verify your email</h2>
              <p className="text-gray-400 text-sm mb-6">Check your inbox for the 6-digit code</p>
              <form onSubmit={handleConfirm} className="space-y-4">
                <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="Verification code" className="input-field" required autoComplete="one-time-code" />
                {error && <p className="text-accent-red text-sm">{error}</p>}
                <button type="submit" disabled={loading} className="btn-brand w-full py-3">{loading ? 'Verifying…' : 'Verify Email'}</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Session expired overlay ──────────────────────────────────────────────────
function SessionExpiredOverlay({ onDismiss }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: 'rgba(6,11,24,0.97)' }}>
      <div className="card-glass max-w-md w-full text-center space-y-5 p-10">
        <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
             style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.30)' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">Session Expired</h2>
        <p className="text-gray-400 text-sm">
          Your session expired after 5 minutes of inactivity. API keys have been cleared for security.
        </p>
        <button onClick={onDismiss} className="btn-brand w-full py-3">Continue</button>
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
function App() {
  const [aiProvider,     setAiProvider]     = useState('default');
  const [aiConfig,       setAiConfig]       = useState({ model: '', baseUrl: '', apiKey: '' });
  const [sessionExpired, setSessionExpired] = useState(false);

  // Inactivity timer — 5 min, throttled to 1s on mousemove
  useEffect(() => {
    let timer;
    let lastReset = 0;
    const TIMEOUT  = 300_000; // 5 min
    const THROTTLE = 1_000;   // 1 s

    const reset = () => {
      const now = Date.now();
      if (now - lastReset < THROTTLE) return;
      lastReset = now;
      clearTimeout(timer);
      timer = setTimeout(() => {
        setAiConfig({ model: '', baseUrl: '', apiKey: '' });
        setAiProvider('default');
        setSessionExpired(true);
      }, TIMEOUT);
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(ev => window.addEventListener(ev, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach(ev => window.removeEventListener(ev, reset));
    };
  }, []);

  if (sessionExpired) return <SessionExpiredOverlay onDismiss={() => setSessionExpired(false)} />;

  return (
    <AppContext.Provider value={{ aiProvider, setAiProvider, aiConfig, setAiConfig }}>
      <SimpleAuthProvider>
        <Router>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/"       element={<HomePage  />} />
                <Route path="/login"  element={<LoginPage />} />
                <Route path="/signup" element={<LoginPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </SimpleAuthProvider>
    </AppContext.Provider>
  );
}

export default App;

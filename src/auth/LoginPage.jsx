import React, { useState } from 'react';
import { useAuth } from './AuthProvider';

/**
 * Login Page - Dark themed, matches main app design
 */
export default function LoginPage({ onNavigate }) {
  const { login, forgotPassword, confirmForgotPassword, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState('email'); // email | code
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (!result.success && result.error) {
        setLocalError(result.error);
      }
    } catch (err) {
      setLocalError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLocalError('');
    setIsLoading(true);

    if (resetStep === 'email') {
      const result = await forgotPassword(email);
      if (result.success) {
        setResetStep('code');
        setSuccessMessage('Verification code sent to your email.');
      } else {
        setLocalError(result.error);
      }
    } else {
      const result = await confirmForgotPassword(email, resetCode, newPassword);
      if (result.success) {
        setShowForgotPassword(false);
        setResetStep('email');
        setSuccessMessage('Password reset successful! Please sign in.');
      } else {
        setLocalError(result.error);
      }
    }
    setIsLoading(false);
  };

  const displayError = localError || error;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo / Header */}
        <div style={styles.header}>
          <div style={styles.logo}>📄</div>
          <h1 style={styles.title}>AI Resume Analyzer</h1>
          <p style={styles.subtitle}>
            {showForgotPassword ? 'Reset your password' : 'Sign in to your account'}
          </p>
        </div>

        {/* Error display */}
        {displayError && (
          <div style={styles.errorBox}>
            <span style={styles.errorIcon}>⚠️</span>
            {displayError}
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div style={styles.successBox}>
            <span>✅</span> {successMessage}
          </div>
        )}

        {/* Forgot Password Form */}
        {showForgotPassword ? (
          <form onSubmit={handleForgotPassword} style={styles.form}>
            {resetStep === 'email' ? (
              <div style={styles.field}>
                <label style={styles.label}>Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={styles.input}
                  aria-label="Email address"
                />
              </div>
            ) : (
              <>
                <div style={styles.field}>
                  <label style={styles.label}>Verification Code</label>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="Enter code from email"
                    required
                    style={styles.input}
                    aria-label="Verification code"
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    required
                    minLength={8}
                    style={styles.input}
                    aria-label="New password"
                  />
                </div>
              </>
            )}

            <button type="submit" disabled={isLoading} style={styles.button}>
              {isLoading ? 'Sending...' : resetStep === 'email' ? 'Send Reset Code' : 'Reset Password'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setResetStep('email');
                setLocalError('');
              }}
              style={styles.linkButton}
            >
              ← Back to sign in
            </button>
          </form>
        ) : (
          /* Login Form */
          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                style={styles.input}
                aria-label="Email address"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                style={styles.input}
                aria-label="Password"
              />
            </div>

            <div style={styles.row}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={styles.checkbox}
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true);
                  setLocalError('');
                  setSuccessMessage('');
                }}
                style={styles.forgotLink}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" disabled={isLoading} style={styles.button}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Sign up link */}
        {!showForgotPassword && (
          <p style={styles.footer}>
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => onNavigate('signup')}
              style={styles.signupLink}
            >
              Sign up
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

/* Dark theme styles */
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: 'rgba(30, 30, 60, 0.9)',
    borderRadius: '16px',
    padding: '40px',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logo: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#a0a0c0',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#c0c0e0',
  },
  input: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    background: 'rgba(15, 15, 35, 0.8)',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#a0a0c0',
    cursor: 'pointer',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    accentColor: '#6366f1',
  },
  forgotLink: {
    background: 'none',
    border: 'none',
    color: '#818cf8',
    fontSize: '13px',
    cursor: 'pointer',
    padding: 0,
  },
  button: {
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    marginTop: '8px',
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#818cf8',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '14px',
    color: '#a0a0c0',
  },
  signupLink: {
    background: 'none',
    border: 'none',
    color: '#818cf8',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: 0,
  },
  errorBox: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
    fontSize: '13px',
    color: '#fca5a5',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  errorIcon: {
    flexShrink: 0,
  },
  successBox: {
    background: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
    fontSize: '13px',
    color: '#86efac',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
};

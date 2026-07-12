import React, { useState } from 'react';
import { useAuth } from './AuthProvider';

/**
 * Signup Page - Dark themed with confirmation code step
 */
export default function SignupPage({ onNavigate }) {
  const { signup, confirmSignup, error, clearError } = useAuth();

  const [step, setStep] = useState('signup'); // signup | confirm
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    // Validation
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    if (!acceptTerms) {
      setLocalError('Please accept the terms and conditions.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signup(email, password, name);
      if (result.success && !result.complete) {
        setStep('confirm');
      } else if (result.error) {
        setLocalError(result.error);
      }
    } catch (err) {
      setLocalError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();
    setIsLoading(true);

    try {
      const result = await confirmSignup(email, code);
      if (result.success) {
        onNavigate('login');
      } else {
        setLocalError(result.error || 'Verification failed.');
      }
    } catch (err) {
      setLocalError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>📄</div>
          <h1 style={styles.title}>
            {step === 'signup' ? 'Create Account' : 'Verify Email'}
          </h1>
          <p style={styles.subtitle}>
            {step === 'signup'
              ? 'Start analyzing resumes with AI'
              : `We sent a code to ${email}`}
          </p>
        </div>

        {/* Error display */}
        {displayError && (
          <div style={styles.errorBox}>
            <span>⚠️</span> {displayError}
          </div>
        )}

        {/* Confirmation Code Step */}
        {step === 'confirm' ? (
          <form onSubmit={handleConfirm} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 6-digit code"
                required
                maxLength={6}
                style={styles.input}
                autoFocus
                aria-label="Verification code"
              />
              <span style={styles.hint}>Check your email for the verification code</span>
            </div>

            <button type="submit" disabled={isLoading} style={styles.button}>
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>

            <button
              type="button"
              onClick={() => setStep('signup')}
              style={styles.linkButton}
            >
              ← Back to sign up
            </button>
          </form>
        ) : (
          /* Signup Form */
          <form onSubmit={handleSignup} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                autoComplete="name"
                style={styles.input}
                aria-label="Full name"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Email Address</label>
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
                placeholder="Min 8 chars, uppercase, lowercase, number"
                required
                minLength={8}
                autoComplete="new-password"
                style={styles.input}
                aria-label="Password"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                minLength={8}
                autoComplete="new-password"
                style={styles.input}
                aria-label="Confirm password"
              />
            </div>

            {/* Password requirements hint */}
            <div style={styles.requirements}>
              <p style={styles.reqTitle}>Password requirements:</p>
              <ul style={styles.reqList}>
                <li style={password.length >= 8 ? styles.reqMet : styles.reqUnmet}>
                  At least 8 characters
                </li>
                <li style={/[A-Z]/.test(password) ? styles.reqMet : styles.reqUnmet}>
                  One uppercase letter
                </li>
                <li style={/[a-z]/.test(password) ? styles.reqMet : styles.reqUnmet}>
                  One lowercase letter
                </li>
                <li style={/[0-9]/.test(password) ? styles.reqMet : styles.reqUnmet}>
                  One number
                </li>
              </ul>
            </div>

            {/* Terms acceptance */}
            <label style={styles.termsLabel}>
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                style={styles.checkbox}
              />
              <span>
                I agree to the{' '}
                <a href="#terms" style={styles.termsLink}>Terms of Service</a>
                {' '}and{' '}
                <a href="#privacy" style={styles.termsLink}>Privacy Policy</a>
              </span>
            </label>

            <button type="submit" disabled={isLoading || !acceptTerms} style={{
              ...styles.button,
              opacity: (!acceptTerms || isLoading) ? 0.5 : 1,
            }}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Login link */}
        {step === 'signup' && (
          <p style={styles.footer}>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => onNavigate('login')}
              style={styles.loginLink}
            >
              Sign in
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
    maxWidth: '440px',
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
    gap: '16px',
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
  hint: {
    fontSize: '12px',
    color: '#808090',
  },
  requirements: {
    background: 'rgba(15, 15, 35, 0.5)',
    borderRadius: '8px',
    padding: '12px 16px',
  },
  reqTitle: {
    fontSize: '12px',
    color: '#a0a0c0',
    margin: '0 0 8px 0',
  },
  reqList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  reqMet: {
    fontSize: '12px',
    color: '#4ade80',
  },
  reqUnmet: {
    fontSize: '12px',
    color: '#6b7280',
  },
  termsLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    fontSize: '13px',
    color: '#a0a0c0',
    cursor: 'pointer',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    marginTop: '2px',
    accentColor: '#6366f1',
    flexShrink: 0,
  },
  termsLink: {
    color: '#818cf8',
    textDecoration: 'none',
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
  loginLink: {
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
};

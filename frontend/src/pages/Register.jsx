import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { Compass, School, Mail, KeyRound, ArrowLeft, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';

export const Register = () => {
  const [step, setStep] = useState(1); // 1 = Details, 2 = OTP Verification
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes (300s)

  const { register } = useAuth();
  const navigate = useNavigate();

  // Timer countdown for OTP expiry
  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Step 1: Send OTP to Gmail address
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await authApi.sendOtp(email.trim().toLowerCase());
      setStep(2);
      setCountdown(300);
      setSuccessMsg(res.message || 'Verification code sent to your Gmail address!');
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Check your Gmail address.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resending || countdown > 240) return;
    setResending(true);
    setError('');
    try {
      const res = await authApi.sendOtp(email.trim().toLowerCase());
      setCountdown(300);
      setSuccessMsg(res.message || 'A fresh verification code has been dispatched to your email!');
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  // Step 2: Verify OTP and Complete Registration
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register(name.trim(), email.trim().toLowerCase(), password, otp.trim());
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      backgroundColor: 'var(--bg-primary)',
    }}>
      <div className="surface-card" style={{
        maxWidth: 860,
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr 1.2fr',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
        borderRadius: 'var(--radius-xl)',
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}>
        {/* Left Side: Brand & Campus Info */}
        <div style={{
          background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
          color: '#FFFFFF',
          padding: '3rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              marginBottom: '2rem',
            }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(8px)',
              }}>
                <Compass size={22} color="#FFFFFF" />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em' }}>CampusTrack</span>
            </div>

            <h1 style={{ fontSize: '2.1rem', fontWeight: 800, lineHeight: 1.2, color: '#FFFFFF' }}>
              {step === 1 ? 'Join SVCE Network 🎓' : 'Verify Email 🔒'}
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.925rem', marginTop: '0.6rem', lineHeight: 1.5 }}>
              {step === 1 
                ? 'Create your verified student account to report lost items, match belongings, and connect on campus.'
                : `We sent a 6-digit one-time code to ${email}. Check your inbox or spam folder.`}
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(10px)',
            marginTop: '2rem',
          }}>
            <ShieldCheck size={28} color="#93c5fd" />
            <div style={{ fontSize: '0.8rem', color: '#f0fdf4', lineHeight: 1.4 }}>
              <strong>Official Campus Security:</strong><br />
              Registration requires verified student credentials (@svce.edu.in).
            </div>
          </div>
        </div>

        {/* Right Side: Step-based Form */}
        <div style={{ padding: '2.5rem 2rem', backgroundColor: 'var(--bg-surface)' }}>
          {/* Segmented Top Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '2px solid var(--border-subtle)',
            marginBottom: '1.75rem',
          }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                flex: 1,
                paddingBottom: '0.65rem',
                fontWeight: 600,
                fontSize: '0.95rem',
                color: 'var(--text-muted)',
              }}
            >
              Sign In
            </button>
            <button
              style={{
                flex: 1,
                paddingBottom: '0.65rem',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: 'var(--accent-blue)',
                borderBottom: '2px solid var(--accent-blue)',
                marginBottom: '-2px',
              }}
            >
              {step === 1 ? 'Create Account' : 'Email Verification'}
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--status-lost-bg)',
              border: '1px solid var(--status-lost-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--status-lost-text)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              lineHeight: 1.4,
            }}>
              {error}
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--status-found-bg)',
              border: '1px solid var(--status-found-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--status-found-text)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {step === 1 ? (
            /* STEP 1: Registration Form */
            <form onSubmit={handleSendOtp}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Arjun Mehta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gmail Address</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="yourname@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Mail size={18} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password (min 6 characters)</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-coral"
                style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-md)', fontSize: '0.95rem', fontWeight: 700, marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Sending Verification Code...</span>
                  </>
                ) : (
                  <>
                    <Mail size={18} />
                    <span>Send Verification Code</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: 6-Digit OTP Verification */
            <form onSubmit={handleVerifyAndRegister}>
              <div style={{
                textAlign: 'center',
                padding: '1.25rem 1rem',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '1.5rem',
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: 'rgba(37, 99, 235, 0.1)',
                  color: 'var(--accent-blue)',
                  marginBottom: '0.75rem',
                }}>
                  <KeyRound size={24} />
                </div>
                <div style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Enter 6-Digit Code
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Sent to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
                </div>

                <div style={{ marginTop: '1.25rem' }}>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    style={{
                      width: '100%',
                      maxWidth: 240,
                      textAlign: 'center',
                      fontSize: '1.75rem',
                      fontWeight: 800,
                      letterSpacing: '0.4rem',
                      padding: '0.65rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '2px solid var(--accent-blue)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace',
                    }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.8125rem', color: countdown > 0 ? 'var(--text-secondary)' : 'var(--status-lost-text)' }}>
                  <span>Code expires in: <strong>{formatTime(countdown)}</strong></span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="btn btn-coral"
                style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-md)', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Verify & Create Account</span>
                  </>
                )}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', fontSize: '0.8125rem' }}>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <ArrowLeft size={14} />
                  <span>Edit Details</span>
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending || countdown > 240}
                  style={{
                    color: (resending || countdown > 240) ? 'var(--text-muted)' : 'var(--accent-blue)',
                    background: 'none',
                    border: 'none',
                    fontWeight: 600,
                    cursor: (resending || countdown > 240) ? 'not-allowed' : 'pointer',
                    padding: 0,
                  }}
                >
                  {resending ? 'Resending...' : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

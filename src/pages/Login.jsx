import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/images/logo.png';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { sendOtp, verifyOtp } = useAuth();

  const [step,   setStep]   = useState(1); // 1=phone, 2=otp
  const [mobile, setMobile] = useState('');
  const [otp,    setOtp]    = useState('');
  const [error,  setError]  = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (mobile.replace(/\D/g,'').length !== 10) { setError('Enter a valid 10-digit mobile number.'); return; }
    setLoading(true); setError('');
    const res = await sendOtp(mobile.replace(/\D/g,''));
    setLoading(false);
    if (!res.success) { setError(res.message); return; }
    setStep(2);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await verifyOtp(mobile.replace(/\D/g,''), otp);
    setLoading(false);
    if (!res.success) { setError(res.message); return; }
    
    // Redirect based on role
    if (res.user.role === 'worker') {
      navigate('/worker/dashboard');
    } else {
      navigate('/portal/home');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <a href="/" className="login-logo"><img src={logoImg} alt="TSR Logo" /></a>

        {/* Back */}
        <button className="login-back" onClick={() => step === 2 ? setStep(1) : navigate('/')}>
          ← {step === 2 ? 'Change Number' : 'Back to Home'}
        </button>

        <div className="login-top-bar" />

        <h1 className="login-title">Staff Portal</h1>
        <p className="login-sub">
          {step === 1
            ? 'Enter your registered mobile number'
            : `OTP sent to +91 ${mobile} — Enter below`}
        </p>

        {/* Step 1 – Mobile */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="login-field">
              <label>Mobile Number</label>
              <div className="login-input-wrap">
                <span className="login-prefix">+91</span>
                <input
                  type="tel"
                  placeholder="XXXXX XXXXX"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  maxLength={12}
                  autoFocus
                />
              </div>
            </div>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
            <p className="login-demo-hint">
              Demo: 8830227359 (Admin) · 9999999991 (Sup) · 9999999992 (Client) · 9999999993 (Worker)
            </p>
          </form>
        )}

        {/* Step 2 – OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div className="login-field">
              <label>One Time Password</label>
              <input
                type="text"
                placeholder="• • • • • •"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                maxLength={6}
                className="login-otp-input"
                autoFocus
              />
            </div>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? 'Verifying…' : 'Verify & Login'}
            </button>
            <button type="button" className="login-resend" onClick={() => setStep(1)}>Resend OTP</button>
            <p className="login-demo-hint">Demo OTP: <strong>123456</strong></p>
          </form>
        )}

        <div className="login-secure">
          🔒 Secure Staff Access Only
        </div>
      </div>
    </div>
  );
}

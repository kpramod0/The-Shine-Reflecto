import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/images/logo.png';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { sendOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [otpInfo, setOtpInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const cleanMobile = mobile.replace(/\D/g, '');
  const showReturnedOtp = import.meta.env.DEV && otpInfo?.otp;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (cleanMobile.length !== 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setError('');
    setOtpInfo(null);
    const res = await sendOtp(cleanMobile);
    setLoading(false);

    if (!res.success) {
      setError(res.message);
      if (res.code === 'not_registered') {
        window.alert(res.message);
      }
      return;
    }

    setOtpInfo({
      message: res.message,
      otp: res.otp,
      expiresAt: res.expiresAt,
    });
    setStep(2);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');
    const res = await verifyOtp(cleanMobile, otp);
    setLoading(false);

    if (!res.success) {
      setError(res.message);
      return;
    }

    if (res.user.role === 'worker') {
      navigate('/worker/dashboard');
    } else {
      navigate('/portal/home');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <a href="/" className="login-logo"><img src={logoImg} alt="TSR Logo" /></a>

        <button className="login-back" onClick={() => step === 2 ? setStep(1) : navigate('/')}>
          &larr; {step === 2 ? 'Change Number' : 'Back to Home'}
        </button>

        <div className="login-top-bar" />

        <h1 className="login-title">Staff Portal</h1>
        <p className="login-sub">
          {step === 1
            ? 'Enter your registered mobile number'
            : otpInfo?.message || `OTP sent to +91 ${mobile}. Enter it below.`}
        </p>

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
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
            <p className="login-demo-hint">Use the mobile number registered with TSR.</p>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div className="login-field">
              <label>One Time Password</label>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                maxLength={6}
                className="login-otp-input"
                autoFocus
              />
            </div>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button type="button" className="login-resend" onClick={() => setStep(1)}>Resend OTP</button>
            <p className="login-demo-hint">
              {showReturnedOtp ? (
                <>Testing OTP: <strong>{otpInfo.otp}</strong></>
              ) : (
                'Enter the OTP sent to your mobile.'
              )}
            </p>
          </form>
        )}

        <div className="login-secure">
          Secure Staff Access Only
        </div>
      </div>
    </div>
  );
}

import { createContext, useContext, useState, useEffect } from 'react';
import { logoutAllFromApi, logoutFromApi, requestOtp, restoreCurrentUser, verifyOtp as verifyOtpWithApi } from '../services/authApi';
import { clearAuthStorage, getStoredUser, saveUser } from '../services/tokenStorage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser());
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const restoredUser = await restoreCurrentUser(getStoredUser());
        if (!cancelled && restoredUser) {
          setUser(restoredUser);
          saveUser(restoredUser);
        } else if (!cancelled) {
          setUser(null);
          clearAuthStorage();
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          clearAuthStorage();
        }
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }

    restoreSession();
    return () => { cancelled = true; };
  }, []);

  const sendOtp = async (mobile) => {
    try {
      const data = await requestOtp(mobile);
      return {
        success: true,
        message: data?.detail || 'OTP sent successfully.',
        otp: data?.otp,
        expiresAt: data?.expires_at,
      };
    } catch (error) {
      const isNotRegistered = error.status === 400 || /not registered|not found|does not exist/i.test(error.message || '');

      return {
        success: false,
        code: isNotRegistered ? 'not_registered' : 'otp_failed',
        message: isNotRegistered
          ? 'User not registered. Please contact administrator.'
          : error.message || 'Unable to send OTP. Please try again.',
      };
    }
  };

  const verifyOtp = async (mobile, otp) => {
    try {
      const { user: loggedUser } = await verifyOtpWithApi(mobile, otp);
      if (!loggedUser) {
        return { success: false, message: 'Login succeeded, but user details were not found.' };
      }

      setUser(loggedUser);
      saveUser(loggedUser);
      return { success: true, user: loggedUser };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Invalid OTP. Please try again.',
      };
    }
  };

  const logout = async () => {
    try {
      await logoutFromApi();
    } catch {
      // Local logout should still happen if the network/API rejects the request.
    }
    setUser(null);
    clearAuthStorage();
  };

  const logoutAll = async () => {
    try {
      await logoutAllFromApi();
    } catch {
      // Local logout should still happen if the network/API rejects the request.
    }
    setUser(null);
    clearAuthStorage();
  };

  return (
    <AuthContext.Provider value={{ user, initializing, sendOtp, verifyOtp, logout, logoutAll }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

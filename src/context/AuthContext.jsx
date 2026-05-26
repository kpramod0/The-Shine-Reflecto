import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Mock user database
const MOCK_USERS = {
  '8830227359': { role: 'admin',      name: 'Admin User' },
  '9999999991': { role: 'supervisor', name: 'Supervisor One' },
  '9999999992': { role: 'client',     name: 'Client One' },
  '9999999993': { role: 'worker',     name: 'Worker One' },
  '9999999994': { role: 'staff',      name: 'Office Staff' },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('tsr_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const sendOtp = async (mobile) => {
    if (!MOCK_USERS[mobile]) {
      return { success: false, message: 'You are not registered. Please contact administrator.' };
    }
    // In production: fire API to send real OTP
    return { success: true, message: 'OTP sent successfully.' };
  };

  const verifyOtp = async (mobile, otp) => {
    if (otp !== '123456') {
      return { success: false, message: 'Invalid OTP. Please try again.' };
    }
    const userData = MOCK_USERS[mobile];
    if (!userData) {
      return { success: false, message: 'You are not registered. Please contact administrator.' };
    }
    const loggedUser = { mobile, ...userData };
    
    // Save to state and storage
    setUser(loggedUser);
    localStorage.setItem('tsr_user', JSON.stringify(loggedUser));
    
    return { success: true, user: loggedUser };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('tsr_user');
  };

  return (
    <AuthContext.Provider value={{ user, sendOtp, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

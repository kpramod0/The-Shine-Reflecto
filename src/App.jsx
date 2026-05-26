import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Landing page sections
import Navbar      from './components/Navbar';
import Hero        from './components/Hero';
import Stats       from './components/Stats';
import AboutLegacy from './components/AboutLegacy';
import Footer      from './components/Footer';
import {
  Residential, Services, Transformation, Industries,
  Technology, Process, Testimonials, Gallery,
} from './components/Sections';
import { Estimate, Contact, FinalCTA } from './components/EstimateContact';

// Animated Icons
import fixWhatsappGif from './assets/icons/Animated Icon/fix_whatsapp.gif';

// Pages
import Login from './pages/Login';

// Portal
import PortalLayout from './layouts/PortalLayout';
import {
  PortalHome, PortalMember, PortalManagement, PortalDashboard,
} from './pages/portal/PortalPages';

// Worker Portal
import WorkerLayout from './layouts/WorkerLayout';
import WorkerDashboard from './pages/worker/WorkerDashboard';
import AttendanceRecords from './pages/worker/AttendanceRecords';
import {
  WorkerHome, WorkerMember, WorkerManagement,
  WorkerTaskManager, WorkerRequest, WorkerComplaint, WorkerMaterialRequirement,
  WorkerTicket, WorkerPayment, WorkerTechnicalTeam, WorkerRoasterMaster,
  WorkerProfile, WorkerSettings
} from './pages/worker/WorkerPlaceholderPages';

// ── Landing Page ──────────────────────────────────────────────
function LandingPage() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal-up').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Navbar />
      <div className="reveal-up"><Hero /></div>
      <div className="reveal-up"><Stats /></div>
      <div className="reveal-up"><AboutLegacy /></div>
      <div className="reveal-up"><Residential /></div>
      <div className="reveal-up"><Services /></div>
      <div className="reveal-up"><Transformation /></div>
      <div className="reveal-up"><Industries /></div>
      <div className="reveal-up"><Technology /></div>
      <div className="reveal-up"><Process /></div>
      <div className="reveal-up"><Estimate /></div>
      <div className="reveal-up"><Gallery /></div>
      <div className="reveal-up"><Testimonials /></div>
      <div className="reveal-up"><Contact /></div>
      <div className="reveal-up"><FinalCTA /></div>
      <Footer />

      {/* Floating WhatsApp button */}
      <a
        href="https://wa.me/918830227359"
        target="_blank"
        rel="noreferrer"
        className="whatsapp-float"
        aria-label="Chat on WhatsApp"
      >
        <img src={fixWhatsappGif} alt="WhatsApp" className="whatsapp-float-gif" />
      </a>
    </>
  );
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/"      element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

          {/* Portal – protected */}
          <Route path="/portal" element={
            <ProtectedRoute allowedRoles={['admin', 'supervisor', 'client', 'staff']}>
              <PortalLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home"       element={<PortalHome />} />
            <Route path="member"     element={<PortalMember />} />
            <Route path="management" element={<PortalManagement />} />
            <Route path="dashboard"  element={<PortalDashboard />} />
          </Route>

          {/* Worker Portal – protected */}
          <Route path="/worker" element={
            <ProtectedRoute allowedRoles={['worker']}>
              <WorkerLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"  element={<WorkerDashboard />} />
            <Route path="home"       element={<WorkerHome />} />
            <Route path="member"     element={<WorkerMember />} />
            <Route path="management" element={<WorkerManagement />} />
            <Route path="attendance-records" element={<AttendanceRecords />} />
            <Route path="attendance-breakdown" element={<Navigate to="/worker/attendance-records" replace />} />
            <Route path="task-manager" element={<WorkerTaskManager />} />
            <Route path="request" element={<WorkerRequest />} />
            <Route path="complaint" element={<WorkerComplaint />} />
            <Route path="material-requirement" element={<WorkerMaterialRequirement />} />
            <Route path="ticket" element={<WorkerTicket />} />
            <Route path="payment" element={<WorkerPayment />} />
            <Route path="technical-team" element={<WorkerTechnicalTeam />} />
            <Route path="roaster-master" element={<WorkerRoasterMaster />} />
            <Route path="profile" element={<WorkerProfile />} />
            <Route path="settings" element={<WorkerSettings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

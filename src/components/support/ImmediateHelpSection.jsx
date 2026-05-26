import React from 'react';
import './ImmediateHelpSection.css';

const HeadsetIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="help-icon-phone">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="help-icon-mail">
    <rect width="20" height="16" x="2" y="4" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const MessageCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="help-icon-wa">
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
  </svg>
);

export const ImmediateHelpSection = ({ className = '' }) => {
  const handlePhoneClick = () => {
    window.location.href = "tel:9155361733";
  };

  const handleEmailClick = () => {
    window.location.href = "mailto:pramod@theshinereflecto.com";
  };

  const handleWhatsAppClick = () => {
    window.open("https://wa.me/919155361733", "_blank");
  };

  return (
    <div className={`immediate-help-section ${className}`}>
      <div className="immediate-help-header">
        <div className="immediate-help-icon-wrap">
          <HeadsetIcon />
        </div>
        <div>
          <h2 className="immediate-help-title">Need Immediate Help?</h2>
          <p className="immediate-help-subtitle">Contact our technical support team</p>
        </div>
      </div>
      <div className="immediate-help-contacts">
        <div className="help-contact-item" onClick={handlePhoneClick}>
          <PhoneIcon />
          <span>9155361733</span>
        </div>
        <div className="help-contact-item" onClick={handleEmailClick}>
          <MailIcon />
          <span>pramod@theshinereflecto.com</span>
        </div>
        <div className="help-contact-item" onClick={handleWhatsAppClick}>
          <MessageCircleIcon />
          <span>WhatsApp</span>
        </div>
      </div>
    </div>
  );
};

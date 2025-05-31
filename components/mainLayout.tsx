'use client';

import { useState, useEffect } from 'react';
import NotificationSidebar from './notificationSidebar';
import UserSidebar from './userSidebar';
import MainContent from './mainContent';
import EmailRegistrationForm from './emailRegistrationForm';

export default function MainLayout() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(true);

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      setUserEmail(storedEmail);
      setShowEmailForm(false);
    }
  }, []);

  const handleEmailSubmit = async (email: string) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      localStorage.setItem('userEmail', email);
      setUserEmail(email);
      setShowEmailForm(false);
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    setUserEmail(null);
    setShowEmailForm(true);
  };

  if (showEmailForm) {
    return <EmailRegistrationForm onEmailSubmit={handleEmailSubmit} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Fixed positioned sidebars */}
      <div className="fixed left-0 top-0 h-screen z-10">
        <NotificationSidebar email={userEmail || ""} />
      </div>
      
      {/* Main content with proper margins */}
      <MainContent userEmail={userEmail} onLogout={handleLogout} />
      
      {/* Fixed positioned right sidebar */}
      <div className="fixed right-0 top-0 h-screen z-10">
        <UserSidebar currentUserEmail={userEmail || ""} />
      </div>
    </div>
  );
}
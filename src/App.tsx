/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Website from './components/Website';
import MemberPortal from './components/MemberPortal';
import AdminPortal from './components/AdminPortal';
import { MemberProfile } from './types';

export default function App() {
  const [view, setView] = useState<'website' | 'member' | 'admin'>('website');
  const [initialVerifyNo, setInitialVerifyNo] = useState<string | undefined>(undefined);

  // Unified global auth states
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [currentProfile, setCurrentProfile] = useState<MemberProfile | null>(null);
  const [isMemberLoggedIn, setIsMemberLoggedIn] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Dynamic router to handle QR code scans or direct links to certificate verification
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/verify/')) {
      const parts = path.split('/');
      if (parts.length > 2) {
        const licenceNo = parts[2];
        setInitialVerifyNo(decodeURIComponent(licenceNo));
        setView('website');
      }
    }
  }, []);

  const handleNavigateToPortal = (role: 'Member' | 'Admin') => {
    if (role === 'Member') {
      setView('member');
    } else {
      setView('admin');
    }
  };

  const handleLoginAsMember = (user: any, profile: MemberProfile | null) => {
    setCurrentUser(user);
    setCurrentProfile(profile);
    setIsMemberLoggedIn(true);
    setView('member');
  };

  const handleLoginAsAdmin = () => {
    setIsAdminLoggedIn(true);
    setView('admin');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentProfile(null);
    setIsMemberLoggedIn(false);
    setIsAdminLoggedIn(false);
    setView('website');
  };

  const handleBackToWebsite = () => {
    setView('website');
  };

  const handleNavigateVerify = (licenceNo: string) => {
    setInitialVerifyNo(licenceNo);
    setView('website');
  };

  const handleClearVerifyNo = () => {
    setInitialVerifyNo(undefined);
  };

  return (
    <div id="app-viewport" className="min-h-screen bg-[#F8FAFC]">
      {view === 'website' && (
        <Website 
          onNavigateToPortal={handleNavigateToPortal} 
          initialVerifyLicenceNo={initialVerifyNo}
          onClearVerifyNo={handleClearVerifyNo}
          isMemberLoggedIn={isMemberLoggedIn}
          isAdminLoggedIn={isAdminLoggedIn}
          currentUser={currentUser}
          currentProfile={currentProfile}
          onLoginAsMember={handleLoginAsMember}
          onLoginAsAdmin={handleLoginAsAdmin}
          onLogout={handleLogout}
        />
      )}
      {view === 'member' && (
        <MemberPortal 
          onBackToWebsite={handleBackToWebsite} 
          onNavigateVerify={handleNavigateVerify}
          initialUser={currentUser}
          initialProfile={currentProfile}
          initialIsLoggedIn={isMemberLoggedIn}
          onLogout={handleLogout}
        />
      )}
      {view === 'admin' && (
        <AdminPortal 
          onBackToWebsite={handleBackToWebsite} 
          initialIsAdminLoggedIn={isAdminLoggedIn}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

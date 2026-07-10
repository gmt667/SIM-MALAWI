/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  User, 
  Lock, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Briefcase, 
  FileText, 
  Activity, 
  Upload, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  CreditCard, 
  Award, 
  ShieldAlert, 
  Printer, 
  ArrowLeft, 
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Info
} from 'lucide-react';
import { MemberProfile, Invoice, Payment, CpdAttendance, Licence, Event } from '../types';

interface MemberPortalProps {
  onBackToWebsite: () => void;
  onNavigateVerify: (licenceNo: string) => void;
  initialUser?: any;
  initialProfile?: MemberProfile | null;
  initialIsLoggedIn?: boolean;
  onLogout?: () => void;
}

export default function MemberPortal({ 
  onBackToWebsite, 
  onNavigateVerify,
  initialUser,
  initialProfile,
  initialIsLoggedIn,
  onLogout
}: MemberPortalProps) {
  // Auth States
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn || false);
  const [currentUser, setCurrentUser] = useState<any | null>(initialUser || null);
  const [currentProfile, setCurrentProfile] = useState<MemberProfile | null>(initialProfile || null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // Register Form
  const [regForm, setRegForm] = useState({
    email: '', password: '', firstName: '', lastName: '', phone: '',
    chapter: 'Land Surveying', grade: 'Graduate', region: 'Southern',
    employer: '', designation: ''
  });
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Portal View Tab
  const [portalTab, setPortalTab] = useState<'dashboard' | 'profile' | 'billing' | 'cpd' | 'licensing' | 'events'>('dashboard');

  // Dynamic Member Portal States
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cpds, setCpds] = useState<CpdAttendance[]>([]);
  const [licences, setLicences] = useState<Licence[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  // Modals / Actions states
  const [uploadSlipModal, setUploadSlipModal] = useState<Invoice | null>(null);
  const [slipForm, setSlipForm] = useState({ amountPaid: '', paymentMethod: 'Bank Deposit', referenceNo: '', slipName: '' });
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Advanced File Upload & Status Indicator States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [fileStatus, setFileStatus] = useState<'idle' | 'reading' | 'ready' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const [selfReportForm, setSelfReportForm] = useState({ title: '', cpdPoints: '5', eventDate: '', proofName: '' });
  const [selfReportSuccess, setSelfReportSuccess] = useState<string | null>(null);
  const [selfReportError, setSelfReportError] = useState<string | null>(null);

  const [activeCertificate, setActiveCertificate] = useState<{ type: 'membership' | 'licence' | 'cpd'; data: any } | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Interactive CPD Event Calendar States
  const [calendarYear, setCalendarYear] = useState<number>(2026);
  const [calendarMonth, setCalendarMonth] = useState<number>(6); // Default to July (0-indexed 6)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>('2026-07-25'); // Default highlight the AGM event
  const [calendarCategoryFilter, setCalendarCategoryFilter] = useState<string>('all');
  const [calendarSearchQuery, setCalendarSearchQuery] = useState<string>('');

  // Auto load member portfolio data when loaded with initial states
  useEffect(() => {
    if (isLoggedIn && currentProfile) {
      loadMemberData(currentProfile.id);
    }
  }, [isLoggedIn, currentProfile]);

  useEffect(() => {
    if (!activeCertificate) {
      setQrCodeDataUrl('');
      return;
    }

    let verificationKey = '';
    if (activeCertificate.type === 'licence') {
      verificationKey = activeCertificate.data.licenceNo;
    } else if (activeCertificate.type === 'membership') {
      verificationKey = currentProfile?.memberNo || '';
    } else if (activeCertificate.type === 'cpd') {
      verificationKey = `SIM-CPD-${activeCertificate.data.id}`;
    }

    if (!verificationKey) {
      setQrCodeDataUrl('');
      return;
    }

    const verificationUrl = `${window.location.origin}/verify/${encodeURIComponent(verificationKey)}`;

    QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 150,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
    .then(url => {
      setQrCodeDataUrl(url);
    })
    .catch(err => {
      console.error('Failed to generate QR Code:', err);
    });
  }, [activeCertificate, currentProfile]);

  // Load member portfolio elements
  const loadMemberData = async (memberId: number) => {
    try {
      const [invRes, payRes, cpdRes, licRes, evtRes] = await Promise.all([
        fetch(`/api/invoices?memberId=${memberId}`).then(r => r.json()),
        fetch('/api/payments').then(r => r.json()),
        fetch('/api/cpd').then(r => r.json()),
        fetch('/api/licences').then(r => r.json()),
        fetch('/api/events').then(r => r.json()),
      ]);

      setInvoices(invRes || []);
      setPayments((payRes || []).filter((p: any) => invRes.some((i: any) => i.id === p.invoiceId)));
      setCpds((cpdRes || []).filter((c: any) => c.memberId === memberId));
      setLicences((licRes || []).filter((l: any) => l.memberId === memberId));
      setEvents(evtRes || []);
    } catch (err) {
      console.error('Error loading member workspace data:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentUser(data.user);
        setCurrentProfile(data.profile);
        setIsLoggedIn(true);
        if (data.profile) {
          loadMemberData(data.profile.id);
        }
      } else {
        setLoginError(data.error || 'Login failed. Please check your details.');
      }
    } catch (err) {
      setLoginError('Error connecting to the authentication server.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRegSuccess(data.message);
        // Auto Login
        setCurrentUser(data.user);
        setCurrentProfile(data.profile);
        setIsLoggedIn(true);
        loadMemberData(data.profile.id);
      } else {
        setRegError(data.error || 'Registration failed.');
      }
    } catch (err) {
      setRegError('Error connecting to registration engine.');
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile) return;
    try {
      const res = await fetch(`/api/members/${currentProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentProfile)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Profile updated successfully.');
        setCurrentProfile(data.profile);
      } else {
        alert(data.error || 'Failed to update profile.');
      }
    } catch (err) {
      alert('Error updating profile.');
    }
  };

  const handleFileChange = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      setFileStatus('error');
      return;
    }
    
    setUploadError(null);
    setFileStatus('reading');
    setSelectedFile(file);
    setSlipForm(prev => ({ ...prev, slipName: file.name }));

    const reader = new FileReader();
    reader.onload = () => {
      setFilePreviewUrl(reader.result as string);
      setFileStatus('ready');
    };
    reader.onerror = () => {
      setUploadError('Failed to read file.');
      setFileStatus('error');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const closeUploadModal = () => {
    setUploadSlipModal(null);
    setSlipForm({ amountPaid: '', paymentMethod: 'Bank Deposit', referenceNo: '', slipName: '' });
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setFileStatus('idle');
    setUploadProgress(0);
    setUploadError(null);
    setUploadSuccess(null);
  };

  const handleUploadSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadSlipModal) return;

    if (!selectedFile) {
      setUploadError('Please select or drag-and-drop a proof of payment document (image) first.');
      return;
    }

    setUploadError(null);
    setUploadSuccess(null);
    setFileStatus('uploading');
    setUploadProgress(0);

    // Simulate progress bar increase
    const simulationDuration = 1000; // 1s
    const stepTime = 100;
    const progressStep = 100 / (simulationDuration / stepTime);
    
    let currentProgress = 0;
    const timer = setInterval(async () => {
      currentProgress += progressStep;
      if (currentProgress >= 100) {
        setUploadProgress(100);
        clearInterval(timer);

        try {
          const res = await fetch('/api/payments/upload-slip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              invoiceId: uploadSlipModal.id,
              amountPaid: slipForm.amountPaid,
              paymentMethod: slipForm.paymentMethod,
              referenceNo: slipForm.referenceNo,
              depositSlipName: selectedFile.name || slipForm.slipName || 'uploaded_bank_slip.png'
            })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setFileStatus('success');
            setUploadSuccess(data.message || 'Payment proof uploaded and submitted for audit successfully.');
            setTimeout(() => {
              closeUploadModal();
              if (currentProfile) loadMemberData(currentProfile.id);
            }, 1800);
          } else {
            setFileStatus('error');
            setUploadError(data.error || 'Failed to register payment.');
          }
        } catch (err) {
          setFileStatus('error');
          setUploadError('Error submitting payment proof.');
        }
      } else {
        setUploadProgress(Math.floor(currentProgress));
      }
    }, stepTime);
  };

  const handleSelfReportCPD = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile) return;
    setSelfReportError(null);
    setSelfReportSuccess(null);

    try {
      const res = await fetch('/api/cpd/self-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: currentProfile.id,
          title: selfReportForm.title,
          cpdPoints: selfReportForm.cpdPoints,
          eventDate: selfReportForm.eventDate,
          proofDocumentName: selfReportForm.proofName || 'self_cpd_proof.pdf'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelfReportSuccess(data.message);
        setSelfReportForm({ title: '', cpdPoints: '5', eventDate: '', proofName: '' });
        setTimeout(() => {
          setSelfReportSuccess(null);
          loadMemberData(currentProfile.id);
        }, 1500);
      } else {
        setSelfReportError(data.error || 'Failed to submit CPD report.');
      }
    } catch (err) {
      setSelfReportError('Error processing CPD submission.');
    }
  };

  const handleApplyLicence = async () => {
    if (!currentProfile) return;
    if (!confirm('Are you sure you want to submit a Practising Licence application for the 2026/2027 Financial Year? The system will execute a real-time audit of your active status and approved CPD hours.')) return;

    try {
      const res = await fetch('/api/licences/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: currentProfile.id,
          financialYear: '2026/2027'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        loadMemberData(currentProfile.id);
      } else {
        alert(`Licence Application Denied:\n\n${data.error}`);
      }
    } catch (err) {
      alert('Error communicating with licensing engine.');
    }
  };

  const handleRegisterEvent = async (eventId: number) => {
    if (!currentProfile) return;
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: currentProfile.id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        loadMemberData(currentProfile.id);
      } else {
        alert(data.error || 'Failed to register.');
      }
    } catch (err) {
      alert('Error registering for event.');
    }
  };

  // Logins helpers
  const handleTestLogin = (email: string) => {
    setLoginEmail(email);
    setLoginPassword('sim_secret_demo');
  };

  // Helper variables
  const approvedCPD = cpds.filter(c => c.status === 'Approved').reduce((sum, c) => sum + c.cpdPoints, 0);
  const pendingCPD = cpds.filter(c => c.status === 'Pending').reduce((sum, c) => sum + c.cpdPoints, 0);
  const cpdProgressPercentage = Math.min(100, Math.round((approvedCPD / 20) * 100));

  const totalOutstanding = invoices.filter(i => i.status === 'Unpaid').reduce((sum, i) => sum + i.amount, 0);
  const activeLicence = licences.find(l => l.status === 'Active');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* HEADER BAR */}
      <header className="bg-[#0F172A] text-white py-4 px-6 shadow-md flex justify-between items-center">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onBackToWebsite}>
          <div className="bg-amber-500 text-slate-950 p-2 rounded-lg font-bold">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight block">SIM MALAWI</span>
            <span className="text-3xs text-amber-400 font-medium uppercase tracking-widest block -mt-1">Member Workspace</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={onBackToWebsite}
            className="text-xs font-semibold text-slate-300 hover:text-white flex items-center space-x-1"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Corporate Site</span>
          </button>
          
          {isLoggedIn && (
            <div className="flex items-center space-x-3 border-l border-slate-700 pl-4">
              <div className="text-right">
                <span className="block text-xs font-bold text-white">{currentProfile?.firstName} {currentProfile?.lastName}</span>
                <span className="block text-3xs text-amber-400 font-mono tracking-wider">{currentProfile?.memberNo || 'Unassigned'}</span>
              </div>
              <button 
                onClick={() => {
                  setIsLoggedIn(false);
                  setCurrentUser(null);
                  setCurrentProfile(null);
                  if (onLogout) onLogout();
                }}
                className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-md"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* BODY WORKSPACE */}
      <main className="flex-grow flex flex-col">
        {!isLoggedIn ? (
          /* AUTHENTICATION SCREEN */
          <div className="flex-grow flex items-center justify-center p-4 py-12 relative overflow-hidden bg-slate-100">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent"></div>
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8 max-w-lg w-full relative z-10 space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">SIM Member Portal</h2>
                <p className="text-slate-500 text-xs">Access secure licensing applications, bills, CPD tracking, and verified certificates.</p>
              </div>

              {/* Quick Login Seeds */}
              {authMode === 'login' && (
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center space-x-2 text-amber-800 font-bold text-2xs">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>Quick Demo Test Logins</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-3xs font-semibold">
                    <button 
                      onClick={() => handleTestLogin('chancy.gondwe@sim.mw')}
                      className="p-2 bg-white rounded border hover:border-amber-400 text-left truncate flex justify-between"
                    >
                      <span>Chancy Gondwe (LS)</span>
                      <span className="text-slate-400">Professional</span>
                    </button>
                    <button 
                      onClick={() => handleTestLogin('beatrice.banda@sim.mw')}
                      className="p-2 bg-white rounded border hover:border-amber-400 text-left truncate flex justify-between"
                    >
                      <span>Beatrice Banda (QS)</span>
                      <span className="text-slate-400">Fellow</span>
                    </button>
                    <button 
                      onClick={() => handleTestLogin('kondwani.phiri@sim.mw')}
                      className="p-2 bg-white rounded border hover:border-amber-400 text-left truncate flex justify-between"
                    >
                      <span>Kondwani Phiri (VEM)</span>
                      <span className="text-slate-400">Professional</span>
                    </button>
                    <button 
                      onClick={() => handleTestLogin('ellena.mwanza@sim.mw')}
                      className="p-2 bg-white rounded border hover:border-amber-400 text-left truncate flex justify-between"
                    >
                      <span>Ellena Mwanza (LS)</span>
                      <span className="text-slate-400 font-medium text-amber-700">Pending</span>
                    </button>
                  </div>
                  <span className="block text-4xs text-slate-400 mt-1">Click a test login above to fill details automatically. Any password works!</span>
                </div>
              )}

              {/* FORM CHOOSER */}
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${authMode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  Member Login
                </button>
                <button
                  onClick={() => setAuthMode('register')}
                  className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${authMode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  Online Registration
                </button>
              </div>

              {/* LOGIN FORM */}
              {authMode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  {loginError && <div className="p-3 bg-red-50 text-red-800 border border-red-100 rounded text-xs font-medium">{loginError}</div>}
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="yourname@domain.mw"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded text-xs tracking-wider transition-all"
                  >
                    SECURE SIGN IN
                  </button>
                </form>
              ) : (
                /* REGISTRATION FORM */
                <form onSubmit={handleRegister} className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                  {regError && <div className="p-3 bg-red-50 text-red-800 border border-red-100 rounded text-xs font-medium">{regError}</div>}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-2xs font-bold text-slate-700">First Name</label>
                      <input
                        type="text"
                        required
                        value={regForm.firstName}
                        onChange={(e) => setRegForm({...regForm, firstName: e.target.value})}
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-2xs font-bold text-slate-700">Last Name</label>
                      <input
                        type="text"
                        required
                        value={regForm.lastName}
                        onChange={(e) => setRegForm({...regForm, lastName: e.target.value})}
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-slate-700">Email Address</label>
                    <input
                      type="email"
                      required
                      value={regForm.email}
                      onChange={(e) => setRegForm({...regForm, email: e.target.value})}
                      placeholder="e.g. member@sim.mw"
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-slate-700">Secure Password</label>
                    <input
                      type="password"
                      required
                      value={regForm.password}
                      onChange={(e) => setRegForm({...regForm, password: e.target.value})}
                      placeholder="••••••••"
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-2xs font-bold text-slate-700">Professional Chapter</label>
                      <select
                        value={regForm.chapter}
                        onChange={(e) => setRegForm({...regForm, chapter: e.target.value})}
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-amber-500"
                      >
                        <option value="Land Surveying">Land Surveying</option>
                        <option value="Quantity Surveying">Quantity Surveying</option>
                        <option value="Valuation & Estate Management">Valuation & Estate Management</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-2xs font-bold text-slate-700">Grade Level</label>
                      <select
                        value={regForm.grade}
                        onChange={(e) => setRegForm({...regForm, grade: e.target.value})}
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-amber-500"
                      >
                        <option value="Fellow">Fellow</option>
                        <option value="Professional">Professional</option>
                        <option value="Associate">Associate</option>
                        <option value="Graduate">Graduate</option>
                        <option value="Technician">Technician</option>
                        <option value="Student">Student</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-2xs font-bold text-slate-700">Phone Contact</label>
                      <input
                        type="text"
                        required
                        value={regForm.phone}
                        onChange={(e) => setRegForm({...regForm, phone: e.target.value})}
                        placeholder="+265..."
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-2xs font-bold text-slate-700">Region Zone</label>
                      <select
                        value={regForm.region}
                        onChange={(e) => setRegForm({...regForm, region: e.target.value as any})}
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-amber-500"
                      >
                        <option value="Southern">Southern Region</option>
                        <option value="Central">Central Region</option>
                        <option value="Northern">Northern Region</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-slate-700">Current Employer</label>
                    <input
                      type="text"
                      value={regForm.employer}
                      onChange={(e) => setRegForm({...regForm, employer: e.target.value})}
                      placeholder="e.g. Government, Apex Qs"
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded text-xs tracking-wider transition-all"
                  >
                    SUBMIT APPLICATION
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* LOGGED IN WORKSPACE */
          <div className="flex-grow flex flex-col md:flex-row">
            {/* PORTAL SIDEBAR */}
            <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col justify-between py-6 border-r border-slate-800">
              <div className="space-y-6">
                <div className="px-6 flex items-center space-x-3 pb-4 border-b border-slate-800">
                  <div className="h-10 w-10 bg-slate-800 text-amber-400 font-bold flex items-center justify-center rounded-full border border-slate-700 text-sm">
                    {currentProfile?.firstName[0]}{currentProfile?.lastName[0]}
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-white leading-none">{currentProfile?.firstName} {currentProfile?.lastName}</span>
                    <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mt-1.5 uppercase tracking-widest ${
                      currentProfile?.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      Status: {currentProfile?.status}
                    </span>
                  </div>
                </div>

                <nav className="space-y-1 px-3 text-xs font-semibold">
                  {[
                    { id: 'dashboard', label: 'Dashboard', icon: Activity },
                    { id: 'profile', label: 'My SIM Profile', icon: User },
                    { id: 'billing', label: 'Billing & Invoices', icon: DollarSign },
                    { id: 'cpd', label: 'CPD Ledger', icon: Award },
                    { id: 'licensing', label: 'Practising Licence', icon: ShieldAlert },
                    { id: 'events', label: 'Events & CPD Courses', icon: Calendar }
                  ].map(tab => {
                    const IconComp = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => { setPortalTab(tab.id as any); setActiveCertificate(null); }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                          portalTab === tab.id ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <IconComp className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="px-4">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-800 text-center space-y-2">
                  <span className="text-[10px] uppercase text-slate-400 font-mono tracking-wider block">SUPPORT DESK</span>
                  <p className="text-[10px] text-slate-500">Need verification assistance?</p>
                  <a href="mailto:secretariat@sim.mw" className="text-[10px] font-bold text-amber-400 block hover:underline">secretariat@sim.mw</a>
                </div>
              </div>
            </aside>

            {/* PORTAL MAIN AREA */}
            <section className="flex-grow p-6 sm:p-8 space-y-8 max-w-5xl overflow-y-auto">
              
              {/* IF Certificate Print View Active */}
              {activeCertificate ? (
                <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-md space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b">
                    <button 
                      onClick={() => setActiveCertificate(null)}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center space-x-1"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back to Portal</span>
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center space-x-1 shadow-sm"
                    >
                      <Printer className="h-4 w-4" />
                      <span>Print Document</span>
                    </button>
                  </div>

                  {/* Certificate Ornament Card */}
                  <div className="border-[12px] border-slate-800 p-8 sm:p-12 text-center space-y-8 bg-slate-50 relative rounded-sm max-w-3xl mx-auto my-4 shadow-inner">
                    <div className="absolute right-4 top-4 text-slate-300">
                      <Award className="h-20 w-20 opacity-30" />
                    </div>

                    <div className="space-y-2">
                      <span className="text-amber-600 text-xs font-extrabold uppercase tracking-widest block">SURVEYORS INSTITUTE OF MALAWI</span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        {activeCertificate.type === 'membership' && 'CERTIFICATE OF MEMBERSHIP'}
                        {activeCertificate.type === 'licence' && 'PRACTISING CERTIFICATE'}
                        {activeCertificate.type === 'cpd' && 'CPD WORKSHOP RECOGNITION'}
                      </h2>
                      <div className="h-1 bg-amber-500 w-32 mx-auto"></div>
                    </div>

                    <div className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl mx-auto space-y-4">
                      {activeCertificate.type === 'membership' && (
                        <>
                          <p>This is to certify that the registered surveyor described below has been duly admitted as a full professional member of the Surveyors Institute of Malawi:</p>
                          <strong className="text-slate-900 text-lg sm:text-xl block py-2">{currentProfile?.firstName} {currentProfile?.lastName}</strong>
                          <p>Accredited Chapter: <strong>{currentProfile?.chapter}</strong></p>
                          <p>Membership Grade: <strong>{currentProfile?.grade} Level</strong></p>
                          <p>Registration Number: <strong className="font-mono text-amber-700">{currentProfile?.memberNo}</strong></p>
                        </>
                      )}

                      {activeCertificate.type === 'licence' && (
                        <>
                          <p>Pursuant to the Surveying Regulations of Malawi, this is to certify that the registered surveyor described below is officially licensed to practice inside the territory of Malawi:</p>
                          <strong className="text-slate-900 text-lg sm:text-xl block py-2">{currentProfile?.firstName} {currentProfile?.lastName}</strong>
                          <p>Accredited Chapter: <strong>{currentProfile?.chapter}</strong></p>
                          <p>Licence Serial Number: <strong className="font-mono text-amber-700">{activeCertificate.data.licenceNo}</strong></p>
                          <p>Valid Financial Cycle: <strong>FY {activeCertificate.data.financialYear}</strong> (Expires {activeCertificate.data.expiryDate})</p>
                        </>
                      )}

                      {activeCertificate.type === 'cpd' && (
                        <>
                          <p>This is to certify that the registered professional has successfully attended the certified SIM training workshop, earning full credit points:</p>
                          <strong className="text-slate-900 text-lg sm:text-xl block py-2">{currentProfile?.firstName} {currentProfile?.lastName}</strong>
                          <p>Course Title: <strong>{activeCertificate.data.title}</strong></p>
                          <p>CPD Weight: <strong>{activeCertificate.data.cpdPoints} CPD Points</strong></p>
                          <p>Date Attended: <strong className="font-mono">{activeCertificate.data.eventDate}</strong></p>
                        </>
                      )}
                    </div>

                    {/* QR Code Watermark and verification footnote */}
                    <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-left">
                      <div className="flex items-center space-x-3">
                        <div className="bg-white border border-slate-300 p-1 rounded shadow-sm flex items-center justify-center h-16 w-16">
                          {qrCodeDataUrl ? (
                            <img 
                              src={qrCodeDataUrl} 
                              alt="Verification QR Code" 
                              className="w-14 h-14" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="grid grid-cols-4 gap-0.5 w-12 h-12 bg-slate-900 p-0.5 rounded animate-pulse">
                              {[1,0,1,1,0,1,0,1,1,1,0,0,1,0,1,1].map((b, idx) => (
                                <div key={idx} className={`w-2.5 h-2.5 ${b === 1 ? 'bg-white' : 'bg-slate-950'}`}></div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          <span className="font-extrabold text-slate-800 uppercase block tracking-wider">SECURE DIGITAL VERIFICATION</span>
                          <span className="block mt-0.5 leading-none">Scan QR to verify active registry records.</span>
                          {(activeCertificate.type === 'licence' || activeCertificate.type === 'membership') && (
                            <button 
                              onClick={() => {
                                const key = activeCertificate.type === 'licence' 
                                  ? activeCertificate.data.licenceNo 
                                  : (currentProfile?.memberNo || '');
                                if (key) onNavigateVerify(key);
                              }}
                              className="text-amber-600 font-bold block mt-1 hover:underline text-left cursor-pointer"
                            >
                              Verify Serial Ledger Entry
                            </button>
                          )}
                          {activeCertificate.type === 'cpd' && (
                            <button 
                              onClick={() => onNavigateVerify(`SIM-CPD-${activeCertificate.data.id}`)}
                              className="text-amber-600 font-bold block mt-1 hover:underline text-left cursor-pointer"
                            >
                              Verify CPD Recognition
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="text-center font-mono text-[10px] text-slate-400 space-y-1">
                        <div className="border-t border-slate-300 w-36 pt-1 text-slate-700 font-semibold font-sans text-center">President (SIM)</div>
                        <span>Cert ID: {btoa(activeCertificate.data.licenceNo || currentProfile?.memberNo || '0').substring(0, 16)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* MAIN PORTAL VIEWS */
                <>
                  {/* VIEW: DASHBOARD */}
                  {portalTab === 'dashboard' && (
                    <div id="portal-dashboard" className="space-y-8">
                      {/* Alert warnings if unpaid invoices */}
                      {totalOutstanding > 0 && (
                        <div className="p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs flex items-start space-x-3">
                          <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-grow">
                            <strong>Outstanding Subscription Dues Notice:</strong>
                            <p className="mt-1 font-light">You currently have outstanding bills totaling MWK {totalOutstanding.toLocaleString()}. Please upload bank deposit slips inside the Billings tab to ensure your professional status remains Active.</p>
                          </div>
                          <button 
                            onClick={() => setPortalTab('billing')}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded text-3xs flex-shrink-0 transition-all shadow"
                          >
                            Pay Dues
                          </button>
                        </div>
                      )}

                      {/* Status Summary Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
                          <span className="text-3xs font-extrabold text-slate-400 uppercase tracking-widest block">MEMBERSHIP RECORD</span>
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-bold text-slate-900 text-base">{currentProfile?.grade} Grade</h4>
                              <span className="text-2xs font-mono text-slate-400">Chapter: {currentProfile?.chapter}</span>
                            </div>
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                              currentProfile?.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>{currentProfile?.status}</span>
                          </div>
                          {currentProfile?.status === 'Active' && (
                            <button 
                              onClick={() => setActiveCertificate({ type: 'membership', data: currentProfile })}
                              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1"
                            >
                              <Printer className="h-4 w-4 mr-1" />
                              <span>Print Membership Certificate</span>
                            </button>
                          )}
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
                          <span className="text-3xs font-extrabold text-slate-400 uppercase tracking-widest block">LICENSING & PRACTISING</span>
                          <div className="flex justify-between items-center">
                            <div>
                              {activeLicence ? (
                                <>
                                  <h4 className="font-bold text-slate-900 text-base">{activeLicence.licenceNo}</h4>
                                  <span className="text-2xs font-mono text-slate-400">Valid FY: {activeLicence.financialYear}</span>
                                </>
                              ) : (
                                <>
                                  <h4 className="font-bold text-slate-500 text-base">No Active Licence</h4>
                                  <span className="text-2xs text-slate-400">Required: Professional Upgrade</span>
                                </>
                              )}
                            </div>
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                              activeLicence ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                            }`}>{activeLicence ? 'Licensed' : 'Lapsed'}</span>
                          </div>
                          {activeLicence && (
                            <button 
                              onClick={() => setActiveCertificate({ type: 'licence', data: activeLicence })}
                              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1"
                            >
                              <Printer className="h-4 w-4 mr-1" />
                              <span>Print Practising Certificate</span>
                            </button>
                          )}
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
                          <span className="text-3xs font-extrabold text-slate-400 uppercase tracking-widest block">CPD HOUR AUDIT</span>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-950">{approvedCPD} / 20 hours</span>
                              <span className="font-mono text-slate-400">{cpdProgressPercentage}% of quota</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${cpdProgressPercentage}%` }}></div>
                            </div>
                            {pendingCPD > 0 && (
                              <span className="text-[10px] text-amber-600 font-semibold block">{pendingCPD} hours pending admin audit review</span>
                            )}
                          </div>
                          <button 
                            onClick={() => setPortalTab('cpd')}
                            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1"
                          >
                            <span>Open CPD Logbook</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Recent Activities List */}
                      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
                        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">My Portfolio Documents</h3>
                        <div className="divide-y divide-slate-100 text-xs">
                          {licences.map(l => (
                            <div key={l.id} className="py-3 flex justify-between items-center">
                              <div>
                                <strong className="text-slate-800">Practising Licence ({l.financialYear})</strong>
                                <p className="text-3xs font-mono text-slate-400 mt-0.5">Serial: {l.licenceNo} | Issued: {l.dateIssued}</p>
                              </div>
                              <button 
                                onClick={() => setActiveCertificate({ type: 'licence', data: l })}
                                className="px-3 py-1 border rounded text-2xs hover:bg-slate-50 font-semibold"
                              >
                                View / Print
                              </button>
                            </div>
                          ))}
                          {licences.length === 0 && (
                            <p className="text-slate-500 py-4 text-center">No practising licence history records available.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* VIEW: MY SIM PROFILE */}
                  {portalTab === 'profile' && (
                    <div id="portal-profile" className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">My SIM Registry Record</h3>
                        <p className="text-slate-500 text-xs">Review and modify your personal contact and employment records.</p>
                      </div>

                      <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">First Name</label>
                            <input
                              type="text"
                              required
                              value={currentProfile?.firstName || ''}
                              onChange={(e) => setCurrentProfile(currentProfile ? { ...currentProfile, firstName: e.target.value } : null)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Last Name</label>
                            <input
                              type="text"
                              required
                              value={currentProfile?.lastName || ''}
                              onChange={(e) => setCurrentProfile(currentProfile ? { ...currentProfile, lastName: e.target.value } : null)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Phone Number</label>
                            <input
                              type="text"
                              value={currentProfile?.phone || ''}
                              onChange={(e) => setCurrentProfile(currentProfile ? { ...currentProfile, phone: e.target.value } : null)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Region Zone</label>
                            <select
                              value={currentProfile?.region || 'Southern'}
                              onChange={(e) => setCurrentProfile(currentProfile ? { ...currentProfile, region: e.target.value as any } : null)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-amber-500"
                            >
                              <option value="Southern">Southern</option>
                              <option value="Central">Central</option>
                              <option value="Northern">Northern</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Current Employer</label>
                            <input
                              type="text"
                              value={currentProfile?.employer || ''}
                              onChange={(e) => setCurrentProfile(currentProfile ? { ...currentProfile, employer: e.target.value } : null)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Job Designation</label>
                            <input
                              type="text"
                              value={currentProfile?.designation || ''}
                              onChange={(e) => setCurrentProfile(currentProfile ? { ...currentProfile, designation: e.target.value } : null)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>

                        <div className="pt-4 border-t flex justify-end">
                          <button
                            type="submit"
                            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded text-xs tracking-wider transition-all"
                          >
                            SAVE PROFILE
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* VIEW: BILLING & INVOICES */}
                  {portalTab === 'billing' && (
                    <div id="portal-billing" className="space-y-6">
                      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">My Outstanding Invoices</h3>
                          <p className="text-slate-500 text-xs">Verify outstanding dues and upload bank electronic transfer/deposit receipts.</p>
                        </div>

                        <div className="overflow-x-auto text-xs">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b text-slate-400 font-mono text-3xs uppercase">
                                <th className="pb-2">Invoice No</th>
                                <th className="pb-2">Description</th>
                                <th className="pb-2 text-right">Amount (MWK)</th>
                                <th className="pb-2">Due Date</th>
                                <th className="pb-2">Status</th>
                                <th className="pb-2 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y font-medium text-slate-700">
                              {invoices.map(i => {
                                const pay = payments.find(p => p.invoiceId === i.id);
                                return (
                                  <tr key={i.id} className="hover:bg-slate-50/50">
                                    <td className="py-3 font-mono text-slate-950">{i.invoiceNo}</td>
                                    <td className="py-3">{i.description}</td>
                                    <td className="py-3 text-right font-mono">{i.amount.toLocaleString()}</td>
                                    <td className="py-3 font-mono text-slate-500">{i.dueDate}</td>
                                    <td className="py-3">
                                      {i.status === 'Paid' ? (
                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-3xs font-bold border border-emerald-100">Paid</span>
                                      ) : pay && pay.verificationStatus === 'Pending' ? (
                                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-3xs font-bold border border-amber-100">Pending Verify</span>
                                      ) : (
                                        <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-3xs font-bold border border-red-100">Unpaid</span>
                                      )}
                                    </td>
                                    <td className="py-3 text-right">
                                      {i.status === 'Paid' ? (
                                        pay && pay.receiptNo ? (
                                          <button 
                                            onClick={() => alert(`Official SIM Receipt Issued.\n\nReceipt Number: ${pay.receiptNo}\nAmount: MWK ${pay.amountPaid.toLocaleString()}\nMethod: ${pay.paymentMethod}\nReference: ${pay.referenceNo}\nStatus: Verified against Bank Dues.`)}
                                            className="text-amber-600 font-bold hover:underline"
                                          >
                                            View Receipt
                                          </button>
                                        ) : 'Verified'
                                      ) : pay && pay.verificationStatus === 'Pending' ? (
                                        <span className="text-slate-400 font-light">Awaiting Admin</span>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            setUploadSlipModal(i);
                                            setSlipForm({ amountPaid: String(i.amount), paymentMethod: 'Bank Deposit', referenceNo: '', slipName: '' });
                                          }}
                                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold px-3 py-1 rounded text-3xs transition-all shadow-sm"
                                        >
                                          Upload Slip
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                              {invoices.length === 0 && (
                                <tr>
                                  <td colSpan={6} className="py-4 text-center text-slate-500 font-light">You have no billed invoice statements.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* PAYMENT INSTRUCTIONS */}
                      <div className="bg-slate-900 text-slate-300 p-6 rounded-xl border border-slate-800 space-y-4">
                        <strong className="text-white text-xs uppercase tracking-wider block">SIM Bank Deposit Instructions</strong>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1">
                            <h5 className="text-white font-bold">Standard Bank Account (SIM HQ)</h5>
                            <p className="text-slate-400">National Bank of Malawi - Lilongwe Service Centre</p>
                            <p className="font-mono">Account No: 10098248910</p>
                            <p className="font-mono">Branch Code: 112</p>
                          </div>
                          <div className="space-y-1">
                            <h5 className="text-white font-bold">Mobile Money Channels</h5>
                            <p className="text-slate-400">Airtel Money Merchant Code: 899120 (SIM)</p>
                            <p className="text-slate-400">TNM Mpamba Pay Code: 009821</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500">Note: Always quote your Invoice Number as the reference descriptor in all bank transactions to avoid verification delays.</p>
                      </div>

                      {/* PAYMENT PROOF MODAL */}
                      {uploadSlipModal && (
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                          <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-6 max-w-lg w-full space-y-5 relative">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-slate-950 text-sm">Upload Bank Deposit Slip / Proof of Payment</h4>
                                <p className="text-slate-500 text-3xs font-mono mt-0.5">Invoice: {uploadSlipModal.invoiceNo} | MWK {uploadSlipModal.amount.toLocaleString()}</p>
                              </div>
                              <button 
                                onClick={closeUploadModal} 
                                className="text-slate-400 hover:text-slate-950 font-bold p-1 hover:bg-slate-50 rounded transition-colors text-lg"
                              >
                                &times;
                              </button>
                            </div>

                            <form onSubmit={handleUploadSlip} className="space-y-4 text-xs">
                              {uploadError && <div className="p-3 bg-red-50 text-red-800 border border-red-100 rounded text-2xs font-medium">{uploadError}</div>}
                              {uploadSuccess && <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded text-2xs font-medium">{uploadSuccess}</div>}

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-2xs font-bold text-slate-700">Amount Paid (MWK)</label>
                                  <input
                                    type="number"
                                    required
                                    value={slipForm.amountPaid}
                                    onChange={(e) => setSlipForm({ ...slipForm, amountPaid: e.target.value })}
                                    className="w-full px-2.5 py-1.5 bg-slate-50 border rounded focus:border-amber-500 focus:ring-0 focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-2xs font-bold text-slate-700">Payment Channel</label>
                                  <select
                                    value={slipForm.paymentMethod}
                                    onChange={(e) => setSlipForm({ ...slipForm, paymentMethod: e.target.value })}
                                    className="w-full px-2.5 py-1.5 bg-slate-50 border rounded focus:border-amber-500 focus:ring-0 focus:outline-none cursor-pointer"
                                  >
                                    <option value="Bank Deposit">Bank Deposit</option>
                                    <option value="Airtel Money">Airtel Money</option>
                                    <option value="TNM Mpamba">TNM Mpamba</option>
                                  </select>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-2xs font-bold text-slate-700">Bank Transaction / Wallet Reference ID</label>
                                <input
                                  type="text"
                                  required
                                  value={slipForm.referenceNo}
                                  onChange={(e) => setSlipForm({ ...slipForm, referenceNo: e.target.value })}
                                  placeholder="e.g. NBM-DEP-99812 or AM-TXN-129"
                                  className="w-full px-2.5 py-1.5 bg-slate-50 border rounded focus:border-amber-500 focus:ring-0 focus:outline-none"
                                />
                              </div>

                              {/* DRAG AND DROP IMAGE UPLOAD TARGET */}
                              <div className="space-y-1.5">
                                <label className="text-2xs font-bold text-slate-700">Upload Receipt Slip (Image)</label>
                                <div 
                                  onDragOver={handleDragOver}
                                  onDragLeave={handleDragLeave}
                                  onDrop={handleDrop}
                                  onClick={() => document.getElementById('slip-file-input')?.click()}
                                  className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                                    isDragging 
                                      ? 'border-amber-500 bg-amber-50/30' 
                                      : selectedFile 
                                      ? 'border-emerald-300 bg-emerald-50/10' 
                                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                                  }`}
                                >
                                  <input 
                                    id="slip-file-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        handleFileChange(e.target.files[0]);
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  
                                  {filePreviewUrl ? (
                                    <div className="space-y-2 flex flex-col items-center">
                                      <img 
                                        src={filePreviewUrl} 
                                        alt="Preview" 
                                        className="h-24 w-auto object-cover rounded border shadow-xs max-w-full"
                                      />
                                      <span className="text-3xs text-slate-500 font-medium font-mono truncate max-w-[250px]">
                                        {selectedFile?.name} ({(selectedFile?.size ? (selectedFile.size / 1024).toFixed(1) : 0)} KB)
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="space-y-2 py-2">
                                      <div className="mx-auto h-8 w-8 text-slate-400 bg-slate-100 rounded-full flex items-center justify-center">
                                        <Upload className="h-4 w-4" />
                                      </div>
                                      <div className="space-y-0.5">
                                        <p className="font-semibold text-slate-800 text-3xs">
                                          Drag &amp; drop your deposit slip image here, or <span className="text-amber-600 underline">browse</span>
                                        </p>
                                        <p className="text-slate-400 text-3xs uppercase tracking-wider font-semibold">
                                          Accepts PNG, JPG, JPEG, WEBP
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* FILE STATUS INDICATOR */}
                              <div className="bg-slate-50 border rounded-lg p-3 space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-3xs text-slate-400 font-extrabold uppercase font-mono tracking-wider">File Status</span>
                                  <span className={`px-2 py-0.5 rounded text-3xs font-extrabold uppercase border ${
                                    fileStatus === 'idle'
                                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                                      : fileStatus === 'reading'
                                      ? 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse'
                                      : fileStatus === 'ready'
                                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                                      : fileStatus === 'uploading'
                                      ? 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse'
                                      : fileStatus === 'success'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                      : 'bg-red-50 text-red-700 border-red-100'
                                  }`}>
                                    {fileStatus === 'idle' && 'No File Selected'}
                                    {fileStatus === 'reading' && 'Reading File...'}
                                    {fileStatus === 'ready' && 'Ready to Upload'}
                                    {fileStatus === 'uploading' && `Uploading (${uploadProgress}%)`}
                                    {fileStatus === 'success' && 'Upload Successful'}
                                    {fileStatus === 'error' && 'Error'}
                                  </span>
                                </div>

                                {fileStatus === 'uploading' && (
                                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-amber-500 h-1.5 rounded-full transition-all duration-100"
                                      style={{ width: `${uploadProgress}%` }}
                                    />
                                  </div>
                                )}

                                {selectedFile && (
                                  <div className="text-3xs text-slate-500 flex justify-between font-mono pt-1 border-t border-slate-200/50">
                                    <span>Filename:</span>
                                    <span className="text-slate-800 font-bold truncate max-w-[200px]">{selectedFile.name}</span>
                                  </div>
                                )}
                              </div>

                              <button
                                type="submit"
                                disabled={fileStatus === 'uploading' || fileStatus === 'success'}
                                className={`w-full py-2.5 rounded-lg text-2xs font-extrabold uppercase tracking-widest shadow-sm transition-all duration-200 cursor-pointer ${
                                  fileStatus === 'uploading' || fileStatus === 'success'
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                    : 'bg-slate-950 hover:bg-slate-800 text-white hover:shadow-md'
                                }`}
                              >
                                {fileStatus === 'uploading' 
                                  ? 'SUBMITTING...' 
                                  : fileStatus === 'success'
                                  ? 'SUBMITTED SUCCESSFULLY'
                                  : 'REGISTER PAYMENT PROOF'
                                }
                              </button>
                            </form>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* VIEW: CPD LOGBOOK */}
                  {portalTab === 'cpd' && (
                    <div id="portal-cpd" className="space-y-6">
                      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">Continuing Professional Development (CPD) Log</h3>
                          <p className="text-slate-500 text-xs">A professional practising license requires a minimum of 20 verified CPD points annually.</p>
                        </div>

                        {/* Summary Block */}
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border text-center">
                          <div>
                            <span className="block text-2xl font-extrabold text-emerald-600 font-mono">{approvedCPD}</span>
                            <span className="text-3xs uppercase tracking-wider text-slate-400">Approved CPD Hours</span>
                          </div>
                          <div>
                            <span className="block text-2xl font-extrabold text-amber-600 font-mono">{pendingCPD}</span>
                            <span className="text-3xs uppercase tracking-wider text-slate-400">Pending Audit Review</span>
                          </div>
                        </div>

                        {/* List */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-700">Accumulated CPD Activities</h4>
                          <div className="divide-y text-xs">
                            {cpds.map(c => (
                              <div key={c.id} className="py-3 flex justify-between items-start">
                                <div>
                                  <strong className="text-slate-800 text-sm block">{c.title}</strong>
                                  <p className="text-3xs font-mono text-slate-400 mt-1">Date: {c.eventDate} | Class: {c.eventId ? 'Official SIM Seminar' : 'Self-Reported Training'}</p>
                                </div>
                                <div className="text-right flex flex-col items-end space-y-1.5">
                                  <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded font-mono text-2xs">{c.cpdPoints} pts</span>
                                  {c.status === 'Approved' ? (
                                    <span className="text-emerald-700 text-3xs font-semibold flex items-center">
                                      <CheckCircle className="h-3 w-3 mr-0.5" /> Approved
                                    </span>
                                  ) : c.status === 'Pending' ? (
                                    <span className="text-amber-600 text-3xs font-semibold flex items-center">
                                      <Clock className="h-3 w-3 mr-0.5 animate-pulse" /> Pending Audit
                                    </span>
                                  ) : (
                                    <span className="text-red-700 text-3xs font-semibold">Rejected</span>
                                  )}
                                </div>
                              </div>
                            ))}
                            {cpds.length === 0 && (
                              <p className="text-slate-500 py-4 text-center font-light">No CPD points logged. Please sign up for events or report external courses.</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* SELF-REPORT FORM */}
                      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                        <h4 className="text-sm font-bold text-slate-900 mb-4">Self-Report External CPD Seminar</h4>
                        <form onSubmit={handleSelfReportCPD} className="space-y-4 text-xs">
                          {selfReportError && <div className="p-3 bg-red-50 text-red-800 border border-red-100 rounded text-2xs font-medium">{selfReportError}</div>}
                          {selfReportSuccess && <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded text-2xs font-medium">{selfReportSuccess}</div>}

                          <div className="space-y-1">
                            <label className="text-2xs font-bold text-slate-700">Seminar / Course Title</label>
                            <input
                              type="text"
                              required
                              value={selfReportForm.title}
                              onChange={(e) => setSelfReportForm({ ...selfReportForm, title: e.target.value })}
                              placeholder="e.g. RICS Regional Valuation Masterclass"
                              className="w-full px-3 py-2 bg-slate-50 border rounded focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-2xs font-bold text-slate-700">CPD Hours / Weight</label>
                              <input
                                type="number"
                                required
                                value={selfReportForm.cpdPoints}
                                onChange={(e) => setSelfReportForm({ ...selfReportForm, cpdPoints: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 border rounded focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-2xs font-bold text-slate-700">Date Completed</label>
                              <input
                                type="date"
                                required
                                value={selfReportForm.eventDate}
                                onChange={(e) => setSelfReportForm({ ...selfReportForm, eventDate: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 border rounded focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-2xs font-bold text-slate-700">Attendance Proof Certificate Name (PDF)</label>
                            <input
                              type="text"
                              required
                              value={selfReportForm.proofName}
                              onChange={(e) => setSelfReportForm({ ...selfReportForm, proofName: e.target.value })}
                              placeholder="e.g. coursera_certificate_gondwe.pdf"
                              className="w-full px-3 py-2 bg-slate-50 border rounded font-mono"
                            />
                          </div>

                          <button
                            type="submit"
                            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded text-xs tracking-wide"
                          >
                            SUBMIT CPD REPORT
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* VIEW: PRACTISING LICENCE */}
                  {portalTab === 'licensing' && (
                    <div id="portal-licensing" className="space-y-6">
                      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">Practising Licence Renewal Module</h3>
                          <p className="text-slate-500 text-xs">Verify your active status requirements, run instant eligibility audits, and download certificates.</p>
                        </div>

                        {/* Licensing Checklist */}
                        <div className="bg-slate-50 p-6 rounded-xl border space-y-4 text-xs">
                          <strong className="text-slate-900 block uppercase tracking-wider text-2xs">Renewal Criteria Audit Check</strong>
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">1. Membership Registry Status (Must be Active)</span>
                              <span className={`px-2 py-0.5 rounded font-bold ${
                                currentProfile?.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                              }`}>{currentProfile?.status === 'Active' ? 'PASSED' : 'FAILED'}</span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">2. Continuing Professional Development (Min 20 CPD Hours required)</span>
                              <span className={`px-2 py-0.5 rounded font-bold ${
                                approvedCPD >= 20 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                              }`}>{approvedCPD >= 20 ? 'PASSED' : 'FAILED'} ({approvedCPD} / 20 hrs)</span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">3. Outstanding Dues (Should have MWK 0 dues)</span>
                              <span className={`px-2 py-0.5 rounded font-bold ${
                                totalOutstanding === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                              }`}>{totalOutstanding === 0 ? 'PASSED' : 'WARNING'} (Outstanding: MWK {totalOutstanding.toLocaleString()})</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-4">
                          <button
                            onClick={handleApplyLicence}
                            className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-lg text-xs tracking-wider transition-all shadow-md shadow-amber-500/10"
                          >
                            RUN COMPLIANCE AUDIT & ISSUE LICENCE
                          </button>
                        </div>
                      </div>

                      {/* Licence list */}
                      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
                        <h4 className="text-sm font-bold text-slate-900">Practising Licence History</h4>
                        <div className="divide-y text-xs">
                          {licences.map(l => (
                            <div key={l.id} className="py-3 flex justify-between items-center">
                              <div>
                                <strong className="text-slate-800 text-sm">{l.licenceNo}</strong>
                                <p className="text-3xs text-slate-400 mt-1 font-mono">Financial Cycle: {l.financialYear} | Issued on {l.dateIssued}</p>
                              </div>
                              <button
                                onClick={() => setActiveCertificate({ type: 'licence', data: l })}
                                className="px-3 py-1 border rounded hover:bg-slate-50 font-semibold"
                              >
                                View / Print Certificate
                              </button>
                            </div>
                          ))}
                          {licences.length === 0 && (
                            <p className="text-slate-500 text-center py-4 font-light">No Practising Licences registered.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* VIEW: EVENTS & COURSES */}
                  {portalTab === 'events' && (() => {
                    const monthsList = [
                      "January", "February", "March", "April", "May", "June", 
                      "July", "August", "September", "October", "November", "December"
                    ];

                    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                    const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
                    const prevMonthDaysCount = new Date(calendarYear, calendarMonth, 0).getDate();

                    const pad = (n: number) => n.toString().padStart(2, '0');

                    // 1. Prev month padding days
                    const prevMonthDays = [];
                    for (let i = firstDayIndex - 1; i >= 0; i--) {
                      const dayNum = prevMonthDaysCount - i;
                      const prevMonth = calendarMonth === 0 ? 11 : calendarMonth - 1;
                      const prevYear = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
                      const dateString = `${prevYear}-${pad(prevMonth + 1)}-${pad(dayNum)}`;
                      prevMonthDays.push({
                        dayNum,
                        dateString,
                        isCurrentMonth: false,
                        events: events.filter(evt => evt.eventDate.startsWith(dateString))
                      });
                    }

                    // 2. Current month days
                    const currentMonthDays = [];
                    for (let d = 1; d <= daysInMonth; d++) {
                      const dateString = `${calendarYear}-${pad(calendarMonth + 1)}-${pad(d)}`;
                      currentMonthDays.push({
                        dayNum: d,
                        dateString,
                        isCurrentMonth: true,
                        events: events.filter(evt => evt.eventDate.startsWith(dateString))
                      });
                    }

                    // 3. Next month padding days
                    const nextMonthDays = [];
                    const totalCellsSoFar = prevMonthDays.length + currentMonthDays.length;
                    const remainingCells = totalCellsSoFar <= 35 ? 35 - totalCellsSoFar : 42 - totalCellsSoFar;
                    for (let d = 1; d <= remainingCells; d++) {
                      const nextMonth = calendarMonth === 11 ? 0 : calendarMonth + 1;
                      const nextYear = calendarMonth === 11 ? calendarYear + 1 : calendarYear;
                      const dateString = `${nextYear}-${pad(nextMonth + 1)}-${pad(d)}`;
                      nextMonthDays.push({
                        dayNum: d,
                        dateString,
                        isCurrentMonth: false,
                        events: events.filter(evt => evt.eventDate.startsWith(dateString))
                      });
                    }

                    const calendarGridDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

                    // Find events on selected calendar date
                    const selectedDateEvents = selectedCalendarDate 
                      ? events.filter(e => e.eventDate.startsWith(selectedCalendarDate))
                      : [];

                    // Apply search and filter to all upcoming events for the "All Events" listing
                    const filteredUpcomingEvents = events.filter(e => {
                      const matchesCategory = calendarCategoryFilter === 'all' || 
                        e.title.toLowerCase().includes(calendarCategoryFilter.toLowerCase()) ||
                        e.description.toLowerCase().includes(calendarCategoryFilter.toLowerCase());
                      const matchesSearch = e.title.toLowerCase().includes(calendarSearchQuery.toLowerCase()) ||
                        e.description.toLowerCase().includes(calendarSearchQuery.toLowerCase()) ||
                        e.venue.toLowerCase().includes(calendarSearchQuery.toLowerCase());
                      return matchesCategory && matchesSearch;
                    });

                    // Handler to move calendar back one month
                    const handlePrevMonth = () => {
                      if (calendarMonth === 0) {
                        setCalendarMonth(11);
                        setCalendarYear(prev => prev - 1);
                      } else {
                        setCalendarMonth(prev => prev - 1);
                      }
                    };

                    // Handler to move calendar forward one month
                    const handleNextMonth = () => {
                      if (calendarMonth === 11) {
                        setCalendarMonth(0);
                        setCalendarYear(prev => prev + 1);
                      } else {
                        setCalendarMonth(prev => prev + 1);
                      }
                    };

                    return (
                      <div id="portal-events" className="space-y-6">
                        {/* Summary overview block */}
                        <div className="bg-[#0F172A] text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                          <div className="absolute -top-10 -right-10 bg-amber-500/10 w-40 h-40 rounded-full blur-2xl"></div>
                          <div className="space-y-2 text-center md:text-left">
                            <span className="bg-amber-500/15 text-amber-400 font-extrabold px-3 py-1 rounded-full text-3xs font-mono tracking-widest uppercase border border-amber-500/20">CPD RECOGNITION PLATFORM</span>
                            <h2 className="text-xl font-extrabold tracking-tight">Interactive Continuing Professional Development (CPD)</h2>
                            <p className="text-slate-400 text-2xs max-w-xl leading-relaxed">
                              Malawi national legislation requires all Surveying Professionals to earn a minimum of <strong>20 CPD points</strong> annually for practicing licence eligibility audits.
                            </p>
                          </div>
                          
                          <div className="bg-slate-800/60 backdrop-blur-xs p-4 rounded-xl border border-slate-700/50 flex space-x-6 shrink-0 text-center">
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">YOUR APPROVED CPD</span>
                              <strong className="text-xl font-mono font-extrabold text-emerald-400 block mt-1">{approvedCPD} pts</strong>
                            </div>
                            <div className="border-l border-slate-700 w-px"></div>
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">ANNUAL TARGET</span>
                              <strong className="text-xl font-mono font-extrabold text-amber-400 block mt-1">20 pts</strong>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Grid & Calendar Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                          {/* Left Column: Visual Calendar Grid (Span 7) */}
                          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                              <div className="text-left">
                                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                                  <Calendar className="h-4.5 w-4.5 text-amber-500" />
                                  <span>SIM National Seminar Calendar</span>
                                </h3>
                                <p className="text-slate-500 text-3xs">Navigate months to explore scheduled courses & webinars</p>
                              </div>

                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={handlePrevMonth}
                                  className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg cursor-pointer transition-all"
                                  title="Previous Month"
                                >
                                  <ChevronLeft className="h-3.5 w-3.5" />
                                </button>
                                <span className="text-xs font-extrabold text-slate-800 font-mono tracking-tight min-w-28 text-center bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-200/50">
                                  {monthsList[calendarMonth]} {calendarYear}
                                </span>
                                <button
                                  onClick={handleNextMonth}
                                  className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg cursor-pointer transition-all"
                                  title="Next Month"
                                >
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Calendar Grid Header (Days of week) */}
                            <div className="grid grid-cols-7 gap-1 text-center font-bold text-3xs text-slate-400 tracking-wider uppercase">
                              <div>Sun</div>
                              <div>Mon</div>
                              <div>Tue</div>
                              <div>Wed</div>
                              <div>Thu</div>
                              <div>Fri</div>
                              <div>Sat</div>
                            </div>

                            {/* Calendar Grid Cells */}
                            <div className="grid grid-cols-7 gap-1.5">
                              {calendarGridDays.map((cell, idx) => {
                                const isSelected = selectedCalendarDate === cell.dateString;
                                const hasEvents = cell.events.length > 0;
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => setSelectedCalendarDate(cell.dateString)}
                                    className={`aspect-square p-1.5 rounded-xl border flex flex-col justify-between items-center relative transition-all group cursor-pointer ${
                                      isSelected
                                        ? 'bg-slate-900 border-slate-900 text-white shadow-md scale-102 z-10'
                                        : hasEvents
                                        ? 'bg-amber-500/10 border-amber-500/30 text-slate-900 font-extrabold hover:bg-amber-500/20'
                                        : cell.isCurrentMonth
                                        ? 'bg-slate-50/50 border-slate-100 text-slate-800 hover:bg-slate-100 hover:border-slate-200'
                                        : 'bg-white border-transparent text-slate-300 hover:bg-slate-50'
                                    }`}
                                  >
                                    <span className="text-xs font-mono">{cell.dayNum}</span>
                                    
                                    {/* Event indicator element */}
                                    {hasEvents && (
                                      <span className={`h-1.5 w-1.5 rounded-full ${
                                        isSelected ? 'bg-amber-400' : 'bg-amber-600'
                                      }`}></span>
                                    )}

                                    {/* Tooltip on hover */}
                                    {hasEvents && (
                                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 bg-slate-950 text-white text-[9px] font-medium py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none z-20">
                                        {cell.events[0].title.substring(0, 25)}... ({cell.events[0].cpdPoints} pts)
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Key legend */}
                            <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-slate-100 text-3xs font-mono text-slate-500">
                              <div className="flex items-center space-x-1">
                                <span className="h-3 w-3 rounded bg-amber-500/10 border border-amber-500/30 inline-block"></span>
                                <span>CPD Event Scheduled</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span className="h-3 w-3 rounded bg-slate-900 border border-slate-900 inline-block"></span>
                                <span>Selected Date</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block"></span>
                                <span>Active Indicator</span>
                              </div>
                            </div>
                          </div>

                          {/* Right Column: Selected Date Event Details Panel (Span 5) */}
                          <div className="lg:col-span-5 flex flex-col space-y-4">
                            {/* Selected Date Header */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 flex-grow flex flex-col justify-between">
                              <div className="space-y-3.5">
                                <div className="pb-3 border-b border-slate-100">
                                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest font-mono">SELECTED WORKSHOP DETAILS</span>
                                  <h4 className="font-extrabold text-sm text-slate-900 mt-1">
                                    {selectedCalendarDate 
                                      ? new Date(selectedCalendarDate).toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                                      : 'No Date Selected'}
                                  </h4>
                                </div>

                                {selectedDateEvents.length === 0 ? (
                                  <div className="py-8 flex flex-col items-center justify-center text-center space-y-3.5">
                                    <div className="bg-slate-50 text-slate-400 p-3.5 rounded-full border border-slate-200">
                                      <Info className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-1">
                                      <h5 className="font-bold text-xs text-slate-700">No events on this day</h5>
                                      <p className="text-slate-400 text-3xs max-w-xs leading-relaxed">
                                        Select any date highlighted in gold (such as July 25th) on the calendar to view its CPD courses and register.
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  selectedDateEvents.map(e => {
                                    const isRegistered = cpds.some(c => c.eventId === e.id);
                                    return (
                                      <div key={e.id} className="space-y-4 text-left">
                                        <div className="flex justify-between items-center">
                                          <span className="bg-amber-500 text-slate-950 font-extrabold px-2.5 py-1 rounded text-2xs font-mono shadow-xs">
                                            {e.cpdPoints} CPD Points
                                          </span>
                                          <span className="bg-slate-100 text-slate-700 font-mono text-[10px] px-2.5 py-1 rounded font-extrabold">
                                            Fee: MWK {e.registrationFee.toLocaleString()}
                                          </span>
                                        </div>

                                        <div className="space-y-1.5">
                                          <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{e.title}</h4>
                                          <p className="text-slate-500 text-3xs leading-relaxed font-light">{e.description}</p>
                                        </div>

                                        <div className="space-y-2 bg-slate-50/60 p-3.5 rounded-xl border border-slate-100 text-3xs font-mono text-slate-600">
                                          <div className="flex items-center space-x-2">
                                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                            <span className="truncate">📍 Venue: {e.venue}</span>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                            <span>📅 Time: {e.eventDate.replace('T', ' ')}</span>
                                          </div>
                                        </div>

                                        <button
                                          disabled={isRegistered}
                                          onClick={() => handleRegisterEvent(e.id)}
                                          className={`w-full py-3 rounded-xl text-xs font-extrabold tracking-wider transition-all shadow-xs cursor-pointer ${
                                            isRegistered 
                                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed text-center' 
                                              : 'bg-slate-900 hover:bg-slate-800 text-white hover:scale-101 hover:shadow-md'
                                          }`}
                                        >
                                          {isRegistered ? '✓ SUCCESSFUL REGISTERED FOR SEMINAR' : 'REGISTER FOR WORKSHOP NOW'}
                                        </button>
                                      </div>
                                    );
                                  })
                                )}
                              </div>

                              <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-3xs text-slate-400">
                                <span className="font-semibold">Malawi Surveyors National Registry</span>
                                <span className="font-mono">SECURE TRANS</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Search, Filter & List Section (Bento Grid Section 2) */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                            <div className="text-left">
                              <h3 className="font-extrabold text-sm text-slate-900">All Scheduled Workshops & Seminars</h3>
                              <p className="text-slate-500 text-3xs">Search by keywords or filter by professional chapter focus</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                              {/* Search */}
                              <div className="relative w-full sm:w-48">
                                <input
                                  type="text"
                                  placeholder="Search seminars..."
                                  value={calendarSearchQuery}
                                  onChange={(e) => setCalendarSearchQuery(e.target.value)}
                                  className="w-full text-xs py-1.5 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-slate-300 font-mono"
                                />
                              </div>

                              {/* Chapter Filter pills */}
                              <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto">
                                {[
                                  { id: 'all', label: 'All Chapters' },
                                  { id: 'Surveying', label: 'Land Surveying' },
                                  { id: 'Measurement', label: 'Quantity Surveying' },
                                  { id: 'Valuation', label: 'Land Economy' }
                                ].map(pill => (
                                  <button
                                    key={pill.id}
                                    onClick={() => setCalendarCategoryFilter(pill.id)}
                                    className={`px-3 py-1.5 rounded-lg text-3xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                                      calendarCategoryFilter === pill.id
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    {pill.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredUpcomingEvents.map(e => {
                              const isRegistered = cpds.some(c => c.eventId === e.id);
                              return (
                                <div 
                                  key={e.id} 
                                  onClick={() => {
                                    setSelectedCalendarDate(e.eventDate.substring(0, 10));
                                    // Scroll up smoothly to calendar details
                                    document.getElementById('portal-events')?.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                  className={`border p-5 rounded-2xl bg-slate-50 flex flex-col justify-between space-y-4 hover:shadow-md transition-all hover:border-slate-300 cursor-pointer text-left ${
                                    isRegistered ? 'border-emerald-100 bg-emerald-50/10' : 'border-slate-100'
                                  }`}
                                >
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                      <span className="bg-amber-500 text-slate-950 font-extrabold px-2 py-0.5 rounded text-3xs font-mono shadow-2xs">{e.cpdPoints} CPD pts</span>
                                      <span className="text-3xs font-mono text-slate-500 font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded-md">MWK {e.registrationFee.toLocaleString()}</span>
                                    </div>
                                    <h4 className="font-extrabold text-slate-900 text-xs tracking-tight line-clamp-1">{e.title}</h4>
                                    <p className="text-slate-500 text-3xs leading-relaxed line-clamp-2">{e.description}</p>
                                    
                                    <div className="text-3xs text-slate-600 space-y-1 font-mono pt-2 border-t border-slate-200/50">
                                      <div className="truncate">📍 Venue: {e.venue}</div>
                                      <div>📅 Date: {e.eventDate.replace('T', ' ')}</div>
                                    </div>
                                  </div>

                                  <div className="pt-1 flex items-center justify-between">
                                    <span className="text-[9px] text-amber-600 font-bold hover:underline">View in Calendar →</span>
                                    {isRegistered && (
                                      <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                        ✓ REGISTERED
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            {filteredUpcomingEvents.length === 0 && (
                              <p className="text-slate-400 text-center col-span-3 py-6 text-2xs">No seminars matching filters found.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

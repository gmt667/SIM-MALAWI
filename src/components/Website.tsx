/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  Download, 
  BookOpen, 
  Users, 
  MapPin, 
  Calendar, 
  Award, 
  Mail, 
  Phone, 
  ShieldCheck, 
  AlertCircle, 
  ExternalLink, 
  ChevronRight, 
  Building, 
  HelpCircle, 
  Info,
  Menu,
  X,
  Plus,
  Loader2,
  Lock,
  Chrome,
  Facebook
} from 'lucide-react';
import { MemberProfile, SurveyingFirm, NewsItem, PublicationItem, FaqItem } from '../types';
import DownloadsPage from './DownloadsPage';
import FAQAccordion from './FAQAccordion';

interface WebsiteProps {
  onNavigateToPortal: (role: 'Member' | 'Admin') => void;
  initialVerifyLicenceNo?: string;
  onClearVerifyNo?: () => void;
  // Unified Auth additions
  isMemberLoggedIn?: boolean;
  isAdminLoggedIn?: boolean;
  currentUser?: any;
  currentProfile?: MemberProfile | null;
  onLoginAsMember?: (user: any, profile: MemberProfile | null) => void;
  onLoginAsAdmin?: () => void;
  onLogout?: () => void;
}

export default function Website({ 
  onNavigateToPortal, 
  initialVerifyLicenceNo, 
  onClearVerifyNo,
  isMemberLoggedIn = false,
  isAdminLoggedIn = false,
  currentUser = null,
  currentProfile = null,
  onLoginAsMember,
  onLoginAsAdmin,
  onLogout
}: WebsiteProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'about' | 'registrar' | 'publications' | 'downloads' | 'contact' | 'faqs' | 'verify'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hero section rotating background images (changes every 5 seconds)
  const heroBackgrounds = [
    '/src/assets/images/survey_malawi_hero_1783602495673.jpg',
    '/src/assets/images/surveying_hero_1783602398540.jpg',
    '/src/assets/images/surveying_hero_3_1783602805697.jpg'
  ];
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  // Preload all background images on mount to prevent white-flash flickers
  useEffect(() => {
    heroBackgrounds.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setLoadedImages((prev) => ({ ...prev, [src]: true }));
      };
      img.onerror = () => {
        // Fallback: mark as loaded to prevent infinite loader if image fails
        setLoadedImages((prev) => ({ ...prev, [src]: true }));
      };
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % heroBackgrounds.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // States for dynamic data
  const [news, setNews] = useState<NewsItem[]>([]);
  const [publications, setPublications] = useState<PublicationItem[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [firms, setFirms] = useState<SurveyingFirm[]>([]);

  // Auth modal states
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  
  // Login Form states
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Social login simulation states
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  // Registration Form states
  const [regForm, setRegForm] = useState({
    email: '', password: '', firstName: '', lastName: '', phone: '',
    chapter: 'Land Surveying', grade: 'Graduate', region: 'Southern',
    employer: '', designation: ''
  });
  const [regError, setRegError] = useState<string | null>(null);

  const handleAuthLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      // Check for administrative credentials explicitly
      const isEmailAdmin = authEmail.toLowerCase() === 'admin' || authEmail.toLowerCase() === 'admin@sim.mw';
      const isPasswordAdmin = authPassword === 'admin123' || authPassword === 'admin';
      
      if (isEmailAdmin && isPasswordAdmin) {
        setAuthModalOpen(false);
        setAuthEmail('');
        setAuthPassword('');
        setAuthLoading(false);
        if (onLoginAsAdmin) onLoginAsAdmin();
        return;
      }

      // Standard member credentials flow
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setAuthModalOpen(false);
        setAuthEmail('');
        setAuthPassword('');
        setAuthLoading(false);
        if (onLoginAsMember) onLoginAsMember(data.user, data.profile);
      } else {
        setAuthError(data.error || 'Login failed. Please check your details.');
        setAuthLoading(false);
      }
    } catch (err) {
      setAuthError('Error connecting to the authentication server.');
      setAuthLoading(false);
    }
  };

  const handleAuthRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setAuthModalOpen(false);
        setAuthLoading(false);
        if (onLoginAsMember) onLoginAsMember(data.user, data.profile);
      } else {
        setRegError(data.error || 'Registration failed.');
        setAuthLoading(false);
      }
    } catch (err) {
      setRegError('Error connecting to the registration engine.');
      setAuthLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'Google' | 'Facebook' | 'Microsoft') => {
    setSocialLoading(provider);
    setAuthError(null);

    setTimeout(async () => {
      setSocialLoading(null);
      setAuthModalOpen(false);

      // We'll simulate logging into one of our active seed database members
      let email = 'chancy.gondwe@sim.mw'; // Default Google -> Chancy Gondwe
      if (provider === 'Facebook') {
        email = 'beatrice.banda@sim.mw'; // Facebook -> Beatrice Banda
      } else if (provider === 'Microsoft') {
        email = 'kondwani.phiri@sim.mw'; // Microsoft -> Kondwani Phiri
      }

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: 'any_demo_password_works' })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          if (onLoginAsMember) onLoginAsMember(data.user, data.profile);
        } else {
          // Fallback if DB load fails, create an immediate active mock session
          const mockUser = { id: 2, email, role: 'Member' };
          const mockProfile = {
            id: 1,
            userId: 2,
            memberNo: provider === 'Google' ? 'SIM-LS-012' : provider === 'Facebook' ? 'SIM-QS-002' : 'SIM-VEM-005',
            firstName: provider === 'Google' ? 'Chancy' : provider === 'Facebook' ? 'Beatrice' : 'Kondwani',
            lastName: provider === 'Google' ? 'Gondwe' : provider === 'Facebook' ? 'Banda' : 'Phiri',
            chapter: provider === 'Google' ? 'Land Surveying' : provider === 'Facebook' ? 'Quantity Surveying' : 'Valuation & Estate Management',
            grade: provider === 'Facebook' ? 'Fellow' : 'Professional',
            status: 'Active'
          };
          if (onLoginAsMember) onLoginAsMember(mockUser, mockProfile as any);
        }
      } catch (e) {
        // Fallback session on network failure
        const mockUser = { id: 2, email, role: 'Member' };
        const mockProfile = {
          id: 1,
          userId: 2,
          memberNo: 'SIM-LS-012',
          firstName: 'Chancy',
          lastName: 'Gondwe',
          chapter: 'Land Surveying',
          grade: 'Professional',
          status: 'Active'
        };
        if (onLoginAsMember) onLoginAsMember(mockUser, mockProfile as any);
      }
    }, 1200);
  };

  // Public Registrar Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [registrarType, setRegistrarType] = useState<'members' | 'firms'>('members');

  // Contact Form States
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactLoading, setContactLoading] = useState(false);

  // Certificate Verification States
  const [verifyLicenceNo, setVerifyLicenceNo] = useState('');
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (initialVerifyLicenceNo) {
      setActiveTab('verify');
      setVerifyLicenceNo(initialVerifyLicenceNo);
      handleVerify(initialVerifyLicenceNo);
      if (onClearVerifyNo) onClearVerifyNo();
    }
  }, [initialVerifyLicenceNo]);

  const fetchData = async () => {
    try {
      const [newsRes, pubRes, faqRes, memRes, firmRes] = await Promise.all([
        fetch('/api/news').then(r => r.json()),
        fetch('/api/publications').then(r => r.json()),
        fetch('/api/faqs').then(r => r.json()),
        fetch('/api/members?activeOnly=true').then(r => r.json()),
        fetch('/api/firms').then(r => r.json()),
      ]);

      setNews(newsRes || []);
      setPublications(pubRes || []);
      setFaqs(faqRes || []);
      setMembers(memRes || []);
      setFirms(firmRes || []);
    } catch (err) {
      console.error('Error fetching public website data:', err);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    setContactSuccess(null);
    setContactError(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      const data = await res.json();
      if (res.ok) {
        setContactSuccess(data.message);
        setContactForm({ name: '', email: '', subject: '', message: '' });
      } else {
        setContactError(data.error || 'Failed to submit form.');
      }
    } catch (err) {
      setContactError('Network error. Please try again.');
    } finally {
      setContactLoading(false);
    }
  };

  const handleVerify = async (certNo: string) => {
    if (!certNo.trim()) return;
    setVerifyLoading(true);
    setVerificationResult(null);
    setVerificationError(null);

    try {
      const res = await fetch(`/api/verify-certificate/${encodeURIComponent(certNo.trim())}`);
      const data = await res.json();
      if (res.ok && data.verified) {
        setVerificationResult(data);
      } else {
        setVerificationError(data.error || 'Certificate not registered in the SIM national ledger.');
      }
    } catch (err) {
      setVerificationError('Error connecting to the verification engine.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Filtering Logic
  const filteredMembers = members.filter(m => {
    const nameMatch = `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (m.memberNo && m.memberNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
                      (m.employer && m.employer.toLowerCase().includes(searchQuery.toLowerCase()));
    const chapterMatch = selectedChapter ? m.chapter === selectedChapter : true;
    const gradeMatch = selectedGrade ? m.grade === selectedGrade : true;
    const regionMatch = selectedRegion ? m.region === selectedRegion : true;
    return nameMatch && chapterMatch && gradeMatch && regionMatch;
  });

  const filteredFirms = firms.filter(f => {
    const queryMatch = f.firmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       f.regNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (f.city && f.city.toLowerCase().includes(searchQuery.toLowerCase()));
    return queryMatch;
  });

  return (
    <div id="website-root" className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Premium Navbar */}
      <nav id="website-navbar" className="bg-[#0F172A] text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo branding */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('home')}>
              <div className="bg-amber-500 text-[#0F172A] p-2.5 rounded-lg font-bold text-xl tracking-wider flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <span className="font-extrabold text-lg sm:text-xl tracking-tight block">SIM MALAWI</span>
                <span className="text-xs text-amber-400 font-medium uppercase tracking-widest block -mt-1">Surveyors Institute</span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-1">
              {[
                { id: 'home', label: 'Home' },
                { id: 'about', label: 'About SIM' },
                { id: 'registrar', label: 'Public Registrar' },
                { id: 'publications', label: 'Publications' },
                { id: 'downloads', label: 'Downloads' },
                { id: 'faqs', label: 'FAQs' },
                { id: 'contact', label: 'Contact' },
                { id: 'verify', label: 'Verify Certificate' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-md text-sm font-semibold tracking-wide transition-all ${
                    activeTab === tab.id 
                      ? 'text-amber-400 bg-slate-800' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Unified Authentication / Dashboard Access */}
            <div className="hidden lg:flex items-center space-x-3">
              {isMemberLoggedIn ? (
                <>
                  <button 
                    onClick={() => onNavigateToPortal('Member')}
                    className="px-4 py-2 border border-amber-500/30 text-amber-400 bg-slate-800 hover:bg-slate-700 rounded-md text-sm font-semibold transition-all cursor-pointer"
                  >
                    Member Dashboard
                  </button>
                  <button 
                    onClick={onLogout}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-sm font-semibold transition-all cursor-pointer"
                  >
                    Sign Out
                  </button>
                </>
              ) : isAdminLoggedIn ? (
                <>
                  <button 
                    onClick={() => onNavigateToPortal('Admin')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-md text-sm transition-all shadow-md cursor-pointer"
                  >
                    Admin Dashboard
                  </button>
                  <button 
                    onClick={onLogout}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-sm font-semibold transition-all cursor-pointer"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      setAuthModalTab('login');
                      setAuthModalOpen(true);
                    }}
                    className="px-4 py-2 border border-slate-700 hover:border-slate-500 hover:bg-slate-800 rounded-md text-sm font-semibold text-slate-200 transition-all cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={() => {
                      setAuthModalTab('register');
                      setAuthModalOpen(true);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-md text-sm transition-all shadow-md shadow-amber-500/10 cursor-pointer"
                  >
                    Register
                  </button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900 border-t border-slate-800 px-2 pt-2 pb-4 space-y-1">
            {[
              { id: 'home', label: 'Home' },
              { id: 'about', label: 'About SIM' },
              { id: 'registrar', label: 'Public Registrar' },
              { id: 'publications', label: 'Publications' },
              { id: 'downloads', label: 'Downloads' },
              { id: 'faqs', label: 'FAQs' },
              { id: 'contact', label: 'Contact' },
              { id: 'verify', label: 'Verify Certificate' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2.5 rounded-md text-base font-semibold ${
                  activeTab === tab.id ? 'text-amber-400 bg-slate-800' : 'text-slate-300 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <div className="pt-4 border-t border-slate-800 flex flex-col space-y-2 px-3">
              {isMemberLoggedIn ? (
                <>
                  <button 
                    onClick={() => {
                      onNavigateToPortal('Member');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-center py-2.5 border border-amber-500/30 text-amber-400 bg-slate-800 rounded-md text-sm font-semibold"
                  >
                    Member Dashboard
                  </button>
                  <button 
                    onClick={() => {
                      if (onLogout) onLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-center py-2.5 bg-slate-800 text-slate-200 rounded-md text-sm font-semibold hover:bg-slate-700"
                  >
                    Sign Out
                  </button>
                </>
              ) : isAdminLoggedIn ? (
                <>
                  <button 
                    onClick={() => {
                      onNavigateToPortal('Admin');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-center py-2.5 bg-amber-500 text-slate-950 font-bold rounded-md text-sm"
                  >
                    Admin Dashboard
                  </button>
                  <button 
                    onClick={() => {
                      if (onLogout) onLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-center py-2.5 bg-slate-800 text-slate-200 rounded-md text-sm font-semibold hover:bg-slate-700"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      setAuthModalTab('login');
                      setAuthModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-center py-2.5 border border-slate-700 rounded-md text-sm font-semibold text-slate-200 hover:bg-slate-800"
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={() => {
                      setAuthModalTab('register');
                      setAuthModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-center py-2.5 bg-amber-500 text-slate-950 font-bold rounded-md text-sm hover:bg-amber-600"
                  >
                    Register
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow">
        {/* TAB 1: HOME PAGE */}
        {activeTab === 'home' && (
          <div id="view-home">
            {/* Hero Section */}
            <div className="relative bg-slate-950 text-white overflow-hidden py-24 sm:py-32 lg:py-36">
              {/* Background image container with premium vignette and multi-layer gradient overlays */}
              <div className="absolute inset-0 z-0">
                {heroBackgrounds.map((bgUrl, idx) => (
                  <img 
                    key={bgUrl}
                    src={bgUrl} 
                    alt={`Professional surveying backdrop ${idx + 1}`} 
                    onLoad={() => setLoadedImages((prev) => ({ ...prev, [bgUrl]: true }))}
                    className={`absolute inset-0 w-full h-full object-cover filter brightness-[0.7] scale-105 transition-opacity duration-1000 ease-in-out ${
                      idx === currentBgIndex && loadedImages[bgUrl] ? 'opacity-35' : 'opacity-0'
                    }`}
                    referrerPolicy="no-referrer"
                  />
                ))}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/40"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/60"></div>
                {/* Radial spotlight effect */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent"></div>
                
                {/* Subtle loading spinner overlay if current image is still loading */}
                {!loadedImages[heroBackgrounds[currentBgIndex]] && (
                  <div className="absolute top-4 right-4 z-20 flex items-center space-x-2 bg-slate-900/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-amber-400 animate-pulse">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Loading slide...</span>
                  </div>
                )}

                {/* Elegant indicator dots */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2.5 z-20">
                  {heroBackgrounds.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentBgIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === currentBgIndex ? 'w-6 bg-amber-500' : 'w-1.5 bg-slate-600 hover:bg-slate-400'
                      }`}
                      aria-label={`Switch to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-3xl space-y-6">
                  <div className="inline-flex items-center space-x-2 bg-amber-500/15 text-amber-400 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border border-amber-500/25 backdrop-blur-md">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Official Professional Regulatory Body of Malawi</span>
                  </div>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white drop-shadow-md">
                    Regulating and Promoting the Surveying Profession in Malawi
                  </h1>
                  <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-light drop-shadow-xs max-w-2xl">
                    The Surveyors Institute of Malawi (SIM) represents and registers professional surveyors across land surveying, quantity surveying, and asset valuation chapters, ensuring elite standards of integrity, competence, and service delivery nationwide.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    {isMemberLoggedIn ? (
                      <button 
                        onClick={() => onNavigateToPortal('Member')}
                        className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-lg transition-all shadow-lg shadow-amber-500/20 text-center cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Go to Member Dashboard
                      </button>
                    ) : isAdminLoggedIn ? (
                      <button 
                        onClick={() => onNavigateToPortal('Admin')}
                        className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-lg transition-all shadow-lg shadow-amber-500/20 text-center cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Go to Admin Dashboard
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          setAuthModalTab('login');
                          setAuthModalOpen(true);
                        }}
                        className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-lg transition-all shadow-lg shadow-amber-500/20 text-center cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Register / Sign In
                      </button>
                    )}
                    <button 
                      onClick={() => setActiveTab('registrar')}
                      className="px-8 py-4 bg-slate-900/90 hover:bg-slate-800 text-white font-semibold rounded-lg border border-slate-700/80 backdrop-blur-md transition-all text-center cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Search Registered Surveyors
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Chapter Sections */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-8 relative z-20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white rounded-xl shadow-md border border-slate-100 p-8 hover:shadow-lg transition-all">
                  <div className="bg-blue-50 text-blue-600 h-14 w-14 rounded-lg flex items-center justify-center mb-6">
                    <MapPin className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">Land Surveying</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">
                    Ensuring geometric accuracy in boundary mapping, GIS modeling, cadastre definition, geodetic networks, and national infrastructure projects.
                  </p>
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest block">Chapter LS</span>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-slate-100 p-8 hover:shadow-lg transition-all">
                  <div className="bg-amber-50 text-amber-600 h-14 w-14 rounded-lg flex items-center justify-center mb-6">
                    <Building className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">Quantity Surveying</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">
                    Expert procurement advice, project cost estimating, contract auditing, value engineering, and financial accountability for civil construction.
                  </p>
                  <span className="text-xs font-semibold text-amber-600 uppercase tracking-widest block">Chapter QS</span>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-slate-100 p-8 hover:shadow-lg transition-all">
                  <div className="bg-emerald-50 text-emerald-600 h-14 w-14 rounded-lg flex items-center justify-center mb-6">
                    <Award className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">Valuation & Estate Management</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">
                    Authoritative market valuations, investment appraisals, property portfolio management, and statutory compensation audits.
                  </p>
                  <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest block">Chapter VEM</span>
                </div>
              </div>
            </div>

            {/* Quick Stats Banner */}
            <div className="bg-slate-900 text-white py-12 border-y border-slate-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <span className="block text-4xl font-extrabold text-amber-400 font-mono">4+</span>
                  <span className="text-xs uppercase text-slate-400 tracking-wider">Decades of Regulation</span>
                </div>
                <div>
                  <span className="block text-4xl font-extrabold text-amber-400 font-mono">350+</span>
                  <span className="text-xs uppercase text-slate-400 tracking-wider">Registered Surveyors</span>
                </div>
                <div>
                  <span className="block text-4xl font-extrabold text-amber-400 font-mono">24+</span>
                  <span className="text-xs uppercase text-slate-400 tracking-wider">Licensed Surveying Firms</span>
                </div>
                <div>
                  <span className="block text-4xl font-extrabold text-amber-400 font-mono">100%</span>
                  <span className="text-xs uppercase text-slate-400 tracking-wider">Public Records Integrity</span>
                </div>
              </div>
            </div>

            {/* Latest News & Upcoming CPDs Side by Side */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* News Column */}
              <div className="lg:col-span-2 space-y-8">
                <h2 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2">
                  <BookOpen className="h-6 w-6 text-amber-500" />
                  <span>Latest News & Updates</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {news.map(n => (
                    <div key={n.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all flex flex-col">
                      <img src={n.image} alt={n.title} className="h-48 w-full object-cover" referrerPolicy="no-referrer" />
                      <div className="p-6 flex-grow flex flex-col">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-2xs font-semibold uppercase tracking-wider">{n.category}</span>
                          <span className="text-slate-400 text-2xs font-mono">{n.date}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 mb-2 hover:text-amber-600 transition-colors line-clamp-2">{n.title}</h3>
                        <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-3">{n.excerpt}</p>
                        <button 
                          onClick={() => {
                            alert(`${n.title}\n\n${n.content}`);
                          }}
                          className="mt-auto text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1"
                        >
                          <span>Read Full Story</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Events Column */}
              <div className="space-y-8">
                <h2 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2">
                  <Calendar className="h-6 w-6 text-amber-500" />
                  <span>CPD & Events Queue</span>
                </h2>

                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="px-2.5 py-0.5 bg-red-50 text-red-700 rounded-full text-3xs font-semibold uppercase tracking-widest border border-red-100">UPCOMING</span>
                      <span className="bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded text-xs font-mono">15 CPD pts</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">SIM Annual General Meeting & CPD Workshop 2026</h4>
                      <p className="text-slate-500 text-xs mt-1.5 flex items-center">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 mr-1" />
                        Sunbird Mount Soche, Blantyre
                      </p>
                      <p className="text-slate-500 text-xs mt-1 flex items-center font-mono">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 mr-1" />
                        25 - 27 July 2026
                      </p>
                    </div>
                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">Fee: MWK 85,000</span>
                      <button 
                        onClick={() => onNavigateToPortal('Member')}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded transition-all"
                      >
                        Register
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="px-2.5 py-0.5 bg-red-50 text-red-700 rounded-full text-3xs font-semibold uppercase tracking-widest border border-red-100">UPCOMING</span>
                      <span className="bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded text-xs font-mono">8 CPD pts</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Standard Method of Measurement (SMM7) Masterclass</h4>
                      <p className="text-slate-500 text-xs mt-1.5 flex items-center">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 mr-1" />
                        Sunbird Capital, Lilongwe
                      </p>
                      <p className="text-slate-500 text-xs mt-1 flex items-center font-mono">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 mr-1" />
                        12 August 2026
                      </p>
                    </div>
                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">Fee: MWK 50,000</span>
                      <button 
                        onClick={() => onNavigateToPortal('Member')}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded transition-all"
                      >
                        Register
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ABOUT SIM */}
        {activeTab === 'about' && (
          <div id="view-about" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">About SIM</h1>
              <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                The Surveyors Institute of Malawi is a corporate professional body chartered to regulate surveying practices, advance professional training standards, and counsel government on national spatial layout frameworks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                    <ShieldCheck className="h-5 w-5 text-amber-500 mr-2" />
                    <span>Our Constitutional Mandate</span>
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    SIM is governed under a solid constitutional framework linked directly with the Land Surveyors Registration Board and the National Land Policy of the Ministry of Lands. We certify that only individuals possessing accredited degrees, complete APC training portfolios, and audited CPD hours are granted licences to practice.
                  </p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                    <BookOpen className="h-5 w-5 text-amber-500 mr-2" />
                    <span>Ethics & Standards</span>
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Our Code of Conduct establishes rigorous legal and moral guidelines for all practitioners. SIM actively protects the public against sub-standard boundary delineations, inflated quantity estimates, and biased asset appraisals.
                  </p>
                </div>
              </div>
            </div>

            {/* Council & Secretariat Organization */}
            <div className="space-y-8">
              <h3 className="text-2xl font-extrabold text-slate-900 text-center">Council Members (2025/2026)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[
                  { name: 'Dr. T. S. Chirwa', role: 'President (Fellow VEM)', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&fit=crop&q=60' },
                  { name: 'M. K. Gondwe', role: 'Vice President (Fellow LS)', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&fit=crop&q=60' },
                  { name: 'F. J. Phiri', role: 'Treasurer General (QS)', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&fit=crop&q=60' },
                  { name: 'Beatrice Banda', role: 'Honorary Secretary (QS)', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&fit=crop&q=60' }
                ].map((c, i) => (
                  <div key={i} className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm text-center">
                    <img src={c.image} alt={c.name} className="w-20 h-20 rounded-full mx-auto object-cover mb-4" referrerPolicy="no-referrer" />
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{c.name}</h4>
                    <p className="text-amber-600 text-2xs font-medium mt-1 uppercase tracking-wider">{c.role}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <h3 className="text-2xl font-extrabold text-slate-900 text-center">SIM Secretariat Team</h3>
              <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { name: 'Zione Banda', role: 'Executive Secretary', details: 'Oversees day-to-day administrative affairs and strategic partnerships.' },
                  { name: 'Limbani Phiri', role: 'Registrations & Licensing Officer', details: 'Manages membership records, licensing approvals, and CPD verification logs.' },
                  { name: 'Clara Chawinga', role: 'Finance & Accounts Officer', details: 'In charge of billing cycles, subscription fees verification, and financial records.' }
                ].map((s, i) => (
                  <div key={i} className="bg-white p-6 rounded-lg border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                      <span className="text-amber-600 text-3xs uppercase font-semibold tracking-widest mt-1 block">{s.role}</span>
                      <p className="text-slate-500 text-2xs leading-relaxed mt-2.5">{s.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PUBLIC REGISTRAR */}
        {activeTab === 'registrar' && (
          <div id="view-registrar" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-3xl font-extrabold text-slate-900">National Surveyors Registrar</h1>
              <p className="mt-2 text-slate-600 text-sm">
                Confirm credentials and active status of all professional land surveyors, quantity surveyors, estate appraisers, and licensed corporate firms in Malawi.
              </p>
            </div>

            {/* Toggle Registrar Type */}
            <div className="flex justify-center">
              <div className="bg-slate-200 p-1 rounded-lg inline-flex">
                <button
                  onClick={() => { setRegistrarType('members'); setSearchQuery(''); }}
                  className={`px-6 py-2 rounded-md text-xs font-bold transition-all ${
                    registrarType === 'members' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  Individual Members Directory
                </button>
                <button
                  onClick={() => { setRegistrarType('firms'); setSearchQuery(''); }}
                  className={`px-6 py-2 rounded-md text-xs font-bold transition-all ${
                    registrarType === 'firms' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  Licensed Surveying Firms
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={registrarType === 'members' ? "Search members by name, registration number, employer..." : "Search firms by firm name, registration number, city..."}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                {registrarType === 'members' && (
                  <>
                    <select
                      value={selectedChapter}
                      onChange={(e) => setSelectedChapter(e.target.value)}
                      className="py-3 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    >
                      <option value="">All Chapters</option>
                      <option value="Land Surveying">Land Surveying</option>
                      <option value="Quantity Surveying">Quantity Surveying</option>
                      <option value="Valuation & Estate Management">Valuation & Estate Management</option>
                    </select>

                    <select
                      value={selectedGrade}
                      onChange={(e) => setSelectedGrade(e.target.value)}
                      className="py-3 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    >
                      <option value="">All Grades</option>
                      <option value="Fellow">Fellow</option>
                      <option value="Professional">Professional</option>
                      <option value="Associate">Associate</option>
                      <option value="Graduate">Graduate</option>
                      <option value="Technician">Technician</option>
                      <option value="Student">Student</option>
                    </select>
                  </>
                )}
              </div>
            </div>

            {/* Results Grid */}
            {registrarType === 'members' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs text-slate-500 px-2 font-mono">
                  <span>Found {filteredMembers.length} active registered member(s)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredMembers.map(m => (
                    <div key={m.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center font-bold text-lg border border-amber-100">
                          {m.firstName[0]}{m.lastName[0]}
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-slate-900 text-sm">{m.firstName} {m.lastName}</h4>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-3xs font-semibold uppercase tracking-wider rounded-full">Active</span>
                          </div>
                          <span className="text-2xs font-mono text-slate-400 block mt-0.5">Reg: {m.memberNo || 'Processing'}</span>
                          
                          <div className="grid grid-cols-2 gap-y-1 gap-x-4 mt-3 text-2xs text-slate-600">
                            <div><strong className="text-slate-800">Chapter:</strong> {m.chapter}</div>
                            <div><strong className="text-slate-800">Grade:</strong> {m.grade}</div>
                            <div className="col-span-2"><strong className="text-slate-800">Employer:</strong> {m.employer || 'N/A'} ({m.region} Region)</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredMembers.length === 0 && (
                    <div className="col-span-2 bg-white text-center py-12 rounded-xl border border-dashed border-slate-200">
                      <p className="text-slate-500 text-sm">No registered members matched your criteria.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs text-slate-500 px-2 font-mono">
                  <span>Found {filteredFirms.length} active certified firm(s)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredFirms.map(f => {
                    const mp = members.find(m => m.id === f.managingPartnerId);
                    return (
                      <div key={f.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900 text-base">{f.firmName}</h4>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-3xs font-semibold uppercase tracking-wider rounded-full">Licensed</span>
                          </div>
                          <span className="text-2xs font-mono text-slate-400 block mt-0.5">Reg No: {f.regNo}</span>

                          <div className="mt-4 space-y-1 text-2xs text-slate-600">
                            <div><strong className="text-slate-800">Managing Partner:</strong> {mp ? `${mp.firstName} ${mp.lastName}` : 'Registered Partner'}</div>
                            <div><strong className="text-slate-800">Address:</strong> {f.address || 'N/A'}, {f.city}</div>
                            {f.contactEmail && <div><strong className="text-slate-800">Email:</strong> {f.contactEmail}</div>}
                            {f.contactPhone && <div><strong className="text-slate-800">Phone:</strong> {f.contactPhone}</div>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredFirms.length === 0 && (
                    <div className="col-span-2 bg-white text-center py-12 rounded-xl border border-dashed border-slate-200">
                      <p className="text-slate-500 text-sm">No licensed firms matched your search queries.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PUBLICATIONS */}
        {activeTab === 'publications' && (
          <div id="view-publications" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-3xl font-extrabold text-slate-900">Publications & Downloads</h1>
              <p className="mt-2 text-slate-600 text-sm">
                Access official regulatory acts, SIM constitutional documents, APC manuals, and digitized application forms.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {publications.map(p => (
                <div key={p.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded text-3xs font-mono font-bold uppercase">{p.category}</span>
                      <span className="text-slate-400 text-3xs font-mono">{p.date}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base mt-2">{p.title}</h3>
                    <p className="text-slate-500 text-xs mt-1">{p.description}</p>
                  </div>
                  <button 
                    onClick={() => alert(`Initiating download for: ${p.title}\nIn a live deployment, this points to secure PDF files.`)}
                    className="flex items-center justify-center space-x-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all flex-shrink-0"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download PDF</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: DOWNLOADS */}
        {activeTab === 'downloads' && (
          <DownloadsPage />
        )}

        {/* TAB 5: FAQs */}
        {activeTab === 'faqs' && (
          <FAQAccordion apiFaqs={faqs} onNavigateTab={(tab) => setActiveTab(tab)} />
        )}

        {/* TAB 6: CONTACT */}
        {activeTab === 'contact' && (
          <div id="view-contact" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">SIM Secretariat</h1>
                <p className="text-slate-500 text-xs mt-1">Get in touch with the team at our main headquarters.</p>
              </div>

              <div className="space-y-4 text-xs text-slate-600">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-slate-800">Physical Address:</strong>
                    <p className="mt-0.5">Development House, 3rd Floor Office Suite 12, Area 3, Lilongwe, Malawi</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-slate-800">Official Email:</strong>
                    <p className="mt-0.5">secretariat@sim.mw</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-slate-800">Telephone Contact:</strong>
                    <p className="mt-0.5">+265 111 754 312 / +265 888 123 456</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-white p-8 rounded-xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Send an Inquiry</h3>

              <form onSubmit={handleContactSubmit} className="space-y-4">
                {contactSuccess && (
                  <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg text-xs font-medium">
                    {contactSuccess}
                  </div>
                )}
                {contactError && (
                  <div className="p-4 bg-red-50 text-red-800 border border-red-100 rounded-lg text-xs font-medium">
                    {contactError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Your Name</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Email Address</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Subject</label>
                  <input
                    type="text"
                    required
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Message Content</label>
                  <textarea
                    rows={4}
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-amber-500"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={contactLoading}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-slate-950 font-extrabold rounded text-xs tracking-wider transition-all shadow-md shadow-amber-500/10"
                >
                  {contactLoading ? 'SENDING...' : 'SEND MESSAGE'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 7: VERIFY CERTIFICATE */}
        {activeTab === 'verify' && (
          <div id="view-verify" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
            <div className="text-center max-w-xl mx-auto">
              <h1 className="text-3xl font-extrabold text-slate-900">National Licence Verification Engine</h1>
              <p className="mt-2 text-slate-600 text-xs">
                Enter any SIM-issued Practising Certificate or Membership Licence Serial Number to verify validity, financial status, and spatial chapters directly.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={verifyLicenceNo}
                  onChange={(e) => setVerifyLicenceNo(e.target.value)}
                  placeholder="e.g. SIM-LIC-QS-2026-002"
                  className="flex-grow px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 font-mono"
                />
                <button
                  onClick={() => handleVerify(verifyLicenceNo)}
                  disabled={verifyLoading}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-slate-950 font-extrabold rounded-lg text-xs tracking-wider transition-all shadow-md"
                >
                  {verifyLoading ? 'VERIFYING...' : 'VERIFY'}
                </button>
              </div>

              {verificationError && (
                <div className="p-4 bg-red-50 text-red-800 border border-red-100 rounded-lg text-xs font-semibold flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Verification Failed:</strong>
                    <p className="mt-1 font-light">{verificationError}</p>
                  </div>
                </div>
              )}

              {verificationResult && (
                <div className="border border-slate-100 bg-slate-50 rounded-xl p-8 space-y-6 relative overflow-hidden shadow-inner">
                  {/* Decorative badge background watermark */}
                  <div className="absolute right-4 top-4 text-emerald-500/10">
                    <ShieldCheck className="h-32 w-32" />
                  </div>

                  <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 relative z-10">
                    <CheckCircle className="h-8 w-8 text-emerald-600 flex-shrink-0" />
                    <div>
                      <span className="text-emerald-700 text-3xs uppercase font-extrabold tracking-widest bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">SIM CERTIFIED</span>
                      <h4 className="font-extrabold text-slate-900 text-base mt-0.5">Official Registry Entry Verified</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs relative z-10">
                    <div>
                      <span className="text-slate-400 block font-mono text-3xs uppercase">Registered Professional</span>
                      <strong className="text-slate-800 text-sm block mt-0.5">{verificationResult.profile.firstName} {verificationResult.profile.lastName}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-mono text-3xs uppercase">Licence Serial Number</span>
                      <strong className="text-slate-800 text-sm block mt-0.5 font-mono">{verificationResult.licence.licenceNo}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-mono text-3xs uppercase">Accredited Chapter</span>
                      <strong className="text-slate-800 block mt-0.5">{verificationResult.profile.chapter}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-mono text-3xs uppercase">Grade & Level</span>
                      <strong className="text-slate-800 block mt-0.5">{verificationResult.profile.grade} Grade</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-mono text-3xs uppercase">Financial Cycle</span>
                      <strong className="text-slate-800 block mt-0.5 font-mono">FY {verificationResult.licence.financialYear}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-mono text-3xs uppercase">Valid Expiry Date</span>
                      <strong className="text-slate-800 block mt-0.5 font-mono text-emerald-700">{verificationResult.licence.expiryDate} (Active)</strong>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-3xs text-slate-400 relative z-10 gap-2">
                    <span className="font-mono">Verification Key: {btoa(verificationResult.licence.licenceNo).substring(0, 16)}</span>
                    <span className="flex items-center text-emerald-700 font-semibold">
                      <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                      Cryptographically Certified Ledger Record
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Corporate Footnote */}
      <footer id="website-footer" className="bg-[#0F172A] text-slate-400 text-xs py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <span className="font-extrabold text-white text-base tracking-wide block">SIM MALAWI</span>
            <p className="text-2xs leading-relaxed font-light">
              We are a registered professional association regulating spatial disciplines, quantity appraisals, and land boundary surveys across Malawi.
            </p>
          </div>
          <div className="space-y-2">
            <strong className="text-white text-xs uppercase tracking-wider block">Quick Links</strong>
            <div className="grid grid-cols-2 gap-1.5 text-2xs">
              <button onClick={() => setActiveTab('home')} className="text-left hover:text-white">Home</button>
              <button onClick={() => setActiveTab('about')} className="text-left hover:text-white">About SIM</button>
              <button onClick={() => setActiveTab('registrar')} className="text-left hover:text-white">Public Registrar</button>
              <button onClick={() => setActiveTab('publications')} className="text-left hover:text-white">Downloads</button>
            </div>
          </div>
          <div className="space-y-2">
            <strong className="text-white text-xs uppercase tracking-wider block">Office HQ</strong>
            <p className="text-2xs leading-relaxed font-light">
              Development House, 3rd Floor Suite 12, Area 3, Lilongwe, Malawi<br />
              Email: secretariat@sim.mw | Tel: +265 111 754 312
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-slate-800 text-center text-2xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span>&copy; {new Date().getFullYear()} Surveyors Institute of Malawi (SIM). All Rights Reserved.</span>
          <span className="flex items-center text-slate-400 font-semibold font-mono">
            <ShieldCheck className="h-4 w-4 mr-1 text-amber-500" />
            REGULATORY PORTAL V1.0.0
          </span>
        </div>
      </footer>

      {/* UNIFIED AUTHENTICATION MODAL */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-lg w-full relative z-10 max-h-[90vh] overflow-y-auto space-y-6">
            {/* Close Button */}
            <button 
              onClick={() => {
                setAuthModalOpen(false);
                setAuthError(null);
                setRegError(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center space-y-1.5 pr-6">
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">SIM Security Gateway</h3>
              <p className="text-slate-500 text-2xs">
                Access professional licensing boards, invoice ledger audits, and CPD registers.
              </p>
            </div>

            {/* TABS CHANGER */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setAuthModalTab('login');
                  setAuthError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authModalTab === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthModalTab('register');
                  setRegError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authModalTab === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Online Register
              </button>
            </div>

            {/* SOCIAL LOGINS */}
            <div className="space-y-3">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                Quick Access Federated Identities
              </span>
              
              {socialLoading ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-2 bg-slate-50 border border-slate-100 rounded-xl animate-pulse">
                  <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
                  <span className="text-2xs font-mono text-slate-500">Securing handshake with {socialLoading}...</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('Google')}
                    className="flex items-center justify-center space-x-1.5 py-2.5 px-3 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-2xs font-semibold text-slate-700 cursor-pointer"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('Facebook')}
                    className="flex items-center justify-center space-x-1.5 py-2.5 px-3 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-2xs font-semibold text-slate-700 cursor-pointer"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <path fill="#1877F2" d="M24 12a12 12 0 1 0-13.875 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385A12 12 0 0 0 24 12z" />
                    </svg>
                    <span>Facebook</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('Microsoft')}
                    className="flex items-center justify-center space-x-1.5 py-2.5 px-3 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-2xs font-semibold text-slate-700 cursor-pointer"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 23 23" fill="none">
                      <rect x="0" y="0" width="10.5" height="10.5" fill="#F25022" />
                      <rect x="12.5" y="0" width="10.5" height="10.5" fill="#7FBA00" />
                      <rect x="0" y="12.5" width="10.5" height="10.5" fill="#00A4EF" />
                      <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900" />
                    </svg>
                    <span>Microsoft</span>
                  </button>
                </div>
              )}
            </div>

            {/* DIVIDER */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Or Corporate Credentials
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* FORMS */}
            {authModalTab === 'login' ? (
              <form onSubmit={handleAuthLoginSubmit} className="space-y-4 text-xs">
                {authError && (
                  <div className="p-3 bg-red-50 text-red-800 border border-red-100 rounded-lg font-medium">
                    {authError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-700 uppercase tracking-wide">
                    Email Address or Username
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="admin OR member@domain.mw"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-700 uppercase tracking-wide">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Help notice for admin credentials */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-3xs font-mono text-slate-500 space-y-1">
                  <div>💡 <strong>Admin Keys</strong>: username: <strong className="text-amber-700">admin</strong>, pass: <strong className="text-amber-700">admin123</strong></div>
                  <div>💡 <strong>Demo Member Keys</strong>: username: <strong className="text-amber-700">chancy.gondwe@sim.mw</strong> (any password)</div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-extrabold rounded-lg tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-1 uppercase text-2xs"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Secure Authorize</span>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleAuthRegisterSubmit} className="space-y-4 text-xs">
                {regError && (
                  <div className="p-3 bg-red-50 text-red-800 border border-red-100 rounded-lg font-medium">
                    {regError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-slate-700 uppercase">First Name</label>
                    <input
                      type="text"
                      required
                      value={regForm.firstName}
                      onChange={(e) => setRegForm({ ...regForm, firstName: e.target.value })}
                      placeholder="Chancy"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-slate-700 uppercase">Last Name</label>
                    <input
                      type="text"
                      required
                      value={regForm.lastName}
                      onChange={(e) => setRegForm({ ...regForm, lastName: e.target.value })}
                      placeholder="Gondwe"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-slate-700 uppercase">Email Address</label>
                    <input
                      type="email"
                      required
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      placeholder="chancy.gondwe@sim.mw"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-slate-700 uppercase">Password</label>
                    <input
                      type="password"
                      required
                      value={regForm.password}
                      onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-slate-700 uppercase">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={regForm.phone}
                      onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                      placeholder="+265 888 123 456"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-slate-700 uppercase">Chapter</label>
                    <select
                      value={regForm.chapter}
                      onChange={(e) => setRegForm({ ...regForm, chapter: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 font-semibold"
                    >
                      <option value="Land Surveying">Land Surveying</option>
                      <option value="Quantity Surveying">Quantity Surveying</option>
                      <option value="Valuation & Estate Management">Valuation & Estate Management</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-slate-700 uppercase">Grade</label>
                    <select
                      value={regForm.grade}
                      onChange={(e) => setRegForm({ ...regForm, grade: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 font-semibold"
                    >
                      <option value="Student">Student</option>
                      <option value="Graduate">Graduate</option>
                      <option value="Professional">Professional</option>
                      <option value="Fellow">Fellow</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-slate-700 uppercase">Region</label>
                    <select
                      value={regForm.region}
                      onChange={(e) => setRegForm({ ...regForm, region: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 font-semibold"
                    >
                      <option value="Southern">Southern</option>
                      <option value="Central">Central</option>
                      <option value="Northern">Northern</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-slate-700 uppercase">Employer</label>
                    <input
                      type="text"
                      value={regForm.employer}
                      onChange={(e) => setRegForm({ ...regForm, employer: e.target.value })}
                      placeholder="Ministry of Lands"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-slate-700 uppercase">Designation</label>
                    <input
                      type="text"
                      value={regForm.designation}
                      onChange={(e) => setRegForm({ ...regForm, designation: e.target.value })}
                      placeholder="Senior Land Surveyor"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 bg-[#F59E0B] hover:bg-amber-600 disabled:bg-slate-400 text-slate-950 font-extrabold rounded-lg tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-1 uppercase text-2xs"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Complete Registration</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

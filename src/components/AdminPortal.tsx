/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Award, 
  DollarSign, 
  ShieldCheck, 
  Search, 
  Plus, 
  Building, 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Terminal, 
  HelpCircle,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Filter,
  Info,
  Bell,
  RefreshCw,
  AlertTriangle,
  Mail,
  Check,
  X
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { User, MemberProfile, SurveyingFirm, Invoice, Payment, CpdAttendance, Event, AuditLog, Licence } from '../types';

interface AdminPortalProps {
  onBackToWebsite: () => void;
  initialIsAdminLoggedIn?: boolean;
  onLogout?: () => void;
}

export default function AdminPortal({ onBackToWebsite, initialIsAdminLoggedIn, onLogout }: AdminPortalProps) {
  // Auth states
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(initialIsAdminLoggedIn || false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);

  // Workspace View Tab
  const [adminTab, setAdminTab] = useState<'dashboard' | 'members' | 'firms' | 'payments' | 'cpd' | 'events' | 'cms' | 'audit'>('dashboard');

  // Master Data States
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [firms, setFirms] = useState<SurveyingFirm[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cpdQueue, setCpdQueue] = useState<CpdAttendance[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [licences, setLicences] = useState<Licence[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Filters & Search
  const [searchMember, setSearchMember] = useState('');
  const [searchFirm, setSearchFirm] = useState('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Members filters and pagination
  const [filterMemberChapter, setFilterMemberChapter] = useState('all');
  const [filterMemberGrade, setFilterMemberGrade] = useState('all');
  const [filterMemberStatus, setFilterMemberStatus] = useState('all');
  const [currentPageMembers, setCurrentPageMembers] = useState(1);

  // Firms filters and pagination
  const [filterFirmCity, setFilterFirmCity] = useState('all');
  const [currentPageFirms, setCurrentPageFirms] = useState(1);

  // Payments filters and pagination
  const [searchPayment, setSearchPayment] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('Pending');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [currentPagePayments, setCurrentPagePayments] = useState(1);

  // CPD filters and pagination
  const [searchCpd, setSearchCpd] = useState('');
  const [filterCpdStatus, setFilterCpdStatus] = useState('Pending');
  const [currentPageCPD, setCurrentPageCPD] = useState(1);

  // Audit logs filters and pagination
  const [searchAudit, setSearchAudit] = useState('');
  const [filterAuditAction, setFilterAuditAction] = useState('all');
  const [currentPageAudit, setCurrentPageAudit] = useState(1);

  // CMS forms states
  const [newsForm, setNewsForm] = useState({ title: '', excerpt: '', content: '', category: 'Institute', image: '' });
  const [faqForm, setFaqForm] = useState({ question: '', answer: '' });
  const [pubForm, setPubForm] = useState({ title: '', category: 'Act', description: '' });

  // Event form states
  const [eventForm, setEventForm] = useState({ title: '', description: '', eventDate: '', venue: '', cpdPoints: '10', registrationFee: '50000' });

  // Firm Form states
  const [firmForm, setFirmForm] = useState({ firmName: '', regNo: '', managingPartnerId: '', address: '', city: 'Blantyre', email: '', phone: '' });

  useEffect(() => {
    if (isAdminLoggedIn) {
      loadAllAdminData();
    }
  }, [isAdminLoggedIn]);

  const loadAllAdminData = async () => {
    try {
      const [memRes, firmRes, invRes, payRes, cpdRes, evtRes, logRes, licRes, userRes] = await Promise.all([
        fetch('/api/members').then(r => r.json()),
        fetch('/api/firms').then(r => r.json()),
        fetch('/api/invoices').then(r => r.json()),
        fetch('/api/payments').then(r => r.json()),
        fetch('/api/cpd').then(r => r.json()),
        fetch('/api/events').then(r => r.json()),
        fetch('/api/audit-logs').then(r => r.json()),
        fetch('/api/licences').then(r => r.json()),
        fetch('/api/users').then(r => r.json()),
      ]);

      setMembers(memRes || []);
      setFirms(firmRes || []);
      setInvoices(invRes || []);
      setPayments(payRes || []);
      setCpdQueue(cpdRes || []);
      setEvents(evtRes || []);
      setAuditLogs(logRes || []);
      setLicences(licRes || []);
      setUsers(userRes || []);
    } catch (err) {
      console.error('Error loading administrative workspace records:', err);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    const isEmailAdmin = adminEmail.toLowerCase() === 'admin@sim.mw' || adminEmail.toLowerCase() === 'admin';
    const isPasswordAdmin = adminPassword === 'admin' || adminPassword === 'admin123';
    if (isEmailAdmin && isPasswordAdmin) {
      setIsAdminLoggedIn(true);
    } else {
      setAdminError('Invalid administrative credentials.');
    }
  };

  // Status Change (Approve Member Profile)
  const handleApproveMemberStatus = async (memberId: number, nextStatus: string) => {
    if (!confirm(`Are you sure you want to transition this member status to: ${nextStatus}?`)) return;
    try {
      const res = await fetch(`/api/members/${memberId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, adminEmail: 'admin@sim.mw', adminUserId: 1 })
      });
      if (res.ok) {
        alert('Member status successfully updated.');
        loadAllAdminData();
      } else {
        alert('Failed to change status.');
      }
    } catch (err) {
      alert('Error updating status.');
    }
  };

  // Payment slip Verification Action
  const handleVerifyPaymentSlip = async (paymentId: number, decision: 'Verified' | 'Rejected') => {
    if (!confirm(`Are you sure you want to verify this payment as ${decision}?`)) return;
    try {
      const res = await fetch(`/api/payments/verify/${paymentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: decision, adminEmail: 'admin@sim.mw', adminUserId: 1 })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        loadAllAdminData();
      } else {
        alert(data.error || 'Verification error.');
      }
    } catch (err) {
      alert('Error verifying payment.');
    }
  };

  // CPD verification approval
  const handleVerifyCPD = async (cpdId: number, decision: 'Approved' | 'Rejected') => {
    if (!confirm(`Are you sure you want to verify this CPD submission as ${decision}?`)) return;
    try {
      const res = await fetch(`/api/cpd/approve/${cpdId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: decision, adminEmail: 'admin@sim.mw', adminUserId: 1 })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        loadAllAdminData();
      } else {
        alert(data.error || 'CPD evaluation error.');
      }
    } catch (err) {
      alert('Error verifying CPD points.');
    }
  };

  // Create CPD Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventForm)
      });
      if (res.ok) {
        alert('Event created and published to the SIM portal.');
        setEventForm({ title: '', description: '', eventDate: '', venue: '', cpdPoints: '10', registrationFee: '50000' });
        loadAllAdminData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create event.');
      }
    } catch (err) {
      alert('Error posting event.');
    }
  };

  // Register Surveying Firm
  const handleCreateFirm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/firms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firmName: firmForm.firmName,
          regNo: firmForm.regNo,
          managingPartnerId: firmForm.managingPartnerId,
          address: firmForm.address,
          city: firmForm.city,
          contactEmail: firmForm.email,
          contactPhone: firmForm.phone
        })
      });
      if (res.ok) {
        alert('Surveying Firm registered successfully in the National Directory.');
        setFirmForm({ firmName: '', regNo: '', managingPartnerId: '', address: '', city: 'Blantyre', email: '', phone: '' });
        loadAllAdminData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to register firm.');
      }
    } catch (err) {
      alert('Error saving firm.');
    }
  };

  // CMS: Post News Article
  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newsForm)
      });
      if (res.ok) {
        alert('News article successfully published to the public portal.');
        setNewsForm({ title: '', excerpt: '', content: '', category: 'Institute', image: '' });
        loadAllAdminData();
      }
    } catch (err) {
      alert('Error saving news.');
    }
  };

  // CMS: Post FAQ
  const handleCreateFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faqForm)
      });
      if (res.ok) {
        alert('FAQ item successfully saved.');
        setFaqForm({ question: '', answer: '' });
        loadAllAdminData();
      }
    } catch (err) {
      alert('Error saving FAQ.');
    }
  };

  // CMS: Post Publication
  const handleCreatePublication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/publications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pubForm)
      });
      if (res.ok) {
        alert('Publication successfully listed.');
        setPubForm({ title: '', category: 'Act', description: '' });
        loadAllAdminData();
      }
    } catch (err) {
      alert('Error saving publication.');
    }
  };

  // Real-Time Notification & Polling States
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationFilters, setNotificationFilters] = useState<'all' | 'registration' | 'payment' | 'renewal'>('all');
  const [sendingReminderId, setSendingReminderId] = useState<number | null>(null);

  // Automatic background data synchronization polling
  useEffect(() => {
    if (!isAdminLoggedIn) return;
    const interval = setInterval(() => {
      loadAllAdminData();
    }, 15000); // 15 seconds intervals
    return () => clearInterval(interval);
  }, [isAdminLoggedIn]);

  // Helper to calculate days remaining
  const getDaysRemaining = (expiryStr: string) => {
    const expiry = new Date(expiryStr);
    const today = new Date('2026-07-09'); // Consistent mock system date
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Memoized lists of live pending notifications
  const notifications = React.useMemo(() => {
    const list: Array<{
      id: string;
      type: 'registration' | 'payment' | 'renewal';
      title: string;
      description: string;
      date: string;
      rawId: number;
      metadata: any;
    }> = [];

    // 1. Pending Registrations
    members.filter(m => m.status === 'Pending').forEach(m => {
      list.push({
        id: `reg-${m.id}`,
        type: 'registration',
        title: 'Pending Registration',
        description: `${m.firstName} ${m.lastName} requested registration in ${m.chapter} (${m.grade} Grade).`,
        date: m.createdAt ? m.createdAt.substring(0, 10) : 'Recent',
        rawId: m.id,
        metadata: m
      });
    });

    // 2. Pending Payment Verifications
    payments.filter(p => p.verificationStatus === 'Pending').forEach(p => {
      const invoice = invoices.find(i => i.id === p.invoiceId);
      const member = invoice ? members.find(m => m.id === invoice.memberId) : null;
      const payerName = member ? `${member.firstName} ${member.lastName}` : 'SIM Professional';
      list.push({
        id: `pay-${p.id}`,
        type: 'payment',
        title: 'Unverified Payment',
        description: `MWK ${p.amountPaid.toLocaleString()} deposit from ${payerName} for ${invoice?.description || 'invoice'}. Ref: ${p.referenceNo}.`,
        date: p.paymentDate || 'Recent',
        rawId: p.id,
        metadata: p
      });
    });

    // 3. Upcoming Renewals (expiring within 1 year)
    licences.filter(l => l.status === 'Active').forEach(l => {
      const daysLeft = getDaysRemaining(l.expiryDate);
      if (daysLeft > 0 && daysLeft <= 365) {
        const member = members.find(m => m.id === l.memberId);
        const name = member ? `${member.firstName} ${member.lastName}` : 'SIM Registered Professional';
        list.push({
          id: `ren-${l.id}`,
          type: 'renewal',
          title: 'Licence Expiring Soon',
          description: `Practising certificate ${l.licenceNo} held by ${name} expires on ${l.expiryDate} (${daysLeft} days remaining).`,
          date: l.dateIssued || 'Active',
          rawId: l.id,
          metadata: l
        });
      }
    });

    return list;
  }, [members, payments, licences, invoices]);

  // Filtered notifications based on active pill
  const filteredNotifications = React.useMemo(() => {
    return notifications.filter(n => notificationFilters === 'all' || n.type === notificationFilters);
  }, [notifications, notificationFilters]);

  // Memoized lists of global search results
  const globalSearchResults = React.useMemo(() => {
    if (!globalSearchQuery.trim()) return null;
    const query = globalSearchQuery.toLowerCase().trim();

    // Helper to get email for a member
    const getMemberEmail = (memberUserId: number) => {
      const user = users.find(u => u.id === memberUserId);
      return user ? user.email.toLowerCase() : '';
    };

    // Filter Members & Applications
    const matchingMembersList = members.filter(m => m.status !== 'Pending');
    const matchingApplicationsList = members.filter(m => m.status === 'Pending');

    const matchedMembers = matchingMembersList.filter(m => {
      const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
      const memberNo = (m.memberNo || '').toLowerCase();
      const idStr = String(m.id);
      const email = getMemberEmail(m.userId);

      return fullName.includes(query) || 
             memberNo.includes(query) || 
             idStr === query || 
             email.includes(query);
    });

    const matchedApplications = matchingApplicationsList.filter(m => {
      const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
      const memberNo = (m.memberNo || '').toLowerCase();
      const idStr = String(m.id);
      const email = getMemberEmail(m.userId);

      return fullName.includes(query) || 
             memberNo.includes(query) || 
             idStr === query || 
             email.includes(query);
    });

    // Filter Transactions (Invoices and Payments)
    const matchedInvoices = invoices.filter(inv => {
      const invNo = (inv.invoiceNo || '').toLowerCase();
      const desc = (inv.description || '').toLowerCase();
      const idStr = String(inv.id);
      
      const member = members.find(m => m.id === inv.memberId);
      const memberName = member ? `${member.firstName} ${member.lastName}`.toLowerCase() : '';
      const memberEmail = member ? getMemberEmail(member.userId) : '';
      const memberNo = member ? (member.memberNo || '').toLowerCase() : '';

      return invNo.includes(query) || 
             desc.includes(query) || 
             idStr === query ||
             memberName.includes(query) || 
             memberEmail.includes(query) || 
             memberNo.includes(query);
    });

    const matchedPayments = payments.filter(p => {
      const refNo = (p.referenceNo || '').toLowerCase();
      const recNo = (p.receiptNo || '').toLowerCase();
      const idStr = String(p.id);
      const amtStr = String(p.amountPaid);

      const invoice = invoices.find(i => i.id === p.invoiceId);
      const invDesc = invoice ? invoice.description.toLowerCase() : '';
      const invNo = invoice ? invoice.invoiceNo.toLowerCase() : '';

      const member = invoice ? members.find(m => m.id === invoice.memberId) : null;
      const memberName = member ? `${member.firstName} ${member.lastName}`.toLowerCase() : '';
      const memberEmail = member ? getMemberEmail(member.userId) : '';
      const memberNo = member ? (member.memberNo || '').toLowerCase() : '';

      return refNo.includes(query) || 
             recNo.includes(query) || 
             idStr === query || 
             amtStr.includes(query) ||
             invDesc.includes(query) || 
             invNo.includes(query) ||
             memberName.includes(query) || 
             memberEmail.includes(query) || 
             memberNo.includes(query);
    });

    return {
      members: matchedMembers,
      applications: matchedApplications,
      invoices: matchedInvoices,
      payments: matchedPayments,
      totalCount: matchedMembers.length + matchedApplications.length + matchedInvoices.length + matchedPayments.length
    };
  }, [globalSearchQuery, members, invoices, payments, users]);

  // Transmission of digital practising licence renewal reminder notice
  const handleSendReminderNotice = async (licenceId: number) => {
    setSendingReminderId(licenceId);
    try {
      const res = await fetch(`/api/licences/remind/${licenceId}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Renewal reminder notice successfully dispatched.');
        loadAllAdminData();
      } else {
        alert(data.error || 'Failed to dispatch notice.');
      }
    } catch (err) {
      alert('Network error while dispatching notice.');
    } finally {
      setSendingReminderId(null);
    }
  };

  // Analytical Calculations for charts
  const totalMembers = members.length;
  const pendingApplications = members.filter(m => m.status === 'Pending').length;
  
  const currentYearMonth = new Date().toISOString().substring(0, 7); // e.g., "2026-07"
  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const revenueThisMonth = payments
    .filter(p => p.verificationStatus === 'Verified' && p.paymentDate.startsWith(currentYearMonth))
    .reduce((sum, p) => sum + p.amountPaid, 0);

  const activeLicencesCount = licences.filter(l => l.status === 'Active').length;

  const chapterData = [
    { name: 'Land Surveying', value: members.filter(m => m.chapter === 'Land Surveying').length },
    { name: 'Quantity Surveying', value: members.filter(m => m.chapter === 'Quantity Surveying').length },
    { name: 'Valuation & Estate', value: members.filter(m => m.chapter === 'Valuation & Estate Management').length },
  ];

  const regionData = [
    { name: 'Southern', Members: members.filter(m => m.region === 'Southern').length },
    { name: 'Central', Members: members.filter(m => m.region === 'Central').length },
    { name: 'Northern', Members: members.filter(m => m.region === 'Northern').length },
  ];

  const totalCollectedRevenue = payments
    .filter(p => p.verificationStatus === 'Verified')
    .reduce((sum, p) => sum + p.amountPaid, 0);

  const totalOutstandingBills = invoices
    .filter(i => i.status === 'Unpaid')
    .reduce((sum, i) => sum + i.amount, 0);

  const financialData = [
    { name: 'Collected MWK', amount: totalCollectedRevenue },
    { name: 'Outstanding MWK', amount: totalOutstandingBills },
  ];

  const pendingPaymentsQueue = payments.filter(p => p.verificationStatus === 'Pending');
  const pendingCpdQueue = cpdQueue.filter(c => c.status === 'Pending');

  // Member filtering
  const filteredMembers = members.filter(m => {
    const matchesSearch = `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchMember.toLowerCase()) ||
           (m.memberNo && m.memberNo.toLowerCase().includes(searchMember.toLowerCase())) ||
           m.chapter.toLowerCase().includes(searchMember.toLowerCase());
    const matchesChapter = filterMemberChapter === 'all' || m.chapter === filterMemberChapter;
    const matchesGrade = filterMemberGrade === 'all' || m.grade === filterMemberGrade;
    const matchesStatus = filterMemberStatus === 'all' || m.status === filterMemberStatus;
    return matchesSearch && matchesChapter && matchesGrade && matchesStatus;
  });

  // Firm filtering
  const filteredFirms = firms.filter(f => {
    const matchesSearch = f.firmName.toLowerCase().includes(searchFirm.toLowerCase()) ||
           f.regNo.toLowerCase().includes(searchFirm.toLowerCase());
    const matchesCity = filterFirmCity === 'all' || f.city === filterFirmCity;
    return matchesSearch && matchesCity;
  });

  // Payments filtering
  const filteredPayments = payments.filter(p => {
    const i = invoices.find(inv => inv.id === p.invoiceId);
    const member = i ? members.find(m => m.id === i.memberId) : null;
    const matchesSearch = searchPayment === '' || 
      (i && i.invoiceNo.toLowerCase().includes(searchPayment.toLowerCase())) ||
      (member && `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchPayment.toLowerCase())) ||
      p.referenceNo.toLowerCase().includes(searchPayment.toLowerCase());
    const matchesStatus = filterPaymentStatus === 'all' || p.verificationStatus === filterPaymentStatus;
    const matchesMethod = filterPaymentMethod === 'all' || p.paymentMethod === filterPaymentMethod;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  // CPD filtering
  const filteredCpd = cpdQueue.filter(c => {
    const member = members.find(m => m.id === c.memberId);
    const matchesSearch = searchCpd === '' ||
      c.title.toLowerCase().includes(searchCpd.toLowerCase()) ||
      (member && `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchCpd.toLowerCase())) ||
      (member && member.memberNo && member.memberNo.toLowerCase().includes(searchCpd.toLowerCase()));
    const matchesStatus = filterCpdStatus === 'all' || c.status === filterCpdStatus;
    return matchesSearch && matchesStatus;
  });

  // Audit filtering
  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch = searchAudit === '' ||
      log.userEmail.toLowerCase().includes(searchAudit.toLowerCase()) ||
      log.action.toLowerCase().includes(searchAudit.toLowerCase()) ||
      log.details.toLowerCase().includes(searchAudit.toLowerCase());
    const matchesAction = filterAuditAction === 'all' || log.action === filterAuditAction;
    return matchesSearch && matchesAction;
  });

  // Pagination setups
  const ITEMS_PER_PAGE = 5;
  const AUDIT_ITEMS_PER_PAGE = 10;

  // Paginated Members
  const totalPagesMembers = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE) || 1;
  const activePageMembers = Math.min(currentPageMembers, totalPagesMembers);
  const paginatedMembers = filteredMembers.slice((activePageMembers - 1) * ITEMS_PER_PAGE, activePageMembers * ITEMS_PER_PAGE);

  // Paginated Firms
  const totalPagesFirms = Math.ceil(filteredFirms.length / ITEMS_PER_PAGE) || 1;
  const activePageFirms = Math.min(currentPageFirms, totalPagesFirms);
  const paginatedFirms = filteredFirms.slice((activePageFirms - 1) * ITEMS_PER_PAGE, activePageFirms * ITEMS_PER_PAGE);

  // Paginated Payments
  const totalPagesPayments = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE) || 1;
  const activePagePayments = Math.min(currentPagePayments, totalPagesPayments);
  const paginatedPayments = filteredPayments.slice((activePagePayments - 1) * ITEMS_PER_PAGE, activePagePayments * ITEMS_PER_PAGE);

  // Paginated CPD
  const totalPagesCpd = Math.ceil(filteredCpd.length / ITEMS_PER_PAGE) || 1;
  const activePageCPD = Math.min(currentPageCPD, totalPagesCpd);
  const paginatedCpd = filteredCpd.slice((activePageCPD - 1) * ITEMS_PER_PAGE, activePageCPD * ITEMS_PER_PAGE);

  // Paginated Audit
  const totalPagesAudit = Math.ceil(filteredAuditLogs.length / AUDIT_ITEMS_PER_PAGE) || 1;
  const activePageAudit = Math.min(currentPageAudit, totalPagesAudit);
  const paginatedAuditLogs = filteredAuditLogs.slice((activePageAudit - 1) * AUDIT_ITEMS_PER_PAGE, activePageAudit * AUDIT_ITEMS_PER_PAGE);

  // Pagination Rendering Helper
  const renderPagination = (
    currentPage: number,
    totalPages: number,
    onPageChange: (page: number) => void,
    totalItems: number,
    itemsPerPage: number
  ) => {
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
        <div className="font-medium text-slate-600 font-mono text-center sm:text-left">
          Showing <span className="font-bold text-slate-900">{startItem}</span> to{' '}
          <span className="font-bold text-slate-900">{endItem}</span> of{' '}
          <span className="font-bold text-slate-900">{totalItems}</span> records
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            type="button"
            className="flex items-center space-x-1 px-3 py-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-bold transition-colors cursor-pointer min-h-[40px] text-2xs uppercase tracking-wider"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Prev</span>
          </button>
          <span className="font-mono font-bold text-slate-800 text-2xs px-3 py-2 bg-slate-50 border border-slate-200/50 rounded-lg whitespace-nowrap">
            PAGE {currentPage} OF {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            type="button"
            className="flex items-center space-x-1 px-3 py-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-bold transition-colors cursor-pointer min-h-[40px] text-2xs uppercase tracking-wider"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  };

  // Cryptographic styled Pagination
  const renderAuditPagination = (
    currentPage: number,
    totalPages: number,
    onPageChange: (page: number) => void,
    totalItems: number,
    itemsPerPage: number
  ) => {
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800 text-[10px] font-mono text-slate-500">
        <div className="text-center sm:text-left">
          Showing <span className="text-slate-300 font-bold">{startItem}</span> to{' '}
          <span className="text-slate-300 font-bold">{endItem}</span> of{' '}
          <span className="text-slate-300 font-bold">{totalItems}</span> cryptographic entries
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            type="button"
            className="flex items-center space-x-1 px-2.5 py-1.5 border border-slate-800 rounded bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 transition-colors cursor-pointer text-[9px] font-bold min-h-[36px]"
          >
            <ChevronLeft className="h-3 w-3" />
            <span>PREV_CHUNK</span>
          </button>
          <span className="text-amber-500 font-bold whitespace-nowrap">
            CHUNK {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            type="button"
            className="flex items-center space-x-1 px-2.5 py-1.5 border border-slate-800 rounded bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 transition-colors cursor-pointer text-[9px] font-bold min-h-[36px]"
          >
            <span>NEXT_CHUNK</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  };

  const COLORS = ['#F59E0B', '#3B82F6', '#10B981'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* ADMIN TOP NAV */}
      <header className="bg-slate-900 text-white py-4 px-6 shadow-md flex justify-between items-center border-b border-amber-500/20">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onBackToWebsite}>
          <div className="bg-amber-500 text-slate-950 p-2 rounded-lg font-bold">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight block">SIM SECRETARIAT</span>
            <span className="text-3xs text-amber-400 font-medium uppercase tracking-widest block -mt-1">Administrative Terminal</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={onBackToWebsite}
            className="text-xs font-semibold text-slate-300 hover:text-white flex items-center space-x-1"
          >
            <span>Public Site</span>
          </button>
          
          {isAdminLoggedIn && (
            <div className="flex items-center space-x-4 border-l border-slate-700 pl-4">
              {/* Real-Time Live Notification Bell with Active Badge count */}
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`relative p-2 rounded-lg transition-all hover:scale-105 cursor-pointer flex items-center justify-center ${
                  isNotificationsOpen 
                    ? 'bg-amber-500 text-slate-950 font-bold' 
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Real-Time Alerts Panel"
              >
                {notifications.length > 0 ? (
                  <Bell className="h-4 w-4 animate-bounce" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white font-extrabold font-mono text-[9px] h-4.5 w-4.5 rounded-full flex items-center justify-center border border-slate-900 animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>

              <div className="text-right">
                <span className="block text-xs font-bold text-white">Administrator</span>
                <span className="block text-3xs text-amber-400 font-mono tracking-wider">Level 1 Access</span>
              </div>
              <button 
                onClick={() => {
                  setIsAdminLoggedIn(false);
                  if (onLogout) onLogout();
                }}
                className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-md cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ADMIN MAIN WORKSPACE */}
      <main className="flex-grow flex flex-col">
        {!isAdminLoggedIn ? (
          /* ADMIN LOGIN SCREEN */
          <div className="flex-grow flex items-center justify-center p-4 py-16 bg-slate-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent"></div>
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-sm w-full relative z-10 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Secretariat Login</h2>
                <p className="text-slate-500 text-3xs">Use the standard administrative portal keys below for access.</p>
              </div>

              {/* Demo Help credentials box */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-3xs space-y-1">
                <span className="font-bold text-slate-800 uppercase block tracking-wider">Administrative Keys:</span>
                <div>Email: <strong className="font-mono text-amber-700">admin@sim.mw</strong></div>
                <div>Password: <strong className="font-mono text-amber-700">admin</strong></div>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
                {adminError && <div className="p-3 bg-red-50 text-red-800 border border-red-100 rounded font-medium">{adminError}</div>}

                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-700">Admin Email</label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@sim.mw"
                    className="w-full px-3 py-2 bg-slate-50 border rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-700">Password</label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-slate-50 border rounded"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded text-2xs tracking-wider transition-all"
                >
                  SECURE AUTHORIZE
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* ADMIN WORKSPACE PANEL */
          <div className="flex-grow flex flex-col md:flex-row">
            {/* ADMIN PORTAL PANEL SIDEBAR */}
            <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col py-6 border-r border-slate-800">
              <nav className="space-y-1 px-3 text-xs font-semibold flex-grow">
                {[
                  { id: 'dashboard', label: 'Executive Stats', icon: Users },
                  { id: 'members', label: 'Manage Members', icon: Award },
                  { id: 'firms', label: 'Surveying Firms', icon: Building },
                  { id: 'payments', label: 'Payments Slips Queue', icon: DollarSign, badge: pendingPaymentsQueue.length },
                  { id: 'cpd', label: 'CPD Audit Review', icon: Award, badge: pendingCpdQueue.length },
                  { id: 'events', label: 'CPD Seminars CMS', icon: Clock },
                  { id: 'cms', label: 'Web Content CMS', icon: BookOpen },
                  { id: 'audit', label: 'System Audit Trail', icon: Terminal }
                ].map(tab => {
                  const IconComp = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setAdminTab(tab.id as any)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                        adminTab === tab.id ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComp className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </div>
                      {tab.badge !== undefined && tab.badge > 0 && (
                        <span className="bg-red-500 text-white font-bold font-mono text-[10px] h-5 w-5 rounded-full flex items-center justify-center animate-pulse">
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* ADMIN CONTENT STAGE */}
            <section className="flex-grow p-6 sm:p-8 space-y-8 max-w-5xl overflow-y-auto">
              
              {/* VIEW: EXECUTIVE ANALYTICS */}
              {adminTab === 'dashboard' && (
                <div id="admin-dashboard" className="space-y-8">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">National Executive Dashboard</h2>
                    <p className="text-slate-500 text-xs">Real-time statistics derived directly from persistent database records.</p>
                  </div>

                  {/* Summary grid indicators */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Card 1: Total Members */}
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:border-slate-200">
                      <div className="space-y-1 text-left">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Total Members</span>
                        <strong className="text-2xl font-extrabold text-slate-900 block font-mono">{totalMembers}</strong>
                        <span className="text-3xs text-slate-500 block">Registered Professionals</span>
                      </div>
                      <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                        <Users className="h-6 w-6" />
                      </div>
                    </div>

                    {/* Card 2: Pending Applications */}
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:border-slate-200">
                      <div className="space-y-1 text-left">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Pending Applications</span>
                        <strong className="text-2xl font-extrabold text-amber-600 block font-mono">{pendingApplications}</strong>
                        <span className="text-3xs text-slate-500 block">Awaiting approval status</span>
                      </div>
                      <div className="bg-amber-50 text-amber-600 p-3 rounded-lg">
                        <Clock className="h-6 w-6" />
                      </div>
                    </div>

                    {/* Card 3: Revenue this Month */}
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:border-slate-200">
                      <div className="space-y-1 text-left">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Revenue this Month</span>
                        <strong className="text-xl font-extrabold text-emerald-700 block font-mono">MWK {revenueThisMonth.toLocaleString()}</strong>
                        <span className="text-3xs text-slate-500 block">{currentMonthName} Collection</span>
                      </div>
                      <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg">
                        <DollarSign className="h-6 w-6" />
                      </div>
                    </div>

                    {/* Card 4: Active Licences */}
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:border-slate-200">
                      <div className="space-y-1 text-left">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Active Licences</span>
                        <strong className="text-2xl font-extrabold text-blue-700 block font-mono">{activeLicencesCount}</strong>
                        <span className="text-3xs text-slate-500 block">Valid practice certificates</span>
                      </div>
                      <div className="bg-indigo-50 text-indigo-600 p-3 rounded-lg">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                    </div>
                  </div>

                  {/* Visual Charts Grid using Recharts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Chapter distribution Pie Chart */}
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                      <strong className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-4">Chapter Membership Distribution</strong>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chapterData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {chapterData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value} Members`} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Financial stats Chart */}
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                      <strong className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-4">Financial Invoice Analysis (MWK)</strong>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={financialData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip formatter={(value) => `MWK ${value.toLocaleString()}`} />
                            <Bar dataKey="amount" fill="#3B82F6" barSize={40}>
                              <Cell fill="#10B981" />
                              <Cell fill="#EF4444" />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Geographical breakdown BarChart */}
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm md:col-span-2">
                      <strong className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-4">Regional Distribution Zones</strong>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={regionData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="Members" fill="#F59E0B" barSize={50} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW: MEMBERS MANAGEMENT */}
              {adminTab === 'members' && (
                <div id="admin-members" className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
                  <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Registered Professional Registry</h3>
                      <p className="text-slate-500 text-xs">Verify credentials, grant approvals, and manage active, suspended, or lapsed memberships.</p>
                    </div>
                  </div>

                  {/* Responsive Search & Filters Bar */}
                  <div className="flex flex-col gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                      {/* Search Input */}
                      <div className="relative flex-grow">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={searchMember}
                          onChange={(e) => {
                            setSearchMember(e.target.value);
                            setCurrentPageMembers(1);
                          }}
                          placeholder="Search by name, member ID, chapter..."
                          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500 font-medium"
                        />
                      </div>

                      {/* Filter Dropdowns Group */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-shrink-0">
                        {/* Chapter Dropdown */}
                        <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5">
                          <span className="text-3xs text-slate-400 font-extrabold uppercase font-mono">Chapter</span>
                          <select
                            value={filterMemberChapter}
                            onChange={(e) => {
                              setFilterMemberChapter(e.target.value);
                              setCurrentPageMembers(1);
                            }}
                            className="bg-transparent border-0 text-2xs font-bold text-slate-700 focus:outline-none cursor-pointer flex-grow"
                          >
                            <option value="all">All</option>
                            <option value="Land Surveying">Land Surveying</option>
                            <option value="Quantity Surveying">Quantity Surveying</option>
                            <option value="Land Economy">Land Economy</option>
                          </select>
                        </div>

                        {/* Grade Dropdown */}
                        <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5">
                          <span className="text-3xs text-slate-400 font-extrabold uppercase font-mono">Grade</span>
                          <select
                            value={filterMemberGrade}
                            onChange={(e) => {
                              setFilterMemberGrade(e.target.value);
                              setCurrentPageMembers(1);
                            }}
                            className="bg-transparent border-0 text-2xs font-bold text-slate-700 focus:outline-none cursor-pointer flex-grow"
                          >
                            <option value="all">All Grade</option>
                            <option value="Fellow">Fellow</option>
                            <option value="Professional">Professional</option>
                            <option value="Associate">Associate</option>
                            <option value="Technician">Technician</option>
                            <option value="Graduate">Graduate</option>
                          </select>
                        </div>

                        {/* Status Dropdown */}
                        <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5">
                          <span className="text-3xs text-slate-400 font-extrabold uppercase font-mono">Status</span>
                          <select
                            value={filterMemberStatus}
                            onChange={(e) => {
                              setFilterMemberStatus(e.target.value);
                              setCurrentPageMembers(1);
                            }}
                            className="bg-transparent border-0 text-2xs font-bold text-slate-700 focus:outline-none cursor-pointer flex-grow"
                          >
                            <option value="all">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Pending">Pending</option>
                            <option value="Suspended">Suspended</option>
                            <option value="Lapsed">Lapsed</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop View (Table) */}
                  <div className="hidden md:block overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b text-slate-400 font-mono text-3xs uppercase">
                          <th className="pb-2">Name / ID</th>
                          <th className="pb-2">Chapter</th>
                          <th className="pb-2">Grade</th>
                          <th className="pb-2">Employer</th>
                          <th className="pb-2">Status</th>
                          <th className="pb-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-medium text-slate-700">
                        {paginatedMembers.map(m => (
                          <tr key={m.id} className="hover:bg-slate-50/50">
                            <td className="py-3">
                              <strong className="text-slate-900 block">{m.firstName} {m.lastName}</strong>
                              <span className="font-mono text-3xs text-slate-400 block mt-0.5">{m.memberNo || 'No ID'}</span>
                            </td>
                            <td className="py-3">{m.chapter}</td>
                            <td className="py-3">{m.grade}</td>
                            <td className="py-3 text-slate-500">{m.employer || 'Self-Employed'}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded text-3xs font-bold border ${
                                m.status === 'Active' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                  : m.status === 'Pending' 
                                  ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse'
                                  : 'bg-red-50 text-red-700 border-red-100'
                              }`}>{m.status}</span>
                            </td>
                            <td className="py-3 text-right space-x-1.5">
                              {m.status === 'Pending' && (
                                <button
                                  onClick={() => handleApproveMemberStatus(m.id, 'Active')}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded text-3xs cursor-pointer transition-colors"
                                >
                                  Approve
                                </button>
                              )}
                              {m.status === 'Active' ? (
                                <button
                                  onClick={() => handleApproveMemberStatus(m.id, 'Suspended')}
                                  className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2 py-1 rounded text-3xs cursor-pointer transition-colors"
                                >
                                  Suspend
                                </button>
                              ) : (
                                m.status !== 'Pending' && (
                                  <button
                                    onClick={() => handleApproveMemberStatus(m.id, 'Active')}
                                    className="bg-slate-900 hover:bg-slate-800 text-white px-2 py-1 rounded text-3xs cursor-pointer transition-colors"
                                  >
                                    Activate
                                  </button>
                                )
                              )}
                            </td>
                          </tr>
                        ))}
                        {paginatedMembers.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-slate-400 font-light font-mono text-xs">
                              No matching members found in registry.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile View (Cards) */}
                  <div className="block md:hidden space-y-3.5">
                    {paginatedMembers.map(m => (
                      <div key={m.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 space-y-3 text-left">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{m.firstName} {m.lastName}</h4>
                            <span className="font-mono text-3xs text-slate-400 mt-0.5 block">{m.memberNo || 'No ID'}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-3xs font-bold border ${
                            m.status === 'Active' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : m.status === 'Pending' 
                              ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse'
                              : 'bg-red-50 text-red-700 border-red-100'
                          }`}>{m.status}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-2xs font-medium text-slate-600 border-t border-b border-slate-200/50 py-2">
                          <div>
                            <span className="text-3xs text-slate-400 font-bold block uppercase tracking-wider">Chapter</span>
                            <span className="text-slate-800">{m.chapter}</span>
                          </div>
                          <div>
                            <span className="text-3xs text-slate-400 font-bold block uppercase tracking-wider">Grade</span>
                            <span className="text-slate-800">{m.grade}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-3xs text-slate-400 font-bold block uppercase tracking-wider">Employer</span>
                            <span className="text-slate-800 truncate block">{m.employer || 'Self-Employed'}</span>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2 pt-1">
                          {m.status === 'Pending' && (
                            <button
                              onClick={() => handleApproveMemberStatus(m.id, 'Active')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-2 rounded-lg text-2xs cursor-pointer transition-colors"
                            >
                              Approve
                            </button>
                          )}
                          {m.status === 'Active' ? (
                            <button
                              onClick={() => handleApproveMemberStatus(m.id, 'Suspended')}
                              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-2 rounded-lg text-2xs cursor-pointer transition-colors font-semibold"
                            >
                              Suspend
                            </button>
                          ) : (
                            m.status !== 'Pending' && (
                              <button
                                onClick={() => handleApproveMemberStatus(m.id, 'Active')}
                                className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg text-2xs cursor-pointer transition-colors font-extrabold"
                              >
                                Activate
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                    {paginatedMembers.length === 0 && (
                      <div className="py-8 text-center text-slate-400 font-light text-xs font-mono">
                        No matching members found in registry.
                      </div>
                    )}
                  </div>

                  {/* Pagination Section */}
                  {renderPagination(
                    activePageMembers,
                    totalPagesMembers,
                    setCurrentPageMembers,
                    filteredMembers.length,
                    ITEMS_PER_PAGE
                  )}
                </div>
              )}

              {/* VIEW: SURVEYING FIRMS */}
              {adminTab === 'firms' && (
                <div id="admin-firms" className="space-y-6">
                  {/* Create Firm Panel */}
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                    <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center">
                      <Plus className="h-4.5 w-4.5 text-amber-500 mr-1.5" />
                      <span>Licence Corporate Surveying Firm</span>
                    </h3>

                    <form onSubmit={handleCreateFirm} className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-2xs font-bold text-slate-700">Firm Corporate Name</label>
                          <input
                            type="text"
                            required
                            value={firmForm.firmName}
                            onChange={(e) => setFirmForm({ ...firmForm, firmName: e.target.value })}
                            placeholder="e.g. Blantyre GIS Surveyors Ltd"
                            className="w-full px-3 py-2 bg-slate-50 border rounded focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-2xs font-bold text-slate-700">Registration Serial Number</label>
                          <input
                            type="text"
                            required
                            value={firmForm.regNo}
                            onChange={(e) => setFirmForm({ ...firmForm, regNo: e.target.value })}
                            placeholder="e.g. SIM-FIRM-LS-009"
                            className="w-full px-3 py-2 bg-slate-50 border rounded focus:outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-2xs font-bold text-slate-700">Managing Partner ID (Member Profile ID)</label>
                          <select
                            required
                            value={firmForm.managingPartnerId}
                            onChange={(e) => setFirmForm({ ...firmForm, managingPartnerId: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border rounded focus:outline-none"
                          >
                            <option value="">Select Managing Partner</option>
                            {members.map(m => (
                              <option key={m.id} value={m.id}>{m.firstName} {m.lastName} (Reg: {m.memberNo})</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-2xs font-bold text-slate-700">HQ City</label>
                          <select
                            value={firmForm.city}
                            onChange={(e) => setFirmForm({ ...firmForm, city: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border rounded focus:outline-none"
                          >
                            <option value="Blantyre">Blantyre</option>
                            <option value="Lilongwe">Lilongwe</option>
                            <option value="Mzuzu">Mzuzu</option>
                            <option value="Zomba">Zomba</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-2xs font-bold text-slate-700">Office Physical Address</label>
                        <input
                          type="text"
                          value={firmForm.address}
                          onChange={(e) => setFirmForm({ ...firmForm, address: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border rounded focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-2xs font-bold text-slate-700">Firm Contact Email</label>
                          <input
                            type="email"
                            value={firmForm.email}
                            onChange={(e) => setFirmForm({ ...firmForm, email: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border rounded focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-2xs font-bold text-slate-700">Firm Phone Number</label>
                          <input
                            type="text"
                            value={firmForm.phone}
                            onChange={(e) => setFirmForm({ ...firmForm, phone: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border rounded focus:outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded text-2xs tracking-wider transition-all"
                      >
                        PUBLISH FIRM LISTING
                      </button>
                    </form>
                  </div>

                  {/* Registered Firms List */}
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
                    <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                      <strong className="text-sm font-bold text-slate-900">National Surveying Firms Directory</strong>
                    </div>

                    {/* Responsive Search & Filters Bar */}
                    <div className="flex flex-col gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                        {/* Search Input */}
                        <div className="relative flex-grow">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            value={searchFirm}
                            onChange={(e) => {
                              setSearchFirm(e.target.value);
                              setCurrentPageFirms(1);
                            }}
                            placeholder="Search firm name, registration number..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500 font-medium"
                          />
                        </div>

                        {/* Filter Dropdown */}
                        <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 self-start md:self-auto min-w-[150px]">
                          <span className="text-3xs text-slate-400 font-extrabold uppercase font-mono">City HQ</span>
                          <select
                            value={filterFirmCity}
                            onChange={(e) => {
                              setFilterFirmCity(e.target.value);
                              setCurrentPageFirms(1);
                            }}
                            className="bg-transparent border-0 text-2xs font-bold text-slate-700 focus:outline-none cursor-pointer flex-grow"
                          >
                            <option value="all">All</option>
                            <option value="Blantyre">Blantyre</option>
                            <option value="Lilongwe">Lilongwe</option>
                            <option value="Mzuzu">Mzuzu</option>
                            <option value="Zomba">Zomba</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Desktop View (Table) */}
                    <div className="hidden md:block overflow-x-auto text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b text-slate-400 font-mono text-3xs uppercase">
                            <th className="pb-2">Firm Name</th>
                            <th className="pb-2">Reg No</th>
                            <th className="pb-2">Managing Partner</th>
                            <th className="pb-2">HQ City</th>
                            <th className="pb-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y font-medium text-slate-700">
                          {paginatedFirms.map(f => {
                            const partner = members.find(m => m.id === f.managingPartnerId);
                            return (
                              <tr key={f.id} className="hover:bg-slate-50/50">
                                <td className="py-3 font-bold text-slate-950">{f.firmName}</td>
                                <td className="py-3 font-mono text-slate-500">{f.regNo}</td>
                                <td className="py-3">{partner ? `${partner.firstName} ${partner.lastName}` : 'ID: ' + f.managingPartnerId}</td>
                                <td className="py-3 text-slate-500">{f.city}</td>
                                <td className="py-3">
                                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-3xs border border-emerald-100 font-bold">Licensed</span>
                                </td>
                              </tr>
                            );
                          })}
                          {paginatedFirms.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-slate-400 font-light font-mono text-xs">
                                No active firm listings match filters.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile View (Cards) */}
                    <div className="block md:hidden space-y-3.5">
                      {paginatedFirms.map(f => {
                        const partner = members.find(m => m.id === f.managingPartnerId);
                        return (
                          <div key={f.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 space-y-3.5 text-left">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{f.firmName}</h4>
                                <span className="font-mono text-3xs text-slate-400 mt-0.5 block">{f.regNo}</span>
                              </div>
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-3xs border border-emerald-100 font-bold">Licensed</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-2xs font-medium text-slate-600 border-t border-slate-200/50 pt-2.5">
                              <div>
                                <span className="text-3xs text-slate-400 font-bold block uppercase tracking-wider">Managing Partner</span>
                                <span className="text-slate-800 font-semibold">{partner ? `${partner.firstName} ${partner.lastName}` : 'ID: ' + f.managingPartnerId}</span>
                              </div>
                              <div>
                                <span className="text-3xs text-slate-400 font-bold block uppercase tracking-wider">City HQ</span>
                                <span className="text-slate-800">{f.city}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {paginatedFirms.length === 0 && (
                        <div className="py-8 text-center text-slate-400 font-light text-xs font-mono">
                          No active firm listings match filters.
                        </div>
                      )}
                    </div>

                    {/* Pagination Section */}
                    {renderPagination(
                      activePageFirms,
                      totalPagesFirms,
                      setCurrentPageFirms,
                      filteredFirms.length,
                      ITEMS_PER_PAGE
                    )}
                  </div>
                </div>
              )}

              {/* VIEW: PAYMENTS VERIFICATION QUEUE */}
              {adminTab === 'payments' && (
                <div id="admin-payments" className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Subscription Verification Queue</h3>
                    <p className="text-slate-500 text-xs">Cross-check uploaded bank slips against outstanding financial statements, approve dues, and auto-issue official receipts.</p>
                  </div>

                  {/* Responsive Search & Filters Bar */}
                  <div className="flex flex-col gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                      {/* Search Input */}
                      <div className="relative flex-grow">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={searchPayment}
                          onChange={(e) => {
                            setSearchPayment(e.target.value);
                            setCurrentPagePayments(1);
                          }}
                          placeholder="Search invoice #, member name, payment ref..."
                          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500 font-medium"
                        />
                      </div>

                      {/* Dropdown Filters */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-shrink-0">
                        {/* Verification Status */}
                        <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                          <span className="text-3xs text-slate-400 font-extrabold uppercase font-mono">Status</span>
                          <select
                            value={filterPaymentStatus}
                            onChange={(e) => {
                              setFilterPaymentStatus(e.target.value);
                              setCurrentPagePayments(1);
                            }}
                            className="bg-transparent border-0 text-2xs font-bold text-slate-700 focus:outline-none cursor-pointer flex-grow"
                          >
                            <option value="all">All</option>
                            <option value="Pending">Pending</option>
                            <option value="Verified">Verified</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>

                        {/* Payment Method */}
                        <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                          <span className="text-3xs text-slate-400 font-extrabold uppercase font-mono">Method</span>
                          <select
                            value={filterPaymentMethod}
                            onChange={(e) => {
                              setFilterPaymentMethod(e.target.value);
                              setCurrentPagePayments(1);
                            }}
                            className="bg-transparent border-0 text-2xs font-bold text-slate-700 focus:outline-none cursor-pointer flex-grow"
                          >
                            <option value="all">All Methods</option>
                            <option value="Bank Deposit">Bank Deposit</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Airtel Money">Airtel Money</option>
                            <option value="TNM Mpamba">TNM Mpamba</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop View (Table) */}
                  <div className="hidden md:block overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b text-slate-400 font-mono text-3xs uppercase">
                          <th className="pb-2">Invoice / Member</th>
                          <th className="pb-2">Claimed Amount</th>
                          <th className="pb-2">Payment Details</th>
                          <th className="pb-2">Deposit Slip Path</th>
                          <th className="pb-2">Status</th>
                          <th className="pb-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-medium text-slate-700">
                        {paginatedPayments.map(p => {
                          const i = invoices.find(inv => inv.id === p.invoiceId);
                          const member = i ? members.find(m => m.id === i.memberId) : null;
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/50">
                              <td className="py-3">
                                <strong className="text-slate-900 block font-mono">{i?.invoiceNo}</strong>
                                <span className="text-3xs text-slate-400 block mt-0.5">Member: {member?.firstName} {member?.lastName}</span>
                              </td>
                              <td className="py-3 font-mono text-slate-950">MWK {p.amountPaid.toLocaleString()}</td>
                              <td className="py-3 space-y-0.5 text-3xs text-slate-500">
                                <div>Method: {p.paymentMethod}</div>
                                <div className="font-mono">Ref: {p.referenceNo}</div>
                                <div className="font-mono">Date: {p.paymentDate}</div>
                              </td>
                              <td className="py-3 font-mono text-amber-600 underline">
                                <button 
                                  onClick={() => alert(`Reviewing Deposit Slip Artifact: ${p.depositSlipPath}\nIn full deployment, this renders a scanned PDF/PNG.`)}
                                  className="cursor-pointer hover:text-amber-700 text-left"
                                >
                                  {p.depositSlipPath}
                                </button>
                              </td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded text-3xs font-bold border ${
                                  p.verificationStatus === 'Verified' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : p.verificationStatus === 'Rejected'
                                    ? 'bg-red-50 text-red-700 border-red-100'
                                    : 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse'
                                }`}>{p.verificationStatus}</span>
                              </td>
                              <td className="py-3 text-right space-x-1.5">
                                {p.verificationStatus === 'Pending' && (
                                  <>
                                    <button
                                      onClick={() => handleVerifyPaymentSlip(p.id, 'Verified')}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded text-3xs cursor-pointer transition-colors"
                                    >
                                      Verify Slip
                                    </button>
                                    <button
                                      onClick={() => handleVerifyPaymentSlip(p.id, 'Rejected')}
                                      className="bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-1 rounded text-3xs cursor-pointer transition-colors"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {paginatedPayments.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-slate-400 font-light font-mono text-xs">
                              No payments match selected filter criteria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile View (Cards) */}
                  <div className="block md:hidden space-y-3.5">
                    {paginatedPayments.map(p => {
                      const i = invoices.find(inv => inv.id === p.invoiceId);
                      const member = i ? members.find(m => m.id === i.memberId) : null;
                      return (
                        <div key={p.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 space-y-3 text-left">
                          <div className="flex justify-between items-start">
                            <div>
                              <strong className="text-slate-900 block font-mono text-xs">{i?.invoiceNo}</strong>
                              <span className="text-3xs text-slate-500 font-medium block mt-0.5">Member: {member?.firstName} {member?.lastName}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-3xs font-bold border ${
                              p.verificationStatus === 'Verified' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : p.verificationStatus === 'Rejected'
                                ? 'bg-red-50 text-red-700 border-red-100'
                                : 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse'
                            }`}>{p.verificationStatus}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-2xs font-medium text-slate-600 border-t border-b border-slate-200/50 py-2.5">
                            <div>
                              <span className="text-3xs text-slate-400 font-bold block uppercase tracking-wider">Claimed Amount</span>
                              <span className="text-slate-950 font-extrabold font-mono text-xs">MWK {p.amountPaid.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-3xs text-slate-400 font-bold block uppercase tracking-wider">Method</span>
                              <span className="text-slate-800">{p.paymentMethod}</span>
                            </div>
                            <div>
                              <span className="text-3xs text-slate-400 font-bold block uppercase tracking-wider">Date</span>
                              <span className="text-slate-800 font-mono">{p.paymentDate}</span>
                            </div>
                            <div>
                              <span className="text-3xs text-slate-400 font-bold block uppercase tracking-wider">Reference No</span>
                              <span className="text-slate-800 font-mono truncate block">{p.referenceNo}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-3xs text-slate-400 font-bold block uppercase tracking-wider">Slip Attachment</span>
                              <button
                                onClick={() => alert(`Reviewing Deposit Slip Artifact: ${p.depositSlipPath}`)}
                                className="text-amber-600 underline font-mono text-3xs cursor-pointer truncate block text-left"
                              >
                                {p.depositSlipPath}
                              </button>
                            </div>
                          </div>

                          {p.verificationStatus === 'Pending' && (
                            <div className="flex justify-end space-x-2 pt-1">
                              <button
                                onClick={() => handleVerifyPaymentSlip(p.id, 'Verified')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-2 rounded-lg text-2xs cursor-pointer transition-colors"
                              >
                                Verify Slip
                              </button>
                              <button
                                onClick={() => handleVerifyPaymentSlip(p.id, 'Rejected')}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-2 rounded-lg text-2xs cursor-pointer transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {paginatedPayments.length === 0 && (
                      <div className="py-8 text-center text-slate-400 font-light text-xs font-mono">
                        No payments match selected filter criteria.
                      </div>
                    )}
                  </div>

                  {/* Pagination Section */}
                  {renderPagination(
                    activePagePayments,
                    totalPagesPayments,
                    setCurrentPagePayments,
                    filteredPayments.length,
                    ITEMS_PER_PAGE
                  )}
                </div>
              )}

              {/* VIEW: CPD VERIFICATION QUEUE */}
              {adminTab === 'cpd' && (
                <div id="admin-cpd" className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">CPD Self-Report Audit Review Queue</h3>
                    <p className="text-slate-500 text-xs">Verify external courses, online modules, and research publications self-reported by members for practicing licence eligibility audits.</p>
                  </div>

                  {/* Responsive Search & Filters Bar */}
                  <div className="flex flex-col gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                      {/* Search Input */}
                      <div className="relative flex-grow">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={searchCpd}
                          onChange={(e) => {
                            setSearchCpd(e.target.value);
                            setCurrentPageCPD(1);
                          }}
                          placeholder="Search member name, course title..."
                          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500 font-medium"
                        />
                      </div>

                      {/* Dropdown Filters */}
                      <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 self-start md:self-auto min-w-[150px]">
                        <span className="text-3xs text-slate-400 font-extrabold uppercase font-mono">Audit Status</span>
                        <select
                          value={filterCpdStatus}
                          onChange={(e) => {
                            setFilterCpdStatus(e.target.value);
                            setCurrentPageCPD(1);
                          }}
                          className="bg-transparent border-0 text-2xs font-bold text-slate-700 focus:outline-none cursor-pointer flex-grow"
                        >
                          <option value="all">All</option>
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Desktop View (Table) */}
                  <div className="hidden md:block overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b text-slate-400 font-mono text-3xs uppercase">
                          <th className="pb-2">Member</th>
                          <th className="pb-2">Course Title</th>
                          <th className="pb-2">CPD Points</th>
                          <th className="pb-2">Completion Date</th>
                          <th className="pb-2">Proof File</th>
                          <th className="pb-2">Status</th>
                          <th className="pb-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-medium text-slate-700">
                        {paginatedCpd.map(c => {
                          const member = members.find(m => m.id === c.memberId);
                          return (
                            <tr key={c.id} className="hover:bg-slate-50/50">
                              <td className="py-3">
                                <strong className="text-slate-900 block">{member?.firstName} {member?.lastName}</strong>
                                <span className="font-mono text-3xs text-slate-400 mt-0.5">{member?.memberNo}</span>
                              </td>
                              <td className="py-3 font-bold text-slate-900">{c.title}</td>
                              <td className="py-3 font-mono text-amber-600 font-bold">{c.cpdPoints} pts</td>
                              <td className="py-3 font-mono text-slate-500">{c.eventDate}</td>
                              <td className="py-3 font-mono text-amber-600 underline">
                                <button 
                                  onClick={() => alert(`Reviewing CPD Evidence Certificate: ${c.proofDocument}\nIn full deployment, this renders an academic diploma/transcript PDF.`)}
                                  className="cursor-pointer hover:text-amber-700 text-left"
                                >
                                  {c.proofDocument}
                                </button>
                              </td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded text-3xs font-bold border ${
                                  c.status === 'Approved' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : c.status === 'Rejected'
                                    ? 'bg-red-50 text-red-700 border-red-100'
                                    : 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse'
                                }`}>{c.status}</span>
                              </td>
                              <td className="py-3 text-right space-x-1.5">
                                {c.status === 'Pending' && (
                                  <>
                                    <button
                                      onClick={() => handleVerifyCPD(c.id, 'Approved')}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded text-3xs cursor-pointer transition-colors"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleVerifyCPD(c.id, 'Rejected')}
                                      className="bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-1 rounded text-3xs cursor-pointer transition-colors"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {paginatedCpd.length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-6 text-center text-slate-400 font-light font-mono text-xs">
                              No CPD audit logs match selected criteria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile View (Cards) */}
                  <div className="block md:hidden space-y-3.5">
                    {paginatedCpd.map(c => {
                      const member = members.find(m => m.id === c.memberId);
                      return (
                        <div key={c.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 space-y-3 text-left">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{c.title}</h4>
                              <span className="text-3xs text-slate-500 font-medium block mt-0.5">By: {member?.firstName} {member?.lastName} ({member?.memberNo})</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-3xs font-bold border ${
                              c.status === 'Approved' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : c.status === 'Rejected'
                                ? 'bg-red-50 text-red-700 border-red-100'
                                : 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse'
                            }`}>{c.status}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-2xs font-medium text-slate-600 border-t border-b border-slate-200/50 py-2.5">
                            <div>
                              <span className="text-3xs text-slate-400 font-bold block uppercase tracking-wider">CPD Claimed</span>
                              <span className="text-amber-600 font-extrabold font-mono text-xs">{c.cpdPoints} pts</span>
                            </div>
                            <div>
                              <span className="text-3xs text-slate-400 font-bold block uppercase tracking-wider">Completion Date</span>
                              <span className="text-slate-800 font-mono">{c.eventDate}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-3xs text-slate-400 font-bold block uppercase tracking-wider">Evidence Document</span>
                              <button
                                onClick={() => alert(`Reviewing CPD Evidence Certificate: ${c.proofDocument}`)}
                                className="text-amber-600 underline font-mono text-3xs cursor-pointer truncate block text-left"
                              >
                                {c.proofDocument}
                              </button>
                            </div>
                          </div>

                          {c.status === 'Pending' && (
                            <div className="flex justify-end space-x-2 pt-1">
                              <button
                                onClick={() => handleVerifyCPD(c.id, 'Approved')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-2 rounded-lg text-2xs cursor-pointer transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleVerifyCPD(c.id, 'Rejected')}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-2 rounded-lg text-2xs cursor-pointer transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {paginatedCpd.length === 0 && (
                      <div className="py-8 text-center text-slate-400 font-light text-xs font-mono">
                        No CPD audit logs match selected criteria.
                      </div>
                    )}
                  </div>

                  {/* Pagination Section */}
                  {renderPagination(
                    activePageCPD,
                    totalPagesCpd,
                    setCurrentPageCPD,
                    filteredCpd.length,
                    ITEMS_PER_PAGE
                  )}
                </div>
              )}

              {/* VIEW: EVENTS CMS */}
              {adminTab === 'events' && (
                <div id="admin-events" className="space-y-6">
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                    <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center">
                      <Plus className="h-4.5 w-4.5 text-amber-500 mr-1.5" />
                      <span>Publish CPD Seminar Event</span>
                    </h3>

                    <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="text-2xs font-bold text-slate-700">Workshop Title</label>
                        <input
                          type="text"
                          required
                          value={eventForm.title}
                          onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                          placeholder="e.g. Modern Land Delineation Workshop"
                          className="w-full px-3 py-2 bg-slate-50 border rounded focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-2xs font-bold text-slate-700">Description Summary</label>
                        <textarea
                          rows={3}
                          value={eventForm.description}
                          onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border rounded focus:outline-none"
                        ></textarea>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-2xs font-bold text-slate-700">Event Date / Hour</label>
                          <input
                            type="datetime-local"
                            required
                            value={eventForm.eventDate}
                            onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border rounded focus:outline-none font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-2xs font-bold text-slate-700">Venue Location</label>
                          <input
                            type="text"
                            required
                            value={eventForm.venue}
                            onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                            placeholder="Sunbird Mount Soche, Blantyre"
                            className="w-full px-3 py-2 bg-slate-50 border rounded focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-2xs font-bold text-slate-700">CPD Hours Weight (Points)</label>
                          <input
                            type="number"
                            required
                            value={eventForm.cpdPoints}
                            onChange={(e) => setEventForm({ ...eventForm, cpdPoints: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border rounded focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-2xs font-bold text-slate-700">Registration Fee (MWK)</label>
                          <input
                            type="number"
                            required
                            value={eventForm.registrationFee}
                            onChange={(e) => setEventForm({ ...eventForm, registrationFee: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border rounded focus:outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded text-2xs tracking-wider transition-all"
                      >
                        PUBLISH EVENT TO PORTAL
                      </button>
                    </form>
                  </div>

                  {/* Active Published Events */}
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
                    <strong className="text-sm font-bold text-slate-900">Active Published Seminars</strong>
                    <div className="divide-y text-xs">
                      {events.map(e => (
                        <div key={e.id} className="py-3 flex justify-between items-center">
                          <div>
                            <strong className="text-slate-800 text-sm block">{e.title}</strong>
                            <p className="text-3xs text-slate-400 mt-1 font-mono">Date: {e.eventDate.replace('T', ' ')} | Venue: {e.venue}</p>
                          </div>
                          <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded font-mono">{e.cpdPoints} CPD pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW: CMS WEBPAGE CONTENT */}
              {adminTab === 'cms' && (
                <div id="admin-cms" className="space-y-8">
                  {/* FAQs Form */}
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
                    <h3 className="text-base font-bold text-slate-900">Add FAQ Item</h3>
                    <form onSubmit={handleCreateFaq} className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="text-2xs font-bold text-slate-700">FAQ Question</label>
                        <input
                          type="text"
                          required
                          value={faqForm.question}
                          onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border rounded"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-2xs font-bold text-slate-700">FAQ Answer</label>
                        <textarea
                          rows={3}
                          required
                          value={faqForm.answer}
                          onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border rounded"
                        ></textarea>
                      </div>
                      <button type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded">Save FAQ</button>
                    </form>
                  </div>

                  {/* Publications Form */}
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
                    <h3 className="text-base font-bold text-slate-900">List New Publication / Acts</h3>
                    <form onSubmit={handleCreatePublication} className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-2xs font-bold text-slate-700">Document Title</label>
                          <input
                            type="text"
                            required
                            value={pubForm.title}
                            onChange={(e) => setPubForm({ ...pubForm, title: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border rounded"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-2xs font-bold text-slate-700">Category</label>
                          <select
                            value={pubForm.category}
                            onChange={(e) => setPubForm({ ...pubForm, category: e.target.value as any })}
                            className="w-full px-3 py-2 bg-slate-50 border rounded"
                          >
                            <option value="Act">Act of Parliament</option>
                            <option value="Bylaw">SIM Bylaw / Conduct</option>
                            <option value="Form">Application Form</option>
                            <option value="Report">Annual Report</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-2xs font-bold text-slate-700">Brief Description</label>
                        <input
                          type="text"
                          value={pubForm.description}
                          onChange={(e) => setPubForm({ ...pubForm, description: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border rounded"
                        />
                      </div>
                      <button type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded">Save Publication</button>
                    </form>
                  </div>

                  {/* News CMS Form */}
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
                    <h3 className="text-base font-bold text-slate-900">Publish News Story</h3>
                    <form onSubmit={handleCreateNews} className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-2xs font-bold text-slate-700">Story Title</label>
                          <input
                            type="text"
                            required
                            value={newsForm.title}
                            onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border rounded"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-2xs font-bold text-slate-700">Category Tag</label>
                          <select
                            value={newsForm.category}
                            onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value as any })}
                            className="w-full px-3 py-2 bg-slate-50 border rounded"
                          >
                            <option value="Institute">Institute Affairs</option>
                            <option value="Industry">Industry News</option>
                            <option value="CPD">CPD Announcements</option>
                            <option value="Government">Government Gazettes</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-2xs font-bold text-slate-700">Excerpt / Short Description</label>
                        <input
                          type="text"
                          value={newsForm.excerpt}
                          onChange={(e) => setNewsForm({ ...newsForm, excerpt: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border rounded"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-2xs font-bold text-slate-700">Story Content</label>
                        <textarea
                          rows={4}
                          required
                          value={newsForm.content}
                          onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border rounded"
                        ></textarea>
                      </div>

                      <div className="space-y-1">
                        <label className="text-2xs font-bold text-slate-700">Featured Image URL (Optional)</label>
                        <input
                          type="text"
                          value={newsForm.image}
                          onChange={(e) => setNewsForm({ ...newsForm, image: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border rounded font-mono"
                        />
                      </div>

                      <button type="submit" className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded">Publish Story</button>
                    </form>
                  </div>
                </div>
              )}

              {/* VIEW: AUDIT LOGS */}
              {adminTab === 'audit' && (
                <div id="admin-audit" className="bg-slate-900 text-slate-100 rounded-xl p-6 border border-slate-800 space-y-6 shadow-xl font-mono">
                  <div className="flex items-center space-x-2 pb-4 border-b border-slate-800">
                    <Terminal className="h-5 w-5 text-amber-500 animate-pulse" />
                    <div>
                      <h3 className="text-sm font-extrabold uppercase tracking-widest text-white">Cryptographic Registry Audit Log</h3>
                      <p className="text-[10px] text-slate-500">Read-only immutable historical audit logs recording all portal administrative operations.</p>
                    </div>
                  </div>

                  {/* Terminal Styled Filter Bar */}
                  <div className="flex flex-col sm:flex-row gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-[10px]">
                    {/* Action Filter */}
                    <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 flex-grow">
                      <span className="text-slate-500 uppercase font-bold text-[9px]">&gt; action_type:</span>
                      <select
                        value={filterAuditAction}
                        onChange={(e) => {
                          setFilterAuditAction(e.target.value);
                          setCurrentPageAudit(1);
                        }}
                        className="bg-transparent border-0 text-white font-bold focus:outline-none cursor-pointer flex-grow"
                      >
                        <option value="all" className="bg-slate-900 text-white">ALL_OPERATIONS</option>
                        <option value="APPROVE_MEMBER" className="bg-slate-900 text-white">APPROVE_MEMBER</option>
                        <option value="SUSPEND_MEMBER" className="bg-slate-900 text-white">SUSPEND_MEMBER</option>
                        <option value="ACTIVATE_MEMBER" className="bg-slate-900 text-white">ACTIVATE_MEMBER</option>
                        <option value="VERIFY_PAYMENT" className="bg-slate-900 text-white">VERIFY_PAYMENT</option>
                        <option value="VERIFY_CPD" className="bg-slate-900 text-white">VERIFY_CPD</option>
                        <option value="PUBLISH_EVENT" className="bg-slate-900 text-white">PUBLISH_EVENT</option>
                        <option value="CREATE_FIRM" className="bg-slate-900 text-white">CREATE_FIRM</option>
                        <option value="PUBLISH_STORY" className="bg-slate-900 text-white">PUBLISH_STORY</option>
                      </select>
                    </div>
                  </div>

                  {/* Desktop View (Table) */}
                  <div className="hidden md:block overflow-x-auto text-[10px] max-h-[500px] overflow-y-auto pr-2">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider">
                          <th className="pb-2">Timestamp</th>
                          <th className="pb-2">Trigger Account</th>
                          <th className="pb-2">Action Code</th>
                          <th className="pb-2">Log Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 text-slate-300">
                        {paginatedAuditLogs.map(log => (
                          <tr key={log.id} className="hover:bg-slate-800/30">
                            <td className="py-2.5 text-slate-500 whitespace-nowrap">{log.createdAt}</td>
                            <td className="py-2.5 text-amber-400">{log.userEmail}</td>
                            <td className="py-2.5"><span className="bg-slate-800 text-white px-1.5 py-0.5 rounded font-bold">{log.action}</span></td>
                            <td className="py-2.5 text-slate-400 leading-normal">{log.details}</td>
                          </tr>
                        ))}
                        {paginatedAuditLogs.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-slate-500 font-light italic">
                              No log packets matched search parameters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile View (Cards) */}
                  <div className="block md:hidden space-y-3">
                    {paginatedAuditLogs.map(log => (
                      <div key={log.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2 text-[10px] text-left">
                        <div className="flex justify-between items-start gap-2 border-b border-slate-800/60 pb-2">
                          <span className="text-slate-500">{log.createdAt}</span>
                          <span className="bg-slate-800 text-white px-1.5 py-0.5 rounded font-bold text-[9px]">{log.action}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="text-slate-400 leading-relaxed">{log.details}</div>
                          <div className="text-[9px] text-amber-400/85 pt-1">&gt; Trigger: {log.userEmail}</div>
                        </div>
                      </div>
                    ))}
                    {paginatedAuditLogs.length === 0 && (
                      <div className="py-8 text-center text-slate-500 font-light italic text-[10px]">
                        No log packets matched search parameters.
                      </div>
                    )}
                  </div>

                  {/* Cryptographic pagination */}
                  {renderAuditPagination(
                    activePageAudit,
                    totalPagesAudit,
                    setCurrentPageAudit,
                    filteredAuditLogs.length,
                    AUDIT_ITEMS_PER_PAGE
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* REAL-TIME NOTIFICATION PANEL (SLIDEOVER) */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => setIsNotificationsOpen(false)}
          ></div>

          {/* Panel */}
          <div className="relative w-screen max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-slate-200 animate-slide-in">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Bell className="h-4.5 w-4.5 text-amber-400 animate-pulse" />
                <div className="text-left">
                  <h3 className="font-extrabold text-sm tracking-tight">Real-Time Administrative Alerts</h3>
                  <div className="flex items-center space-x-1 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-[9px] text-slate-400 font-medium">Live sync active</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    loadAllAdminData();
                  }}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all cursor-pointer"
                  title="Force Sync Now"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex gap-1.5 overflow-x-auto">
              {[
                { id: 'all', label: 'All Alerts', count: notifications.length },
                { id: 'registration', label: 'Registrations', count: notifications.filter(n => n.type === 'registration').length },
                { id: 'payment', label: 'Payments', count: notifications.filter(n => n.type === 'payment').length },
                { id: 'renewal', label: 'Renewals', count: notifications.filter(n => n.type === 'renewal').length }
              ].map(pill => (
                <button
                  key={pill.id}
                  onClick={() => setNotificationFilters(pill.id as any)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1 ${
                    notificationFilters === pill.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{pill.label}</span>
                  {pill.count > 0 && (
                    <span className={`h-4 min-w-4 px-1 rounded-full text-[8px] font-bold flex items-center justify-center ${
                      notificationFilters === pill.id ? 'bg-amber-500 text-slate-900' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {pill.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Notifications List */}
            <div className="flex-grow overflow-y-auto p-4 space-y-3">
              {filteredNotifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="bg-emerald-50 text-emerald-600 p-4 rounded-full border border-emerald-100">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-xs">All actions completed!</h4>
                    <p className="text-[10px] text-slate-500 max-w-xs mt-1">There are no pending actions in this alert queue.</p>
                  </div>
                </div>
              ) : (
                filteredNotifications.map(item => (
                  <div 
                    key={item.id} 
                    className={`p-3.5 rounded-xl border transition-all flex flex-col space-y-2.5 text-left ${
                      item.type === 'registration' 
                        ? 'bg-blue-50/40 border-blue-100/70 shadow-2xs' 
                        : item.type === 'payment'
                        ? 'bg-amber-50/40 border-amber-100/70 shadow-2xs'
                        : 'bg-indigo-50/40 border-indigo-100/70 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex space-x-2">
                        {item.type === 'registration' && (
                          <div className="bg-blue-100 text-blue-700 p-1.5 rounded-lg mt-0.5">
                            <Users className="h-3.5 w-3.5" />
                          </div>
                        )}
                        {item.type === 'payment' && (
                          <div className="bg-amber-100 text-amber-700 p-1.5 rounded-lg mt-0.5">
                            <DollarSign className="h-3.5 w-3.5" />
                          </div>
                        )}
                        {item.type === 'renewal' && (
                          <div className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg mt-0.5">
                            <Clock className="h-3.5 w-3.5" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-[11px] leading-tight">{item.title}</h4>
                          <span className="text-[9px] text-slate-400 font-mono block mt-0.5">{item.date}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-600 leading-normal">{item.description}</p>

                    {/* Actions block */}
                    <div className="pt-2 border-t border-slate-200/50 flex justify-end items-center space-x-2">
                      {item.type === 'registration' && (
                        <>
                          <button
                            onClick={() => {
                              setSearchMember(item.metadata.firstName);
                              setAdminTab('members');
                              setIsNotificationsOpen(false);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => {
                              handleApproveMemberStatus(item.rawId, 'Active');
                            }}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                          >
                            <Check className="h-3 w-3 mr-0.5" /> Quick Approve
                          </button>
                        </>
                      )}

                      {item.type === 'payment' && (
                        <>
                          <button
                            onClick={() => {
                              handleVerifyPaymentSlip(item.rawId, 'Rejected');
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => {
                              handleVerifyPaymentSlip(item.rawId, 'Verified');
                            }}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                          >
                            <Check className="h-3 w-3 mr-0.5" /> Verify Deposit
                          </button>
                        </>
                      )}

                      {item.type === 'renewal' && (
                        <button
                          onClick={() => {
                            handleSendReminderNotice(item.rawId);
                          }}
                          disabled={sendingReminderId === item.rawId}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-bold flex items-center space-x-1 disabled:opacity-50 cursor-pointer transition-colors"
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          {sendingReminderId === item.rawId ? 'Transmitting...' : 'Transmit Notice'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer summary */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 font-semibold font-mono tracking-wider">SIM SECRETARIAT • CENTRAL CONTROL</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

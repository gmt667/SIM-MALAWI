/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { 
  User, 
  MemberProfile, 
  SurveyingFirm, 
  Event, 
  CpdAttendance, 
  Licence, 
  Invoice, 
  Payment, 
  AuditLog, 
  FaqItem, 
  NewsItem, 
  PublicationItem 
} from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to file-based persistent DB
const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'sim_db.json');

// Ensure database directory and file exist
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// In-memory representation of database tables
interface Database {
  users: User[];
  memberProfiles: MemberProfile[];
  surveyingFirms: SurveyingFirm[];
  events: Event[];
  cpdAttendance: CpdAttendance[];
  licences: Licence[];
  invoices: Invoice[];
  payments: Payment[];
  auditLogs: AuditLog[];
  faqs: FaqItem[];
  news: NewsItem[];
  publications: PublicationItem[];
  contactMessages: any[];
}

const initialDb: Database = {
  users: [
    { id: 1, email: 'admin@sim.mw', role: 'Admin' },
    { id: 2, email: 'chancy.gondwe@sim.mw', role: 'Member' },
    { id: 3, email: 'beatrice.banda@sim.mw', role: 'Member' },
    { id: 4, email: 'kondwani.phiri@sim.mw', role: 'Member' },
    { id: 5, email: 'ellena.mwanza@sim.mw', role: 'Member' },
  ],
  memberProfiles: [
    {
      id: 1,
      userId: 2,
      memberNo: 'SIM-LS-012',
      firstName: 'Chancy',
      lastName: 'Gondwe',
      phone: '+265 888 123 456',
      chapter: 'Land Surveying',
      grade: 'Professional',
      employer: 'Ministry of Lands, Housing & Urban Development',
      designation: 'Senior Land Surveyor',
      region: 'Central',
      status: 'Active',
      createdAt: '2022-04-12T10:00:00Z',
    },
    {
      id: 2,
      userId: 3,
      memberNo: 'SIM-QS-045',
      firstName: 'Beatrice',
      lastName: 'Banda',
      phone: '+265 999 456 789',
      chapter: 'Quantity Surveying',
      grade: 'Fellow',
      employer: 'Apex Quantity Surveyors Ltd',
      designation: 'Managing Partner',
      region: 'Southern',
      status: 'Active',
      createdAt: '2019-01-15T09:30:00Z',
    },
    {
      id: 3,
      userId: 4,
      memberNo: 'SIM-VEM-089',
      firstName: 'Kondwani',
      lastName: 'Phiri',
      phone: '+265 882 111 222',
      chapter: 'Valuation & Estate Management',
      grade: 'Professional',
      employer: 'Malawi Property Valuers',
      designation: 'Principal Valuer',
      region: 'Southern',
      status: 'Active',
      createdAt: '2023-08-20T14:15:00Z',
    },
    {
      id: 4,
      userId: 5,
      memberNo: 'SIM-LS-190',
      firstName: 'Ellena',
      lastName: 'Mwanza',
      phone: '+265 997 222 333',
      chapter: 'Land Surveying',
      grade: 'Graduate',
      employer: 'Lilongwe Water Board',
      designation: 'Graduate Surveyor',
      region: 'Central',
      status: 'Pending',
      createdAt: '2025-11-01T08:00:00Z',
    },
  ],
  surveyingFirms: [
    {
      id: 1,
      firmName: 'Apex Quantity Surveyors',
      regNo: 'SIM-FIRM-QS-001',
      managingPartnerId: 2, // Beatrice Banda
      address: 'Livingstone Towers, 4th Floor, Glyn Jones Road',
      city: 'Blantyre',
      contactEmail: 'info@apexqs.mw',
      contactPhone: '+265 111 843 900',
      status: 'Active',
      createdAt: '2020-05-18T10:00:00Z',
    },
    {
      id: 2,
      firmName: 'Geomatics & Planning Solutions',
      regNo: 'SIM-FIRM-LS-004',
      managingPartnerId: 1, // Chancy Gondwe
      address: 'Development House, Room 12, Area 3',
      city: 'Lilongwe',
      contactEmail: 'contact@geomatics.mw',
      contactPhone: '+265 111 754 311',
      status: 'Active',
      createdAt: '2023-01-10T11:00:00Z',
    },
  ],
  events: [
    {
      id: 1,
      title: 'SIM Annual General Meeting & CPD Workshop 2026',
      description: 'The annual flagship workshop bringing together all surveying professionals across Malawi. Topic: "Modern GIS Integration and Sustainable Land Administration in Malawi". Includes keynote speeches, paper presentations, and chapter breakaway sessions.',
      eventDate: '2026-07-25T08:30:00',
      venue: 'Sunbird Mount Soche Hotel, Blantyre',
      cpdPoints: 15,
      registrationFee: 85000,
      status: 'Upcoming',
      createdAt: '2026-06-01T10:00:00Z',
    },
    {
      id: 2,
      title: 'Standard Method of Measurement (SMM7) Masterclass',
      description: 'An advanced technical training for Quantity Surveying professionals on the implementation and transition guidelines of SMM7 in public-private procurement frameworks.',
      eventDate: '2026-08-12T09:00:00',
      venue: 'Sunbird Capital Hotel, Lilongwe',
      cpdPoints: 8,
      registrationFee: 50000,
      status: 'Upcoming',
      createdAt: '2026-06-15T09:00:00Z',
    },
    {
      id: 3,
      title: 'Asset Valuation Standards and Malawi Legislative Reforms',
      description: 'A critical update course on the newly gazetted Land Acquisition and Compensation regulations and their impact on physical asset valuations.',
      eventDate: '2026-04-10T09:00:00',
      venue: 'Grand Palace Hotel, Mzuzu',
      cpdPoints: 10,
      registrationFee: 45000,
      status: 'Completed',
      createdAt: '2026-03-01T08:30:00Z',
    },
  ],
  cpdAttendance: [
    {
      id: 1,
      memberId: 1, // Chancy Gondwe
      eventId: 3, // Asset Valuation
      title: 'Asset Valuation Standards and Malawi Legislative Reforms',
      cpdPoints: 10,
      eventDate: '2026-04-10',
      status: 'Approved',
      createdAt: '2026-04-11T12:00:00Z',
    },
    {
      id: 2,
      memberId: 1, // Chancy Gondwe
      title: 'Geospatial Web Mapping Professional Certificate (Coursera)',
      cpdPoints: 12,
      eventDate: '2026-05-14',
      proofDocument: 'coursera_cert_chancy.pdf',
      status: 'Approved',
      createdAt: '2026-05-16T15:30:00Z',
    },
    {
      id: 3,
      memberId: 2, // Beatrice Banda
      eventId: 3,
      title: 'Asset Valuation Standards and Malawi Legislative Reforms',
      cpdPoints: 10,
      eventDate: '2026-04-10',
      status: 'Approved',
      createdAt: '2026-04-11T12:05:00Z',
    },
    {
      id: 4,
      memberId: 3, // Kondwani Phiri
      eventId: 3,
      title: 'Asset Valuation Standards and Malawi Legislative Reforms',
      cpdPoints: 10,
      eventDate: '2026-04-10',
      status: 'Approved',
      createdAt: '2026-04-11T12:10:00Z',
    },
    {
      id: 5,
      memberId: 3, // Kondwani Phiri
      title: 'RICS Regional Real Estate Valuations Webinars',
      cpdPoints: 15,
      eventDate: '2026-06-02',
      proofDocument: 'rics_webinar_cpd_phiri.pdf',
      status: 'Pending',
      createdAt: '2026-06-03T10:00:00Z',
    },
  ],
  licences: [
    {
      id: 1,
      memberId: 1, // Chancy Gondwe
      licenceNo: 'SIM-LIC-LS-2025-014',
      financialYear: '2025/2026',
      dateIssued: '2025-07-01',
      expiryDate: '2026-06-30',
      status: 'Expired',
      qrCodeUrl: 'https://ais-dev-j2xjkmrqmvcrmzntgcaf3v-235490991254.europe-west2.run.app/verify/SIM-LIC-LS-2025-014',
      createdAt: '2025-06-25T12:00:00Z',
    },
    {
      id: 2,
      memberId: 2, // Beatrice Banda
      licenceNo: 'SIM-LIC-QS-2026-002',
      financialYear: '2026/2027',
      dateIssued: '2026-07-01',
      expiryDate: '2027-06-30',
      status: 'Active',
      qrCodeUrl: 'https://ais-dev-j2xjkmrqmvcrmzntgcaf3v-235490991254.europe-west2.run.app/verify/SIM-LIC-QS-2026-002',
      createdAt: '2026-06-20T10:00:00Z',
    },
    {
      id: 3,
      memberId: 3, // Kondwani Phiri
      licenceNo: 'SIM-LIC-VEM-2026-019',
      financialYear: '2026/2027',
      dateIssued: '2026-07-01',
      expiryDate: '2027-06-30',
      status: 'Active',
      qrCodeUrl: 'https://ais-dev-j2xjkmrqmvcrmzntgcaf3v-235490991254.europe-west2.run.app/verify/SIM-LIC-VEM-2026-019',
      createdAt: '2026-06-22T08:30:00Z',
    },
  ],
  invoices: [
    {
      id: 1,
      memberId: 1,
      invoiceNo: 'INV-2026-081',
      description: 'Annual Subscription Fee 2026/2027 - Professional Grade',
      amount: 150000,
      dueDate: '2026-07-31',
      status: 'Unpaid',
      createdAt: '2026-07-01T08:00:00Z',
    },
    {
      id: 2,
      memberId: 2,
      invoiceNo: 'INV-2026-002',
      description: 'Annual Subscription Fee 2026/2027 - Fellow Grade',
      amount: 250000,
      dueDate: '2026-07-31',
      status: 'Paid',
      createdAt: '2026-07-01T08:00:00Z',
    },
    {
      id: 3,
      memberId: 3,
      invoiceNo: 'INV-2026-019',
      description: 'Annual Subscription Fee 2026/2027 - Professional Grade',
      amount: 150000,
      dueDate: '2026-07-31',
      status: 'Paid',
      createdAt: '2026-07-01T08:00:00Z',
    },
    {
      id: 4,
      memberId: 4,
      invoiceNo: 'INV-2026-140',
      description: 'Membership Registration & Application Fee',
      amount: 50000,
      dueDate: '2025-11-15',
      status: 'Unpaid',
      createdAt: '2025-11-01T08:00:00Z',
    },
  ],
  payments: [
    {
      id: 1,
      invoiceId: 2, // Beatrice Banda Paid Fellow Subscription
      amountPaid: 250000,
      paymentDate: '2026-07-03',
      paymentMethod: 'Bank Deposit',
      referenceNo: 'NBM-DEP-9981242',
      depositSlipPath: 'deposit_slip_banda_2026.pdf',
      verificationStatus: 'Verified',
      verifiedBy: 'admin@sim.mw',
      verificationDate: '2026-07-04T10:00:00Z',
      receiptNo: 'SIM-REC-2026-002',
      createdAt: '2026-07-03T14:00:00Z',
    },
    {
      id: 2,
      invoiceId: 3, // Kondwani Phiri Paid Professional Subscription
      amountPaid: 150000,
      paymentDate: '2026-07-05',
      paymentMethod: 'Bank Deposit',
      referenceNo: 'FDH-FT-00124891',
      depositSlipPath: 'deposit_slip_phiri_2026.pdf',
      verificationStatus: 'Verified',
      verifiedBy: 'admin@sim.mw',
      verificationDate: '2026-07-06T09:15:00Z',
      receiptNo: 'SIM-REC-2026-019',
      createdAt: '2026-07-05T11:30:00Z',
    },
    {
      id: 3,
      invoiceId: 4, // Ellena Mwanza Uploaded application slip
      amountPaid: 50000,
      paymentDate: '2025-11-05',
      paymentMethod: 'Airtel Money',
      referenceNo: 'AM-TXN-10948523',
      depositSlipPath: 'airtel_receipt_ellena.png',
      verificationStatus: 'Pending',
      createdAt: '2025-11-05T15:00:00Z',
    },
  ],
  auditLogs: [
    {
      id: 1,
      userId: 1,
      userEmail: 'admin@sim.mw',
      action: 'INIT_SYSTEM',
      details: 'System database successfully seeded with Malawi SIM structural records.',
      ipAddress: '127.0.0.1',
      createdAt: '2026-07-09T04:58:00Z',
    },
    {
      id: 2,
      userId: 1,
      userEmail: 'admin@sim.mw',
      action: 'PAYMENT_VERIFIED',
      details: 'Approved deposit slip for Invoice #INV-2026-002 (Beatrice Banda). Official receipt #SIM-REC-2026-002 issued.',
      ipAddress: '127.0.0.1',
      createdAt: '2026-07-04T10:00:00Z',
    },
    {
      id: 3,
      userId: 1,
      userEmail: 'admin@sim.mw',
      action: 'LICENCE_ISSUED',
      details: 'Practising Licence #SIM-LIC-QS-2026-002 issued to Beatrice Banda for Financial Year 2026/2027.',
      ipAddress: '127.0.0.1',
      createdAt: '2026-07-04T10:05:00Z',
    },
  ],
  faqs: [
    {
      id: 1,
      question: 'What are the chapters of the Surveyors Institute of Malawi?',
      answer: 'SIM is structured into three professional chapters: Land Surveying (for geomaticians, land surveyors, and GIS experts), Quantity Surveying (for building cost consultants, project managers, and estimators), and Valuation and Estate Management (for property valuation professionals, estate managers, and physical asset planners).',
    },
    {
      id: 2,
      question: 'How many CPD hours are required to renew a practising licence?',
      answer: 'According to the SIM regulations, a registered Professional or Fellow member must accumulate a minimum of 20 verified Continuing Professional Development (CPD) hours in the preceding financial year to qualify for a Practising Licence renewal.',
    },
    {
      id: 3,
      question: 'How are subscription and licence fees processed on this portal?',
      answer: 'Invoices are raised automatically at the start of each financial year (July 1st). Members can view invoices in their dashboard, pay via direct bank deposits (to SIM National Bank or FDH Bank accounts) or mobile money (Airtel Money / TNM Mpamba), and upload the electronic receipt or deposit slip. Once Secretariat verifies the payment, an official SIM receipt is issued and the service is activated.',
    },
    {
      id: 4,
      question: 'What is the Assessment of Professional Competence (APC)?',
      answer: 'APC is the structured logging and practical examination process that Graduate members must successfully complete under a registered Mentor to be upgraded to full Professional Membership status.',
    },
  ],
  news: [
    {
      id: 1,
      title: 'SIM Prepares for the 2026 AGM in Blantyre',
      excerpt: 'The Surveyors Institute of Malawi is pleased to announce the 2026 Annual General Meeting scheduled to take place at Sunbird Mount Soche...',
      content: 'The Surveyors Institute of Malawi is pleased to announce the 2026 Annual General Meeting scheduled to take place at Sunbird Mount Soche in Blantyre from July 25th to July 27th, 2026.\n\nThis year\'s theme is "Modern GIS Integration and Sustainable Land Administration in Malawi." The event will host local and regional speakers from ministries, private surveying consultancies, and academic institutions. Members are encouraged to register and attend to earn 15 critical CPD points.',
      date: '2026-06-05',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60',
      category: 'Institute',
    },
    {
      id: 2,
      title: 'New Land Acquisition and Compensation Regulations Gazetted',
      excerpt: 'The Ministry of Lands has officially gazetted revised land valuation and compensation schedules designed to streamline national infrastructure projects...',
      content: 'The Ministry of Lands has officially gazetted revised land valuation and compensation schedules designed to streamline national infrastructure projects. The new standards introduce a structured depreciation grid and mandate that all commercial valuations be completed exclusively by registered VEM members of SIM with active practising certificates. Read the full details under our Publications section.',
      date: '2026-05-18',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=60',
      category: 'Industry',
    },
    {
      id: 3,
      title: 'Mentorship Logbook Digitalization Initiative Launched',
      excerpt: 'In a bid to streamline Graduate APC timelines, SIM has launched a direct online logbook system facilitating collaborative feedback between graduates...',
      content: 'In a bid to streamline Graduate Assessment of Professional Competence (APC) timelines, SIM has launched a direct online logbook system facilitating collaborative feedback between graduates and mentors. Registered mentors can now digitally inspect monthly log entries and certify field assignments directly on the Portal, reducing evaluation cycles from 6 months to 15 days.',
      date: '2026-06-28',
      image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=60',
      category: 'Institute',
    },
  ],
  publications: [
    {
      id: 1,
      title: 'Land Survey Act (2016)',
      category: 'Act',
      description: 'The primary parliamentary act establishing the regulations, board of surveyors, and standards for land and geodetic surveying in Malawi.',
      fileUrl: '#',
      date: '2016-04-10',
    },
    {
      id: 2,
      title: 'SIM Constitution & Professional Code of Conduct',
      category: 'Bylaw',
      description: 'The internal bylaws of the Surveyors Institute of Malawi regulating the disciplinary board, ethics, fee scales, and membership qualifications.',
      fileUrl: '#',
      date: '2021-11-20',
    },
    {
      id: 3,
      title: 'Practising Licence Renewal Form A',
      category: 'Form',
      description: 'The official physical form for practising certificate applications, now integrated and completed digitally on this portal.',
      fileUrl: '#',
      date: '2024-01-15',
    },
  ],
  contactMessages: [
    {
      id: 1,
      name: 'Dr. Matthews Phiri',
      email: 'mphiri@poly.ac.mw',
      subject: 'Collaboration on Geomatics Research Symposium',
      message: 'Greetings Secretariat. The Mzuzu University Geomatics Department would like to host a joint research symposium on GIS mapping in October. We request details regarding SIM endorsement and CPD points attribution.',
      createdAt: '2026-07-08T09:00:00Z',
    },
  ],
};

// Load database from file, or initialize with seed data
function loadDb(): Database {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading file database, returning initial structure', err);
  }
  
  // If not exists or error, save and return initialDb
  saveDb(initialDb);
  return initialDb;
}

function saveDb(db: Database) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to file database', err);
  }
}

// ---------------------- REST ENDPOINTS ----------------------

// 1. PUBLIC CONTACT FORM
app.post('/api/contact', (req, res) => {
  const db = loadDb();
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  const newMessage = {
    id: db.contactMessages.length + 1,
    name,
    email,
    subject,
    message,
    createdAt: new Date().toISOString(),
  };
  db.contactMessages.push(newMessage);
  saveDb(db);
  res.json({ success: true, message: 'Message sent successfully. SIM Secretariat will get back to you.' });
});

app.get('/api/contact', (req, res) => {
  const db = loadDb();
  res.json(db.contactMessages);
});

// 2. AUTHENTICATION & REGISTRATION
app.post('/api/auth/register', (req, res) => {
  const db = loadDb();
  const { email, password, firstName, lastName, phone, chapter, grade, region, employer, designation } = req.body;

  if (!email || !password || !firstName || !lastName || !chapter || !grade || !region) {
    return res.status(400).json({ error: 'Required fields are missing.' });
  }

  // Check if user already exists
  if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'Email already registered.' });
  }

  // Create User
  const userId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
  const newUser: User = {
    id: userId,
    email: email.toLowerCase(),
    role: 'Member',
    createdAt: new Date().toISOString()
  };
  db.users.push(newUser);

  // Create Profile
  const profileId = db.memberProfiles.length > 0 ? Math.max(...db.memberProfiles.map(p => p.id)) + 1 : 1;
  
  // Assign a temporary member number or format one
  const chapterAbbrev = chapter === 'Land Surveying' ? 'LS' : chapter === 'Quantity Surveying' ? 'QS' : 'VEM';
  const paddedId = String(profileId).padStart(3, '0');
  const memberNo = `SIM-${chapterAbbrev}-${paddedId}`;

  const newProfile: MemberProfile = {
    id: profileId,
    userId,
    memberNo,
    firstName,
    lastName,
    phone,
    chapter,
    grade,
    employer,
    designation,
    region,
    status: 'Pending', // Pending admin approval
    createdAt: new Date().toISOString()
  };
  db.memberProfiles.push(newProfile);

  // Auto-generate invoice for membership fee
  const invoiceId = db.invoices.length > 0 ? Math.max(...db.invoices.map(i => i.id)) + 1 : 1;
  const regFee = grade === 'Student' ? 10000 : grade === 'Graduate' ? 30000 : grade === 'Fellow' ? 250000 : 150000;
  
  const newInvoice: Invoice = {
    id: invoiceId,
    memberId: profileId,
    invoiceNo: `INV-2026-${String(invoiceId).padStart(3, '0')}`,
    description: `Membership Registration & Annual Subscription Fee (${grade} Grade)`,
    amount: regFee,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days due
    status: 'Unpaid',
    createdAt: new Date().toISOString()
  };
  db.invoices.push(newInvoice);

  // Create audit log
  const auditId = db.auditLogs.length > 0 ? Math.max(...db.auditLogs.map(a => a.id)) + 1 : 1;
  db.auditLogs.push({
    id: auditId,
    userId,
    userEmail: email.toLowerCase(),
    action: 'REGISTER_MEMBER',
    details: `Member registered: ${firstName} ${lastName} (${chapter} - ${grade}). Generated invoice ${newInvoice.invoiceNo}.`,
    createdAt: new Date().toISOString()
  });

  saveDb(db);

  res.json({
    success: true,
    user: newUser,
    profile: newProfile,
    invoice: newInvoice,
    message: 'Registration successful! Your profile is pending verification. Please pay the invoice to activate your membership.'
  });
});

app.post('/api/auth/login', (req, res) => {
  const db = loadDb();
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  // Check for admin credentials explicitly
  const isEmailAdmin = email.toLowerCase() === 'admin' || email.toLowerCase() === 'admin@sim.mw';
  const isPasswordAdmin = password === 'admin123' || password === 'admin';
  if (isEmailAdmin && isPasswordAdmin) {
    return res.json({
      success: true,
      user: { id: 1, email: 'admin@sim.mw', role: 'Admin' },
      profile: null,
      message: 'Logged in successfully as Administrator.'
    });
  }

  // Find user
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  // In this demo environment, we allow any password matching the username/seed system to keep things seamless.
  // In real life, bcrypt.compare is used.
  
  const profile = db.memberProfiles.find(p => p.userId === user.id);

  res.json({
    success: true,
    user: { id: user.id, email: user.email, role: user.role },
    profile: profile || null,
    message: 'Logged in successfully.'
  });
});

// 3. MEMBER PROFILES & DIRECTORY
app.get('/api/members', (req, res) => {
  const db = loadDb();
  const { activeOnly, chapter } = req.query;

  let list = db.memberProfiles;

  if (activeOnly === 'true') {
    list = list.filter(p => p.status === 'Active');
  }
  if (chapter) {
    list = list.filter(p => p.chapter === chapter);
  }

  res.json(list);
});

// GET users endpoint for admin use
app.get('/api/users', (req, res) => {
  const db = loadDb();
  res.json(db.users);
});

app.get('/api/members/:id', (req, res) => {
  const db = loadDb();
  const profile = db.memberProfiles.find(p => p.id === parseInt(req.params.id));
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  res.json(profile);
});

app.put('/api/members/:id', (req, res) => {
  const db = loadDb();
  const idx = db.memberProfiles.findIndex(p => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Profile not found' });

  const current = db.memberProfiles[idx];
  db.memberProfiles[idx] = {
    ...current,
    ...req.body,
    id: current.id, // preserve ID
    userId: current.userId, // preserve user link
    status: current.status, // preserve status (admin handles status changes)
    memberNo: current.memberNo, // preserve registration number
  };

  saveDb(db);
  res.json({ success: true, profile: db.memberProfiles[idx] });
});

// Admin change member status (Approve, Suspend, Lapse)
app.put('/api/members/:id/status', (req, res) => {
  const db = loadDb();
  const { status, adminEmail, adminUserId } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });

  const idx = db.memberProfiles.findIndex(p => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Member not found' });

  const profile = db.memberProfiles[idx];
  profile.status = status;

  // Audit log
  const auditId = db.auditLogs.length > 0 ? Math.max(...db.auditLogs.map(a => a.id)) + 1 : 1;
  db.auditLogs.push({
    id: auditId,
    userId: adminUserId || 1,
    userEmail: adminEmail || 'admin@sim.mw',
    action: 'MEMBER_STATUS_CHANGE',
    details: `Updated Member ${profile.firstName} ${profile.lastName} (${profile.memberNo || 'No Number'}) status to: ${status}`,
    createdAt: new Date().toISOString()
  });

  saveDb(db);
  res.json({ success: true, profile });
});

// 4. FIRMS REGISTER
app.get('/api/firms', (req, res) => {
  const db = loadDb();
  res.json(db.surveyingFirms);
});

app.post('/api/firms', (req, res) => {
  const db = loadDb();
  const { firmName, regNo, managingPartnerId, address, city, contactEmail, contactPhone } = req.body;

  if (!firmName || !regNo || !managingPartnerId) {
    return res.status(400).json({ error: 'Firm name, registration number, and managing partner are required.' });
  }

  const id = db.surveyingFirms.length > 0 ? Math.max(...db.surveyingFirms.map(f => f.id)) + 1 : 1;
  const newFirm: SurveyingFirm = {
    id,
    firmName,
    regNo,
    managingPartnerId: parseInt(managingPartnerId),
    address,
    city,
    contactEmail,
    contactPhone,
    status: 'Active',
    createdAt: new Date().toISOString()
  };

  db.surveyingFirms.push(newFirm);
  saveDb(db);
  res.json({ success: true, firm: newFirm });
});

// 5. INVOICES & PAYMENTS
app.get('/api/invoices', (req, res) => {
  const db = loadDb();
  const { memberId } = req.query;
  
  let list = db.invoices;
  if (memberId) {
    list = list.filter(i => i.memberId === parseInt(memberId as string));
  }
  res.json(list);
});

// Submit payment slip (Member)
app.post('/api/payments/upload-slip', (req, res) => {
  const db = loadDb();
  const { invoiceId, amountPaid, paymentMethod, referenceNo, depositSlipName } = req.body;

  if (!invoiceId || !amountPaid || !paymentMethod || !referenceNo) {
    return res.status(400).json({ error: 'Required fields are missing.' });
  }

  // Verify invoice exists and update invoice status to pending or keep it unpaid
  const invoice = db.invoices.find(i => i.id === parseInt(invoiceId));
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  // Create payment record
  const id = db.payments.length > 0 ? Math.max(...db.payments.map(p => p.id)) + 1 : 1;
  const newPayment: Payment = {
    id,
    invoiceId: parseInt(invoiceId),
    amountPaid: parseFloat(amountPaid),
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod,
    referenceNo,
    depositSlipPath: depositSlipName || 'uploaded_slip.pdf',
    verificationStatus: 'Pending',
    createdAt: new Date().toISOString()
  };

  // Remove existing pending payments for this invoice to prevent double pending records
  db.payments = db.payments.filter(p => !(p.invoiceId === parseInt(invoiceId) && p.verificationStatus === 'Pending'));

  db.payments.push(newPayment);
  saveDb(db);

  res.json({ success: true, payment: newPayment, message: 'Payment receipt uploaded. Secretariat will verify shortly.' });
});

// Verify payment slip (Admin)
app.post('/api/payments/verify/:id', (req, res) => {
  const db = loadDb();
  const { status, adminEmail, adminUserId } = req.body; // 'Verified' or 'Rejected'
  if (!status) return res.status(400).json({ error: 'Status is required.' });

  const paymentIdx = db.payments.findIndex(p => p.id === parseInt(req.params.id));
  if (paymentIdx === -1) return res.status(404).json({ error: 'Payment record not found' });

  const payment = db.payments[paymentIdx];
  payment.verificationStatus = status;
  payment.verifiedBy = adminEmail || 'admin@sim.mw';
  payment.verificationDate = new Date().toISOString();

  // If approved, mark invoice as paid, generate receipt number, activate member profile if pending
  if (status === 'Verified') {
    payment.receiptNo = `SIM-REC-2026-${String(payment.id).padStart(3, '0')}`;

    const invoice = db.invoices.find(i => i.id === payment.invoiceId);
    if (invoice) {
      invoice.status = 'Paid';

      // Activate member profile if this was their subscription and their status was Pending
      const profile = db.memberProfiles.find(p => p.id === invoice.memberId);
      if (profile && profile.status === 'Pending') {
        profile.status = 'Active';
      }
    }
  } else {
    // If rejected, keep invoice unpaid
    const invoice = db.invoices.find(i => i.id === payment.invoiceId);
    if (invoice) {
      invoice.status = 'Unpaid';
    }
  }

  // Audit Log
  const auditId = db.auditLogs.length > 0 ? Math.max(...db.auditLogs.map(a => a.id)) + 1 : 1;
  db.auditLogs.push({
    id: auditId,
    userId: adminUserId || 1,
    userEmail: adminEmail || 'admin@sim.mw',
    action: `PAYMENT_${status.toUpperCase()}`,
    details: `Payment verification completed for Invoice ID ${payment.invoiceId}. Result: ${status}. Reference: ${payment.referenceNo}`,
    createdAt: new Date().toISOString()
  });

  saveDb(db);
  res.json({ success: true, payment, message: `Payment verified as: ${status}` });
});

app.get('/api/payments', (req, res) => {
  const db = loadDb();
  res.json(db.payments);
});

// 6. EVENTS & CPD TRACKER
app.get('/api/events', (req, res) => {
  const db = loadDb();
  res.json(db.events);
});

app.post('/api/events', (req, res) => {
  const db = loadDb();
  const { title, description, eventDate, venue, cpdPoints, registrationFee } = req.body;

  if (!title || !eventDate || !venue || cpdPoints === undefined) {
    return res.status(400).json({ error: 'Title, Date, Venue, and CPD Points are required.' });
  }

  const id = db.events.length > 0 ? Math.max(...db.events.map(e => e.id)) + 1 : 1;
  const newEvent: Event = {
    id,
    title,
    description: description || '',
    eventDate,
    venue,
    cpdPoints: parseInt(cpdPoints),
    registrationFee: parseFloat(registrationFee || 0),
    status: 'Upcoming',
    createdAt: new Date().toISOString()
  };

  db.events.push(newEvent);
  saveDb(db);
  res.json({ success: true, event: newEvent });
});

// Register and register attendance for an event (automatic CPD assignment)
app.post('/api/events/:id/register', (req, res) => {
  const db = loadDb();
  const { memberId } = req.body;

  if (!memberId) return res.status(400).json({ error: 'Member ID is required.' });

  const event = db.events.find(e => e.id === parseInt(req.params.id));
  if (!event) return res.status(404).json({ error: 'Event not found' });

  // Generate an invoice for event registration fee if there is one
  if (event.registrationFee > 0) {
    const invoiceId = db.invoices.length > 0 ? Math.max(...db.invoices.map(i => i.id)) + 1 : 1;
    const newInvoice: Invoice = {
      id: invoiceId,
      memberId: parseInt(memberId),
      invoiceNo: `INV-EVT-${String(invoiceId).padStart(3, '0')}`,
      description: `Registration Fee for: ${event.title}`,
      amount: event.registrationFee,
      dueDate: event.eventDate.split('T')[0],
      status: 'Unpaid',
      createdAt: new Date().toISOString()
    };
    db.invoices.push(newInvoice);
  }

  // Create CPD Attendance as "Approved" (representing successful attendance / registration validation)
  const cpdId = db.cpdAttendance.length > 0 ? Math.max(...db.cpdAttendance.map(c => c.id)) + 1 : 1;
  const newAttendance: CpdAttendance = {
    id: cpdId,
    memberId: parseInt(memberId),
    eventId: event.id,
    title: event.title,
    cpdPoints: event.cpdPoints,
    eventDate: event.eventDate.split('T')[0],
    status: 'Approved', // Auto-approved for official SIM events
    createdAt: new Date().toISOString()
  };

  db.cpdAttendance.push(newAttendance);
  saveDb(db);

  res.json({ success: true, attendance: newAttendance, message: 'Registered for event successfully. CPD points will reflect on completion.' });
});

// Self-Report CPD Event (Member)
app.post('/api/cpd/self-report', (req, res) => {
  const db = loadDb();
  const { memberId, title, cpdPoints, eventDate, proofDocumentName } = req.body;

  if (!memberId || !title || !cpdPoints || !eventDate) {
    return res.status(400).json({ error: 'Required CPD fields are missing.' });
  }

  const id = db.cpdAttendance.length > 0 ? Math.max(...db.cpdAttendance.map(c => c.id)) + 1 : 1;
  const newCpd: CpdAttendance = {
    id,
    memberId: parseInt(memberId),
    title,
    cpdPoints: parseInt(cpdPoints),
    eventDate,
    proofDocument: proofDocumentName || 'cpd_proof.pdf',
    status: 'Pending', // Needs Admin Verification
    createdAt: new Date().toISOString()
  };

  db.cpdAttendance.push(newCpd);
  saveDb(db);
  res.json({ success: true, cpd: newCpd, message: 'Self-reported CPD submitted. Status is currently Pending.' });
});

// Admin approves CPD
app.post('/api/cpd/approve/:id', (req, res) => {
  const db = loadDb();
  const { status, adminEmail, adminUserId } = req.body; // 'Approved' or 'Rejected'
  if (!status) return res.status(400).json({ error: 'Status is required' });

  const cpdIdx = db.cpdAttendance.findIndex(c => c.id === parseInt(req.params.id));
  if (cpdIdx === -1) return res.status(404).json({ error: 'CPD attendance record not found' });

  const cpd = db.cpdAttendance[cpdIdx];
  cpd.status = status;

  // Audit log
  const auditId = db.auditLogs.length > 0 ? Math.max(...db.auditLogs.map(a => a.id)) + 1 : 1;
  db.auditLogs.push({
    id: auditId,
    userId: adminUserId || 1,
    userEmail: adminEmail || 'admin@sim.mw',
    action: `CPD_VERIFY_${status.toUpperCase()}`,
    details: `CPD submission for Member ID ${cpd.memberId} titled "${cpd.title}" is verified as ${status}`,
    createdAt: new Date().toISOString()
  });

  saveDb(db);
  res.json({ success: true, cpd, message: `CPD verification completed: ${status}` });
});

app.get('/api/cpd', (req, res) => {
  const db = loadDb();
  res.json(db.cpdAttendance);
});

// 7. PRACTISING LICENCES MODULE
app.get('/api/licences', (req, res) => {
  const db = loadDb();
  res.json(db.licences);
});

// Apply for practicing license
app.post('/api/licences/apply', (req, res) => {
  const db = loadDb();
  const { memberId, financialYear } = req.body;

  if (!memberId || !financialYear) {
    return res.status(400).json({ error: 'Member ID and Financial Year are required.' });
  }

  const profile = db.memberProfiles.find(p => p.id === parseInt(memberId));
  if (!profile) return res.status(404).json({ error: 'Member profile not found.' });

  // Safety checklist:
  // 1. Check if member is Active
  if (profile.status !== 'Active') {
    return res.status(400).json({ error: 'Membership status must be Active. Please pay subscription invoices first.' });
  }

  // 2. Check CPD points (Need minimum 20 points!)
  const approvedCpdPoints = db.cpdAttendance
    .filter(c => c.memberId === parseInt(memberId) && c.status === 'Approved')
    .reduce((sum, c) => sum + c.cpdPoints, 0);

  if (approvedCpdPoints < 20) {
    return res.status(400).json({ 
      error: `CPD threshold audit failed! You currently have ${approvedCpdPoints} approved CPD points. SIM licensing guidelines mandate a minimum of 20 points accumulated in the previous session.` 
    });
  }

  // Check if they already have an active licence for this financial year
  const existing = db.licences.find(l => l.memberId === parseInt(memberId) && l.financialYear === financialYear && l.status === 'Active');
  if (existing) {
    return res.status(400).json({ error: `You already have an active practising licence for the ${financialYear} financial year.` });
  }

  // Create licence
  const id = db.licences.length > 0 ? Math.max(...db.licences.map(l => l.id)) + 1 : 1;
  const chapterAbbrev = profile.chapter === 'Land Surveying' ? 'LS' : profile.chapter === 'Quantity Surveying' ? 'QS' : 'VEM';
  const licenceNo = `SIM-LIC-${chapterAbbrev}-2026-${String(id).padStart(3, '0')}`;

  const newLicence: Licence = {
    id,
    memberId: parseInt(memberId),
    licenceNo,
    financialYear,
    dateIssued: new Date().toISOString().split('T')[0],
    expiryDate: '2027-06-30', // standard cycle end
    status: 'Active',
    qrCodeUrl: `https://ais-dev-j2xjkmrqmvcrmzntgcaf3v-235490991254.europe-west2.run.app/verify/${licenceNo}`,
    createdAt: new Date().toISOString()
  };

  db.licences.push(newLicence);

  // Generate an audit log
  const auditId = db.auditLogs.length > 0 ? Math.max(...db.auditLogs.map(a => a.id)) + 1 : 1;
  db.auditLogs.push({
    id: auditId,
    userId: profile.userId,
    userEmail: profile.firstName.toLowerCase() + '@sim.mw',
    action: 'LICENCE_ISSUED',
    details: `Practising Licence issued successfully. Number: ${licenceNo}. CPD Audit verified: ${approvedCpdPoints} points.`,
    createdAt: new Date().toISOString()
  });

  saveDb(db);

  res.json({ 
    success: true, 
    licence: newLicence, 
    message: `Practising Licence successfully issued! Your certificate number is: ${licenceNo}` 
  });
});

// Verification Endpoint (Used by public search or QR scans)
app.get('/api/verify-certificate/:licenceNo', (req, res) => {
  const db = loadDb();
  const searchKey = req.params.licenceNo.toUpperCase();

  // 1. Try finding in licences
  const licence = db.licences.find(l => l.licenceNo.toUpperCase() === searchKey);
  if (licence) {
    const profile = db.memberProfiles.find(p => p.id === licence.memberId);
    return res.json({
      verified: true,
      licence,
      profile
    });
  }

  // 2. Try finding in CPD attendance (SIM-CPD-ID)
  if (searchKey.startsWith('SIM-CPD-')) {
    const cpdIdStr = searchKey.replace('SIM-CPD-', '');
    const cpdId = parseInt(cpdIdStr, 10);
    const attendance = db.cpdAttendance.find(a => a.id === cpdId);
    if (attendance) {
      const profile = db.memberProfiles.find(p => p.id === attendance.memberId);
      return res.json({
        verified: true,
        licence: {
          id: attendance.id,
          memberId: attendance.memberId,
          licenceNo: searchKey,
          financialYear: 'CPD Recognition',
          dateIssued: attendance.eventDate,
          expiryDate: 'N/A (Lifetime Certificate)',
          status: 'Active',
          qrCodeUrl: '',
          createdAt: attendance.createdAt
        },
        profile: profile || {
          id: attendance.memberId,
          userId: 0,
          memberNo: 'SIM-CPD-HOLDER',
          firstName: 'Registered',
          lastName: 'Professional',
          phone: '',
          chapter: attendance.title,
          grade: 'Professional',
          status: 'Active',
          createdAt: attendance.createdAt
        }
      });
    }
  }

  // 3. Try finding in memberProfiles by memberNo (Membership Certificate)
  const profileByNo = db.memberProfiles.find(p => p.memberNo && p.memberNo.toUpperCase() === searchKey);
  if (profileByNo) {
    return res.json({
      verified: true,
      licence: {
        id: profileByNo.id,
        memberId: profileByNo.id,
        licenceNo: profileByNo.memberNo,
        financialYear: 'SIM Membership Registry',
        dateIssued: profileByNo.createdAt ? profileByNo.createdAt.split('T')[0] : '2026-07-01',
        expiryDate: 'Continuous Membership',
        status: profileByNo.status === 'Active' ? 'Active' : 'Expired',
        qrCodeUrl: '',
        createdAt: profileByNo.createdAt
      },
      profile: profileByNo
    });
  }

  return res.status(404).json({ verified: false, error: 'Certificate / Registry Serial not registered in SIM national ledger.' });
});

// Licence Renewal Reminder Notice Endpoint
app.post('/api/licences/remind/:id', (req, res) => {
  const db = loadDb();
  const licenceId = parseInt(req.params.id, 10);
  const licence = db.licences.find(l => l.id === licenceId);
  if (!licence) {
    return res.status(404).json({ error: 'Licence not registered in database.' });
  }
  const profile = db.memberProfiles.find(p => p.id === licence.memberId);
  const name = profile ? `${profile.firstName} ${profile.lastName}` : 'Licensed Surveyor';

  // Log automated renewal notice transmission event
  const auditId = db.auditLogs.length > 0 ? Math.max(...db.auditLogs.map(a => a.id)) + 1 : 1;
  db.auditLogs.push({
    id: auditId,
    userId: 1,
    userEmail: 'admin@sim.mw',
    action: 'RENEWAL_NOTICE_SENT',
    details: `Transmitted digital practising licence renewal reminder notice to ${name} for Licence Serial: ${licence.licenceNo}. Expiry Date: ${licence.expiryDate}.`,
    createdAt: new Date().toISOString()
  });

  saveDb(db);
  res.json({ success: true, message: `Digital renewal reminder notice successfully transmitted to ${name} (${profile?.phone || 'registered contact email'}).` });
});

// 8. CMS ENDPOINTS
app.get('/api/news', (req, res) => {
  const db = loadDb();
  res.json(db.news);
});

app.post('/api/news', (req, res) => {
  const db = loadDb();
  const { title, excerpt, content, category, image } = req.body;
  if (!title || !content || !category) {
    return res.status(400).json({ error: 'Title, content, and category are required.' });
  }
  const id = db.news.length > 0 ? Math.max(...db.news.map(n => n.id)) + 1 : 1;
  const newNews: NewsItem = {
    id,
    title,
    excerpt: excerpt || content.substring(0, 150) + '...',
    content,
    date: new Date().toISOString().split('T')[0],
    image: image || 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=60',
    category
  };
  db.news.push(newNews);
  saveDb(db);
  res.json({ success: true, news: newNews });
});

app.get('/api/publications', (req, res) => {
  const db = loadDb();
  res.json(db.publications);
});

app.post('/api/publications', (req, res) => {
  const db = loadDb();
  const { title, category, description } = req.body;
  if (!title || !category) {
    return res.status(400).json({ error: 'Title and category are required.' });
  }
  const id = db.publications.length > 0 ? Math.max(...db.publications.map(p => p.id)) + 1 : 1;
  const newPub: PublicationItem = {
    id,
    title,
    category,
    description: description || '',
    fileUrl: '#',
    date: new Date().toISOString().split('T')[0]
  };
  db.publications.push(newPub);
  saveDb(db);
  res.json({ success: true, publication: newPub });
});

app.get('/api/faqs', (req, res) => {
  const db = loadDb();
  res.json(db.faqs);
});

app.post('/api/faqs', (req, res) => {
  const db = loadDb();
  const { question, answer } = req.body;
  if (!question || !answer) return res.status(400).json({ error: 'Question and answer are required' });
  const id = db.faqs.length > 0 ? Math.max(...db.faqs.map(f => f.id)) + 1 : 1;
  const newFaq: FaqItem = { id, question, answer };
  db.faqs.push(newFaq);
  saveDb(db);
  res.json({ success: true, faq: newFaq });
});

app.get('/api/audit-logs', (req, res) => {
  const db = loadDb();
  res.json(db.auditLogs.sort((a, b) => b.id - a.id));
});

// Vite Middleware & Client SPA Delivery Setup
const isProd = process.env.NODE_ENV === 'production';

async function setupClient() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

setupClient();

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: number;
  email: string;
  role: 'Admin' | 'Member';
  createdAt?: string;
}

export type ChapterType = 'Land Surveying' | 'Quantity Surveying' | 'Valuation & Estate Management';
export type GradeType = 'Fellow' | 'Professional' | 'Associate' | 'Graduate' | 'Technician' | 'Student';
export type MemberStatusType = 'Pending' | 'Active' | 'Suspended' | 'Lapsed';
export type RegionType = 'Southern' | 'Central' | 'Northern';

export interface MemberProfile {
  id: number;
  userId: number;
  memberNo?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  chapter: ChapterType;
  grade: GradeType;
  employer?: string;
  designation?: string;
  region: RegionType;
  status: MemberStatusType;
  profileImage?: string;
  createdAt: string;
}

export interface SurveyingFirm {
  id: number;
  firmName: string;
  regNo: string;
  managingPartnerId: number;
  address?: string;
  city?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: 'Active' | 'Suspended' | 'Lapsed';
  createdAt: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  eventDate: string;
  venue: string;
  cpdPoints: number;
  registrationFee: number;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export interface CpdAttendance {
  id: number;
  memberId: number;
  eventId?: number;
  title: string;
  cpdPoints: number;
  eventDate: string;
  proofDocument?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

export interface Licence {
  id: number;
  memberId: number;
  licenceNo: string;
  financialYear: string;
  dateIssued: string;
  expiryDate: string;
  status: 'Active' | 'Expired' | 'Revoked';
  qrCodeUrl: string;
  createdAt: string;
}

export interface Invoice {
  id: number;
  memberId: number;
  invoiceNo: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'Unpaid' | 'Paid' | 'Overdue';
  createdAt: string;
}

export interface Payment {
  id: number;
  invoiceId: number;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: string; // e.g., "Bank Deposit", "Airtel Money", "TNM Mpamba"
  referenceNo: string;
  depositSlipPath: string;
  verificationStatus: 'Pending' | 'Verified' | 'Rejected';
  verifiedBy?: string;
  verificationDate?: string;
  receiptNo?: string;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  userId: number;
  userEmail: string;
  action: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

export interface NewsItem {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  image: string;
  category: 'Institute' | 'Industry' | 'CPD' | 'Government';
}

export interface PublicationItem {
  id: number;
  title: string;
  category: 'Act' | 'Bylaw' | 'Form' | 'Report';
  description: string;
  fileUrl: string;
  date: string;
}

import React, { useState } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle, 
  Users, 
  ShieldCheck, 
  BookOpen, 
  PhoneCall, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { FaqItem } from '../types';

interface FAQAccordionProps {
  apiFaqs?: FaqItem[];
  onNavigateTab?: (tab: 'home' | 'about' | 'registrar' | 'publications' | 'downloads' | 'contact' | 'faqs' | 'verify') => void;
}

interface StaticFaq {
  id: string;
  question: string;
  answer: string;
  category: 'membership' | 'licensing' | 'cpd';
  tags: string[];
}

export default function FAQAccordion({ apiFaqs = [], onNavigateTab }: FAQAccordionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'membership' | 'licensing' | 'cpd'>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  // High-quality authoritative curated FAQs covering key regulatory self-service questions
  const staticFaqs: StaticFaq[] = [
    {
      id: 'faq-m-001',
      category: 'membership',
      question: 'How do I become a registered member of the Surveyors Institute of Malawi (SIM)?',
      answer: 'To become an official member, you must hold a recognized academic degree in Land Surveying, Quantity Surveying, or Valuation & Estate Management. You must submit a completed Form A (Individual Member Registration), accompanied by certified copies of your certificates, professional references from two active Fellows or Professional Members, and the prescribed application fee. The Education & Membership Committee will review your submission quarterly.',
      tags: ['registration', 'member', 'apply', 'form a']
    },
    {
      id: 'faq-m-002',
      category: 'membership',
      question: 'What are the official membership grades and their prerequisites?',
      answer: 'SIM maintains four active professional grades: \n\n1. Student: For individuals currently enrolled in an accredited surveying degree program.\n2. Graduate: For recent university graduates undergoing supervised practical training.\n3. Professional: For experienced surveyors who have successfully passed the Assessment of Professional Competence (APC).\n4. Fellow: A prestigious distinction awarded to professional members with over 10 years of exemplary contribution, active service, and clean disciplinary record.',
      tags: ['grades', 'student', 'graduate', 'professional', 'fellow']
    },
    {
      id: 'faq-m-003',
      category: 'membership',
      question: 'Can foreign-qualified surveyors practice in Malawi?',
      answer: 'Yes, but they must first apply for registration under the temporary reciprocity or foreign practitioner clauses. They are required to submit proof of active registration with their home national board, undergo a technical and local land law assessment by the SIM Council, and partner with a locally licensed surveying firm of active standing.',
      tags: ['foreign', 'qualification', 'reciprocity', 'overseas']
    },
    {
      id: 'faq-l-001',
      category: 'licensing',
      question: 'What is an Annual Practising Certificate (APC) and who is required to hold one?',
      answer: 'An Annual Practising Certificate (APC) is the legal instrument that authorizes a registered surveyor to practice publicly, sign survey maps, submit valuations, or approve bills of quantities in Malawi. Under local statutes, practicing or offering public surveying services without a valid, active APC is a professional and legal offense subject to disciplinary action and prosecution.',
      tags: ['apc', 'licence', 'practising', 'legal', 'authority']
    },
    {
      id: 'faq-l-002',
      category: 'licensing',
      question: 'What are the deadlines and requirements for APC renewal?',
      answer: 'All practicing certificates expire on December 31st annually. To renew your license, you must submit a completed Renewal Form before the deadline, accompanied by your CPD Log Sheet showing at least 20 hours of approved educational credits, proof of professional indemnity insurance cover (for private firms), and the corresponding renewal fee.',
      tags: ['renewal', 'deadline', 'fees', 'insurance']
    },
    {
      id: 'faq-l-003',
      category: 'licensing',
      question: 'How can a corporate surveying firm obtain an institutional practice license?',
      answer: 'Firms must submit Form B (Corporate Licensing) to the SIM Secretariat. To qualify, the firm must prove that at least one resident executive director is an active registered Professional Member of SIM in good standing holding an individual APC. The firm must also maintain a valid professional indemnity policy adequate to their scale of operations.',
      tags: ['firm', 'corporate', 'company', 'form b', 'indemnity']
    },
    {
      id: 'faq-c-001',
      category: 'cpd',
      question: 'What are the mandatory Continuing Professional Development (CPD) requirements?',
      answer: 'All registered Professional Members and Fellows must complete a minimum of 20 CPD credit hours per calendar year. CPD hours ensure that surveyors stay up-to-date with technical advancements, spatial mapping updates, building cost trends, professional ethics, and legislative amendments.',
      tags: ['cpd', 'hours', 'credits', 'requirement']
    },
    {
      id: 'faq-c-002',
      category: 'cpd',
      question: 'What activities qualify for Structured and Unstructured CPD hours?',
      answer: 'Credits are categorized to balance active learning and peer support:\n\n• Structured (Category A - Min 12 hours): Attending official SIM seminars, symposiums, or conferences, publishing research papers in peer-reviewed journals, or completing approved postgraduate coursework.\n• Unstructured (Category B - Max 8 hours): Reading professional journals, mentoring graduate trainees in the field, or serving on SIM committees.',
      tags: ['activities', 'structured', 'unstructured', 'credits', 'seminar']
    },
    {
      id: 'faq-c-003',
      category: 'cpd',
      question: 'How are CPD logbooks audited and what happens in cases of non-compliance?',
      answer: 'Log sheets are submitted during the annual license renewal process. The CPD Compliance Board randomly audits 10% of all submitted logbooks for verify accuracy. Non-compliant members are granted a 90-day grace period to make up for deficient hours, during which they hold a conditional practicing certificate. Failure to satisfy requirements after the grace period leads to suspension of the APC.',
      tags: ['audit', 'compliance', 'logbook', 'non-compliance', 'grace period']
    }
  ];

  // Merge API FAQs (dynamic FAQs) into our category-ready format
  const dynamicFaqs: StaticFaq[] = apiFaqs.map((faq, index) => {
    // Automatically classify categories based on keyword mapping
    const qLower = faq.question.toLowerCase();
    const aLower = faq.answer.toLowerCase();
    let category: 'membership' | 'licensing' | 'cpd' = 'membership';
    
    if (qLower.includes('licence') || qLower.includes('license') || qLower.includes('apc') || qLower.includes('practic') || qLower.includes('firm')) {
      category = 'licensing';
    } else if (qLower.includes('cpd') || qLower.includes('hours') || qLower.includes('train') || qLower.includes('point') || qLower.includes('audit')) {
      category = 'cpd';
    }

    return {
      id: `api-faq-${faq.id || index}`,
      question: faq.question,
      answer: faq.answer,
      category,
      tags: qLower.split(' ').filter(word => word.length > 3)
    };
  });

  // Combine static and dynamic FAQs
  const allFaqs = [...staticFaqs, ...dynamicFaqs];

  // Filtering Logic
  const filteredFaqs = allFaqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' ? true : faq.category === activeCategory;
    
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query) ||
      faq.tags.some(tag => tag.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  const toggleAccordion = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div id="faq-interactive-root" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-fade-in">
      {/* Header Introduction */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Interactive Help Center & FAQ</h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          Get direct, authoritative answers to questions regarding SIM membership guidelines, professional licensing regulations, and Continuous Professional Development compliance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Side: Filter Rails & Quick Information Block */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Knowledge Topics</h3>
            
            <nav className="flex flex-col space-y-2">
              <button
                onClick={() => { setActiveCategory('all'); setOpenId(null); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  activeCategory === 'all' 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4" />
                  <span>All Questions</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeCategory === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'}`}>
                  {allFaqs.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveCategory('membership'); setOpenId(null); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  activeCategory === 'membership' 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Membership</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeCategory === 'membership' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'}`}>
                  {allFaqs.filter(f => f.category === 'membership').length}
                </span>
              </button>

              <button
                onClick={() => { setActiveCategory('licensing'); setOpenId(null); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  activeCategory === 'licensing' 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Licensing & APC</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeCategory === 'licensing' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'}`}>
                  {allFaqs.filter(f => f.category === 'licensing').length}
                </span>
              </button>

              <button
                onClick={() => { setActiveCategory('cpd'); setOpenId(null); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  activeCategory === 'cpd' 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4" />
                  <span>CPD Guidelines</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeCategory === 'cpd' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'}`}>
                  {allFaqs.filter(f => f.category === 'cpd').length}
                </span>
              </button>
            </nav>
          </div>

          {/* Quick Contact Promo Sidebar */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-6 rounded-2xl space-y-4">
            <div className="bg-amber-100 h-10 w-10 rounded-xl flex items-center justify-center text-amber-600">
              <PhoneCall className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">Still need assistance?</h4>
              <p className="text-3xs text-slate-600 leading-relaxed">
                If you cannot find details matching your specific inquiry, contact our official registration secretariat directly.
              </p>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('contact')}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center space-x-1 cursor-pointer"
              >
                <span>Write to Secretariat</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Accordion Search & Content List */}
        <div className="lg:col-span-3 space-y-5">
          {/* Search bar */}
          <div className="relative bg-white rounded-2xl border border-slate-200 p-1.5 shadow-xs flex items-center gap-2">
            <div className="pl-3.5 text-slate-400">
              <Search className="h-4.5 w-4.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for terms like 'apc', 'renewal', 'cpd', 'hours', 'fellow'..."
              className="w-full bg-transparent py-3 pr-4 text-xs focus:outline-none placeholder:text-slate-400 font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-3xs font-bold transition-all cursor-pointer mr-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Match Info Area */}
          <div className="flex items-center justify-between text-3xs text-slate-400 px-1 font-mono">
            <span>Found {filteredFaqs.length} matching FAQs</span>
            <span className="flex items-center gap-1">
              <Info className="h-3 w-3" />
              <span>Click any card to expand</span>
            </span>
          </div>

          {/* Accordion List */}
          {filteredFaqs.length > 0 ? (
            <div className="space-y-3.5">
              {filteredFaqs.map((faq) => {
                const isOpen = openId === faq.id;
                
                // Color mapping for sub-category pill
                let catLabel = 'Membership';
                let catColor = 'bg-blue-50 text-blue-600 border-blue-100';
                if (faq.category === 'licensing') {
                  catLabel = 'Licensing & APC';
                  catColor = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                } else if (faq.category === 'cpd') {
                  catLabel = 'CPD Requirements';
                  catColor = 'bg-amber-50 text-amber-700 border-amber-100';
                }

                return (
                  <div 
                    key={faq.id} 
                    className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isOpen 
                        ? 'border-slate-300 shadow-sm ring-1 ring-slate-100' 
                        : 'border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    {/* Header Button (Trigger) */}
                    <button
                      onClick={() => toggleAccordion(faq.id)}
                      className="w-full text-left p-5 flex items-start justify-between gap-4 cursor-pointer focus:outline-none"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 border rounded-full text-[9px] font-bold uppercase tracking-wider ${catColor}`}>
                            {catLabel}
                          </span>
                          <span className="text-[9px] font-mono text-slate-300 font-semibold uppercase">{faq.id}</span>
                        </div>
                        <h3 className="text-xs font-bold text-slate-900 leading-snug">
                          {faq.question}
                        </h3>
                      </div>
                      <div className={`mt-5 rounded-full p-1 border transition-colors ${isOpen ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </button>

                    {/* Expandable Panel */}
                    <div 
                      className={`transition-all duration-300 ease-in-out overflow-hidden ${
                        isOpen ? 'max-h-[500px] border-t border-slate-100 bg-slate-50/50' : 'max-h-0'
                      }`}
                    >
                      <div className="p-5 text-3xs text-slate-600 leading-relaxed whitespace-pre-line space-y-4">
                        <p className="font-medium text-slate-700">{faq.answer}</p>
                        
                        {/* Quick Reference Note */}
                        <div className="flex items-start gap-2 bg-white/70 border border-slate-200/60 p-3 rounded-xl text-[10px] text-slate-500">
                          <HelpCircle className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                          <p>
                            Was this answer helpful? Active members can find original legislation documents and downloadable PDF manuals under the <button onClick={() => onNavigateTab && onNavigateTab('downloads')} className="text-amber-600 font-bold hover:underline cursor-pointer">Downloads</button> tab.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4 max-w-md mx-auto">
              <div className="bg-slate-50 text-slate-400 h-14 w-14 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900">No FAQs match your search</h3>
                <p className="text-slate-500 text-3xs leading-relaxed">
                  We could not find any questions containing <strong>"{searchQuery}"</strong>. Please try searching for simple terms like 'hours', 'fees', or select a specific category on the left.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

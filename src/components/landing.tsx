"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  CreditCard,
  FileCheck2,
  GraduationCap,
  BriefcaseBusiness,
  CarFront,
  MoveUpRight,
  ShieldCheck,
  Sparkles,
  Wallet,
  Lock,
  FileText,
  UserCheck,
  CheckCircle2,
  HelpCircle,
  Zap
} from "lucide-react";
import { ApplicationFields } from "./application-fields";

export function Landing() {
  return (
    <>
      {/* Hero Section */}
      <section className="landing-hero animate-fade-in relative overflow-hidden">
        <div className="hero-copy z-10">
          <div className="eyebrow animate-pulse-glow inline-flex items-center gap-2">
            <Zap size={14} className="text-amber-500 fill-amber-500" />
            SMALL STEPS. BIG POSSIBILITIES.
          </div>
          <h1 className="tracking-tight text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1]">
            A little support.
            <br />
            A <span className="highlight-word">bigger</span>
            <br />
            tomorrow<span className="text-blue-600">.</span>
          </h1>
          <p className="hero-description text-slate-600 text-sm md:text-base leading-relaxed mt-4 max-w-xl">
            Your plans deserve a next step. Apply with a simple 3-step online process, a single ₹299 fee, and track your review decision in real time.
          </p>
          
          <div className="hero-actions flex flex-wrap items-center gap-4 mt-8">
            <Link
              href="/apply"
              className="btn btn-yellow px-7 py-4 text-xs sm:text-sm font-extrabold rounded-2xl shadow-xl shadow-amber-500/25 hover:scale-[1.02] active:scale-100 transition duration-200"
            >
              Let’s get you started <ArrowRight size={18} />
            </Link>
            <Link
              href="/how-it-works"
              className="px-6 py-4 rounded-2xl border border-slate-300 hover:border-blue-600 text-slate-700 hover:text-blue-600 text-xs sm:text-sm font-bold transition duration-200 flex items-center gap-2 bg-white/80"
            >
              See how it works <ArrowDown size={15} />
            </Link>
          </div>

          <div className="hero-assurance flex flex-wrap items-center gap-4 mt-8 pt-6 border-t border-slate-200/80 text-xs text-slate-600 font-semibold">
            <div className="flex items-center gap-1.5 text-slate-700">
              <ShieldCheck size={17} className="text-emerald-600" />
              <span>Private & Encrypted Data</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5 text-slate-700">
              <Clock3 size={17} className="text-blue-600" />
              <span>24–48 hr Expected Review</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5 text-slate-700">
              <CreditCard size={17} className="text-amber-600" />
              <span>₹299 Fixed Fee</span>
            </div>
          </div>
        </div>

        {/* Hero Art / Interactive Phone App Mockup */}
        <div className="hero-art animate-float" aria-label="Illustration of the application process">
          <div className="art-grid" />
          <div className="art-sun" />
          <span className="art-spark">
            <Sparkles size={42} strokeWidth={1.5} />
          </span>
          <div className="art-caption font-bold">
            A NEXT STEP
            <br />
            FOR YOUR NEXT CHAPTER.
          </div>

          <div className="application-phone shadow-2xl border-4 border-slate-800">
            <div className="phone-top">
              <span className="mini-brand font-black">
                <Wallet size={17} /> money<span>pay</span>
              </span>
              <span className="phone-avatar font-bold">M</span>
            </div>
            <div className="phone-greeting font-bold tracking-wider">YOUR NEXT CHAPTER</div>
            <h3 className="text-xl font-black text-slate-900">One step closer.</h3>
            <p className="phone-sub text-xs text-slate-500">Your application, all in one place.</p>
            
            <div className="phone-amount bg-gradient-to-r from-amber-50 to-yellow-100 p-3 rounded-2xl border border-amber-200 my-3">
              <span className="text-[11px] font-bold text-slate-600 block">Application processing fee</span>
              <strong className="text-2xl font-black text-slate-900">
                ₹299<span className="text-sm font-bold text-slate-500">.00</span>
              </strong>
              <span className="fee-label font-bold text-[10px] text-amber-800 flex items-center justify-end gap-1 mt-1">
                ONE FIXED FEE <MoveUpRight size={12} />
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="phone-step p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="step-done bg-emerald-100 text-emerald-700 p-1 rounded-full">
                  <Check size={14} />
                </span>
                <div>
                  <strong className="text-xs font-bold text-slate-900 block">01. Details & KYC Documents</strong>
                  <small className="text-[11px] text-slate-500">Quick online upload</small>
                </div>
              </div>
              <div className="phone-step p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="step-done bg-blue-100 text-blue-700 p-1 rounded-full">
                  <CreditCard size={14} />
                </span>
                <div>
                  <strong className="text-xs font-bold text-slate-900 block">02. UPI Payment QR</strong>
                  <small className="text-[11px] text-slate-500">Scan & pay ₹299</small>
                </div>
              </div>
              <div className="phone-step p-2.5 rounded-xl bg-amber-50/60 border border-amber-200">
                <span className="step-wait bg-amber-100 text-amber-700 p-1 rounded-full">
                  <Clock3 size={14} />
                </span>
                <div>
                  <strong className="text-xs font-bold text-slate-900 block">03. Admin Review Desk</strong>
                  <small className="text-[11px] text-slate-500">Expected in 24–48 hours</small>
                </div>
              </div>
            </div>

            <Link href="/apply" className="phone-button block text-center font-bold text-xs py-3 rounded-xl bg-blue-600 text-white mt-4 hover:bg-blue-700 transition">
              Start application now &rarr;
            </Link>
            <span className="illustration-label font-mono">APPLICATION PREVIEW</span>
          </div>

          <div className="floating-fee shadow-lg bg-white/95 backdrop-blur-md">
            <span className="float-icon text-emerald-600 bg-emerald-50 p-2 rounded-xl">
              <FileCheck2 size={22} />
            </span>
            <div>
              <strong className="text-xs font-bold text-slate-900 block">Simple & Clear</strong>
              <small className="text-[11px] text-slate-500">Apply online anytime</small>
            </div>
          </div>
          <div className="floating-review shadow-lg bg-white/95 backdrop-blur-md">
            <span className="review-dot bg-amber-500 animate-ping" />
            <strong className="text-xs font-bold text-slate-900 block">24–48 hrs</strong>
            <span className="text-[11px] text-slate-500">Expected review</span>
          </div>
        </div>
      </section>

      {/* High-Impact Stat Strip */}
      <section className="facts-strip my-12" aria-label="Application facts">
        <div>
          <span className="fact-number">
            ₹299<span>fixed</span>
          </span>
          <p className="text-xs text-slate-600 font-medium mt-1">Application processing fee</p>
        </div>
        <div>
          <span className="fact-number">
            24–48<span>hrs</span>
          </span>
          <p className="text-xs text-slate-600 font-medium mt-1">Expected review timeline</p>
        </div>
        <div>
          <span className="fact-number">
            100%<span>online</span>
          </span>
          <p className="text-xs text-slate-600 font-medium mt-1">Apply, pay & track status</p>
        </div>
        <Link href="/apply" className="fact-cta group bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-2xl">
          <span>
            Ready for your
            <br />
            <strong className="text-lg">next step?</strong>
          </span>
          <span className="circle-arrow group-hover:translate-x-1 transition duration-200 bg-white/20 p-2 rounded-full">
            <ArrowRight size={22} />
          </span>
        </Link>
      </section>

      {/* Applicant Categories Overview */}
      <section className="max-w-[1360px] mx-auto px-6 py-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="eyebrow justify-center mb-2"><span /> APPLICANT PROFILES</span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Different Journeys. Same Simple Start.</h2>
          <p className="mt-2 text-sm text-slate-600">Select your applicant category to view required KYC documents.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-6 border border-slate-200/90 rounded-3xl bg-white/95 shadow-sm hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <GraduationCap size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Student Applicant</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Upload Student ID Card, Institution Name, Identity Proof, and Residential Address Proof.
            </p>
            <Link href="/apply" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
              Apply as Student &rarr;
            </Link>
          </div>

          <div className="glass-card p-6 border border-slate-200/90 rounded-3xl bg-white/95 shadow-sm hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <CarFront size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Driver Applicant</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Upload Driving Licence as primary identity document, plus residential Address Proof.
            </p>
            <Link href="/apply" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:underline">
              Apply as Driver &rarr;
            </Link>
          </div>

          <div className="glass-card p-6 border border-slate-200/90 rounded-3xl bg-white/95 shadow-sm hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <BriefcaseBusiness size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Working Professionals</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Upload Government Identity proof (Voter ID, Passport, DL) and Address proof.
            </p>
            <Link href="/apply" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline">
              Apply as Employed &rarr;
            </Link>
          </div>

          <div className="glass-card p-6 border border-slate-200/90 rounded-3xl bg-white/95 shadow-sm hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Wallet size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Unemployed Applicant</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Upload standard Identity document and residential Address proof for KYC review.
            </p>
            <Link href="/apply" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:underline">
              Apply as Unemployed &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 3-Step Process Section */}
      <section id="how-it-works" className="process-section max-w-[1360px] mx-auto px-6 py-12">
        <div className="section-heading mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="eyebrow">LESS GUESSWORK. MORE CLARITY.</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2">
              Good things start
              <br />
              with a simple process.
            </h2>
          </div>
          <div className="max-w-md">
            <p className="text-sm text-slate-600 leading-relaxed">
              No complicated paperwork. Clear guidelines and real-time tracking from start to finish.
            </p>
            <Link href="/how-it-works" className="text-xs font-bold text-blue-600 hover:underline mt-2 inline-block">
              Learn more about requirements &rarr;
            </Link>
          </div>
        </div>

        <div className="process-grid grid md:grid-cols-3 gap-8">
          {[
            {
              icon: FileCheck2,
              title: "Make it yours.",
              text: "Enter your personal details, select your applicant category, and upload required KYC documents.",
              tag: "YOUR DETAILS & KYC",
            },
            {
              icon: CreditCard,
              title: "Keep it simple.",
              text: "Scan the published UPI payment QR code, pay ₹299 fee, and submit your UTR reference number & receipt.",
              tag: "ONE CLEAR FEE (₹299)",
            },
            {
              icon: Clock3,
              title: "Stay in the loop.",
              text: "Track your manual review decision and read detailed admin decision notes inside your portal dashboard.",
              tag: "24–48 HR REVIEW",
            },
          ].map((item, i) => (
            <article className="process-item glass-card p-8 border border-slate-200/90 rounded-3xl bg-white/95 shadow-sm group hover:-translate-y-1 transition duration-200" key={item.title}>
              <div className="process-top flex items-center justify-between mb-4">
                <span className="process-icon text-blue-600 bg-blue-50 p-3 rounded-2xl group-hover:scale-105 transition duration-200">
                  <item.icon size={26} strokeWidth={1.5} />
                </span>
                <span className="process-number font-black text-2xl text-slate-300">0{i + 1}</span>
              </div>
              <span className="process-tag text-[10px] font-extrabold text-blue-600 tracking-wider uppercase block mb-1">{item.tag}</span>
              <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed mt-2">{item.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/apply" className="btn btn-yellow text-xs font-bold px-8 py-4 rounded-2xl shadow-lg shadow-amber-500/20 inline-flex items-center gap-2">
            Go to Application Portal <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* Feature & Security Highlights */}
      <section className="max-w-[1360px] mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="glass-card p-8 border border-slate-200/90 rounded-3xl bg-white/95 shadow-sm hover:-translate-y-1.5 transition duration-300">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Lock size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Privacy & Encryption</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Your uploaded KYC documents and payment screenshots are encrypted and stored in private Supabase buckets with 5-minute temporary signed URLs.
            </p>
          </div>
          <div className="glass-card p-8 border border-slate-200/90 rounded-3xl bg-white/95 shadow-sm hover:-translate-y-1.5 transition duration-300">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <UserCheck size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Tailored Categories</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Whether you are a Student, Driver, Employed, Self-employed, or Unemployed applicant, submit specific supporting documents easily.
            </p>
          </div>
          <div className="glass-card p-8 border border-slate-200/90 rounded-3xl bg-white/95 shadow-sm hover:-translate-y-1.5 transition duration-300">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <FileText size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Real-Time Status Tracking</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Track your review status, admin decision notes, and approval status anytime by signing into your personal applicant portal.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="faq-section max-w-[1360px] mx-auto px-6 py-12" id="questions">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
          <div className="lg:col-span-4">
            <span className="eyebrow">A LITTLE MORE CLARITY</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
              Good questions.
              <br />
              Straight answers.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-3">
              Know what to expect before you submit your application.
            </p>
            <Link href="/questions" className="btn btn-yellow text-xs font-bold mt-6 inline-flex items-center gap-2 shadow-sm">
              View All FAQs & Support <ArrowRight size={16} />
            </Link>
          </div>
          <div className="lg:col-span-8 space-y-4 w-full">
            {[
              [
                "Which documents do I need?",
                "All applicants provide an identity document and current address proof. Students also upload a student ID card and institution name. Drivers use a driving licence as their identity document.",
              ],
              [
                "What is the ₹299 fee for?",
                "The ₹299 fee is a fixed application processing fee. It covers manual review of your uploaded KYC documents and payment reference verification.",
              ],
              [
                "How long does the review take?",
                "The expected review window is 24–48 hours after submission. Your status and decision notes appear inside your account portal.",
              ],
              [
                "How do I make the payment?",
                "Use any UPI app to scan the QR code published by the admin. Pay exactly ₹299, then enter your UTR transaction reference and upload your receipt screenshot.",
              ],
            ].map(([q, a]) => (
              <details key={q} className="group glass-card border border-slate-200/90 rounded-2xl bg-white p-5 open:shadow-md transition w-full">
                <summary className="flex items-center justify-between font-bold text-slate-900 text-base cursor-pointer list-none select-none">
                  <span className="flex items-center gap-3">
                    <HelpCircle size={19} className="text-blue-600 shrink-0" />
                    {q}
                  </span>
                  <ChevronDown size={18} className="text-slate-400 group-open:rotate-180 transition duration-200 shrink-0" />
                </summary>
                <p className="mt-3 text-xs md:text-sm text-slate-600 leading-relaxed pl-8 border-l-2 border-blue-200">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-[1360px] mx-auto px-6 py-12">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-xl">
          <div className="max-w-2xl mx-auto relative z-10 space-y-4">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-yellow-300 font-bold text-xs border border-yellow-400/30">
              START YOUR APPLICATION TODAY
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Ready to take your next step?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
              Fill in your details, upload your KYC documents, pay ₹299, and track your application status in real time.
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-4">
              <Link href="/apply" className="btn btn-yellow text-xs sm:text-sm font-extrabold px-8 py-4 rounded-2xl shadow-xl shadow-amber-500/20">
                Go to Application Portal <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

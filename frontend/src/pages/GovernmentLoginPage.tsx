import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, ShieldCheck, Mail, Lock, Eye, EyeOff,
  Radio, Sparkles, AlertCircle, Home,
  Check, X, Zap, Send, HelpCircle, PhoneCall,
  RefreshCw, CheckCircle2, ArrowRight,
  KeyRound, Building2, MapPin
} from 'lucide-react';
import {
  findOfficerById,
  validateGovernmentEmail,
  validatePasswordComplexity,
  authenticateAndVerifyGovernmentOfficer,
  sendGovernmentOtp,
  verifyGovernmentOtpAsync,
  verifyFirebaseEmailLink,
  createGovernmentSession,
  getGovernmentUsers,
  DEMO_TESTING_EMAIL,
  type GovernmentUser,
} from '../services/firebaseAuth';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const AP_DISTRICTS = [
  'West Godavari', 'East Godavari', 'Visakhapatnam', 'Krishna', 'Guntur',
  'Srikakulam', 'Vizianagaram', 'Anakapalli', 'Kakinada',
  'Dr. B.R. Ambedkar Konaseema', 'Eluru', 'NTR District', 'Bapatla',
  'Palnadu', 'Prakasam', 'Nellore', 'Tirupati', 'Chittoor',
  'Annamayya', 'YSR Kadapa', 'Nandyal', 'Kurnool', 'Anantapur',
  'Sri Sathya Sai', 'Alluri Sitharama Raju', 'Parvathipuram Manyam',
];

const ALL_STATES = [
  'Andhra Pradesh', 'Rajasthan', 'Telangana', 'Tamil Nadu',
  'Himachal Pradesh', 'Uttarakhand', 'Assam', 'Bihar',
  'West Bengal', 'Odisha', 'Uttar Pradesh', 'Sikkim',
  'Mizoram', 'Kerala', 'Gujarat', 'Maharashtra',
];

const DEPARTMENTS = [
  'District Collector Office', 'NDMA', 'SDMA',
  'Police Department', 'Fire & Emergency Services', 'NDRF', 'Health Department',
];

interface GovernmentLoginPageProps {
  onLoginSuccess: (stateName?: string) => void;
  onNavigateToCitizen?: () => void;
  onNavigateToLanding?: () => void;
}

// ─── TOAST NOTIFICATION SYSTEM ────────────────────────────────────────────────

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export const GovernmentLoginPage: React.FC<GovernmentLoginPageProps> = ({
  onLoginSuccess,
  onNavigateToCitizen,
  onNavigateToLanding,
}) => {
  // ── Form State ──────────────────────────────────────────────────────────────
  const [officerId, setOfficerId] = useState('APCOLL001');
  const [email, setEmail] = useState(DEMO_TESTING_EMAIL);
  const [password, setPassword] = useState('Collector@26191');
  const [showPassword, setShowPassword] = useState(false);
  const [department, setDepartment] = useState('District Collector Office');
  const [selectedState, setSelectedState] = useState('Andhra Pradesh');
  const [selectedDistrict, setSelectedDistrict] = useState('West Godavari');
  const [authorized, setAuthorized] = useState(false);

  // ── Validation State ────────────────────────────────────────────────────────
  const [officerIdError, setOfficerIdError] = useState<string | null>(null);
  const [officerIdOk, setOfficerIdOk] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailOk, setEmailOk] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordOk, setPasswordOk] = useState(false);
  const [isDemoEmail, setIsDemoEmail] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── OTP State ───────────────────────────────────────────────────────────────
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(30);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── UI State ────────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [activeModal, setActiveModal] = useState<'forgot' | 'contact' | 'help' | null>(null);

  // ── Toast helper ─────────────────────────────────────────────────────────────
  const addToast = (t: Omit<Toast, 'id'>) => {
    const id = 'toast_' + Date.now() + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 6500);
  };

  // ── Validate Officer ID against Government database ─────────────────────────
  const doValidateOfficerId = (val: string): GovernmentUser | null => {
    const clean = val.trim().toUpperCase();
    if (!clean) {
      setOfficerIdError('Officer ID cannot be empty.');
      setOfficerIdOk(false);
      return null;
    }
    const found = findOfficerById(clean);
    if (!found) {
      setOfficerIdError('Invalid Officer ID. Use official credentials (e.g. APCOLL001).');
      setOfficerIdOk(false);
      return null;
    }
    setOfficerIdError(null);
    setOfficerIdOk(true);
    return found;
  };

  // ── Validate Email belongs to Officer ID ─────────────────────────────────────
  const doValidateEmail = (val: string, curOfficerId: string): boolean => {
    const clean = val.trim().toLowerCase();
    if (!clean) {
      setEmailError('Official Email cannot be empty.');
      setEmailOk(false);
      setIsDemoEmail(false);
      return false;
    }
    const check = validateGovernmentEmail(clean);
    if (!check.isValid) {
      setEmailError(check.error || 'Invalid official email address.');
      setEmailOk(false);
      setIsDemoEmail(false);
      return false;
    }

    setIsDemoEmail(!!check.isDemoAccount);

    // Validate that email belongs to this Officer ID
    const officer = findOfficerById(curOfficerId);
    if (officer && officer.email.toLowerCase() !== clean) {
      setEmailError('Email does not match registered profile for this Officer ID.');
      setEmailOk(false);
      return false;
    }

    setEmailError(null);
    setEmailOk(true);
    return true;
  };

  // ── Validate Password ───────────────────────────────────────────────────────
  const doValidatePassword = (val: string, curOfficerId: string): boolean => {
    if (!val) {
      setPasswordError('Password cannot be empty.');
      setPasswordOk(false);
      return false;
    }
    const cplx = validatePasswordComplexity(val);
    if (!cplx.isValid) {
      setPasswordError(cplx.error || 'Password does not meet complexity requirements.');
      setPasswordOk(false);
      return false;
    }
    const officer = findOfficerById(curOfficerId);
    if (officer && officer.passwordHash && officer.passwordHash !== val) {
      setPasswordError('Incorrect password for this Government account.');
      setPasswordOk(false);
      return false;
    }
    setPasswordError(null);
    setPasswordOk(true);
    return true;
  };

  // ── Mount: validate initial pre-fill & check silent email verification link ──
  useEffect(() => {
    doValidateOfficerId('APCOLL001');
    doValidateEmail(DEMO_TESTING_EMAIL, 'APCOLL001');
    doValidatePassword('Collector@26191', 'APCOLL001');

    // Silent check for email verification link
    verifyFirebaseEmailLink().then((res) => {
      if (res.isEmailLink && res.email) {
        setEmail(res.email);
        if (res.officerId) {
          setOfficerId(res.officerId);
          doValidateOfficerId(res.officerId);
        }
        setOtpVerified(true);
        setOtpSuccess('Email verified successfully.');
        addToast({
          type: 'success',
          title: 'Verified',
          message: 'Email verified successfully.',
        });
      }
    });
  }, []);

  // ── 30-Second Resend Countdown ───────────────────────────────────────────────
  useEffect(() => {
    if (!otpSent || otpCountdown <= 0) return;
    const t = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpSent, otpCountdown]);

  // ── Autofill for Official Evaluation ────────────────────────────────────────
  const handleAutofill = (user: GovernmentUser) => {
    setOfficerId(user.officerId);
    setEmail(user.email);
    setPassword(user.passwordHash || 'Collector@26191');
    setDepartment(user.department);
    setSelectedState(user.state);
    setSelectedDistrict(user.district);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpSent(false);
    setOtpVerified(false);
    setOtpError(null);
    setOtpSuccess(null);
    setFormError(null);
    setTimeout(() => {
      doValidateOfficerId(user.officerId);
      doValidateEmail(user.email, user.officerId);
      doValidatePassword(user.passwordHash || 'Collector@26191', user.officerId);
    }, 50);
  };

  // ── "When user enters valid ID, email & password, enable Send Secure OTP" ───
  const isSendOtpEnabled = officerIdOk && emailOk && passwordOk && !isSendingOtp;

  // ── Send Secure OTP ──────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    setFormError(null);
    setOtpError(null);
    setOtpSuccess(null);

    // 1. Validate Officer ID
    const officer = doValidateOfficerId(officerId);
    if (!officer) {
      addToast({ type: 'error', title: 'Officer ID Required', message: 'Enter a valid Government Officer ID.' });
      return;
    }

    // 2. Validate Email belongs to that Officer ID
    const emailOkNow = doValidateEmail(email, officerId);
    if (!emailOkNow) {
      addToast({ type: 'error', title: 'Valid Email Required', message: 'Enter the registered official email for this Officer ID.' });
      return;
    }

    // 3. Validate Password
    const pwOk = doValidatePassword(password, officerId);
    if (!pwOk) {
      addToast({ type: 'error', title: 'Password Required', message: 'Enter the correct password for this account.' });
      return;
    }

    setIsSendingOtp(true);
    try {
      // Step A: Authenticate against background database & verify active profile
      const authResult = await authenticateAndVerifyGovernmentOfficer(officerId, email, password);
      if (!authResult.success) {
        setIsSendingOtp(false);
        const errMsg = authResult.error || 'Authentication failed. Please verify credentials.';
        setFormError(errMsg);
        addToast({
          type: 'error',
          title: 'Authentication Failed',
          message: errMsg,
        });
        return;
      }

      // Step B: Send OTP to the exact email entered
      await sendGovernmentOtp(officerId, email);
      setIsSendingOtp(false);
      setOtpSent(true);
      setOtpCountdown(30);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpVerified(false);
      setOtpError(null);
      setOtpSuccess('Verification code sent successfully to your registered email.');

      // "Show only this toast: Verification code sent successfully to your registered email."
      addToast({
        type: 'success',
        title: 'Verification Code Sent',
        message: 'Verification code sent successfully to your registered email.',
      });

      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 200);
    } catch (err: unknown) {
      setIsSendingOtp(false);
      const msg = err instanceof Error ? err.message : 'Failed to dispatch verification code.';
      addToast({ type: 'error', title: 'Dispatch Failed', message: msg });
    }
  };

  // ── OTP input handlers (6 separate boxes) ───────────────────────────────────
  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const digit = val.slice(-1);
    const next = [...otpDigits];
    next[i] = digit;
    setOtpDigits(next);
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
    const full = next.join('');
    if (full.length === 6) verifyOtp(full);
    else {
      setOtpVerified(false);
      setOtpError(null);
    }
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  // ── Verify OTP in background ─────────────────────────────────────────────────
  const verifyOtp = async (code: string) => {
    const res = await verifyGovernmentOtpAsync(officerId, code);
    if (res.success) {
      // "If correct: Show 'Email verified successfully.' Enable LOGIN TO COMMAND CENTER."
      setOtpVerified(true);
      setOtpError(null);
      setOtpSuccess('Email verified successfully.');
      addToast({
        type: 'success',
        title: 'Email Verified',
        message: 'Email verified successfully.',
      });
    } else {
      // "If incorrect: Show 'Invalid verification code.'"
      setOtpVerified(false);
      const err = res.error || 'Invalid verification code.';
      setOtpError(err);
      addToast({
        type: 'error',
        title: 'Verification Failed',
        message: err,
      });
    }
  };

  // ── "Login button remains disabled until OTP is verified" ───────────────────
  const isLoginEnabled =
    officerIdOk && emailOk && passwordOk && otpVerified && authorized && !isAuthenticating;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const officer = findOfficerById(officerId);
    if (!officer) { setFormError('Invalid Officer ID.'); return; }
    if (officer.passwordHash && officer.passwordHash !== password) {
      setPasswordError('Incorrect password.');
      return;
    }
    if (!otpVerified) {
      setFormError('Email verification is required before login.');
      return;
    }
    if (!authorized) {
      setFormError('Please confirm you are an authorized official.');
      return;
    }

    createGovernmentSession(officer);
    setIsAuthenticating(true);
    addToast({
      type: 'success',
      title: 'Authentication Successful',
      message: `Welcome, ${officer.name}. Redirecting to Command Center...`,
    });

    setTimeout(() => {
      onLoginSuccess(officer.state);
    }, 1500);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen w-full bg-[#F8F7F3] flex flex-col overflow-x-hidden font-sans select-none">

      {/* ─── BACKGROUND CONTOUR LINES ─────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <svg className="absolute w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 900" preserveAspectRatio="none">
          <g fill="none" stroke="#C8DDD4" strokeWidth="1">
            <path d="M-100,100 C200,50 450,200 750,120 C1050,40 1280,180 1540,100" />
            <path d="M-100,150 C210,100 460,250 760,170 C1060,90 1290,230 1540,145" strokeWidth="0.7" />
            <path d="M-100,350 C180,290 390,470 690,380 C990,290 1220,440 1540,340" />
            <path d="M-100,400 C190,340 400,520 700,430 C1000,340 1230,490 1540,390" strokeWidth="0.8" />
            <path d="M-100,640 C240,560 500,720 820,630 C1140,540 1340,700 1540,620" stroke="#1F7A4D" strokeOpacity="0.15" />
            <path d="M-100,700 C250,620 510,780 830,690 C1150,600 1350,750 1540,680" stroke="#1F7A4D" strokeOpacity="0.12" />
            <ellipse cx="120" cy="160" rx="130" ry="60" strokeWidth="0.7" strokeDasharray="3 4" opacity="0.5" />
            <ellipse cx="1330" cy="800" rx="160" ry="80" strokeWidth="0.7" strokeDasharray="4 6" opacity="0.4" />
          </g>
        </svg>
      </div>

      {/* ─── TOAST NOTIFICATIONS ──────────────────────────────────────────── */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl border max-w-xs backdrop-blur-sm
              animate-[slideInRight_0.3s_ease-out]
              ${t.type === 'success' ? 'bg-white border-[#1F7A4D]/40 text-[#0F2D5C]'
                : t.type === 'error' ? 'bg-white border-red-300 text-[#0F2D5C]'
                : t.type === 'warning' ? 'bg-white border-amber-300 text-[#0F2D5C]'
                : 'bg-white border-blue-200 text-[#0F2D5C]'}`}>
            <span className={`mt-0.5 flex-shrink-0
              ${t.type === 'success' ? 'text-[#1F7A4D]'
                : t.type === 'error' ? 'text-red-500'
                : t.type === 'warning' ? 'text-amber-500'
                : 'text-blue-500'}`}>
              {t.type === 'success' ? <CheckCircle2 className="w-4 h-4" />
                : t.type === 'error' ? <AlertCircle className="w-4 h-4" />
                : <Radio className="w-4 h-4" />}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold leading-tight">{t.title}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{t.message}</p>
            </div>
            <button onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))}
              className="text-slate-400 hover:text-slate-600 cursor-pointer flex-shrink-0 mt-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* ─── LOADING OVERLAY ──────────────────────────────────────────────── */}
      {isAuthenticating && (
        <div className="fixed inset-0 z-[200] bg-[#0F2D5C]/95 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
          <div className="relative flex items-center justify-center">
            <div className="w-20 h-20 border-4 border-[#1F7A4D]/30 border-t-[#1F7A4D] rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" fill="rgba(31,122,77,0.3)" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-white text-lg font-bold tracking-wide">Authenticating Government Officer...</p>
            <p className="text-[#1F7A4D] text-sm mt-1">Establishing Secure Session with Command Center · SIH26191</p>
          </div>
        </div>
      )}

      {/* ─── HEADER ───────────────────────────────────────────────────────── */}
      <header className="relative z-20 w-full bg-[#F8F7F3]/95 backdrop-blur-sm border-b border-[#D8E6DD]/80 px-4 sm:px-8 lg:px-12 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">

          {/* Left: Emblem + Ministry */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center p-1 rounded-md bg-white border border-[#D8E6DD] shadow-sm">
              <img src="/images/emblem_india.jpg" alt="Government of India Emblem"
                className="h-9 w-auto object-contain mix-blend-multiply"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }} />
            </div>
            <div>
              <div className="text-xs font-bold tracking-tight text-[#0F2D5C] leading-tight">
                GOVERNMENT OF INDIA
              </div>
              <div className="text-[11px] font-semibold text-[#1F7A4D] leading-tight">
                Ministry of Home Affairs · NDMA
              </div>
            </div>
          </div>

          {/* Center: SIH */}
          <div className="hidden md:flex flex-col items-center text-center">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#0F2D5C] tracking-wide">Smart India Hackathon 2026</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#EAF4EE] text-[#1F7A4D] border border-[#D8E6DD]">
                SIH26191
              </span>
            </div>
            <span className="text-[11px] text-slate-500">Innovation for a Safer Tomorrow · Problem ID: SIH26191</span>
          </div>

          {/* Right: Badge + Nav */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EAF4EE] border border-[#1F7A4D]/40 text-[#1F7A4D]">
              <Shield className="w-3.5 h-3.5" fill="rgba(31,122,77,0.2)" />
              <span className="text-[11px] font-semibold tracking-wide">Government Secure Portal</span>
            </div>
            {onNavigateToLanding && (
              <button onClick={onNavigateToLanding}
                className="text-xs font-medium text-slate-600 hover:text-[#0F2D5C] transition-colors flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-white border border-[#D8E6DD] cursor-pointer">
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hub</span>
              </button>
            )}
            {onNavigateToCitizen && (
              <button onClick={onNavigateToCitizen}
                className="text-xs font-medium text-[#0F2D5C] hover:text-[#1F7A4D] transition-colors flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-white border border-[#D8E6DD] cursor-pointer">
                <span>Citizen Portal</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ─── OFFICIAL EVALUATION BANNER ───────────────────────────────────── */}
      <div className="relative z-10 w-full bg-[#EAF4EE] border-b border-[#D8E6DD] py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-[#0F2D5C]">
            <span className="px-2 py-0.5 rounded bg-[#1F7A4D] text-white font-mono text-[10px] font-bold">
              OFFICIAL EVALUATION MODE
            </span>
            <span className="font-semibold hidden sm:inline">Authorized Demonstration Accounts:</span>
            <span className="text-slate-600">
              Collector (<code className="font-bold text-[#0F2D5C]">APCOLL001</code>),
              NDRF (<code className="font-bold text-[#0F2D5C]">APNDRF001</code>),
              Police (<code className="font-bold text-[#0F2D5C]">APPOL001</code>)
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {getGovernmentUsers().slice(0, 3).map((u) => (
              <button key={u.officerId} onClick={() => handleAutofill(u)}
                className="px-2.5 py-1 rounded bg-white hover:bg-[#F8F7F3] border border-[#D8E6DD] text-[#0F2D5C] font-semibold text-[11px] flex items-center gap-1 shadow-sm cursor-pointer hover:border-[#1F7A4D] transition-colors">
                <Zap className="w-3 h-3 text-[#1F7A4D]" />
                <span>Autofill {u.department.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* ═══════════════════════════════════════════ */}
          {/* LEFT PANEL — 40%                           */}
          {/* ═══════════════════════════════════════════ */}
          <div className="lg:col-span-5 flex flex-col items-center text-center">

            {/* Shield Logo */}
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1F7A4D] to-[#145c38] flex items-center justify-center shadow-xl shadow-[#1F7A4D]/25 border border-[#2ea46a]/30">
                <svg className="w-11 h-11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(255,255,255,0.12)" />
                  <circle cx="12" cy="11" r="3.5" stroke="rgba(255,255,255,0.9)" strokeWidth="1.4" />
                  <path d="M12 8.5v5M9.5 11h5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" />
                </svg>
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 bg-white p-1 rounded-full border border-[#D8E6DD] shadow-sm">
                <ShieldCheck className="w-4 h-4 text-[#1F7A4D]" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold tracking-tight text-[#0F2D5C] uppercase leading-tight">
              RAKSHA SETHU
            </h1>
            <p className="text-sm font-semibold text-[#1F7A4D] tracking-wide mt-1 uppercase">
              Disaster Decision &amp; Response Platform
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Ministry of Home Affairs · Government of India · SIH26191
            </p>

            {/* Operational Illustration */}
            <div className="w-full max-w-sm my-6 bg-white/70 border border-[#D8E6DD] rounded-2xl p-4 shadow-sm backdrop-blur-xs">
              <svg className="w-full h-44" viewBox="0 0 400 180" xmlns="http://www.w3.org/2000/svg">
                <rect width="400" height="180" rx="12" fill="#F0F7F3" />
                <path d="M0,130 C100,120 180,140 280,125 C340,115 380,130 400,125 L400,180 L0,180 Z" fill="#DDEEE5" />
                <path d="M0,150 C90,142 200,158 300,148 C360,142 390,150 400,147 L400,180 L0,180 Z" fill="#CBE5D7" />

                {/* Watchtower */}
                <g transform="translate(60, 45)">
                  <polygon points="20,0 26,0 36,95 10,95" fill="#0F2D5C" opacity="0.85" />
                  <rect x="14" y="25" width="18" height="12" rx="2" fill="#1F7A4D" />
                  <rect x="18" y="27" width="10" height="6" rx="1" fill="#FFD700" opacity="0.8" />
                  <line x1="23" y1="0" x2="23" y2="-12" stroke="#0F2D5C" strokeWidth="2" />
                  <circle cx="23" cy="-12" r="3" fill="#E53935" className="animate-ping" />
                  <circle cx="23" cy="-12" r="2.5" fill="#E53935" />
                  <line x1="14" y1="50" x2="32" y2="50" stroke="#F8F7F3" strokeWidth="1" />
                  <line x1="12" y1="70" x2="34" y2="70" stroke="#F8F7F3" strokeWidth="1" />
                </g>

                {/* Radar sweep */}
                <g transform="translate(200, 75)">
                  <circle cx="0" cy="0" r="36" fill="none" stroke="#1F7A4D" strokeWidth="1" opacity="0.4" strokeDasharray="3 3" />
                  <circle cx="0" cy="0" r="24" fill="none" stroke="#1F7A4D" strokeWidth="1" opacity="0.6" />
                  <circle cx="0" cy="0" r="12" fill="none" stroke="#1F7A4D" strokeWidth="1" opacity="0.8" />
                  <circle cx="0" cy="0" r="3" fill="#1F7A4D" />
                  <path d="M0,0 L25,-25 A36,36 0 0,0 -25,-25 Z" fill="#1F7A4D" opacity="0.15" />
                  <circle cx="14" cy="-18" r="2.5" fill="#E53935" />
                  <circle cx="-16" cy="12" r="2" fill="#FF9800" />
                  <circle cx="22" cy="8" r="2" fill="#1F7A4D" />
                </g>

                {/* Helicopter */}
                <g transform="translate(310, 35)">
                  <ellipse cx="20" cy="15" rx="16" ry="8" fill="#0F2D5C" />
                  <rect x="32" y="13" width="16" height="3" fill="#0F2D5C" />
                  <polygon points="48,11 48,18 45,14.5" fill="#0F2D5C" />
                  <line x1="8" y1="6" x2="32" y2="6" stroke="#1F7A4D" strokeWidth="2" strokeLinecap="round" />
                  <line x1="20" y1="6" x2="20" y2="9" stroke="#0F2D5C" strokeWidth="2" />
                  <line x1="12" y1="23" x2="28" y2="23" stroke="#555" strokeWidth="1.5" />
                  <line x1="16" y1="21" x2="14" y2="23" stroke="#555" strokeWidth="1.5" />
                  <line x1="24" y1="21" x2="26" y2="23" stroke="#555" strokeWidth="1.5" />
                  <circle cx="12" cy="14" r="3.5" fill="#7EC8E3" opacity="0.8" />
                </g>

                {/* Rescue Boat */}
                <g transform="translate(260, 138)">
                  <path d="M0,8 L8,16 L38,16 L44,8 Z" fill="#E53935" />
                  <rect x="14" y="2" width="16" height="7" rx="1" fill="#FFFFFF" />
                  <circle cx="22" cy="5.5" r="2" fill="#0F2D5C" />
                  <line x1="22" y1="0" x2="22" y2="2" stroke="#0F2D5C" strokeWidth="1" />
                  <polygon points="22,0 28,1.5 22,3" fill="#FFD700" />
                </g>

                {/* Signal waves */}
                <path d="M220,45 A40,40 0 0,1 245,65" fill="none" stroke="#1F7A4D" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                <path d="M226,40 A50,50 0 0,1 255,65" fill="none" stroke="#1F7A4D" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
              </svg>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-[#D8E6DD]/60">
                <span className="flex items-center gap-1 text-[#1F7A4D] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#1F7A4D] animate-ping inline-block" />
                  Live Operational Network
                </span>
                <span className="font-mono">National Command Grid</span>
              </div>
            </div>

            {/* 3 Value Pillars */}
            <div className="w-full max-w-sm grid grid-cols-3 gap-2">
              <div className="bg-white/80 border border-[#D8E6DD] rounded-xl p-2.5 text-center shadow-xs">
                <div className="text-base font-extrabold text-[#0F2D5C]">17,500+</div>
                <div className="text-[10px] text-slate-500 font-medium">Villages Analyzed</div>
              </div>
              <div className="bg-white/80 border border-[#D8E6DD] rounded-xl p-2.5 text-center shadow-xs">
                <div className="text-base font-extrabold text-[#1F7A4D]">TOPSIS</div>
                <div className="text-[10px] text-slate-500 font-medium">Multi-Criteria AI</div>
              </div>
              <div className="bg-white/80 border border-[#D8E6DD] rounded-xl p-2.5 text-center shadow-xs">
                <div className="text-base font-extrabold text-[#0F2D5C]">NDMA</div>
                <div className="text-[10px] text-slate-500 font-medium">Standard Compliant</div>
              </div>
            </div>

          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* RIGHT PANEL — 60%                          */}
          {/* ═══════════════════════════════════════════ */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl border border-[#D8E6DD] shadow-xl p-6 sm:p-8 lg:p-10 relative">

              {/* Card Header */}
              <div className="flex items-start justify-between pb-5 border-b border-[#D8E6DD]/80 mb-6 flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#0F2D5C]">
                      Government Officer Authentication
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EAF4EE] border border-[#1F7A4D]/30 text-[#1F7A4D] text-[10px] font-bold">
                      <ShieldCheck className="w-3 h-3 text-[#1F7A4D]" />
                      Official MHA Portal
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Secure single sign-on access to the National Disaster Command Center
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF4EE] text-[#1F7A4D] text-xs font-semibold">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Restricted Access</span>
                </div>
              </div>

              {/* Form Error Alert */}
              {formError && (
                <div className="mb-5 flex items-center gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* ── Form ── */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">

                {/* Officer ID */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#0F2D5C]">
                      Government Officer ID <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">e.g. APCOLL001</span>
                  </div>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="gov-officer-id"
                      type="text"
                      value={officerId}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setOfficerId(val);
                        doValidateOfficerId(val);
                      }}
                      placeholder="Enter Officer ID (e.g. APCOLL001)"
                      className={`w-full pl-9 pr-9 py-2.5 rounded-xl border text-sm font-mono tracking-wider transition-all outline-none
                        ${officerIdError ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200'
                          : officerIdOk ? 'border-[#1F7A4D]/60 bg-[#EAF4EE]/50 focus:ring-2 focus:ring-[#1F7A4D]/30'
                          : 'border-[#D8E6DD] focus:border-[#1F7A4D] focus:ring-2 focus:ring-[#1F7A4D]/20'}`}
                    />
                    {officerIdOk && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1F7A4D]" />}
                    {officerIdError && <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />}
                  </div>
                  {officerIdError && <p className="text-[11px] text-red-500 mt-1">{officerIdError}</p>}
                </div>

                {/* Official Government Email */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#0F2D5C]">
                      Official Government Email <span className="text-red-500">*</span>
                    </label>
                    {isDemoEmail && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        Demo Evaluation Account
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="gov-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        doValidateEmail(e.target.value, officerId);
                      }}
                      placeholder="officer@mha.gov.in / shivasaranya186@gmail.com"
                      className={`w-full pl-9 pr-9 py-2.5 rounded-xl border text-sm transition-all outline-none
                        ${emailError ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200'
                          : emailOk ? 'border-[#1F7A4D]/60 bg-[#EAF4EE]/50 focus:ring-2 focus:ring-[#1F7A4D]/30'
                          : 'border-[#D8E6DD] focus:border-[#1F7A4D] focus:ring-2 focus:ring-[#1F7A4D]/20'}`}
                    />
                    {emailOk && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1F7A4D]" />}
                    {emailError && <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />}
                  </div>
                  {emailError && <p className="text-[11px] text-red-500 mt-1">{emailError}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-[#0F2D5C] mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="gov-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        doValidatePassword(e.target.value, officerId);
                      }}
                      placeholder="Enter password"
                      className={`w-full pl-9 pr-16 py-2.5 rounded-xl border text-sm transition-all outline-none
                        ${passwordError ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200'
                          : passwordOk ? 'border-[#1F7A4D]/60 bg-[#EAF4EE]/50 focus:ring-2 focus:ring-[#1F7A4D]/30'
                          : 'border-[#D8E6DD] focus:border-[#1F7A4D] focus:ring-2 focus:ring-[#1F7A4D]/20'}`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      {passwordOk && <Check className="w-4 h-4 text-[#1F7A4D]" />}
                      {passwordError && <X className="w-4 h-4 text-red-400" />}
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {passwordError && <p className="text-[11px] text-red-500 mt-1">{passwordError}</p>}
                </div>

                {/* Department + State (2 col) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F2D5C] mb-1">Department</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <select
                        id="gov-department"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-[#D8E6DD] text-xs bg-white focus:border-[#1F7A4D] focus:ring-2 focus:ring-[#1F7A4D]/20 outline-none appearance-none cursor-pointer">
                        {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0F2D5C] mb-1">State</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <select
                        id="gov-state"
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-[#D8E6DD] text-xs bg-white focus:border-[#1F7A4D] focus:ring-2 focus:ring-[#1F7A4D]/20 outline-none appearance-none cursor-pointer">
                        {ALL_STATES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* District */}
                <div>
                  <label className="block text-xs font-semibold text-[#0F2D5C] mb-1">District</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <select
                      id="gov-district"
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-[#D8E6DD] text-sm bg-white focus:border-[#1F7A4D] focus:ring-2 focus:ring-[#1F7A4D]/20 outline-none appearance-none cursor-pointer">
                      {AP_DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                {/* ── EMAIL VERIFICATION SECTION (RENAMED FROM FIREBASE OTP) ── */}
                <div className={`rounded-2xl border p-4 transition-all
                  ${otpVerified ? 'bg-[#EAF4EE] border-[#1F7A4D]/50'
                    : 'bg-[#F8F7F3] border-[#D8E6DD]'}`}>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {otpVerified
                        ? <ShieldCheck className="w-4 h-4 text-[#1F7A4D]" />
                        : <Mail className="w-4 h-4 text-[#0F2D5C]" />}
                      <span className="text-xs font-bold text-[#0F2D5C]">
                        {otpVerified ? 'Email Verified · Secure Access Granted' : 'Email Verification'}
                      </span>
                    </div>

                    {!otpVerified && (
                      <button
                        type="button"
                        id="send-otp-btn"
                        onClick={handleSendOtp}
                        disabled={!isSendOtpEnabled}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all
                          ${!isSendOtpEnabled
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            : otpSent
                            ? 'bg-[#EAF4EE] text-[#1F7A4D] border border-[#1F7A4D]/50 hover:bg-[#d8f0e6] cursor-pointer'
                            : 'bg-[#1F7A4D] text-white hover:bg-[#165a38] cursor-pointer shadow-sm shadow-[#1F7A4D]/30'}`}>
                        {isSendingOtp ? (
                          <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending Code...</>
                        ) : otpSent && otpCountdown > 0 ? (
                          <><RefreshCw className="w-3.5 h-3.5" /> Resend ({otpCountdown}s)</>
                        ) : otpSent ? (
                          <><RefreshCw className="w-3.5 h-3.5" /> Resend Secure OTP</>
                        ) : (
                          <><Send className="w-3.5 h-3.5" /> Send Secure OTP</>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Feedback Message */}
                  {otpSuccess && (
                    <div className="mb-3 flex items-center gap-2 text-[11px] text-[#1F7A4D] bg-green-50 border border-green-200 rounded-lg px-3 py-2 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{otpSuccess}</span>
                    </div>
                  )}
                  {otpError && (
                    <div className="mb-3 flex items-center gap-2 text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{otpError}</span>
                    </div>
                  )}

                  {/* OTP 6-Digit Inputs */}
                  {otpSent && !otpVerified && (
                    <div className="my-2">
                      <div className="flex gap-2 justify-center my-2" id="otp-input-row">
                        {otpDigits.map((d, i) => (
                          <input
                            key={i}
                            id={`otp-digit-${i}`}
                            ref={(el) => { otpRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={d}
                            onChange={(e) => handleOtpChange(i, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                            className={`w-10 h-11 sm:w-11 sm:h-12 text-center text-lg font-bold rounded-xl border-2 outline-none transition-all
                              ${otpVerified ? 'border-[#1F7A4D] bg-[#EAF4EE] text-[#1F7A4D]'
                                : d ? 'border-[#1F7A4D]/70 bg-[#EAF4EE]/60 text-[#0F2D5C]'
                                : 'border-[#D8E6DD] bg-white focus:border-[#1F7A4D] focus:ring-2 focus:ring-[#1F7A4D]/25'}`}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500 text-center mt-1">
                        Code valid for 5 minutes. Check your registered official email inbox.
                      </p>
                    </div>
                  )}

                  {!otpSent && (
                    <p className="text-[11px] text-slate-500 text-center">
                      We&apos;ll send a secure verification code to your registered official email.
                    </p>
                  )}
                </div>

                {/* Authorization Checkbox */}
                <label id="auth-checkbox-label" className="flex items-start gap-3 cursor-pointer group">
                  <div onClick={() => setAuthorized(!authorized)}
                    className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all
                      ${authorized ? 'bg-[#1F7A4D] border-[#1F7A4D]' : 'border-[#D8E6DD] bg-white group-hover:border-[#1F7A4D]/50'}`}>
                    {authorized && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                  <span className="text-xs text-slate-600 leading-relaxed">
                    I confirm I am an <strong className="text-[#0F2D5C]">authorized Government Official</strong> accessing
                    this system for official disaster management purposes under the Ministry of Home Affairs, Government of India.
                  </span>
                </label>

                {/* Login Button - Disabled until OTP is verified */}
                <button
                  type="submit"
                  id="login-submit-btn"
                  disabled={!isLoginEnabled}
                  className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all
                    ${isLoginEnabled
                      ? 'bg-[#0F2D5C] hover:bg-[#1F7A4D] text-white shadow-lg shadow-[#0F2D5C]/30 cursor-pointer hover:shadow-[#1F7A4D]/30 hover:scale-[1.01]'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                  <ShieldCheck className="w-4.5 h-4.5" />
                  LOGIN TO COMMAND CENTER
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Support Links */}
                <div className="flex items-center justify-center gap-4 pt-1 flex-wrap">
                  {[
                    { icon: KeyRound, label: 'Forgot Password', modal: 'forgot' as const },
                    { icon: PhoneCall, label: 'Contact District Administrator', modal: 'contact' as const },
                    { icon: HelpCircle, label: 'Help & Support', modal: 'help' as const },
                  ].map(({ icon: Icon, label, modal }) => (
                    <button key={label} type="button" onClick={() => setActiveModal(modal)}
                      className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-[#0F2D5C] transition-colors cursor-pointer">
                      <Icon className="w-3 h-3" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>

              </form>
            </div>
          </div>

        </div>

        {/* ─── SECURITY FOOTER PANEL ─────────────────────────────────────── */}
        <div className="mt-8 bg-white/80 border border-[#D8E6DD] rounded-2xl p-4 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#EAF4EE] flex items-center justify-center flex-shrink-0 text-[#1F7A4D]">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-[#0F2D5C]">National Cyber Security Compliant</p>
                <p className="text-[11px] text-slate-500">Official communications protected by TLS 1.3 end-to-end encryption</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#EAF4EE] flex items-center justify-center flex-shrink-0 text-[#1F7A4D]">
                <Radio className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-[#0F2D5C]">Two-Factor Authentication (2FA)</p>
                <p className="text-[11px] text-slate-500">Dynamic 5-minute verification code delivered to authorized Government email</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#EAF4EE] flex items-center justify-center flex-shrink-0 text-[#1F7A4D]">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-[#0F2D5C]">IT Act 2000 &amp; MHA Guidelines</p>
                <p className="text-[11px] text-slate-500">Official audit logging and role-based jurisdictional command clearance</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="relative z-10 w-full bg-[#0F2D5C] text-white/80 py-4 px-4 text-xs mt-auto">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#1F7A4D]" />
            <span className="font-bold text-white tracking-wide">RAKSHA SETHU</span>
            <span className="text-white/40">·</span>
            <span className="text-white/70">Smart India Hackathon 2026 · Problem Statement SIH26191</span>
          </div>
          <div className="flex items-center gap-4 text-white/60 text-[11px] flex-wrap">
            <span>Ministry of Home Affairs</span>
            <span>·</span>
            <span>National Disaster Management Authority</span>
            <span>·</span>
            <span>Govt. of India</span>
          </div>
        </div>
      </footer>

      {/* ─── MODALS (OFFICIAL ONLY) ────────────────────────────────────────── */}
      {activeModal && (
        <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#D8E6DD] w-full max-w-md overflow-hidden">

            {/* Forgot Password Modal */}
            {activeModal === 'forgot' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-[#0F2D5C]" />
                    <h3 className="font-bold text-[#0F2D5C]">Forgot Password</h3>
                  </div>
                  <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
                </div>
                <div className="bg-[#EAF4EE] rounded-xl p-4 text-sm text-[#0F2D5C]">
                  <p className="font-semibold mb-2">Password Reset Protocol:</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-600 text-xs">
                    <li>Contact your designated District IT Administrator</li>
                    <li>Verify identity with official Government credentials</li>
                    <li>Submit reset authorization through departmental channels</li>
                    <li>Temporary access credentials will be issued securely</li>
                  </ol>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  National Emergency IT Helpline: <strong>1800-11-1111</strong>
                </p>
                <button onClick={() => setActiveModal(null)}
                  className="w-full mt-4 py-2 rounded-lg bg-[#0F2D5C] text-white text-sm font-bold cursor-pointer hover:bg-[#1F7A4D] transition-colors">
                  Close
                </button>
              </div>
            )}

            {/* Contact Admin Modal */}
            {activeModal === 'contact' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-5 h-5 text-[#0F2D5C]" />
                    <h3 className="font-bold text-[#0F2D5C]">Contact District Administrator</h3>
                  </div>
                  <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="bg-[#EAF4EE] rounded-lg p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1F7A4D]/20 flex items-center justify-center">
                      <PhoneCall className="w-4 h-4 text-[#1F7A4D]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#0F2D5C]">MHA Emergency IT Desk</p>
                      <p>1800-11-1111 (Toll Free)</p>
                    </div>
                  </div>
                  <div className="bg-[#EAF4EE] rounded-lg p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1F7A4D]/20 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-[#1F7A4D]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#0F2D5C]">Departmental IT Support</p>
                      <p>helpdesk@mha.gov.in</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => setActiveModal(null)}
                  className="w-full mt-4 py-2 rounded-lg bg-[#0F2D5C] text-white text-sm font-bold cursor-pointer hover:bg-[#1F7A4D] transition-colors">
                  Close
                </button>
              </div>
            )}

            {/* Help Modal */}
            {activeModal === 'help' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-[#0F2D5C]" />
                    <h3 className="font-bold text-[#0F2D5C]">Help &amp; Support</h3>
                  </div>
                  <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-3 text-xs text-slate-600">
                  <div className="bg-[#EAF4EE] rounded-lg p-3">
                    <p className="font-semibold text-[#0F2D5C] mb-1">Official Demonstration Mode</p>
                    <p>Use the Autofill buttons in the top banner to quickly evaluate authorized accounts.</p>
                  </div>
                  <div className="bg-[#EAF4EE] rounded-lg p-3">
                    <p className="font-semibold text-[#0F2D5C] mb-1">Demonstration Account</p>
                    <p>Officer ID: <strong>APCOLL001</strong> · Email: <strong>shivasaranya186@gmail.com</strong></p>
                  </div>
                  <div className="bg-[#EAF4EE] rounded-lg p-3">
                    <p className="font-semibold text-[#0F2D5C] mb-1">Two-Factor Authentication Flow</p>
                    <p>Click &quot;Send Secure OTP&quot; to receive your 6-digit verification code. Once verified, Command Center access will unlock.</p>
                  </div>
                </div>
                <button onClick={() => setActiveModal(null)}
                  className="w-full mt-4 py-2 rounded-lg bg-[#0F2D5C] text-white text-sm font-bold cursor-pointer hover:bg-[#1F7A4D] transition-colors">
                  Close
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default GovernmentLoginPage;

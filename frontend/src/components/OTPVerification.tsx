import React, { useState, useEffect, useRef } from 'react';
import { verifyOtp, cleanupExpiredOtps, generateOtp, storeOtp, sendOtpEmail } from '../services/emailOtp';
import { toast } from 'react-hot-toast';

interface OTPVerificationProps {
  officerId: string;
  email: string;
  name: string; // officer name for email template
  onVerified: () => void;
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({ officerId, email, name, onVerified }) => {
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const [timer, setTimer] = useState<number>(300); // 5 minutes in seconds
  const [resendCooldown, setResendCooldown] = useState<number>(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Countdown for OTP expiry
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  // Countdown for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const handleChange = (idx: number, val: string) => {
    if (!/^[0-9]?$/.test(val)) return; // only digits
    const newDigits = [...otpDigits];
    newDigits[idx] = val;
    setOtpDigits(newDigits);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    // Auto‑verify when all digits entered
    if (newDigits.every((d) => d !== '')) {
      verifyCode(newDigits.join(''));
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const paste = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(paste)) return;
    const digits = paste.split('');
    setOtpDigits(digits);
    otpRefs.current[5]?.focus();
    verifyCode(paste);
  };

  const verifyCode = async (code: string) => {
    setIsVerifying(true);
    const res = await verifyOtp(officerId, code);
    setIsVerifying(false);
    if (res.success) {
      toast.success('Email Verified Successfully.');
      onVerified();
    } else {
      toast.error(res.error ?? 'Verification failed.');
      // Reset OTP fields on failure
      setOtpDigits(Array(6).fill(''));
      otpRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    // Cleanup any lingering OTPs first
    await cleanupExpiredOtps();
    const otp = generateOtp();
    await storeOtp(officerId, email, otp);
    const sendRes = await sendOtpEmail(email, otp, name);
    if (sendRes.success) {
      toast.success('Verification code sent to your registered email.');
      setTimer(300);
      setResendCooldown(30);
      setOtpDigits(Array(6).fill(''));
      otpRefs.current[0]?.focus();
    } else {
      toast.error('Unable to send verification code. Please try again.');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="mt-6">
      <p className="text-sm text-gray-700 mb-2">Enter the 6‑digit verification code sent to your email.</p>
      <div className="flex space-x-2 justify-center">
        {otpDigits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (otpRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className="w-10 h-10 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={timer <= 0}
          />
        ))}
      </div>
      <div className="mt-3 text-center text-sm text-gray-600">
        {timer > 0 ? (
          <span>Code expires in {formatTime(timer)}</span>
        ) : (
          <span className="text-red-600">Verification Code Expired.</span>
        )}
      </div>
      <div className="mt-2 text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className={`px-4 py-2 rounded ${resendCooldown > 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white`}
        >
          {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend OTP'}
        </button>
      </div>
      {isVerifying && <p className="mt-2 text-center text-sm text-gray-500">Verifying...</p>}
    </div>
  );
};

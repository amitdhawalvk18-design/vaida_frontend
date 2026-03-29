import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Phone, ArrowRight, Loader2, Shield, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import LanguageSelector from '../components/ui/LanguageSelector';
import { apiLogin, apiRegister } from '../lib/api';
import type { UserRole } from '../types';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUser, setRole } = useApp();

  const [step, setStep] = useState<'phone' | 'otp' | 'role' | 'language'>('language');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    try {
      await apiLogin(phone, otp);
      setUser({
        id: crypto.randomUUID(),
        phone_hash: 'hashed',
        name_encrypted: name || 'Patient',
        lang_preference: 'en',
        role: selectedRole,
        district: 'Jaipur',
        consent_tx_hash: null,
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
      });
      setRole(selectedRole);
      localStorage.setItem('userRole', selectedRole);
      navigate('/');
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  const roles: { role: UserRole; emoji: string; label: string }[] = [
    { role: 'patient', emoji: '🏥', label: t('auth.patient') },
    { role: 'asha', emoji: '👩‍⚕️', label: t('auth.asha') },
    { role: 'doctor', emoji: '🩺', label: t('auth.doctor') },
  ];

  return (
    <div className="min-h-screen bg-vaida-dark flex flex-col">
      {/* Brand Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-16 pb-8 px-6 text-center"
      >
        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-20 h-20 mx-auto rounded-3xl bg-vaida-teal flex items-center justify-center mb-4"
        >
          <Heart size={36} className="text-white" />
        </motion.div>
        <h1 className="text-3xl font-bold text-white">
          <span className="text-vaida-teal-mid">V</span>AIDA
        </h1>
        <p className="text-white/50 text-sm mt-1">{t('app.tagline')}</p>
      </motion.div>

      {/* Form Card */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-12"
      >
        {/* Language Step */}
        {step === 'language' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold">{t('auth.selectLanguage')}</h2>
              <p className="text-sm text-vaida-text-muted mt-1">Choose your preferred language</p>
            </div>
            <LanguageSelector />
            <button onClick={() => setStep('role')} className="btn-primary w-full flex items-center justify-center gap-2">
              {t('common.next')} <ArrowRight size={16} />
            </button>
          </motion.div>
        )}

        {/* Role Step */}
        {step === 'role' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold">{t('auth.selectRole')}</h2>
            </div>
            <div className="space-y-3">
              {roles.map(({ role, emoji, label }) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                    selectedRole === role
                      ? 'border-vaida-teal bg-vaida-teal-light'
                      : 'border-vaida-bg2 hover:border-vaida-teal-mid/30'
                  }`}
                >
                  <span className="text-3xl">{emoji}</span>
                  <span className="font-semibold">{label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep('phone')} className="btn-primary w-full flex items-center justify-center gap-2">
              {t('common.next')} <ArrowRight size={16} />
            </button>
          </motion.div>
        )}

        {/* Phone Step */}
        {step === 'phone' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold">{t('auth.register')}</h2>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
              />
              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-vaida-text-hint" />
                <input
                  type="tel"
                  placeholder={t('auth.phone')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field pl-11"
                  maxLength={10}
                />
              </div>
            </div>
            <button
              onClick={() => setStep('otp')}
              disabled={phone.length < 10}
              className="btn-primary w-full"
            >
              {t('auth.sendOtp')}
            </button>
          </motion.div>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold">{t('auth.otp')}</h2>
              <p className="text-sm text-vaida-text-muted mt-1">Sent to +91 {phone}</p>
            </div>
            <div className="flex gap-3 justify-center">
              {[0,1,2,3,4,5].map(i => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  value={otp[i] || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const newOtp = otp.split('');
                    newOtp[i] = val;
                    setOtp(newOtp.join(''));
                    if (val && e.target.nextElementSibling) {
                      (e.target.nextElementSibling as HTMLInputElement).focus();
                    }
                  }}
                  className="w-12 h-14 text-center text-xl font-bold border-2 border-vaida-bg2 rounded-xl focus:border-vaida-teal focus:ring-2 focus:ring-vaida-teal/20 transition-all"
                />
              ))}
            </div>

            {/* Consent */}
            <div className="bg-vaida-teal-light rounded-xl p-3 flex items-start gap-2">
              <Shield size={14} className="text-vaida-teal mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-vaida-teal leading-relaxed">
                By verifying, you consent to DPDPA 2023 data processing for AI-assisted healthcare triage.
              </p>
            </div>

            <button
              onClick={handleLogin}
              disabled={otp.length < 6 || loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {t('auth.verify')}
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

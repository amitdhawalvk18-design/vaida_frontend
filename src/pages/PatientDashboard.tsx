import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Mic, MapPin, Camera, History, UserSearch, AlertTriangle, Wifi, WifiOff, ChevronRight, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';
import LanguageSelector from '../components/ui/LanguageSelector';

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const MotionLink = motion.create(Link);

export default function PatientDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, role, isOnline } = useApp();

  const name = user?.name_encrypted || 'Patient';

  const quickActions = [
    { icon: Mic, label: t('dashboard.voiceIntake'), color: 'bg-vaida-teal', path: '/intake/voice', id: 'voice-intake' },
    { icon: MapPin, label: t('dashboard.bodyMap'), color: 'bg-vaida-purple', path: '/intake/body-map', id: 'body-map' },
    { icon: Camera, label: t('dashboard.imageUpload'), color: 'bg-vaida-coral-mid', path: '/intake/scan', id: 'image-upload' },
    { icon: History, label: t('dashboard.viewHistory'), color: 'bg-vaida-blue', path: '/history', id: 'view-history' },
    { icon: UserSearch, label: t('dashboard.findDoctor'), color: 'bg-vaida-amber', path: '/consult', id: 'find-doctor' },
    { icon: AlertTriangle, label: t('dashboard.emergency'), color: 'bg-urgency-red', path: '/emergency', id: 'emergency' },
  ];

  const recentSessions = [
    { id: '1', date: '2026-03-28', complaint: 'Headache & Nausea', urgency: 'GREEN' as const, confidence: 0.89 },
    { id: '2', date: '2026-03-25', complaint: 'Skin Rash — Left Arm', urgency: 'AMBER' as const, confidence: 0.76 },
    { id: '3', date: '2026-03-20', complaint: 'Chest Discomfort', urgency: 'RED' as const, confidence: 0.94 },
  ];

  const urgencyStyles = {
    GREEN: 'bg-urgency-green-bg text-urgency-green border-urgency-green-border',
    AMBER: 'bg-urgency-amber-bg text-urgency-amber border-urgency-amber-border',
    RED: 'bg-urgency-red-bg text-urgency-red border-urgency-red-border',
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-vaida-dark text-white px-5 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-vaida-teal-mid text-xs font-bold tracking-widest uppercase mb-1"
            >
              {t('app.name')} · {role.toUpperCase()}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-bold"
            >
              {t('dashboard.greeting', { name })}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.2 }}
              className="text-sm mt-1"
            >
              {t('dashboard.subtitle')}
            </motion.p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <LanguageSelector compact />
            <div className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${isOnline ? 'bg-vaida-teal/20 text-vaida-teal-mid' : 'bg-urgency-amber/20 text-urgency-amber'
              }`}>
              {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { label: 'Sessions', value: '12', sub: 'This month' },
            { label: 'Triage', value: '< 3s', sub: 'Avg. response' },
            { label: 'Sync', value: '100%', sub: 'All uploaded' },
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 backdrop-blur rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-vaida-teal-mid">{stat.value}</div>
              <div className="text-[10px] text-white/40">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Quick Actions Grid */}
      <div className="px-5 -mt-4">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-3 gap-3"
        >
          {quickActions.map(({ icon: Icon, label, color, path, id }) => (
            <MotionLink
              key={id}
              to={path}
              id={id}
              variants={fadeUp}
              whileTap={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2.5 shadow-sm border border-vaida-bg2 hover:shadow-md transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-vaida-teal/40"
            >
              <div className={`${color} text-white p-2.5 rounded-xl`}>
                <Icon size={20} />
              </div>
              <span className="text-[11px] font-semibold text-vaida-text text-center leading-tight">{label}</span>
            </MotionLink>
          ))}
        </motion.div>
      </div>

      {/* Recent Sessions */}
      <div className="px-5 mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-vaida-text">{t('dashboard.recentSessions')}</h2>
          <button onClick={() => navigate('/history')} className="text-xs text-vaida-teal-mid font-medium">
            View All
          </button>
        </div>

        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2.5">
          {recentSessions.map((session) => (
            <motion.div
              key={session.id}
              variants={fadeUp}
              className="bg-white rounded-2xl p-4 border border-vaida-bg2 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-shadow"
              onClick={() => navigate('/triage/' + session.id)}
            >
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${session.urgency === 'GREEN' ? 'bg-urgency-green' :
                session.urgency === 'AMBER' ? 'bg-urgency-amber' : 'bg-urgency-red'
                }`} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{session.complaint}</p>
                <p className="text-xs text-vaida-text-hint">{session.date}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${urgencyStyles[session.urgency]}`}>
                {session.urgency}
              </span>
              <ChevronRight size={16} className="text-vaida-text-hint" />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mx-5 mt-6 p-3 bg-vaida-blue-light rounded-xl flex items-start gap-2"
      >
        <Shield size={14} className="text-vaida-blue mt-0.5 flex-shrink-0" />
        <p className="text-[10px] text-vaida-blue leading-relaxed">
          {t('triage.disclaimer')}
        </p>
      </motion.div>
    </div>
  );
}

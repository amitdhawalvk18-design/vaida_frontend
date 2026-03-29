import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CloudOff,
  Home,
  Users,
  Clock,
  TrendingUp,
  Wifi,
  WifiOff,
  MapPin,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import LanguageSelector from '../components/ui/LanguageSelector';
import { useTranslation } from 'react-i18next';

type TriageUrgency = 'GREEN' | 'AMBER' | 'RED';

interface QueuePatient {
  id: string;
  name: string;
  age: number;
  village: string;
  symptom: string;
  urgency: TriageUrgency;
  timeAgo: string;
}

const MOCK_PATIENTS: QueuePatient[] = [
  { id: 'p1', name: 'Sita Devi', age: 42, village: 'Ward 3 - East Hamlet', symptom: 'High fever, body ache', urgency: 'RED', timeAgo: '12 min ago' },
  { id: 'p2', name: 'Ramesh Kumar', age: 67, village: 'Ward 1 - Main Road', symptom: 'Persistent cough, breathlessness', urgency: 'AMBER', timeAgo: '28 min ago' },
  { id: 'p3', name: 'Geeta Sharma', age: 34, village: 'Ward 2 - Anganwadi', symptom: 'Skin rash, no fever', urgency: 'GREEN', timeAgo: '1 hr ago' },
  { id: 'p4', name: 'Vikram Singh', age: 8, village: 'Ward 4 - Canal Road', symptom: 'Child: diarrhea & dehydration risk', urgency: 'AMBER', timeAgo: '2 hr ago' },
  { id: 'p5', name: 'Lakshmi Bai', age: 55, village: 'Ward 3 - Temple Area', symptom: 'Chest pain, dizziness', urgency: 'RED', timeAgo: '3 hr ago' },
];

const urgencyStyles: Record<TriageUrgency, string> = {
  GREEN: 'bg-urgency-green-bg text-urgency-green border-urgency-green-border',
  AMBER: 'bg-urgency-amber-bg text-urgency-amber border-urgency-amber-border',
  RED: 'bg-urgency-red-bg text-urgency-red border-urgency-red-border',
};

const urgencyDot: Record<TriageUrgency, string> = {
  GREEN: 'bg-urgency-green',
  AMBER: 'bg-urgency-amber',
  RED: 'bg-urgency-red',
};

export default function AshaDashboard() {
  const { t } = useTranslation();
  const { user, role, isOnline } = useApp();
  const navigate = useNavigate();
  const name = user?.name_encrypted || 'ASHA Worker';
  const district = user?.district ?? 'Jaipur Rural';

  const [syncing, setSyncing] = useState(false);
  const pendingSyncCount = 3;

  const stats = [
    { label: 'Households Visited', value: '18', sublabel: 'Today', icon: Home, color: 'text-vaida-teal' },
    { label: 'Pending Follow-ups', value: '7', sublabel: 'This week', icon: Clock, color: 'text-vaida-amber' },
    { label: 'High-Priority Alerts', value: '2', sublabel: 'Urgent', icon: AlertTriangle, color: 'text-urgency-red' },
    { label: 'Triage Completed', value: '45', sublabel: 'This month', icon: TrendingUp, color: 'text-vaida-purple' },
  ];

  const handleSync = () => {
    if (!isOnline) {
      toast.error('You are offline. Sync will run when connectivity returns.');
      return;
    }
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      toast.success('All reports synced successfully');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
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
              Hello, {name}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.2 }}
              className="text-sm mt-1 flex items-center gap-1.5"
            >
              <MapPin size={14} />
              {district}
            </motion.p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <LanguageSelector compact />
            <div
              className={`flex items-center gap-1.5 text-[10px] font-medium px-3 py-1.5 rounded-full ${isOnline
                ? 'bg-vaida-teal/20 text-vaida-teal-mid'
                : 'bg-urgency-amber/20 text-urgency-amber'
                }`}
            >
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              {isOnline ? 'Online' : `${pendingSyncCount} Reports Pending Sync`}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4">
        {/* Quick Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.05 }}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <stat.icon size={20} className={stat.color} />
                <span className="text-2xl font-bold text-vaida-text">{stat.value}</span>
              </div>
              <p className="text-xs font-semibold text-vaida-text">{stat.label}</p>
              <p className="text-[10px] text-vaida-text-hint mt-0.5">{stat.sublabel}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Epidemiological Cluster Alert */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6 rounded-2xl border-2 border-urgency-amber bg-urgency-amber-bg/30 overflow-hidden"
        >
          <div className="px-4 py-3 bg-urgency-amber-bg border-b border-urgency-amber-border flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white">
              <AlertTriangle size={18} className="text-urgency-amber" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-vaida-text">Cluster Alert</h3>
              <p className="text-[10px] text-vaida-text-hint">AI-detected outbreak pattern</p>
            </div>
          </div>
          <div className="px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="w-1 h-full bg-urgency-amber rounded-full" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-urgency-amber mb-1">
                  ⚠️ 3 suspected cases of Scabies detected in Sector 4
                </p>
                <p className="text-xs text-vaida-text-muted">
                  Last 48 hours · Symptoms: Severe itching, skin lesions
                </p>
                <button
                  onClick={() => navigate('/epi')}
                  className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-vaida-teal hover:text-vaida-teal-mid transition-colors"
                >
                  View on Map
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Actionable Patient Queue */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-vaida-text">Patient Queue</h2>
              <p className="text-xs text-vaida-text-hint mt-0.5">AI triage urgency · Recent intakes</p>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-vaida-text-hint flex items-center gap-1">
              <Users size={12} />
              {MOCK_PATIENTS.length} Today
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-2.5"
          >
            {MOCK_PATIENTS.map((patient, i) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 + i * 0.05 }}
                className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full mt-1 ${urgencyDot[patient.urgency]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2 mb-1">
                      <span className="font-semibold text-vaida-text">
                        {patient.name}, {patient.age}
                      </span>
                      <span className="text-[11px] text-vaida-text-hint">{patient.timeAgo}</span>
                    </div>
                    <p className="text-xs text-vaida-text-muted mb-2">{patient.village}</p>
                    <p className="text-sm text-vaida-text mb-3">{patient.symptom}</p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${urgencyStyles[patient.urgency]}`}
                      >
                        {patient.urgency}
                      </span>
                      <button
                        onClick={() => navigate(`/triage/${patient.id}`)}
                        className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-vaida-teal hover:text-vaida-teal-mid transition-colors"
                      >
                        <Eye size={14} />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Offline Sync Status */}
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4"
          >
            <div className="flex items-start gap-3 mb-3">
              <CloudOff size={20} className="text-urgency-amber mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-bold text-vaida-text">Offline Mode Active</h3>
                <p className="text-xs text-vaida-text-muted mt-1">
                  {pendingSyncCount} reports pending sync. Data will upload automatically when online.
                </p>
              </div>
            </div>
            <button
              onClick={handleSync}
              disabled={syncing || !isOnline}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-vaida-teal text-white text-sm font-semibold px-4 py-3 hover:bg-vaida-teal-mid active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all"
            >
              <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Force Sync Now'}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CloudOff,
  Link2,
  MapPin,
  RefreshCw,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { EpiCluster, SyncStatus } from '../types';

type TriageUrgency = 'GREEN' | 'AMBER' | 'RED';

interface QueuePatient {
  id: string;
  displayName: string;
  villageWard: string;
  timeLabel: string;
  complaint: string;
  urgency: TriageUrgency;
}

interface MockSyncRow {
  id: string;
  label: string;
  endpoint: string;
  status: SyncStatus;
  createdOfflineLabel: string;
}

const MOCK_QUEUE: QueuePatient[] = [
  {
    id: 'q1',
    displayName: 'Sita ··42',
    villageWard: 'Ward 3 — East hamlet',
    timeLabel: '12 min ago',
    complaint: 'High fever, body ache',
    urgency: 'RED',
  },
  {
    id: 'q2',
    displayName: 'Ramesh ··91',
    villageWard: 'Ward 1',
    timeLabel: '28 min ago',
    complaint: 'Persistent cough, mild breathlessness',
    urgency: 'AMBER',
  },
  {
    id: 'q3',
    displayName: 'Geeta ··07',
    villageWard: 'Ward 2 — Anganwadi',
    timeLabel: '1 hr ago',
    complaint: 'Skin rash, no fever',
    urgency: 'GREEN',
  },
  {
    id: 'q4',
    displayName: 'Vikram ··63',
    villageWard: 'Ward 4 — Canal road',
    timeLabel: '2 hr ago',
    complaint: 'Child: diarrhoea & dehydration risk',
    urgency: 'AMBER',
  },
];

const INITIAL_SYNC: MockSyncRow[] = [
  {
    id: 's1',
    label: 'Voice intake session',
    endpoint: 'POST /intake',
    status: 'queued',
    createdOfflineLabel: 'Today · 09:14',
  },
  {
    id: 's2',
    label: 'Structured symptoms + triage',
    endpoint: 'POST /triage',
    status: 'syncing',
    createdOfflineLabel: 'Today · 09:12',
  },
  {
    id: 's3',
    label: 'Consent artifact',
    endpoint: 'POST /consent',
    status: 'failed',
    createdOfflineLabel: 'Yesterday · 18:40',
  },
  {
    id: 's4',
    label: 'Field photo (skin)',
    endpoint: 'POST /vision/analyze',
    status: 'queued',
    createdOfflineLabel: 'Yesterday · 17:05',
  },
];

const MOCK_EPI_CLUSTERS: EpiCluster[] = [
  {
    id: 'epi-1',
    district: 'Jaipur Rural',
    lat: 26.9,
    lng: 75.7,
    symptom_cluster: ['severe fever', 'myalgia', 'headache'],
    patient_count: 15,
    alert_level: 'high',
  },
  {
    id: 'epi-2',
    district: 'Jaipur Rural',
    lat: 26.85,
    lng: 75.75,
    symptom_cluster: ['acute respiratory', 'cough'],
    patient_count: 8,
    alert_level: 'moderate',
  },
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

const syncStatusStyle: Record<SyncStatus, { pill: string; label: string }> = {
  queued: { pill: 'bg-vaida-bg2 text-vaida-text-muted', label: 'Queued' },
  syncing: { pill: 'bg-vaida-teal-light text-vaida-teal animate-pulse', label: 'Syncing' },
  synced: { pill: 'bg-urgency-green-bg text-urgency-green', label: 'Synced' },
  failed: { pill: 'bg-urgency-red-bg text-urgency-red', label: 'Failed' },
};

const epiLevelCopy: Record<EpiCluster['alert_level'], { bar: string; label: string }> = {
  low: { bar: 'bg-urgency-green', label: 'Watch' },
  moderate: { bar: 'bg-urgency-amber', label: 'Moderate' },
  high: { bar: 'bg-urgency-red', label: 'High' },
  critical: { bar: 'bg-red-600', label: 'Critical' },
};

export default function AshaDashboard() {
  const { user, isOnline } = useApp();
  const navigate = useNavigate();
  const name = user?.name_encrypted || 'ASHA';
  const district = user?.district ?? 'Jaipur Rural';

  const [syncRows, setSyncRows] = useState(INITIAL_SYNC);
  const [forceSyncing, setForceSyncing] = useState(false);

  const pendingCount = useMemo(
    () => syncRows.filter((r) => r.status === 'queued' || r.status === 'failed').length,
    [syncRows],
  );

  const handleForceSync = () => {
    if (!isOnline) {
      toast.error('You are offline. Sync will run when connectivity returns.');
      return;
    }
    setForceSyncing(true);
    setSyncRows((rows) =>
      rows.map((r) => (r.status === 'queued' ? { ...r, status: 'syncing' as const } : r)),
    );

    window.setTimeout(() => {
      setSyncRows((rows) =>
        rows.map((r) => {
          if (r.status === 'syncing') return { ...r, status: 'synced' as const };
          if (r.status === 'failed') return { ...r, status: 'queued' as const };
          return r;
        }),
      );
      setForceSyncing(false);
      toast.success('Queue processed. Items anchored for district reporting.');
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-vaida-bg pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-5 pt-10 md:pt-12 pb-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 md:mb-8">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-3 rounded-2xl bg-vaida-teal-light text-vaida-teal shrink-0">
              <Activity size={24} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-widest uppercase text-vaida-text-hint">
                ASHA · Field dashboard
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-vaida-text truncate">
                Hello, {name}
              </h1>
              <p className="text-sm text-vaida-text-muted flex items-center gap-1.5 mt-1">
                <MapPin size={14} className="shrink-0" />
                <span>{district}</span>
              </p>
            </div>
          </div>
          <div
            className={`flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-xs font-semibold border ${
              isOnline
                ? 'bg-white border-vaida-bg2 text-vaida-teal'
                : 'bg-urgency-amber-bg border-urgency-amber-border text-urgency-amber'
            }`}
          >
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            {isOnline ? 'Online' : 'Offline mode'}
          </div>
        </div>

        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex gap-3 rounded-2xl border border-urgency-amber-border bg-urgency-amber-bg px-4 py-3 text-sm text-urgency-amber"
          >
            <CloudOff className="shrink-0 mt-0.5" size={18} />
            <p>
              Intakes are saved locally. New uploads will join the sync queue automatically when you
              reconnect.
            </p>
          </motion.div>
        )}

        <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start space-y-6 lg:space-y-0">
          {/* Patient queue */}
          <section className="lg:col-span-7 space-y-3">
            <div className="flex items-end justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-vaida-text">Patient queue</h2>
                <p className="text-xs text-vaida-text-hint mt-0.5">
                  Recent village intakes · AI triage urgency
                </p>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-vaida-text-hint flex items-center gap-1">
                <Users size={12} />
                {MOCK_QUEUE.length} today
              </span>
            </div>
            <ul className="space-y-2.5">
              {MOCK_QUEUE.map((p, i) => (
                <motion.li
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-vaida-bg2 p-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm"
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${urgencyDot[p.urgency]}`}
                    aria-hidden
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="font-semibold text-vaida-text">{p.displayName}</span>
                      <span className="text-[11px] text-vaida-text-hint">{p.timeLabel}</span>
                    </div>
                    <p className="text-xs text-vaida-text-muted mt-0.5">{p.villageWard}</p>
                    <p className="text-sm text-vaida-text mt-1 line-clamp-2">{p.complaint}</p>
                  </div>
                  <span
                    className={`self-start sm:self-center text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${urgencyStyles[p.urgency]}`}
                  >
                    {p.urgency}
                  </span>
                </motion.li>
              ))}
            </ul>
          </section>

          {/* Offline sync */}
          <section className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-vaida-bg2 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-vaida-bg2 bg-vaida-bg2/40">
                <h2 className="text-sm font-bold text-vaida-text">Offline sync status</h2>
                <p className="text-[11px] text-vaida-text-hint mt-0.5">
                  Mock · <code className="text-[10px] font-mono">offline_sync_queue</code>
                </p>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-vaida-text-muted">
                    <span className="font-semibold text-vaida-text">{pendingCount}</span> waiting
                    ·{' '}
                    {syncRows.filter((r) => r.status === 'syncing').length > 0 ? '1 active upload' : 'Idle'}
                  </p>
                  <button
                    type="button"
                    disabled={forceSyncing}
                    onClick={handleForceSync}
                    className="inline-flex items-center gap-2 rounded-xl bg-vaida-teal text-white text-xs font-semibold px-4 py-2.5 hover:bg-vaida-teal-mid active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all"
                  >
                    <RefreshCw size={14} className={forceSyncing ? 'animate-spin' : ''} />
                    Force sync
                  </button>
                </div>
                <ul className="space-y-2 max-h-[min(320px,50vh)] overflow-y-auto scrollbar-hide pr-0.5">
                  {syncRows.map((row) => {
                    const st = syncStatusStyle[row.status];
                    return (
                      <li
                        key={row.id}
                        className="rounded-xl border border-vaida-bg2 bg-vaida-bg/80 px-3 py-2.5 text-left"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-vaida-text truncate">{row.label}</p>
                            <p className="text-[10px] font-mono text-vaida-text-hint mt-0.5">
                              {row.endpoint}
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${st.pill}`}>
                            {st.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-vaida-text-hint mt-1.5">{row.createdOfflineLabel}</p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Epi alerts */}
        <section className="mt-6 md:mt-8">
          <div className="rounded-2xl border-2 border-urgency-amber-border bg-gradient-to-br from-urgency-amber-bg to-white overflow-hidden shadow-sm">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-urgency-amber-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-urgency-amber-bg/50">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-white border border-urgency-amber-border text-urgency-amber shrink-0">
                  <AlertTriangle size={22} strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-vaida-text">
                    Epidemiological alerts
                  </h2>
                  <p className="text-xs text-vaida-text-muted mt-0.5">
                    Mock · <code className="font-mono text-[10px]">GET /epi/clusters</code> · {district}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/epi')}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-vaida-teal whitespace-nowrap px-3 py-2 rounded-xl border border-vaida-teal/30 bg-white/80 hover:bg-white transition-colors self-start sm:self-center"
              >
                Open district map
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <div className="flex items-start gap-2 rounded-xl bg-white/90 border border-vaida-bg2 px-3 py-2.5 text-xs text-vaida-text-muted">
                <Link2 size={16} className="text-vaida-teal shrink-0 mt-0.5" />
                <p>
                  Active clusters below trigger <strong className="text-vaida-text">blockchain-anchored</strong>{' '}
                  district alerts (ZK attestation hash recorded on-chain for audit).
                </p>
              </div>

              <ul className="space-y-3">
                {MOCK_EPI_CLUSTERS.map((c) => {
                  const lvl = epiLevelCopy[c.alert_level];
                  return (
                    <li
                      key={c.id}
                      className="rounded-xl border border-vaida-bg2 bg-white p-4 flex flex-col sm:flex-row sm:items-stretch gap-4"
                    >
                      <div className={`w-1 rounded-full shrink-0 ${lvl.bar}`} aria-hidden />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-vaida-text">{c.district}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-vaida-bg2 text-vaida-text-muted">
                            {lvl.label}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-vaida-text leading-snug">
                          {c.patient_count} cases of {c.symptom_cluster.slice(0, 2).join(', ')}
                          {c.symptom_cluster.length > 2 ? '…' : ''} in 72h
                        </p>
                        <p className="text-xs text-vaida-text-hint mt-1">
                          Window rolling · coordinates lat {c.lat.toFixed(2)}, lng {c.lng.toFixed(2)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

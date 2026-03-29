import { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Activity, AlertCircle, ChevronRight, Clock, FileText, FileJson,
  Loader2, Mic, MicOff, Phone, PhoneOff, Send, Stethoscope,
  Thermometer, Heart, Wind, User, Video, Eye, Image as ImageIcon,
} from 'lucide-react';
import clsx from 'clsx';
import { useApp } from '../context/AppContext';
import type { ConsultStatus, DifferentialDiagnosis, UrgencyLevel } from '../types';

type TriageUrgency = Extract<UrgencyLevel, 'AMBER' | 'RED'>;

interface VitalSigns { temp: string; hr: string; spo2: string; rr: string; }
interface ScanImage { id: string; label: string; finding: string; urgency: 'low' | 'medium' | 'high'; }

interface PendingConsult {
  id: string; patientLabel: string; ageSex: string; district: string;
  urgency: TriageUrgency; waitingSince: string; sessionId: string;
  chiefComplaint: string; triageConfidence: number; modelVersion: string;
  differentials: DifferentialDiagnosis[]; pdfBriefSummary: string[];
  vitals: VitalSigns; scanImages: ScanImage[];
  fhirBundle: Record<string, unknown>;
}

const MOCK_QUEUE: PendingConsult[] = [
  {
    id: 'c1', patientLabel: 'Patient ··4821', ageSex: 'F · 34y', district: 'Jaipur Rural',
    urgency: 'RED', waitingSince: '14 min', sessionId: 'ses-a7f3-9c21',
    chiefComplaint: 'Acute onset severe headache with photophobia, neck stiffness, and fever to 39.2°C beginning 8 hours ago.',
    triageConfidence: 0.91, modelVersion: 'vaida-triage-2.4.1',
    vitals: { temp: '39.2°C', hr: '108 bpm', spo2: '97%', rr: '22 /min' },
    scanImages: [
      { id: 'img1', label: 'Neck Region', finding: 'No visible external lesion. Stiffness reported by ASHA.', urgency: 'high' },
      { id: 'img2', label: 'Skin — Torso', finding: 'Faint petechial rash noted. Requires urgent review.', urgency: 'high' },
    ],
    differentials: [
      { condition: 'Meningitis (bacterial vs viral)', probability: 0.42, reasoning: 'Fever + headache + neck stiffness triad; red-flag bundle triggered.' },
      { condition: 'Severe migraine with systemic symptoms', probability: 0.28, reasoning: 'Photophobia common; less typical for rapid fever spike.' },
      { condition: 'Acute sinusitis with referred pain', probability: 0.12, reasoning: 'Lower prior given prominence of meningeal signs.' },
    ],
    pdfBriefSummary: [
      'RED triage — AI confidence 91%. Meningeal symptom cluster with fever.',
      'Suggested immediate clinician review; consider LP if indicated per protocol.',
      'Patient language: HI · intake source: voice + structured review.',
    ],
    fhirBundle: { resourceType: 'Bundle', type: 'document', timestamp: '2026-03-29T08:14:22.000Z' },
  },
  {
    id: 'c2', patientLabel: 'Patient ··9103', ageSex: 'M · 61y', district: 'Jaipur Rural',
    urgency: 'AMBER', waitingSince: '36 min', sessionId: 'ses-b2e8-4410',
    chiefComplaint: 'Progressive exertional dyspnoea and tight substernal discomfort over 5 days; orthopnoea last 48h.',
    triageConfidence: 0.78, modelVersion: 'vaida-triage-2.4.1',
    vitals: { temp: '37.1°C', hr: '92 bpm', spo2: '93%', rr: '26 /min' },
    scanImages: [
      { id: 'img3', label: 'Chest — Anterior', finding: 'Mild visible respiratory effort. No external trauma.', urgency: 'medium' },
    ],
    differentials: [
      { condition: 'Acute coronary syndrome (NSTEMI vs unstable angina)', probability: 0.35, reasoning: 'Substernal tightness with exertional pattern; age and risk warrant ECG/troponin pathway.' },
      { condition: 'Decompensated heart failure', probability: 0.31, reasoning: 'Orthopnoea supports volume overload; overlap with ischaemia possible.' },
      { condition: 'Anxiety-related chest discomfort', probability: 0.14, reasoning: 'Consider only after ACS and HF excluded given amber escalation.' },
    ],
    pdfBriefSummary: [
      'AMBER triage — exertional dyspnoea + chest tightness; HF and ACS in differential.',
      'Recommend structured cardiopulmonary assessment and risk stratification.',
    ],
    fhirBundle: { resourceType: 'Bundle', type: 'document', timestamp: '2026-03-29T07:52:10.000Z' },
  },
  {
    id: 'c3', patientLabel: 'Patient ··7740', ageSex: 'F · 7y', district: 'Jaipur Rural',
    urgency: 'RED', waitingSince: '52 min', sessionId: 'ses-d901-22af',
    chiefComplaint: 'Parent reports rapid breathing, subcostal retractions, and reduced oral intake; onset 12 hours.',
    triageConfidence: 0.88, modelVersion: 'vaida-triage-2.4.1',
    vitals: { temp: '38.4°C', hr: '134 bpm', spo2: '91%', rr: '44 /min' },
    scanImages: [
      { id: 'img4', label: 'Chest — Paediatric', finding: 'Visible subcostal retractions. Nasal flaring present.', urgency: 'high' },
    ],
    differentials: [
      { condition: 'Bronchiolitis / viral lower respiratory infection', probability: 0.46, reasoning: 'Age-typical presentation; monitor work of breathing and SpO2.' },
      { condition: 'Pneumonia', probability: 0.27, reasoning: 'Consider imaging/antibiotics per local paediatric protocol if hypoxic.' },
      { condition: 'Foreign body aspiration', probability: 0.09, reasoning: 'Lower prior without acute choking history.' },
    ],
    pdfBriefSummary: [
      'RED triage — paediatric respiratory distress pattern.',
      'Escalate for paediatric assessment; document SpO2 and feeding.',
    ],
    fhirBundle: { resourceType: 'Bundle', type: 'document', timestamp: '2026-03-29T07:36:00.000Z' },
  },
];

const MEDICATIONS = [
  'Paracetamol 500mg — TDS × 5 days',
  'Amoxicillin 250mg — TDS × 7 days',
  'ORS Sachets — After each loose stool',
  'Cetirizine 10mg — OD × 3 days',
  'Metronidazole 400mg — TDS × 5 days',
  'Salbutamol Inhaler — 2 puffs PRN',
  'Refer to District Hospital — Urgent',
];

const urgencyChip: Record<TriageUrgency, string> = {
  RED: 'bg-urgency-red-bg text-urgency-red border-urgency-red-border',
  AMBER: 'bg-urgency-amber-bg text-urgency-amber border-urgency-amber-border',
};

const scanUrgencyDot: Record<'low' | 'medium' | 'high', string> = {
  low: 'bg-urgency-green', medium: 'bg-urgency-amber', high: 'bg-urgency-red',
};

const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp: Variants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function DoctorDashboard() {
  const { t } = useTranslation();
  const { user, role } = useApp();
  const name = user?.name_encrypted || 'Clinician';

  const [selectedId, setSelectedId] = useState(MOCK_QUEUE[0]?.id ?? '');
  const [briefView, setBriefView] = useState<'pdf' | 'fhir'>('pdf');
  const [consultStatus, setConsultStatus] = useState<ConsultStatus>('pending');
  const [initiating, setInitiating] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [selectedMed, setSelectedMed] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [sending, setSending] = useState(false);

  const selected = useMemo(() => MOCK_QUEUE.find((q) => q.id === selectedId) ?? MOCK_QUEUE[0], [selectedId]);
  const fhirPretty = useMemo(() => (selected ? JSON.stringify(selected.fhirBundle, null, 2) : ''), [selected]);

  const selectConsult = useCallback((id: string) => {
    setSelectedId(id);
    setBriefView('pdf');
    setConsultStatus('pending');
    setCallActive(false);
    setMicMuted(false);
    setSelectedMed('');
    setClinicalNotes('');
  }, []);

  const handleInitiateConsult = () => {
    setInitiating(true);
    setTimeout(() => {
      setConsultStatus('active');
      setCallActive(true);
      setInitiating(false);
      toast.success('Secure consult room opened');
    }, 1000);
  };

  const handleEndCall = () => {
    setCallActive(false);
    setConsultStatus('done');
    toast('Call ended — add prescription below', { icon: '📋' });
  };

  const handleSendToAsha = () => {
    if (!selectedMed && !clinicalNotes.trim()) {
      toast.error('Add a medication or clinical notes before sending.');
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success('Treatment plan sent to ASHA worker');
      setClinicalNotes('');
      setSelectedMed('');
    }, 1400);
  };

  if (!selected) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-vaida-text pb-24">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
          <div>
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-vaida-teal-mid text-xs font-bold tracking-widest uppercase"
            >
              {t('app.name')} · {role?.toUpperCase()}
            </motion.p>
            <h1 className="text-base font-bold text-slate-900">Dr. {name}</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium">
              <Activity size={13} className="text-emerald-500" />
              Live triage feed
            </span>
            <span className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold tabular-nums">
              Queue: <span className="text-slate-900">{MOCK_QUEUE.length}</span>
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto flex flex-col lg:flex-row gap-0 lg:gap-6 px-0 lg:px-5 lg:pt-6">

        {/* ── Sidebar: Priority Queue ── */}
        <aside className="lg:w-72 xl:w-80 shrink-0">
          <div className="bg-white lg:rounded-2xl border-b lg:border border-slate-200 lg:shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Priority Queue</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Sorted by AI severity score</p>
            </div>
            <motion.ul variants={stagger} initial="hidden" animate="show" className="divide-y divide-slate-100">
              {MOCK_QUEUE.map((row) => {
                const isSel = row.id === selected.id;
                return (
                  <motion.li key={row.id} variants={fadeUp}>
                    <button
                      type="button"
                      onClick={() => selectConsult(row.id)}
                      className={clsx(
                        'w-full text-left px-4 py-3 transition-colors border-l-[3px]',
                        'hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-vaida-teal/40',
                        isSel ? 'bg-teal-50/60 border-l-teal-600' : 'border-l-transparent',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <User size={11} className="text-slate-400 shrink-0" />
                            <span className="text-xs font-bold text-slate-900">{row.patientLabel}</span>
                            <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded border', urgencyChip[row.urgency])}>
                              {row.urgency}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500">{row.ageSex} · {row.district}</p>
                          <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-snug">{row.chiefComplaint}</p>
                        </div>
                        <ChevronRight size={14} className={clsx('shrink-0 mt-1', isSel ? 'text-teal-600' : 'text-slate-300')} />
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400">
                        <Clock size={10} />
                        Waiting {row.waitingSince}
                        <span className="ml-auto font-mono text-[9px]">conf. {(row.triageConfidence * 100).toFixed(0)}%</span>
                      </div>
                    </button>
                  </motion.li>
                );
              })}
            </motion.ul>
          </div>
        </aside>

        {/* ── Main Panel ── */}
        <main className="flex-1 min-w-0 px-4 lg:px-0 pt-4 lg:pt-0 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >

              {/* ── Vital Signs ── */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Vital Signs</h2>
                    <p className="text-[10px] text-slate-400 mt-0.5">Reported by ASHA worker on intake</p>
                  </div>
                  <span className={clsx('text-[10px] font-bold px-2.5 py-1 rounded-full border', urgencyChip[selected.urgency])}>
                    {selected.urgency}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100">
                  {[
                    { icon: Thermometer, label: 'Temperature', value: selected.vitals.temp, color: 'text-urgency-red' },
                    { icon: Heart, label: 'Heart Rate', value: selected.vitals.hr, color: 'text-rose-500' },
                    { icon: Activity, label: 'SpO₂', value: selected.vitals.spo2, color: 'text-teal-600' },
                    { icon: Wind, label: 'Resp. Rate', value: selected.vitals.rr, color: 'text-blue-500' },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="px-4 py-4 flex flex-col gap-1">
                      <Icon size={16} className={color} />
                      <span className="text-xl font-bold text-slate-900 tabular-nums">{value}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── AI Analysis + Vision Gallery ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* AI Analysis */}
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">AI Analysis</h2>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 tabular-nums">conf. {(selected.triageConfidence * 100).toFixed(0)}%</span>
                      <span className="text-[9px] font-mono text-slate-300">{selected.modelVersion}</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">Chief Complaint</p>
                      <p className="text-sm text-slate-800 leading-relaxed border-l-2 border-teal-500 pl-3">
                        {selected.chiefComplaint}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Differential Diagnosis</p>
                      <ol className="space-y-2">
                        {selected.differentials.map((d, i) => (
                          <li key={d.condition} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                            <div className="flex items-baseline justify-between gap-2 mb-1">
                              <span className="text-xs font-bold text-slate-900">{i + 1}. {d.condition}</span>
                              <span className="text-[10px] font-mono text-slate-500 tabular-nums shrink-0">
                                {(d.probability * 100).toFixed(0)}%
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-snug">{d.reasoning}</p>
                          </li>
                        ))}
                      </ol>
                    </div>
                    {/* PDF / FHIR toggle */}
                    <div>
                      <div className="flex items-center gap-1 mb-2">
                        <button onClick={() => setBriefView('pdf')} className={clsx('inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors', briefView === 'pdf' ? 'bg-vaida-dark text-white border-vaida-dark' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300')}>
                          <FileText size={11} /> PDF Brief
                        </button>
                        <button onClick={() => setBriefView('fhir')} className={clsx('inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors', briefView === 'fhir' ? 'bg-vaida-dark text-white border-vaida-dark' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300')}>
                          <FileJson size={11} /> FHIR R4
                        </button>
                      </div>
                      <AnimatePresence mode="wait">
                        {briefView === 'pdf' ? (
                          <motion.ul key="pdf" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1.5 text-[11px] text-slate-600 bg-slate-50 rounded-xl border border-slate-100 p-3">
                            {selected.pdfBriefSummary.map((line) => (
                              <li key={line} className="flex gap-2"><span className="text-slate-300">•</span>{line}</li>
                            ))}
                          </motion.ul>
                        ) : (
                          <motion.pre key="fhir" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] font-mono bg-slate-900 text-emerald-300 rounded-xl p-3 overflow-x-auto max-h-40">
                            {fhirPretty}
                          </motion.pre>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </section>

                {/* Vision AI Gallery */}
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Vision AI Gallery</h2>
                    <p className="text-[10px] text-slate-400 mt-0.5">Images uploaded by ASHA worker</p>
                  </div>
                  <div className="p-4 space-y-3">
                    {selected.scanImages.map((img) => (
                      <div key={img.id} className="rounded-xl border border-slate-100 overflow-hidden">
                        <div className="bg-slate-100 h-28 flex items-center justify-center gap-2 text-slate-400">
                          <ImageIcon size={28} strokeWidth={1.5} />
                          <span className="text-xs font-medium">{img.label}</span>
                        </div>
                        <div className="px-3 py-2.5 flex items-start gap-2">
                          <div className={clsx('w-2 h-2 rounded-full mt-1 shrink-0', scanUrgencyDot[img.urgency])} />
                          <p className="text-[11px] text-slate-600 leading-snug">{img.finding}</p>
                        </div>
                      </div>
                    ))}
                    {selected.scanImages.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-slate-300 gap-2">
                        <Eye size={28} strokeWidth={1.5} />
                        <p className="text-xs">No images uploaded for this case</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* ── Tele-Consultation ── */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Tele-Consultation</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5">Secure remote diagnosis session</p>
                </div>
                <div className="p-4">
                  {/* Video placeholder */}
                  <div className={clsx(
                    'rounded-xl h-44 flex flex-col items-center justify-center gap-3 mb-4 transition-colors',
                    callActive ? 'bg-slate-800' : 'bg-slate-900',
                  )}>
                    {callActive ? (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-emerald-400 text-xs font-semibold tracking-wide">LIVE</span>
                        </div>
                        <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center">
                          <User size={28} className="text-slate-400" />
                        </div>
                        <p className="text-slate-400 text-xs">{selected.patientLabel} · {selected.ageSex}</p>
                      </>
                    ) : (
                      <>
                        <Video size={32} className="text-slate-600" strokeWidth={1.5} />
                        <p className="text-slate-500 text-xs">
                          {consultStatus === 'done' ? 'Call ended' : 'No active call'}
                        </p>
                      </>
                    )}
                  </div>
                  {/* Call controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    {!callActive && consultStatus !== 'done' && (
                      <button
                        onClick={handleInitiateConsult}
                        disabled={initiating}
                        className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-60"
                      >
                        {initiating ? <Loader2 size={16} className="animate-spin" /> : <Phone size={16} />}
                        {initiating ? 'Connecting…' : 'Join Call'}
                      </button>
                    )}
                    {callActive && (
                      <>
                        <button
                          onClick={() => setMicMuted((m) => !m)}
                          className={clsx('inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border transition-all', micMuted ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50')}
                        >
                          {micMuted ? <MicOff size={16} /> : <Mic size={16} />}
                          {micMuted ? 'Unmute' : 'Mute'}
                        </button>
                        <button
                          onClick={handleEndCall}
                          className="inline-flex items-center gap-2 bg-urgency-red text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all active:scale-[0.98] hover:opacity-90"
                        >
                          <PhoneOff size={16} />
                          End Call
                        </button>
                      </>
                    )}
                    <span className={clsx(
                      'ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full border',
                      consultStatus === 'pending' && 'bg-amber-50 text-amber-700 border-amber-200',
                      consultStatus === 'active' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      consultStatus === 'done' && 'bg-slate-100 text-slate-500 border-slate-200',
                    )}>
                      <AlertCircle size={10} className="inline mr-1" />
                      {consultStatus.toUpperCase()}
                    </span>
                  </div>
                </div>
              </section>

              {/* ── Prescription & Action Center ── */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Prescription & Action Center</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5">Treatment plan synced to ASHA worker in the field</p>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      <Stethoscope size={12} className="inline mr-1.5 text-teal-600" />
                      Select Medication
                    </label>
                    <select
                      value={selectedMed}
                      onChange={(e) => setSelectedMed(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all"
                    >
                      <option value="">— Choose medication —</option>
                      {MEDICATIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      <FileText size={12} className="inline mr-1.5 text-teal-600" />
                      Clinical Notes
                    </label>
                    <textarea
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      rows={4}
                      placeholder="Add diagnosis, follow-up instructions, referral notes…"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all resize-none"
                    />
                  </div>
                  <button
                    onClick={handleSendToAsha}
                    disabled={sending}
                    className="w-full inline-flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold px-5 py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-60 shadow-sm"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {sending ? 'Sending to ASHA…' : 'Send to ASHA Worker'}
                  </button>
                </div>
              </section>

            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

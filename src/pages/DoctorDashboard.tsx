import React, { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Activity,
  AlertCircle,
  ChevronRight,
  Clock,
  ExternalLink,
  FileJson,
  FileText,
  Loader2,
  Stethoscope,
  User,
  Video,
} from 'lucide-react';
import clsx from 'clsx';
import { useApp } from '../context/AppContext';
import type { ConsultStatus, DifferentialDiagnosis, UrgencyLevel } from '../types';

interface PendingConsult {
  id: string;
  patientLabel: string;
  ageSex: string;
  district: string;
  urgency: Extract<UrgencyLevel, 'AMBER' | 'RED'>;
  waitingSince: string;
  sessionId: string;
  chiefComplaint: string;
  triageConfidence: number;
  modelVersion: string;
  differentials: DifferentialDiagnosis[];
  pdfBriefSummary: string[];
  fhirBundle: Record<string, unknown>;
}

const MOCK_QUEUE: PendingConsult[] = [
  {
    id: 'c1',
    patientLabel: 'Patient ··4821',
    ageSex: 'F · 34y',
    district: 'Jaipur Rural',
    urgency: 'RED',
    waitingSince: '14 min',
    sessionId: 'ses-a7f3-9c21',
    chiefComplaint:
      'Acute onset severe headache with photophobia, neck stiffness, and fever to 39.2°C beginning 8 hours ago.',
    triageConfidence: 0.91,
    modelVersion: 'vaida-triage-2.4.1',
    differentials: [
      {
        condition: 'Meningitis (bacterial vs viral)',
        probability: 0.42,
        reasoning:
          'Fever + headache + neck stiffness triad; red-flag bundle triggered. Rule out bacterial meningitis urgently.',
      },
      {
        condition: 'Severe migraine with systemic symptoms',
        probability: 0.28,
        reasoning: 'Photophobia common; less typical for rapid fever spike without prior migraine history.',
      },
      {
        condition: 'Acute sinusitis with referred pain',
        probability: 0.12,
        reasoning: 'Lower prior given prominence of meningeal signs on intake narrative.',
      },
    ],
    pdfBriefSummary: [
      'RED triage — AI confidence 91%. Meningeal symptom cluster with fever.',
      'Suggested immediate clinician review; consider LP if indicated per protocol.',
      'Patient language: HI · intake source: voice + structured review.',
    ],
    fhirBundle: {
      resourceType: 'Bundle',
      type: 'document',
      timestamp: '2026-03-29T08:14:22.000Z',
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            id: 'pat-masked-4821',
            gender: 'female',
            birthDate: '1992-04-18',
            address: [{ district: 'Jaipur Rural', state: 'RJ', country: 'IN' }],
          },
        },
        {
          resource: {
            resourceType: 'Encounter',
            status: 'in-progress',
            class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'VR', display: 'virtual' },
            subject: { reference: 'Patient/pat-masked-4821' },
            period: { start: '2026-03-29T08:00:00.000Z' },
          },
        },
        {
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: {
              coding: [
                {
                  system: 'http://snomed.info/sct',
                  code: '25064002',
                  display: 'Headache',
                },
              ],
            },
            valueString: 'Severe; sudden onset; with photophobia',
            encounter: { reference: 'Encounter/intake-a7f3' },
          },
        },
      ],
    },
  },
  {
    id: 'c2',
    patientLabel: 'Patient ··9103',
    ageSex: 'M · 61y',
    district: 'Jaipur Rural',
    urgency: 'AMBER',
    waitingSince: '36 min',
    sessionId: 'ses-b2e8-4410',
    chiefComplaint:
      'Progressive exertional dyspnoea and tight substernal discomfort over 5 days; orthopnoea last 48h.',
    triageConfidence: 0.78,
    modelVersion: 'vaida-triage-2.4.1',
    differentials: [
      {
        condition: 'Acute coronary syndrome (NSTEMI vs unstable angina)',
        probability: 0.35,
        reasoning: 'Substernal tightness with exertional pattern; age and risk warrant ECG/troponin pathway.',
      },
      {
        condition: 'Decompensated heart failure',
        probability: 0.31,
        reasoning: 'Orthopnoea supports volume overload; overlap with ischaemia possible.',
      },
      {
        condition: 'Anxiety-related chest discomfort',
        probability: 0.14,
        reasoning: 'Consider only after ACS and HF excluded given amber escalation.',
      },
    ],
    pdfBriefSummary: [
      'AMBER triage — exertional dyspnoea + chest tightness; HF and ACS in differential.',
      'Recommend structured cardiopulmonary assessment and risk stratification.',
    ],
    fhirBundle: {
      resourceType: 'Bundle',
      type: 'document',
      timestamp: '2026-03-29T07:52:10.000Z',
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            id: 'pat-masked-9103',
            gender: 'male',
            birthDate: '1965-01-22',
          },
        },
        {
          resource: {
            resourceType: 'Condition',
            clinicalStatus: {
              coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }],
            },
            code: {
              text: 'Exertional dyspnoea; substernal chest tightness',
            },
            subject: { reference: 'Patient/pat-masked-9103' },
          },
        },
      ],
    },
  },
  {
    id: 'c3',
    patientLabel: 'Patient ··7740',
    ageSex: 'F · 7y',
    district: 'Jaipur Rural',
    urgency: 'RED',
    waitingSince: '52 min',
    sessionId: 'ses-d901-22af',
    chiefComplaint:
      'Parent reports rapid breathing, subcostal retractions, and reduced oral intake; onset 12 hours.',
    triageConfidence: 0.88,
    modelVersion: 'vaida-triage-2.4.1',
    differentials: [
      {
        condition: 'Bronchiolitis / viral lower respiratory infection',
        probability: 0.46,
        reasoning: 'Age-typical presentation; monitor work of breathing and SpO2.',
      },
      {
        condition: 'Pneumonia',
        probability: 0.27,
        reasoning: 'Consider imaging/antibiotics per local paediatric protocol if hypoxic.',
      },
      {
        condition: 'Foreign body aspiration',
        probability: 0.09,
        reasoning: 'Lower prior without acute choking history; retain if course atypical.',
      },
    ],
    pdfBriefSummary: [
      'RED triage — paediatric respiratory distress pattern.',
      'Escalate for paediatric assessment; document SpO2 and feeding.',
    ],
    fhirBundle: {
      resourceType: 'Bundle',
      type: 'document',
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            id: 'pat-masked-7740',
            birthDate: '2019-06-01',
          },
        },
        {
          resource: {
            resourceType: 'Observation',
            code: { text: 'Respiratory rate' },
            valueQuantity: { value: 44, unit: '/min', system: 'http://unitsofmeasure.org', code: '/min' },
          },
        },
      ],
    },
  },
];

const urgencyChip: Record<'AMBER' | 'RED', string> = {
  RED: 'bg-urgency-red-bg text-urgency-red border-urgency-red-border',
  AMBER: 'bg-urgency-amber-bg text-urgency-amber border-urgency-amber-border',
};

export default function DoctorDashboard() {
  const { user } = useApp();
  const name = user?.name_encrypted || 'Clinician';

  const [selectedId, setSelectedId] = useState(MOCK_QUEUE[0]?.id ?? '');
  const [briefView, setBriefView] = useState<'pdf' | 'fhir'>('pdf');
  const [consultStatus, setConsultStatus] = useState<ConsultStatus>('pending');
  const [jitsiRoomUrl, setJitsiRoomUrl] = useState<string | null>(null);
  const [initiating, setInitiating] = useState(false);

  const selected = useMemo(
    () => MOCK_QUEUE.find((q) => q.id === selectedId) ?? MOCK_QUEUE[0],
    [selectedId],
  );

  const fhirPretty = useMemo(
    () => (selected ? JSON.stringify(selected.fhirBundle, null, 2) : ''),
    [selected],
  );

  const selectConsult = useCallback((id: string) => {
    setSelectedId(id);
    setBriefView('pdf');
    setConsultStatus('pending');
    setJitsiRoomUrl(null);
  }, []);

  const handleInitiateConsult = () => {
    if (consultStatus === 'active' && jitsiRoomUrl) {
      window.open(jitsiRoomUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    setInitiating(true);
    window.setTimeout(() => {
      const room = `vaida-${selected?.sessionId.replace(/[^a-z0-9]/gi, '').slice(0, 12) ?? 'room'}-${Math.random().toString(36).slice(2, 8)}`;
      const url = `https://meet.jit.si/${room}`;
      setJitsiRoomUrl(url);
      setConsultStatus('active');
      setInitiating(false);
      toast.success('Consult room ready (mock POST /consult/initiate)');
    }, 900);
  };

  if (!selected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6f8] text-vaida-text-muted text-sm">
        No pending consults
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef1f4] text-vaida-text pb-24">
      {/* Top bar — clinical enterprise */}
      <header className="sticky top-0 z-20 border-b border-slate-200/90 bg-white/95 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-4 md:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-vaida-dark text-white shrink-0">
              <Stethoscope size={18} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Vaida · Clinician console
              </p>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                Dr. {name}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono">
              <Activity size={12} className="text-emerald-600" />
              Live triage feed
            </span>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-medium tabular-nums">
              Queue: <strong className="text-slate-900">{MOCK_QUEUE.length}</strong>
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row lg:items-stretch min-h-[calc(100vh-7rem)]">
        {/* Pending consults — sidebar / list */}
        <aside
          className={clsx(
            'shrink-0 border-slate-200 bg-white lg:border-r',
            'lg:w-[min(100%,20rem)] xl:w-80',
          )}
        >
          <div className="sticky top-[52px] lg:top-[49px] z-10 flex items-center justify-between border-b border-slate-100 px-3 py-2 bg-slate-50/90">
            <h2 className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
              Pending consults
            </h2>
            <span className="text-[10px] font-mono text-slate-400">AMBER / RED</span>
          </div>
          <ul className="max-h-[40vh] lg:max-h-none lg:h-[calc(100vh-8rem)] overflow-y-auto divide-y divide-slate-100">
            {MOCK_QUEUE.map((row) => {
              const isSel = row.id === selected.id;
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => selectConsult(row.id)}
                    className={clsx(
                      'w-full text-left px-3 py-2.5 transition-colors',
                      'hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-vaida-teal/40',
                      isSel && 'bg-vaida-teal-light/60 border-l-[3px] border-l-vaida-teal',
                      !isSel && 'border-l-[3px] border-l-transparent',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <User size={12} className="text-slate-400 shrink-0" />
                          <span className="text-xs font-semibold text-slate-900 truncate">
                            {row.patientLabel}
                          </span>
                          <span
                            className={clsx(
                              'text-[9px] font-bold px-1.5 py-0 rounded border',
                              urgencyChip[row.urgency],
                            )}
                          >
                            {row.urgency}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {row.ageSex} · {row.district}
                        </p>
                        <p className="text-[10px] text-slate-600 mt-1 line-clamp-2 leading-snug">
                          {row.chiefComplaint}
                        </p>
                      </div>
                      <ChevronRight
                        size={14}
                        className={clsx('shrink-0 mt-0.5', isSel ? 'text-vaida-teal' : 'text-slate-300')}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                      <Clock size={10} />
                      Waiting {row.waitingSince}
                      <span className="font-mono text-[9px] truncate">{row.sessionId}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Main — AI triage review */}
        <main className="flex-1 min-w-0 flex flex-col bg-[#eef1f4]">
          <div className="flex-1 p-3 sm:p-4 md:p-5 space-y-3">
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 px-3 py-2 bg-slate-50/80">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    AI triage review · Doctor pre-brief
                  </p>
                  <p className="text-xs font-mono text-slate-600 mt-0.5">{selected.sessionId}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={clsx(
                      'text-[10px] font-bold px-2 py-0.5 rounded border',
                      urgencyChip[selected.urgency],
                    )}
                  >
                    {selected.urgency}
                  </span>
                  <span className="text-[10px] text-slate-500 tabular-nums">
                    AI conf. {(selected.triageConfidence * 100).toFixed(0)}%
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">{selected.modelVersion}</span>
                </div>
              </div>

              <div className="p-3 space-y-3">
                <section>
                  <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                    Chief complaint
                  </h3>
                  <p className="text-sm text-slate-800 leading-relaxed border-l-2 border-vaida-teal pl-2.5">
                    {selected.chiefComplaint}
                  </p>
                </section>

                <section>
                  <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                    AI differential diagnosis
                  </h3>
                  <ol className="space-y-2">
                    {selected.differentials.map((d, i) => (
                      <li
                        key={d.condition}
                        className="rounded-md border border-slate-100 bg-slate-50/80 p-2.5 text-xs"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-semibold text-slate-900">
                            {i + 1}. {d.condition}
                          </span>
                          <span className="font-mono text-[10px] text-slate-600 tabular-nums">
                            p = {(d.probability * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-snug">{d.reasoning}</p>
                      </li>
                    ))}
                  </ol>
                </section>

                <section>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Clinical artifact
                    </h3>
                    <div className="inline-flex rounded-md border border-slate-200 p-0.5 bg-slate-50">
                      <button
                        type="button"
                        onClick={() => setBriefView('pdf')}
                        className={clsx(
                          'inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-colors',
                          briefView === 'pdf'
                            ? 'bg-white text-vaida-dark shadow-sm'
                            : 'text-slate-500 hover:text-slate-700',
                        )}
                      >
                        <FileText size={12} />
                        PDF brief
                      </button>
                      <button
                        type="button"
                        onClick={() => setBriefView('fhir')}
                        className={clsx(
                          'inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-colors',
                          briefView === 'fhir'
                            ? 'bg-white text-vaida-dark shadow-sm'
                            : 'text-slate-500 hover:text-slate-700',
                        )}
                      >
                        <FileJson size={12} />
                        FHIR R4 JSON
                      </button>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {briefView === 'pdf' ? (
                      <motion.div
                        key="pdf"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="rounded-md border border-slate-200 bg-white p-3 min-h-[140px] shadow-inner"
                      >
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
                          <div className="h-8 w-6 rounded-sm bg-slate-200" />
                          <div className="flex-1 space-y-1">
                            <div className="h-1.5 w-3/4 rounded bg-slate-200" />
                            <div className="h-1 w-1/2 rounded bg-slate-100" />
                          </div>
                        </div>
                        <ul className="space-y-1.5 text-[11px] text-slate-700 leading-snug">
                          {selected.pdfBriefSummary.map((line) => (
                            <li key={line} className="flex gap-2">
                              <span className="text-slate-300 shrink-0">•</span>
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-[9px] text-slate-400 mt-3 font-mono">
                          Mock PDF preview — production links to signed pdf_url on DoctorBrief.
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="fhir"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="rounded-md border border-slate-300 bg-[#0f1419] overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-2 py-1 border-b border-slate-700/80 bg-slate-900/90">
                          <span className="text-[9px] font-mono text-slate-400">application/fhir+json</span>
                          <span className="text-[9px] text-emerald-500/90">R4</span>
                        </div>
                        <pre className="p-3 text-[10px] leading-relaxed text-emerald-100/95 font-mono overflow-x-auto max-h-[min(280px,42vh)] scrollbar-hide">
                          {fhirPretty}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>
              </div>
            </div>

            {/* Telehealth actions */}
            <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Telehealth
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Initiate secure video consult (mock <code className="text-[10px] font-mono bg-slate-100 px-1 rounded">POST /consult/initiate</code>)
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1 rounded px-2 py-0.5 font-semibold border',
                        consultStatus === 'pending' && 'bg-amber-50 text-amber-900 border-amber-200',
                        consultStatus === 'active' && 'bg-emerald-50 text-emerald-900 border-emerald-200',
                        consultStatus === 'done' && 'bg-slate-100 text-slate-600 border-slate-200',
                      )}
                    >
                      <AlertCircle size={12} />
                      Status: <span className="font-mono uppercase">{consultStatus}</span>
                    </span>
                    {jitsiRoomUrl && (
                      <a
                        href={jitsiRoomUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-vaida-teal font-semibold hover:underline truncate max-w-full"
                      >
                        <ExternalLink size={12} />
                        <span className="truncate font-mono text-[10px]">{jitsiRoomUrl}</span>
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleInitiateConsult}
                    disabled={initiating}
                    className={clsx(
                      'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold text-white shadow-md transition-all',
                      'bg-vaida-dark hover:bg-slate-800 active:scale-[0.98]',
                      'disabled:opacity-70 disabled:pointer-events-none',
                      consultStatus === 'active' && 'bg-emerald-700 hover:bg-emerald-800',
                    )}
                  >
                    {initiating ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Initiating…
                      </>
                    ) : consultStatus === 'active' ? (
                      <>
                        <Video size={18} />
                        Join Jitsi room
                      </>
                    ) : (
                      <>
                        <Video size={18} />
                        Initiate consult
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

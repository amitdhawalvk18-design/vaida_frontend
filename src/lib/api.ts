import type {
  IntakeRequest, IntakeResponse, VoiceIntakeResponse,
  TriageResult, TriageGuidance, ImageAnalysis, DoctorBrief,
  EpiCluster, AuthTokens, UrgencyLevel, StructuredSymptoms,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

// ─── Mock Helpers ────────────────────────────────────────────
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
const uuid = () => crypto.randomUUID();

// ─── Mock Data (matches backend wireframe JSON structures) ───
const mockStructuredSymptoms: StructuredSymptoms = {
  chief_complaint: 'Severe headache with nausea',
  body_location: 'head',
  symptom_character: ['throbbing', 'sharp'],
  duration_hours: 48,
  severity_1_10: 7,
  associated_symptoms: ['nausea', 'light sensitivity', 'dizziness'],
  red_flag_features: {
    chest_pain_sweat: false,
    facial_droop: false,
    loss_of_consciousness: false,
    child_breathing_distress: false,
    sudden_severe_headache: false,
  },
  lang_detected: 'hi',
};

function mockTriageResult(sessionId: string, level?: UrgencyLevel): TriageResult {
  const urgency = level || (['GREEN', 'AMBER', 'RED'] as const)[Math.floor(Math.random() * 3)];
  return {
    id: uuid(),
    session_id: sessionId,
    urgency,
    confidence_score: 0.72 + Math.random() * 0.25,
    differential_json: [
      { condition: 'Tension-type headache', probability: 0.45, reasoning: 'Bilateral pressure, duration > 30min' },
      { condition: 'Migraine without aura', probability: 0.35, reasoning: 'Throbbing, nausea, photophobia' },
      { condition: 'Cluster headache', probability: 0.12, reasoning: 'Unilateral, severe, orbital region' },
    ],
    rule_override: false,
    model_version: 'triage-v2.1.0',
    doctor_feedback: null,
    audit_tx_hash: '0xabcd1234ef567890abcd1234ef567890abcd1234ef567890abcd1234ef567890',
    created_at: new Date().toISOString(),
  };
}

// ─── API Client ──────────────────────────────────────────────
function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('vaida_access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

// ─── Auth API ────────────────────────────────────────────────
export async function apiLogin(phone: string, otp: string): Promise<AuthTokens> {
  if (USE_MOCKS) {
    await delay(800);
    const tokens: AuthTokens = {
      access_token: 'mock_jwt_' + Date.now(),
      refresh_token: 'mock_refresh_' + Date.now(),
    };
    localStorage.setItem('vaida_access_token', tokens.access_token);
    return tokens;
  }
  return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ phone, otp }) });
}

export async function apiRegister(data: { name: string; phone: string; role: string; lang: string; consent: boolean }): Promise<AuthTokens> {
  if (USE_MOCKS) {
    await delay(1000);
    const tokens: AuthTokens = {
      access_token: 'mock_jwt_' + Date.now(),
      refresh_token: 'mock_refresh_' + Date.now(),
    };
    localStorage.setItem('vaida_access_token', tokens.access_token);
    return tokens;
  }
  return apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) });
}

// ─── Intake API ──────────────────────────────────────────────
export async function apiSubmitIntake(data: IntakeRequest): Promise<IntakeResponse> {
  if (USE_MOCKS) {
    await delay(1200);
    return {
      session_id: uuid(),
      structured_symptoms: { ...mockStructuredSymptoms, body_location: data.body_location || 'head' },
    };
  }
  return apiFetch('/intake', { method: 'POST', body: JSON.stringify(data) });
}

export async function apiVoiceIntake(audioBlob: Blob, langHint?: string): Promise<VoiceIntakeResponse> {
  if (USE_MOCKS) {
    await delay(2000);
    return {
      transcript: 'मुझे सिर में तेज़ दर्द हो रहा है, साथ में जी मिचलाना भी है',
      detected_lang: 'hi',
    };
  }
  const formData = new FormData();
  formData.append('audio_blob', audioBlob);
  if (langHint) formData.append('lang_hint', langHint);
  return apiFetch('/intake/voice', { method: 'POST', body: formData, headers: {} });
}

// ─── Triage API ──────────────────────────────────────────────
export async function apiRunTriage(sessionId: string, symptoms: StructuredSymptoms): Promise<TriageResult> {
  if (USE_MOCKS) {
    await delay(2500);
    // Determine urgency based on red flags
    const hasRedFlag = Object.values(symptoms.red_flag_features).some(v => v);
    if (hasRedFlag) return mockTriageResult(sessionId, 'RED');
    if (symptoms.severity_1_10 >= 8) return mockTriageResult(sessionId, 'AMBER');
    return mockTriageResult(sessionId, 'GREEN');
  }
  return apiFetch('/triage', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId, structured_symptoms: symptoms }),
  });
}

export async function apiGetTriageGuidance(sessionId: string): Promise<TriageGuidance> {
  if (USE_MOCKS) {
    await delay(500);
    return {
      urgency: 'GREEN',
      guidance_text: 'Rest in a quiet, dark room. Apply a cold compress to your forehead. Take paracetamol if needed. If symptoms persist beyond 48 hours, consult a doctor.',
      guidance_audio_url: null,
    };
  }
  return apiFetch(`/triage/${sessionId}/result`);
}

// ─── Image API ───────────────────────────────────────────────
export async function apiAnalyseImage(sessionId: string, image: File, imageType: string): Promise<ImageAnalysis> {
  if (USE_MOCKS) {
    await delay(3000);
    return {
      id: uuid(),
      session_id: sessionId,
      image_type: imageType as ImageAnalysis['image_type'],
      image_url_encrypted: 'encrypted_url_placeholder',
      findings: 'Superficial abrasion approximately 3cm x 2cm on left forearm. Mild erythema around wound margins. No signs of infection.',
      diagnosis_category: 'traumatic',
      urgency_indicator: 'low',
      specialist_type: 'General Practitioner',
      created_at: new Date().toISOString(),
    };
  }
  const formData = new FormData();
  formData.append('session_id', sessionId);
  formData.append('image', image);
  formData.append('image_type', imageType);
  return apiFetch('/image/analyse', { method: 'POST', body: formData, headers: {} });
}

// ─── Doctor Brief API ────────────────────────────────────────
export async function apiGetBrief(sessionId: string): Promise<DoctorBrief> {
  if (USE_MOCKS) {
    await delay(1000);
    return {
      id: uuid(),
      session_id: sessionId,
      doctor_id: uuid(),
      pdf_url: null,
      fhir_json: null,
      ai_hypothesis: [
        { condition: 'Tension headache', probability: 0.5, reasoning: 'Pattern matches' },
      ],
      jitsi_room_id: 'vaida-consult-' + sessionId.slice(0, 8),
      consult_status: 'pending',
      consult_outcome_json: null,
      created_at: new Date().toISOString(),
    };
  }
  return apiFetch(`/brief/${sessionId}`);
}

// ─── Epidemiological API ─────────────────────────────────────
export async function apiGetEpiClusters(district?: string): Promise<EpiCluster[]> {
  if (USE_MOCKS) {
    await delay(800);
    return [
      { id: uuid(), district: 'Jaipur', lat: 26.9124, lng: 75.7873, symptom_cluster: ['fever', 'cough', 'body ache'], patient_count: 23, alert_level: 'high' },
      { id: uuid(), district: 'Jodhpur', lat: 26.2389, lng: 73.0243, symptom_cluster: ['diarrhea', 'vomiting'], patient_count: 15, alert_level: 'moderate' },
      { id: uuid(), district: 'Udaipur', lat: 24.5854, lng: 73.7125, symptom_cluster: ['fever', 'rash'], patient_count: 8, alert_level: 'low' },
      { id: uuid(), district: 'Kota', lat: 25.2138, lng: 75.8648, symptom_cluster: ['fever', 'joint pain'], patient_count: 31, alert_level: 'critical' },
      { id: uuid(), district: 'Ajmer', lat: 26.4499, lng: 74.6399, symptom_cluster: ['cough', 'breathlessness'], patient_count: 12, alert_level: 'moderate' },
    ];
  }
  return apiFetch(`/epi/clusters${district ? `?district=${district}` : ''}`);
}

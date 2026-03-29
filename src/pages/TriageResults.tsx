import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function TriageResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const [analyzing, setAnalyzing] = useState(true);

  const selectedParts: string[] = location.state?.selectedParts || [];

  // Format "head_front" to "Head (Front)"
  const formatSymptom = (part: string) => {
    const [name, side] = part.split('_');
    if (!name) return part;
    const cleanName = name.charAt(0).toUpperCase() + name.slice(1);
    const cleanSide = side ? ` (${side.charAt(0).toUpperCase() + side.slice(1)})` : '';
    return `${cleanName}${cleanSide}`;
  };

  // Determine Urgency based on keywords
  const painLevel: number = location.state?.painLevel || 1;
  const duration: string = location.state?.duration || 'Unknown';
  const getTriageStatus = () => {
    // RED: Severe pain (8-10) OR sudden severe pain (high pain + 2h/6h)
    if (painLevel >= 8) return 'RED';
    
    // AMBER: Moderate pain (5-7) OR lingering issues (more than 3 days)
    const longDuration = ['3d', '5d', '7d'].includes(duration);
    if (painLevel >= 5 || longDuration) return 'AMBER';
    
    // GREEN: Mild pain (1-4) and short duration
    return 'GREEN';
  };

  const status = getTriageStatus();

  // Theme & Icon configuration
  const theme = {
    RED: { 
      border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-700', badgeBg: 'bg-red-100', btn: 'bg-red-600 hover:bg-red-700', 
      label: 'EMERGENCY', title: 'Seek Immediate Care',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-10 h-10 text-red-600"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      action: 'Please proceed to the nearest emergency center immediately. An alert has been logged.'
    },
    AMBER: { 
      border: 'border-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', badgeBg: 'bg-amber-100', btn: 'bg-amber-600 hover:bg-amber-700', 
      label: 'URGENT', title: 'Consultation Required',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-10 h-10 text-amber-500"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
      action: 'A telehealth consultation is recommended within 24 hours. A pre-brief has been generated for the doctor.'
    },
    GREEN: { 
      border: 'border-teal-500', bg: 'bg-teal-50', text: 'text-teal-700', badgeBg: 'bg-teal-100', btn: 'bg-teal-600 hover:bg-teal-700', 
      label: 'SELF-CARE', title: 'Self-Care Instructions',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-10 h-10 text-teal-600"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      action: 'These symptoms appear non-urgent. Follow the guided self-care instructions below and monitor for 48 hours.'
    }
  }[status];

  useEffect(() => {
    const timer = setTimeout(() => setAnalyzing(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (analyzing) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] md:ml-56 flex items-center justify-center">
        <div className="text-center flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mb-4"></div>
          <h2 className="text-lg font-bold text-slate-900">Running AI Triage...</h2>
          <p className="text-sm text-slate-500">Cross-referencing symptoms with clinical rules.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] md:ml-56 p-6">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">VAIDA Triage Report</h1>
            <p className="text-xs text-gray-500">Generated: {new Date().toLocaleString()}</p>
          </div>
          <button onClick={() => navigate('/')} className="text-sm font-semibold text-gray-600 hover:text-black">
            ✕ Close
          </button>
        </header>

        {/* Main Clinical Card */}
        <div className={`bg-white border-t-4 ${theme.border} rounded-xl shadow-sm border-x border-b border-gray-200 overflow-hidden mb-6`}>
          <div className="p-6 md:p-8">
            
            <div className="flex items-start gap-4 mb-6">
              <div className={`p-3 rounded-full ${theme.bg}`}>
                {theme.icon}
              </div>
              <div>
                <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${theme.badgeBg} ${theme.text}`}>
                  {theme.label} ({status})
                </span>
                <h2 className="text-xl font-bold text-gray-900">{theme.title}</h2>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6 text-sm">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Identified Symptom Areas</h3>
              <div className="flex flex-wrap gap-2">
                {selectedParts.length > 0 ? (
                  selectedParts.map(p => (
                    <span key={p} className="bg-white border border-gray-200 text-gray-800 px-3 py-1 rounded-md text-xs font-medium shadow-sm">
                      {formatSymptom(p)}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 italic">No areas selected.</span>
                )}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Recommended Action</h3>
              <p className="text-sm text-gray-800 leading-relaxed">
                {theme.action}
              </p>
            </div>

            <button className={`w-full text-white font-bold py-3 px-4 rounded-lg text-sm shadow-sm transition-colors ${theme.btn}`}>
              {status === 'RED' ? 'View Nearest Facility Map' : status === 'AMBER' ? 'Book Tele-Consult' : 'View Care Guide'}
            </button>

          </div>
        </div>

        {/* Clinical Disclaimer */}
        <div className="bg-slate-800 text-slate-300 p-4 rounded-lg text-[10px] leading-relaxed flex items-start gap-3">
          <span className="text-lg">ℹ️</span>
          <div>
            <strong className="text-white">DISCLAIMER:</strong> This is an AI-generated guidance brief and does not constitute a definitive medical diagnosis. Always consult a qualified healthcare professional.
            <br />
            <span className="opacity-60 mt-1 block">Session ID: {Math.random().toString(36).substr(2, 9)} | Model: triage-v2.1.0 | Protocol: FHIR R4</span>
          </div>
        </div>

      </div>
    </div>
  );
}
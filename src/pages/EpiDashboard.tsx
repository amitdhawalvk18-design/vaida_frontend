import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronLeft, AlertTriangle, Shield, TrendingUp, MapPin } from 'lucide-react';
import { apiGetEpiClusters } from '../lib/api';
import type { EpiCluster } from '../types';

const alertColors = {
  low: { bg: 'bg-urgency-green-bg', text: 'text-urgency-green', border: 'border-urgency-green-border', dot: 'bg-urgency-green' },
  moderate: { bg: 'bg-urgency-amber-bg', text: 'text-urgency-amber', border: 'border-urgency-amber-border', dot: 'bg-urgency-amber' },
  high: { bg: 'bg-urgency-red-bg', text: 'text-urgency-red', border: 'border-urgency-red-border', dot: 'bg-urgency-red' },
  critical: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-500', dot: 'bg-red-600' },
};

export default function EpiDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [clusters, setClusters] = useState<EpiCluster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetEpiClusters()
      .then(setClusters)
      .finally(() => setLoading(false));
  }, []);

  const totalCases = clusters.reduce((sum, c) => sum + c.patient_count, 0);
  const criticalCount = clusters.filter(c => c.alert_level === 'critical' || c.alert_level === 'high').length;

  return (
    <div className="min-h-screen bg-vaida-bg pb-24">
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-vaida-bg2">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-bold text-lg">{t('epi.title')}</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 space-y-6">
        <p className="text-sm text-vaida-text-muted">{t('epi.subtitle')}</p>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-4 text-center border border-vaida-bg2"
          >
            <TrendingUp size={20} className="mx-auto text-vaida-teal mb-1" />
            <div className="text-2xl font-bold text-vaida-teal">{clusters.length}</div>
            <div className="text-[10px] text-vaida-text-hint">{t('epi.activeClusters')}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-4 text-center border border-vaida-bg2"
          >
            <MapPin size={20} className="mx-auto text-urgency-amber mb-1" />
            <div className="text-2xl font-bold text-urgency-amber">{totalCases}</div>
            <div className="text-[10px] text-vaida-text-hint">{t('epi.cases')}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-4 text-center border border-vaida-bg2"
          >
            <AlertTriangle size={20} className="mx-auto text-urgency-red mb-1" />
            <div className="text-2xl font-bold text-urgency-red">{criticalCount}</div>
            <div className="text-[10px] text-vaida-text-hint">High / Critical</div>
          </motion.div>
        </div>

        {/* District Map (D3 placeholder - visual representation) */}
        <div className="bg-white rounded-2xl border border-vaida-bg2 overflow-hidden">
          <div className="p-4 border-b border-vaida-bg2">
            <h3 className="text-sm font-bold">District Heatmap</h3>
          </div>
          <div className="relative h-64 bg-gradient-to-br from-vaida-teal-light/30 to-vaida-bg p-4">
            {/* Simple visual map representation */}
            <svg viewBox="0 0 400 250" className="w-full h-full">
              {/* Rajasthan outline approximation */}
              <path d="M80,30 L200,20 L320,40 L350,120 L300,200 L180,230 L100,180 L60,100 Z"
                fill="none" stroke="#E2E8F0" strokeWidth="2" />
              
              {clusters.map((cluster, i) => {
                const x = 80 + (cluster.lng - 73) * 40;
                const y = 20 + (27 - cluster.lat) * 60;
                const radius = Math.max(8, cluster.patient_count * 0.8);
                const color = cluster.alert_level === 'critical' ? '#DC2626'
                  : cluster.alert_level === 'high' ? '#E24B4A'
                  : cluster.alert_level === 'moderate' ? '#BA7517'
                  : '#639922';
                
                return (
                  <g key={cluster.id}>
                    <motion.circle
                      cx={x} cy={y} r={radius}
                      fill={color}
                      fillOpacity="0.3"
                      initial={{ r: 0 }}
                      animate={{ r: radius }}
                      transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
                    />
                    <motion.circle
                      cx={x} cy={y} r={radius * 0.5}
                      fill={color}
                      initial={{ r: 0 }}
                      animate={{ r: radius * 0.5 }}
                      transition={{ delay: 0.6 + i * 0.1, type: 'spring' }}
                    />
                    <text x={x} y={y - radius - 4} textAnchor="middle"
                      className="text-[8px] fill-current" fill="#5F5E5A">
                      {cluster.district}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Cluster List */}
        <div className="space-y-2.5">
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="shimmer-bg h-20 rounded-2xl" />
              ))}
            </div>
          ) : (
            clusters
              .sort((a, b) => {
                const order = { critical: 0, high: 1, moderate: 2, low: 3 };
                return order[a.alert_level] - order[b.alert_level];
              })
              .map((cluster, i) => {
                const colors = alertColors[cluster.alert_level];
                return (
                  <motion.div
                    key={cluster.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className={`bg-white rounded-2xl p-4 border ${colors.border} border-l-4`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                        <h4 className="font-bold text-sm">{cluster.district}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${colors.bg} ${colors.text}`}>
                        {cluster.alert_level}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-vaida-text-muted">
                      <span className="font-medium">{cluster.patient_count} {t('epi.cases')}</span>
                      <span>·</span>
                      <span>{cluster.symptom_cluster.join(', ')}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-vaida-teal">
                      <Shield size={10} />
                      <span>{t('epi.blockchain')}</span>
                    </div>
                  </motion.div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronLeft, User, Globe, Shield, LogOut, ChevronRight, Bell, Moon, HelpCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import LanguageSelector from '../components/ui/LanguageSelector';

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, role, logout, language } = useApp();

  const menuItems = [
    { icon: Globe, label: 'Language', value: language.toUpperCase(), action: 'language' },
    { icon: Bell, label: 'Notifications', value: 'Enabled', action: 'notifications' },
    { icon: Shield, label: 'Privacy & Consent', value: '', action: 'privacy' },
    { icon: Moon, label: 'Dark Mode', value: 'Off', action: 'theme' },
    { icon: HelpCircle, label: 'Help & Support', value: '', action: 'help' },
  ];

  return (
    <div className="min-h-screen bg-vaida-bg pb-24">
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-vaida-bg2">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-bold text-lg">{t('nav.profile')}</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 space-y-6">
        {/* User Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 border border-vaida-bg2 flex items-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-vaida-teal flex items-center justify-center">
            <User size={28} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">{user?.name_encrypted || 'Guest'}</h2>
            <p className="text-sm text-vaida-text-muted capitalize">{role}</p>
            <p className="text-xs text-vaida-text-hint">{user?.district || 'Jaipur, Rajasthan'}</p>
          </div>
        </motion.div>

        {/* Menu Items */}
        <div className="bg-white rounded-2xl border border-vaida-bg2 overflow-hidden">
          {menuItems.map((item, i) => (
            <motion.button
              key={item.action}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-vaida-bg transition-colors ${
                i < menuItems.length - 1 ? 'border-b border-vaida-bg2' : ''
              }`}
            >
              <item.icon size={18} className="text-vaida-text-muted" />
              <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
              {item.value && <span className="text-xs text-vaida-text-hint">{item.value}</span>}
              <ChevronRight size={16} className="text-vaida-text-hint" />
            </motion.button>
          ))}
        </div>

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full flex items-center justify-center gap-2 py-3 text-urgency-red font-semibold"
        >
          <LogOut size={18} />
          Logout
        </motion.button>

        {/* Version */}
        <p className="text-center text-[10px] text-vaida-text-hint">
          VAIDA v1.0.0 · Team Phoenix · NHH 2.0
        </p>
      </div>
    </div>
  );
}

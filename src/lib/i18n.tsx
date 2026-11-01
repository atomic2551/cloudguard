'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export type Language = 'uz' | 'en';

export const translations = {
  uz: {
    // Navigation - Sections
    'nav.operations': 'Operatsiyalar',
    'nav.sensors': 'Sensorlar va Bulut',
    'nav.detection': 'Aniqlash va Laboratoriya',
    'nav.admin': 'Boshqaruv va Sozlamalar',

    // Navigation - Items
    'nav.dashboard': 'Boshqaruv Paneli',
    'nav.alerts': 'Xavflilik Signallari',
    'nav.incidents': 'Insidentlar',
    'nav.events': 'Xavfsizlik Hodisalari',
    'nav.hosts': 'Serverlar va Datchiklar',
    'nav.network': 'Tarmoq IDS',
    'nav.cloud_accounts': 'Bulut Hisoblari',
    'nav.iam': 'IAM Xavfsizlik',
    'nav.scanner': 'Bulut Skaneri',
    'nav.findings': 'Zaifliklar va Topilmalar',
    'nav.mitre': 'MITRE ATT&CK Xaritasi',
    'nav.detection_rules': 'Aniqlash Qoidalari',
    'nav.plugins': 'Plaginlar Nazorati',
    'nav.simulation': 'Simulyatsiya Laboratoriyasi',
    'nav.reports': 'Xavfsizlik Hisobotlari',
    'nav.audit_logs': 'Audit Jurnallari',
    'nav.users': 'Foydalanuvchilar va RBAC',
    'nav.settings': 'Sozlamalar',
    'nav.logout': 'Chiqish',

    // TopBar
    'topbar.search_placeholder': 'Alertlar, hodisalar va IP qidirish...',
    'topbar.accounts': 'ta hisob',
    'topbar.critical': 'ta Kritik',
    'topbar.notifications': 'Bildirishnomalar',
    'topbar.no_notifications': 'Yangi bildirishnomalar yo\'q',
    'topbar.profile': 'Profil',
    'topbar.switch_lang': 'Tilni almashtirish',

    // Dashboard
    'dashboard.title': 'Xavfsizlik Boshqaruv Markazi (SOC)',
    'dashboard.subtitle': 'Real vaqt rejimida bulut va infratuzilma monitoringi — SecLab XDR',
    'dashboard.last_sync': 'So\'nggi sinxronizatsiya:',
    'dashboard.just_now': 'Hozirgina',
    'dashboard.security_score': 'Umumiy Xavfsizlik Reytingi',
    'dashboard.critical_alerts': 'Kritik Signallar',
    'dashboard.high_alerts': 'Yuqori Xavfli Signallar',
    'dashboard.open_incidents': 'Ochiq Insidentlar',
    'dashboard.active_sensors': 'Faol Sensorlar',
    'dashboard.alerts_trend': 'Ogohlantirishlar Dinamikasi (Trend)',
    'dashboard.severity_dist': 'Xavflilik Darajasi Taqsimoti',
    'dashboard.recent_alerts': 'So\'nggi Ogohlantirishlar',
    'dashboard.recent_events': 'So\'nggi Telemetriya Loglari',
    'dashboard.view_all': 'Barchasini ko\'rish',

    // Severity
    'severity.critical': 'Kritik',
    'severity.high': 'Yuqori',
    'severity.medium': 'O\'rta',
    'severity.low': 'Past',
    'severity.info': 'Axborot',

    // Status
    'status.new': 'Yangi',
    'status.investigating': 'Tekshirilmoqda',
    'status.acknowledged': 'Qabul qilindi',
    'status.resolved': 'Hal qilindi',
    'status.false_positive': 'Soxta signal',
    'status.active': 'Faol',
    'status.disabled': 'O\'chirilgan',
    'status.connected': 'Ulangan',

    // Common Actions & Labels
    'common.refresh': 'Yangilash',
    'common.search': 'Qidirish',
    'common.filter': 'Filtr',
    'common.all': 'Barchasi',
    'common.actions': 'Harakatlar',
    'common.status': 'Holati',
    'common.severity': 'Darajasi',
    'common.time': 'Vaqt',
    'common.source': 'Manba',
    'common.title': 'Nomi',
    'common.export': 'Eksport qilish',
    'common.save': 'Saqlash',
    'common.cancel': 'Bekor qilish',
    'common.delete': 'O\'chirish',
    'common.loading': 'Yuklanmoqda...',
    'common.no_data': 'Ma\'lumot topilmadi',

    // Login
    'login.welcome': 'Xush kelibsiz',
    'login.subtitle': 'Xavfsizlik operatsiyalari boshqaruv tizimi',
    'login.signin_title': 'Tizimga kirish',
    'login.username': 'Foydalanuvchi nomi',
    'login.username_placeholder': 'Loginni kiriting',
    'login.password': 'Parol',
    'login.password_placeholder': 'Parolni kiriting',
    'login.signin_btn': 'Tizimga kirish',
    'login.signing_in': 'Kirilmoqda...',
    'login.err_empty': 'Iltimos, foydalanuvchi nomi va parolni kiriting',
    'login.err_invalid': 'Login yoki parol noto\'g\'ri',
    'login.err_locked': 'Hisob vaqtincha bloklangan (15 daqiqa)',
    'login.err_server': 'Server bilan bog\'lanishda xatolik',
    // Incidents
    'incidents.title': 'Insidentlarni Boshqarish',
    'incidents.subtitle': 'faol · hal qilingan · jami',
    'incidents.create': 'Yangi Insident Yaratish',
    'incidents.search_placeholder': 'Insidentlarni nomi yoki toifasi bo\'yicha qidirish...',
    'incidents.declare_title': 'Yangi Xavfsizlik Insidentini E\'lon Qilish',
    'incidents.ai_btn': 'AI Analitik Xulosasi',
    'incidents.ai_analyzing': 'AI tahlil qilmoqda...',
    'incidents.timeline': 'Insident Xronologiyasi',
    'incidents.notes': 'Tekshiruv Qaydlari',
    'incidents.add_note': 'Qayd Qo\'shish',
    'incidents.note_placeholder': 'Tekshiruv xulosasi yoki tezkor ma\'lumot yozing...',
    'incidents.correlated_alerts': 'Bog\'langan Signallar',
    'incidents.status_mgmt': 'Holatni Boshqarish',
    'incidents.assigned_lead': 'Mas\'ul Mutaxassis',
    'incidents.metadata': 'Insident Metama\'lumotlari',
    'incidents.response_actions': 'Tezkor Reaksiya Harakatlari',
    'incidents.number': 'Insident №',
    'incidents.title_category': 'Nomi va Toifasi',
    'incidents.assigned_to': 'Biriktirilgan',
    'incidents.alerts_count': 'Signallar',
    'incidents.created_date': 'Yaratilgan',
    'incidents.back': 'Insidentlar ro\'yxatiga qaytish',
    'incidents.not_found': 'Insident topilmadi',

    // Events
    'events.title': 'Xavfsizlik Hodisalari',
    'events.subtitle': 'Real vaqt rejimida normallashtirilgan telemetriya loglari oqimi',
    'events.live_pipeline': 'Jonli Oqim',
    'events.total': 'Jami Hodisalar',
    'events.critical': 'Kritik Hodisalar',
    'events.high': 'Yuqori Xavfli Hodisalar',
    'events.processed': 'Dvigatel Qayta Ishlagan',
    'events.search_placeholder': 'Hodisa turi, foydalanuvchi yoki IP bo\'yicha qidirish...',
    'events.timestamp': 'Vaqti',
    'events.type': 'Hodisa Turi',
    'events.source_ip': 'Manba IP',
    'events.user': 'Foydalanuvchi / Xizmat',
    'events.target': 'Nishon Resurs',
    'events.region': 'Mintaqa',

    // Scanner
    'scanner.title': 'Bulut va Xost Skaneri',
    'scanner.subtitle': 'AWS Xavfsizlik guruhlari, ochiq S3 va IAM auditi',
    'scanner.execute': 'Skanerlashni Boshlash',
    'scanner.last_scan': 'So\'nggi skanerlash:',
    'scanner.resources': 'Tekshirilgan Resurslar',
    'scanner.findings': 'Jami Zaifliklar',
    'scanner.remediation': 'Bartaraf etish:',
    'scanner.acknowledge': 'Qabul qilish',
    'scanner.remediated': 'Hal qilindi',
    'scanner.suppress': 'Yashirish',
    'scanner.auditing': 'Xavfsizlik tekshirilmoqda...',

    // Users
    'users.title': 'Foydalanuvchilar va RBAC',
    'users.subtitle': 'faol · jami ro\'yxatdan o\'tganlar',
    'users.add_user': 'Foydalanuvchi Qo\'shish',
    'users.provision_title': 'Yangi SOC Foydalanuvchisini Biriktirish',
    'users.search_placeholder': 'Foydalanuvchilarni qidirish...',
    'users.all_roles': 'Barcha Rollar',
    'users.all_statuses': 'Barcha Holatlar',
    'users.role': 'Roli',
    'users.mfa': 'MFA Himoyasi',
    'users.department': 'Bo\'lim',
    'users.last_login': 'So\'nggi Kirish',
    'users.lock': 'Bloklash',
    'users.activate': 'Faollashtirish',
    'users.enabled': 'Yoqilgan',
    'users.disabled': 'O\'chirilgan',
    'users.never': 'Hech qachon',

    // Settings
    'settings.title': 'Platforma Sozlamalari',
    'settings.subtitle': 'Tizim konfiguratsiyasi va shaxsiy parametrlar',
    'settings.profile': 'Profil',
    'settings.security': 'Xavfsizlik',
    'settings.notifications': 'Bildirishnomalar',
    'settings.detection': 'Aniqlash Dvigateli',
    'settings.cloud': 'Bulut Sozlamalari',
    'settings.fullname': 'To\'liq Ism',
    'settings.email': 'Elektron Pochta',
    'settings.change_password': 'Parolni O\'zgartirish',
    'settings.current_pass': 'Joriy parol',
    'settings.new_pass': 'Yangi parol (kamida 16 ta belgi)',
    'settings.confirm_pass': 'Yangi parolni tasdiqlang',

    // Cloud Accounts
    'accounts.title': 'Bulut Hisoblari va Aktivlar',
    'accounts.subtitle': 'ulangan · jami bulut muhitlari',
    'accounts.connect_aws': 'AWS Hisobini Ulash',
    'accounts.sync_btn': 'Aktivlarni Sinxronlash',
    'accounts.syncing': 'Sinxronlanmoqda...',
    'accounts.last_sync': 'So\'nggi sinxronlash:',
    'accounts.compliant': 'Ulangan va Muvofiq',
  },
  en: {
    // Navigation - Sections
    'nav.operations': 'Operations',
    'nav.sensors': 'Sensors & Cloud',
    'nav.detection': 'Detection & Lab',
    'nav.admin': 'Admin & Governance',

    // Navigation - Items
    'nav.dashboard': 'Dashboard',
    'nav.alerts': 'Alerts',
    'nav.incidents': 'Incidents',
    'nav.events': 'Security Events',
    'nav.hosts': 'Hosts & Agents',
    'nav.network': 'Network IDS',
    'nav.cloud_accounts': 'Cloud Accounts',
    'nav.iam': 'IAM Security',
    'nav.scanner': 'Cloud Scanner',
    'nav.findings': 'Findings',
    'nav.mitre': 'ATT&CK Heatmap',
    'nav.detection_rules': 'Detection Rules',
    'nav.plugins': 'Plugins Control',
    'nav.simulation': 'Simulation Lab',
    'nav.reports': 'Reports',
    'nav.audit_logs': 'Audit Logs',
    'nav.users': 'Users & RBAC',
    'nav.settings': 'Settings',
    'nav.logout': 'Sign Out',

    // TopBar
    'topbar.search_placeholder': 'Search alerts, incidents, events...',
    'topbar.accounts': 'Accounts',
    'topbar.critical': 'Critical',
    'topbar.notifications': 'Notifications',
    'topbar.no_notifications': 'No new notifications',
    'topbar.profile': 'Profile',
    'topbar.switch_lang': 'Switch Language',

    // Dashboard
    'dashboard.title': 'Security Operations Dashboard',
    'dashboard.subtitle': 'Real-time cloud & host security monitoring — SecLab XDR',
    'dashboard.last_sync': 'Last sync:',
    'dashboard.just_now': 'Just now',
    'dashboard.security_score': 'Overall Security Score',
    'dashboard.critical_alerts': 'Critical Alerts',
    'dashboard.high_alerts': 'High Alerts',
    'dashboard.open_incidents': 'Open Incidents',
    'dashboard.active_sensors': 'Active Sensors',
    'dashboard.alerts_trend': 'Alerts Trend (24h)',
    'dashboard.severity_dist': 'Severity Distribution',
    'dashboard.recent_alerts': 'Recent Alerts',
    'dashboard.recent_events': 'Recent Security Events',
    'dashboard.view_all': 'View all',

    // Severity
    'severity.critical': 'Critical',
    'severity.high': 'High',
    'severity.medium': 'Medium',
    'severity.low': 'Low',
    'severity.info': 'Info',

    // Status
    'status.new': 'New',
    'status.investigating': 'Investigating',
    'status.acknowledged': 'Acknowledged',
    'status.resolved': 'Resolved',
    'status.false_positive': 'False Positive',
    'status.active': 'Active',
    'status.disabled': 'Disabled',
    'status.connected': 'Connected',

    // Common Actions & Labels
    'common.refresh': 'Refresh',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.all': 'All',
    'common.actions': 'Actions',
    'common.status': 'Status',
    'common.severity': 'Severity',
    'common.time': 'Time',
    'common.source': 'Source',
    'common.title': 'Title',
    'common.export': 'Export',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.loading': 'Loading...',
    'common.no_data': 'No data found',

    // Login
    'login.welcome': 'Welcome',
    'login.subtitle': 'Security Operations Platform',
    'login.signin_title': 'Sign in to your account',
    'login.username': 'Username',
    'login.username_placeholder': 'Enter your username',
    'login.password': 'Password',
    'login.password_placeholder': 'Enter your password',
    'login.signin_btn': 'Sign in',
    'login.signing_in': 'Signing in...',
    'login.err_empty': 'Please enter both username and password',
    'login.err_invalid': 'Invalid username or password',
    'login.err_locked': 'Account is locked (15 minutes)',
    'login.err_server': 'Server unavailable',
    'login.demo_tip': 'Default login: sarah.chen | Password: CloudGuard2026!',

    // Incidents
    'incidents.title': 'Incident Management',
    'incidents.subtitle': 'active · resolved · total',
    'incidents.create': 'Create Incident',
    'incidents.search_placeholder': 'Search incidents by title or category...',
    'incidents.declare_title': 'Declare New Security Incident',
    'incidents.ai_btn': 'AI Analyst Insight',
    'incidents.ai_analyzing': 'Analyzing with AI...',
    'incidents.timeline': 'Incident Timeline',
    'incidents.notes': 'Analyst Notes',
    'incidents.add_note': 'Add Note',
    'incidents.note_placeholder': 'Add an incident investigation note...',
    'incidents.correlated_alerts': 'Correlated Alerts',
    'incidents.status_mgmt': 'Status Management',
    'incidents.assigned_lead': 'Assigned Lead',
    'incidents.metadata': 'Incident Metadata',
    'incidents.response_actions': 'Response Actions',
    'incidents.number': 'Incident #',
    'incidents.title_category': 'Title & Category',
    'incidents.assigned_to': 'Assigned To',
    'incidents.alerts_count': 'Alerts',
    'incidents.created_date': 'Created',
    'incidents.back': 'Back to incidents',
    'incidents.not_found': 'Incident not found',

    // Events
    'events.title': 'Security Events',
    'events.subtitle': 'Real-time normalized security event stream',
    'events.live_pipeline': 'Live Pipeline',
    'events.total': 'Total Events',
    'events.critical': 'Critical Events',
    'events.high': 'High Events',
    'events.processed': 'Processed by Engine',
    'events.search_placeholder': 'Search event type, username, source IP...',
    'events.timestamp': 'Timestamp',
    'events.type': 'Event Type',
    'events.source_ip': 'Source IP',
    'events.user': 'User Identity',
    'events.target': 'Target Resource',
    'events.region': 'Region',

    // Scanner
    'scanner.title': 'Automated Cloud & Host Security Scanner',
    'scanner.subtitle': 'Read-only compliance checks across AWS Security Groups, S3, IAM, and CloudTrail',
    'scanner.execute': 'Execute Security Scan',
    'scanner.last_scan': 'Last scan:',
    'scanner.resources': 'Scanned Resources',
    'scanner.findings': 'Total Findings',
    'scanner.remediation': 'Remediation:',
    'scanner.acknowledge': 'Acknowledge',
    'scanner.remediated': 'Remediated',
    'scanner.suppress': 'Suppress',
    'scanner.auditing': 'Auditing Scope...',

    // Users
    'users.title': 'Platform Users & RBAC',
    'users.subtitle': 'active · total registered users',
    'users.add_user': 'Add User',
    'users.provision_title': 'Provision SOC User',
    'users.search_placeholder': 'Search users...',
    'users.all_roles': 'All Roles',
    'users.all_statuses': 'All Statuses',
    'users.role': 'Role',
    'users.mfa': 'MFA',
    'users.department': 'Department',
    'users.last_login': 'Last Login',
    'users.lock': 'Lock Account',
    'users.activate': 'Activate',
    'users.enabled': 'Enabled',
    'users.disabled': 'Disabled',
    'users.never': 'Never',

    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Platform configuration and preferences',
    'settings.profile': 'Profile',
    'settings.security': 'Security',
    'settings.notifications': 'Notifications',
    'settings.detection': 'Detection',
    'settings.cloud': 'Cloud Config',
    'settings.fullname': 'Full Name',
    'settings.email': 'Email Address',
    'settings.change_password': 'Change Password',
    'settings.current_pass': 'Current password',
    'settings.new_pass': 'New password (min 16 chars)',
    'settings.confirm_pass': 'Confirm new password',

    // Cloud Accounts
    'accounts.title': 'Monitored Cloud Accounts & Assets',
    'accounts.subtitle': 'connected · total cloud environments',
    'accounts.connect_aws': 'Connect AWS Account',
    'accounts.sync_btn': 'Sync Assets',
    'accounts.syncing': 'Syncing...',
    'accounts.last_sync': 'Last synchronized:',
    'accounts.compliant': 'Connected & Compliant',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'uz',
  setLanguage: () => {},
  t: (key, fallback) => fallback || key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('uz');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cloudguard_lang') as Language;
      if (saved === 'uz' || saved === 'en') {
        setLanguageState(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('cloudguard_lang', lang);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const langDict = translations[language] as Record<string, string>;
      if (langDict && langDict[key]) {
        return langDict[key];
      }
      const enDict = translations.en as Record<string, string>;
      if (enDict && enDict[key]) {
        return enDict[key];
      }
      return fallback || key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

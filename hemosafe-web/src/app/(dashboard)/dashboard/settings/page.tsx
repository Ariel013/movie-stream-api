'use client';

import { useState } from 'react';
import { TopBar } from '@/shared/components/TopBar';
import { useAuthStore } from '@/shared/store/auth.store';

type Section = 'profile' | 'security' | 'notifications' | 'preferences' | 'about';

const NAV: { key: Section; label: string; icon: string }[] = [
  { key: 'profile', label: 'Profile', icon: 'person' },
  { key: 'security', label: 'Security', icon: 'lock' },
  { key: 'notifications', label: 'Notifications', icon: 'notifications' },
  { key: 'preferences', label: 'Preferences', icon: 'tune' },
  { key: 'about', label: 'About', icon: 'info' },
];

interface Toggle {
  key: string;
  label: string;
  description: string;
  value: boolean;
}

export default function SettingsPage() {
  const [section, setSection] = useState<Section>('profile');
  const user = useAuthStore((s) => s.user);

  const [toggles, setToggles] = useState<Toggle[]>([
    { key: 'email', label: 'Email Alerts', description: 'Receive notifications by email', value: true },
    { key: 'sms', label: 'SMS Alerts', description: 'Receive critical alerts via SMS', value: false },
    { key: 'push', label: 'Push Notifications', description: 'In-browser push notifications', value: true },
    { key: 'reservation', label: 'Reservation Updates', description: 'Status changes for your reservations', value: true },
    { key: 'stock', label: 'Stock Alerts', description: 'Low and critical stock warnings', value: true },
    { key: 'system', label: 'System Updates', description: 'Maintenance and system announcements', value: false },
  ]);

  const flipToggle = (key: string) =>
    setToggles((prev) => prev.map((t) => t.key === key ? { ...t, value: !t.value } : t));

  return (
    <div>
      <TopBar title="Settings" />
      <div className="p-8 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-12 gap-6">

          {/* Left nav */}
          <div className="col-span-12 md:col-span-3">
            <div className="bg-surface-container-lowest rounded-2xl p-2 ambient-shadow space-y-0.5">
              {NAV.map((n) => (
                <button
                  key={n.key}
                  onClick={() => setSection(n.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-colors ${section === n.key ? 'bg-surface-container-highest text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
                >
                  <span className={`material-symbols-outlined text-[20px] ${section === n.key ? 'filled' : ''}`}>{n.icon}</span>
                  {n.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right content */}
          <div className="col-span-12 md:col-span-9">

            {/* Profile */}
            {section === 'profile' && (
              <div className="bg-surface-container-lowest rounded-2xl p-8 ambient-shadow space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-on-surface font-headline">Profile Settings</h2>
                  <p className="text-sm text-on-surface-variant mt-0.5">Update your personal information</p>
                </div>
                <div className="flex items-center gap-6 pb-6 border-b border-outline-variant/10">
                  <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-white text-2xl font-bold font-headline">
                    {user ? user.firstName[0] + user.lastName[0] : 'AD'}
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">{user ? `${user.firstName} ${user.lastName}` : 'Admin User'}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{user?.role ?? 'ADMIN'}</p>
                    <button className="mt-2 text-xs font-bold text-primary hover:underline">Change Avatar</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">First Name</label>
                    <input defaultValue={user?.firstName} className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Last Name</label>
                    <input defaultValue={user?.lastName} className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Email</label>
                    <input defaultValue={user?.email} readOnly className="w-full rounded-xl border border-outline-variant bg-surface-container py-3 px-4 text-sm text-on-surface-variant cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Phone</label>
                    <input placeholder="+213 7XX XX XX XX" className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Language</label>
                    <select className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="fr">French</option>
                      <option value="ar">Arabic</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button className="gradient-primary text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Security */}
            {section === 'security' && (
              <div className="space-y-6">
                <div className="bg-surface-container-lowest rounded-2xl p-8 ambient-shadow space-y-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-on-surface font-headline">Security</h2>
                    <p className="text-sm text-on-surface-variant mt-0.5">Change your password</p>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: 'Current Password', placeholder: '••••••••' },
                      { label: 'New Password', placeholder: 'Min. 8 characters' },
                      { label: 'Confirm New Password', placeholder: 'Repeat new password' },
                    ].map((f) => (
                      <div key={f.label}>
                        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">{f.label}</label>
                        <input type="password" placeholder={f.placeholder} className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <button className="gradient-primary text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm">
                      Update Password
                    </button>
                  </div>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl p-8 ambient-shadow">
                  <h3 className="font-extrabold text-on-surface font-headline mb-4">Active Sessions</h3>
                  <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary text-[22px]">computer</span>
                      <div>
                        <p className="text-sm font-bold text-on-surface">Current Session</p>
                        <p className="text-xs text-on-surface-variant">Chrome · Linux · 41.200.x.x</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-tertiary uppercase">
                      <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                      Active
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {section === 'notifications' && (
              <div className="bg-surface-container-lowest rounded-2xl p-8 ambient-shadow">
                <div className="mb-6">
                  <h2 className="text-xl font-extrabold text-on-surface font-headline">Notification Preferences</h2>
                  <p className="text-sm text-on-surface-variant mt-0.5">Configure how you receive alerts</p>
                </div>
                <div className="space-y-4">
                  {toggles.map((t) => (
                    <div key={t.key} className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
                      <div>
                        <p className="text-sm font-bold text-on-surface">{t.label}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">{t.description}</p>
                      </div>
                      <button
                        onClick={() => flipToggle(t.key)}
                        className={`w-12 h-6 rounded-full relative transition-colors flex-shrink-0 ${t.value ? 'bg-primary' : 'bg-surface-container-highest'}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${t.value ? 'translate-x-7' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-6">
                  <button className="gradient-primary text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm">
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* Preferences */}
            {section === 'preferences' && (
              <div className="bg-surface-container-lowest rounded-2xl p-8 ambient-shadow space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-on-surface font-headline">Preferences</h2>
                  <p className="text-sm text-on-surface-variant mt-0.5">Customize your experience</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Default Dashboard View</label>
                    <select className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option>Overview</option>
                      <option>Stock</option>
                      <option>Reservations</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Date Format</label>
                    <select className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option>DD/MM/YYYY</option>
                      <option>MM/DD/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Time Zone</label>
                    <select className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option>Africa/Algiers (UTC+1)</option>
                      <option>UTC</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button className="gradient-primary text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm">
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* About */}
            {section === 'about' && (
              <div className="bg-surface-container-lowest rounded-2xl p-8 ambient-shadow space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
                    <span className="material-symbols-outlined filled text-white text-[32px]">bloodtype</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-on-surface font-headline">HEMOSAFE</h2>
                    <p className="text-sm text-on-surface-variant">National Blood Bank Management System</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Version', value: '1.0.0' },
                    { label: 'Build', value: '2026.03.13' },
                    { label: 'API Version', value: 'v1' },
                    { label: 'License', value: 'Proprietary' },
                  ].map((item) => (
                    <div key={item.label} className="bg-surface-container-low rounded-xl p-4">
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{item.label}</p>
                      <p className="text-sm font-bold text-on-surface mt-1">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-surface-container-low rounded-xl">
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    HEMOSAFE is a national blood bank management system designed to connect hospitals and blood banks across Algeria, ensuring that life-saving blood is always available when needed. All data is encrypted at rest and in transit using AES-256 and TLS 1.3.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

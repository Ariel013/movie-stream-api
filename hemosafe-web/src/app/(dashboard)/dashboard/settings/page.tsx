'use client';

import { useState } from 'react';
import { TopBar } from '@/shared/components/TopBar';
import { useAuthStore } from '@/shared/store/auth.store';
import api from '@/shared/lib/api';

type Section = 'profile' | 'security' | 'notifications' | 'preferences' | 'about';

const NAV: { key: Section; label: string; icon: string }[] = [
  { key: 'profile',       label: 'Profil',          icon: 'person' },
  { key: 'security',      label: 'Sécurité',         icon: 'lock' },
  { key: 'notifications', label: 'Notifications',    icon: 'notifications' },
  { key: 'preferences',   label: 'Préférences',      icon: 'tune' },
  { key: 'about',         label: 'À propos',         icon: 'info' },
];

interface Toggle {
  key: string;
  label: string;
  description: string;
  value: boolean;
}

export default function SettingsPage() {
  const [section, setSection] = useState<Section>('profile');
  const { user, accessToken, refreshToken, setAuth } = useAuthStore();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName,  setLastName]  = useState(user?.lastName  ?? '');
  const [phone,     setPhone]     = useState('');
  const [saving,    setSaving]    = useState(false);
  const [saveMsg,   setSaveMsg]   = useState('');

  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew,     setPwNew]     = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwSaving,  setPwSaving]  = useState(false);
  const [pwMsg,     setPwMsg]     = useState('');

  const [toggles, setToggles] = useState<Toggle[]>([
    { key: 'email',       label: 'Alertes e-mail',       description: 'Recevoir les notifications par e-mail',           value: true  },
    { key: 'sms',         label: 'Alertes SMS',           description: 'Recevoir les alertes critiques par SMS',           value: false },
    { key: 'push',        label: 'Notifications push',    description: 'Notifications dans le navigateur',                 value: true  },
    { key: 'reservation', label: 'Mises à jour réservations', description: 'Changements de statut de vos réservations',   value: true  },
    { key: 'stock',       label: 'Alertes stock',         description: 'Alertes de stock faible ou critique',              value: true  },
    { key: 'system',      label: 'Mises à jour système',  description: 'Annonces de maintenance et du système',            value: false },
  ]);

  const flipToggle = (key: string) =>
    setToggles((prev) => prev.map((t) => t.key === key ? { ...t, value: !t.value } : t));

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await api.patch(`/users/${user.id}`, { firstName, lastName, ...(phone ? { phone } : {}) });
      const updated = res.data.data;
      setAuth(
        { ...user, firstName: updated.firstName, lastName: updated.lastName },
        accessToken!,
        refreshToken!,
      );
      setSaveMsg('Profil mis à jour avec succès.');
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setSaveMsg(typeof msg === 'string' ? msg : 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwNew || !pwCurrent) return;
    if (pwNew !== pwConfirm) { setPwMsg('Les mots de passe ne correspondent pas.'); return; }
    if (pwNew.length < 8) { setPwMsg('Le nouveau mot de passe doit comporter au moins 8 caractères.'); return; }
    setPwSaving(true);
    setPwMsg('');
    try {
      await api.patch('/auth/change-password', { currentPassword: pwCurrent, newPassword: pwNew });
      setPwMsg('Mot de passe mis à jour.');
      setPwCurrent(''); setPwNew(''); setPwConfirm('');
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setPwMsg(typeof msg === 'string' ? msg : 'Erreur lors du changement de mot de passe.');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div>
      <TopBar title="Paramètres" />
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
                  <h2 className="text-xl font-extrabold text-on-surface font-headline">Paramètres du profil</h2>
                  <p className="text-sm text-on-surface-variant mt-0.5">Modifier vos informations personnelles</p>
                </div>
                <div className="flex items-center gap-6 pb-6 border-b border-outline-variant/10">
                  <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-white text-2xl font-bold font-headline">
                    {user ? user.firstName[0] + user.lastName[0] : 'AD'}
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">{user ? `${user.firstName} ${user.lastName}` : 'Admin'}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{user?.role ?? 'ADMIN'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Prénom</label>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Nom</label>
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">E-mail</label>
                    <input
                      value={user?.email ?? ''}
                      readOnly
                      className="w-full rounded-xl border border-outline-variant bg-surface-container py-3 px-4 text-sm text-on-surface-variant cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Téléphone</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+225 07 XX XX XX XX"
                      className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Langue</label>
                    <select className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
                {saveMsg && (
                  <p className={`text-xs font-medium ${saveMsg.startsWith('Profil') ? 'text-tertiary' : 'text-primary'}`}>
                    {saveMsg}
                  </p>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving || !firstName || !lastName}
                    className="gradient-primary text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm disabled:opacity-60"
                  >
                    {saving ? 'Enregistrement...' : 'Sauvegarder'}
                  </button>
                </div>
              </div>
            )}

            {/* Security */}
            {section === 'security' && (
              <div className="space-y-6">
                <div className="bg-surface-container-lowest rounded-2xl p-8 ambient-shadow space-y-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-on-surface font-headline">Sécurité</h2>
                    <p className="text-sm text-on-surface-variant mt-0.5">Changer votre mot de passe</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Mot de passe actuel</label>
                      <input type="password" value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Nouveau mot de passe</label>
                      <input type="password" value={pwNew} onChange={(e) => setPwNew(e.target.value)} placeholder="Min. 8 caractères" className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Confirmer le nouveau mot de passe</label>
                      <input type="password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} placeholder="Répéter le nouveau mot de passe" className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  </div>
                  {pwMsg && (
                    <p className={`text-xs font-medium ${pwMsg.startsWith('Mot de passe mis') ? 'text-tertiary' : 'text-primary'}`}>
                      {pwMsg}
                    </p>
                  )}
                  <div className="flex justify-end">
                    <button
                      onClick={handleChangePassword}
                      disabled={pwSaving || !pwCurrent || !pwNew || !pwConfirm}
                      className="gradient-primary text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm disabled:opacity-60"
                    >
                      {pwSaving ? 'Mise à jour...' : 'Mettre à jour'}
                    </button>
                  </div>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl p-8 ambient-shadow">
                  <h3 className="font-extrabold text-on-surface font-headline mb-4">Session active</h3>
                  <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary text-[22px]">computer</span>
                      <div>
                        <p className="text-sm font-bold text-on-surface">Session en cours</p>
                        <p className="text-xs text-on-surface-variant">Navigateur · {user?.role}</p>
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
                  <h2 className="text-xl font-extrabold text-on-surface font-headline">Préférences de notifications</h2>
                  <p className="text-sm text-on-surface-variant mt-0.5">Configurer comment vous recevez les alertes</p>
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
                    Sauvegarder
                  </button>
                </div>
              </div>
            )}

            {/* Preferences */}
            {section === 'preferences' && (
              <div className="bg-surface-container-lowest rounded-2xl p-8 ambient-shadow space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-on-surface font-headline">Préférences</h2>
                  <p className="text-sm text-on-surface-variant mt-0.5">Personnaliser votre expérience</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Vue par défaut du tableau de bord</label>
                    <select className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option>Vue générale</option>
                      <option>Stock</option>
                      <option>Réservations</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Format de date</label>
                    <select className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option>JJ/MM/AAAA</option>
                      <option>MM/JJ/AAAA</option>
                      <option>AAAA-MM-JJ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Fuseau horaire</label>
                    <select className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option>Africa/Abidjan (UTC+0)</option>
                      <option>UTC</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button className="gradient-primary text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm">
                    Sauvegarder
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
                    <p className="text-sm text-on-surface-variant">Système national de gestion des banques de sang</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Version',      value: '1.0.0' },
                    { label: 'Build',        value: '2026.05.26' },
                    { label: 'Version API',  value: 'v1' },
                    { label: 'Licence',      value: 'Propriétaire' },
                  ].map((item) => (
                    <div key={item.label} className="bg-surface-container-low rounded-xl p-4">
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{item.label}</p>
                      <p className="text-sm font-bold text-on-surface mt-1">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-surface-container-low rounded-xl">
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    HEMOSAFE est un système national de gestion des banques de sang conçu pour connecter les hôpitaux et les banques de sang à travers la Côte d'Ivoire, garantissant que le sang vital est toujours disponible quand il est nécessaire. Toutes les données sont chiffrées au repos et en transit via AES-256 et TLS 1.3.
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

import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import {
  Settings,
  Shield,
  Palette,
  User,
  KeyRound,
  Save,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const GlobalSettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // System Settings state
  const [siteName, setSiteName] = useState('FormCraft Pro');
  const [adminEmail, setAdminEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [rateLimitEnabled, setRateLimitEnabled] = useState(true);
  const [maxSubmissionsPerMinute, setMaxSubmissionsPerMinute] = useState(10);
  const [enableSpamHoneypot, setEnableSpamHoneypot] = useState(true);
  const [enableCaptcha, setEnableCaptcha] = useState(false);

  // Profile state
  const [adminName, setAdminName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.getSettings();
        const s = res.settings || {};
        if (s.siteName) setSiteName(s.siteName);
        if (s.adminEmail) setAdminEmail(s.adminEmail);
        if (s.logoUrl) setLogoUrl(s.logoUrl);
        if (s.security) {
          setRateLimitEnabled(s.security.rateLimitEnabled ?? true);
          setMaxSubmissionsPerMinute(s.security.maxSubmissionsPerMinute ?? 10);
          setEnableSpamHoneypot(s.security.enableSpamHoneypot ?? true);
          setEnableCaptcha(s.security.enableCaptcha ?? false);
        }
      } catch (err: any) {
        error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();

    if (user) {
      setAdminName(user.name);
      setProfileEmail(user.email);
    }
  }, [user]);

  const handleSaveSystemSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.updateSettings({
        siteName,
        adminEmail,
        logoUrl,
        security: {
          rateLimitEnabled,
          maxSubmissionsPerMinute,
          enableSpamHoneypot,
          enableCaptcha,
        },
      });
      success('System settings saved successfully.');
    } catch (err: any) {
      error(err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      error('New password and confirm password do not match.');
      return;
    }

    setSavingProfile(true);
    try {
      await api.updateProfile({
        name: adminName,
        email: profileEmail,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      success('Admin profile updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await refreshUser();
    } catch (err: any) {
      error(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Global System Settings</h1>
        <p className="text-xs text-gray-500 mt-1">
          Configure site branding, security thresholds, CAPTCHA, and admin account credentials
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* System Settings Form */}
        <form
          onSubmit={handleSaveSystemSettings}
          className="bg-white p-6 sm:p-7 rounded-3xl border border-gray-200/80 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Application & Branding</h3>
              <p className="text-[11px] text-gray-400">Public portal and email identity</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Website / Organization Name
              </label>
              <input
                type="text"
                value={siteName}
                onChange={e => setSiteName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Admin Alert Notification Email
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Global Logo URL
              </label>
              <input
                type="url"
                value={logoUrl}
                placeholder="https://yourwebsite.com/logo.png"
                onChange={e => setLogoUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Security Toggles */}
            <div className="pt-3 border-t border-gray-100 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-gray-900">Security & Anti-Abuse</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-gray-800">Rate Limiting Protection</p>
                  <p className="text-[10px] text-gray-400">Throttle excess requests per IP</p>
                </div>
                <input
                  type="checkbox"
                  checked={rateLimitEnabled}
                  onChange={e => setRateLimitEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-gray-800">Spam Bot Honeypot</p>
                  <p className="text-[10px] text-gray-400">Invisible fields to trap automated bots</p>
                </div>
                <input
                  type="checkbox"
                  checked={enableSpamHoneypot}
                  onChange={e => setEnableSpamHoneypot(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-gray-800">Require Turnstile / CAPTCHA</p>
                  <p className="text-[10px] text-gray-400">Challenge submissions on public forms</p>
                </div>
                <input
                  type="checkbox"
                  checked={enableCaptcha}
                  onChange={e => setEnableCaptcha(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={savingSettings}
            className="w-full"
            icon={<Save className="w-4 h-4" />}
          >
            Save System Settings
          </Button>
        </form>

        {/* Admin Profile & Password Form */}
        <form
          onSubmit={handleUpdateProfile}
          className="bg-white p-6 sm:p-7 rounded-3xl border border-gray-200/80 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Administrator Profile</h3>
              <p className="text-[11px] text-gray-400">Manage credentials and login email</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={adminName}
                onChange={e => setAdminName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Login Email
              </label>
              <input
                type="email"
                required
                value={profileEmail}
                onChange={e => setProfileEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="pt-3 border-t border-gray-100 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-gray-900">Change Admin Password</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  placeholder="Required only when changing password"
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  placeholder="Min 6 characters"
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  placeholder="Re-type new password"
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            variant="outline"
            isLoading={savingProfile}
            className="w-full"
            icon={<Save className="w-4 h-4" />}
          >
            Update Admin Profile
          </Button>
        </form>
      </div>
    </div>
  );
};

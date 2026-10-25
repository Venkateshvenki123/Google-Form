import React, { useState } from 'react';
import { Form } from '../../types/form';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Check, Globe, Bell, Calendar, Shield, Save } from 'lucide-react';
import { api } from '../../services/api';

interface FormSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: Form;
  onSave: (updatedForm: Partial<Form>) => void;
}

export const FormSettingsModal: React.FC<FormSettingsModalProps> = ({
  isOpen,
  onClose,
  form,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'submissions' | 'notifications' | 'availability'>('general');
  const [name, setName] = useState(form.name);
  const [title, setTitle] = useState(form.title);
  const [slug, setSlug] = useState(form.slug);
  const [description, setDescription] = useState(form.description);
  const [status, setStatus] = useState(form.status);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  // Settings
  const [successMessage, setSuccessMessage] = useState(
    form.settings?.successMessage || 'Your response has been recorded successfully.'
  );
  const [redirectUrl, setRedirectUrl] = useState(form.settings?.redirectUrl || '');
  const [allowMultipleSubmissions, setAllowMultipleSubmissions] = useState(
    form.settings?.allowMultipleSubmissions ?? true
  );
  const [submissionLimit, setSubmissionLimit] = useState<number | ''>(
    form.settings?.submissionLimit ?? ''
  );
  const [startDate, setStartDate] = useState(form.settings?.startDate || '');
  const [endDate, setEndDate] = useState(form.settings?.endDate || '');

  // Notifications
  const [adminNotify, setAdminNotify] = useState(
    form.settings?.emailNotification?.adminNotify ?? false
  );
  const [adminEmail, setAdminEmail] = useState(
    form.settings?.emailNotification?.adminEmail || ''
  );
  const [userNotify, setUserNotify] = useState(
    form.settings?.emailNotification?.userNotify ?? false
  );
  const [userSubject, setUserSubject] = useState(
    form.settings?.emailNotification?.userSubject || 'Submission Confirmation: {{form_name}}'
  );
  const [userMessage, setUserMessage] = useState(
    form.settings?.emailNotification?.userMessage ||
      'Hi {{respondent_name}},\n\nThank you for submitting "{{form_name}}" on {{submission_date}}.\n\nBest regards,\nFormCraft'
  );

  const checkSlug = async (val: string) => {
    setSlug(val);
    if (!val.trim()) {
      setSlugAvailable(null);
      return;
    }
    setSlugChecking(true);
    try {
      const res = await api.checkSlug(val, form.id);
      setSlugAvailable(res.available);
    } catch {
      setSlugAvailable(null);
    } finally {
      setSlugChecking(false);
    }
  };

  const handleSaveAll = () => {
    onSave({
      name,
      title,
      slug,
      description,
      status,
      settings: {
        ...form.settings,
        successMessage,
        redirectUrl,
        allowMultipleSubmissions,
        submissionLimit: submissionLimit === '' ? null : Number(submissionLimit),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        storeResponses: true,
        emailNotification: {
          adminNotify,
          adminEmail,
          userNotify,
          userSubject,
          userMessage,
        },
      },
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Form Configuration & Settings" maxWidth="2xl">
      <div className="flex flex-col h-[520px]">
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 pb-px mb-5 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>General & URL</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('submissions')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'submissions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Submissions</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'notifications'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Email Alerts</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('availability')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'availability'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Availability & Limits</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Internal Form Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Public Form Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Public URL Slug
                </label>
                <div className="flex items-center">
                  <span className="text-xs text-gray-500 bg-gray-100 px-3 py-2.5 rounded-l-xl border border-r-0 border-gray-300 font-mono">
                    /forms/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={e => checkSlug(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-r-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                </div>
                {slugChecking && (
                  <p className="text-[11px] text-gray-400 mt-1">Verifying slug availability...</p>
                )}
                {slugAvailable === true && (
                  <p className="text-[11px] text-emerald-600 mt-1 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> URL slug is available
                  </p>
                )}
                {slugAvailable === false && (
                  <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                    This slug is already used by another form.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Publish Status
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="draft">Draft (Only Admin can preview)</option>
                  <option value="published">Published (Public submissions active)</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Confirmation / Success Message
                </label>
                <textarea
                  rows={3}
                  value={successMessage}
                  onChange={e => setSuccessMessage(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Redirect URL (Optional)
                </label>
                <input
                  type="url"
                  value={redirectUrl}
                  placeholder="https://yourwebsite.com/thank-you"
                  onChange={e => setRedirectUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Redirect respondent to this URL automatically after successful submission
                </p>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <p className="text-xs font-bold text-gray-800">Allow Multiple Submissions</p>
                  <p className="text-[11px] text-gray-400">
                    Allow users to submit this form more than once from the same browser
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={allowMultipleSubmissions}
                  onChange={e => setAllowMultipleSubmissions(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-5">
              {/* Admin Notify */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800">
                    Send Email Notification to Admin on Submission
                  </span>
                  <input
                    type="checkbox"
                    checked={adminNotify}
                    onChange={e => setAdminNotify(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </div>
                {adminNotify && (
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Recipient Admin Email
                    </label>
                    <input
                      type="email"
                      value={adminEmail}
                      placeholder="admin@example.com"
                      onChange={e => setAdminEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg outline-none"
                    />
                  </div>
                )}
              </div>

              {/* User Confirmation */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800">
                    Send Confirmation Email to Respondent
                  </span>
                  <input
                    type="checkbox"
                    checked={userNotify}
                    onChange={e => setUserNotify(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </div>
                {userNotify && (
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        Email Subject
                      </label>
                      <input
                        type="text"
                        value={userSubject}
                        onChange={e => setUserSubject(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        Email Message Body (Variables: &#123;&#123;form_name&#125;&#125;, &#123;&#123;respondent_name&#125;&#125;, &#123;&#123;submission_date&#125;&#125;)
                      </label>
                      <textarea
                        rows={3}
                        value={userMessage}
                        onChange={e => setUserMessage(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg outline-none font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'availability' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Maximum Response Limit (Auto-Close)
                </label>
                <input
                  type="number"
                  min={1}
                  value={submissionLimit}
                  placeholder="e.g. 100 (Leave empty for unlimited)"
                  onChange={e => setSubmissionLimit(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Form automatically disables submissions once this number of responses is reached.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-2 flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveAll} icon={<Save className="w-4 h-4" />}>
            Apply Settings
          </Button>
        </div>
      </div>
    </Modal>
  );
};

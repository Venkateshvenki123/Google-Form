import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { api } from '../../services/api';
import { Form, FormField } from '../../types/form';
import { DynamicFieldRenderer } from '../../components/public/DynamicFieldRenderer';
import { Button } from '../../components/ui/Button';
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  Calendar,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

export const FormRendererPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const isEmbedded = searchParams.get('embedded') === 'true';

  const [form, setForm] = useState<Form | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ message: string; redirectUrl?: string } | null>(
    null
  );

  useEffect(() => {
    if (!slug) return;

    const loadForm = async () => {
      setLoading(true);
      setGeneralError(null);
      try {
        const res = await api.getPublicForm(slug);
        setForm(res.form);

        // Pre-fill default values if any
        const initialAnswers: Record<string, any> = {};
        res.form.fields?.forEach(f => {
          if (f.field_type === 'hidden' && f.settings?.hiddenDefaultValue) {
            initialAnswers[f.id] = f.settings.hiddenDefaultValue;
          }
        });
        setAnswers(initialAnswers);
      } catch (err: any) {
        setGeneralError(err.message || 'Form could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [slug]);

  const handleFieldChange = (fieldId: string, val: any) => {
    setAnswers(prev => ({ ...prev, [fieldId]: val }));
    // Clear field-level error when user modifies value
    if (fieldErrors[fieldId]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const validateClientSide = (): boolean => {
    if (!form || !form.fields) return true;
    const errors: Record<string, string> = {};

    for (const field of form.fields) {
      if (field.field_type === 'section' || field.field_type === 'hidden') continue;

      const val = answers[field.id];
      const isEmpty =
        val === undefined ||
        val === null ||
        val === '' ||
        (Array.isArray(val) && val.length === 0);

      // Required check
      if (field.required && isEmpty) {
        errors[field.id] = `${field.label} is required.`;
        continue;
      }

      if (isEmpty) continue;

      // Email format
      if (field.field_type === 'email') {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(String(val).trim())) {
          errors[field.id] = 'Please enter a valid email address.';
        }
      }

      // URL format
      if (field.field_type === 'url') {
        try {
          const parsed = new URL(String(val).trim());
          if (!['http:', 'https:'].includes(parsed.protocol)) {
            errors[field.id] = 'URL must begin with http:// or https://';
          }
        } catch {
          errors[field.id] = 'Please enter a valid web URL.';
        }
      }

      // Number validation
      if (field.field_type === 'number') {
        const num = Number(val);
        if (isNaN(num)) {
          errors[field.id] = 'Please enter a valid number.';
        } else {
          if (field.validation?.minValue !== undefined && num < field.validation.minValue) {
            errors[field.id] = `Value cannot be less than ${field.validation.minValue}.`;
          }
          if (field.validation?.maxValue !== undefined && num > field.validation.maxValue) {
            errors[field.id] = `Value cannot be greater than ${field.validation.maxValue}.`;
          }
        }
      }

      // Text length validation
      if (['short_text', 'long_text'].includes(field.field_type)) {
        const str = String(val).trim();
        if (field.validation?.minChars !== undefined && str.length < field.validation.minChars) {
          errors[field.id] =
            field.validation.customError ||
            `Must be at least ${field.validation.minChars} characters.`;
        }
        if (field.validation?.maxChars !== undefined && str.length > field.validation.maxChars) {
          errors[field.id] =
            field.validation.customError ||
            `Cannot exceed ${field.validation.maxChars} characters.`;
        }
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;

    if (!validateClientSide()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    setGeneralError(null);

    try {
      const res = await api.submitPublicResponse(slug, {
        answers,
        metadata: {
          submittedFromUrl: window.location.href,
        },
      });

      // Trigger Confetti effect
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      setSubmittedSuccess(true);
      setSuccessInfo({
        message: res.message,
        redirectUrl: res.redirectUrl,
      });

      // Handle redirect if configured
      if (res.redirectUrl) {
        setTimeout(() => {
          window.location.href = res.redirectUrl!;
        }, 3000);
      }
    } catch (err: any) {
      setGeneralError(err.message || 'Submission failed. Please check your answers.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setAnswers({});
    setFieldErrors({});
    setSubmittedSuccess(false);
    setSuccessInfo(null);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
            Loading Form...
          </p>
        </div>
      </div>
    );
  }

  // Error State: Closed or not found
  if (generalError && !form) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Form Unavailable</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto">{generalError}</p>
        <div className="pt-4">
          <Link to="/forms">
            <Button variant="outline" size="sm">
              View Other Published Forms
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!form) return null;

  const theme = form.theme || {
    primaryColor: '#4f46e5',
    buttonColor: '#4f46e5',
    backgroundColor: '#f8fafc',
    font: 'Inter',
    borderRadius: 'rounded-2xl',
    formWidth: 'max-w-3xl',
    layout: 'card',
  };

  const primaryColor = theme.primaryColor || '#4f46e5';
  const buttonColor = theme.buttonColor || primaryColor;
  const borderRadius = theme.borderRadius || 'rounded-2xl';

  // Success Screen
  if (submittedSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div
          className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-200/80 space-y-5"
          style={{ borderTop: `8px solid ${primaryColor}` }}
        >
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-gray-900">Response Recorded</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
              {successInfo?.message || 'Thank you! Your submission has been securely processed.'}
            </p>
          </div>

          {successInfo?.redirectUrl && (
            <p className="text-xs text-gray-400">
              Redirecting you to external page in a few seconds...
            </p>
          )}

          {form.settings?.allowMultipleSubmissions && (
            <div className="pt-4 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetForm}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Submit Another Response
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen py-8 sm:py-12 px-4 flex flex-col items-center`}
      style={{
        backgroundColor: theme.backgroundColor || '#f8fafc',
        fontFamily: theme.font || 'Inter, sans-serif',
      }}
    >
      <form
        onSubmit={handleSubmit}
        className={`w-full ${theme.formWidth || 'max-w-3xl'} space-y-4`}
      >
        {/* Banner image if configured */}
        {theme.bannerUrl && (
          <div className={`w-full h-48 overflow-hidden shadow-sm ${borderRadius}`}>
            <img
              src={theme.bannerUrl}
              alt="Header Banner"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Header Card */}
        <div
          className={`bg-white shadow-sm border border-gray-200/80 overflow-hidden ${borderRadius}`}
          style={{ borderTop: `8px solid ${primaryColor}` }}
        >
          <div className="p-6 sm:p-8 space-y-3">
            {theme.logoUrl && (
              <img
                src={theme.logoUrl}
                alt="Form Logo"
                className="h-10 max-w-[200px] object-contain mb-2"
              />
            )}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {form.title}
            </h1>
            {form.description && (
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                {form.description}
              </p>
            )}

            <div className="pt-2 text-xs text-rose-500 font-semibold">
              * Indicates required question
            </div>
          </div>
        </div>

        {/* Global Error Banner if submission failed */}
        {generalError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs font-semibold text-rose-800">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Dynamic Question Cards */}
        {form.fields?.map(field => {
          if (field.field_type === 'hidden') return null;

          return (
            <div
              key={field.id}
              className={`bg-white shadow-sm border border-gray-200/80 p-6 sm:p-7 transition-all ${borderRadius}`}
            >
              <DynamicFieldRenderer
                field={field}
                value={answers[field.id]}
                onChange={val => handleFieldChange(field.id, val)}
                error={fieldErrors[field.id]}
                primaryColor={primaryColor}
                borderRadius={borderRadius}
              />
            </div>
          );
        })}

        {/* Submit Actions */}
        <div className="pt-4 flex items-center justify-between">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={submitting}
            className={`shadow-md hover:opacity-95 ${borderRadius}`}
            style={{ backgroundColor: buttonColor }}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Submit Form
          </Button>

          <button
            type="button"
            onClick={handleResetForm}
            className="text-xs text-gray-400 hover:text-gray-600 font-medium"
          >
            Clear Form
          </button>
        </div>
      </form>
    </div>
  );
};

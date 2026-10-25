import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Form } from '../../types/form';
import { AnalyticsView } from '../../components/responses/AnalyticsView';
import { useToast } from '../../components/ui/Toast';
import { BarChart3, Layers, Loader2 } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { id: paramFormId } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [forms, setForms] = useState<Form[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>(
    paramFormId || searchParams.get('formId') || ''
  );
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  // Fetch list of forms
  useEffect(() => {
    const loadForms = async () => {
      try {
        const res = await api.listForms();
        setForms(res.forms);
        if (!selectedFormId && res.forms.length > 0) {
          setSelectedFormId(res.forms[0].id);
        }
      } catch (err: any) {
        error(err.message);
      }
    };
    loadForms();
  }, []);

  // Fetch analytics for selected form
  useEffect(() => {
    if (!selectedFormId) return;

    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.getFormAnalytics(selectedFormId);
        setAnalytics(res.analytics);
      } catch (err: any) {
        error(err.message || 'Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [selectedFormId]);

  const handleFormChange = (newId: string) => {
    setSelectedFormId(newId);
    setSearchParams({ formId: newId });
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header and Form Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Form Analytics & Telemetry</h1>
          <p className="text-xs text-gray-500 mt-1">
            Visual breakdown of responses, choice distributions, ratings, and time series
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Select Form:</span>
          <select
            value={selectedFormId}
            onChange={e => handleFormChange(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl font-medium outline-none shadow-sm focus:ring-1 focus:ring-indigo-500"
          >
            {forms.map(f => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.response_count || 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs text-gray-400 font-medium">Computing telemetry insights...</p>
        </div>
      ) : analytics ? (
        <AnalyticsView analytics={analytics} />
      ) : (
        <div className="p-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-200">
          No analytics data available for this form.
        </div>
      )}
    </div>
  );
};

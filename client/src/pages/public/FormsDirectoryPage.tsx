import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Form } from '../../types/form';
import {
  Search,
  FileCheck2,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { CardSkeleton } from '../../components/ui/Skeleton';

export const FormsDirectoryPage: React.FC = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadPublicForms = async () => {
      try {
        const res = await api.getPublicForms();
        setForms(res.forms);
      } catch (err) {
        console.error('Failed to load public forms:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPublicForms();
  }, []);

  const filteredForms = forms.filter(
    f =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Hero Intro */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Active Public Forms</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Explore Available Forms
        </h1>
        <p className="text-sm text-gray-500">
          Select an active application, survey, or registration form below to submit your responses.
        </p>

        {/* Search Input */}
        <div className="pt-4 relative max-w-md mx-auto">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-7" />
          <input
            type="text"
            value={search}
            placeholder="Search forms by keyword..."
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Forms Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/80 shadow-sm p-8 space-y-3">
          <FileCheck2 className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">No Published Forms Available</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Forms created and published in the Admin Panel will be displayed here for respondents.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map(form => {
            const primaryColor = form.theme?.primaryColor || '#4f46e5';
            return (
              <div
                key={form.id}
                className="bg-white rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Banner Preview if present */}
                {form.theme?.bannerUrl ? (
                  <div className="h-36 w-full overflow-hidden bg-gray-100">
                    <img
                      src={form.theme.bannerUrl}
                      alt={form.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div
                    className="h-4 w-full"
                    style={{ backgroundColor: primaryColor }}
                  />
                )}

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-indigo-600 transition-colors">
                      {form.title || form.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                      {form.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(form.created_at).toLocaleDateString()}</span>
                    </div>

                    <Link
                      to={`/forms/${form.slug}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <span>Fill Form</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

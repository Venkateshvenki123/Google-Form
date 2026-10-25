import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Form } from '../../types/form';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { EmbedModal } from '../../components/builder/EmbedModal';
import {
  PlusCircle,
  Search,
  ExternalLink,
  Edit,
  Copy,
  Trash2,
  Share2,
  Inbox,
  BarChart3,
  CheckCircle,
  FileEdit,
  MoreVertical,
  Code,
  Link2,
} from 'lucide-react';

export const FormsList: React.FC = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [embedModalSlug, setEmbedModalSlug] = useState<string | null>(null);
  const { success, error } = useToast();
  const navigate = useNavigate();

  const fetchForms = async () => {
    setLoading(true);
    try {
      const res = await api.listForms({
        status: statusFilter,
        search: search.trim() || undefined,
      });
      setForms(res.forms);
    } catch (err: any) {
      error(err.message || 'Failed to fetch forms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchForms();
  };

  const handleTogglePublish = async (form: Form) => {
    try {
      const res = await api.togglePublish(form.id);
      success(res.message);
      setForms(prev =>
        prev.map(f => (f.id === form.id ? { ...f, status: res.status } : f))
      );
    } catch (err: any) {
      error(err.message);
    }
  };

  const handleDuplicate = async (formId: string) => {
    try {
      const res = await api.duplicateForm(formId);
      success('Form duplicated successfully!');
      fetchForms();
    } catch (err: any) {
      error(err.message);
    }
  };

  const handleDelete = async (form: Form) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${form.name}"? All related responses and fields will be permanently removed.`
      )
    ) {
      try {
        await api.deleteForm(form.id);
        success('Form deleted successfully.');
        setForms(prev => prev.filter(f => f.id !== form.id));
      } catch (err: any) {
        error(err.message);
      }
    }
  };

  const copyPublicLink = (slug: string) => {
    const url = `${window.location.origin}/forms/${slug}`;
    navigator.clipboard.writeText(url);
    success('Public form link copied to clipboard!');
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Form Repository</h1>
          <p className="text-xs text-gray-500 mt-1">
            Build, publish, clone, embed, and oversee unlimited dynamic forms
          </p>
        </div>
        <Link to="/admin/forms/new">
          <Button variant="primary" icon={<PlusCircle className="w-4 h-4" />}>
            Create New Form
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            placeholder="Search by form name or slug..."
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-gray-500">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none"
          >
            <option value="all">All Forms</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>
      </div>

      {/* Forms Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading forms...</div>
        ) : forms.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <PlusCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">No Forms Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Get started by creating your first dynamic form with custom questions and styling.
            </p>
            <Link to="/admin/forms/new">
              <Button variant="primary" size="sm">
                Create First Form
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Form Name & URL</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Responses</th>
                  <th className="py-3.5 px-4">Fields</th>
                  <th className="py-3.5 px-4">Last Updated</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {forms.map(form => (
                  <tr key={form.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Name & Slug */}
                    <td className="py-4 px-5">
                      <div className="font-semibold text-gray-900 text-sm">{form.name}</div>
                      <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-0.5 font-mono">
                        <span>/forms/{form.slug}</span>
                        <button
                          type="button"
                          onClick={() => copyPublicLink(form.slug)}
                          className="hover:text-indigo-600 p-0.5"
                          title="Copy Link"
                        >
                          <Link2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(form)}
                        title="Click to toggle publish status"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                          form.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            form.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                        <span className="capitalize">{form.status}</span>
                      </button>
                    </td>

                    {/* Response Count */}
                    <td className="py-4 px-4 font-semibold text-gray-800">
                      <Link
                        to={`/admin/responses?formId=${form.id}`}
                        className="hover:text-indigo-600 hover:underline flex items-center gap-1.5"
                      >
                        <Inbox className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{form.response_count || 0}</span>
                      </Link>
                    </td>

                    {/* Fields Count */}
                    <td className="py-4 px-4 text-gray-600 font-medium">
                      {form.field_count || 0} questions
                    </td>

                    {/* Updated At */}
                    <td className="py-4 px-4 text-gray-400">
                      {new Date(form.updated_at).toLocaleDateString()}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/admin/forms/${form.id}/edit`}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit in Form Builder"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>

                        <Link
                          to={`/forms/${form.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Preview Public Form"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        <Link
                          to={`/admin/forms/${form.id}/analytics`}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="View Form Analytics"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => setEmbedModalSlug(form.slug)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Get Embed Code"
                        >
                          <Code className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicate(form.id)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Duplicate Form"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(form)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Form"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Embed Code Modal */}
      {embedModalSlug && (
        <EmbedModal
          isOpen={!!embedModalSlug}
          onClose={() => setEmbedModalSlug(null)}
          formSlug={embedModalSlug}
        />
      )}
    </div>
  );
};

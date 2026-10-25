import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Form, FormResponse } from '../../types/form';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { ResponseDetailsModal } from '../../components/responses/ResponseDetailsModal';
import {
  Inbox,
  Search,
  Download,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  AlertTriangle,
  FileText,
} from 'lucide-react';

export const ResponsesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFormId = searchParams.get('formId') || 'all';

  const [forms, setForms] = useState<Form[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>(initialFormId);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 20 });
  const [exporting, setExporting] = useState(false);

  const { success, error } = useToast();

  // Load forms for dropdown
  useEffect(() => {
    const loadForms = async () => {
      try {
        const res = await api.listForms();
        setForms(res.forms);
      } catch (err: any) {
        error(err.message);
      }
    };
    loadForms();
  }, []);

  // Load responses
  const fetchResponses = async () => {
    setLoading(true);
    try {
      const res = await api.listResponses({
        formId: selectedFormId === 'all' ? undefined : selectedFormId,
        search: search.trim() || undefined,
        page,
        limit: 20,
      });
      setResponses(res.responses);
      setPagination(res.pagination);
    } catch (err: any) {
      error(err.message || 'Failed to fetch responses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, [selectedFormId, page]);

  const handleFormChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedFormId(val);
    setPage(1);
    setSearchParams(val === 'all' ? {} : { formId: val });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchResponses();
  };

  const handleViewDetails = async (id: string) => {
    try {
      const res = await api.getResponseDetails(id);
      setSelectedResponse(res.response);
    } catch (err: any) {
      error(err.message || 'Failed to load submission details.');
    }
  };

  const handleDeleteResponse = async (id: string) => {
    try {
      await api.deleteResponse(id);
      success('Response deleted successfully.');
      setResponses(prev => prev.filter(r => r.id !== id));
      if (selectedResponse?.id === id) {
        setSelectedResponse(null);
      }
    } catch (err: any) {
      error(err.message);
    }
  };

  const handleDeleteAll = async () => {
    if (selectedFormId === 'all') {
      error('Please select a specific form from the dropdown to delete its responses.');
      return;
    }
    const currentForm = forms.find(f => f.id === selectedFormId);
    if (
      window.confirm(
        `Are you sure you want to permanently delete ALL responses for "${currentForm?.name}"? This action cannot be reversed.`
      )
    ) {
      try {
        await api.deleteAllResponses(selectedFormId);
        success(`All responses for "${currentForm?.name}" have been deleted.`);
        fetchResponses();
      } catch (err: any) {
        error(err.message);
      }
    }
  };

  const handleExport = (format: 'csv' | 'xlsx') => {
    if (selectedFormId === 'all') {
      error('Please select a specific form before exporting.');
      return;
    }
    const url = api.getExportUrl(selectedFormId, format);
    window.open(url, '_blank');
    success(`Downloading ${format.toUpperCase()} export...`);
  };

  const activeForm = forms.find(f => f.id === selectedFormId);

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Response Submissions</h1>
          <p className="text-xs text-gray-500 mt-1">
            Search, inspect answers, filter by date, and export to CSV/Excel
          </p>
        </div>

        {/* Export & Bulk Delete Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {selectedFormId !== 'all' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                icon={<FileText className="w-3.5 h-3.5 text-emerald-600" />}
              >
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('xlsx')}
                icon={<FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />}
              >
                Export Excel (.xlsx)
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteAll}
                icon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Clear All
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
        {/* Form Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Filter Form:</span>
          <select
            value={selectedFormId}
            onChange={handleFormChange}
            className="w-full md:w-64 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Forms ({forms.length})</option>
            {forms.map(f => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.response_count || 0})
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            placeholder="Search email, submission ID, form..."
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </form>
      </div>

      {/* Responses Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading submissions...</div>
        ) : responses.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">No Responses Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Responses will appear here automatically when respondents submit your published forms.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-3.5 px-5">#</th>
                    <th className="py-3.5 px-4">Submission ID</th>
                    <th className="py-3.5 px-4">Form</th>
                    <th className="py-3.5 px-4">Respondent</th>
                    <th className="py-3.5 px-4">Submitted At</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {responses.map((resp, index) => (
                    <tr
                      key={resp.id}
                      onClick={() => handleViewDetails(resp.id)}
                      className="hover:bg-indigo-50/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-5 font-mono text-gray-400">
                        {(page - 1) * pagination.limit + index + 1}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-gray-700">
                        {resp.id.slice(0, 8)}…
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {resp.form_name || resp.form_title}
                      </td>

                      <td className="py-3.5 px-4 text-gray-600">
                        {resp.respondent_email ? (
                          <span className="font-medium text-indigo-600">
                            {resp.respondent_email}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Anonymous</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                        {new Date(resp.submitted_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleViewDetails(resp.id)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Inspect All Answers"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Delete this submission permanently?')) {
                                handleDeleteResponse(resp.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Submission"
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

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Showing {(page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(page * pagination.limit, pagination.total)} of {pagination.total}{' '}
                  submissions
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 font-semibold text-gray-700">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Response Answers Details Modal */}
      {selectedResponse && (
        <ResponseDetailsModal
          isOpen={!!selectedResponse}
          onClose={() => setSelectedResponse(null)}
          response={selectedResponse}
          onDelete={handleDeleteResponse}
        />
      )}
    </div>
  );
};

import React from 'react';
import { FormResponse } from '../../types/form';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  Calendar,
  Mail,
  Fingerprint,
  FileText,
  ExternalLink,
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  Star,
} from 'lucide-react';

interface ResponseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  response: FormResponse | null;
  onDelete: (id: string) => void;
}

export const ResponseDetailsModal: React.FC<ResponseDetailsModalProps> = ({
  isOpen,
  onClose,
  response,
  onDelete,
}) => {
  if (!response) return null;

  const renderDynamicValue = (fieldType: string, val: any) => {
    if (val === null || val === undefined || val === '') {
      return <span className="text-gray-400 italic">No answer provided</span>;
    }

    if (fieldType === 'file_upload') {
      if (typeof val === 'object' && val.url) {
        return (
          <div className="flex items-center gap-3 p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl">
            <FileText className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <div className="min-w-0 flex-1 truncate">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {val.originalName || 'Attached File'}
              </p>
              {val.size && (
                <p className="text-xs text-gray-500">
                  {(val.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>
            <a
              href={val.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          </div>
        );
      }
      return <span className="text-sm font-mono">{String(val)}</span>;
    }

    if (fieldType === 'yes_no') {
      const isYes = val === true || val === 'true';
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            isYes ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {isYes ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
          <span>{isYes ? 'Yes' : 'No'}</span>
        </span>
      );
    }

    if (fieldType === 'rating') {
      const num = Number(val);
      return (
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-5 h-5 ${
                i < num ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
              }`}
            />
          ))}
          <span className="text-xs font-bold text-gray-600 ml-1.5">{num} / 5</span>
        </div>
      );
    }

    if (fieldType === 'linear_scale') {
      return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm font-bold shadow-sm">
          {val}
        </span>
      );
    }

    if (Array.isArray(val)) {
      return (
        <div className="flex flex-wrap gap-1.5">
          {val.map((item, i) => (
            <span
              key={i}
              className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800 text-xs font-medium"
            >
              {String(item)}
            </span>
          ))}
        </div>
      );
    }

    if (fieldType === 'url') {
      return (
        <a
          href={String(val)}
          target="_blank"
          rel="noreferrer"
          className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 text-sm font-medium"
        >
          <span>{String(val)}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      );
    }

    return <p className="text-sm text-gray-800 whitespace-pre-wrap">{String(val)}</p>;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={response.form_title || response.form_name || 'Submission Details'}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Metadata Header Box */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs">
          <div className="flex items-center gap-2 text-gray-600">
            <Fingerprint className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <div className="truncate">
              <span className="text-gray-400 block font-medium">Submission ID</span>
              <span className="font-mono font-semibold text-gray-800 truncate block">
                {response.id}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <div>
              <span className="text-gray-400 block font-medium">Submitted At</span>
              <span className="font-semibold text-gray-800">
                {new Date(response.submitted_at).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <div className="truncate">
              <span className="text-gray-400 block font-medium">Respondent</span>
              <span className="font-semibold text-gray-800 truncate block">
                {response.respondent_email || 'Anonymous'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Fields & Submitted Answers */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Submitted Answers
          </h4>

          {response.answers && response.answers.length > 0 ? (
            <div className="space-y-3">
              {response.answers.map((answer, index) => (
                <div
                  key={answer.fieldId || index}
                  className="p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {answer.label}
                    </label>
                    <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                      {answer.fieldType.replace('_', ' ')}
                    </span>
                  </div>
                  <div>{renderDynamicValue(answer.fieldType, answer.value)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No structured answers found for this submission.</p>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this response permanently?')) {
                onDelete(response.id);
                onClose();
              }
            }}
            icon={<Trash2 className="w-4 h-4" />}
          >
            Delete Response
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

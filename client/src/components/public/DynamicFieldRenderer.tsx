import React, { useState } from 'react';
import { FormField } from '../../types/form';
import {
  UploadCloud,
  FileCheck,
  Star,
  AlertCircle,
  X,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../services/api';

interface DynamicFieldRendererProps {
  field: FormField;
  value: any;
  onChange: (val: any) => void;
  error?: string;
  primaryColor?: string;
  borderRadius?: string;
}

export const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
  field,
  value,
  onChange,
  error,
  primaryColor = '#4f46e5',
  borderRadius = 'rounded-xl',
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Section header is purely display
  if (field.field_type === 'section') {
    return (
      <div className="pt-6 pb-2 border-b border-gray-200 mt-4 first:mt-0">
        <h3 className="text-xl font-bold text-gray-900">{field.label}</h3>
        {field.description && (
          <p className="text-sm text-gray-500 mt-1">{field.description}</p>
        )}
      </div>
    );
  }

  // Hidden field does not render visually
  if (field.field_type === 'hidden') {
    return null;
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const res = await api.uploadFile(file);
      onChange(res.file);
    } catch (err: any) {
      setUploadError(err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2 group">
      {/* Label & Description */}
      <div className="flex items-start justify-between">
        <div>
          <label className="block text-sm font-semibold text-gray-800">
            {field.label}
            {field.required && (
              <span className="text-rose-500 ml-1 font-bold" title="Required">
                *
              </span>
            )}
          </label>
          {field.description && (
            <p className="text-xs text-gray-500 mt-0.5">{field.description}</p>
          )}
        </div>
      </div>

      {/* Field Input Control */}
      <div>
        {/* Short Text */}
        {field.field_type === 'short_text' && (
          <input
            type="text"
            value={value || ''}
            placeholder={field.placeholder || 'Your answer'}
            onChange={e => onChange(e.target.value)}
            className={`w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-offset-1 focus:border-transparent transition-all outline-none ${borderRadius} ${
              error ? 'border-rose-400 bg-rose-50/20' : 'hover:border-gray-400'
            }`}
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        )}

        {/* Long Text */}
        {field.field_type === 'long_text' && (
          <textarea
            rows={4}
            value={value || ''}
            placeholder={field.placeholder || 'Type your detailed response here...'}
            onChange={e => onChange(e.target.value)}
            className={`w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-offset-1 focus:border-transparent transition-all outline-none ${borderRadius} ${
              error ? 'border-rose-400 bg-rose-50/20' : 'hover:border-gray-400'
            }`}
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        )}

        {/* Email */}
        {field.field_type === 'email' && (
          <input
            type="email"
            value={value || ''}
            placeholder={field.placeholder || 'name@example.com'}
            onChange={e => onChange(e.target.value)}
            className={`w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-offset-1 focus:border-transparent transition-all outline-none ${borderRadius} ${
              error ? 'border-rose-400 bg-rose-50/20' : 'hover:border-gray-400'
            }`}
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        )}

        {/* Phone */}
        {field.field_type === 'phone' && (
          <input
            type="tel"
            value={value || ''}
            placeholder={field.placeholder || '+1 (555) 000-0000'}
            onChange={e => onChange(e.target.value)}
            className={`w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-offset-1 focus:border-transparent transition-all outline-none ${borderRadius} ${
              error ? 'border-rose-400 bg-rose-50/20' : 'hover:border-gray-400'
            }`}
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        )}

        {/* Number */}
        {field.field_type === 'number' && (
          <input
            type="number"
            value={value !== undefined ? value : ''}
            min={field.validation?.minValue}
            max={field.validation?.maxValue}
            placeholder={field.placeholder || 'Enter a number'}
            onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
            className={`w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-offset-1 focus:border-transparent transition-all outline-none ${borderRadius} ${
              error ? 'border-rose-400 bg-rose-50/20' : 'hover:border-gray-400'
            }`}
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        )}

        {/* URL */}
        {field.field_type === 'url' && (
          <input
            type="url"
            value={value || ''}
            placeholder={field.placeholder || 'https://example.com'}
            onChange={e => onChange(e.target.value)}
            className={`w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-offset-1 focus:border-transparent transition-all outline-none ${borderRadius} ${
              error ? 'border-rose-400 bg-rose-50/20' : 'hover:border-gray-400'
            }`}
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        )}

        {/* Date */}
        {field.field_type === 'date' && (
          <input
            type="date"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className={`w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-offset-1 focus:border-transparent transition-all outline-none ${borderRadius} ${
              error ? 'border-rose-400 bg-rose-50/20' : 'hover:border-gray-400'
            }`}
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        )}

        {/* Time */}
        {field.field_type === 'time' && (
          <input
            type="time"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className={`w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-offset-1 focus:border-transparent transition-all outline-none ${borderRadius} ${
              error ? 'border-rose-400 bg-rose-50/20' : 'hover:border-gray-400'
            }`}
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        )}

        {/* Date & Time */}
        {field.field_type === 'date_time' && (
          <input
            type="datetime-local"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className={`w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-offset-1 focus:border-transparent transition-all outline-none ${borderRadius} ${
              error ? 'border-rose-400 bg-rose-50/20' : 'hover:border-gray-400'
            }`}
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        )}

        {/* Dropdown */}
        {field.field_type === 'dropdown' && (
          <select
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className={`w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-offset-1 focus:border-transparent transition-all outline-none ${borderRadius} ${
              error ? 'border-rose-400 bg-rose-50/20' : 'hover:border-gray-400'
            }`}
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          >
            <option value="">{field.placeholder || 'Select an option'}</option>
            {field.options?.map(opt => (
              <option key={opt.id} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {/* Multiple Choice (Radio) */}
        {field.field_type === 'multiple_choice' && (
          <div className="space-y-2.5 pt-1">
            {field.options?.map(opt => (
              <label
                key={opt.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-all"
              >
                <input
                  type="radio"
                  name={field.id}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={() => onChange(opt.value)}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  style={{ accentColor: primaryColor }}
                />
                <span className="text-sm font-medium text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        )}

        {/* Checkbox (Multi-select) */}
        {field.field_type === 'checkbox' && (
          <div className="space-y-2.5 pt-1">
            {field.options?.map(opt => {
              const currentList: string[] = Array.isArray(value) ? value : [];
              const isChecked = currentList.includes(opt.value);

              const handleToggle = () => {
                if (isChecked) {
                  onChange(currentList.filter(v => v !== opt.value));
                } else {
                  onChange([...currentList, opt.value]);
                }
              };

              return (
                <label
                  key={opt.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-all"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={handleToggle}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    style={{ accentColor: primaryColor }}
                  />
                  <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                </label>
              );
            })}
          </div>
        )}

        {/* Yes / No */}
        {field.field_type === 'yes_no' && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => onChange(true)}
              className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                value === true
                  ? 'border-transparent text-white shadow-sm'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
              style={value === true ? { backgroundColor: primaryColor } : {}}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => onChange(false)}
              className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                value === false
                  ? 'border-transparent text-white shadow-sm'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
              style={value === false ? { backgroundColor: primaryColor } : {}}
            >
              No
            </button>
          </div>
        )}

        {/* Rating (Stars) */}
        {field.field_type === 'rating' && (
          <div className="flex items-center gap-2 pt-1">
            {Array.from({ length: field.settings?.ratingMax || 5 }).map((_, i) => {
              const starVal = i + 1;
              const isActive = (value || 0) >= starVal;
              return (
                <button
                  type="button"
                  key={starVal}
                  onClick={() => onChange(starVal)}
                  className="p-1 hover:scale-110 transition-transform focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      isActive
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300 hover:text-amber-300'
                    }`}
                  />
                </button>
              );
            })}
            {value && (
              <span className="text-xs font-semibold text-gray-500 ml-2">
                {value} / {field.settings?.ratingMax || 5}
              </span>
            )}
          </div>
        )}

        {/* Linear Scale */}
        {field.field_type === 'linear_scale' && (
          <div className="pt-2">
            <div className="flex items-center justify-between gap-1 overflow-x-auto py-2">
              {Array.from({
                length:
                  (field.settings?.scaleMax || 10) - (field.settings?.scaleMin || 1) + 1,
              }).map((_, i) => {
                const score = (field.settings?.scaleMin || 1) + i;
                const isSelected = value === score;
                return (
                  <button
                    type="button"
                    key={score}
                    onClick={() => onChange(score)}
                    className={`flex flex-col items-center justify-center w-10 h-10 rounded-xl text-sm font-bold border transition-all ${
                      isSelected
                        ? 'border-transparent text-white shadow-sm scale-105'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                    style={isSelected ? { backgroundColor: primaryColor } : {}}
                  >
                    {score}
                  </button>
                );
              })}
            </div>
            {(field.settings?.scaleMinLabel || field.settings?.scaleMaxLabel) && (
              <div className="flex justify-between text-xs text-gray-500 font-medium px-1 mt-1">
                <span>{field.settings?.scaleMinLabel}</span>
                <span>{field.settings?.scaleMaxLabel}</span>
              </div>
            )}
          </div>
        )}

        {/* File Upload */}
        {field.field_type === 'file_upload' && (
          <div className="pt-1">
            {value?.url ? (
              <div className="flex items-center justify-between p-3.5 bg-indigo-50/50 border border-indigo-200 rounded-xl text-sm">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileCheck className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <div className="truncate">
                    <p className="font-semibold text-gray-900 truncate">
                      {value.originalName || 'Uploaded Document'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {value.size ? `${(value.size / 1024 / 1024).toFixed(2)} MB` : 'Ready'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={value.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 text-indigo-600 hover:text-indigo-800"
                    title="View file"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => onChange(null)}
                    className="p-1 text-gray-400 hover:text-rose-600"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <label
                className={`flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50/20 cursor-pointer transition-all ${
                  uploading ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <UploadCloud className="w-8 h-8 text-indigo-500 mb-2" />
                <span className="text-sm font-semibold text-gray-700">
                  {uploading ? 'Uploading securely...' : 'Click or drag file to upload'}
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  Max file size: {field.validation?.maxFileSizeMB || 10}MB (PDF, DOCX, Images)
                </span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept={field.validation?.allowedFileTypes?.map(t => `.${t}`).join(',') || undefined}
                />
              </label>
            )}
            {uploadError && (
              <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {uploadError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Field Error Message */}
      {error && (
        <p className="text-xs font-medium text-rose-600 flex items-center gap-1.5 pt-0.5 animate-in fade-in duration-200">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

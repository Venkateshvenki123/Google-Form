import React from 'react';
import { FormField, FieldType } from '../../types/form';
import {
  Settings,
  Trash2,
  Plus,
  Sliders,
  ShieldAlert,
  HelpCircle,
  FileText,
} from 'lucide-react';

interface FieldEditorProps {
  field: FormField | null;
  onUpdateField: (updated: FormField) => void;
  onDeleteField: (fieldId: string) => void;
}

export const FieldEditor: React.FC<FieldEditorProps> = ({
  field,
  onUpdateField,
  onDeleteField,
}) => {
  if (!field) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6 flex flex-col items-center justify-center text-center text-gray-400 h-full flex-shrink-0">
        <Settings className="w-10 h-10 text-gray-300 mb-3 animate-spin-slow" />
        <h4 className="text-sm font-semibold text-gray-700">Question Inspector</h4>
        <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
          Select any question card on the canvas to configure its properties, options, and validation rules.
        </p>
      </div>
    );
  }

  const handleTextChange = (key: keyof FormField, val: any) => {
    onUpdateField({ ...field, [key]: val });
  };

  const handleValidationChange = (key: string, val: any) => {
    onUpdateField({
      ...field,
      validation: {
        ...field.validation,
        [key]: val === '' ? undefined : val,
      },
    });
  };

  const handleSettingsChange = (key: string, val: any) => {
    onUpdateField({
      ...field,
      settings: {
        ...field.settings,
        [key]: val === '' ? undefined : val,
      },
    });
  };

  // Choice Options Helpers
  const addOption = () => {
    const currentOptions = field.options || [];
    const newIdx = currentOptions.length + 1;
    const newOpt = {
      id: `opt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      label: `Option ${newIdx}`,
      value: `option_${newIdx}`,
    };
    onUpdateField({ ...field, options: [...currentOptions, newOpt] });
  };

  const updateOption = (idx: number, label: string) => {
    const currentOptions = [...(field.options || [])];
    if (currentOptions[idx]) {
      currentOptions[idx] = {
        ...currentOptions[idx],
        label,
        value: label.toLowerCase().trim().replace(/\s+/g, '_'),
      };
      onUpdateField({ ...field, options: currentOptions });
    }
  };

  const removeOption = (idx: number) => {
    const currentOptions = [...(field.options || [])];
    currentOptions.splice(idx, 1);
    onUpdateField({ ...field, options: currentOptions });
  };

  const isChoiceField = ['multiple_choice', 'checkbox', 'dropdown'].includes(field.field_type);
  const isTextField = ['short_text', 'long_text'].includes(field.field_type);
  const isNumberField = field.field_type === 'number';
  const isScaleField = field.field_type === 'linear_scale';
  const isRatingField = field.field_type === 'rating';
  const isFileField = field.field_type === 'file_upload';

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Question Settings
          </h3>
        </div>
        <button
          type="button"
          onClick={() => onDeleteField(field.id)}
          className="text-gray-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors"
          title="Delete this question"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Basic Fields */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Field Label / Question Title
            </label>
            <input
              type="text"
              value={field.label}
              onChange={e => handleTextChange('label', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Help Text / Description
            </label>
            <textarea
              rows={2}
              value={field.description || ''}
              placeholder="Optional explanatory instructions..."
              onChange={e => handleTextChange('description', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          {!['section', 'hidden'].includes(field.field_type) && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Placeholder Text
              </label>
              <input
                type="text"
                value={field.placeholder || ''}
                placeholder="Hint shown in empty input..."
                onChange={e => handleTextChange('placeholder', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
          )}

          {/* Required Toggle */}
          {!['section', 'hidden'].includes(field.field_type) && (
            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-700">Mandatory / Required</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={e => handleTextChange('required', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          )}
        </div>

        {/* Choice Options Configuration */}
        {isChoiceField && (
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700">Answer Options</span>
              <button
                type="button"
                onClick={addOption}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Option</span>
              </button>
            </div>

            <div className="space-y-2">
              {field.options?.map((opt, idx) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400 font-mono w-4">{idx + 1}.</span>
                  <input
                    type="text"
                    value={opt.label}
                    onChange={e => updateOption(idx, e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                  {field.options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOption(idx)}
                      className="p-1 text-gray-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Linear Scale Configuration */}
        {isScaleField && (
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <span className="text-xs font-bold text-gray-700 block">Scale Settings</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-gray-500">Min Score</label>
                <select
                  value={field.settings?.scaleMin || 1}
                  onChange={e => handleSettingsChange('scaleMin', Number(e.target.value))}
                  className="w-full p-1.5 text-xs border border-gray-200 rounded-lg"
                >
                  <option value={0}>0</option>
                  <option value={1}>1</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-gray-500">Max Score</label>
                <select
                  value={field.settings?.scaleMax || 10}
                  onChange={e => handleSettingsChange('scaleMax', Number(e.target.value))}
                  className="w-full p-1.5 text-xs border border-gray-200 rounded-lg"
                >
                  <option value={5}>5</option>
                  <option value={7}>7</option>
                  <option value={10}>10</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-gray-500">Low Label (e.g. Strongly Disagree)</label>
              <input
                type="text"
                value={field.settings?.scaleMinLabel || ''}
                placeholder="Poor"
                onChange={e => handleSettingsChange('scaleMinLabel', e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-500">High Label (e.g. Strongly Agree)</label>
              <input
                type="text"
                value={field.settings?.scaleMaxLabel || ''}
                placeholder="Excellent"
                onChange={e => handleSettingsChange('scaleMaxLabel', e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Star Rating Configuration */}
        {isRatingField && (
          <div className="space-y-2 pt-3 border-t border-gray-100">
            <span className="text-xs font-bold text-gray-700 block">Maximum Stars</span>
            <select
              value={field.settings?.ratingMax || 5}
              onChange={e => handleSettingsChange('ratingMax', Number(e.target.value))}
              className="w-full p-2 text-xs border border-gray-200 rounded-lg"
            >
              <option value={3}>3 Stars</option>
              <option value={5}>5 Stars (Standard)</option>
              <option value={7}>7 Stars</option>
              <option value={10}>10 Stars</option>
            </select>
          </div>
        )}

        {/* File Upload Settings */}
        {isFileField && (
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <span className="text-xs font-bold text-gray-700 block">File Restrictions</span>
            <div>
              <label className="text-[11px] text-gray-500">Max File Size (MB)</label>
              <input
                type="number"
                min={1}
                max={50}
                value={field.validation?.maxFileSizeMB || 10}
                onChange={e => handleValidationChange('maxFileSizeMB', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Validation Rules Section */}
        {(isTextField || isNumberField) && (
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-500" />
              <span>Validation Rules</span>
            </span>

            {isTextField && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-gray-500">Min Chars</label>
                  <input
                    type="number"
                    min={0}
                    value={field.validation?.minChars || ''}
                    placeholder="0"
                    onChange={e => handleValidationChange('minChars', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500">Max Chars</label>
                  <input
                    type="number"
                    min={0}
                    value={field.validation?.maxChars || ''}
                    placeholder="1000"
                    onChange={e => handleValidationChange('maxChars', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg"
                  />
                </div>
              </div>
            )}

            {isNumberField && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-gray-500">Min Value</label>
                  <input
                    type="number"
                    value={field.validation?.minValue ?? ''}
                    placeholder="Min"
                    onChange={e => handleValidationChange('minValue', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500">Max Value</label>
                  <input
                    type="number"
                    value={field.validation?.maxValue ?? ''}
                    placeholder="Max"
                    onChange={e => handleValidationChange('maxValue', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] text-gray-500">Custom Error Message</label>
              <input
                type="text"
                value={field.validation?.customError || ''}
                placeholder="Displays if validation fails"
                onChange={e => handleValidationChange('customError', e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

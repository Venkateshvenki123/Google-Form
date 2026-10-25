import React from 'react';
import { Form, FormField, FieldType } from '../../types/form';
import {
  GripVertical,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
  Sparkles,
} from 'lucide-react';
import { DynamicFieldRenderer } from '../public/DynamicFieldRenderer';

interface FormCanvasProps {
  form: Form;
  fields: FormField[];
  selectedFieldId: string | null;
  onSelectField: (id: string) => void;
  onUpdateField: (updated: FormField) => void;
  onDeleteField: (id: string) => void;
  onDuplicateField: (field: FormField) => void;
  onReorderField: (index: number, direction: 'up' | 'down') => void;
  onUpdateHeader: (title: string, description: string) => void;
  onAddField: (type: FieldType) => void;
}

export const FormCanvas: React.FC<FormCanvasProps> = ({
  form,
  fields,
  selectedFieldId,
  onSelectField,
  onUpdateField,
  onDeleteField,
  onDuplicateField,
  onReorderField,
  onUpdateHeader,
  onAddField,
}) => {
  const primaryColor = form.theme?.primaryColor || '#4f46e5';

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100/70 p-4 sm:p-8 flex flex-col items-center">
      <div className={`w-full ${form.theme?.formWidth || 'max-w-3xl'} space-y-4 pb-16`}>
        {/* Banner image if configured */}
        {form.theme?.bannerUrl && (
          <div className="w-full h-44 rounded-2xl overflow-hidden shadow-sm border border-gray-200">
            <img
              src={form.theme.bannerUrl}
              alt="Form Banner"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Top Header Card (Google Forms Look) */}
        <div
          className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative"
          style={{ borderTop: `8px solid ${primaryColor}` }}
        >
          <div className="p-6 sm:p-8 space-y-3">
            <input
              type="text"
              value={form.title}
              onChange={e => onUpdateHeader(e.target.value, form.description)}
              placeholder="Untitled Form"
              className="w-full text-2xl sm:text-3xl font-bold text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-indigo-600 outline-none pb-1 transition-colors"
            />
            <textarea
              rows={2}
              value={form.description}
              onChange={e => onUpdateHeader(form.title, e.target.value)}
              placeholder="Form description or instructions for respondents..."
              className="w-full text-sm text-gray-600 border-b border-transparent hover:border-gray-300 focus:border-indigo-600 outline-none py-1 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Field Cards */}
        {fields.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">Your Form is Empty</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                Pick any question type from the palette on the left to start building your dynamic form.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onAddField('short_text')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Short Answer Question</span>
            </button>
          </div>
        ) : (
          fields.map((field, index) => {
            const isSelected = selectedFieldId === field.id;
            return (
              <div
                key={field.id}
                onClick={() => onSelectField(field.id)}
                className={`bg-white rounded-2xl shadow-sm border transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={isSelected ? { borderLeft: `6px solid ${primaryColor}` } : {}}
              >
                {/* Drag / Reorder Handle Bar */}
                <div className="flex items-center justify-between px-5 pt-3 pb-1 border-b border-gray-50">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <GripVertical className="w-4 h-4 cursor-grab" />
                    <span className="text-[11px] font-mono font-semibold uppercase">
                      Q{index + 1} • {field.field_type.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={e => {
                        e.stopPropagation();
                        onReorderField(index, 'up');
                      }}
                      className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-20"
                      title="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={index === fields.length - 1}
                      onClick={e => {
                        e.stopPropagation();
                        onReorderField(index, 'down');
                      }}
                      className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-20"
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Live Preview / Inline Editor */}
                <div className="p-6 pointer-events-none">
                  <DynamicFieldRenderer
                    field={field}
                    value={null}
                    onChange={() => {}}
                    primaryColor={primaryColor}
                    borderRadius={form.theme?.borderRadius}
                  />
                </div>

                {/* Quick Action Footer on Selected Card */}
                {isSelected && (
                  <div className="px-6 py-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={e => onUpdateField({ ...field, required: e.target.checked })}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-semibold text-gray-700">Required</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onDuplicateField(field);
                        }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors"
                        title="Duplicate Question"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onDeleteField(field.id);
                        }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Quick Add Bottom Bar */}
        {fields.length > 0 && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => onAddField('short_text')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-gray-300 shadow-sm text-xs font-semibold text-gray-700 hover:border-indigo-500 hover:text-indigo-600 transition-all hover:shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add Question Below</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

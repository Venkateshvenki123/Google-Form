import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Form, FormField, FieldType, FormTheme, FormSettingsData } from '../../types/form';
import { FieldPalette } from '../../components/builder/FieldPalette';
import { FormCanvas } from '../../components/builder/FormCanvas';
import { FieldEditor } from '../../components/builder/FieldEditor';
import { FormSettingsModal } from '../../components/builder/FormSettingsModal';
import { ThemeCustomizer } from '../../components/builder/ThemeCustomizer';
import { EmbedModal } from '../../components/builder/EmbedModal';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import {
  Save,
  Eye,
  Settings,
  Palette,
  Share2,
  ArrowLeft,
  Check,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export const FormBuilderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error, info } = useToast();

  const isNew = !id || id === 'new';

  const [form, setForm] = useState<Form>({
    id: '',
    name: 'Untitled Form',
    slug: 'untitled-form',
    title: 'Untitled Form',
    description: '',
    status: 'draft',
    settings: {
      successMessage: 'Your response has been recorded successfully.',
      redirectUrl: '',
      allowMultipleSubmissions: true,
      requireLogin: false,
      enableCaptcha: false,
      submissionLimit: null,
      storeResponses: true,
      emailNotification: {
        adminNotify: false,
        adminEmail: '',
        userNotify: false,
      },
    },
    theme: {
      primaryColor: '#4f46e5',
      buttonColor: '#4f46e5',
      backgroundColor: '#f8fafc',
      font: 'Inter',
      borderRadius: 'rounded-xl',
      formWidth: 'max-w-3xl',
      layout: 'card',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isEmbedOpen, setIsEmbedOpen] = useState(false);

  // Load existing form if editing
  useEffect(() => {
    if (!isNew && id) {
      const loadForm = async () => {
        try {
          const res = await api.getFormById(id);
          setForm(res.form);
          const loadedFields = res.form.fields || [];
          setFields(loadedFields);
          if (loadedFields.length > 0) {
            setSelectedFieldId(loadedFields[0].id);
          }
        } catch (err: any) {
          error(err.message || 'Failed to load form');
          navigate('/admin/forms');
        } finally {
          setLoading(false);
        }
      };
      loadForm();
    } else {
      // New form initial default question
      const defaultField: FormField = {
        id: `f-${Date.now().toString(36)}`,
        field_type: 'short_text',
        label: 'Untitled Question',
        description: '',
        placeholder: 'Enter answer...',
        required: false,
        options: [],
        validation: {},
        position: 0,
        settings: {},
      };
      setFields([defaultField]);
      setSelectedFieldId(defaultField.id);
    }
  }, [id, isNew]);

  // Handle Adding Field
  const handleAddField = (type: FieldType) => {
    const newFieldId = `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    let initialOptions: any[] = [];

    if (['multiple_choice', 'checkbox', 'dropdown'].includes(type)) {
      initialOptions = [
        { id: 'opt-1', label: 'Option 1', value: 'option_1' },
        { id: 'opt-2', label: 'Option 2', value: 'option_2' },
      ];
    }

    const newField: FormField = {
      id: newFieldId,
      field_type: type,
      label: type === 'section' ? 'New Section' : `Untitled Question`,
      description: '',
      placeholder: '',
      required: false,
      options: initialOptions,
      validation: {},
      position: fields.length,
      settings: type === 'linear_scale' ? { scaleMin: 1, scaleMax: 5, scaleMinLabel: 'Low', scaleMaxLabel: 'High' } : {},
    };

    setFields(prev => [...prev, newField]);
    setSelectedFieldId(newFieldId);
    setSaveStatus('unsaved');
  };

  // Handle Field Updates
  const handleUpdateField = (updated: FormField) => {
    setFields(prev => prev.map(f => (f.id === updated.id ? updated : f)));
    setSaveStatus('unsaved');
  };

  // Handle Field Delete
  const handleDeleteField = (fieldId: string) => {
    setFields(prev => {
      const remaining = prev.filter(f => f.id !== fieldId);
      if (selectedFieldId === fieldId) {
        setSelectedFieldId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });
    setSaveStatus('unsaved');
  };

  // Handle Field Duplicate
  const handleDuplicateField = (field: FormField) => {
    const dupId = `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const cloned: FormField = {
      ...field,
      id: dupId,
      label: `${field.label} (Copy)`,
      options: field.options?.map(o => ({ ...o, id: `opt-${Math.random().toString(36).slice(2, 7)}` })) || [],
      position: field.position + 1,
    };

    const targetIdx = fields.findIndex(f => f.id === field.id);
    const updated = [...fields];
    updated.splice(targetIdx + 1, 0, cloned);
    setFields(updated);
    setSelectedFieldId(dupId);
    setSaveStatus('unsaved');
  };

  // Handle Reorder
  const handleReorderField = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= fields.length) return;

    const list = [...fields];
    const [moved] = list.splice(index, 1);
    list.splice(newIdx, 0, moved);

    // Update positions
    list.forEach((f, idx) => (f.position = idx));
    setFields(list);
    setSaveStatus('unsaved');
  };

  // Handle Header Title & Description
  const handleUpdateHeader = (title: string, description: string) => {
    setForm(prev => ({
      ...prev,
      title,
      name: prev.name === 'Untitled Form' ? title : prev.name,
      description,
    }));
    setSaveStatus('unsaved');
  };

  // Save / Auto-Save Action
  const handleSaveForm = async () => {
    setSaving(true);
    setSaveStatus('saving');

    try {
      if (isNew) {
        const res = await api.createForm({
          ...form,
          fields,
        });
        success('Form created and saved successfully!');
        setSaveStatus('saved');
        navigate(`/admin/forms/${res.form.id}/edit`, { replace: true });
      } else {
        await api.updateForm(form.id, {
          ...form,
          fields,
        });
        success('Changes saved successfully.');
        setSaveStatus('saved');
      }
    } catch (err: any) {
      error(err.message || 'Failed to save form.');
      setSaveStatus('unsaved');
    } finally {
      setSaving(false);
    }
  };

  const selectedField = fields.find(f => f.id === selectedFieldId) || null;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      {/* Top Header Bar */}
      <header className="h-16 border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between bg-white z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/forms"
            className="p-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            title="Back to all forms"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm truncate max-w-xs sm:max-w-md">
                {form.title || 'Untitled Form'}
              </span>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  form.status === 'published'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {form.status}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-mono">/forms/{form.slug}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Save Status Pill */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 mr-2">
            {saveStatus === 'saving' && (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>All changes saved</span>
              </>
            )}
            {saveStatus === 'unsaved' && (
              <span className="text-amber-600 font-semibold">• Unsaved changes</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsThemeOpen(true)}
            className="p-2 rounded-xl text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Customize Design & Theme"
          >
            <Palette className="w-4 h-4" />
            <span className="hidden md:inline">Theme</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Form Settings"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">Settings</span>
          </button>

          {!isNew && (
            <button
              type="button"
              onClick={() => setIsEmbedOpen(true)}
              className="p-2 rounded-xl text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Share & Embed Form"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden md:inline">Embed</span>
            </button>
          )}

          {!isNew && (
            <Link
              to={`/forms/${form.slug}`}
              target="_blank"
              className="p-2 rounded-xl text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Preview Form in New Tab"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden md:inline">Preview</span>
            </Link>
          )}

          <Button
            variant="primary"
            size="sm"
            isLoading={saving}
            onClick={handleSaveForm}
            icon={<Save className="w-3.5 h-3.5" />}
          >
            Save Form
          </Button>
        </div>
      </header>

      {/* 3-Column Studio Layout: Left (Palette) | Center (Canvas) | Right (Inspector) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Palette */}
        <FieldPalette onAddField={handleAddField} />

        {/* Center: Live Interactive Form Canvas */}
        <FormCanvas
          form={form}
          fields={fields}
          selectedFieldId={selectedFieldId}
          onSelectField={setSelectedFieldId}
          onUpdateField={handleUpdateField}
          onDeleteField={handleDeleteField}
          onDuplicateField={handleDuplicateField}
          onReorderField={handleReorderField}
          onUpdateHeader={handleUpdateHeader}
          onAddField={handleAddField}
        />

        {/* Right: Field Properties Inspector */}
        <FieldEditor
          field={selectedField}
          onUpdateField={handleUpdateField}
          onDeleteField={handleDeleteField}
        />
      </div>

      {/* Settings Modal */}
      <FormSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        form={form}
        onSave={updated => {
          setForm(prev => ({ ...prev, ...updated }));
          setSaveStatus('unsaved');
        }}
      />

      {/* Theme Customizer Modal */}
      <ThemeCustomizer
        isOpen={isThemeOpen}
        onClose={() => setIsThemeOpen(false)}
        theme={form.theme}
        onSaveTheme={newTheme => {
          setForm(prev => ({ ...prev, theme: newTheme }));
          setSaveStatus('unsaved');
        }}
      />

      {/* Embed Modal */}
      <EmbedModal
        isOpen={isEmbedOpen}
        onClose={() => setIsEmbedOpen(false)}
        formSlug={form.slug}
      />
    </div>
  );
};

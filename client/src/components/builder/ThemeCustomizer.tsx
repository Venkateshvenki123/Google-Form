import React from 'react';
import { FormTheme } from '../../types/form';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Palette, Check, Save } from 'lucide-react';

interface ThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  theme: FormTheme;
  onSaveTheme: (newTheme: FormTheme) => void;
}

const PRESET_COLORS = [
  '#4f46e5', // Indigo
  '#0284c7', // Sky Blue
  '#059669', // Emerald Green
  '#d97706', // Amber
  '#dc2626', // Red
  '#7c3aed', // Purple
  '#db2777', // Pink
  '#0f172a', // Slate / Dark
];

const PRESET_FONTS = [
  { label: 'Inter (Modern Sans)', value: 'Inter' },
  { label: 'Plus Jakarta Sans (Clean Tech)', value: 'Plus Jakarta Sans' },
  { label: 'Roboto (Google Classic)', value: 'Roboto' },
  { label: 'System UI', value: 'system-ui' },
];

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({
  isOpen,
  onClose,
  theme,
  onSaveTheme,
}) => {
  const [localTheme, setLocalTheme] = React.useState<FormTheme>({ ...theme });

  React.useEffect(() => {
    setLocalTheme({ ...theme });
  }, [theme]);

  const update = (key: keyof FormTheme, val: any) => {
    setLocalTheme(prev => ({ ...prev, [key]: val }));
  };

  const handleApply = () => {
    onSaveTheme(localTheme);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Brand & Design Customization" maxWidth="xl">
      <div className="space-y-6">
        {/* Color Presets */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Primary Accent Color
          </label>
          <div className="flex items-center gap-2.5 flex-wrap">
            {PRESET_COLORS.map(color => (
              <button
                type="button"
                key={color}
                onClick={() => {
                  update('primaryColor', color);
                  update('buttonColor', color);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-sm"
                style={{ backgroundColor: color }}
              >
                {localTheme.primaryColor === color && (
                  <Check className="w-4 h-4 text-white stroke-[3]" />
                )}
              </button>
            ))}
            <div className="flex items-center gap-1.5 ml-2">
              <input
                type="color"
                value={localTheme.primaryColor}
                onChange={e => {
                  update('primaryColor', e.target.value);
                  update('buttonColor', e.target.value);
                }}
                className="w-8 h-8 rounded-lg cursor-pointer border border-gray-200"
              />
              <span className="text-xs text-gray-500 font-mono">{localTheme.primaryColor}</span>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Font Family
            </label>
            <select
              value={localTheme.font}
              onChange={e => update('font', e.target.value)}
              className="w-full p-2.5 text-xs border border-gray-300 rounded-xl outline-none"
            >
              {PRESET_FONTS.map(f => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Corner Radius
            </label>
            <select
              value={localTheme.borderRadius}
              onChange={e => update('borderRadius', e.target.value)}
              className="w-full p-2.5 text-xs border border-gray-300 rounded-xl outline-none"
            >
              <option value="rounded-none">Square (0px)</option>
              <option value="rounded-lg">Slightly Rounded (8px)</option>
              <option value="rounded-xl">Standard (12px)</option>
              <option value="rounded-2xl">Modern Soft (16px)</option>
            </select>
          </div>
        </div>

        {/* Layout & Width */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Layout Style
            </label>
            <select
              value={localTheme.layout}
              onChange={e => update('layout', e.target.value as any)}
              className="w-full p-2.5 text-xs border border-gray-300 rounded-xl outline-none"
            >
              <option value="card">Card Style (Google Forms look)</option>
              <option value="single">Single Continuous Page</option>
              <option value="minimal">Minimalist Clean</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Form Width
            </label>
            <select
              value={localTheme.formWidth}
              onChange={e => update('formWidth', e.target.value)}
              className="w-full p-2.5 text-xs border border-gray-300 rounded-xl outline-none"
            >
              <option value="max-w-2xl">Compact (672px)</option>
              <option value="max-w-3xl">Standard (768px)</option>
              <option value="max-w-4xl">Wide (896px)</option>
            </select>
          </div>
        </div>

        {/* Banner & Logo Image URLs */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Header Banner Image URL (Optional)
            </label>
            <input
              type="url"
              value={localTheme.bannerUrl || ''}
              placeholder="https://images.unsplash.com/... or uploaded URL"
              onChange={e => update('bannerUrl', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Logo Image URL (Optional)
            </label>
            <input
              type="url"
              value={localTheme.logoUrl || ''}
              placeholder="https://yourwebsite.com/logo.png"
              onChange={e => update('logoUrl', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleApply} icon={<Save className="w-4 h-4" />}>
            Save Theme
          </Button>
        </div>
      </div>
    </Modal>
  );
};

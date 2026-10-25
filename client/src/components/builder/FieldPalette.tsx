import React from 'react';
import {
  Type,
  AlignLeft,
  Mail,
  Phone,
  Hash,
  Link2,
  CircleDot,
  CheckSquare,
  ChevronDown,
  ToggleLeft,
  Calendar,
  Clock,
  CalendarClock,
  UploadCloud,
  Star,
  Sliders,
  Split,
  EyeOff,
} from 'lucide-react';
import { FieldType } from '../../types/form';

interface FieldPaletteProps {
  onAddField: (type: FieldType) => void;
}

interface PaletteItem {
  type: FieldType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const FIELD_GROUPS: Array<{ name: string; items: PaletteItem[] }> = [
  {
    name: 'Basic Input',
    items: [
      { type: 'short_text', label: 'Short Answer', icon: Type, description: 'Single line text response' },
      { type: 'long_text', label: 'Paragraph', icon: AlignLeft, description: 'Multi-line detailed answer' },
      { type: 'email', label: 'Email', icon: Mail, description: 'Validated email input' },
      { type: 'phone', label: 'Phone Number', icon: Phone, description: 'International telephone format' },
      { type: 'number', label: 'Number', icon: Hash, description: 'Numeric values with min/max' },
      { type: 'url', label: 'Website / URL', icon: Link2, description: 'Web link with protocol check' },
    ],
  },
  {
    name: 'Choice Options',
    items: [
      { type: 'multiple_choice', label: 'Multiple Choice', icon: CircleDot, description: 'Single choice radio' },
      { type: 'checkbox', label: 'Checkboxes', icon: CheckSquare, description: 'Multiple selection list' },
      { type: 'dropdown', label: 'Dropdown', icon: ChevronDown, description: 'Selectable dropdown list' },
      { type: 'yes_no', label: 'Yes / No', icon: ToggleLeft, description: 'Binary boolean switch' },
    ],
  },
  {
    name: 'Date & Time',
    items: [
      { type: 'date', label: 'Date', icon: Calendar, description: 'Calendar date picker' },
      { type: 'time', label: 'Time', icon: Clock, description: 'Clock time selector' },
      { type: 'date_time', label: 'Date & Time', icon: CalendarClock, description: 'Combined timestamp' },
    ],
  },
  {
    name: 'Advanced & Files',
    items: [
      { type: 'file_upload', label: 'File Upload', icon: UploadCloud, description: 'PDF, DOCX, images up to 50MB' },
      { type: 'rating', label: 'Star Rating', icon: Star, description: 'Interactive 1-5 star scale' },
      { type: 'linear_scale', label: 'Linear Scale', icon: Sliders, description: 'Numeric range with labels' },
      { type: 'section', label: 'Section Header', icon: Split, description: 'Visual chapter divider' },
      { type: 'hidden', label: 'Hidden Field', icon: EyeOff, description: 'Track referral or source ID' },
    ],
  },
];

export const FieldPalette: React.FC<FieldPaletteProps> = ({ onAddField }) => {
  return (
    <div className="w-72 bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden flex-shrink-0">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Question Types
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">Click any field to add to canvas</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {FIELD_GROUPS.map(group => (
          <div key={group.name} className="space-y-1.5">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2">
              {group.name}
            </span>
            <div className="space-y-1">
              {group.items.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => onAddField(item.type)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-transparent hover:border-indigo-100 hover:bg-indigo-50/50 text-left transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-indigo-600 group-hover:text-white text-gray-600 flex items-center justify-center transition-colors flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 group-hover:text-indigo-950 truncate">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate leading-tight">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

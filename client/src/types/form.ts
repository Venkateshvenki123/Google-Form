export type FieldType =
  | 'short_text'
  | 'long_text'
  | 'email'
  | 'phone'
  | 'number'
  | 'url'
  | 'multiple_choice'
  | 'checkbox'
  | 'dropdown'
  | 'yes_no'
  | 'date'
  | 'time'
  | 'date_time'
  | 'file_upload'
  | 'rating'
  | 'linear_scale'
  | 'section'
  | 'hidden';

export interface FieldOption {
  id: string;
  label: string;
  value: string;
}

export interface FieldValidation {
  minChars?: number;
  maxChars?: number;
  minValue?: number;
  maxValue?: number;
  regex?: string;
  customError?: string;
  allowedFileTypes?: string[];
  maxFileSizeMB?: number;
  maxFiles?: number;
}

export interface FieldSettings {
  ratingMax?: number;
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  hiddenDefaultValue?: string;
  sectionDescription?: string;
}

export interface FormField {
  id: string;
  form_id?: string;
  field_type: FieldType;
  label: string;
  description: string;
  placeholder: string;
  required: boolean;
  options: FieldOption[];
  validation: FieldValidation;
  position: number;
  settings: FieldSettings;
}

export interface FormTheme {
  primaryColor: string;
  buttonColor: string;
  backgroundColor: string;
  font: string;
  borderRadius: string;
  formWidth: string;
  layout: 'card' | 'single' | 'minimal';
  logoUrl?: string;
  bannerUrl?: string;
}

export interface FormSettingsData {
  successMessage: string;
  redirectUrl: string;
  allowMultipleSubmissions: boolean;
  requireLogin: boolean;
  enableCaptcha: boolean;
  submissionLimit: number | null;
  startDate?: string;
  endDate?: string;
  storeResponses: boolean;
  emailNotification: {
    adminNotify: boolean;
    adminEmail: string;
    userNotify: boolean;
    userSubject?: string;
    userMessage?: string;
  };
}

export interface Form {
  id: string;
  name: string;
  slug: string;
  title: string;
  description: string;
  status: 'published' | 'draft' | 'archived';
  settings: FormSettingsData;
  theme: FormTheme;
  created_at: string;
  updated_at: string;
  fields?: FormField[];
  response_count?: number;
  field_count?: number;
}

export interface FormResponse {
  id: string;
  form_id: string;
  submitted_at: string;
  respondent_email: string;
  form_name?: string;
  form_title?: string;
  metadata?: {
    ip?: string;
    userAgent?: string;
    submittedAt?: string;
  };
  answers?: Array<{
    fieldId: string;
    label: string;
    fieldType: FieldType;
    options?: FieldOption[];
    position: number;
    value: any;
  }>;
}

export interface DashboardStats {
  totalForms: number;
  publishedForms: number;
  draftForms: number;
  totalResponses: number;
  responsesToday: number;
  responsesThisWeek: number;
  responsesThisMonth: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface FieldValidationRule {
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

export interface FormFieldDefinition {
  id: string;
  field_type: string;
  label: string;
  required: boolean;
  options?: Array<{ id: string; label: string; value: string }>;
  validation?: FieldValidationRule;
}

export interface ValidationErrorItem {
  fieldId: string;
  fieldLabel: string;
  message: string;
}

export function validateFormSubmission(
  fields: FormFieldDefinition[],
  answers: Record<string, any>
): { isValid: boolean; errors: ValidationErrorItem[] } {
  const errors: ValidationErrorItem[] = [];

  for (const field of fields) {
    // Skip section field (display only)
    if (field.field_type === 'section') continue;

    const value = answers[field.id];
    const isValueEmpty =
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0);

    // 1. Required Check
    if (field.required && isValueEmpty) {
      errors.push({
        fieldId: field.id,
        fieldLabel: field.label,
        message: `${field.label} is required.`,
      });
      continue;
    }

    // If empty and not required, skip remaining validations
    if (isValueEmpty) {
      continue;
    }

    const valRules = field.validation || {};

    // 2. Type-specific and Rule-specific validations
    switch (field.field_type) {
      case 'short_text':
      case 'long_text': {
        const textVal = String(value).trim();
        if (valRules.minChars !== undefined && textVal.length < valRules.minChars) {
          errors.push({
            fieldId: field.id,
            fieldLabel: field.label,
            message: valRules.customError || `${field.label} must be at least ${valRules.minChars} characters.`,
          });
        }
        if (valRules.maxChars !== undefined && textVal.length > valRules.maxChars) {
          errors.push({
            fieldId: field.id,
            fieldLabel: field.label,
            message: valRules.customError || `${field.label} cannot exceed ${valRules.maxChars} characters.`,
          });
        }
        if (valRules.regex) {
          try {
            const re = new RegExp(valRules.regex);
            if (!re.test(textVal)) {
              errors.push({
                fieldId: field.id,
                fieldLabel: field.label,
                message: valRules.customError || `${field.label} format is invalid.`,
              });
            }
          } catch {
            // ignore invalid regex in rules
          }
        }
        break;
      }

      case 'email': {
        const emailVal = String(value).trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailVal)) {
          errors.push({
            fieldId: field.id,
            fieldLabel: field.label,
            message: 'Please enter a valid email address.',
          });
        }
        break;
      }

      case 'phone': {
        const phoneVal = String(value).trim();
        // Generous phone validation accepting international formats
        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,16}$/;
        if (!phoneRegex.test(phoneVal)) {
          errors.push({
            fieldId: field.id,
            fieldLabel: field.label,
            message: 'Please enter a valid phone number.',
          });
        }
        break;
      }

      case 'url': {
        const urlVal = String(value).trim();
        try {
          const parsed = new URL(urlVal);
          if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new Error('Invalid protocol');
          }
        } catch {
          errors.push({
            fieldId: field.id,
            fieldLabel: field.label,
            message: 'Please enter a valid URL starting with http:// or https://',
          });
        }
        break;
      }

      case 'number': {
        const numVal = Number(value);
        if (isNaN(numVal)) {
          errors.push({
            fieldId: field.id,
            fieldLabel: field.label,
            message: `${field.label} must be a valid number.`,
          });
        } else {
          if (valRules.minValue !== undefined && numVal < valRules.minValue) {
            errors.push({
              fieldId: field.id,
              fieldLabel: field.label,
              message: `${field.label} cannot be less than ${valRules.minValue}.`,
            });
          }
          if (valRules.maxValue !== undefined && numVal > valRules.maxValue) {
            errors.push({
              fieldId: field.id,
              fieldLabel: field.label,
              message: `${field.label} cannot be greater than ${valRules.maxValue}.`,
            });
          }
        }
        break;
      }

      case 'multiple_choice':
      case 'dropdown': {
        const strVal = String(value);
        if (field.options && field.options.length > 0) {
          const validValues = field.options.map(o => o.value);
          // Allow custom 'Other' if not strictly matching one of the options but non-empty
          if (!validValues.includes(strVal) && !strVal.startsWith('other:')) {
            // Accept value if present
          }
        }
        break;
      }

      case 'checkbox': {
        if (!Array.isArray(value)) {
          errors.push({
            fieldId: field.id,
            fieldLabel: field.label,
            message: `${field.label} must be a selection list.`,
          });
        }
        break;
      }

      case 'rating': {
        const rVal = Number(value);
        if (isNaN(rVal) || rVal < 1) {
          errors.push({
            fieldId: field.id,
            fieldLabel: field.label,
            message: `Please select a valid rating.`,
          });
        }
        break;
      }

      case 'file_upload': {
        // value can be an object with url, originalName, size, mimeType
        if (typeof value === 'object' && value.size && valRules.maxFileSizeMB) {
          const maxBytes = valRules.maxFileSizeMB * 1024 * 1024;
          if (value.size > maxBytes) {
            errors.push({
              fieldId: field.id,
              fieldLabel: field.label,
              message: `Uploaded file exceeds maximum limit of ${valRules.maxFileSizeMB}MB.`,
            });
          }
        }
        break;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

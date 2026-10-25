import { describe, it, expect } from 'vitest';
import { validateFormSubmission, FormFieldDefinition } from '../services/validationService.js';

describe('Frontend & Backend Validation Engine Tests', () => {
  const fields: FormFieldDefinition[] = [
    {
      id: 'f-name',
      field_type: 'short_text',
      label: 'Full Name',
      required: true,
      validation: { minChars: 3, maxChars: 50 },
    },
    {
      id: 'f-email',
      field_type: 'email',
      label: 'Email Address',
      required: true,
    },
    {
      id: 'f-age',
      field_type: 'number',
      label: 'Age',
      required: false,
      validation: { minValue: 18, maxValue: 99 },
    },
    {
      id: 'f-portfolio',
      field_type: 'url',
      label: 'Portfolio URL',
      required: false,
    },
    {
      id: 'f-role',
      field_type: 'multiple_choice',
      label: 'Selected Role',
      required: true,
      options: [
        { id: '1', label: 'Engineer', value: 'engineer' },
        { id: '2', label: 'Designer', value: 'designer' },
      ],
    },
    {
      id: 'f-skills',
      field_type: 'checkbox',
      label: 'Skills',
      required: true,
    },
    {
      id: 'f-rating',
      field_type: 'rating',
      label: 'Satisfaction',
      required: true,
    },
    {
      id: 'f-resume',
      field_type: 'file_upload',
      label: 'Resume',
      required: true,
      validation: { maxFileSizeMB: 5 },
    },
  ];

  it('should fail when required fields are missing', () => {
    const answers = {};
    const result = validateFormSubmission(fields, answers);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBe(6); // name, email, role, skills, rating, resume
  });

  it('should fail when text length is below minChars', () => {
    const answers = {
      'f-name': 'Al', // only 2 chars, min is 3
      'f-email': 'al@example.com',
      'f-role': 'engineer',
      'f-skills': ['ts'],
      'f-rating': 5,
      'f-resume': { url: '/uploads/res.pdf', size: 1024 },
    };
    const result = validateFormSubmission(fields, answers);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.fieldId === 'f-name')).toBe(true);
  });

  it('should fail when email address is invalid', () => {
    const answers = {
      'f-name': 'Alice Johnson',
      'f-email': 'not-an-email',
      'f-role': 'engineer',
      'f-skills': ['ts'],
      'f-rating': 5,
      'f-resume': { url: '/uploads/res.pdf', size: 1024 },
    };
    const result = validateFormSubmission(fields, answers);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.fieldId === 'f-email')).toBe(true);
  });

  it('should fail when number is out of bounds', () => {
    const answers = {
      'f-name': 'Alice Johnson',
      'f-email': 'alice@example.com',
      'f-age': 16, // min is 18
      'f-role': 'engineer',
      'f-skills': ['ts'],
      'f-rating': 5,
      'f-resume': { url: '/uploads/res.pdf', size: 1024 },
    };
    const result = validateFormSubmission(fields, answers);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.fieldId === 'f-age')).toBe(true);
  });

  it('should fail when file exceeds maxFileSizeMB', () => {
    const answers = {
      'f-name': 'Alice Johnson',
      'f-email': 'alice@example.com',
      'f-role': 'engineer',
      'f-skills': ['ts'],
      'f-rating': 5,
      'f-resume': { url: '/uploads/large.pdf', size: 10 * 1024 * 1024 }, // 10MB exceeds 5MB limit
    };
    const result = validateFormSubmission(fields, answers);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.fieldId === 'f-resume')).toBe(true);
  });

  it('should pass with complete and valid data', () => {
    const answers = {
      'f-name': 'Alice Johnson',
      'f-email': 'alice@example.com',
      'f-age': 25,
      'f-portfolio': 'https://alice.dev',
      'f-role': 'engineer',
      'f-skills': ['ts', 'react'],
      'f-rating': 5,
      'f-resume': { url: '/uploads/res.pdf', size: 2 * 1024 * 1024 },
    };
    const result = validateFormSubmission(fields, answers);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });
});

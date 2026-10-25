import { Form, FormResponse, DashboardStats, AdminUser } from '../types/form';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('formcraft_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    // If unauthorized, clear token if not already on login page
    if (!window.location.pathname.includes('/admin/login')) {
      localStorage.removeItem('formcraft_token');
      localStorage.removeItem('formcraft_user');
      window.location.href = '/admin/login';
    }
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.error || (data.validationErrors ? data.validationErrors.map((e: any) => e.message).join(' ') : 'An unexpected error occurred.');
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  async login(credentials: { email: string; password: string; rememberMe?: boolean }): Promise<{ token: string; user: AdminUser }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse(res);
  },

  async getMe(): Promise<{ user: AdminUser }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async updateProfile(profileData: { name?: string; email?: string; currentPassword?: string; newPassword?: string }): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(profileData),
    });
    return handleResponse(res);
  },

  // Forms Management
  async listForms(params?: { status?: string; search?: string }): Promise<{ forms: Form[] }> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE}/forms?${query.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async getFormById(id: string): Promise<{ form: Form }> {
    const res = await fetch(`${API_BASE}/forms/${id}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async createForm(formData: Partial<Form>): Promise<{ form: Form }> {
    const res = await fetch(`${API_BASE}/forms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(formData),
    });
    return handleResponse(res);
  },

  async updateForm(id: string, formData: Partial<Form>): Promise<{ form: Form; message: string }> {
    const res = await fetch(`${API_BASE}/forms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(formData),
    });
    return handleResponse(res);
  },

  async deleteForm(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/forms/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async duplicateForm(id: string): Promise<{ formId: string; slug: string }> {
    const res = await fetch(`${API_BASE}/forms/${id}/duplicate`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async togglePublish(id: string): Promise<{ status: 'published' | 'draft'; message: string }> {
    const res = await fetch(`${API_BASE}/forms/${id}/toggle-publish`, {
      method: 'PATCH',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async checkSlug(slug: string, formId?: string): Promise<{ available: boolean; slug: string }> {
    const query = new URLSearchParams({ slug });
    if (formId) query.append('formId', formId);
    const res = await fetch(`${API_BASE}/forms/check-slug?${query.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Responses
  async listResponses(params?: {
    formId?: string;
    search?: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    responses: FormResponse[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const query = new URLSearchParams();
    if (params?.formId) query.append('formId', params.formId);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);

    const res = await fetch(`${API_BASE}/responses?${query.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async getResponseDetails(id: string): Promise<{ response: FormResponse }> {
    const res = await fetch(`${API_BASE}/responses/${id}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async deleteResponse(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/responses/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async deleteAllResponses(formId: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/responses/form/${formId}/all`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  getExportUrl(formId: string, format: 'csv' | 'xlsx'): string {
    const token = localStorage.getItem('formcraft_token');
    return `${API_BASE}/responses/export/${formId}?format=${format}&token=${token || ''}`;
  },

  // Analytics
  async getDashboardStats(): Promise<{
    stats: DashboardStats;
    recentForms: Form[];
    recentResponses: FormResponse[];
    timeline: Array<{ date: string; displayDate: string; submissions: number }>;
  }> {
    const res = await fetch(`${API_BASE}/analytics/dashboard`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async getFormAnalytics(formId: string): Promise<{
    analytics: {
      formId: string;
      formName: string;
      formTitle: string;
      totalResponses: number;
      responsesToday: number;
      responsesThisWeek: number;
      responsesThisMonth: number;
      timeline: Array<{ date: string; displayDate: string; submissions: number }>;
      fields: any[];
    };
  }> {
    const res = await fetch(`${API_BASE}/analytics/form/${formId}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Uploads
  async uploadFile(file: File): Promise<{
    file: {
      originalName: string;
      filename: string;
      size: number;
      mimeType: string;
      url: string;
    };
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/uploads`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },

  // Settings
  async getSettings(): Promise<{ settings: any }> {
    const res = await fetch(`${API_BASE}/settings`);
    return handleResponse(res);
  },

  async updateSettings(settings: any): Promise<{ message: string; settings: any }> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ settings }),
    });
    return handleResponse(res);
  },

  // Public Form Endpoints
  async getPublicForms(): Promise<{ forms: Form[] }> {
    const res = await fetch(`${API_BASE}/public/forms`);
    return handleResponse(res);
  },

  async getPublicForm(slug: string): Promise<{ form: Form }> {
    const res = await fetch(`${API_BASE}/public/forms/${slug}`);
    return handleResponse(res);
  },

  async submitPublicResponse(slug: string, payload: { answers: Record<string, any>; metadata?: any }): Promise<{
    success: boolean;
    message: string;
    redirectUrl?: string;
    responseId?: string;
  }> {
    const res = await fetch(`${API_BASE}/public/forms/${slug}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },
};

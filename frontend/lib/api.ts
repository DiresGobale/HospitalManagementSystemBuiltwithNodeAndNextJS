const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit & { clinicId?: string } = {}
): Promise<{ success: boolean; data?: T; message?: string; error?: any }> {
  const { clinicId: explicitClinicId, ...fetchOptions } = options;
  const token = typeof window !== 'undefined' ? localStorage.getItem('caqms_access_token') : null;
  const clinicId = explicitClinicId || (typeof window !== 'undefined' ? localStorage.getItem('caqms_active_clinic_id') : null);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (clinicId) {
    headers['x-clinic-id'] = clinicId;
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      throw data.error || { message: 'An API error occurred' };
    }

    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err,
    };
  }
}


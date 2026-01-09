const API_URL = 'https://api-m9ew.onrender.com';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'API request failed');
  }

  return data;
}

export const api = {
  auth: {
    login: (credentials: any) => request<{ access_token: string }>('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
    register: (data: any) => request<{ uid: string }>('/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },
  user: {
    getProfile: () => request<any>('/profile'),
    updateProfile: (data: any) => request<{ ok: boolean }>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    getFullData: (patientUid?: string) => {
      const qs = patientUid ? `?patient_uid=${patientUid}` : '';
      return request<any>(`/user/full-data${qs}`);
    },
    search: (role: string, query: string) => request<any[]>(`/users/search?role=${role}&query=${query}`)
  },
  health: {
    addProblems: (data: any) => request<{ ok: boolean }>('/health/problems', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    addBP: (data: any) => request<{ ok: boolean }>('/health/bp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    addDiabetes: (data: any) => request<{ ok: boolean }>('/health/diabetes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },
  doctor: {
    getPatients: () => request<any[]>('/doctor/patients'),
    getInvites: () => request<any[]>('/doctor/invites'),
    acceptInvite: (patientUid: string) => request<{ ok: boolean }>(`/doctor/invite/${patientUid}/accept`, {
      method: 'POST'
    }),
    rejectInvite: (patientUid: string) => request<{ ok: boolean }>(`/doctor/invite/${patientUid}/reject`, {
      method: 'POST'
    }),
    disconnectPatient: (patientUid: string) => request<{ ok: boolean }>(`/doctor/patient/${patientUid}/disconnect`, {
      method: 'POST'
    }),
    getStats: () => request<any>('/doctor/stats')
  },
  patient: {
    invite: (docId: string) => request<{ ok: boolean, msg?: string }>(`/patient/invite/${docId}`, { method: 'POST' }),
    getInvites: () => request<any[]>('/patient/invites')
  }
};

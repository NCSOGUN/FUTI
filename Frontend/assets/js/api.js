/* Frontend/assets/js/api.js */
const BASE_URL = 'http://localhost:5000/api';

async function fetchAPI(endpoint, method = 'GET', body = null, useStaffToken = false) {
  // Automatically decide which token to use
  const token = useStaffToken ? localStorage.getItem('token') : localStorage.getItem('hp_token');
  
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  
  if (response.status === 401) {
    // If unauthorized, clean up and kick to the correct login page
    if (useStaffToken) {
      localStorage.removeItem('token');
      window.location.href = '/admin/login.html';
    } else {
      localStorage.removeItem('hp_token');
      window.location.href = '/login.html';
    }
    throw new Error('Unauthorized');
  }
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

const HealthPassAPI = {
  // --- Patient Routes ---
  getMe: async () => fetchAPI('/me'),
  getHistory: async () => fetchAPI('/me/history'),
  getVaccinations: async () => fetchAPI('/me/vaccinations'),
  getClinics: async (q = '', state = '') => fetchAPI(`/ai/clinics?q=${q}&state=${state}`),
  
  // --- Admin Routes (useStaffToken = true) ---
  getAdminOverview: async () => fetchAPI('/admin/overview', 'GET', null, true),
  getAdminAccounts: async () => fetchAPI('/admin/accounts', 'GET', null, true),
  getAdminPatients: async () => fetchAPI('/admin/patients', 'GET', null, true),
  getAdminClinics: async () => fetchAPI('/admin/clinics', 'GET', null, true),
};

window.HealthPassAPI = HealthPassAPI;
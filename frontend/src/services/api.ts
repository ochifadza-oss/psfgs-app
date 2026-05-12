import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('psfgs_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('psfgs_token');
      localStorage.removeItem('psfgs_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (username: string, password: string) =>
  api.post('/auth/login', new URLSearchParams({ username, password }));
export const getMe = () => api.get('/auth/me');

// Dashboard
export const getDashboardSummary = () => api.get('/dashboard/summary');

// AFT
export const getAuditYears = () => api.get('/aft/audit-years');
export const getFindings = (params?: Record<string, string>) => api.get('/aft/findings', { params });
export const getFinding = (id: number) => api.get(`/aft/findings/${id}`);
export const createFinding = (data: any) => api.post('/aft/findings', data);
export const updateFinding = (id: number, data: any) => api.put(`/aft/findings/${id}`, data);
export const createAssignment = (data: any) => api.post('/aft/assignments', data);
export const getAftStats = () => api.get('/aft/stats');

// IFW
export const getIFWItems = (params?: Record<string, string>) => api.get('/ifw/items', { params });
export const getIFWItem = (id: number) => api.get(`/ifw/items/${id}`);
export const createIFWItem = (data: any) => api.post('/ifw/items', data);
export const updateIFWItem = (id: number, data: any) => api.put(`/ifw/items/${id}`, data);
export const createCondonation = (data: any) => api.post('/ifw/condonations', data);
export const getIFWStats = () => api.get('/ifw/stats');

// BVM
export const getBudgets = (params?: Record<string, string>) => api.get('/bvm/budgets', { params });
export const getBudgetExpenditure = (id: number) => api.get(`/bvm/budgets/${id}/expenditure`);
export const getBVMStats = (fy?: string) => api.get('/bvm/stats', { params: { financial_year: fy } });

// SCC
export const getRequisitions = (params?: Record<string, string>) => api.get('/scc/requisitions', { params });
export const getRequisition = (id: number) => api.get(`/scc/requisitions/${id}`);
export const createRequisition = (data: any) => api.post('/scc/requisitions', data);
export const runComplianceCheck = (id: number) => api.post(`/scc/requisitions/${id}/check`);
export const getSCCRules = () => api.get('/scc/rules');
export const getSCCStats = () => api.get('/scc/stats');

// Other modules
export const getAssets = (params?: Record<string, string>) => api.get('/avs/assets', { params });
export const getAVSStats = () => api.get('/avs/stats');
export const getVerificationSessions = () => api.get('/avs/sessions');
export const getCases = (params?: Record<string, string>) => api.get('/cmt/cases', { params });
export const getCMTStats = () => api.get('/cmt/stats');
export const getDelegations = (params?: Record<string, string>) => api.get('/dar/delegations', { params });
export const getPolicies = (params?: Record<string, string>) => api.get('/pcr/policies', { params });
export const getS71Reports = () => api.get('/s71/reports');
export const getKPIs = (params?: Record<string, string>) => api.get('/pkd/kpis', { params });
export const getERPMetrics = () => api.get('/erp/metrics');
export const getUsers = () => api.get('/users/');
export const createUser = (data: any) => api.post('/users/', data);
export const updateUser = (id: number, data: any) => api.put(`/users/${id}`, data);
export const deactivateUser = (id: number) => api.delete(`/users/${id}`);
export const getDirectorates = () => api.get('/users/directorates');
export const createDirectorate = (data: any) => api.post('/users/directorates', data);
export const updateDirectorate = (id: number, data: any) => api.put(`/users/directorates/${id}`, data);
export const deactivateDirectorate = (id: number) => api.delete(`/users/directorates/${id}`);

// Asset management
export const createAsset = (data: any) => api.post('/avs/assets', data);
export const updateAsset = (id: number, data: any) => api.put(`/avs/assets/${id}`, data);
export const getAssetCategories = () => api.get('/avs/categories');
export const getLocations = () => api.get('/avs/locations');

// KPI management
export const createKPI = (data: any) => api.post('/pkd/kpis', data);
export const updateQuarterly = (kpiId: number, data: any) => api.put(`/pkd/kpis/${kpiId}/quarterly`, data);
export const getPKDYears = () => api.get('/pkd/financial-years');

// Delegation management
export const createDelegation = (data: any) => api.post('/dar/delegations', data);
export const updateDelegation = (id: number, data: any) => api.put(`/dar/delegations/${id}`, data);

// Policy management
export const createPolicy = (data: any) => api.post('/pcr/policies', data);
export const updatePolicy = (id: number, data: any) => api.put(`/pcr/policies/${id}`, data);
export const deletePolicy = (id: number) => api.delete(`/pcr/policies/${id}`);
export const uploadPolicyDocument = (policyId: number, file: File) => {
  const fd = new FormData(); fd.append('file', file);
  return api.post(`/pcr/policies/${policyId}/upload-document`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};

// Audit Year management
export const createAuditYear = (data: any) => api.post('/aft/audit-years', data);
export const updateAuditYear = (id: number, data: any) => api.put(`/aft/audit-years/${id}`, data);
export const uploadAgLetter = (yearId: number, file: File) => {
  const fd = new FormData(); fd.append('file', file);
  return api.post(`/aft/audit-years/${yearId}/upload-ag-letter`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const uploadEvidence = (findingId: number, file: File) => {
  const fd = new FormData(); fd.append('file', file);
  return api.post(`/aft/findings/${findingId}/upload-evidence`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};

// Budget management
export const createBudget = (data: any) => api.post('/bvm/budgets', data);
export const updateBudget = (id: number, data: any) => api.put(`/bvm/budgets/${id}`, data);

// Settings
export const getEntityBranding = () => api.get('/settings/branding');
export const getEntitySettings = () => api.get('/settings/entity');
export const updateEntitySettings = (data: any) => api.put('/settings/entity', data);
export const uploadEntityLogo = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/settings/entity/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export default api;

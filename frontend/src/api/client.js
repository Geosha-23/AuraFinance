const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(response) {
  if (!response.ok) {
    let errorMsg = 'An unexpected error occurred.';
    try {
      const errData = await response.json();
      errorMsg = errData.detail || errData.message || errorMsg;
    } catch (e) {
      errorMsg = response.statusText || errorMsg;
    }
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export const api = {
  // Auth
  auth: {
    async register(name, email, password, allowance = 15000) {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, monthly_allowance: allowance })
      });
      return handleResponse(res);
    },
    async login(email, password) {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return handleResponse(res);
    },
    async getMe() {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    }
  },

  // Transactions
  transactions: {
    async list(month = null, category = null, onlyAnomalies = false) {
      const params = new URLSearchParams();
      if (month) params.append('month', month);
      if (category && category !== 'All') params.append('category', category);
      if (onlyAnomalies) params.append('only_anomalies', 'true');

      const res = await fetch(`${API_BASE}/transactions?${params.toString()}`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    },
    async create(txData) {
      const res = await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(txData)
      });
      return handleResponse(res);
    },
    async update(id, txData) {
      const res = await fetch(`${API_BASE}/transactions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(txData)
      });
      return handleResponse(res);
    },
    async delete(id) {
      const res = await fetch(`${API_BASE}/transactions/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    },
    async importCsv(file) {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/transactions/import-csv`, {
        method: 'POST',
        headers: { ...getAuthHeader() },
        body: formData
      });
      return handleResponse(res);
    },
    async seedDemo() {
      const res = await fetch(`${API_BASE}/transactions/seed-demo`, {
        method: 'POST',
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    },
    async categorizePreview(description, amount = 0) {
      const res = await fetch(`${API_BASE}/transactions/categorize-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ description, amount })
      });
      return handleResponse(res);
    }
  },

  // Budgets
  budgets: {
    async list(month = null) {
      const params = new URLSearchParams();
      if (month) params.append('month', month);
      const res = await fetch(`${API_BASE}/budgets?${params.toString()}`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    },
    async save(category, monthlyLimit, month = null) {
      const res = await fetch(`${API_BASE}/budgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ category, monthly_limit: monthlyLimit, month })
      });
      return handleResponse(res);
    },
    async delete(id) {
      const res = await fetch(`${API_BASE}/budgets/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    }
  },

  // Analytics
  analytics: {
    async getOverview(month = null) {
      const params = new URLSearchParams();
      if (month) params.append('month', month);
      const res = await fetch(`${API_BASE}/analytics/overview?${params.toString()}`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    },
    async getCategoryBreakdown(month = null) {
      const params = new URLSearchParams();
      if (month) params.append('month', month);
      const res = await fetch(`${API_BASE}/analytics/category-breakdown?${params.toString()}`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    },
    async getDailyTrend(month = null) {
      const params = new URLSearchParams();
      if (month) params.append('month', month);
      const res = await fetch(`${API_BASE}/analytics/daily-trend?${params.toString()}`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    },
    async getAlerts(month = null) {
      const params = new URLSearchParams();
      if (month) params.append('month', month);
      const res = await fetch(`${API_BASE}/analytics/alerts?${params.toString()}`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    }
  },

  // Machine Learning
  ml: {
    async getForecast(month = null) {
      const params = new URLSearchParams();
      if (month) params.append('month', month);
      const res = await fetch(`${API_BASE}/ml/forecast?${params.toString()}`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    },
    async getAnomalies(month = null) {
      const params = new URLSearchParams();
      if (month) params.append('month', month);
      const res = await fetch(`${API_BASE}/ml/anomalies?${params.toString()}`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    },
    async reEvaluate() {
      const res = await fetch(`${API_BASE}/ml/re-evaluate`, {
        method: 'POST',
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    }
  }
};

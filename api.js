const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('access_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async demoLogin(email, name) {
    const response = await this.request('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
    
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    
    return response;
  }

  async getCurrentUser() {
    return await this.request('/auth/me');
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.setToken(null);
  }

  // Wellness categories
  async getCategories() {
    return await this.request('/api/categories');
  }

  async createCategory(categoryData) {
    return await this.request('/api/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async updateCategory(categoryId, categoryData) {
    return await this.request(`/api/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  async deleteCategory(categoryId) {
    return await this.request(`/api/categories/${categoryId}`, {
      method: 'DELETE',
    });
  }

  // Wellness entries
  async getEntries(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/entries?${queryString}` : '/api/entries';
    return await this.request(endpoint);
  }

  async getTodayEntries() {
    return await this.request('/api/entries/today');
  }

  async createEntry(entryData) {
    return await this.request('/api/entries', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
  }

  async updateEntry(entryId, entryData) {
    return await this.request(`/api/entries/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify(entryData),
    });
  }

  async deleteEntry(entryId) {
    return await this.request(`/api/entries/${entryId}`, {
      method: 'DELETE',
    });
  }

  async getWellnessStats(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/stats?${queryString}` : '/api/stats';
    return await this.request(endpoint);
  }

  // Journal entries
  async getJournalEntries(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/journal?${queryString}` : '/api/journal';
    return await this.request(endpoint);
  }

  async getTodayJournalEntries() {
    return await this.request('/api/journal/today');
  }

  async createJournalEntry(entryData) {
    return await this.request('/api/journal', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
  }

  async updateJournalEntry(entryId, entryData) {
    return await this.request(`/api/journal/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify(entryData),
    });
  }

  async deleteJournalEntry(entryId) {
    return await this.request(`/api/journal/${entryId}`, {
      method: 'DELETE',
    });
  }

  async toggleJournalPrivacy(entryId, isPrivate) {
    return await this.request(`/api/journal/${entryId}/privacy`, {
      method: 'PUT',
      body: JSON.stringify({ is_private: isPrivate }),
    });
  }

  async getJournalStats(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/journal/stats?${queryString}` : '/api/journal/stats';
    return await this.request(endpoint);
  }

  async getJournalTags() {
    return await this.request('/api/journal/tags');
  }

  // Inspiration endpoints
  async getDailyInspiration() {
    return await this.request('/api/inspiration/daily');
  }

  async generateInspiration(type = 'daily_quote') {
    return await this.request('/api/inspiration/generate', {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  }

  async getInspirationHistory(limit = 20) {
    return await this.request(`/api/inspiration/history?limit=${limit}`);
  }

  async deleteInspiration(inspirationId) {
    return await this.request(`/api/inspiration/${inspirationId}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck() {
    return await this.request('/health');
  }
}

export const apiClient = new ApiClient();
export default apiClient;


// API helper functions for investor management
import api from '../ApiInception';

// ===== INVESTOR CRUD =====

export const investorAPI = {
  // List all investors
  getInvestors: async (orgId) => {
    const response = await api.get(`/api/v1/org/${orgId}/finance/investors`);
    return response.data;
  },

  // Get single investor
  getInvestor: async (orgId, investorId) => {
    const response = await api.get(`/api/v1/org/${orgId}/finance/investors/${investorId}`);
    return response.data;
  },

  // Create investor
  createInvestor: async (orgId, data) => {
    const response = await api.post(`/api/v1/org/${orgId}/finance/investors`, data);
    return response.data;
  },

  // Update investor
  updateInvestor: async (orgId, investorId, data) => {
    const response = await api.patch(`/api/v1/org/${orgId}/finance/investors/${investorId}`, data);
    return response.data;
  },

  // Delete investor
  deleteInvestor: async (orgId, investorId) => {
    const response = await api.delete(`/api/v1/org/${orgId}/finance/investors/${investorId}`);
    return response.data;
  },

  // ===== INVESTMENT TRANSACTIONS =====

  // Record investment
  recordInvestment: async (orgId, data) => {
    const response = await api.post(`/api/v1/org/${orgId}/finance/investors/transactions`, data);
    return response.data;
  },

  updateInvestment: async (orgId, transactionId, data) => {
    const response = await api.patch(`/api/v1/org/${orgId}/finance/investors/transactions/${transactionId}`, data);
    return response.data;
  },

  // Get investment transactions
  getInvestmentTransactions: async (orgId, params = {}) => {
    const response = await api.get(`/api/v1/org/${orgId}/finance/investors/transactions/list`, {
      params,
    });
    return response.data;
  },

  // Delete investment transaction
  deleteInvestment: async (orgId, transactionId) => {
    const response = await api.delete(`/api/v1/org/${orgId}/finance/investors/transactions/${transactionId}`);
    return response.data;
  },

  // ===== DASHBOARD =====

  // Get full metrics
  getDashboardMetrics: async (orgId) => {
    const response = await api.get(`/api/v1/org/${orgId}/finance/investors/dashboard/metrics`);
    return response.data;
  },

  // Get quick summary
  getDashboardSummary: async (orgId) => {
    const response = await api.get(`/api/v1/org/${orgId}/finance/investors/dashboard/summary`);
    return response.data;
  },
};

export default investorAPI;

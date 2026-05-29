// Custom hook for investor data management
import { useState, useEffect } from 'react';
import investorAPI from '../utils/investorAPI';

export const useInvestors = (orgId) => {
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInvestors = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await investorAPI.getInvestors(orgId);
      setInvestors(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch investors');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) {
      fetchInvestors();
    }
  }, [orgId]);

  const createInvestor = async (data) => {
    try {
      const response = await investorAPI.createInvestor(orgId, data);
      setInvestors([...investors, response.data]);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create investor');
      throw err;
    }
  };

  const updateInvestor = async (investorId, data) => {
    try {
      const response = await investorAPI.updateInvestor(orgId, investorId, data);
      setInvestors(
        investors.map((inv) => (inv._id === investorId ? response.data : inv))
      );
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update investor');
      throw err;
    }
  };

  const deleteInvestor = async (investorId) => {
    try {
      await investorAPI.deleteInvestor(orgId, investorId);
      setInvestors(investors.filter((inv) => inv._id !== investorId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete investor');
      throw err;
    }
  };

  return {
    investors,
    loading,
    error,
    refetch: fetchInvestors,
    createInvestor,
    updateInvestor,
    deleteInvestor,
  };
};

export const useInvestmentTransactions = (orgId, investorId = null) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = investorId ? { investor_id: investorId } : {};
      const response = await investorAPI.getInvestmentTransactions(orgId, params);
      setTransactions(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch transactions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) {
      fetchTransactions();
    }
  }, [orgId, investorId]);

  const recordInvestment = async (data) => {
    try {
      const response = await investorAPI.recordInvestment(orgId, data);
      setTransactions([...transactions, response.data.investmentTransaction]);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record investment');
      throw err;
    }
  };

  const deleteTransaction = async (transactionId) => {
    try {
      await investorAPI.deleteInvestment(orgId, transactionId);
      setTransactions(
        transactions.filter((tx) => tx._id !== transactionId)
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete transaction');
      throw err;
    }
  };

  const updateInvestment = async (transactionId, data) => {
    try {
      const response = await investorAPI.updateInvestment(orgId, transactionId, data);
      setTransactions(
        transactions.map((tx) =>
          tx._id === transactionId ? response.data.investmentTransaction : tx
        )
      );
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update investment');
      throw err;
    }
  };

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
    recordInvestment,
    updateInvestment,
    deleteTransaction,
  };
};

export const useInvestorDashboard = (orgId) => {
  const [metrics, setMetrics] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const [metricsRes, summaryRes] = await Promise.all([
        investorAPI.getDashboardMetrics(orgId),
        investorAPI.getDashboardSummary(orgId),
      ]);
      setMetrics(metricsRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) {
      fetchDashboard();
    }
  }, [orgId]);

  return {
    metrics,
    summary,
    loading,
    error,
    refetch: fetchDashboard,
  };
};

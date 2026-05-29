import React, { useEffect, useState } from 'react';

const fieldClass =
  'ww-input disabled:cursor-not-allowed disabled:opacity-60';
const labelClass = 'ww-label';
const errorClass = 'mt-1.5 text-xs font-medium text-destructive';

const InvestmentForm = ({
  onSubmit,
  loading = false,
  investors = [],
  accounts = [],
  initialData = null,
  onCancel,
}) => {
  const emptyForm = {
    investor_id: '',
    account_id: '',
    partition_id: '',
    amount: '',
    investment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank',
    reference_number: '',
    notes: '',
  };

  const mapInitialData = (data) => ({
    investor_id: data?.investor_id?._id || data?.investor_id || '',
    account_id: data?.account_id?._id || data?.account_id || '',
    partition_id: data?.allocations?.[0]?.partition_id?._id || data?.allocations?.[0]?.partition_id || '',
    amount: data?.amount || '',
    investment_date: data?.investment_date
      ? new Date(data.investment_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    payment_method: data?.payment_method || 'bank',
    reference_number: data?.reference_number || '',
    notes: data?.notes || '',
  });

  const [formData, setFormData] = useState(initialData ? mapInitialData(initialData) : emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData(initialData ? mapInitialData(initialData) : emptyForm);
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' ? (value ? Number(value) : '') : value,
      ...(name === 'account_id' ? { partition_id: '' } : {}),
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.investor_id) newErrors.investor_id = 'Investor is required';
    if (!formData.account_id) newErrors.account_id = 'Account is required';
    if (!formData.partition_id) newErrors.partition_id = 'Partition is required';
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      await onSubmit({
        ...formData,
        partition_allocations: [
          {
            partition_id: formData.partition_id,
            amount: formData.amount,
          },
        ],
      });
    }
  };

  const selectedAccount = accounts.find((acc) => acc._id === formData.account_id);
  const partitions = selectedAccount?.partitions || [];

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="investor_id">Investor *</label>
          <select
            className={fieldClass}
            id="investor_id"
            name="investor_id"
            value={formData.investor_id}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="">Select Investor</option>
            {investors.map((inv) => (
              <option key={inv._id} value={inv._id}>
                {inv.name} ({inv.ownership_percentage}%)
              </option>
            ))}
          </select>
          {errors.investor_id && (
            <span className={errorClass}>{errors.investor_id}</span>
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor="account_id">Account *</label>
          <select
            className={fieldClass}
            id="account_id"
            name="account_id"
            value={formData.account_id}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="">Select Account</option>
            {accounts.map((acc) => (
              <option key={acc._id} value={acc._id}>
                {acc.name}
              </option>
            ))}
          </select>
          {errors.account_id && (
            <span className={errorClass}>{errors.account_id}</span>
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor="partition_id">Partition *</label>
          <select
            className={fieldClass}
            id="partition_id"
            name="partition_id"
            value={formData.partition_id}
            onChange={handleChange}
            disabled={loading || !formData.account_id}
          >
            <option value="">Select Partition</option>
            {partitions.map((partition) => (
              <option key={partition._id} value={partition._id}>
                {partition.name} ({partition.scope || 'business'})
              </option>
            ))}
          </select>
          {errors.partition_id && (
            <span className={errorClass}>{errors.partition_id}</span>
          )}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="amount">Amount *</label>
          <input
            className={fieldClass}
            id="amount"
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            disabled={loading}
          />
          {errors.amount && <span className={errorClass}>{errors.amount}</span>}
        </div>

        <div>
          <label className={labelClass} htmlFor="investment_date">Investment Date</label>
          <input
            className={fieldClass}
            id="investment_date"
            type="date"
            name="investment_date"
            value={formData.investment_date}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="payment_method">Payment Method</label>
          <select
            className={fieldClass}
            id="payment_method"
            name="payment_method"
            value={formData.payment_method}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="bank">Bank Transfer</option>
            <option value="bkash">bKash</option>
            <option value="cash">Cash</option>
            <option value="stripe">Stripe</option>
            <option value="paypal">PayPal</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="reference_number">Reference Number</label>
          <input
            className={fieldClass}
            id="reference_number"
            type="text"
            name="reference_number"
            value={formData.reference_number}
            onChange={handleChange}
            placeholder="e.g., WIRE-001"
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="notes">Notes</label>
        <textarea
          className={`${fieldClass} min-h-24 py-3`}
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Add any notes..."
          rows="2"
          disabled={loading}
        />
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <button
          type="submit"
          className="ww-btn-primary h-11 flex-1 px-4 py-0 disabled:pointer-events-none disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Saving...' : initialData ? 'Update Investment' : 'Record Investment'}
        </button>
        {onCancel && (
          <button
            type="button"
            className="ww-btn-outline h-11 px-4 py-0 disabled:pointer-events-none disabled:opacity-60"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default InvestmentForm;

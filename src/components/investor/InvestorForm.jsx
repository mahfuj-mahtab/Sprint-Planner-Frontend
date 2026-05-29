import React, { useState } from 'react';

const fieldClass =
  'ww-input disabled:cursor-not-allowed disabled:opacity-60';
const labelClass = 'ww-label';
const errorClass = 'mt-1.5 text-xs font-medium text-destructive';

const InvestorForm = ({ 
  onSubmit, 
  initialData = null, 
  loading = false,
  onCancel 
}) => {
  const [formData, setFormData] = useState(
    initialData || {
      name: '',
      email: '',
      phone: '',
      investor_type: 'individual',
      ownership_percentage: 0,
      status: 'active',
      notes: '',
    }
  );
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'ownership_percentage' ? Number(value) : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (formData.ownership_percentage < 0 || formData.ownership_percentage > 100) {
      newErrors.ownership_percentage = 'Ownership must be between 0-100%';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      await onSubmit(formData);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className={labelClass} htmlFor="name">Investor Name *</label>
        <input
          className={fieldClass}
          id="name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Venture Fund A"
          disabled={loading}
        />
        {errors.name && <span className={errorClass}>{errors.name}</span>}
      </div>

      <div>
        <label className={labelClass} htmlFor="email">Email</label>
        <input
          className={fieldClass}
          id="email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="investor@example.com"
          disabled={loading}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="phone">Phone</label>
        <input
          className={fieldClass}
          id="phone"
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+1-555-0000"
          disabled={loading}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="investor_type">Investor Type</label>
          <select
            className={fieldClass}
            id="investor_type"
            name="investor_type"
            value={formData.investor_type}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="individual">Individual</option>
            <option value="company">Company</option>
            <option value="fund">Fund</option>
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="ownership_percentage">Ownership % *</label>
          <input
            className={fieldClass}
            id="ownership_percentage"
            type="number"
            name="ownership_percentage"
            value={formData.ownership_percentage}
            onChange={handleChange}
            min="0"
            max="100"
            step="0.1"
            disabled={loading}
          />
          {errors.ownership_percentage && (
            <span className={errorClass}>{errors.ownership_percentage}</span>
          )}
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="status">Status</label>
        <select
          className={fieldClass}
          id="status"
          name="status"
          value={formData.status || 'active'}
          onChange={handleChange}
          disabled={loading}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="exited">Exited</option>
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="notes">Notes</label>
        <textarea
          className={`${fieldClass} min-h-24 py-3`}
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Add any notes about this investor..."
          rows="3"
          disabled={loading}
        />
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <button 
          type="submit" 
          className="ww-btn-primary h-11 flex-1 px-4 py-0 disabled:pointer-events-none disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Investor'}
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

export default InvestorForm;

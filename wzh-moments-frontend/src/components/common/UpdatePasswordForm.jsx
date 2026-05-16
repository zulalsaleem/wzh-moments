import { useState } from 'react';
import {
  Lock, Eye, EyeOff,
  CheckCircle, AlertCircle, KeyRound
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import Button from './Button';

const UpdatePasswordForm = () => {
  const { logout } = useAuth();
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [show, setShow] = useState({
    current: false, new: false, confirm: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const getStrength = (p) => {
    if (!p) return { score: 0, label: '', color: '' };
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    const levels = [
      { label: '', color: '' },
      { label: 'Weak', color: 'bg-red-500' },
      { label: 'Fair', color: 'bg-orange-500' },
      { label: 'Good', color: 'bg-yellow-500' },
      { label: 'Strong', color: 'bg-green-500' },
      { label: 'Very Strong', color: 'bg-green-600' },
    ];
    return { score: s, ...levels[Math.min(s, 5)] };
  };

  const strength = getStrength(form.newPassword);

  const validate = () => {
    const e = {};
    if (!form.currentPassword)
      e.currentPassword = 'Required';
    if (!form.newPassword)
      e.newPassword = 'Required';
    else if (form.newPassword.length < 6)
      e.newPassword = 'Min 6 characters';
    else if (form.newPassword === form.currentPassword)
      e.newPassword = 'Must differ from current';
    if (!form.confirmPassword)
      e.confirmPassword = 'Required';
    else if (form.newPassword !== form.confirmPassword)
      e.confirmPassword = 'Does not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    if (errors[field])
      setErrors(p => ({ ...p, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      await api.put('/auth/update-password', form);
      setSuccess(true);
      toast.success('Password changed! Logging out...');
      setTimeout(() => logout(), 2000);
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to update';
      toast.error(msg);
      if (msg.toLowerCase().includes('current') ||
          msg.toLowerCase().includes('incorrect')) {
        setErrors(p => ({ ...p, currentPassword: msg }));
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="font-bold text-gray-900 mb-1">Password Updated!</h3>
        <p className="text-sm text-gray-500">Logging you out for security...</p>
      </div>
    );
  }

  const PasswordField = ({ field, label, showKey, placeholder }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label} *
      </label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type={show[showKey] ? 'text' : 'password'}
          value={form[field]}
          onChange={e => handleChange(field, e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-3 border rounded-xl outline-none text-sm focus:ring-2 focus:ring-primary-400 transition-all ${errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
        />
        <button
          type="button"
          onClick={() => setShow(p => ({ ...p, [showKey]: !p[showKey] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
        >
          {show[showKey]
            ? <EyeOff className="h-4 w-4" />
            : <Eye className="h-4 w-4" />
          }
        </button>
      </div>
      {errors[field] && (
        <div className="flex items-center gap-1 mt-1">
          <AlertCircle className="h-3 w-3 text-red-500" />
          <p className="text-xs text-red-600">{errors[field]}</p>
        </div>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">

      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
        <KeyRound className="h-5 w-5 text-blue-600 flex-shrink-0" />
        <p className="text-xs text-blue-700">
          After changing your password you will be logged out automatically for security.
        </p>
      </div>

      <PasswordField
        field="currentPassword"
        label="Current Password"
        showKey="current"
        placeholder="Enter current password"
      />

      <div>
        <PasswordField
          field="newPassword"
          label="New Password"
          showKey="new"
          placeholder="Min 6 characters"
        />
        {form.newPassword && (
          <div className="mt-2">
            <div className="flex gap-1 mb-1">
              {[1,2,3,4,5].map(i => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : 'bg-gray-200'}`}
                />
              ))}
            </div>
            {strength.label && (
              <p className={`text-xs font-medium ${strength.score <= 1 ? 'text-red-500' : strength.score <= 2 ? 'text-orange-500' : strength.score <= 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                {strength.label} password
              </p>
            )}
          </div>
        )}
      </div>

      <div>
        <PasswordField
          field="confirmPassword"
          label="Confirm New Password"
          showKey="confirm"
          placeholder="Re-enter new password"
        />
        {form.newPassword && form.confirmPassword && (
          <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${form.newPassword === form.confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
            {form.newPassword === form.confirmPassword
              ? <><CheckCircle className="h-3 w-3" /> Match!</>
              : <><AlertCircle className="h-3 w-3" /> No match</>
            }
          </div>
        )}
      </div>

      <Button
        type="submit"
        loading={loading}
        icon={Lock}
        className="w-full"
      >
        Update Password
      </Button>
    </form>
  );
};

export default UpdatePasswordForm;

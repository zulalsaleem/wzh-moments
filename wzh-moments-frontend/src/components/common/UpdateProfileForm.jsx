import { useState } from 'react';
import { User, Phone, FileText, Save, CheckCircle } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import Button from './Button';

const UpdateProfileForm = () => {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim())
      e.name = 'Name is required';
    else if (form.name.trim().length < 2)
      e.name = 'At least 2 characters';
    if (form.bio && form.bio.length > 200)
      e.bio = 'Max 200 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field])
      setErrors(prev => ({ ...prev, [field]: '' }));
    setSaved(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const res = await api.put('/auth/update-profile', {
        name: form.name.trim(),
        phone: form.phone.trim(),
        bio: form.bio.trim(),
      });
      if (res.data.success) {
        updateUser(res.data.user);
        setSaved(true);
        toast.success('Profile updated!');
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error || 'Failed to update'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">

      {/* Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Full Name *
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={form.name}
            onChange={e => handleChange('name', e.target.value)}
            className={`w-full pl-10 py-3 border rounded-xl outline-none text-sm focus:ring-2 focus:ring-primary-400 ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
            placeholder="Your full name"
          />
        </div>
        {errors.name && (
          <p className="text-xs text-red-600 mt-1">{errors.name}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Phone
          <span className="text-gray-400 font-normal ml-1">(Optional)</span>
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="tel"
            value={form.phone}
            onChange={e => handleChange('phone', e.target.value)}
            className="w-full pl-10 py-3 border border-gray-300 rounded-xl outline-none text-sm focus:ring-2 focus:ring-primary-400"
            placeholder="+92 300 1234567"
          />
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Bio
          <span className="text-gray-400 font-normal ml-1">(Optional)</span>
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <textarea
            value={form.bio}
            onChange={e => handleChange('bio', e.target.value)}
            rows={3}
            maxLength={200}
            className="w-full pl-10 py-3 border border-gray-300 rounded-xl outline-none text-sm resize-none focus:ring-2 focus:ring-primary-400"
            placeholder="Tell us about yourself..."
          />
        </div>
        <p className="text-xs text-gray-400 text-right mt-1">
          {form.bio.length}/200
        </p>
      </div>

      {/* Email read-only */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Email
          <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-normal">
            Cannot be changed
          </span>
        </label>
        <input
          type="email"
          value={user?.email || ''}
          disabled
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
        />
      </div>

      <Button
        type="submit"
        loading={loading}
        icon={saved ? CheckCircle : Save}
        className="w-full"
      >
        {saved ? 'Saved!' : 'Save Changes'}
      </Button>
    </form>
  );
};

export default UpdateProfileForm;

import { useState } from 'react';
import { MapPin, Calendar, DollarSign } from 'lucide-react';
import Modal from '../../common/Modal';
import Button from '../../common/Button';
import Input from '../../common/Input';
import api from '../../../api/axios';
import endpoints from '../../../api/endpoints';
import { REQUEST_CATEGORIES } from '../../../utils/constants';
import toast from 'react-hot-toast';

export default function CreateRequestModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'photography',
    budget: '',
    eventDate: '',
    location: '',
    preferences: '',
  });
  const [errors, setErrors] = useState({});

  const set = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.title || form.title.trim().length < 5)   e.title = 'At least 5 characters';
    if (!form.description || form.description.trim().length < 20) e.description = 'At least 20 characters';
    if (!form.budget || Number(form.budget) < 0)        e.budget = 'Enter a valid budget';
    if (!form.eventDate)                                 e.eventDate = 'Event date is required';
    else if (new Date(form.eventDate) <= new Date())     e.eventDate = 'Must be a future date';
    if (!form.location.trim())                           e.location = 'Location is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post(endpoints.userRequests.create, { ...form, budget: Number(form.budget) });
      toast.success('Request posted! Vendors will reach out soon.');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post request');
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <Modal isOpen onClose={onClose} title="Post a Service Request" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Title */}
        <Input
          label="What do you need? *"
          name="title"
          value={form.title}
          onChange={set}
          error={errors.title}
          placeholder="e.g. Need a photographer for my wedding"
        />

        {/* Category */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Category *</p>
          <div className="grid grid-cols-2 gap-2">
            {REQUEST_CATEGORIES.map((cat) => (
              <label
                key={cat.value}
                className={[
                  'flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm',
                  form.category === cat.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="category"
                  value={cat.value}
                  checked={form.category === cat.value}
                  onChange={set}
                  className="sr-only"
                />
                {cat.label}
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description * <span className="text-gray-400 font-normal">(min 20 chars)</span>
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={set}
            rows={4}
            placeholder="Describe what you need — expected guest count, style, special requirements..."
            className={[
              'w-full px-4 py-2.5 border rounded-lg text-sm outline-none resize-none transition-all',
              'focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              errors.description ? 'border-red-400 bg-red-50' : 'border-gray-300',
            ].join(' ')}
          />
          <div className="flex justify-between mt-1">
            {errors.description ? (
              <p className="text-xs text-red-600">{errors.description}</p>
            ) : <span />}
            <p className="text-xs text-gray-400">{form.description.length} chars</p>
          </div>
        </div>

        {/* Budget + Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget (PKR) *</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                name="budget"
                value={form.budget}
                onChange={set}
                min="0"
                placeholder="e.g. 25000"
                className={[
                  'w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm outline-none transition-all',
                  'focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  errors.budget ? 'border-red-400 bg-red-50' : 'border-gray-300',
                ].join(' ')}
              />
            </div>
            {errors.budget && <p className="mt-1 text-xs text-red-600">{errors.budget}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Date *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                name="eventDate"
                value={form.eventDate}
                onChange={set}
                min={minDate}
                className={[
                  'w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm outline-none transition-all',
                  'focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  errors.eventDate ? 'border-red-400 bg-red-50' : 'border-gray-300',
                ].join(' ')}
              />
            </div>
            {errors.eventDate && <p className="mt-1 text-xs text-red-600">{errors.eventDate}</p>}
          </div>
        </div>

        {/* Location */}
        <Input
          label="Location *"
          name="location"
          value={form.location}
          onChange={set}
          error={errors.location}
          icon={MapPin}
          placeholder="e.g. Lahore, Punjab"
        />

        {/* Preferences */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Preferences <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            name="preferences"
            value={form.preferences}
            onChange={set}
            rows={2}
            placeholder="Any specific style, color themes, requirements..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Post Request
          </Button>
        </div>
      </form>
    </Modal>
  );
}

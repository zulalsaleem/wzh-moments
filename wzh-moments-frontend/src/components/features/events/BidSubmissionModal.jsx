import { useState } from 'react';
import { X, Send, DollarSign, Clock, FileText, Link as LinkIcon, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import endpoints from '../../../api/endpoints';
import Modal from '../../common/Modal';
import Button from '../../common/Button';
import { formatCurrency } from '../../../utils/helpers';

export default function BidSubmissionModal({ event, onClose, onSuccess }) {
  const [selectedRequirement, setSelectedRequirement] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    proposal: '',
    deliveryTime: '',
    portfolioLinks: [''],
  });
  const [errors, setErrors] = useState({});

  const openRequirements = event.requirements?.filter((r) => r.status === 'open') ?? [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const updateLink = (i, val) =>
    setFormData((prev) => {
      const links = [...prev.portfolioLinks];
      links[i] = val;
      return { ...prev, portfolioLinks: links };
    });

  const addLink = () => {
    if (formData.portfolioLinks.length < 5)
      setFormData((prev) => ({ ...prev, portfolioLinks: [...prev.portfolioLinks, ''] }));
  };

  const removeLink = (i) =>
    setFormData((prev) => ({ ...prev, portfolioLinks: prev.portfolioLinks.filter((_, idx) => idx !== i) }));

  const validate = () => {
    const e = {};
    if (!selectedRequirement) e.requirement = 'Please select a requirement';
    if (!formData.amount || parseFloat(formData.amount) < 0) e.amount = 'Valid bid amount is required';
    if (!formData.proposal || formData.proposal.trim().length < 20)
      e.proposal = 'Proposal must be at least 20 characters';
    if (!formData.deliveryTime.trim()) e.deliveryTime = 'Delivery time is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e2) => {
    e2.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post(endpoints.bids.create, {
        eventId: event._id,
        requirementId: selectedRequirement,
        amount: parseFloat(formData.amount),
        proposal: formData.proposal.trim(),
        deliveryTime: formData.deliveryTime.trim(),
        portfolioLinks: formData.portfolioLinks.filter((l) => l.trim()),
      });
      toast.success('Bid submitted successfully! 🎉');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to submit bid');
    } finally {
      setLoading(false);
    }
  };

  const selectedReq = openRequirements.find((r) => r._id === selectedRequirement);

  return (
    <Modal isOpen onClose={onClose} title="Submit a Bid" size="lg">
      <p className="text-sm text-gray-500 -mt-2 mb-5">{event.title}</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Select Requirement */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Requirement <span className="text-red-500">*</span>
          </label>
          {openRequirements.length === 0 ? (
            <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-500 text-sm">
              No open requirements available for bidding
            </div>
          ) : (
            <div className="space-y-2">
              {openRequirements.map((req) => (
                <label
                  key={req._id}
                  className={[
                    'flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all',
                    selectedRequirement === req._id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="requirement"
                    value={req._id}
                    checked={selectedRequirement === req._id}
                    onChange={() => {
                      setSelectedRequirement(req._id);
                      setErrors((prev) => ({ ...prev, requirement: '' }));
                    }}
                    className="mt-1 accent-primary-600"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{req.title}</p>
                    {req.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{req.description}</p>
                    )}
                    {req.budget > 0 && (
                      <p className="text-xs text-primary-600 font-medium mt-1">
                        Budget: {formatCurrency(req.budget)}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
          {errors.requirement && (
            <p className="mt-1 text-sm text-red-600">{errors.requirement}</p>
          )}
        </div>

        {/* Amount + Delivery in a row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Bid Amount (PKR) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                min="0"
                placeholder="e.g. 50000"
                className={[
                  'w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm outline-none transition-all',
                  'focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  errors.amount ? 'border-red-400 bg-red-50' : 'border-gray-300',
                ].join(' ')}
              />
            </div>
            {selectedReq?.budget > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Client budget: {formatCurrency(selectedReq.budget)}
              </p>
            )}
            {errors.amount && <p className="text-xs text-red-600 mt-1">{errors.amount}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Delivery Time <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                name="deliveryTime"
                value={formData.deliveryTime}
                onChange={handleChange}
                placeholder="e.g. Same day, 3 days"
                className={[
                  'w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm outline-none transition-all',
                  'focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  errors.deliveryTime ? 'border-red-400 bg-red-50' : 'border-gray-300',
                ].join(' ')}
              />
            </div>
            {errors.deliveryTime && <p className="text-xs text-red-600 mt-1">{errors.deliveryTime}</p>}
          </div>
        </div>

        {/* Proposal */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Proposal <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <textarea
              name="proposal"
              value={formData.proposal}
              onChange={handleChange}
              rows={4}
              placeholder="Describe your experience, approach, and why you're the best choice..."
              className={[
                'w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm outline-none transition-all resize-none',
                'focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                errors.proposal ? 'border-red-400 bg-red-50' : 'border-gray-300',
              ].join(' ')}
            />
          </div>
          <div className="flex justify-between mt-1">
            {errors.proposal
              ? <p className="text-xs text-red-600">{errors.proposal}</p>
              : <p className="text-xs text-gray-400">Minimum 20 characters</p>}
            <p className="text-xs text-gray-400">{formData.proposal.length} chars</p>
          </div>
        </div>

        {/* Portfolio Links */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Portfolio Links <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            {formData.portfolioLinks.length < 5 && (
              <button
                type="button"
                onClick={addLink}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            )}
          </div>
          <div className="space-y-2">
            {formData.portfolioLinks.map((link, i) => (
              <div key={i} className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => updateLink(i, e.target.value)}
                    placeholder="https://yourportfolio.com"
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                {formData.portfolioLinks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLink(i)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            className="flex-1"
            disabled={openRequirements.length === 0}
          >
            <Send className="h-4 w-4" />
            Submit Bid
          </Button>
        </div>
      </form>
    </Modal>
  );
}

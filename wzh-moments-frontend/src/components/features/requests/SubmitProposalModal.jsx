import { useState } from 'react';
import { DollarSign, Clock, Link as LinkIcon, FileText } from 'lucide-react';
import Modal from '../../common/Modal';
import Button from '../../common/Button';
import Input from '../../common/Input';
import api from '../../../api/axios';
import endpoints from '../../../api/endpoints';
import { formatCurrency } from '../../../utils/helpers';
import toast from 'react-hot-toast';

export default function SubmitProposalModal({ request, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    proposal: '',
    deliveryTimeline: '',
    portfolioLinks: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  const set = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.amount || Number(form.amount) <= 0)          e.amount = 'Enter a valid amount';
    if (!form.proposal || form.proposal.trim().length < 30) e.proposal = 'At least 30 characters required';
    if (!form.deliveryTimeline.trim())                       e.deliveryTimeline = 'Timeline is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const portfolioLinks = form.portfolioLinks
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      await api.post(endpoints.userRequests.submitProposal, {
        requestId: request._id,
        amount: Number(form.amount),
        proposal: form.proposal,
        deliveryTimeline: form.deliveryTimeline,
        portfolioLinks,
        notes: form.notes,
      });
      toast.success('Proposal submitted! The user will review it.');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit proposal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Submit Proposal" size="md">
      {/* Request summary */}
      <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-100">
        <p className="text-xs text-gray-500 mb-1">Proposing for:</p>
        <p className="font-semibold text-gray-900 text-sm">{request.title}</p>
        <p className="text-xs text-gray-500 mt-1">
          User budget: <span className="font-medium text-primary-600">{formatCurrency(request.budget)}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Price (PKR) *</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={set}
              min="0"
              placeholder="e.g. 20000"
              className={[
                'w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm outline-none transition-all',
                'focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                errors.amount ? 'border-red-400 bg-red-50' : 'border-gray-300',
              ].join(' ')}
            />
          </div>
          {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount}</p>}
        </div>

        {/* Delivery timeline */}
        <Input
          label="Delivery Timeline *"
          name="deliveryTimeline"
          value={form.deliveryTimeline}
          onChange={set}
          error={errors.deliveryTimeline}
          icon={Clock}
          placeholder="e.g. Full-day coverage, delivered in 2 weeks"
        />

        {/* Proposal text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Proposal * <span className="text-gray-400 font-normal">(min 30 chars)</span>
          </label>
          <textarea
            name="proposal"
            value={form.proposal}
            onChange={set}
            rows={5}
            placeholder="Describe what you offer, your experience, why you're the best fit for this job..."
            className={[
              'w-full px-4 py-2.5 border rounded-lg text-sm outline-none resize-none transition-all',
              'focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              errors.proposal ? 'border-red-400 bg-red-50' : 'border-gray-300',
            ].join(' ')}
          />
          <div className="flex justify-between mt-1">
            {errors.proposal
              ? <p className="text-xs text-red-600">{errors.proposal}</p>
              : <span />}
            <p className="text-xs text-gray-400">{form.proposal.length} chars</p>
          </div>
        </div>

        {/* Portfolio links */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Portfolio Links <span className="text-gray-400 font-normal">(optional, one per line)</span>
          </label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <textarea
              name="portfolioLinks"
              value={form.portfolioLinks}
              onChange={set}
              rows={2}
              placeholder="https://portfolio.com&#10;https://instagram.com/yourwork"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={set}
            rows={2}
            placeholder="Any questions or extra info for the client..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Submit Proposal
          </Button>
        </div>
      </form>
    </Modal>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, ExternalLink, DollarSign } from 'lucide-react';
import Modal from '../../common/Modal';
import Button from '../../common/Button';
import Loading from '../../common/Loading';
import api from '../../../api/axios';
import endpoints from '../../../api/endpoints';
import { formatCurrency, getRelativeTime } from '../../../utils/helpers';
import { PROPOSAL_STATUS_COLORS } from '../../../utils/constants';
import toast from 'react-hot-toast';

export default function ViewProposalsModal({ request, onClose, onUpdate }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get(endpoints.userRequests.proposals(request._id));
      setData(res);
    } catch {
      toast.error('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  }, [request._id]);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  const handleAccept = async (proposalId) => {
    if (!window.confirm('Accept this proposal? All other pending proposals will be rejected.')) return;
    setActionId(proposalId);
    try {
      await api.patch(endpoints.userRequests.acceptProposal(proposalId));
      toast.success('Proposal accepted! Contact the vendor to get started.');
      fetchProposals();
      onUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (proposalId) => {
    setActionId(proposalId);
    try {
      await api.patch(endpoints.userRequests.rejectProposal(proposalId));
      toast.success('Proposal rejected');
      fetchProposals();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally {
      setActionId(null);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`Proposals — ${request.title}`} size="lg">
      {loading ? (
        <Loading fullScreen={false} message="Loading proposals..." />
      ) : !data ? (
        <p className="text-center text-gray-500 py-8">Failed to load proposals</p>
      ) : (
        <div className="space-y-6">
          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total',    value: data.stats?.total ?? 0,                           bg: 'bg-blue-50 text-blue-700' },
              { label: 'Pending',  value: data.stats?.pending ?? 0,                         bg: 'bg-yellow-50 text-yellow-700' },
              { label: 'Accepted', value: data.stats?.accepted ?? 0,                        bg: 'bg-green-50 text-green-700' },
              { label: 'Avg',      value: formatCurrency(data.stats?.averageAmount ?? 0),   bg: 'bg-purple-50 text-purple-700' },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                <p className="font-bold text-base leading-tight">{s.value}</p>
                <p className="text-xs mt-0.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Proposal list */}
          {data.proposals?.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No proposals yet</p>
              <p className="text-sm text-gray-400 mt-1">Vendors will send proposals soon</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.proposals.map((proposal) => (
                <div
                  key={proposal._id}
                  className={[
                    'border-2 rounded-2xl p-5 transition-all',
                    proposal.status === 'accepted' ? 'border-green-300 bg-green-50' :
                    proposal.status === 'rejected' ? 'border-red-200 bg-red-50 opacity-60' :
                    'border-gray-200 hover:border-primary-200',
                  ].join(' ')}
                >
                  {/* Vendor + amount */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-400 flex items-center justify-center shrink-0">
                        <span className="text-white text-sm font-bold">
                          {proposal.vendorId?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{proposal.vendorId?.name}</p>
                        <p className="text-xs text-gray-400">{proposal.vendorId?.email}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-black text-gray-900">{formatCurrency(proposal.amount)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PROPOSAL_STATUS_COLORS[proposal.status]}`}>
                        {proposal.status}
                      </span>
                    </div>
                  </div>

                  {/* Proposal text */}
                  <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-3">{proposal.proposal}</p>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {proposal.deliveryTimeline}
                    </span>
                    <span>{getRelativeTime(proposal.createdAt)}</span>
                    {proposal.portfolioLinks?.length > 0 && (
                      <a
                        href={proposal.portfolioLinks[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Portfolio
                      </a>
                    )}
                  </div>

                  {/* Actions */}
                  {proposal.status === 'pending' && (
                    <div className="flex gap-2 pt-3 border-t border-gray-200">
                      <Button
                        size="sm"
                        icon={CheckCircle}
                        loading={actionId === proposal._id}
                        onClick={() => handleAccept(proposal._id)}
                        className="flex-1"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        icon={XCircle}
                        loading={actionId === proposal._id}
                        onClick={() => handleReject(proposal._id)}
                        className="flex-1"
                      >
                        Reject
                      </Button>
                    </div>
                  )}

                  {proposal.status === 'accepted' && (
                    <div className="mt-3 p-3 bg-green-100 rounded-xl text-sm text-green-800 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      Selected! Contact {proposal.vendorId?.name} at {proposal.vendorId?.email} to coordinate.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

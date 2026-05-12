import { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, XCircle, DollarSign, Clock, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import endpoints from '../../../api/endpoints';
import Button from '../../common/Button';
import Loading from '../../common/Loading';
import { formatCurrency, getRelativeTime } from '../../../utils/helpers';

const STATUS_STYLE = {
  pending:  'bg-yellow-100 text-yellow-800 border-yellow-200',
  accepted: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

const REQ_STATUS_STYLE = {
  open:      'bg-blue-100 text-blue-700',
  assigned:  'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-700',
};

export default function EventBidsModal({ event, onClose }) {
  const [bidsData, setBidsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingBid, setUpdatingBid] = useState(null);

  const fetchBids = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(endpoints.bids.eventBids(event._id));
      setBidsData(data);
    } catch {
      toast.error('Failed to load bids');
    } finally {
      setLoading(false);
    }
  }, [event._id]);

  useEffect(() => { fetchBids(); }, [fetchBids]);

  const handleBidAction = async (bidId, status) => {
    setUpdatingBid(bidId);
    try {
      await api.patch(endpoints.bids.updateStatus(bidId), { status });
      toast.success(
        status === 'accepted'
          ? 'Bid accepted! Other bids auto-rejected.'
          : 'Bid rejected.'
      );
      fetchBids();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Action failed');
    } finally {
      setUpdatingBid(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Event Bids</h2>
            <p className="text-sm text-gray-500 truncate max-w-xs">{event.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <Loading fullScreen={false} message="Loading bids..." />
          ) : !bidsData ? (
            <p className="text-center text-gray-500 py-8">Failed to load bids</p>
          ) : (
            <>
              {/* Stats strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Total Bids',  value: bidsData.stats?.totalBids      ?? 0, color: 'bg-blue-50 text-blue-700' },
                  { label: 'Pending',     value: bidsData.stats?.pendingBids     ?? 0, color: 'bg-yellow-50 text-yellow-700' },
                  { label: 'Accepted',    value: bidsData.stats?.acceptedBids    ?? 0, color: 'bg-green-50 text-green-700' },
                  { label: 'Vendors',     value: bidsData.stats?.uniqueVendors   ?? 0, color: 'bg-purple-50 text-purple-700' },
                ].map((stat) => (
                  <div key={stat.label} className={`${stat.color} rounded-2xl p-3 text-center`}>
                    <p className="text-2xl font-bold leading-none">{stat.value}</p>
                    <p className="text-xs font-medium mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Bids grouped by requirement */}
              {!bidsData.bidsByRequirement ||
               Object.keys(bidsData.bidsByRequirement).length === 0 ? (
                <div className="text-center py-14">
                  <DollarSign className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                  <p className="font-medium text-gray-500">No bids received yet</p>
                  <p className="text-sm text-gray-400 mt-1">Vendors will bid on your requirements</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(bidsData.bidsByRequirement).map(([reqId, reqData]) => (
                    <div key={reqId} className="border border-gray-200 rounded-2xl overflow-hidden">
                      {/* Requirement header */}
                      <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h3 className="font-bold text-gray-900">{reqData.requirement?.title}</h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {reqData.bidsCount} bid{reqData.bidsCount !== 1 ? 's' : ''}
                            {reqData.lowestBid != null && reqData.highestBid != null && (
                              <> · Range: {formatCurrency(reqData.lowestBid)} – {formatCurrency(reqData.highestBid)}</>
                            )}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${REQ_STATUS_STYLE[reqData.requirement?.status] ?? 'bg-gray-100 text-gray-700'}`}>
                          {reqData.requirement?.status}
                        </span>
                      </div>

                      {/* Bid rows */}
                      <div className="divide-y divide-gray-100">
                        {reqData.bids?.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-6">No bids on this requirement</p>
                        ) : (
                          reqData.bids.map((bid) => (
                            <div key={bid._id} className="p-5">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">

                                {/* Vendor info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center shrink-0">
                                      <span className="text-white text-sm font-bold">
                                        {bid.vendor?.name?.charAt(0).toUpperCase() ?? '?'}
                                      </span>
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-gray-900 text-sm">{bid.vendor?.name}</p>
                                      <p className="text-xs text-gray-500 truncate">{bid.vendor?.email}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[bid.status] ?? STATUS_STYLE.pending}`}>
                                      {bid.status}
                                    </span>
                                  </div>

                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{bid.proposal}</p>

                                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {bid.deliveryTime}
                                    </span>
                                    <span>{getRelativeTime(bid.submittedAt ?? bid.createdAt)}</span>
                                    {bid.portfolioLinks?.[0] && (
                                      <a
                                        href={bid.portfolioLinks[0]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                        Portfolio
                                      </a>
                                    )}
                                  </div>
                                </div>

                                {/* Amount + actions */}
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                  <p className="text-xl font-black text-gray-900">{formatCurrency(bid.amount)}</p>

                                  {bid.status === 'pending' && (
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        loading={updatingBid === bid._id}
                                        onClick={() => handleBidAction(bid._id, 'accepted')}
                                      >
                                        <CheckCircle className="h-3.5 w-3.5" />
                                        Accept
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="danger"
                                        loading={updatingBid === bid._id}
                                        onClick={() => handleBidAction(bid._id, 'rejected')}
                                      >
                                        <XCircle className="h-3.5 w-3.5" />
                                        Reject
                                      </Button>
                                    </div>
                                  )}

                                  {bid.status === 'accepted' && (
                                    <span className="text-xs text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">
                                      ✓ Selected
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

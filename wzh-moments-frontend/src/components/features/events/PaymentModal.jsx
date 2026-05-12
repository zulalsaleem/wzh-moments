import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  X, Lock, CreditCard, CheckCircle,
  AlertCircle, Loader, Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import { formatCurrency } from '../../../utils/helpers';

const stripeElementStyle = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1f2937',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSmoothing: 'antialiased',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
};

// ─── Inner payment form (must live inside <Elements>) ─────────────────────────
function PaymentForm({ clientSecret, eventId, eventTitle, amount, numberOfTickets, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [cardName, setCardName] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState('form'); // form | processing | success

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    if (!cardName.trim()) {
      setError('Please enter the cardholder name');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setStep('processing');

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
          billing_details: { name: cardName },
        },
      });

      if (stripeError) {
        setError(stripeError.message);
        setStep('form');
        setLoading(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        const response = await api.post('/api/payments/confirm-booking', {
          paymentIntentId: paymentIntent.id,
          eventId,
          numberOfTickets,
        });

        if (response.data.success) {
          setStep('success');
          setTimeout(() => onSuccess(response.data.booking), 2000);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mb-6">
          <Loader className="h-10 w-10 text-primary-600 animate-spin" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Processing Payment...</h3>
        <p className="text-gray-500 text-sm">Please wait, do not close this window</p>
        <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
          <Shield className="h-4 w-4" />
          Secured by Stripe
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6 animate-bounce">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <h3 className="text-2xl font-black text-gray-900 mb-2">Payment Successful! 🎉</h3>
        <p className="text-gray-500 mb-1">Your booking is confirmed</p>
        <p className="text-sm text-primary-600 font-medium">{eventTitle}</p>
        <div className="mt-4 bg-green-50 border border-green-200 rounded-xl px-6 py-3">
          <p className="text-green-700 font-bold text-lg">{formatCurrency(amount)} Paid</p>
          <p className="text-green-600 text-xs mt-1">Confirmation email sent to your inbox</p>
        </div>
        <p className="text-xs text-gray-400 mt-4">Redirecting to your dashboard...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6">
      {/* Order summary */}
      <div className="bg-gradient-to-br from-primary-50 to-secondary-50 border border-primary-200 rounded-2xl p-4 mb-6">
        <h4 className="font-semibold text-gray-900 text-sm mb-3">Order Summary</h4>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">{eventTitle}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Tickets × {numberOfTickets}</span>
          <span className="font-medium">{formatCurrency(amount / numberOfTickets)} each</span>
        </div>
        <div className="border-t border-primary-200 pt-2 mt-2 flex justify-between">
          <span className="font-bold text-gray-900">Total</span>
          <span className="font-black text-primary-600 text-lg">{formatCurrency(amount)}</span>
        </div>
      </div>

      {/* Test card notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5">
        <p className="text-xs text-blue-700 font-semibold mb-1">🧪 Test Mode — Use Test Card:</p>
        <p className="text-xs text-blue-600 font-mono">4242 4242 4242 4242 &nbsp;|&nbsp; 12/28 &nbsp;|&nbsp; 123</p>
      </div>

      {/* Cardholder name */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Cardholder Name *
        </label>
        <input
          type="text"
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          placeholder="John Doe"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-900 transition-all"
          required
        />
      </div>

      {/* Card number */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Card Number *</label>
        <div className="px-4 py-3.5 border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all bg-white">
          <CardNumberElement options={stripeElementStyle} />
        </div>
      </div>

      {/* Expiry + CVV */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date *</label>
          <div className="px-4 py-3.5 border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all bg-white">
            <CardExpiryElement options={stripeElementStyle} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">CVV *</label>
          <div className="px-4 py-3.5 border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all bg-white">
            <CardCvcElement options={stripeElementStyle} />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Pay button */}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-bold text-lg rounded-2xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <><Loader className="h-5 w-5 animate-spin" /> Processing...</>
        ) : (
          <><Lock className="h-5 w-5" /> Pay {formatCurrency(amount)}</>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 mt-4">
        <Shield className="h-4 w-4 text-gray-400" />
        <p className="text-xs text-gray-400">Secured by Stripe • 256-bit SSL encryption</p>
      </div>
    </form>
  );
}

// ─── Modal wrapper ─────────────────────────────────────────────────────────────
export default function PaymentModal({ event, numberOfTickets = 1, onClose, onSuccess }) {
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [freeBookingLoading, setFreeBookingLoading] = useState(false);

  const totalAmount = event.ticketPrice * numberOfTickets;

  useEffect(() => {
    initPayment();
  }, []);

  const initPayment = async () => {
    try {
      setLoading(true);
      setError('');

      const configRes = await api.get('/api/payments/config');
      const stripe = await loadStripe(configRes.data.publishableKey);
      setStripePromise(stripe);

      if (event.ticketPrice === 0) {
        setIsFree(true);
        return;
      }

      const intentRes = await api.post('/api/payments/create-intent', {
        eventId: event._id,
        numberOfTickets,
      });

      if (intentRes.data.isFree) {
        setIsFree(true);
      } else {
        setClientSecret(intentRes.data.clientSecret);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const handleFreeBooking = async () => {
    try {
      setFreeBookingLoading(true);
      const response = await api.post('/api/bookings', {
        eventId: event._id,
        numberOfTickets,
      });
      if (response.data.success || response.data.booking) {
        onSuccess(response.data.booking);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Booking failed');
    } finally {
      setFreeBookingLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isFree ? 'Confirm Booking' : 'Secure Payment'}
              </h2>
              <p className="text-xs text-gray-500 truncate max-w-[200px]">{event.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader className="h-10 w-10 text-primary-600 animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Initializing payment...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <button
              onClick={initPayment}
              className="px-6 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 text-sm"
            >
              Try Again
            </button>
          </div>
        ) : isFree ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Free Event! 🎉</h3>
            <p className="text-gray-500 mb-6 text-sm">
              This event is free. Click below to confirm your booking.
            </p>
            <button
              onClick={handleFreeBooking}
              disabled={freeBookingLoading}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold rounded-2xl hover:from-green-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {freeBookingLoading ? 'Booking...' : 'Confirm Free Booking'}
            </button>
          </div>
        ) : (
          stripePromise && clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm
                clientSecret={clientSecret}
                eventId={event._id}
                eventTitle={event.title}
                amount={totalAmount}
                numberOfTickets={numberOfTickets}
                onSuccess={onSuccess}
              />
            </Elements>
          )
        )}
      </div>
    </div>
  );
}

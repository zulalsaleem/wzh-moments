import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { createPaymentIntent, verifyPayment } from '../services/stripeService.js';
import Booking from '../models/Booking.js';
import Event from '../models/Event.js';
import { sendBookingConfirmationEmail } from '../services/emailService.js';

const router = Router();

// GET /api/payments/config — return publishable key to frontend
router.get('/config', (req, res) => {
  res.json({
    success: true,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

// POST /api/payments/create-intent — create a PaymentIntent
router.post('/create-intent', protect, async (req, res) => {
  try {
    const { eventId, numberOfTickets = 1 } = req.body;

    if (!eventId) {
      return res.status(400).json({ success: false, error: 'Event ID is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    if (event.ticketPrice === 0) {
      return res.json({ success: true, isFree: true, message: 'Free event — no payment required' });
    }

    const totalAmount = event.ticketPrice * numberOfTickets;

    const result = await createPaymentIntent(
      totalAmount,
      'usd', // Stripe test mode; treat ticket price as USD for demo
      {
        eventId: eventId.toString(),
        eventTitle: event.title,
        userId: req.user.id,
        numberOfTickets: numberOfTickets.toString(),
      }
    );

    res.json({
      success: true,
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
      amount: totalAmount,
      eventTitle: event.title,
      numberOfTickets,
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ success: false, error: 'Failed to create payment intent' });
  }
});

// POST /api/payments/confirm-booking — verify payment then create booking
router.post('/confirm-booking', protect, async (req, res) => {
  try {
    const { paymentIntentId, eventId, numberOfTickets = 1 } = req.body;

    if (!paymentIntentId || !eventId) {
      return res.status(400).json({ success: false, error: 'paymentIntentId and eventId are required' });
    }

    // Verify with Stripe
    const verification = await verifyPayment(paymentIntentId);
    if (!verification.paid) {
      return res.status(400).json({ success: false, error: 'Payment not completed. Please try again.' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    const availableSeats = event.maxAttendees - event.currentAttendees;
    if (numberOfTickets > availableSeats) {
      return res.status(400).json({ success: false, error: `Only ${availableSeats} seat(s) remaining` });
    }

    const existingBooking = await Booking.findOne({ userId: req.user.id, eventId });
    if (existingBooking) {
      return res.status(400).json({ success: false, error: 'You have already booked this event' });
    }

    const booking = await Booking.create({
      userId: req.user.id,
      eventId,
      numberOfTickets,
      totalAmount: event.ticketPrice * numberOfTickets,
      status: 'confirmed',
      paymentStatus: 'completed',
      paymentIntentId,
    });

    await Event.findByIdAndUpdate(eventId, { $inc: { currentAttendees: numberOfTickets } });

    await booking.populate('eventId', 'title date location ticketPrice');

    // Send confirmation email (non-blocking)
    sendBookingConfirmationEmail(
      req.user.email,
      req.user.name,
      event.title,
      event.date,
      event.location,
      numberOfTickets,
      event.ticketPrice * numberOfTickets
    ).catch(err => console.error('Booking email failed:', err.message));

    res.status(201).json({ success: true, message: 'Booking confirmed!', booking });
  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({ success: false, error: 'Failed to confirm booking' });
  }
});

export default router;

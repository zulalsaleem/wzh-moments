import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();

const baseTemplate = (content, title) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; }
    .container { max-width: 600px; margin: 30px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0ea5e9, #a855f7); padding: 30px; text-align: center; }
    .header h1 { color: white; font-size: 28px; font-weight: 800; }
    .header p { color: rgba(255,255,255,0.8); margin-top: 5px; }
    .body { padding: 40px 30px; }
    .body h2 { color: #1f2937; font-size: 22px; margin-bottom: 15px; }
    .body p { color: #6b7280; line-height: 1.6; margin-bottom: 15px; }
    .highlight-box { background: linear-gradient(135deg, #f0f9ff, #faf5ff); border: 1px solid #e0f2fe; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .highlight-box h3 { color: #0ea5e9; font-size: 16px; margin-bottom: 10px; }
    .highlight-box p { color: #374151; margin: 5px 0; font-size: 14px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #0ea5e9, #a855f7); color: white; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .success-badge { background: #d1fae5; color: #065f46; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: 600; font-size: 14px; margin-bottom: 20px; }
    .warning-badge { background: #fef3c7; color: #92400e; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: 600; font-size: 14px; margin-bottom: 20px; }
    .danger-badge { background: #fee2e2; color: #991b1b; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: 600; font-size: 14px; margin-bottom: 20px; }
    .divider { height: 1px; background: #e5e7eb; margin: 25px 0; }
    .footer { background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { color: #9ca3af; font-size: 13px; line-height: 1.6; }
    .footer a { color: #0ea5e9; text-decoration: none; }
    .team { color: #6b7280; font-size: 12px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ WZH Moments</h1>
      <p>Event Management Platform</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>This email was sent by <a href="${FRONTEND_URL}">WZH Moments</a></p>
      <p>Event Management &amp; Marketplace Platform</p>
      <p class="team">Built by Haris, Zulal &amp; Wali | COMSATS University Sahiwal</p>
    </div>
  </div>
</body>
</html>
`;

// ─── EMAIL TEMPLATES ──────────────────────────────────────────────

const templates = {

  welcome: (name, role) => ({
    subject: '🎉 Welcome to WZH Moments!',
    html: baseTemplate(`
      <div class="success-badge">✓ Account Created Successfully</div>
      <h2>Welcome aboard, ${name}! 🎊</h2>
      <p>We're thrilled to have you join WZH Moments - Pakistan's premier real-time event management platform.</p>

      <div class="highlight-box">
        <h3>Your Account Details</h3>
        <p>👤 Name: <strong>${name}</strong></p>
        <p>🎭 Role: <strong>${role.charAt(0).toUpperCase() + role.slice(1)}</strong></p>
        <p>✅ Status: <strong>Active</strong></p>
      </div>

      ${role === 'user' ? `
        <p>As a <strong>User</strong>, you can:</p>
        <p>🎫 Browse and book amazing events</p>
        <p>📊 Track event progress in real-time</p>
        <p>🛒 Post service requests and receive proposals</p>
      ` : role === 'organizer' ? `
        <p>As an <strong>Organizer</strong>, you can:</p>
        <p>📅 Create and manage events with live timelines</p>
        <p>👥 Track attendees and manage bookings</p>
        <p>💼 Post vendor requirements and hire services</p>
      ` : role === 'vendor' ? `
        <p>As a <strong>Vendor</strong>, you can:</p>
        <p>💼 Browse event requirements and submit bids</p>
        <p>📋 Respond to user service requests</p>
        <p>⚠️ Note: Admin verification required before bidding</p>
      ` : ''}

      <a href="${FRONTEND_URL}" class="btn">🚀 Get Started Now</a>

      <div class="divider"></div>
      <p>Need help? Just reply to this email or visit our platform.</p>
    `, 'Welcome to WZH Moments'),
  }),

  bookingConfirmation: (userName, eventTitle, eventDate, eventLocation, tickets, amount) => ({
    subject: `🎫 Booking Confirmed - ${eventTitle}`,
    html: baseTemplate(`
      <div class="success-badge">✓ Booking Confirmed</div>
      <h2>Your booking is confirmed! 🎉</h2>
      <p>Hi ${userName}, great news! Your booking for <strong>${eventTitle}</strong> has been confirmed.</p>

      <div class="highlight-box">
        <h3>📋 Booking Details</h3>
        <p>🎪 Event: <strong>${eventTitle}</strong></p>
        <p>📅 Date: <strong>${new Date(eventDate).toLocaleDateString('en-PK', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        })}</strong></p>
        <p>📍 Location: <strong>${eventLocation}</strong></p>
        <p>🎫 Tickets: <strong>${tickets}</strong></p>
        <p>💰 Amount: <strong>${amount === 0 ? 'FREE' : `PKR ${amount.toLocaleString()}`}</strong></p>
      </div>

      <p>You can track the live progress of this event on our platform.
      When the organizer updates tasks, you'll see it in real-time!</p>

      <a href="${FRONTEND_URL}/dashboard" class="btn">📊 View My Bookings</a>

      <div class="divider"></div>
      <p>To cancel this booking, visit your dashboard before the event date.</p>
    `, 'Booking Confirmed'),
  }),

  eventApproved: (organizerName, eventTitle, eventDate) => ({
    subject: `✅ Your Event is Approved - ${eventTitle}`,
    html: baseTemplate(`
      <div class="success-badge">✓ Event Approved</div>
      <h2>Congratulations ${organizerName}! 🎊</h2>
      <p>Your event has been reviewed and approved by our admin team.
      It is now <strong>live</strong> and visible to all users!</p>

      <div class="highlight-box">
        <h3>🎪 Event Details</h3>
        <p>📌 Title: <strong>${eventTitle}</strong></p>
        <p>📅 Date: <strong>${new Date(eventDate).toLocaleDateString('en-PK', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        })}</strong></p>
        <p>✅ Status: <strong>Approved &amp; Live</strong></p>
      </div>

      <p>Users can now discover and book your event.
      Make sure to keep your event timeline updated during the event
      so attendees can track progress in real-time!</p>

      <a href="${FRONTEND_URL}/organizer/dashboard" class="btn">📊 View Your Dashboard</a>
    `, 'Event Approved'),
  }),

  eventRejected: (organizerName, eventTitle, reason) => ({
    subject: `❌ Event Submission Update - ${eventTitle}`,
    html: baseTemplate(`
      <div class="danger-badge">⚠ Event Not Approved</div>
      <h2>Hi ${organizerName},</h2>
      <p>We've reviewed your event submission and unfortunately it
      could not be approved at this time.</p>

      <div class="highlight-box">
        <h3>📋 Submission Details</h3>
        <p>📌 Event: <strong>${eventTitle}</strong></p>
        <p>❌ Status: <strong>Not Approved</strong></p>
        <p>💬 Reason: <strong>${reason || 'Please review event details and resubmit'}</strong></p>
      </div>

      <p>Don't worry! You can edit your event details and resubmit
      for approval. Make sure to address the reason mentioned above.</p>

      <a href="${FRONTEND_URL}/organizer/dashboard" class="btn">✏️ Edit &amp; Resubmit</a>
    `, 'Event Update'),
  }),

  proposalReceived: (userName, requestTitle, vendorName, amount) => ({
    subject: `💼 New Proposal for "${requestTitle}"`,
    html: baseTemplate(`
      <div class="success-badge">📨 New Proposal Received</div>
      <h2>Hi ${userName}!</h2>
      <p>Great news! A verified vendor has submitted a proposal
      for your service request.</p>

      <div class="highlight-box">
        <h3>📋 Proposal Details</h3>
        <p>📌 Your Request: <strong>${requestTitle}</strong></p>
        <p>👤 Vendor: <strong>${vendorName}</strong></p>
        <p>💰 Proposed Amount: <strong>PKR ${amount?.toLocaleString()}</strong></p>
        <p>✅ Vendor Status: <strong>Verified</strong></p>
      </div>

      <p>Log in to your dashboard to review the full proposal,
      compare with other proposals, and accept the best one!</p>

      <a href="${FRONTEND_URL}/dashboard" class="btn">👀 Review Proposal</a>

      <div class="divider"></div>
      <p>Once you accept a proposal, other proposals will be
      automatically rejected and the vendor will be notified.</p>
    `, 'New Proposal Received'),
  }),

  proposalAccepted: (vendorName, requestTitle, amount) => ({
    subject: `🎉 Your Proposal Was Accepted!`,
    html: baseTemplate(`
      <div class="success-badge">🏆 Proposal Accepted!</div>
      <h2>Congratulations ${vendorName}! 🎊</h2>
      <p>Your proposal has been selected! The client has
      accepted your offer.</p>

      <div class="highlight-box">
        <h3>🏆 Winning Proposal</h3>
        <p>📌 Request: <strong>${requestTitle}</strong></p>
        <p>💰 Your Bid: <strong>PKR ${amount?.toLocaleString()}</strong></p>
        <p>✅ Status: <strong>Accepted</strong></p>
      </div>

      <p>The client will contact you shortly to coordinate
      the service. Check your dashboard for their contact details.</p>

      <a href="${FRONTEND_URL}/vendor/dashboard" class="btn">📊 View My Proposals</a>
    `, 'Proposal Accepted'),
  }),

  proposalRejected: (vendorName, requestTitle) => ({
    subject: `📋 Proposal Update - ${requestTitle}`,
    html: baseTemplate(`
      <div class="warning-badge">📋 Proposal Not Selected</div>
      <h2>Hi ${vendorName},</h2>
      <p>Thank you for submitting a proposal. Unfortunately,
      the client selected a different vendor for this request.</p>

      <div class="highlight-box">
        <h3>📋 Proposal Details</h3>
        <p>📌 Request: <strong>${requestTitle}</strong></p>
        <p>📊 Status: <strong>Not Selected</strong></p>
      </div>

      <p>Don't give up! There are many more opportunities
      on our marketplace. Browse more requests and keep bidding!</p>

      <a href="${FRONTEND_URL}/marketplace" class="btn">🛒 Browse More Requests</a>
    `, 'Proposal Update'),
  }),

  vendorVerified: (vendorName) => ({
    subject: `✅ Your Vendor Account is Verified!`,
    html: baseTemplate(`
      <div class="success-badge">✓ Account Verified</div>
      <h2>Welcome to the marketplace, ${vendorName}! 🎊</h2>
      <p>Your vendor account has been verified by our admin team.
      You can now submit bids and proposals!</p>

      <div class="highlight-box">
        <h3>✅ What You Can Do Now</h3>
        <p>💼 Browse event requirements and submit bids</p>
        <p>📋 Browse user service requests and send proposals</p>
        <p>🏆 Win jobs and build your reputation</p>
        <p>⭐ Collect reviews and ratings</p>
      </div>

      <p>Start browsing opportunities now and grow your business!</p>

      <a href="${FRONTEND_URL}/vendor/dashboard" class="btn">🚀 Start Bidding Now</a>
    `, 'Vendor Verified'),
  }),

  otpVerification: (name, otp) => ({
    subject: '🔐 Verify Your WZH Moments Account',
    html: baseTemplate(`
      <div class="success-badge">🔐 Email Verification</div>
      <h2>Hi ${name}!</h2>
      <p>Thank you for joining WZH Moments!
      Please verify your email address using the OTP below.</p>

      <div style="text-align: center; margin: 30px 0;">
        <div style="display: inline-block; background: linear-gradient(135deg, #0ea5e9, #a855f7); border-radius: 16px; padding: 20px 40px;">
          <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin-bottom: 8px;">Your Verification Code</p>
          <p style="color: white; font-size: 48px; font-weight: 900; letter-spacing: 12px; margin: 0;">${otp}</p>
        </div>
      </div>

      <div class="highlight-box">
        <h3>⏰ Important</h3>
        <p>• This OTP expires in <strong>2 minutes</strong></p>
        <p>• Do not share this OTP with anyone</p>
        <p>• If you did not register, ignore this email</p>
      </div>

      <p style="text-align: center; color: #9ca3af; font-size: 13px; margin-top: 20px;">
        Entered wrong email?
        <a href="${FRONTEND_URL}/register" style="color: #0ea5e9;">Register again</a>
      </p>
    `, 'Verify Your Email'),
  }),

  resendOTP: (name, otp) => ({
    subject: '🔐 New OTP - WZH Moments Verification',
    html: baseTemplate(`
      <div class="warning-badge">🔄 New OTP Generated</div>
      <h2>Hi ${name}!</h2>
      <p>Here is your new verification code.
      Your previous OTP has been invalidated.</p>

      <div style="text-align: center; margin: 30px 0;">
        <div style="display: inline-block; background: linear-gradient(135deg, #0ea5e9, #a855f7); border-radius: 16px; padding: 20px 40px;">
          <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin-bottom: 8px;">New Verification Code</p>
          <p style="color: white; font-size: 48px; font-weight: 900; letter-spacing: 12px; margin: 0;">${otp}</p>
        </div>
      </div>

      <div class="highlight-box">
        <h3>⏰ Expires in 2 minutes</h3>
        <p>Use this code immediately to verify your account.</p>
      </div>
    `, 'New Verification Code'),
  }),

  bookingCancelled: (userName, eventTitle) => ({
    subject: `🚫 Booking Cancelled - ${eventTitle}`,
    html: baseTemplate(`
      <div class="warning-badge">⚠ Booking Cancelled</div>
      <h2>Hi ${userName},</h2>
      <p>Your booking has been successfully cancelled.</p>

      <div class="highlight-box">
        <h3>📋 Cancellation Details</h3>
        <p>🎪 Event: <strong>${eventTitle}</strong></p>
        <p>❌ Status: <strong>Cancelled</strong></p>
        <p>💺 Seats have been released back to the event</p>
      </div>

      <p>Browse other amazing events on our platform!</p>

      <a href="${FRONTEND_URL}/events" class="btn">🔍 Browse Events</a>
    `, 'Booking Cancelled'),
  }),

  forgotPassword: (name, otp) => ({
    subject: '🔑 Reset Your Password - WZH Moments',
    html: baseTemplate(`
      <div class="warning-badge">🔑 Password Reset Request</div>
      <h2>Hi ${name}!</h2>
      <p>We received a request to reset your WZH Moments account password.
      Use the code below:</p>

      <div style="text-align:center; margin: 30px 0;">
        <div style="display:inline-block;
          background: linear-gradient(135deg, #0ea5e9, #a855f7);
          border-radius: 16px; padding: 20px 40px;">
          <p style="color:rgba(255,255,255,0.8); font-size:14px; margin-bottom:8px;">
            Password Reset Code
          </p>
          <p style="color:white; font-size:48px;
            font-weight:900; letter-spacing:12px; margin:0;">
            ${otp}
          </p>
        </div>
      </div>

      <div class="highlight-box">
        <h3>⏰ Important</h3>
        <p>• Code expires in <strong>2 minutes</strong></p>
        <p>• Do not share this code with anyone</p>
        <p>• If you did not request this, ignore this email</p>
        <p>• Your password will NOT change unless you complete the reset</p>
      </div>
    `, 'Reset Your Password'),
  }),

  passwordResetSuccess: (name) => ({
    subject: '✅ Password Reset Successful - WZH Moments',
    html: baseTemplate(`
      <div class="success-badge">✅ Password Reset Successful</div>
      <h2>Hi ${name}!</h2>
      <p>Your WZH Moments password has been successfully reset.
      You can now login with your new password.</p>

      <div class="highlight-box">
        <h3>⚠️ Didn't do this?</h3>
        <p>If you did not reset your password, contact support immediately
        as your account may be compromised.</p>
      </div>

      <a href="${FRONTEND_URL}/login" class="btn">Login Now →</a>
    `, 'Password Reset Successful'),
  }),
};

// ─── MAIN EMAIL SENDER ────────────────────────────────────────────

export const sendEmail = async (to, templateName, templateData) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('📧 Email not configured, skipping:', templateName);
      return { success: false, reason: 'Email not configured' };
    }

    const template = templates[templateName];
    if (!template) {
      console.error('❌ Email template not found:', templateName);
      return { success: false, reason: 'Template not found' };
    }

    const emailContent = template(...templateData);

    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `WZH Moments <${process.env.EMAIL_USER}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log(`📧 Email sent: ${templateName} → ${to}`);
    console.log(`   Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email failed: ${templateName}`, error.message);
    return { success: false, error: error.message };
  }
};

// ─── CONVENIENCE EXPORTS ──────────────────────────────────────────

export const sendWelcomeEmail = (to, name, role) =>
  sendEmail(to, 'welcome', [name, role]);

export const sendBookingConfirmationEmail = (to, userName, eventTitle, eventDate, location, tickets, amount) =>
  sendEmail(to, 'bookingConfirmation', [userName, eventTitle, eventDate, location, tickets, amount]);

export const sendEventApprovedEmail = (to, organizerName, eventTitle, eventDate) =>
  sendEmail(to, 'eventApproved', [organizerName, eventTitle, eventDate]);

export const sendEventRejectedEmail = (to, organizerName, eventTitle, reason) =>
  sendEmail(to, 'eventRejected', [organizerName, eventTitle, reason]);

export const sendProposalReceivedEmail = (to, userName, requestTitle, vendorName, amount) =>
  sendEmail(to, 'proposalReceived', [userName, requestTitle, vendorName, amount]);

export const sendProposalAcceptedEmail = (to, vendorName, requestTitle, amount) =>
  sendEmail(to, 'proposalAccepted', [vendorName, requestTitle, amount]);

export const sendProposalRejectedEmail = (to, vendorName, requestTitle) =>
  sendEmail(to, 'proposalRejected', [vendorName, requestTitle]);

export const sendVendorVerifiedEmail = (to, vendorName) =>
  sendEmail(to, 'vendorVerified', [vendorName]);

export const sendBookingCancelledEmail = (to, userName, eventTitle) =>
  sendEmail(to, 'bookingCancelled', [userName, eventTitle]);

export const sendOTPEmail = (to, name, otp) =>
  sendEmail(to, 'otpVerification', [name, otp]);

export const sendResendOTPEmail = (to, name, otp) =>
  sendEmail(to, 'resendOTP', [name, otp]);

export const sendForgotPasswordEmail = (to, name, otp) =>
  sendEmail(to, 'forgotPassword', [name, otp]);

export const sendPasswordResetSuccessEmail = (to, name) =>
  sendEmail(to, 'passwordResetSuccess', [name]);

export default {
  sendEmail,
  sendWelcomeEmail,
  sendBookingConfirmationEmail,
  sendEventApprovedEmail,
  sendEventRejectedEmail,
  sendProposalReceivedEmail,
  sendProposalAcceptedEmail,
  sendProposalRejectedEmail,
  sendVendorVerifiedEmail,
  sendBookingCancelledEmail,
};

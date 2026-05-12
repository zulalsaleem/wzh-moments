const endpoints = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    me: '/auth/me',
  },

  events: {
    list: '/events',
    create: '/events',
    getById: (id) => `/events/${id}`,
    update: (id) => `/events/${id}`,
    delete: (id) => `/events/${id}`,
    updateTimeline: (id) => `/events/${id}/timeline`,
  },

  bookings: {
    create: '/bookings',
    myBookings: '/bookings/me',
    getById: (id) => `/bookings/${id}`,
    eventBookings: (eventId) => `/bookings/event/${eventId}`,
    cancel: (id) => `/bookings/${id}`,
  },

  bids: {
    create: '/bids',
    eventBids: (eventId) => `/bids/event/${eventId}`,
    myBids: '/bids/vendor/my-bids',
    getById: (id) => `/bids/${id}`,
    updateStatus: (id) => `/bids/${id}/status`,
  },

  admin: {
    pendingEvents: '/admin/events/pending',
    approveEvent: (id) => `/admin/events/${id}/approve`,
    users: '/admin/users',
    verifyVendor: (id) => `/admin/vendors/${id}/verify`,
    analytics: '/admin/analytics',
    userRequests: '/admin/user-requests',
    deleteUserRequest: (id) => `/admin/user-requests/${id}`,
  },

  userRequests: {
    list: '/user-requests',
    create: '/user-requests',
    getById: (id) => `/user-requests/${id}`,
    myRequests: '/user-requests/my-requests',
    cancel: (id) => `/user-requests/${id}`,
    complete: (id) => `/user-requests/${id}/complete`,
    proposals: (requestId) => `/user-requests/${requestId}/proposals`,
    submitProposal: '/user-requests/proposals/submit',
    acceptProposal: (proposalId) => `/user-requests/proposals/${proposalId}/accept`,
    rejectProposal: (proposalId) => `/user-requests/proposals/${proposalId}/reject`,
    deleteProposal: (proposalId) => `/user-requests/proposals/${proposalId}`,
    myProposals: '/user-requests/my-proposals',
  },

  notifications: {
    list: '/notifications',
    markRead: (id) => `/notifications/${id}/read`,
    markAllRead: '/notifications/read-all',
  },
};

export default endpoints;

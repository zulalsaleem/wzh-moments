import { Link } from 'react-router-dom';
import {
  Sparkles, ArrowRight, Zap, Shield, Users,
  Calendar, CheckCircle, Star, TrendingUp,
  Clock, MapPin, Play, ChevronRight, Briefcase,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PublicLayout from '../components/layout/PublicLayout';

// ── Hero ──────────────────────────────────────────────────────────────────────

function HeroSection({ isAuthenticated, user }) {
  const dashPath = (() => {
    switch (user?.role) {
      case 'admin':     return '/admin';
      case 'organizer': return '/organizer/dashboard';
      case 'vendor':    return '/vendor/dashboard';
      default:          return '/dashboard';
    }
  })();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-primary-950 to-secondary-950 min-h-screen flex items-center">
      {/* Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/5 rounded-full blur-3xl" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white/90 text-sm font-medium">Real-Time Event Tracking</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
              Events
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 via-secondary-300 to-primary-300 animate-gradient">
                Tracked Live
              </span>
            </h1>

            <p className="text-gray-300 text-xl mb-8 leading-relaxed max-w-lg">
              The only event platform that shows you what's happening
              <span className="text-white font-semibold"> in real-time</span>.
              No more guessing — see event progress live, like Uber but for events.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              {isAuthenticated ? (
                <Link
                  to={dashPath}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-400 hover:to-secondary-400 text-white font-semibold rounded-2xl shadow-2xl shadow-primary-500/30 transition-all hover:scale-105"
                >
                  <Sparkles className="h-5 w-5" />
                  Go to Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-400 hover:to-secondary-400 text-white font-semibold rounded-2xl shadow-2xl shadow-primary-500/30 transition-all hover:scale-105"
                  >
                    <Sparkles className="h-5 w-5" />
                    Get Started Free
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    to="/events"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold rounded-2xl backdrop-blur transition-all"
                  >
                    <Play className="h-5 w-5" />
                    Browse Events
                  </Link>
                </>
              )}
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-6">
              <div className="flex -space-x-2">
                {['W', 'Z', 'H', 'A', 'B'].map((letter, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full border-2 border-gray-800 bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center"
                  >
                    <span className="text-white text-xs font-bold">{letter}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5 mb-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-400 text-sm">Trusted by event organizers</p>
              </div>
            </div>
          </div>

          {/* Right: live demo card */}
          <div className="hidden lg:block">
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-white text-sm font-medium">Live Event Tracking</span>
                  </div>
                  <span className="text-white/60 text-xs">3 watching</span>
                </div>

                <h3 className="text-white font-bold text-lg mb-1">Tech Conference 2025</h3>
                <div className="flex items-center gap-4 text-white/60 text-sm mb-4">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Lahore, Pakistan</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> 342/500</span>
                </div>

                {/* Progress ring */}
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative w-20 h-20 shrink-0">
                    <svg viewBox="0 0 80 80" className="-rotate-90 w-20 h-20">
                      <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                      <circle
                        cx="40" cy="40" r="34"
                        stroke="url(#heroGrad)"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray="213.6"
                        strokeDashoffset="70.5"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#38bdf8" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-white font-bold text-lg leading-none">67%</span>
                      <span className="text-white/60 text-xs">Done</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-white/80 text-sm mb-2">4 of 6 tasks complete</p>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full w-2/3 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Timeline items */}
                {[
                  { task: 'Venue Setup',        done: true },
                  { task: 'Registration Desk',  done: true },
                  { task: 'Keynote Speech',      done: true },
                  { task: 'Workshop Sessions',   done: true },
                  { task: 'Networking Event',    done: false },
                  { task: 'Closing Ceremony',    done: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      item.done ? 'bg-green-500' : 'bg-white/10 border border-white/20'
                    }`}>
                      {item.done && <CheckCircle className="h-3 w-3 text-white" />}
                    </div>
                    <span className={`text-sm ${item.done ? 'text-white/50 line-through' : 'text-white/80'}`}>
                      {item.task}
                    </span>
                  </div>
                ))}
              </div>

              {/* Floating update toast */}
              <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-2xl p-4 border border-gray-100 w-52">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-600 font-semibold">Just Updated</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">Workshop Sessions</p>
                <p className="text-xs text-gray-500">marked complete ✅</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Zap,
    gradient: 'from-yellow-400 to-orange-400',
    bg: 'bg-yellow-50',
    title: 'Real-Time Tracking',
    description: 'Watch event progress update live without refreshing. Powered by Socket.IO WebSockets — like Uber, but for events.',
  },
  {
    icon: Users,
    gradient: 'from-blue-400 to-primary-400',
    bg: 'bg-blue-50',
    title: 'Vendor Marketplace',
    description: 'Post requirements, receive bids from verified vendors, and hire the best — all within the platform.',
  },
  {
    icon: Shield,
    gradient: 'from-purple-400 to-secondary-400',
    bg: 'bg-purple-50',
    title: 'Role-Based Access',
    description: 'Four distinct roles: Users, Organizers, Vendors, and Admins — each with their own dashboard and powers.',
  },
  {
    icon: TrendingUp,
    gradient: 'from-green-400 to-teal-400',
    bg: 'bg-green-50',
    title: 'Analytics Dashboard',
    description: 'Organizers and admins get detailed insights — bookings, revenue, attendees, and performance metrics.',
  },
  {
    icon: Calendar,
    gradient: 'from-red-400 to-pink-400',
    bg: 'bg-red-50',
    title: 'Smart Booking',
    description: 'Seamless event booking with automatic seat management, booking history, and easy cancellations.',
  },
  {
    icon: Clock,
    gradient: 'from-indigo-400 to-blue-400',
    bg: 'bg-indigo-50',
    title: 'Admin Approval',
    description: 'Events go through quality review before going live — ensuring a trustworthy platform for all users.',
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-semibold text-primary-600 bg-primary-50 px-4 py-2 rounded-full mb-4">
            Why WZH Moments?
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
            Everything You Need
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A complete event ecosystem — from creation to completion, with live tracking at its core.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="group p-8 rounded-3xl border border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-14 h-14 ${f.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <div className={`w-8 h-8 bg-gradient-to-br ${f.gradient} rounded-xl flex items-center justify-center`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-600 leading-relaxed">{f.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: '01',
    title: 'Create Your Event',
    description: 'Organizers create events with timeline tasks, requirements, and ticket settings. Events go for admin review.',
    gradient: 'from-primary-500 to-blue-500',
  },
  {
    number: '02',
    title: 'Admin Approves',
    description: 'Our admin team reviews and approves events to ensure quality. You get notified instantly via real-time updates.',
    gradient: 'from-secondary-500 to-purple-500',
  },
  {
    number: '03',
    title: 'Users Book Tickets',
    description: 'Event goes live. Users browse, discover, and book tickets. Seat counts update in real-time across all devices.',
    gradient: 'from-green-500 to-teal-500',
  },
  {
    number: '04',
    title: 'Track Live Progress',
    description: 'During the event, organizers update timeline tasks. Every attendee watching sees updates instantly — zero refresh needed.',
    gradient: 'from-orange-500 to-red-500',
  },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-semibold text-secondary-600 bg-secondary-50 px-4 py-2 rounded-full mb-4">
            Simple Process
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">How It Works</h2>
          <p className="text-xl text-gray-600 max-w-xl mx-auto">
            From event creation to live tracking in 4 simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <div key={i} className="relative group">
              {/* Connector */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[calc(100%-0.75rem)] w-[calc(100%-2rem)] h-0.5 bg-gradient-to-r from-gray-300 to-transparent z-0" />
              )}
              <div className="relative bg-white rounded-3xl p-6 border border-gray-200 hover:border-primary-200 hover:shadow-xl transition-all group-hover:-translate-y-1 duration-300">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} text-white font-black text-xl mb-4 shadow-lg`}>
                  {step.number}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Roles ─────────────────────────────────────────────────────────────────────

const ROLES = [
  {
    role: 'User',
    icon: Star,
    gradient: 'from-blue-400 to-primary-400',
    bg: 'from-blue-50 to-primary-50',
    border: 'border-blue-200',
    features: [
      'Browse & discover events',
      'Book tickets instantly',
      'Track event progress live',
      'Manage all bookings',
    ],
    cta: 'Attend Events',
  },
  {
    role: 'Organizer',
    icon: Calendar,
    gradient: 'from-purple-400 to-secondary-400',
    bg: 'from-purple-50 to-secondary-50',
    border: 'border-purple-200',
    features: [
      'Create events with timelines',
      'Update progress in real-time',
      'Post vendor requirements',
      'View analytics & bookings',
    ],
    cta: 'Create Events',
    highlighted: true,
  },
  {
    role: 'Vendor',
    icon: Briefcase,
    gradient: 'from-green-400 to-teal-400',
    bg: 'from-green-50 to-teal-50',
    border: 'border-green-200',
    features: [
      'Browse event requirements',
      'Submit competitive bids',
      'Track bid status live',
      'Build your reputation',
    ],
    cta: 'Start Bidding',
  },
];

function RolesSection() {
  return (
    <section id="about" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-semibold text-green-600 bg-green-50 px-4 py-2 rounded-full mb-4">
            Built for Everyone
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
            Your Role, Your Dashboard
          </h2>
          <p className="text-xl text-gray-600 max-w-xl mx-auto">
            Four specialized roles, each with a tailored experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {ROLES.map((r, i) => {
            const Icon = r.icon;
            return (
              <div
                key={i}
                className={[
                  'relative rounded-3xl p-8 border-2 bg-gradient-to-br transition-all duration-300',
                  r.border,
                  r.bg,
                  r.highlighted
                    ? 'scale-105 shadow-2xl'
                    : 'hover:shadow-xl hover:-translate-y-1',
                ].join(' ')}
              >
                {r.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-secondary-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${r.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-6">{r.role}</h3>
                <ul className="space-y-3 mb-8">
                  {r.features.map((feat, j) => (
                    <li key={j} className="flex items-center gap-3 text-gray-700">
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="text-sm">{feat}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={[
                    'w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-semibold text-sm transition-all',
                    r.highlighted
                      ? 'bg-gradient-to-r from-purple-500 to-secondary-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                      : 'bg-white text-gray-900 border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50',
                  ].join(' ')}
                >
                  {r.cta}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── CTA ───────────────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-br from-gray-900 to-primary-950 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-secondary-500/20 rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-4xl mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-6">
          <Zap className="h-4 w-4 text-yellow-400" />
          <span className="text-white/90 text-sm">Free to get started</span>
        </div>
        <h2 className="text-4xl sm:text-6xl font-black text-white mb-6 leading-tight">
          Ready to Track Your
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-secondary-300">
            Events Live?
          </span>
        </h2>
        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
          Join event organizers who use WZH Moments to deliver
          unforgettable, transparent event experiences.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold rounded-2xl shadow-2xl shadow-primary-500/30 hover:scale-105 transition-all text-lg"
          >
            <Sparkles className="h-5 w-5" />
            Get Started Free
          </Link>
          <Link
            to="/events"
            className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white/10 border border-white/30 text-white font-bold rounded-2xl hover:bg-white/20 transition-all text-lg"
          >
            <Calendar className="h-5 w-5" />
            Browse Events
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <PublicLayout>
      <HeroSection isAuthenticated={isAuthenticated} user={user} />
      <FeaturesSection />
      <HowItWorksSection />
      <RolesSection />
      <CTASection />
    </PublicLayout>
  );
}

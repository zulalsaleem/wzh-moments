import { Link } from 'react-router-dom';
import {
  UserPlus, Calendar, Search, CreditCard,
  Radio, CheckCircle, Star, MessageCircle,
  Bell, ShoppingBag, ArrowRight, Zap,
  Users, Building, Briefcase
} from 'lucide-react';
import PublicLayout from '../components/layout/PublicLayout';

const HowItWorksPage = () => {

  const roles = [
    {
      icon: Users,
      role: 'Event Attendee',
      color: 'from-blue-500 to-primary-500',
      bgColor: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-700',
      description: 'Discover, book, and track events in real-time',
      steps: [
        {
          icon: Search,
          title: 'Browse Events',
          desc: 'Explore events by city, category, or date. Filter by price, type, and availability.',
        },
        {
          icon: CreditCard,
          title: 'Book Tickets',
          desc: 'Secure your spot instantly. Pay safely with Stripe. Get email confirmation.',
        },
        {
          icon: Radio,
          title: 'Track Live',
          desc: 'Watch event progress update in real-time. See every task as it completes.',
        },
        {
          icon: Star,
          title: 'Rate & Review',
          desc: 'Share your experience. Rate vendors to help the community.',
        },
      ],
    },
    {
      icon: Building,
      role: 'Event Organizer',
      color: 'from-purple-500 to-secondary-500',
      bgColor: 'bg-purple-50 border-purple-200',
      textColor: 'text-purple-700',
      description: 'Create, manage, and track your events professionally',
      steps: [
        {
          icon: Calendar,
          title: 'Create Event',
          desc: 'Set up your event with title, date, location, capacity, and custom timeline tasks.',
        },
        {
          icon: CheckCircle,
          title: 'Get Approved',
          desc: 'Admin reviews and approves your event. You get notified instantly.',
        },
        {
          icon: Zap,
          title: 'Update Progress',
          desc: 'Mark tasks complete during the event. All attendees see updates in real-time.',
        },
        {
          icon: MessageCircle,
          title: 'Chat & Manage',
          desc: 'Chat with attendees, manage bookings, view analytics, hire vendors.',
        },
      ],
    },
    {
      icon: Briefcase,
      role: 'Service Vendor',
      color: 'from-green-500 to-teal-500',
      bgColor: 'bg-green-50 border-green-200',
      textColor: 'text-green-700',
      description: 'Grow your business by providing event services',
      steps: [
        {
          icon: UserPlus,
          title: 'Register & Verify',
          desc: 'Create your vendor account. Admin verifies your profile to ensure quality.',
        },
        {
          icon: ShoppingBag,
          title: 'Browse Opportunities',
          desc: 'See event requirements and user service requests. Find the right jobs.',
        },
        {
          icon: Star,
          title: 'Submit Proposals',
          desc: 'Send competitive bids with your price, timeline, and portfolio samples.',
        },
        {
          icon: CheckCircle,
          title: 'Win & Deliver',
          desc: 'Get hired, deliver excellent service, earn reviews, build your reputation.',
        },
      ],
    },
  ];

  const features = [
    {
      icon: '⚡',
      title: 'Real-Time Updates',
      desc: 'Socket.IO WebSockets deliver updates in under 2 seconds. No refresh. No waiting.',
      tech: 'Socket.IO',
    },
    {
      icon: '🔐',
      title: 'Secure Authentication',
      desc: 'JWT tokens + bcrypt hashing. Role-based access control for all 4 user types.',
      tech: 'JWT + bcrypt',
    },
    {
      icon: '💳',
      title: 'Payment Processing',
      desc: 'Stripe integration for secure ticket purchases. Test mode for demo purposes.',
      tech: 'Stripe API',
    },
    {
      icon: '📧',
      title: 'Email Notifications',
      desc: 'Automated HTML emails for bookings, approvals, proposals, and verifications.',
      tech: 'NodeMailer',
    },
    {
      icon: '🖼️',
      title: 'Image Storage',
      desc: 'Event covers, profile pictures, vendor portfolios stored on Cloudinary CDN.',
      tech: 'Cloudinary',
    },
    {
      icon: '🐳',
      title: 'Docker + CI/CD',
      desc: 'Containerized deployment with GitHub Actions. Push code → auto deploy in 5 mins.',
      tech: 'Docker + GitHub Actions',
    },
  ];

  const faqs = [
    {
      q: 'Is WZH Moments free to use?',
      a: 'Yes! Creating an account and browsing events is completely free. Paid events require ticket purchase.',
    },
    {
      q: 'How does real-time tracking work?',
      a: 'We use Socket.IO WebSockets - a permanent connection between your browser and our server. When organizer updates, your page updates instantly without any refresh.',
    },
    {
      q: 'How do vendors get verified?',
      a: 'After registration, vendors are reviewed by our admin team. Once verified, they can submit proposals and bids on service requests.',
    },
    {
      q: 'Can I use this for any type of event?',
      a: 'Absolutely! WZH Moments supports weddings, corporate events, conferences, birthdays, concerts, seminars, and any type of gathering.',
    },
    {
      q: 'What payment methods are supported?',
      a: 'We currently support card payments via Stripe. JazzCash and EasyPaisa integration is planned for future versions.',
    },
    {
      q: 'Is my data safe?',
      a: 'Yes. We use HTTPS encryption, JWT authentication, bcrypt password hashing, and MongoDB Atlas cloud storage with automatic backups.',
    },
  ];

  return (
    <PublicLayout>
      <div className="min-h-screen bg-white">

        {/* ── HERO ── */}
        <section className="relative overflow-hidden
          bg-gradient-to-br from-gray-900 via-primary-950
          to-secondary-950 py-24 px-4">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2
              w-[600px] h-[600px] bg-primary-500/10
              rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2
              bg-white/10 backdrop-blur-sm border border-white/20
              rounded-full px-4 py-2 mb-6">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-white/80 text-sm">
                Simple · Powerful · Real-Time
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-black
              text-white mb-6 leading-tight">
              How{' '}
              <span className="bg-gradient-to-r from-primary-400
                to-secondary-400 bg-clip-text text-transparent">
                WZH Moments
              </span>
              {' '}Works
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              From creating an account to running live events —
              everything you need to know in one place.
            </p>
          </div>
        </section>

        {/* ── 4 ROLES OVERVIEW ── */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-5xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-3">
              4 Roles. One Platform.
            </h2>
            <p className="text-gray-500">
              Everyone has a dedicated experience tailored to their needs
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid
            sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: '🎫',
                role: 'User',
                desc: 'Browse, book, and track events in real-time',
                color: 'border-blue-200 bg-blue-50',
              },
              {
                icon: '📅',
                role: 'Organizer',
                desc: 'Create events and update progress live',
                color: 'border-purple-200 bg-purple-50',
              },
              {
                icon: '💼',
                role: 'Vendor',
                desc: 'Bid on events and grow your business',
                color: 'border-green-200 bg-green-50',
              },
              {
                icon: '🔐',
                role: 'Admin',
                desc: 'Approve events and manage the platform',
                color: 'border-orange-200 bg-orange-50',
              },
            ].map((r, i) => (
              <div key={i}
                className={`border-2 ${r.color} rounded-2xl p-5 text-center`}>
                <span className="text-4xl block mb-3">{r.icon}</span>
                <h3 className="font-black text-gray-900 text-lg">
                  {r.role}
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  {r.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── STEP BY STEP FOR EACH ROLE ── */}
        {roles.map((roleData, roleIndex) => (
          <section key={roleIndex}
            className={`py-20 px-4 ${roleIndex % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}>
            <div className="max-w-5xl mx-auto">

              <div className="text-center mb-12">
                <div className={`inline-flex items-center gap-3
                  ${roleData.bgColor} border rounded-2xl px-6 py-3 mb-4`}>
                  <div className={`w-10 h-10 rounded-xl
                    bg-gradient-to-br ${roleData.color}
                    flex items-center justify-center`}>
                    <roleData.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className={`font-bold ${roleData.textColor}`}>
                    {roleData.role}
                  </span>
                </div>
                <h2 className="text-3xl font-black text-gray-900">
                  {roleData.description}
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {roleData.steps.map((step, stepIndex) => (
                  <div key={stepIndex} className="relative">
                    {stepIndex < roleData.steps.length - 1 && (
                      <div className="hidden lg:block absolute
                        top-8 left-full w-full h-0.5
                        bg-gradient-to-r from-gray-200
                        to-transparent z-0" />
                    )}

                    <div className="relative z-10 text-center
                      p-5 bg-white rounded-2xl border
                      border-gray-100 shadow-sm
                      hover:shadow-md transition-shadow">
                      <div className="w-8 h-8 rounded-full
                        bg-gradient-to-br from-gray-100
                        to-gray-200 flex items-center
                        justify-center mx-auto mb-3">
                        <span className="text-sm font-black text-gray-600">
                          {stepIndex + 1}
                        </span>
                      </div>

                      <div className={`w-12 h-12 rounded-2xl
                        bg-gradient-to-br ${roleData.color}
                        flex items-center justify-center
                        mx-auto mb-3`}>
                        <step.icon className="h-6 w-6 text-white" />
                      </div>

                      <h3 className="font-bold text-gray-900 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-gray-500 text-sm leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* ── REAL-TIME DEMO ── */}
        <section className="py-20 px-4 bg-gradient-to-br
          from-gray-900 to-gray-800">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-white mb-3">
                The Magic of Real-Time
              </h2>
              <p className="text-gray-400">
                See how Socket.IO makes it all happen instantly
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-4 items-center">
              <div className="bg-white/5 border border-white/10
                rounded-2xl p-5">
                <p className="text-primary-400 font-semibold
                  text-xs uppercase tracking-wider mb-3">
                  Organizer Dashboard
                </p>
                <div className="space-y-2">
                  {['Venue Setup', 'Registration', 'Keynote'].map(
                    (task, i) => (
                    <div key={i}
                      className="flex items-center gap-2
                        bg-white/5 rounded-xl px-3 py-2">
                      <div className="w-4 h-4 rounded-full
                        bg-primary-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-white text-sm">{task}</span>
                      <span className="ml-auto text-xs text-green-400">
                        Done
                      </span>
                    </div>
                  ))}
                </div>
                <button className="mt-3 w-full py-2 bg-primary-500
                  text-white text-xs font-bold rounded-xl">
                  ✓ Mark Next Task Done
                </button>
              </div>

              <div className="text-center">
                <div className="bg-yellow-500/20 border
                  border-yellow-500/30 rounded-2xl p-4 mb-3">
                  <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-yellow-400 font-bold text-sm">
                    Socket.IO
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Broadcasts instantly
                  </p>
                  <p className="text-yellow-300 font-black text-2xl mt-2">
                    &lt;2s
                  </p>
                </div>
                <ArrowRight className="h-6 w-6 text-gray-500
                  mx-auto rotate-90 lg:rotate-0" />
              </div>

              <div className="bg-white/5 border border-white/10
                rounded-2xl p-5">
                <p className="text-secondary-400 font-semibold
                  text-xs uppercase tracking-wider mb-3">
                  Attendee View (Updates Live!)
                </p>
                <div className="mb-3">
                  <div className="flex justify-between text-xs
                    text-gray-400 mb-1">
                    <span>Progress</span>
                    <span className="text-white font-bold">75%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full">
                    <div className="h-full w-3/4 bg-gradient-to-r
                      from-primary-500 to-secondary-500 rounded-full" />
                  </div>
                </div>
                <div className="bg-green-500/20 border
                  border-green-500/30 rounded-xl px-3 py-2">
                  <p className="text-green-400 text-xs font-bold">
                    🔴 Just Updated!
                  </p>
                  <p className="text-white text-sm">
                    Keynote Speech marked complete
                  </p>
                </div>
                <p className="text-gray-500 text-xs mt-3 text-center">
                  No page refresh needed!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="py-20 px-4 max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center
            text-gray-900 mb-3">
            Powered By Modern Technology
          </h2>
          <p className="text-gray-500 text-center mb-10">
            Every feature built with industry-standard tools
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i}
                className="p-6 border border-gray-100
                  rounded-2xl hover:shadow-md
                  hover:border-primary-200 transition-all">
                <span className="text-3xl block mb-3">{f.icon}</span>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-gray-900">{f.title}</h3>
                  <span className="text-xs bg-primary-50
                    text-primary-600 px-2 py-0.5 rounded-full font-medium">
                    {f.tech}
                  </span>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-black text-center
              text-gray-900 mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-500 text-center mb-10">
              Everything you need to know
            </p>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i}
                  className="bg-white rounded-2xl p-6 border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-2
                    flex items-start gap-2">
                    <span className="text-primary-500 flex-shrink-0">Q.</span>
                    {faq.q}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed pl-5">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-gray-500 text-lg mb-8">
              Join WZH Moments today. Browse events for free,
              no account needed.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                to="/events"
                className="px-8 py-4 bg-gradient-to-r
                  from-primary-500 to-secondary-500 text-white
                  font-bold rounded-2xl hover:opacity-90
                  transition-opacity shadow-lg"
              >
                Browse Events Free →
              </Link>
              <Link
                to="/register"
                className="px-8 py-4 border-2
                  border-primary-500 text-primary-600
                  font-bold rounded-2xl hover:bg-primary-50
                  transition-colors"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </section>

      </div>
    </PublicLayout>
  );
};

export default HowItWorksPage;

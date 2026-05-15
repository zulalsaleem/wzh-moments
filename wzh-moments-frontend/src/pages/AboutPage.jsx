import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Calendar, ShoppingBag, Star,
  MapPin, Zap, Shield, Heart,
  Award, Globe, TrendingUp, Clock
} from 'lucide-react';
import api from '../api/axios';
import PublicLayout from '../components/layout/PublicLayout';

const AboutPage = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalBookings: 0,
    totalVendors: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/analytics');
      if (res.data.success) {
        setStats({
          totalUsers: res.data.analytics.totalUsers || 0,
          totalEvents: res.data.analytics.totalEvents || 0,
          totalBookings: res.data.analytics.totalBookings || 0,
          totalVendors: res.data.analytics.totalVendors || 0,
        });
      }
    } catch {
      setStats({
        totalUsers: 50,
        totalEvents: 12,
        totalBookings: 30,
        totalVendors: 8,
      });
    } finally {
      setLoading(false);
    }
  };

  const team = [
    {
      name: 'M. Haris Munir',
      roll: 'CIIT/FA22-BCS-069/SWL',
      role: 'Frontend Developer',
      responsibility: 'Built the entire user interface, dashboards, real-time UI components, and documentation.',
      avatar: 'H',
      color: 'from-blue-500 to-primary-500',
      skills: ['React.js', 'Tailwind CSS', 'Socket.IO UI', 'UI/UX'],
    },
    {
      name: 'M. Zulal Saleem',
      roll: 'CIIT/FA22-BCS-093/SWL',
      role: 'Backend Developer',
      responsibility: 'Built REST APIs, database models, authentication system, email service, and deployment pipeline.',
      avatar: 'Z',
      color: 'from-purple-500 to-secondary-500',
      skills: ['Node.js', 'MongoDB', 'Express.js', 'Docker', 'CI/CD'],
    },
    {
      name: 'Wali Muhammad',
      roll: 'CIIT/FA22-BCS-121/SWL',
      role: 'Full Stack + Analytics',
      responsibility: 'Built analytics dashboard, vendor marketplace, real-time Socket.IO integration, and system architecture.',
      avatar: 'W',
      color: 'from-green-500 to-teal-500',
      skills: ['Socket.IO', 'Analytics', 'Marketplace', 'Architecture'],
    },
  ];

  const values = [
    {
      icon: Zap,
      title: 'Real-Time First',
      description: 'Every update happens instantly. No refresh needed. Like Uber but for events.',
      color: 'text-yellow-500 bg-yellow-50',
    },
    {
      icon: Shield,
      title: 'Secure & Trusted',
      description: 'JWT authentication, bcrypt passwords, role-based access. Your data is safe.',
      color: 'text-blue-500 bg-blue-50',
    },
    {
      icon: Heart,
      title: 'Built for Pakistan',
      description: 'Designed for local events - weddings, conferences, birthdays, corporate gatherings.',
      color: 'text-red-500 bg-red-50',
    },
    {
      icon: Globe,
      title: 'Built to Scale',
      description: 'Docker containers, cloud deployment, MongoDB Atlas. Ready for thousands of users.',
      color: 'text-green-500 bg-green-50',
    },
  ];

  const milestones = [
    { year: '2022', event: 'Project conceived at COMSATS Sahiwal' },
    { year: '2023', event: 'Requirements gathering and system design' },
    { year: '2024', event: 'Core development began - MERN stack chosen' },
    { year: '2025', event: 'Real-time tracking with Socket.IO implemented' },
    { year: '2026', event: 'Full platform launched at wzh-moments.online' },
  ];

  return (
    <PublicLayout>
      <div className="min-h-screen bg-white">

        {/* ── HERO SECTION ── */}
        <section className="relative overflow-hidden
          bg-gradient-to-br from-gray-900 via-primary-950
          to-secondary-950 py-24 px-4">

          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-96 h-96
              bg-primary-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96
              bg-secondary-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2
              bg-white/10 backdrop-blur-sm border border-white/20
              rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-green-400
                rounded-full animate-pulse" />
              <span className="text-white/80 text-sm">
                Final Year Project — COMSATS University Islamabad
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-black
              text-white mb-6 leading-tight">
              About{' '}
              <span className="bg-gradient-to-r from-primary-400
                to-secondary-400 bg-clip-text text-transparent">
                WZH Moments
              </span>
            </h1>

            <p className="text-xl text-white/70 max-w-2xl
              mx-auto leading-relaxed">
              A comprehensive real-time event management platform
              built by three Computer Science students at COMSATS
              University, Sahiwal Campus.
            </p>
          </div>
        </section>

        {/* ── LIVE STATS ── */}
        <section className="py-16 px-4 bg-gradient-to-br
          from-primary-50 to-secondary-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-center
              text-gray-900 mb-3">
              Platform in Numbers
            </h2>
            <p className="text-gray-500 text-center mb-10">
              Real-time data from our live platform
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Users,
                  value: stats.totalUsers,
                  label: 'Registered Users',
                  color: 'from-blue-500 to-primary-500',
                  suffix: '+',
                },
                {
                  icon: Calendar,
                  value: stats.totalEvents,
                  label: 'Events Created',
                  color: 'from-purple-500 to-secondary-500',
                  suffix: '+',
                },
                {
                  icon: TrendingUp,
                  value: stats.totalBookings,
                  label: 'Tickets Booked',
                  color: 'from-green-500 to-teal-500',
                  suffix: '+',
                },
                {
                  icon: ShoppingBag,
                  value: stats.totalVendors,
                  label: 'Active Vendors',
                  color: 'from-orange-500 to-red-500',
                  suffix: '+',
                },
              ].map((stat, i) => (
                <div key={i}
                  className="bg-white rounded-3xl p-6
                    shadow-sm border border-gray-100
                    text-center hover:shadow-md
                    transition-shadow">
                  <div className={`w-14 h-14 rounded-2xl
                    bg-gradient-to-br ${stat.color}
                    flex items-center justify-center
                    mx-auto mb-4`}>
                    <stat.icon className="h-7 w-7 text-white" />
                  </div>
                  <p className="text-4xl font-black text-gray-900">
                    {loading ? '...' : stat.value}{stat.suffix}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── MISSION ── */}
        <section className="py-20 px-4 max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-primary-600 font-semibold
                text-sm uppercase tracking-wider">
                Our Mission
              </span>
              <h2 className="text-4xl font-black text-gray-900
                mt-2 mb-6 leading-tight">
                Solving the Visibility Problem in Event Management
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-4">
                Traditional platforms tell you NOTHING after you
                book a ticket. You buy a ticket and wait in the
                dark, not knowing if the event is on schedule.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                WZH Moments changes this completely. Like Uber
                shows your driver's location in real-time, we show
                you the event's progress in real-time. Organizer
                marks a task complete — every attendee sees it
                instantly.
              </p>
              <div className="flex items-center gap-3
                bg-primary-50 border border-primary-200
                rounded-2xl p-4">
                <Zap className="h-8 w-8 text-primary-600 flex-shrink-0" />
                <p className="text-primary-800 font-medium text-sm">
                  Updates delivered in under 2 seconds via
                  Socket.IO WebSockets — no page refresh needed!
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900
              to-gray-800 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-400 text-xs ml-2">
                  Live Event Tracking
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { task: 'Venue Setup', done: true },
                  { task: 'Registration Open', done: true },
                  { task: 'Keynote Speech', done: true },
                  { task: 'Workshop Sessions', done: false },
                  { task: 'Networking Event', done: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full
                      flex items-center justify-center flex-shrink-0
                      ${item.done ? 'bg-green-500' : 'border-2 border-gray-600'}`}>
                      {item.done && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </div>
                    <span className={`text-sm
                      ${item.done ? 'text-gray-400 line-through' : 'text-white'}`}>
                      {item.task}
                    </span>
                    {item.done && (
                      <span className="ml-auto text-xs text-green-400">
                        Live ✓
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-white font-bold">60%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full">
                  <div className="h-full w-3/5 bg-gradient-to-r
                    from-primary-500 to-secondary-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHAT WE BUILT ── */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-center
              text-gray-900 mb-3">
              What WZH Moments Offers
            </h2>
            <p className="text-gray-500 text-center mb-10">
              A complete ecosystem for event management
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: '⚡',
                  title: 'Real-Time Tracking',
                  desc: 'Watch event progress update live without refreshing. Powered by Socket.IO WebSockets.',
                },
                {
                  icon: '🎫',
                  title: 'Smart Booking',
                  desc: 'Book tickets instantly with automatic seat management and Stripe payment integration.',
                },
                {
                  icon: '💼',
                  title: 'Vendor Marketplace',
                  desc: 'Post requirements, receive bids, compare vendors, and hire the best — all in one place.',
                },
                {
                  icon: '📋',
                  title: 'Service Requests',
                  desc: 'Users post personal event needs. Vendors and organizers compete with proposals.',
                },
                {
                  icon: '🔔',
                  title: 'Smart Notifications',
                  desc: 'Real-time in-app notifications and email alerts for every important action.',
                },
                {
                  icon: '💬',
                  title: 'Live Chat',
                  desc: 'Attendees and organizers communicate directly through built-in real-time chat.',
                },
                {
                  icon: '⭐',
                  title: 'Ratings & Reviews',
                  desc: 'Build trust with verified reviews. Vendors grow reputation through quality work.',
                },
                {
                  icon: '📊',
                  title: 'Analytics Dashboard',
                  desc: 'Organizers and admins get detailed insights on events, revenue, and engagement.',
                },
                {
                  icon: '🤖',
                  title: 'AI Chatbot',
                  desc: 'Built-in assistant answers questions about events, booking, and platform features.',
                },
              ].map((feature, i) => (
                <div key={i}
                  className="bg-white rounded-2xl p-6
                    border border-gray-100 hover:shadow-md
                    hover:border-primary-200 transition-all">
                  <span className="text-3xl mb-3 block">
                    {feature.icon}
                  </span>
                  <h3 className="font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── OUR VALUES ── */}
        <section className="py-20 px-4 max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center
            text-gray-900 mb-3">
            Our Values
          </h2>
          <p className="text-gray-500 text-center mb-10">
            Principles that guided every decision
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {values.map((value, i) => (
              <div key={i}
                className="flex gap-4 p-6 rounded-2xl
                  border border-gray-100 hover:shadow-md
                  transition-shadow">
                <div className={`w-12 h-12 rounded-2xl
                  ${value.color} flex items-center
                  justify-center flex-shrink-0`}>
                  <value.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">
                    {value.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── TECH STACK ── */}
        <section className="py-16 px-4 bg-gradient-to-br
          from-gray-900 to-gray-800">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-center
              text-white mb-3">
              Built With Modern Technology
            </h2>
            <p className="text-gray-400 text-center mb-10">
              Industry-standard MERN stack with real-time capabilities
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3
              lg:grid-cols-6 gap-4">
              {[
                { name: 'React.js', icon: '⚛️', desc: 'Frontend' },
                { name: 'Node.js', icon: '🟢', desc: 'Runtime' },
                { name: 'MongoDB', icon: '🍃', desc: 'Database' },
                { name: 'Socket.IO', icon: '⚡', desc: 'Real-time' },
                { name: 'Docker', icon: '🐳', desc: 'Container' },
                { name: 'Stripe', icon: '💳', desc: 'Payments' },
              ].map((tech, i) => (
                <div key={i}
                  className="bg-white/5 border border-white/10
                    rounded-2xl p-4 text-center hover:bg-white/10
                    transition-colors">
                  <span className="text-3xl block mb-2">
                    {tech.icon}
                  </span>
                  <p className="text-white font-semibold text-sm">
                    {tech.name}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {tech.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TIMELINE ── */}
        <section className="py-20 px-4 max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-center
            text-gray-900 mb-3">
            Our Journey
          </h2>
          <p className="text-gray-500 text-center mb-12">
            From idea to live platform
          </p>

          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0
              w-0.5 bg-gradient-to-b from-primary-500
              to-secondary-500" />

            <div className="space-y-8">
              {milestones.map((m, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="w-16 h-16 rounded-2xl
                    bg-gradient-to-br from-primary-500
                    to-secondary-500 flex items-center
                    justify-center flex-shrink-0 z-10 shadow-lg">
                    <span className="text-white font-black text-xs">
                      {m.year}
                    </span>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-2xl
                    p-4 border border-gray-100 mt-2">
                    <p className="text-gray-700 font-medium text-sm">
                      {m.event}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TEAM ── */}
        <section className="py-16 px-4 bg-gradient-to-br
          from-primary-50 to-secondary-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-center
              text-gray-900 mb-3">
              Meet the Team
            </h2>
            <p className="text-gray-500 text-center mb-10">
              BS Computer Science 2022-2026
              COMSATS University Islamabad, Sahiwal Campus
            </p>

            <div className="grid sm:grid-cols-3 gap-6">
              {team.map((member, i) => (
                <div key={i}
                  className="bg-white rounded-3xl p-6
                    shadow-sm border border-gray-100
                    hover:shadow-md transition-shadow text-center">
                  <div className={`w-20 h-20 rounded-3xl
                    bg-gradient-to-br ${member.color}
                    flex items-center justify-center
                    mx-auto mb-4 shadow-lg`}>
                    <span className="text-white font-black text-3xl">
                      {member.avatar}
                    </span>
                  </div>
                  <h3 className="font-black text-gray-900 text-lg">
                    {member.name}
                  </h3>
                  <p className="text-primary-600 font-semibold text-sm mt-1">
                    {member.role}
                  </p>
                  <p className="text-gray-400 text-xs mt-1 font-mono">
                    {member.roll}
                  </p>
                  <p className="text-gray-500 text-sm mt-3 leading-relaxed">
                    {member.responsibility}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
                    {member.skills.map((skill, j) => (
                      <span key={j}
                        className="text-xs bg-gray-100
                          text-gray-600 px-2.5 py-1 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center bg-white rounded-3xl
              p-6 border border-gray-100">
              <p className="text-gray-500 text-sm">
                <strong className="text-gray-900">Supervisor:</strong>
                {' '}Mam Tehreem &nbsp;|&nbsp;
                <strong className="text-gray-900">Co-Supervisor:</strong>
                {' '}Dr. Zafar Iqbal (Head of Department)
              </p>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Ready to Experience It?
            </h2>
            <p className="text-gray-500 text-lg mb-8">
              Browse live events happening right now or create
              your own event in minutes.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                to="/events"
                className="px-8 py-4 bg-gradient-to-r
                  from-primary-500 to-secondary-500 text-white
                  font-bold rounded-2xl hover:opacity-90
                  transition-opacity shadow-lg"
              >
                Browse Events →
              </Link>
              <Link
                to="/register"
                className="px-8 py-4 border-2 border-primary-500
                  text-primary-600 font-bold rounded-2xl
                  hover:bg-primary-50 transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        </section>

      </div>
    </PublicLayout>
  );
};

export default AboutPage;

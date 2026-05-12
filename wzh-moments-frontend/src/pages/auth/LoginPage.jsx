import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import {
  Mail, Lock, LogIn, Sparkles,
  Zap, Shield, Users, Calendar,
  ChevronRight, Star,
} from 'lucide-react';

const features = [
  {
    icon: Zap,
    color: 'from-yellow-400 to-orange-400',
    title: 'Real-Time Tracking',
    desc: 'Watch events update live',
  },
  {
    icon: Users,
    color: 'from-blue-400 to-primary-400',
    title: 'Vendor Marketplace',
    desc: 'Find services instantly',
  },
  {
    icon: Shield,
    color: 'from-purple-400 to-secondary-400',
    title: 'Secure Platform',
    desc: 'JWT protected access',
  },
  {
    icon: Calendar,
    color: 'from-green-400 to-teal-400',
    title: 'Smart Booking',
    desc: 'Book with one click',
  },
];

const testimonials = [
  {
    name: 'Sarah K.',
    role: 'Event Organizer',
    text: 'Real-time tracking changed how I manage events!',
    avatar: 'S',
    color: 'from-pink-400 to-rose-400',
  },
  {
    name: 'Ahmed R.',
    role: 'Verified Vendor',
    text: 'Got 3 new clients in my first week!',
    avatar: 'A',
    color: 'from-blue-400 to-primary-400',
  },
  {
    name: 'Zara M.',
    role: 'Event Attendee',
    text: 'Love watching progress updates live!',
    avatar: 'Z',
    color: 'from-purple-400 to-secondary-400',
  },
];

const roleCards = [
  { role: 'User',      desc: 'Book & track events',     color: 'from-blue-500 to-primary-500',     icon: '🎫' },
  { role: 'Organizer', desc: 'Create & manage events',  color: 'from-purple-500 to-secondary-500', icon: '📅' },
  { role: 'Vendor',    desc: 'Offer your services',     color: 'from-green-500 to-teal-500',       icon: '💼' },
  { role: 'Admin',     desc: 'Platform management',     color: 'from-red-500 to-rose-500',         icon: '🔐' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setActiveTestimonial(prev => (prev + 1) % testimonials.length),
      3000
    );
    return () => clearInterval(id);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!formData.email) {
      next.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      next.email = 'Email is invalid';
    }
    if (!formData.password) {
      next.password = 'Password is required';
    } else if (formData.password.length < 6) {
      next.password = 'Password must be at least 6 characters';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await login(formData);
    setLoading(false);
  };

  const t = testimonials[activeTestimonial];

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL (lg+ only) ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden
        bg-gradient-to-br from-gray-900 via-primary-950 to-secondary-950
        flex-col items-center justify-center p-12">

        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-80 h-80
            bg-primary-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80
            bg-secondary-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2
            -translate-y-1/2 w-96 h-96 bg-primary-600/5 rounded-full blur-3xl" />
        </div>

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), ' +
              'linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 w-full max-w-md">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500
              to-secondary-500 rounded-2xl flex items-center justify-center
              shadow-2xl shadow-primary-500/30">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-black text-white text-2xl leading-none">WZH Moments</p>
              <p className="text-primary-300 text-xs mt-0.5">Event Management Platform</p>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-black text-white mb-3 leading-tight">
            Welcome Back!
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r
              from-primary-300 to-secondary-300">
              Ready to track?
            </span>
          </h1>
          <p className="text-gray-400 mb-10 leading-relaxed">
            The only event platform where you watch progress happen in
            real-time, like magic.
          </p>

          {/* Feature cards grid */}
          <div className="grid grid-cols-2 gap-3 mb-10">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="bg-white/5 backdrop-blur border border-white/10
                    rounded-2xl p-4 hover:bg-white/10 transition-all duration-300
                    hover:-translate-y-0.5 group"
                >
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${f.color}
                    flex items-center justify-center mb-3
                    group-hover:scale-110 transition-transform`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-white font-semibold text-sm leading-none mb-1">
                    {f.title}
                  </p>
                  <p className="text-gray-500 text-xs">{f.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Auto-rotating testimonial */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex-shrink-0
                bg-gradient-to-br ${t.color}
                flex items-center justify-center`}>
                <span className="text-white font-bold text-sm">{t.avatar}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-2 italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                <p className="text-white font-semibold text-sm leading-none">{t.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{t.role}</p>
              </div>
            </div>

            {/* Indicator dots */}
            <div className="flex gap-1.5 mt-4 justify-center">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`rounded-full transition-all duration-300
                    ${i === activeTestimonial
                      ? 'w-6 h-2 bg-primary-400'
                      : 'w-2 h-2 bg-white/20 hover:bg-white/40'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (login form) ──────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center
        bg-gray-50 px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500
              to-secondary-500 rounded-xl flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-black text-gray-900 text-xl">WZH Moments</span>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50
            p-8 border border-gray-100">

            <div className="mb-8">
              <h2 className="text-3xl font-black text-gray-900 mb-1">Sign In</h2>
              <p className="text-gray-500">Welcome back! Enter your credentials below.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-1">
              <Input
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                icon={Mail}
                placeholder="you@example.com"
                autoComplete="email"
              />

              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                icon={Lock}
                placeholder="••••••••"
                autoComplete="current-password"
              />

              <div className="flex items-center justify-between pt-1 pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-primary-600 border-gray-300"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                loading={loading}
                icon={LogIn}
                fullWidth
                size="lg"
                className="!rounded-2xl !bg-gradient-to-r !from-primary-500
                  !to-secondary-500 hover:!from-primary-600
                  hover:!to-secondary-600 !shadow-lg !shadow-primary-500/20"
              >
                Sign In
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-gray-400">
                  New to WZH Moments?
                </span>
              </div>
            </div>

            {/* Register link */}
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 w-full py-3.5
                border-2 border-gray-200 rounded-2xl text-gray-700 font-semibold
                text-sm hover:border-primary-300 hover:bg-primary-50
                hover:text-primary-700 transition-all group"
            >
              Create a free account
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Role info cards */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {roleCards.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-3 border border-gray-100
                  shadow-sm hover:shadow-md transition-shadow flex items-center gap-3"
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.color}
                  flex items-center justify-center text-base flex-shrink-0`}>
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm leading-none">
                    {item.role}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5 truncate">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Final Year Project · WZH Moments © 2025
          </p>
        </div>
      </div>
    </div>
  );
}

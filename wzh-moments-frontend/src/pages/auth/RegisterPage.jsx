import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, Briefcase } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const ROLES = [
  { value: 'user', label: 'Attend Events', icon: User },
  { value: 'organizer', label: 'Organize Events', icon: Briefcase },
  { value: 'vendor', label: 'Provide Services', icon: UserPlus },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!formData.name || formData.name.length < 2)
      next.name = 'Name must be at least 2 characters';
    if (!formData.email)
      next.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      next.email = 'Email is invalid';
    if (!formData.password)
      next.password = 'Password is required';
    else if (formData.password.length < 6)
      next.password = 'Password must be at least 6 characters';
    else if (!/(?=.*[0-9])/.test(formData.password))
      next.password = 'Password must contain at least one number';
    if (formData.password !== formData.confirmPassword)
      next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { confirmPassword, ...registerData } = formData;
    await register(registerData);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-500 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">WZH Moments</h1>
          <p className="text-primary-100">Create Your Account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Get Started
          </h2>

          <form onSubmit={handleSubmit}>
            <Input
              label="Full Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              icon={User}
              placeholder="John Doe"
              autoComplete="name"
            />

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
              placeholder="Min 6 chars with a number"
              autoComplete="new-password"
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              icon={Lock}
              placeholder="••••••••"
              autoComplete="new-password"
            />

            {/* Role selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I want to
              </label>
              <div className="grid grid-cols-3 gap-3">
                {ROLES.map(({ value, label, icon: RoleIcon }) => (
                  <label
                    key={value}
                    className={[
                      'cursor-pointer rounded-xl transition-all',
                      formData.role === value
                        ? 'ring-2 ring-primary-600 ring-offset-1'
                        : '',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={value}
                      checked={formData.role === value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div
                      className={[
                        'p-4 border-2 rounded-xl text-center hover:border-primary-300 transition-colors',
                        formData.role === value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200',
                      ].join(' ')}
                    >
                      <RoleIcon
                        className={`h-6 w-6 mx-auto mb-2 ${
                          formData.role === value ? 'text-primary-600' : 'text-gray-400'
                        }`}
                      />
                      <p className="text-xs font-medium text-gray-700">{label}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              icon={UserPlus}
              fullWidth
              size="lg"
            >
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { Mail, Lock, User, UserPlus, Package, Shield, Users } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER'); // Default is USER
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Registering account...');

    try {
      const userData = await register(name, email, password, role);
      toast.success(`Account created! Welcome, ${userData.name}!`, { id: toastId });
      
      if (userData.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl animate-pulse-slow"></div>

      <div className="w-full max-w-md glass-card p-8 relative overflow-hidden">
        {/* Border glow */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent"></div>

        <div className="flex flex-col items-center mb-6">
          <div className="bg-gradient-to-tr from-violet-600 to-fuchsia-600 p-3 rounded-2xl shadow-xl shadow-violet-500/20 mb-4">
            <Package className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-white via-violet-200 to-fuchsia-300 bg-clip-text text-transparent">
            Create Account
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Sign up to manage products or place orders
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-12 glass-input"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-12 glass-input"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 glass-input"
              />
            </div>
          </div>

          {/* Role selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Select Role
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('USER')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                  role === 'USER'
                    ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Users className="h-4 w-4" />
                Seller / User
              </button>
              <button
                type="button"
                onClick={() => setRole('ADMIN')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                  role === 'ADMIN'
                    ? 'bg-red-500/10 border-red-500/50 text-red-400'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Shield className="h-4 w-4" />
                Admin
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Register
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-violet-400 hover:text-violet-300 underline underline-offset-4"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

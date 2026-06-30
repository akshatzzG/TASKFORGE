import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { registerUser } from '../api/auth';
import useAuthStore from '../store/authStore';

export default function Register() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [form, setForm] = useState({ organizationName: '', name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await registerUser(form);
      const { token, user, tenant } = res.data.data;
      login(token, user, tenant);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base px-4 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-violet-glow rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full relative animate-fade-in-up">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center">
            <LayoutGrid className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-semibold text-lg text-text-primary tracking-tight">TaskForge</span>
        </div>

        <div className="bg-surface border border-border-base rounded-2xl p-8">
          <h1 className="text-xl font-semibold text-text-primary mb-1">Create your workspace</h1>
          <p className="text-text-secondary text-sm mb-6">Manage your team's work with AI</p>

          {error && (
            <div className="bg-coral-500/10 border border-coral-500/20 text-coral-400 text-sm p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Organization name</label>
              <input
                type="text" name="organizationName" required
                value={form.organizationName} onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-surface-2 border border-border-base rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all"
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Your name</label>
              <input
                type="text" name="name" required
                value={form.name} onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-surface-2 border border-border-base rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all"
                placeholder="Akshat Sharma"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Email</label>
              <input
                type="email" name="email" required
                value={form.email} onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-surface-2 border border-border-base rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">Password</label>
              <input
                type="password" name="password" required minLength={6}
                value={form.password} onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-surface-2 border border-border-base rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all"
                placeholder="At least 6 characters"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-violet-500 hover:bg-violet-600 text-white py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating workspace...' : 'Create workspace'}
            </button>
          </form>
        </div>

        <p className="text-sm text-text-muted mt-6 text-center">
          Already have an account? <Link to="/login" className="text-violet-400 font-medium hover:text-violet-300">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
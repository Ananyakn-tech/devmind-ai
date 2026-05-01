// frontend/app/auth/login/page.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Brain, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('All fields required');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white">
        <div className="flex items-center gap-2">
          <Brain className="w-8 h-8" />
          <span className="text-2xl font-bold">DevMind</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Your AI-powered dev co-pilot
          </h2>
          <p className="text-blue-100 text-lg">
            Code reviews, docs generation, and bug tracking — all in one place.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { v: '10k+', l: 'Reviews done' },
              { v: '500+', l: 'Teams active' },
              { v: '98%', l: 'Satisfaction' },
              { v: '24/7', l: 'AI available' },
            ].map((s) => (
              <div key={s.l} className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold">{s.v}</div>
                <div className="text-blue-200 text-sm">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-blue-200 text-sm">© {new Date().getFullYear()} DevMind</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Brain className="w-7 h-7 text-blue-600" />
            <span className="text-xl font-bold gradient-text">DevMind</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
            <p className="text-muted-foreground">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign In
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-blue-600 font-medium hover:underline">
              Create one
            </Link>
          </p>

          {/* Demo creds */}
          <div className="mt-6 p-4 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-1">Demo credentials</p>
            <p className="text-muted-foreground">Email: demo@devmind.ai</p>
            <p className="text-muted-foreground">Password: demo1234</p>
          </div>
        </div>
      </div>
    </div>
  );
}

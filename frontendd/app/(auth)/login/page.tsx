'use client';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { signInWithEmailPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const expired = searchParams.get('expired') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      await signInWithEmailPassword(email, password);
      router.push('/admin/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-100 to-beige-100 p-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-gold-200">
        <h1 className="text-3xl font-serif font-bold text-navy-800 mb-6 text-center">
          Staff Login
        </h1>
        {expired && (
          <p className="text-sm text-gold-700 mb-4 text-center">
            Session expired. Please log in again.
          </p>
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@yourhotel.com"
          className="w-full p-3 border border-beige-300 rounded-lg mb-4 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-3 border border-beige-300 rounded-lg mb-4 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-navy-700 text-white p-3 rounded-lg hover:bg-navy-800 disabled:opacity-50 transition duration-300"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        {errorMsg && (
          <p className="mt-4 text-red-700 text-sm text-center">{errorMsg}</p>
        )}
      </form>
    </div>
  );
}

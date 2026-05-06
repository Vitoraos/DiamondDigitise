
'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const { signInWithEmail } = useAuth();
  const searchParams = useSearchParams();
  const expired = searchParams.get('expired') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    try {
      await signInWithEmail(email);
      setStatus('sent');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send magic link');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2">Staff Login</h1>
        {expired && <p className="text-sm text-amber-600 mb-4">Session expired. Please log in again.</p>}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)} # Fixed: missing 'setEmail'
          placeholder="admin@yourhotel.com"
          className="w-full p-3 border rounded mb-4"
          required
        />
        <button
          type="submit"
          disabled={status === 'sending'}
          className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {status === 'sending' ? 'Sending...' : status === 'sent' ? 'Check your email' : 'Send Magic Link'}
        </button>
        {status === 'sent' && <p className="mt-4 text-green-600 text-sm">Magic link sent. Open the email to continue.</p>}
        {errorMsg && <p className="mt-4 text-red-600 text-sm">{errorMsg}</p>}
      </form>
    </div>
  );
}

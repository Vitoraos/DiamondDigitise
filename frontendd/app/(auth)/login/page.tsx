
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-yellow-50 p-4"> {/* Changed background gradient for blue/gold feel */}
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-200"> {/* Increased shadow, added border */}
        <h1 className="text-3xl font-extrabold text-blue-800 mb-6 text-center">Staff Login</h1> {/* Larger, bolder title, royal blue */}
        {expired && <p className="text-sm text-amber-700 mb-4 text-center">Session expired. Please log in again.</p>} {/* Centered message, amber for gold hint */}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@yourhotel.com"
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-700 focus:border-transparent" {/* Enhanced input focus, royal blue ring */}
          required
        />
        <button
          type="submit"
          disabled={status === 'sending'}
          className="w-full bg-blue-800 text-white p-3 rounded-lg hover:bg-blue-900 disabled:opacity-50 transition duration-300 ease-in-out transform hover:scale-105" {/* Royal blue button, darker on hover */}
        >
          {status === 'sending' ? 'Sending...' : status === 'sent' ? 'Check your email' : 'Send Magic Link'}
        </button>
        {status === 'sent' && <p className="mt-4 text-amber-700 text-sm text-center">Magic link sent. Open the email to continue.</p>} {/* Centered message, amber for gold hint */}
        {errorMsg && <p className="mt-4 text-red-700 text-sm text-center">{errorMsg}</p>} {/* Centered message, deeper red */}
      </form>
    </div>
  );
}

/**
 * Newsletter Signup Sidebar Widget
 * Email subscription form with spam protection
 */

'use client';

import { useState, useCallback, type FormEvent } from 'react';

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Spam protection
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    
    // Honeypot check - if filled, it's likely a bot
    if (honeypot) {
      setStatus('success'); // Fake success to not alert the bot
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
        setErrorMessage(data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    }
  }, [email, honeypot]);

  const resetForm = useCallback(() => {
    setStatus('idle');
    setErrorMessage('');
  }, []);

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 rounded-2xl p-6 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4yIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJWMTJoMnY0em0wLTZoLTJWNmgydjR6Ii8+PC9nPjwvZz48L3N2Zz4=')] bg-repeat" />
      </div>

      {/* Floating elements */}
      <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" aria-hidden="true" />
      <div className="absolute bottom-4 left-4 w-16 h-16 bg-black/10 rounded-full blur-xl" aria-hidden="true" />

      <div className="relative">
        {status === 'success' ? (
          /* Success State */
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-black/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg 
                className="w-8 h-8 text-black" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-bold text-xl text-black mb-2">You're subscribed!</h3>
            <p className="text-black/70 text-sm mb-4">
              Check your inbox for a confirmation email.
            </p>
            <button
              onClick={resetForm}
              className="text-sm font-medium text-black/80 hover:text-black underline underline-offset-2 focus-ring rounded"
            >
              Subscribe another email
            </button>
          </div>
        ) : (
          /* Form State */
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl" aria-hidden="true">📬</span>
              <h3 className="font-bold text-xl text-black">Stay Updated</h3>
            </div>
            
            <p className="text-black/70 text-sm mb-4">
              Get the top crypto news delivered to your inbox daily. Free forever.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Honeypot field - hidden from real users */}
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                autoComplete="off"
                tabIndex={-1}
                aria-hidden="true"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
              />

              {/* Email Input */}
              <div>
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  type="email"
                  id="newsletter-email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={status === 'loading'}
                  className={`
                    w-full px-4 py-3 rounded-xl bg-black/10 backdrop-blur-sm
                    border-2 border-transparent
                    text-black placeholder-black/50
                    focus:outline-none focus:border-black/30 focus:bg-black/15
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200
                    ${status === 'error' ? 'border-red-500/50' : ''}
                  `}
                  aria-invalid={status === 'error'}
                  aria-describedby={status === 'error' ? 'newsletter-error' : undefined}
                />
              </div>

              {/* Error Message */}
              {status === 'error' && (
                <p id="newsletter-error" className="text-red-900 text-sm font-medium" role="alert">
                  {errorMessage}
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={status === 'loading' || !email}
                className={`
                  w-full px-4 py-3 rounded-xl font-semibold
                  bg-black text-white
                  hover:bg-gray-900 hover:shadow-lg
                  focus-ring
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                  flex items-center justify-center gap-2
                `}
              >
                {status === 'loading' ? (
                  <>
                    <svg 
                      className="animate-spin w-4 h-4" 
                      fill="none" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Subscribing...</span>
                  </>
                ) : (
                  <>
                    <span>Subscribe</span>
                    <svg 
                      className="w-4 h-4" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Privacy Note */}
            <p className="text-black/50 text-xs mt-3 text-center">
              No spam, ever. Unsubscribe anytime.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

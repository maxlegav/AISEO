import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const { status, update } = useSession();
  const [countdown, setCountdown] = useState(5);
  const { session_id: _sessionId } = router.query;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // The Stripe webhook provisions the subscription server-side; refresh the
    // client session so the new active tier is reflected before we hand the
    // user over to the monitoring app.
    if (status === 'authenticated') {
      update();
    }

    // Countdown timer → monitoring app (SYB v2 product), not the legacy dashboard.
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/app');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, status, update]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-200 via-pink-100 to-orange-100">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-200 via-pink-100 to-orange-100 px-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-green-400/30 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. Your subscription is now active and you can start using all features immediately.
          </p>

          {/* Countdown */}
          <p className="text-sm text-gray-500 mb-6">
            Redirection vers votre espace dans <span className="font-semibold text-purple-600">{countdown}</span> secondes...
          </p>

          {/* CTA Button */}
          <Button
            onClick={() => router.push('/app')}
            className="w-full h-12 bg-[#1E293B] hover:bg-[#334155] text-white font-semibold rounded-xl"
          >
            Accéder à mes projets
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          {/* Support link */}
          <p className="mt-6 text-sm text-gray-500">
            Need help?{' '}
            <Link href="/contact" className="text-purple-600 hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

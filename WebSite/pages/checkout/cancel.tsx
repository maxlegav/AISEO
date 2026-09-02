import { useRouter } from 'next/router';
import Link from 'next/link';
import { XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CheckoutCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-100 px-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-orange-400/30 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-ink-200/20 rounded-full blur-3xl" />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 text-center">
          {/* Cancel Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12 text-orange-500" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Cancelled
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            Your payment was cancelled. No charges have been made to your account.
            You can try again whenever you are ready.
          </p>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => router.push('/#pricing')}
              className="w-full h-12 bg-[#1E293B] hover:bg-[#334155] text-white font-semibold rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Plans
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="w-full h-12 border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl"
            >
              Go to Homepage
            </Button>
          </div>

          {/* Support link */}
          <p className="mt-6 text-sm text-gray-500">
            Having trouble?{' '}
            <Link href="/contact" className="text-accent hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

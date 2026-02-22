import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { CheckCircle, Loader2, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/LanguageContext';

export default function AuditSuccessPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const { t } = useLanguage();
  const [countdown, setCountdown] = useState(5);
  const hasRefreshed = useRef(false);

  // Refresh session once to get updated audit credits
  useEffect(() => {
    if (status === 'authenticated' && !hasRefreshed.current) {
      hasRefreshed.current = true;
      update();
    }
  }, [status, update]);

  // Redirect if unauthenticated + countdown timer
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status !== 'authenticated') return;

    const username = session?.user?.username;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(username ? `/${username}` : '/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-200 via-pink-100 via-40% to-orange-100">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const username = session?.user?.username;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-200 via-pink-100 via-40% to-orange-100 px-4 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-72 h-72 bg-green-400/30 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl" />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">
            {String(t("common.success"))}!
          </h1>

          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-orange-500" />
            <p className="text-gray-700 font-medium">
              +1 {String(t("dashboard.auditsRemaining")).toLowerCase()}
            </p>
          </div>

          <p className="text-gray-500 text-sm mb-6">
            {String(t("common.loading")).replace("...", "")}
          </p>

          <p className="text-sm text-gray-400 mb-6">
            {countdown}s...
          </p>

          <Button
            onClick={() => router.push(username ? `/${username}` : '/dashboard')}
            className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl"
          >
            {String(t("btn.dashboard"))}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <p className="mt-6 text-sm text-gray-500">
            <Link href="/settings#subscription" className="text-orange-600 hover:underline">
              {String(t("settings.manageSubscription"))}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

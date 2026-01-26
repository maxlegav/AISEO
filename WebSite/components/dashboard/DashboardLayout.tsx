import { ReactNode } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: _session, status } = useSession();
  const router = useRouter();

  // Protection côté client
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login?callbackUrl=" + router.asPath);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">
          Redirection vers la page de connexion...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 h-full">{children}</div>
      </main>
    </div>
  );
}

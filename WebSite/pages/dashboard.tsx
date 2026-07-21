import type { GetServerSideProps } from "next";

// The legacy audit dashboard (/{username}) has been removed. /dashboard now
// simply forwards to the monitoring workspace so old links/bookmarks keep working.
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/app",
      permanent: false,
    },
  };
};

export default function DashboardRedirect() {
  return null;
}

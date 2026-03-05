import { useEffect } from "react";
import { useRouter } from "next/router";
import { useWaitlistModalStore } from "@/stores";

export default function WaitlistPage() {
  const router = useRouter();
  const { openWaitlistModal } = useWaitlistModalStore();

  useEffect(() => {
    openWaitlistModal();
    router.replace("/");
  }, [openWaitlistModal, router]);

  return null;
}

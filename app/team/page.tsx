"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentAdmin } from "@/lib/store";

export default function TeamPage() {
  const router = useRouter();
  useEffect(() => {
    const admin = getCurrentAdmin();
    if (admin) {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/team/login");
    }
  }, [router]);
  return null;
}

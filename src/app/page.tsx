"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        window.location.href = "/dashboard";
      } else {
        window.location.href = "/login";
      }
    };
    checkUser();
  }, [supabase]);

  return null;
}
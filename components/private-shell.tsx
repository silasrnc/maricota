import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { SetupNotice } from "@/components/setup-notice";
import { createClient } from "@/lib/supabase/server";

export async function PrivateShell({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  if (!supabase) return <SetupNotice />;
  const { data } = await supabase.auth.getUser();
  return <AppShell userEmail={data.user?.email}>{children}</AppShell>;
}

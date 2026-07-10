import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsPanel } from "@/components/dashboard/settings-panel";

export default async function SettingsPage() {
  const session = await requireAuth();
  if (!session.user) redirect("/login");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your account preferences and interview defaults."
      />
      <SettingsPanel user={session.user} />
    </div>
  );
}

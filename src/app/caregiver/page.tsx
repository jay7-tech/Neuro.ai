import { AppHeader } from "@/components/app/header";
import { CaregiverDashboard } from "@/components/caregiver/caregiver-dashboard";

export default function CaregiverPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader role="Caregiver" />
      <CaregiverDashboard />
    </div>
  );
}

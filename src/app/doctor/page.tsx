
import { AppHeader } from "@/components/app/header";
import { DoctorDashboard } from "@/components/doctor/doctor-dashboard";

export default function DoctorPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader role="Doctor" />
      <DoctorDashboard />
    </div>
  );
}

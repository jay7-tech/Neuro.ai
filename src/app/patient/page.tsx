import { AppHeader } from "@/components/app/header";
import { PatientDashboard } from "@/components/patient/patient-dashboard";
import { MoodTracker } from "@/components/patient/mood-tracker";

export default function PatientPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader role="Patient" />
      <main>
        <PatientDashboard />
      </main>
    </div>
  );
}

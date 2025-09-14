
"use client";
import { useState, useEffect, useCallback } from 'react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger, SidebarHeader } from '@/components/ui/sidebar';
import { Home, ListTodo, BarChart2, UserCircle } from 'lucide-react';
import { DashboardView } from './dashboard-view';
import { CareCoordinationView } from './care-coordination-view';
import { PatientMonitoringView } from './patient-monitoring-view';
import { ProfileView } from './profile-view';

const AppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
        <path d="M12 2a10 10 0 0 0-10 10c0 5 4.5 9 10 9s10-4 10-9A10 10 0 0 0 12 2Z"/>
        <path d="M12 12a5 5 0 0 0-5 5"/>
        <path d="M12 7a5 5 0 0 1 5 5"/>
    </svg>
)

type View = 'dashboard' | 'coordination' | 'monitoring' | 'profile';
export type PatientLink = { id: string, name: string };


const LINKED_PATIENT_STORAGE_KEY = 'neuro-ai-caregiver-linked-patient';


export function CaregiverDashboard() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [linkedPatient, setLinkedPatient] = useState<PatientLink | null>(null);

  useEffect(() => {
    const storedPatient = localStorage.getItem(LINKED_PATIENT_STORAGE_KEY);
    if (storedPatient) {
        try {
            setLinkedPatient(JSON.parse(storedPatient));
        } catch (e) {
            console.error("Failed to parse linked patient data", e);
            localStorage.removeItem(LINKED_PATIENT_STORAGE_KEY);
        }
    }
  }, []);

  const linkPatient = useCallback((patient: PatientLink) => {
    setLinkedPatient(patient);
    localStorage.setItem(LINKED_PATIENT_STORAGE_KEY, JSON.stringify(patient));
  }, []);
  
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView linkPatient={linkPatient} linkedPatient={linkedPatient} />;
      case 'profile':
        return <ProfileView />;
      case 'coordination':
         if (!linkedPatient) return <DashboardView linkPatient={linkPatient} linkedPatient={linkedPatient} />;
        return <CareCoordinationView patientId={linkedPatient.id} key={linkedPatient.id} />;
      case 'monitoring':
         if (!linkedPatient) return <DashboardView linkPatient={linkPatient} linkedPatient={linkedPatient} />;
        return <PatientMonitoringView patientId={linkedPatient.id} key={linkedPatient.id} />;
      default:
        return <DashboardView linkPatient={linkPatient} linkedPatient={linkedPatient} />;
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
                <AppIcon />
                <h2 className="font-bold font-headline text-lg group-data-[collapsible=icon]:hidden">
                    Caregiver Menu
                </h2>
            </div>
        </SidebarHeader>
        <SidebarContent>
          <div className="p-2 text-center group-data-[collapsible=icon]:hidden">
            {linkedPatient ? (
                <p className="text-sm p-2 bg-muted rounded-md">Linked to: <span className="font-bold">{linkedPatient.name}</span></p>
            ) : (
                <p className="text-sm p-2 bg-muted rounded-md">No patient linked.</p>
            )}
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveView('dashboard')} isActive={activeView === 'dashboard'} tooltip="Dashboard"><Home />Dashboard</SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveView('profile')} isActive={activeView === 'profile'} tooltip="My Profile"><UserCircle />My Profile</SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveView('coordination')} isActive={activeView === 'coordination'} tooltip="Care Coordination" disabled={!linkedPatient}><ListTodo />Care Coordination</SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveView('monitoring')} isActive={activeView === 'monitoring'} tooltip="Patient Monitoring" disabled={!linkedPatient}><BarChart2 />Patient Monitoring</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="p-4 md:p-8">
            <div className="md:hidden mb-4">
                <SidebarTrigger />
            </div>
            {renderView()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

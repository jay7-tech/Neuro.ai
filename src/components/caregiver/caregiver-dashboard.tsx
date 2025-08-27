"use client";
import { useState } from 'react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger, SidebarHeader } from '@/components/ui/sidebar';
import { Home, ListTodo, BarChart2 } from 'lucide-react';
import { DashboardView } from './dashboard-view';
import { CareCoordinationView } from './care-coordination-view';
import { PatientMonitoringView } from './patient-monitoring-view';

const AppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
        <path d="M12 2a10 10 0 0 0-10 10c0 5 4.5 9 10 9s10-4 10-9A10 10 0 0 0 12 2Z"/>
        <path d="M12 12a5 5 0 0 0-5 5"/>
        <path d="M12 7a5 5 0 0 1 5 5"/>
    </svg>
)

type View = 'dashboard' | 'coordination' | 'monitoring';

export function CaregiverDashboard() {
  const [activeView, setActiveView] = useState<View>('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'coordination':
        return <CareCoordinationView />;
      case 'monitoring':
        return <PatientMonitoringView />;
      default:
        return <DashboardView />;
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
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveView('dashboard')} isActive={activeView === 'dashboard'} tooltip="Dashboard"><Home />Dashboard</SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveView('coordination')} isActive={activeView === 'coordination'} tooltip="Care Coordination"><ListTodo />Care Coordination</SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveView('monitoring')} isActive={activeView === 'monitoring'} tooltip="Patient Monitoring"><BarChart2 />Patient Monitoring</SidebarMenuButton>
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

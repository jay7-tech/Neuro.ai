
"use client";
import { useState, useEffect, useCallback } from 'react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger, SidebarHeader } from '@/components/ui/sidebar';
import { Home, ListTodo, BarChart2, Users, ChevronDown, FileText } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { PatientsView } from './patients-view';
import { ClinicalNotesView } from './clinical-notes-view';
import { patient as mockPatientData } from '@/lib/data';

const AppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
        <path d="M12 2a10 10 0 0 0-10 10c0 5 4.5 9 10 9s10-4 10-9A10 10 0 0 0 12 2Z"/>
        <path d="M12 12a5 5 0 0 0-5 5"/>
        <path d="M12 7a5 5 0 0 1 5 5"/>
    </svg>
)

type View = 'patients' | 'notes';
export type Patient = { id: string, name: string };

const PATIENTS_STORAGE_KEY = 'neuro-ai-doctor-patients';
const ACTIVE_PATIENT_STORAGE_KEY = 'neuro-ai-doctor-active-patient';

export function DoctorDashboard() {
  const [activeView, setActiveView] = useState<View>('patients');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activePatient, setActivePatient] = useState<Patient | null>(null);

  useEffect(() => {
    const storedPatients = localStorage.getItem(PATIENTS_STORAGE_KEY);
    if (storedPatients) {
        setPatients(JSON.parse(storedPatients));
    }

    const storedActivePatient = localStorage.getItem(ACTIVE_PATIENT_STORAGE_KEY);
    if(storedActivePatient) {
        setActivePatient(JSON.parse(storedActivePatient));
    }
  }, []);

  const addPatient = useCallback((patient: Patient) => {
    const newPatients = [...patients.filter(p => p.id !== patient.id), patient];
    setPatients(newPatients);
    localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(newPatients));
    if (!activePatient) {
      changeActivePatient(patient);
    }
  }, [patients, activePatient]);
  
  const changeActivePatient = (patient: Patient | null) => {
    setActivePatient(patient);
    if (patient) {
      localStorage.setItem(ACTIVE_PATIENT_STORAGE_KEY, JSON.stringify(patient));
    } else {
      localStorage.removeItem(ACTIVE_PATIENT_STORAGE_KEY);
    }
    const currentView = activeView;
    setActiveView('patients');
    setTimeout(() => setActiveView(currentView), 0);
  };

  const renderView = () => {
    switch (activeView) {
      case 'patients':
        return <PatientsView addPatient={addPatient} changeActivePatient={changeActivePatient} patients={patients} activePatient={activePatient} />;
      case 'notes':
        if (!activePatient) return <PatientsView addPatient={addPatient} changeActivePatient={changeActivePatient} patients={patients} activePatient={activePatient} />;
        return <ClinicalNotesView patient={activePatient} key={activePatient.id} />;
      default:
        return <PatientsView addPatient={addPatient} changeActivePatient={changeActivePatient} patients={patients} activePatient={activePatient} />;
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
                <AppIcon />
                <h2 className="font-bold font-headline text-lg group-data-[collapsible=icon]:hidden">
                    Doctor Menu
                </h2>
            </div>
        </SidebarHeader>
        <SidebarContent>
           <div className="p-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between group-data-[collapsible=icon]:hidden">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span className="truncate max-w-[120px]">
                                {activePatient ? `Patient: ${activePatient.name}` : "Select Patient"}
                            </span>
                        </div>
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                 <DropdownMenuContent className="w-56">
                    {patients.map(p => (
                         <DropdownMenuItem key={p.id} onClick={() => changeActivePatient(p)}>
                            {p.name}
                        </DropdownMenuItem>
                    ))}
                    {patients.length === 0 && <DropdownMenuItem disabled>No patients added</DropdownMenuItem>}
                 </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveView('patients')} isActive={activeView === 'patients'} tooltip="Patients"><Users />Patients</SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveView('notes')} isActive={activeView === 'notes'} tooltip="Clinical Notes" disabled={!activePatient}><FileText />Clinical Notes</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="p-4 md:p-8">
            <div className="md:hidden mb-4 flex justify-between">
                <SidebarTrigger />
                 {activePatient && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                {`Patient: ${activePatient.name}`} <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           {patients.map(p => (
                                <DropdownMenuItem key={p.id} onClick={() => changeActivePatient(p)}>
                                    {p.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
            {renderView()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

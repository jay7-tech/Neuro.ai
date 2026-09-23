'use client';

import {
  Activity,
  ClipboardList,
  FileText,
  HeartPulse,
  LayoutDashboard,
  MessageSquare,
  ShieldAlert,
  Stethoscope,
  Users,
} from 'lucide-react';
import type { SessionUser } from '@/server/auth/session';
import { StaffShell, type NavItem } from './staff-shell';

const CAREGIVER_NAV: NavItem[] = [
  { href: '/caregiver', label: 'Overview', icon: LayoutDashboard, needsPatient: true },
  { href: '/caregiver/care', label: 'Care plan', icon: ClipboardList, needsPatient: true },
  { href: '/caregiver/monitoring', label: 'Monitoring', icon: ShieldAlert, needsPatient: true },
  { href: '/caregiver/team', label: 'Care team', icon: Users },
  { href: '/caregiver/activity', label: 'Activity log', icon: Activity, needsPatient: true },
];

const CLINICIAN_NAV: NavItem[] = [
  { href: '/doctor', label: 'Patient overview', icon: Stethoscope, needsPatient: true },
  { href: '/doctor/care', label: 'Medication & vitals', icon: HeartPulse, needsPatient: true },
  { href: '/doctor/notes', label: 'Clinical notes', icon: FileText, needsPatient: true },
  { href: '/doctor/messages', label: 'Messages', icon: MessageSquare, needsPatient: true },
  { href: '/doctor/team', label: 'Care team', icon: Users },
];

// Nav items hold component references, which can't cross the server→client boundary,
// so each role gets a small client wrapper that owns its navigation.
export function CaregiverShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  return (
    <StaffShell user={user} nav={CAREGIVER_NAV}>
      {children}
    </StaffShell>
  );
}

export function ClinicianShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  return (
    <StaffShell user={user} nav={CLINICIAN_NAV}>
      {children}
    </StaffShell>
  );
}

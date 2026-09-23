'use client';

import { useEffect, useRef, useState } from 'react';
import { Home, Loader2, LocateFixed, MapPin, Navigation } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useConfigureGeofence, useLocation, useReportLocation } from '@/hooks/api';
import { EmptyState, QueryState } from '@/components/common/query-state';
import { ago } from '@/components/common/format';
import { errorMessage } from '@/lib/api-client';

/** OpenStreetMap embed: no API key, no tracking script. */
function MapEmbed({ lat, lng }: { lat: number; lng: number }) {
  const d = 0.006;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`;
  return <iframe title="Patient location map" src={src} className="h-64 w-full rounded-lg border" loading="lazy" />;
}

export function LocationCard({ patientId, canConfigure }: { patientId: string; canConfigure: boolean }) {
  const q = useLocation(patientId);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MapPin /> Location &amp; safe zone</CardTitle>
        <CardDescription>A wandering alert is raised after two consecutive readings confidently outside the safe zone.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <QueryState query={q}>
          {(loc) => (
            <>
              {loc.latest ? (
                <>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    {loc.latest.insideGeofence === true && <Badge className="bg-emerald-600">Inside safe zone</Badge>}
                    {loc.latest.insideGeofence === false && <Badge variant="destructive">Outside safe zone</Badge>}
                    {loc.latest.insideGeofence === null && <Badge variant="secondary">Uncertain (low GPS accuracy)</Badge>}
                    {loc.latest.distanceFromHomeM !== null && <span>{Math.round(loc.latest.distanceFromHomeM)} m from home</span>}
                    <span className="text-muted-foreground">±{Math.round(loc.latest.accuracyM)} m · {ago(loc.latest.recordedAt)}</span>
                  </div>
                  <MapEmbed lat={loc.latest.lat} lng={loc.latest.lng} />
                </>
              ) : (
                <EmptyState icon={Navigation} title="No location shared yet">
                  <p className="text-sm">The patient can turn on location sharing from their home screen.</p>
                </EmptyState>
              )}
              {canConfigure && <GeofenceForm patientId={patientId} current={loc.geofence} last={loc.latest} />}
            </>
          )}
        </QueryState>
      </CardContent>
    </Card>
  );
}

function GeofenceForm({
  patientId,
  current,
  last,
}: {
  patientId: string;
  current: { homeLat: number | null; homeLng: number | null; radiusM: number } | null;
  last: { lat: number; lng: number } | null;
}) {
  const save = useConfigureGeofence(patientId);
  const ping = useReportLocation(patientId);
  const { toast } = useToast();
  const [lat, setLat] = useState(String(current?.homeLat ?? ''));
  const [lng, setLng] = useState(String(current?.homeLng ?? ''));
  const [radius, setRadius] = useState(String(current?.radiusM ?? 300));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate(
      { homeLat: Number(lat), homeLng: Number(lng), radiusM: Number(radius) },
      { onSuccess: () => toast({ title: 'Safe zone saved' }), onError: (err) => toast({ title: 'Invalid safe zone', description: errorMessage(err), variant: 'destructive' }) },
    );
  };

  /** Lets a caregiver verify the alerting pipeline end-to-end without leaving the house. */
  const simulateAway = async () => {
    if (!current?.homeLat || !current.homeLng) return;
    const away = { lat: current.homeLat + (current.radiusM * 3) / 111_000, lng: current.homeLng, accuracyM: 10 };
    try {
      await ping.mutateAsync(away);
      await ping.mutateAsync(away);
      toast({ title: 'Test readings sent', description: 'Two readings outside the zone — a wandering alert should appear.' });
    } catch (err) {
      toast({ title: 'Test failed', description: errorMessage(err), variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border p-4">
      <p className="flex items-center gap-2 font-medium"><Home className="h-4 w-4" /> Home &amp; safe-zone radius</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1"><Label htmlFor="gf-lat">Latitude</Label><Input id="gf-lat" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} /></div>
        <div className="space-y-1"><Label htmlFor="gf-lng">Longitude</Label><Input id="gf-lng" inputMode="decimal" value={lng} onChange={(e) => setLng(e.target.value)} /></div>
        <div className="space-y-1"><Label htmlFor="gf-r">Radius (m)</Label><Input id="gf-r" type="number" min={50} max={20000} value={radius} onChange={(e) => setRadius(e.target.value)} /></div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={save.isPending}>{save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
        {last && (
          <Button type="button" variant="outline" onClick={() => { setLat(String(last.lat)); setLng(String(last.lng)); }}>
            <LocateFixed className="mr-2 h-4 w-4" /> Use last known position
          </Button>
        )}
        {current?.homeLat != null && (
          <Button type="button" variant="ghost" onClick={simulateAway} disabled={ping.isPending}>Test the alert</Button>
        )}
      </div>
    </form>
  );
}

const SHARE_KEY = 'neuro-ai-share-location';
const MIN_INTERVAL_MS = 2 * 60_000;

/**
 * Patient-side sharing. watchPosition fires often; we throttle to one upload every
 * two minutes unless the position moved a lot, to spare battery and the server.
 */
export function LocationSharing({ patientId }: { patientId: string }) {
  const report = useReportLocation(patientId);
  const [on, setOn] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const lastSent = useRef(0);

  useEffect(() => {
    try {
      setOn(localStorage.getItem(SHARE_KEY) === '1');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!on) return;
    if (!('geolocation' in navigator)) {
      setStatus('This device cannot share location.');
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        if (Date.now() - lastSent.current < MIN_INTERVAL_MS) return;
        lastSent.current = Date.now();
        report.mutate({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracyM: Math.min(pos.coords.accuracy, 10_000) });
        setStatus(`Shared ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? 'Location permission was denied.' : 'Could not get your location.'),
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 30_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);

  const toggle = (v: boolean) => {
    setOn(v);
    setStatus(null);
    try {
      localStorage.setItem(SHARE_KEY, v ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
      <div>
        <Label htmlFor="share-loc" className="text-base font-semibold">Share my location with my care team</Label>
        <p className="text-sm text-muted-foreground">{status ?? (on ? 'Waiting for your position…' : 'Off')}</p>
      </div>
      <Switch id="share-loc" checked={on} onCheckedChange={toggle} />
    </div>
  );
}

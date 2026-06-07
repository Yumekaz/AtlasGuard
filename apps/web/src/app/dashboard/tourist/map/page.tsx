'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../../hooks/useAuth';
import { useIncidentSocket } from '../../../../hooks/useIncidentSocket';
import { apiRequest } from '../../../../lib/api';
import AtlasMap from '../../../../components/AtlasMap';
import {
  DEMO_LOCATIONS,
  GeofenceAlertPayload,
  GeofenceCheckResult,
  RiskLevel,
  RiskZone,
  Trip,
} from '@atlasguard/shared';

const LOCATION_PRESETS = Object.entries(DEMO_LOCATIONS).map(([key, loc]) => ({
  key,
  ...loc,
}));

function riskAlertClass(level: RiskLevel | null): string {
  if (level === 'CRITICAL' || level === 'HIGH') return 'alert-danger';
  if (level === 'MEDIUM') return 'alert-warning';
  if (level === 'LOW') return 'alert-info';
  return 'alert-success';
}

export default function TouristMapPage() {
  const { user, loading: authLoading } = useAuth(['TOURIST', 'ADMIN']);
  const [zones, setZones] = useState<RiskZone[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; label: string }>({
    lat: DEMO_LOCATIONS.defaultStart.lat,
    lng: DEMO_LOCATIONS.defaultStart.lng,
    label: DEMO_LOCATIONS.defaultStart.label,
  });
  const [checkResult, setCheckResult] = useState<GeofenceCheckResult | null>(null);
  const [lastAlertedZoneId, setLastAlertedZoneId] = useState<string | undefined>();
  const [wsAlert, setWsAlert] = useState<GeofenceAlertPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runGeofenceCheck = useCallback(
    async (lat: number, lng: number, label?: string) => {
      setChecking(true);
      setError(null);
      try {
        const result = await apiRequest<GeofenceCheckResult>('/geofence/check', 'POST', {
          latitude: lat,
          longitude: lng,
          lastAlertedZoneId,
        });
        setCheckResult(result);
        if (result.shouldAlert && result.alertZoneId) {
          setLastAlertedZoneId(result.alertZoneId);
        }
        setLocation({ lat, lng, label: label ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
      } catch (err: any) {
        setError(err.message || 'Geofence check failed');
      } finally {
        setChecking(false);
      }
    },
    [lastAlertedZoneId],
  );

  useEffect(() => {
    if (authLoading || !user) return;

    const load = async () => {
      try {
        const [zoneData, tripData] = await Promise.all([
          apiRequest<RiskZone[]>('/risk-zones', 'GET'),
          apiRequest<Trip>('/trips/active', 'GET').catch(() => null),
        ]);
        setZones(zoneData);
        setActiveTrip(tripData);
        await runGeofenceCheck(
          DEMO_LOCATIONS.defaultStart.lat,
          DEMO_LOCATIONS.defaultStart.lng,
          DEMO_LOCATIONS.defaultStart.label,
        );
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authLoading, user]);

  useIncidentSocket({
    onGeofenceAlert: (alert) => setWsAlert(alert),
  });

  if (authLoading || loading) {
    return (
      <div className="glass metric-card shimmer" style={{ padding: '3rem', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--text-secondary)' }}>Loading Safety Map...</h3>
      </div>
    );
  }

  if (!activeTrip) {
    return (
      <div className="glass metric-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '0.75rem' }}>Active Trip Required</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Schedule an active trip to enable live geofence monitoring on the map.
        </p>
        <Link href="/dashboard/tourist/trip" className="btn btn-primary" style={{ width: 'auto' }}>
          Schedule Active Trip
        </Link>
      </div>
    );
  }

  const displayAlert = wsAlert?.message || checkResult?.message;
  const displayRisk = wsAlert?.riskLevel || checkResult?.highestRisk;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.35rem' }}>Safety Map</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Simulate your location to test geofence alerts for {activeTrip.destinationName}.
          </p>
        </div>
        <Link href="/dashboard/tourist" className="btn btn-secondary" style={{ width: 'auto', fontSize: '0.85rem' }}>
          Back to Safety Console
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {displayAlert && (
        <div className={`alert ${riskAlertClass(displayRisk ?? null)}`} role="alert" style={{ marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.25rem' }}>{checkResult?.shouldAlert || wsAlert ? '⚠️' : '✓'}</span>
          <div>
            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
              {checkResult?.inside || wsAlert ? 'Geofence Alert' : 'All Clear'}
            </strong>
            {displayAlert}
          </div>
        </div>
      )}

      <div className="glass" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
          Simulate Location
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {LOCATION_PRESETS.map((preset) => (
            <button
              key={preset.key}
              onClick={() => runGeofenceCheck(preset.lat, preset.lng, preset.label)}
              disabled={checking}
              className="btn btn-secondary"
              style={{
                width: 'auto',
                fontSize: '0.8rem',
                padding: '0.45rem 0.75rem',
                borderColor: location.lat === preset.lat && location.lng === preset.lng ? 'var(--primary)' : undefined,
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
        {checking && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.75rem' }}>
            Checking geofence...
          </p>
        )}
      </div>

      <AtlasMap
        zones={zones}
        touristLocation={location}
        layers={{ zones: true, tourist: true, incidents: false, responders: false }}
        height="480px"
      />

      {checkResult && checkResult.matchedZones.length > 0 && (
        <div className="glass metric-card" style={{ marginTop: '1.25rem', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Matched Zones</h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {checkResult.matchedZones.map((zone) => (
              <li key={zone.id} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: '#fff' }}>{zone.name}</strong> — {zone.riskLevel}: {zone.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
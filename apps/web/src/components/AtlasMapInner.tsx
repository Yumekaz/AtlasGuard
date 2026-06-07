'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  GeoJsonPolygon,
  IncidentSummary,
  ResponderSummary,
  RiskLevel,
  RiskZone,
} from '@atlasguard/shared';

const RISK_COLORS: Record<RiskLevel, { fill: string; stroke: string }> = {
  LOW: { fill: 'rgba(16, 185, 129, 0.25)', stroke: '#10b981' },
  MEDIUM: { fill: 'rgba(245, 158, 11, 0.3)', stroke: '#f59e0b' },
  HIGH: { fill: 'rgba(239, 68, 68, 0.3)', stroke: '#ef4444' },
  CRITICAL: { fill: 'rgba(220, 38, 38, 0.4)', stroke: '#dc2626' },
};

const touristIcon = L.divIcon({
  className: 'atlas-tourist-marker',
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#06b6d4;border:2px solid #fff;box-shadow:0 0 8px rgba(6,182,212,0.8)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const incidentIcon = L.divIcon({
  className: 'atlas-incident-marker',
  html: '<div style="width:12px;height:12px;border-radius:2px;background:#ef4444;border:2px solid #fff;box-shadow:0 0 6px rgba(239,68,68,0.7)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const responderIcon = L.divIcon({
  className: 'atlas-responder-marker',
  html: '<div style="width:12px;height:12px;border-radius:2px;background:#10b981;border:2px solid #fff;box-shadow:0 0 6px rgba(16,185,129,0.7)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

function polygonPositions(polygon: GeoJsonPolygon): [number, number][] {
  const ring = polygon.coordinates[0];
  return ring.map(([lng, lat]) => [lat, lng] as [number, number]);
}

function FitBounds({ zones }: { zones: RiskZone[] }) {
  const map = useMap();

  useEffect(() => {
    if (zones.length === 0) return;
    const bounds = L.latLngBounds([]);
    for (const zone of zones) {
      const positions = polygonPositions(zone.polygon);
      positions.forEach((pos) => bounds.extend(pos));
    }
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [24, 24] });
    }
  }, [map, zones]);

  return null;
}

export interface MapLayers {
  zones: boolean;
  incidents: boolean;
  responders: boolean;
  tourist: boolean;
}

export interface TouristLocation {
  lat: number;
  lng: number;
  label?: string;
}

export interface AtlasMapInnerProps {
  zones: RiskZone[];
  incidents?: IncidentSummary[];
  responders?: ResponderSummary[];
  touristLocation?: TouristLocation;
  layers?: Partial<MapLayers>;
  height?: string;
  center?: [number, number];
  zoom?: number;
}

const DEFAULT_LAYERS: MapLayers = {
  zones: true,
  incidents: true,
  responders: true,
  tourist: true,
};

export default function AtlasMapInner({
  zones,
  incidents = [],
  responders = [],
  touristLocation,
  layers,
  height = '420px',
  center = [27.331, 88.613],
  zoom = 13,
}: AtlasMapInnerProps) {
  const activeLayers = { ...DEFAULT_LAYERS, ...layers };

  return (
    <div className="atlas-map-container" style={{ height, borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', background: '#0b0f19' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds zones={zones} />

        {activeLayers.zones &&
          zones.map((zone) => {
            const colors = RISK_COLORS[zone.riskLevel];
            return (
              <Polygon
                key={zone.id}
                positions={polygonPositions(zone.polygon)}
                pathOptions={{
                  color: colors.stroke,
                  fillColor: colors.stroke,
                  fillOpacity: 0.25,
                  weight: 2,
                }}
              >
                <Popup>
                  <strong>{zone.name}</strong>
                  <br />
                  Risk: {zone.riskLevel}
                  <br />
                  {zone.description}
                </Popup>
              </Polygon>
            );
          })}

        {activeLayers.incidents &&
          incidents.map((incident) => (
            <Marker
              key={incident.id}
              position={[incident.latitude, incident.longitude]}
              icon={incidentIcon}
            >
              <Popup>
                <strong>{incident.type}</strong> — {incident.touristName}
                <br />
                Status: {incident.status}
              </Popup>
            </Marker>
          ))}

        {activeLayers.responders &&
          responders
            .filter((r) => r.lastLatitude != null && r.lastLongitude != null)
            .map((responder) => (
              <Marker
                key={responder.id}
                position={[responder.lastLatitude!, responder.lastLongitude!]}
                icon={responderIcon}
              >
                <Popup>
                  <strong>{responder.name}</strong>
                  <br />
                  {responder.unitName} ({responder.availabilityStatus})
                </Popup>
              </Marker>
            ))}

        {activeLayers.tourist && touristLocation && (
          <Marker position={[touristLocation.lat, touristLocation.lng]} icon={touristIcon}>
            <Popup>
              <strong>Simulated Location</strong>
              <br />
              {touristLocation.label || `${touristLocation.lat.toFixed(4)}, ${touristLocation.lng.toFixed(4)}`}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
'use client';

import { useEffect, useRef } from 'react';
import { connectSocket } from '../lib/socket';
import { GeofenceAlertPayload, IncidentDetail } from '@atlasguard/shared';

type IncidentHandler = (incident: IncidentDetail) => void;
type AssignedHandler = (payload: { incidentId: string; assignment: IncidentDetail }) => void;
type GeofenceAlertHandler = (alert: GeofenceAlertPayload) => void;

export function useIncidentSocket(options: {
  onCreated?: IncidentHandler;
  onUpdated?: IncidentHandler;
  onAssigned?: AssignedHandler;
  onGeofenceAlert?: GeofenceAlertHandler;
  incidentId?: string;
}) {
  const onCreatedRef = useRef(options.onCreated);
  const onUpdatedRef = useRef(options.onUpdated);
  const onAssignedRef = useRef(options.onAssigned);
  const onGeofenceAlertRef = useRef(options.onGeofenceAlert);

  onCreatedRef.current = options.onCreated;
  onUpdatedRef.current = options.onUpdated;
  onAssignedRef.current = options.onAssigned;
  onGeofenceAlertRef.current = options.onGeofenceAlert;

  useEffect(() => {
    const socket = connectSocket();

    const handleCreated = (incident: IncidentDetail) => onCreatedRef.current?.(incident);
    const handleUpdated = (incident: IncidentDetail) => onUpdatedRef.current?.(incident);
    const handleAssigned = (payload: { incidentId: string; assignment: IncidentDetail }) =>
      onAssignedRef.current?.(payload);
    const handleGeofenceAlert = (alert: GeofenceAlertPayload) =>
      onGeofenceAlertRef.current?.(alert);

    socket.on('incident.created', handleCreated);
    socket.on('incident.updated', handleUpdated);
    socket.on('responder.assigned', handleAssigned);
    socket.on('geofence.alert', handleGeofenceAlert);

    if (options.incidentId) {
      socket.emit('joinIncident', { incidentId: options.incidentId });
    }

    return () => {
      socket.off('incident.created', handleCreated);
      socket.off('incident.updated', handleUpdated);
      socket.off('responder.assigned', handleAssigned);
      socket.off('geofence.alert', handleGeofenceAlert);
    };
  }, [options.incidentId]);
}
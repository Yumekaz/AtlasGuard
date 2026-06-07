'use client';

import { useEffect, useRef } from 'react';
import { connectSocket } from '../lib/socket';
import { IncidentDetail } from '@atlasguard/shared';

type IncidentHandler = (incident: IncidentDetail) => void;
type AssignedHandler = (payload: { incidentId: string; assignment: IncidentDetail }) => void;

export function useIncidentSocket(options: {
  onCreated?: IncidentHandler;
  onUpdated?: IncidentHandler;
  onAssigned?: AssignedHandler;
  incidentId?: string;
}) {
  const onCreatedRef = useRef(options.onCreated);
  const onUpdatedRef = useRef(options.onUpdated);
  const onAssignedRef = useRef(options.onAssigned);

  onCreatedRef.current = options.onCreated;
  onUpdatedRef.current = options.onUpdated;
  onAssignedRef.current = options.onAssigned;

  useEffect(() => {
    const socket = connectSocket();

    const handleCreated = (incident: IncidentDetail) => onCreatedRef.current?.(incident);
    const handleUpdated = (incident: IncidentDetail) => onUpdatedRef.current?.(incident);
    const handleAssigned = (payload: { incidentId: string; assignment: IncidentDetail }) =>
      onAssignedRef.current?.(payload);

    socket.on('incident.created', handleCreated);
    socket.on('incident.updated', handleUpdated);
    socket.on('responder.assigned', handleAssigned);

    if (options.incidentId) {
      socket.emit('joinIncident', { incidentId: options.incidentId });
    }

    return () => {
      socket.off('incident.created', handleCreated);
      socket.off('incident.updated', handleUpdated);
      socket.off('responder.assigned', handleAssigned);
    };
  }, [options.incidentId]);
}
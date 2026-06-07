export const NOTIFICATION_QUEUE = 'atlasguard-notifications';

export type NotificationTemplate =
  | 'incident.created'
  | 'responder.assigned'
  | 'incident.updated'
  | 'geofence.alert';

export interface NotificationJobData {
  userId: string;
  incidentId?: string;
  channel: 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';
  template: NotificationTemplate;
  payload: Record<string, unknown>;
}
export type UserRole = 'TOURIST' | 'OPERATOR' | 'RESPONDER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

export interface RegisterRequest {
  email: string;
  password?: string;
  name: string;
  role: UserRole;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
  token: string;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
  token: string;
}

export interface TouristProfile {
  id: string;
  userId: string;
  phone: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
  mobilityNeeds?: string;
  languagePreference?: string;
  createdAt: string;
}

export interface CreateTouristProfileDto {
  phone: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
  mobilityNeeds?: string;
  languagePreference?: string;
}

export interface Trip {
  id: string;
  touristId: string;
  destinationName: string;
  startDate: string;
  endDate: string;
  safetyId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface CreateTripDto {
  destinationName: string;
  startDate: string;
  endDate: string;
}

// ----------------------------------------------------
// Incident Types (Phase 3)
// ----------------------------------------------------

export type IncidentStatus =
  | 'CREATED'
  | 'ACKNOWLEDGED'
  | 'ASSIGNED'
  | 'DISPATCHED'
  | 'REACHED'
  | 'RESOLVED'
  | 'CANCELLED';

export type IncidentType =
  | 'SOS'
  | 'GEOFENCE_BREACH'
  | 'MEDICAL'
  | 'LOST'
  | 'HARASSMENT'
  | 'OTHER';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentEventType =
  | 'SOS_TRIGGERED'
  | 'ACKNOWLEDGED'
  | 'ASSIGNED'
  | 'DISPATCHED'
  | 'REACHED'
  | 'RESOLVED'
  | 'CANCELLED'
  | 'NOTE_ADDED';

export interface IncidentEvent {
  id: string;
  incidentId: string;
  actorId: string;
  actorName?: string;
  eventType: IncidentEventType;
  metadata?: string;
  previousHash: string;
  currentHash: string;
  createdAt: string;
}

export interface Incident {
  id: string;
  touristId: string;
  tripId?: string;
  type: IncidentType;
  status: IncidentStatus;
  severity: IncidentSeverity;
  latitude: number;
  longitude: number;
  riskScore: number;
  riskExplanation?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentSummary {
  id: string;
  type: IncidentType;
  status: IncidentStatus;
  severity: IncidentSeverity;
  latitude: number;
  longitude: number;
  riskScore: number;
  riskExplanation?: string;
  touristName: string;
  safetyId?: string;
  destinationName?: string;
  assignedResponderName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceFile {
  id: string;
  incidentId: string;
  uploadedById: string;
  uploadedByName?: string;
  fileUrl: string;
  fileType: string;
  description?: string;
  createdAt: string;
}

export interface IncidentDetail extends Incident {
  touristName: string;
  touristPhone?: string;
  safetyId?: string;
  destinationName?: string;
  assignedResponderId?: string;
  assignedResponderName?: string;
  assignedResponderUnit?: string;
  events: IncidentEvent[];
  evidenceFiles?: EvidenceFile[];
}

export interface ResponderSummary {
  id: string;
  userId: string;
  name: string;
  phone: string;
  unitName: string;
  availabilityStatus: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  lastLatitude?: number;
  lastLongitude?: number;
  activeAssignments: number;
}

export interface TriggerSosDto {
  latitude?: number;
  longitude?: number;
  description?: string;
}

export interface AssignResponderDto {
  responderId: string;
}

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  CREATED: 'SOS received — help is being notified',
  ACKNOWLEDGED: 'Command center has acknowledged your SOS',
  ASSIGNED: 'A responder has been assigned to you',
  DISPATCHED: 'Responder is on the way',
  REACHED: 'Responder has reached your location',
  RESOLVED: 'Incident resolved — you are safe',
  CANCELLED: 'SOS cancelled',
};

export const INCIDENT_STATUS_ORDER: IncidentStatus[] = [
  'CREATED',
  'ACKNOWLEDGED',
  'ASSIGNED',
  'DISPATCHED',
  'REACHED',
  'RESOLVED',
];

// ----------------------------------------------------
// Risk Zones & Geofencing (Phase 4)
// ----------------------------------------------------

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface RiskZone {
  id: string;
  name: string;
  description: string;
  riskLevel: RiskLevel;
  polygon: GeoJsonPolygon;
  active: boolean;
  createdAt: string;
}

export interface MatchedZone {
  id: string;
  name: string;
  riskLevel: RiskLevel;
  description: string;
}

export interface GeofenceCheckRequest {
  latitude: number;
  longitude: number;
  tripId?: string;
  lastAlertedZoneId?: string;
}

export interface GeofenceCheckResult {
  inside: boolean;
  matchedZones: MatchedZone[];
  highestRisk: RiskLevel | null;
  message: string;
  shouldAlert: boolean;
  alertZoneId?: string;
}

export interface GeofenceAlertPayload {
  zoneId: string;
  zoneName: string;
  riskLevel: RiskLevel;
  message: string;
  latitude: number;
  longitude: number;
  touristName?: string;
}

export interface OpsMapData {
  zones: RiskZone[];
  incidents: IncidentSummary[];
  responders: ResponderSummary[];
}

export const RISK_LEVEL_ORDER: Record<RiskLevel, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

// ----------------------------------------------------
// Audit, Notifications & Evidence (Phase 5)
// ----------------------------------------------------

export interface AuditIntegrityResult {
  incidentId: string;
  verified: boolean;
  totalEvents: number;
  brokenAtEventId?: string;
  message: string;
}

export interface AuditEventFeedItem {
  id: string;
  incidentId: string;
  incidentType: IncidentType;
  incidentStatus: IncidentStatus;
  touristName: string;
  actorId: string;
  actorName: string;
  eventType: IncidentEventType;
  previousHash: string;
  currentHash: string;
  createdAt: string;
}

export interface AuditIncidentSummary {
  id: string;
  type: IncidentType;
  status: IncidentStatus;
  touristName: string;
  eventCount: number;
  lastEventAt: string;
}

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'MOCKED';

export interface NotificationRecord {
  id: string;
  userId: string;
  userName?: string;
  incidentId?: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  payload: string;
  attempts: number;
  createdAt: string;
  sentAt?: string;
}

export const INCIDENT_EVENT_LABELS: Record<IncidentEventType, string> = {
  SOS_TRIGGERED: 'SOS Triggered',
  ACKNOWLEDGED: 'Acknowledged',
  ASSIGNED: 'Responder Assigned',
  DISPATCHED: 'Dispatched',
  REACHED: 'Responder Reached',
  RESOLVED: 'Resolved',
  CANCELLED: 'Cancelled',
  NOTE_ADDED: 'Note / Evidence Added',
};

export const DEMO_LOCATIONS = {
  safeCorridor: { lat: 27.328, lng: 88.6045, label: 'Safe Tourism Corridor' },
  viewpointRidge: { lat: 27.335, lng: 88.620, label: 'Viewpoint Ridge (HIGH)' },
  mgMarg: { lat: 27.3305, lng: 88.610, label: 'MG Marg Festival Zone' },
  remoteNorth: { lat: 27.34, lng: 88.6275, label: 'Remote North Route (CRITICAL)' },
  defaultStart: { lat: 27.325, lng: 88.600, label: 'Outside all zones' },
} as const;

// ----------------------------------------------------
// Risk Scoring & Analytics (Phase 6)
// ----------------------------------------------------

export type {
  RiskScoreExplanation,
  RiskScoreInput,
} from './risk-scoring';

export {
  scoreToSeverity,
  computeRiskScore,
  capRiskScore,
  RISK_SCORE_CAP,
  MAX_ACCUMULATED_RULE_SCORE,
} from './risk-scoring';

export interface DashboardSummary {
  totalActive: number;
  activeBySeverity: Record<IncidentSeverity, number>;
  averageResponseTimeMinutes: number | null;
  criticalCount: number;
  resolvedToday: number;
}

export interface DemoPlaybook {
  title: string;
  steps: string[];
  highRiskLocation: (typeof DEMO_LOCATIONS)['remoteNorth'];
  suggestedSosPayload: { latitude: number; longitude: number; description?: string };
  demoIncidentId?: string;
  autoTriggered?: boolean;
  expectedRiskScore?: number;
  expectedSeverity?: IncidentSeverity;
  expectedReasonCount?: number;
}

export interface SimulateDemoResponse {
  message: string;
  playbook: DemoPlaybook;
}


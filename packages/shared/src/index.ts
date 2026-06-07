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
  touristName: string;
  safetyId?: string;
  destinationName?: string;
  assignedResponderName?: string;
  createdAt: string;
  updatedAt: string;
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


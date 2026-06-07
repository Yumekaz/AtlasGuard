import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { GeofenceAlertPayload, IncidentDetail } from '@atlasguard/shared';

@WebSocketGateway({
  namespace: '/events',
  cors: { origin: '*' },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private jwtService: JwtService) {}

  handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers?.authorization as string)?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user = {
        id: payload.sub,
        role: payload.role,
        email: payload.email,
        name: payload.name,
      };

      client.data.user = user;

      if (user.role === 'OPERATOR' || user.role === 'ADMIN') {
        client.join('operators');
      }
      if (user.role === 'RESPONDER' || user.role === 'ADMIN') {
        client.join('responders');
      }
      client.join(`user:${user.id}`);
      if (user.role === 'TOURIST') {
        client.join(`tourist:${user.id}`);
      }
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket) {}

  @SubscribeMessage('joinIncident')
  handleJoinIncident(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { incidentId: string } | string,
  ) {
    const incidentId = typeof data === 'string' ? data : data?.incidentId;
    if (incidentId) {
      client.join(`incident:${incidentId}`);
    }
  }

  emitIncidentCreated(incident: IncidentDetail) {
    this.server.to('operators').emit('incident.created', incident);
  }

  emitIncidentUpdated(incident: IncidentDetail, touristUserId: string) {
    this.server.to('operators').emit('incident.updated', incident);
    this.server.to(`tourist:${touristUserId}`).emit('incident.updated', incident);
    this.server.to(`incident:${incident.id}`).emit('incident.updated', incident);
  }

  emitGeofenceAlert(payload: GeofenceAlertPayload & { touristUserId: string }) {
    const { touristUserId, ...alert } = payload;
    this.server.to(`tourist:${touristUserId}`).emit('geofence.alert', alert);
    this.server.to('operators').emit('geofence.alert', alert);
  }

  emitResponderAssigned(payload: {
    incidentId: string;
    responderUserId: string;
    touristUserId: string;
    assignment: IncidentDetail;
  }) {
    this.server.to('operators').emit('incident.updated', payload.assignment);
    this.server.to('responders').emit('responder.assigned', payload);
    this.server.to(`user:${payload.responderUserId}`).emit('responder.assigned', payload);
    this.server.to(`tourist:${payload.touristUserId}`).emit('incident.updated', payload.assignment);
    this.server.to(`incident:${payload.incidentId}`).emit('incident.updated', payload.assignment);
  }
}
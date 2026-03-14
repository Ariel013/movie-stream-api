import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';

/**
 * Real-time event gateway.
 * Each authenticated user joins a room keyed by their userId.
 * Facility-level broadcasts go to a room keyed by facilityId.
 */
@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL }, namespace: '/events' })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const userId    = client.handshake.auth.userId as string;
    const facilityId = client.handshake.auth.facilityId as string;

    if (!userId) { client.disconnect(); return; }

    client.join(`user:${userId}`);
    if (facilityId) client.join(`facility:${facilityId}`);
  }

  handleDisconnect(client: Socket) {
    // rooms are cleaned up automatically by Socket.IO
  }

  /** Send a notification to a specific user. */
  notifyUser(userId: string, event: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  /** Broadcast a stock-level update to all members of a facility. */
  broadcastToFacility(facilityId: string, event: string, payload: unknown) {
    this.server.to(`facility:${facilityId}`).emit(event, payload);
  }
}

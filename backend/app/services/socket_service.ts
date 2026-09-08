import { Server } from 'socket.io'
import type { Server as HttpServer } from 'node:http'
let io: Server | null = null
export function initSocket(server: HttpServer) { io = new Server(server,{cors:{origin:true,credentials:true}}); io.on('connection',(socket)=>{socket.on('subscribe:kit',({kitId}:any = {})=>{if(!kitId)return; socket.join(`kit:${kitId}`);socket.emit('subscribed:kit',{kitId,room:`kit:${kitId}`})});socket.on('unsubscribe:kit',({kitId}:any = {})=>{if(kitId)socket.leave(`kit:${kitId}`)})}); return io }

/**
 * Émet la télémétrie en temps réel vers la room du kit spécifique.
 * Utilisé pour les détails d'un kit individuel.
 */
export function emitLiveTelemetry(kitId:string,enriched:any,raw:any=null){
  if(!io||!kitId)return;
  const payload = {kitId,timestamp:new Date().toISOString(),enriched,raw};

  // Émission ciblée vers la room du kit
  io.to(`kit:${kitId}`).emit('telemetry:live',payload);

  // Broadcast global : le dashboard écoute cet événement pour le compteur "En Ligne"
  // On n'envoie que les données légères (kitId + timestamp) pour ne pas saturer le réseau
  io.emit('fleet:active_kit',{kitId,timestamp:payload.timestamp});
}

export function emitGeofenceAlert(data:any){io?.emit('geofence_alert',data)}
export function getIO(){if(!io)throw new Error('Socket.io n\'est pas initialisé');return io}

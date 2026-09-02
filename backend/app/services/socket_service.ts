import { Server } from 'socket.io'
import type { Server as HttpServer } from 'node:http'
let io: Server | null = null
export function initSocket(server: HttpServer) { io = new Server(server,{cors:{origin:true,credentials:true}}); io.on('connection',(socket)=>{socket.on('subscribe:kit',({kitId}:any = {})=>{if(!kitId)return; socket.join(`kit:${kitId}`);socket.emit('subscribed:kit',{kitId,room:`kit:${kitId}`})});socket.on('unsubscribe:kit',({kitId}:any = {})=>{if(kitId)socket.leave(`kit:${kitId}`)})}); return io }
export function emitLiveTelemetry(kitId:string,enriched:any,raw:any=null){if(io&&kitId)io.to(`kit:${kitId}`).emit('telemetry:live',{kitId,timestamp:new Date().toISOString(),enriched,raw})}
export function emitGeofenceAlert(data:any){io?.emit('geofence_alert',data)}
export function getIO(){if(!io)throw new Error('Socket.io n�est pas initialis�');return io}

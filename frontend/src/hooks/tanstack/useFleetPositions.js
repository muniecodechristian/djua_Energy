import { useEffect, useMemo, useState } from 'react';
import { getAppSocket } from '../../lib/socket';
import { gpsPosition } from '../../lib/geofence';

export function positionSample(row, fallbackTime) {
  const position=gpsPosition(row?.latitude,row?.longitude)||gpsPosition(row?.gpsCoordinates?.latitude,row?.gpsCoordinates?.longitude);
  const rawTime=row?.event_time??row?.createdAt??row?.timestamp??fallbackTime;
  const number=Number(rawTime);
  const time=Number.isFinite(number)&&number>0?(number<1e12?number*1000:number):new Date(rawTime).getTime();
  return position&&Number.isFinite(time)?{...position,time}:null;
}
export function mergePositionSamples(samples) {
  return samples.filter(Boolean).sort((a,b)=>a.time-b.time).filter((p,i,all)=>i===0||p.time!==all[i-1].time||p.latitude!==all[i-1].latitude||p.longitude!==all[i-1].longitude).slice(-32);
}
export function useFleetPositions(kits,records) {
  const [live,setLive]=useState({});
  const ids=JSON.stringify(kits.map(k=>k.kitId).filter(Boolean).sort());
  useEffect(()=>{
    const kitIds=JSON.parse(ids),allowed=new Set(kitIds),socket=getAppSocket();
    const subscribe=()=>kitIds.forEach(kitId=>socket.emit('subscribe:kit',{kitId}));
    const receive=event=>{
      if(!allowed.has(event?.kitId))return;
      const samples=mergePositionSamples([...(event.enriched?.records||[]),event.raw].map(row=>positionSample(row,event.timestamp)));
      if(samples.length)setLive(old=>({...old,[event.kitId]:mergePositionSamples([...(old[event.kitId]||[]),...samples])}));
    };
    socket.on('connect',subscribe);socket.on('telemetry:live',receive);if(socket.connected)subscribe();
    return()=>{socket.off('connect',subscribe);socket.off('telemetry:live',receive);kitIds.forEach(kitId=>socket.emit('unsubscribe:kit',{kitId}));};
  },[ids]);
  return useMemo(()=>{
    const grouped=new Map();
    for(const row of records){const sample=positionSample(row);if(sample&&row.kitId){const list=grouped.get(row.kitId)||[];list.push(sample);grouped.set(row.kitId,list);}}
    return kits.map(kit=>{
      const trail=mergePositionSamples([...(grouped.get(kit.kitId)||[]),...(live[kit.kitId]||[])]);
      const reference=gpsPosition(kit.gpsCoordinates?.latitude,kit.gpsCoordinates?.longitude);
      return {kitId:kit.kitId,reference,trail,position:trail.at(-1)||null};
    });
  },[kits,records,live]);
}

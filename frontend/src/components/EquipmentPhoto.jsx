import { useState } from 'react';
import { ImageOff } from 'lucide-react';
const base=import.meta.env.BASE_URL+'equipment/';
export function equipmentPhoto(name='') {
 const key=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const entries=[[/decodeur|decoder/,'decoder'],[/television|\btv\b/,'tv'],[/refriger|frigo/,'fridge'],[/congel/,'freezer'],[/ventilat/,'fan'],[/climat/,'aircon'],[/ordinateur|laptop/,'laptop'],[/ampoule|lampe|led/,'light'],[/pompe/,'pump'],[/repass/,'iron'],[/laver/,'washer'],[/enseigne/,'sign'],[/panneau|solaire|solar/,'solar']];
 const match=entries.find(([pattern])=>pattern.test(key));return match?base+match[1]+'.jpg':null;
}
export default function EquipmentPhoto({name,src,className=''}) {
 const [failed,setFailed]=useState('');const url=src||equipmentPhoto(name);
 return <span className={`equipment-photo ${className}`}>{url&&failed!==url?<img src={url} alt={name||'Équipement'} loading="lazy" draggable={false} onError={()=>setFailed(url)}/>:<span className="equipment-photo-missing"><ImageOff size={20}/><span>Photo indisponible</span></span>}</span>;
}
export function WhatsAppIcon({size=18,...props}) {return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}><path d="M20.52 3.48A11.9 11.9 0 0 0 12.04 0C5.46 0 .1 5.35.1 11.94c0 2.1.55 4.15 1.6 5.96L0 24l6.25-1.64a11.9 11.9 0 0 0 5.78 1.47h.01c6.58 0 11.94-5.35 11.94-11.94 0-3.19-1.24-6.18-3.46-8.41ZM12.04 21.8a9.9 9.9 0 0 1-5.03-1.38l-.36-.21-3.71.97.99-3.62-.24-.37a9.88 9.88 0 0 1-1.52-5.25c0-5.46 4.44-9.9 9.9-9.9a9.85 9.85 0 0 1 7 2.9 9.85 9.85 0 0 1 2.9 7c0 5.46-4.44 9.9-9.93 9.86Zm5.43-7.4c-.3-.15-1.76-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.09 4.49.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.29.18-1.42-.08-.12-.28-.2-.58-.35Z"/></svg>;}

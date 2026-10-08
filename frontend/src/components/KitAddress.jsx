import { useQuery } from '@tanstack/react-query';
import { coordinates } from '../lib/operations';
let addressQueue = Promise.resolve();
export default function KitAddress({kit}) {
 const address=[kit.physicalAddress,kit.adresse,kit.address,kit.site?.adresse].find(v=>typeof v==='string' && v.trim());
 const point=coordinates(kit);
 const query=useQuery({queryKey:['kit-address',...(point||[])],enabled:false,staleTime:Infinity,retry:false,queryFn:()=>{
 const request=addressQueue.then(async()=>{
 const response=await fetch('https://nominatim.openstreetmap.org/reverse?'+new URLSearchParams({format:'jsonv2','accept-language':'fr',zoom:'18',lat:String(point[0]),lon:String(point[1])}));
 if(!response.ok) throw new Error('Adresse indisponible');
 const data=await response.json();if(!data.display_name) throw new Error('Adresse introuvable');return data.display_name;});
 addressQueue=request.catch(()=>{}).then(()=>new Promise(resolve=>setTimeout(resolve,1100)));
 return request;}});
 if(address) return <span>{address}</span>;
 if(query.data) return <span>{query.data}<small>Adresse estimée depuis le GPS · © OpenStreetMap</small></span>;
 if(!point) return <span>Adresse non renseignée</span>;
 return <button type="button" className="ops-text-link" disabled={query.isFetching} onClick={e=>{e.stopPropagation();query.refetch();}}>{query.isFetching?'Recherche…':query.isError?'Réessayer':'Rechercher l’adresse'}</button>;
}

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ZoomIn, ZoomOut, RotateCcw, Globe2 } from 'lucide-react';
import { distanceMeters } from '../lib/geofence';
const xyz=(p,r=100)=>{const lat=p.latitude*Math.PI/180,lon=p.longitude*Math.PI/180;return new THREE.Vector3(r*Math.cos(lat)*Math.cos(lon),r*Math.sin(lat),-r*Math.cos(lat)*Math.sin(lon));};

export default function FleetGlobe({sites,onSelect}) {
  const host=useRef(null),api=useRef(null),choose=useRef(onSelect);
  const [hover,setHover]=useState(''),[unavailable,setUnavailable]=useState(false);
  useEffect(()=>{choose.current=onSelect;},[onSelect]);
  useEffect(()=>{
    let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{queueMicrotask(()=>setUnavailable(true));return;}
    const element=host.current;renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));element.appendChild(renderer.domElement);
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.02,3000),controls=new OrbitControls(camera,renderer.domElement);
    controls.enableDamping=false;controls.minDistance=1;controls.maxDistance=600;
    scene.add(new THREE.HemisphereLight(0xffffff,0x29493b,3));
    const sun=new THREE.DirectionalLight(0xffffff,2.5);sun.position.set(150,180,120);scene.add(sun);
    const globeMaterial=new THREE.MeshBasicMaterial({color:0x698b80});
    let disposed=false;
    const earthTexture=new THREE.TextureLoader().load(import.meta.env.BASE_URL+'maps/earth-blue-marble.png',texture=>{if(disposed){texture.dispose();return;}texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());globeMaterial.map=texture;globeMaterial.color.set(0xffffff);globeMaterial.needsUpdate=true;renderer.render(scene,camera);});
    const globe=new THREE.Mesh(new THREE.SphereGeometry(100,96,64),globeMaterial);scene.add(globe);
    const grid=new THREE.Group();scene.add(grid);
    for(let lat=-75;lat<=75;lat+=15){const pts=Array.from({length:129},(_,i)=>xyz({latitude:lat,longitude:i/128*360},100.1));grid.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x9bb6a8,transparent:true,opacity:.17})));}
    for(let lon=0;lon<360;lon+=15){const pts=Array.from({length:65},(_,i)=>xyz({latitude:-90+i/64*180,longitude:lon},100.1));grid.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x9bb6a8,transparent:true,opacity:.17})));}
    const markers=new THREE.Group(),traces=new THREE.Group();scene.add(markers,traces);
    const render=()=>{const unit=2*Math.tan(camera.fov*Math.PI/360)/Math.max(1,element.clientHeight);for(const item of markers.children){if(item.isSprite)item.scale.set(50*unit,13*unit,1);}renderer.render(scene,camera);};
    const clear=group=>{while(group.children.length){const child=group.children[0];if(!child.isSprite)child.geometry?.dispose();child.material?.map?.dispose();child.material?.dispose();group.remove(child);}};
    let defaultTarget=new THREE.Vector3(100,0,0),defaultDistance=80;
    const reset=()=>{controls.minDistance=1;const normal=defaultTarget.clone().normalize();camera.up.copy(normal);controls.target.copy(defaultTarget);camera.position.copy(defaultTarget).addScaledVector(normal,defaultDistance);camera.position.y+=defaultDistance*.15;controls.update();render();};
    const world=()=>{controls.minDistance=108;camera.up.set(0,1,0);controls.target.set(0,0,0);camera.position.copy(defaultTarget.clone().normalize().multiplyScalar(330));controls.update();render();};
    const zoom=factor=>{const direction=camera.position.clone().sub(controls.target).multiplyScalar(factor).clampLength(controls.minDistance,600);camera.position.copy(controls.target).add(direction);controls.update();render();};
    const update=values=>{
      clear(markers);clear(traces);
      const located=values.filter(s=>s.position||s.reference);
      if(located.length){const vectors=located.map(s=>xyz(s.position||s.reference));const bounds=new THREE.Box3().setFromPoints(vectors);bounds.getCenter(defaultTarget);const extent=bounds.getSize(new THREE.Vector3()).length();defaultTarget.normalize().multiplyScalar(100);defaultDistance=Math.max(12,Math.min(260,extent*1.8));
        const radius=Math.max(.6,Math.min(2,extent*.025));
        for(const site of located){const current=site.position||site.reference;const outside=site.position&&site.reference&&distanceMeters(site.reference,site.position)>90;const material=new THREE.MeshStandardMaterial({color:outside?0xe66b53:site.position?0xf4c46c:0xd5e5df,emissive:0x39230f,emissiveIntensity:.15});const marker=new THREE.Mesh(new THREE.SphereGeometry(radius,14,12),material);marker.position.copy(xyz(current,100+radius*.8));marker.userData.kitId=site.kitId;markers.add(marker);
          const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const context=canvas.getContext('2d');context.fillStyle='#17251f';context.fillRect(0,0,256,64);context.strokeStyle=outside?'#e66b53':'#c9dcd0';context.lineWidth=3;context.strokeRect(2,2,252,60);context.fillStyle='#f1f6f2';context.font='500 26px sans-serif';context.textAlign='center';context.textBaseline='middle';context.fillText(site.kitId,128,32,240);
          const texture=new THREE.CanvasTexture(canvas);const label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,sizeAttenuation:false}));label.position.copy(xyz(current,100+radius*2.8));label.scale.set(radius*8,radius*2,1);label.userData.kitId=site.kitId;markers.add(label);
          if(site.trail.length>1){const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(site.trail.map(p=>xyz(p,100+radius*.7))),new THREE.LineBasicMaterial({color:0xf4c46c}));traces.add(line);}
        }
      }
      render();
    };
    let initialized=false;
    const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let start;
    const hit=e=>{const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);return ray.intersectObjects(markers.children)[0]?.object.userData.kitId;};
    const down=e=>{start=[e.clientX,e.clientY];};
    const up=e=>{if(start&&Math.hypot(e.clientX-start[0],e.clientY-start[1])<5){const id=hit(e);if(id)choose.current(id);}};
    const move=e=>{setHover(hit(e)||'');};
    const resize=()=>{const w=element.clientWidth,h=element.clientHeight;if(w&&h){renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();render();}};
    renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointermove',move);
    controls.addEventListener('change',render);const observer=new ResizeObserver(resize);observer.observe(element);
    api.current={zoom,reset,world,update:values=>{update(values);if(!initialized&&values.some(s=>s.position||s.reference)){world();initialized=true;}}};resize();
    return()=>{disposed=true;earthTexture.dispose();api.current=null;observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('pointermove',move);clear(markers);clear(traces);clear(grid);globe.geometry.dispose();globeMaterial.dispose();renderer.dispose();renderer.domElement.remove();};
  },[]);
  useEffect(()=>{api.current?.update(sites);},[sites]);
  const located=sites.filter(s=>s.position||s.reference).length;
  return <div className="geofence-scene fleet-globe">
    <div ref={host} className="fleet-globe-canvas" aria-label="Vue géographique 3D de tous les kits. Cliquez sur un repère pour ouvrir son site."/>
    <span className="geofence-north">{located} / {sites.length} kits localisés</span>
    {hover&&<span className="fleet-globe-hover">{hover} · Ouvrir le site</span>}
    {(unavailable||!located)&&<p className="geofence-unavailable">{unavailable?'La 3D est indisponible. Sélectionnez un kit dans la liste.':'Aucune position GPS disponible pour le parc.'}</p>}
    <div className="geofence-camera-tools"><button onClick={()=>api.current?.world()} aria-label="Afficher le monde en 3D" title="Vue mondiale"><Globe2 size={15}/></button><button onClick={()=>api.current?.zoom(.7)} aria-label="Zoomer sur le parc 3D"><ZoomIn size={15}/></button><button onClick={()=>api.current?.zoom(1.4)} aria-label="Dézoomer du parc 3D"><ZoomOut size={15}/></button><button onClick={()=>api.current?.reset()} aria-label="Recentrer tous les kits"><RotateCcw size={14}/></button></div>
    <a className="geofence-scene-note globe-attribution" href="https://visibleearth.nasa.gov/images/57730/the-blue-marble-land-surface-ocean-color-and-sea-ice" target="_blank" rel="noreferrer">Fond terrestre : NASA Blue Marble · Repères GPS des kits</a>
  </div>;
}

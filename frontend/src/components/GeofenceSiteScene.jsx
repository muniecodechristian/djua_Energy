import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ZoomIn, ZoomOut, Home, Scan, RotateCcw } from 'lucide-react';

export default function GeofenceSiteScene({ offset, outside, simulated, onGroundPick, trail = [] }) {
  const host=useRef(null), api=useRef(null), pick=useRef(onGroundPick);
  const [unsupported,setUnsupported]=useState(false);
  useEffect(()=>{ pick.current=onGroundPick; },[onGroundPick]);
  useEffect(()=>{
    const element=host.current;
    let renderer;
    try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true}); }
    catch { queueMicrotask(()=>setUnsupported(true)); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
    element.appendChild(renderer.domElement);
    const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(40,1,0.1,50000);
    const controls=new OrbitControls(camera,renderer.domElement);
    controls.enableDamping=false; controls.minDistance=18; controls.maxDistance=30000;
    controls.maxPolarAngle=Math.PI/2.04; controls.enablePan=true;
    const render=()=>renderer.render(scene,camera);
    scene.add(new THREE.HemisphereLight(0xffffff,0x687a69,3));
    const sun=new THREE.DirectionalLight(0xffffff,3.5); sun.position.set(60,160,90); scene.add(sun);
    const materials=[];
    const material=(color,extra={})=>{const m=new THREE.MeshStandardMaterial({color,roughness:.8,...extra});materials.push(m);return m;};
    const ground=new THREE.Mesh(new THREE.CircleGeometry(190,96),material(0x89988a));ground.rotation.x=-Math.PI/2;ground.position.y=-.1;scene.add(ground);
    const grid=new THREE.GridHelper(360,36,0x586f62,0x586f62);grid.material.transparent=true;grid.material.opacity=.18;scene.add(grid);
    const box=(size,pos,color,rotation=0)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),material(color));mesh.position.set(...pos);mesh.rotation.x=rotation;scene.add(mesh);return mesh;};
    box([17,.12,160],[0,.03,85],0xb6b6a5);
    box([15,.2,12],[0,.12,0],0xd2cebd);
    box([12,5,9],[0,2.7,0],0xe8dcc4);
    box([14,.35,5.8],[0,6.15,2.35],0x8b6551,.43);
    box([14,.35,5.8],[0,6.15,-2.35],0x8b6551,-.43);
    box([2,3,.12],[0,1.7,4.57],0x645a4b);
    for(const x of [-3.7,3.7]) box([2,1.7,.14],[x,3.1,4.58],0x63858c);
    for(const x of [-2.7,0,2.7]) box([2.3,.16,2.8],[x,6.6,2.4],0x233c4b,.43);
    const boundaryMaterial=material(0x2f8f73,{transparent:true,opacity:.09,side:THREE.DoubleSide,depthWrite:false});
    const fence=new THREE.Mesh(new THREE.CylinderGeometry(90,90,8,128,1,true),boundaryMaterial);fence.position.y=4;scene.add(fence);
    const rimMaterial=new THREE.LineBasicMaterial({color:0x2f8f73});materials.push(rimMaterial);
    const rimPoints=Array.from({length:129},(_,i)=>new THREE.Vector3(Math.cos(i/128*Math.PI*2)*90,.3,Math.sin(i/128*Math.PI*2)*90));
    const rim=new THREE.Line(new THREE.BufferGeometry().setFromPoints(rimPoints),rimMaterial);scene.add(rim);
    const markerMaterial=material(0x27745b);
    const marker=new THREE.Group();marker.visible=false;scene.add(marker);
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(1,1,9,16),markerMaterial);stem.position.y=4.5;marker.add(stem);
    const dot=new THREE.Mesh(new THREE.SphereGeometry(3.1,20,16),markerMaterial);dot.position.y=11;marker.add(dot);
    const kitBody=new THREE.Mesh(new THREE.BoxGeometry(1.3,1.8,.8),material(0xe8e3d5));kitBody.position.set(1.4,1,0);marker.add(kitBody);
    const kitPanel=new THREE.Mesh(new THREE.BoxGeometry(2.8,.15,1.8),material(0x233c4b));kitPanel.position.set(1.4,2.1,0);kitPanel.rotation.z=-.2;marker.add(kitPanel);
    const trailMaterial=new THREE.LineBasicMaterial({color:0xe4b04d});materials.push(trailMaterial);
    const trace=new THREE.Line(new THREE.BufferGeometry(),trailMaterial);scene.add(trace);
    let animationFrame=0;
    const lineMaterial=new THREE.LineDashedMaterial({color:0x344b50,dashSize:3,gapSize:2});materials.push(lineMaterial);
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,.5,0),new THREE.Vector3(0,.5,0)]),lineMaterial);scene.add(line);
    const northPoints=[new THREE.Vector3(-4,.3,-115),new THREE.Vector3(0,.3,-123),new THREE.Vector3(4,.3,-115)];
    const north=new THREE.Line(new THREE.BufferGeometry().setFromPoints(northPoints),new THREE.LineBasicMaterial({color:0x394d47}));materials.push(north.material);scene.add(north);
    const reset=()=>{controls.target.set(0,0,0);camera.position.set(165,175,190);controls.update();render();};
    const home=()=>{controls.target.set(0,3,0);camera.position.set(24,24,29);controls.update();render();};
    const fit=()=>{const r=Math.max(130,Math.hypot(marker.position.x,marker.position.z)*.65);controls.target.set(marker.position.x/2,0,marker.position.z/2);camera.position.copy(controls.target).add(new THREE.Vector3(r,r,r));controls.update();render();};
    const zoom=factor=>{const direction=camera.position.clone().sub(controls.target).multiplyScalar(factor).clampLength(18,30000);camera.position.copy(controls.target).add(direction);controls.update();render();};
    const resize=()=>{const w=element.clientWidth,h=element.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();render();};
    const ray=new THREE.Raycaster(),mouse=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);let down;
    const start=e=>{down=[e.clientX,e.clientY];};
    const end=e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const rect=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-((e.clientY-rect.top)/rect.height)*2+1);ray.setFromCamera(mouse,camera);const p=new THREE.Vector3();if(ray.ray.intersectPlane(plane,p))pick.current?.(p.x,-p.z);};
    const lost=e=>{e.preventDefault();setUnsupported(true);};
    renderer.domElement.addEventListener('pointerdown',start);renderer.domElement.addEventListener('pointerup',end);renderer.domElement.addEventListener('webglcontextlost',lost);
    controls.addEventListener('change',render);
    const observer=new ResizeObserver(resize);observer.observe(element);
    api.current={reset,home,fit,zoom,update:(value,isOutside,isSimulated,history)=>{
      const wasVisible=marker.visible;cancelAnimationFrame(animationFrame);
      marker.visible=Boolean(value);line.visible=Boolean(value);
      trace.geometry.dispose();trace.geometry=new THREE.BufferGeometry().setFromPoints(history.map(p=>new THREE.Vector3(p.east,.8,-p.north)));trace.visible=history.length>1;
      if(value){
        const target=new THREE.Vector3(value.east,0,-value.north),start=marker.position.clone();
        const array=line.geometry.attributes.position;array.setXYZ(1,value.east,.5,-value.north);array.needsUpdate=true;line.computeLineDistances();line.geometry.computeBoundingSphere();
        if(wasVisible&&!isSimulated&&start.distanceTo(target)>.01&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){const began=performance.now();const animate=now=>{const t=Math.min(1,(now-began)/650);marker.position.lerpVectors(start,target,t);render();if(t<1)animationFrame=requestAnimationFrame(animate);};animationFrame=requestAnimationFrame(animate);}else marker.position.copy(target);
      }
      markerMaterial.color.set(isSimulated?0xd29137:isOutside?0xc14e43:0x27745b);boundaryMaterial.color.set(isOutside?0xc14e43:0x2f8f73);rimMaterial.color.copy(boundaryMaterial.color);render();
    }};
    reset();resize();
    return ()=>{cancelAnimationFrame(animationFrame);api.current=null;observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',start);renderer.domElement.removeEventListener('pointerup',end);renderer.domElement.removeEventListener('webglcontextlost',lost);scene.traverse(o=>o.geometry?.dispose());materials.forEach(m=>m.dispose());grid.material.dispose();renderer.dispose();renderer.domElement.remove();};
  },[]);
  useEffect(()=>{api.current?.update(offset,outside,simulated,trail);},[offset,outside,simulated,trail]);
  return <div className="geofence-scene">
    <div ref={host} className="geofence-canvas" aria-label="Site 3D : glisser pour tourner, molette pour zoomer, clic droit pour déplacer la vue" />
    {unsupported&&<p className="geofence-unavailable">La 3D est indisponible sur cet appareil. Les distances restent consultables ci-dessous.</p>}
    <span className="geofence-north">N ↑ · Cercle : 90 m</span>
    <div className="geofence-camera-tools">
      <button onClick={()=>api.current?.home()} aria-label="Zoom sur la maison" title="Maison"><Home size={15}/></button>
      <button onClick={()=>api.current?.fit()} aria-label="Voir le périmètre et la position" title="Périmètre et position"><Scan size={15}/></button>
      <button onClick={()=>api.current?.zoom(.75)} aria-label="Zoomer sur le site"><ZoomIn size={15}/></button>
      <button onClick={()=>api.current?.zoom(1.3)} aria-label="Dézoomer du site"><ZoomOut size={15}/></button>
      <button onClick={()=>api.current?.reset()} aria-label="Réinitialiser le site 3D"><RotateCcw size={14}/></button>
    </div>
    <span className="geofence-scene-note">Maison schématique · Échelle en mètres · Sans imagerie satellite</span>
  </div>;
}

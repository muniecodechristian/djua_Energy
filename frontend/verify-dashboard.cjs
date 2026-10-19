// Browser verification with isolated fixtures; run after building and serving on port 5188.
// Requires an available Chrome installation and the optional playwright package.
const { chromium }=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const geo=await import('./src/lib/geofence.js');
 const origin={latitude:-4,longitude:22};
 for(const invalid of [[null,22],['',22],[0,0],[91,22],[-4,181]]) assert.equal(geo.gpsPosition(...invalid),null);
 for(const meters of [0,45,89,90,91,120]) {
   const point=geo.destination(origin,meters);assert.ok(Math.abs(geo.distanceMeters(origin,point)-meters)<.00001);
   const offset=geo.offsetMeters(origin,point);assert.ok(Math.abs(Math.hypot(offset.east,offset.north)-meters)<.00001);
 }
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
 try {
 const page=await browser.newPage();const errors=[],writes=[],sockets=[];
 await page.routeWebSocket(/socket\.io/,ws=>{
   sockets.push(ws);
   ws.onMessage(message=>{const text=String(message);if(text==='40')ws.send('40'+JSON.stringify({sid:'test-socket'}));if(text==='2')ws.send('3');});
   ws.send('0'+JSON.stringify({sid:'test-engine',upgrades:[],pingInterval:25000,pingTimeout:20000,maxPayload:1000000}));
 });
 page.on('pageerror',e=>errors.push(e.message));
 const kits=[{kitId:'TEST-1',status:'active',gpsCoordinates:origin},{kitId:'TEST-2',status:'active',gpsCoordinates:origin},{kitId:'NO-GPS',status:'active'}];
 await page.route('**/*',async route=>{
   const url=new URL(route.request().url());if(url.port==='5188')return route.continue();
   if(!['GET','OPTIONS'].includes(route.request().method()))writes.push(url.pathname);
   if(url.pathname.includes('socket.io')||url.hostname.includes('tile.openstreetmap'))return route.abort();
   let data=[];
   if(url.pathname.includes('/users/orange/kits'))data=kits;
   if(url.pathname==='/api/ml/telemetry')data=[{records:[{event_time:new Date().toISOString(),...geo.destination(origin,120),solar_power_w:132}]}];
   if(url.pathname==='/api/telemetry')data=kits.map(k=>({kitId:k.kitId,createdAt:new Date().toISOString()}));
   return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'http://127.0.0.1:5188','access-control-allow-credentials':'true','access-control-allow-headers':'Content-Type,Authorization','access-control-allow-methods':'GET,POST,OPTIONS'},body:JSON.stringify({success:true,data})});
 });
 await page.setViewportSize({width:1366,height:768});
 await page.goto('http://127.0.0.1:5188/dashboard');
 await page.locator('.fleet-globe-canvas canvas').waitFor();
 assert.equal(await page.getByRole('combobox',{name:'Kit du site 3D'}).inputValue(),'all');
 await page.getByRole('combobox',{name:'Kit du site 3D'}).selectOption('TEST-1');
 await page.locator('.geofence-canvas canvas').waitFor();
 await page.locator('.geofence-status-line').filter({hasText:'Hors p'}).waitFor();
 assert.equal(await page.locator('.dashboard-map .leaflet-container').count(),1);
 const before=await page.locator('.geofence-canvas canvas').screenshot();
 await page.getByRole('button',{name:'Zoom sur la maison',exact:true}).click();
 const after=await page.locator('.geofence-canvas canvas').screenshot();assert.ok(!before.equals(after));
 const broadcast=distance=>{const timestamp=new Date(Date.now()+distance*100).toISOString();const point=geo.destination(origin,distance);const event={kitId:'TEST-1',timestamp,enriched:{request_id:'live-'+distance,records:[{...point,event_time:timestamp}]},raw:{...point}};for(const socket of sockets){try{socket.send('42'+JSON.stringify(['telemetry:live',event]));}catch{}}};
 await page.waitForTimeout(300);
 broadcast(45);
 await page.waitForFunction(()=>document.querySelector('.geofence-status-line')?.textContent.includes('45.0 m'));
 const positionBefore=await page.locator('.geofence-canvas canvas').screenshot();
 broadcast(140);
 await page.waitForFunction(()=>document.querySelector('.geofence-status-line')?.textContent.includes('140.0 m'));
 await page.waitForTimeout(700);
 const positionAfter=await page.locator('.geofence-canvas canvas').screenshot();assert.ok(!positionBefore.equals(positionAfter),'Live GPS must move the kit');
 assert.ok((await page.locator('.geofence-site-details').innerText()).includes('Trace GPS'));
 const simulation=page.getByRole('checkbox',{name:'Simuler un d'});
 await simulation.check();
 for(const [meters,outside] of [[89,false],[90,false],[91,true],[120,true]]) {
   await page.getByRole('slider').fill(String(meters));
   await page.waitForTimeout(50);
   const label=await page.locator('.geofence-status-line').innerText();
   assert.ok(label.includes('Simulation'));assert.equal(label.includes('Hors p'),outside,label);
 }
 await simulation.uncheck();assert.ok((await page.locator('.geofence-status-line').innerText()).includes('140.0 m'));
 await page.getByRole('button',{name:'Voir le p'}).click();
 const checks=[];
 for(const [width,height]of [[1366,768],[1920,1080],[1280,720],[390,844]]) {
   await page.setViewportSize({width,height});await page.waitForTimeout(150);
   const sizes=await page.evaluate(()=>{const el=document.querySelector('.ops-content');return{document:document.documentElement.scrollHeight-innerHeight,main:el.scrollHeight-el.clientHeight};});
   assert.ok(sizes.document<=1&&sizes.main<=1,JSON.stringify({width,height,...sizes}));checks.push({width,height,...sizes});
 }
 await page.setViewportSize({width:1366,height:768});
 const output=path.resolve('artifacts');fs.mkdirSync(output,{recursive:true});
 await page.screenshot({path:path.join(output,'dashboard-two-maps-light.png')});
 await page.getByRole('button',{name:'Agrandir la carte 3D'}).click();
 await page.waitForFunction(()=>Boolean(document.fullscreenElement));
 await page.getByRole('button',{name:'Zoom sur la maison',exact:true}).click();
 await page.screenshot({path:path.join(output,'geofence-house-fullscreen.png')});
 await page.evaluate(()=>document.exitFullscreen());
 await page.getByRole('combobox',{name:'Kit du site 3D'}).selectOption('NO-GPS');
 await page.getByText('Ce kit n’a pas de coordonnées de référence valides.',{exact:false}).waitFor();
 assert.equal(await page.getByRole('checkbox',{name:'Simuler un d'}).isDisabled(),true);
 await page.getByRole('combobox',{name:'Kit du site 3D'}).selectOption('TEST-2');
 await page.locator('.geofence-canvas canvas').waitFor();
 assert.equal(await simulation.isChecked(),false);
 await page.evaluate(()=>document.documentElement.classList.add('dark'));await page.waitForTimeout(400);
 await page.screenshot({path:path.join(output,'dashboard-two-maps-dark.png')});
 await page.getByRole('combobox',{name:'Kit du site 3D'}).selectOption('all');
 await page.locator('.fleet-globe-canvas canvas').waitFor();
 await page.screenshot({path:path.join(output,'dashboard-fleet-3d.png')});
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
 console.log(JSON.stringify({initialFleetView:'passed',liveSocketMovement:'passed',gpsTrail:'passed',geometry:'passed',thresholds:[89,90,91,120],houseZoom:'passed',fullscreen:'passed',missingGps:'passed',twoMaps:'passed',simulationWrites:writes,checks,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
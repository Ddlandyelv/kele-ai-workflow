import * as T from './assets/vendor/three.module.js';
import {GLTFLoader} from './assets/vendor/GLTFLoader.js';
import {RGBELoader} from './assets/vendor/RGBELoader.js';
import {RoundedBoxGeometry} from './assets/vendor/RoundedBoxGeometry.js';
// 独立样板房引擎：按米建模，按需渲染，和业务状态同步但不接管播放器。
let active=null;
const assetCache=new Map(), loader=new GLTFLoader();
function loadAsset(id){if(!assetCache.has(id))assetCache.set(id,loader.loadAsync(new URL(`./assets/showroom/${id}/${id}.gltf`,import.meta.url).href));return assetCache.get(id)}
const palette={wall:0xf5f1e9,wood:0xb39570,fabric:0xb7beb0,metal:0x606960};
function create(stage,kind){
 const W=kind==='buy'?8.2:6,D=kind==='buy'?10:7,split=kind==='buy'?4.3:3.3;
 const scene=new T.Scene();scene.background=new T.Color('#ecece5');
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 stage.querySelector('.model')?.remove();stage.querySelector('.model-tip')?.remove();stage.append(renderer.domElement);renderer.domElement.setAttribute('aria-label','可旋转、缩放的三维样板房');
 const camera=new T.PerspectiveCamera(37,1,.1,100);let yaw=-.7+((window.YANYE?.state.yaw??-28)+28)*Math.PI/180,pitch=.85+((window.YANYE?.state.pitch??55)-55)*Math.PI/180,zoom=1,focusRadius=null,target=new T.Vector3(W/2,.3,D/2),disposed=false;
 const model=new T.Group();model.name=kind==='buy'?'现代简约两居室案例':'现代简约一居室案例';model.userData={fictional:true,area:kind==='buy'?82:42,bedrooms:kind==='buy'?2:1,unit:'meter'};scene.add(model);
 function texture(fabric=false){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#f3eee4';ctx.fillRect(0,0,256,256);let seed=43;function rand(){seed=(seed*16807)%2147483647;return seed/2147483647}for(let i=0;i<1800;i++){ctx.strokeStyle=`rgba(70,50,28,${rand()*.13})`;ctx.lineWidth=fabric?.5:rand()*1.2;ctx.beginPath();let x=rand()*256,y=rand()*256;ctx.moveTo(x,y);ctx.lineTo(fabric?x+3:x+Math.sin(y)*3,fabric?y:y+20+rand()*70);ctx.stroke()}if(fabric){ctx.globalAlpha=.13;for(let n=0;n<256;n+=2){ctx.fillStyle=n%4?'#fff':'#777';ctx.fillRect(n,0,1,256);ctx.fillRect(0,n,256,1)}}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;return t}const woodTexture=texture(),clothTexture=texture(true);
 const materials=new Map();function mat(color,roughness=.7,metalness=0){const key=[color,roughness,metalness].join();if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness,metalness,map:([0xd0b58e,0xc9ad86,0xd6bd9c,0xcbb28f,0xc8ae8a,0xc4aa89,0x937b5e,0xb29b7d].includes(color)?woodTexture:[0xc2c9b7,0xa7b09e,0xb1bca8,0xaab8ac,0xaab4a2,0xd4cdc0].includes(color)?clothTexture:null)}));return materials.get(key)}
 function box(x,y,z,w,h,d,color=palette.wall,round=0){const geo=round?new RoundedBoxGeometry(w,h,d,3,Math.min(round,w/3,h/3,d/3)):new T.BoxGeometry(w,h,d);const mesh=new T.Mesh(geo,mat(color));mesh.position.set(x+w/2,y+h/2,z+d/2);mesh.castShadow=true;mesh.receiveShadow=true;model.add(mesh);return mesh}
 function cyl(x,y,z,r,h,color){const m=new T.Mesh(new T.CylinderGeometry(r,r*.95,h,24),mat(color));m.position.set(x,y+h/2,z);m.castShadow=true;m.receiveShadow=true;model.add(m);return m}
 function leaf(x,y,z,s){const m=new T.Mesh(new T.SphereGeometry(s,12,8),mat(0x577350));m.scale.set(.6,1.5,.7);m.position.set(x,y,z);m.rotation.z=x%1;model.add(m)}
 function plant(x,z){cyl(x,0,z,.16,.3,0xc6b7a0);cyl(x,.3,z,.025,.7,0x88745c);for(let i=0;i<7;i++)leaf(x+Math.sin(i*2)*.18,.6+i*.08,z+Math.cos(i*2)*.14,.16)}
 function lamp(x,z,y=.6){cyl(x,y,z,.12,.025,0x7e7769);cyl(x,y,z,.015,.34,0xa08b67);cyl(x,y+.25,z,.19,.23,0xf5e3bd)}
 function rug(x,z,w,d){box(x,.022,z,w,.015,d,0xd4cdc0,.01);for(let i=0;i<9;i++)box(x+.04+i*w/10,.039,z+.04,.01,.002,d-.08,0xc8c0b2)}
 function bed(x,z,w=1.6,d=2.05){rug(x-.25,z-.2,w+.5,d+.55);box(x,.09,z,w,.28,d,0x9f876d,.04);box(x-.04,.12,z-.06,w+.08,1,.1,0xb6a690,.04);box(x,.37,z,w,.23,d,0xf1eee5,.06);box(x,.60,z+.5,w,.06,d-.5,0xaab8ac,.03);const clothGeo=new T.PlaneGeometry(w,d-.48,30,40);const verts=clothGeo.attributes.position;for(let i=0;i<verts.count;i++){const xx=verts.getX(i),yy=verts.getY(i);verts.setZ(i,.025*Math.sin(xx*19+yy*5)+.012*Math.sin(yy*25+xx*7))}clothGeo.computeVertexNormals();const duvet=new T.Mesh(clothGeo,mat(0xaab8ac));duvet.rotation.x=-Math.PI/2;duvet.position.set(x+w/2,.69,z+.5+(d-.48)/2);duvet.castShadow=true;duvet.receiveShadow=true;model.add(duvet);box(x,.69,z+d-.55,w,.025,.4,0x8f9f91,.01);for(let a of [.08,w/2+.02])box(x+a,.6,z+.09,w/2-.12,.13,.42,0xfffbf1,.08);for(let a of [-.48,w+.08]){box(x+a,0,z+.1,.4,.53,.42,0xc4aa89,.02);box(x+a+.05,.3,z+.522,.3,.012,.008,0x93806a)}lamp(x-.28,z+.3,.53)}
 function chair(x,z){for(let a of [0,.36])for(let b of [0,.36])box(x+a,0,z+b,.04,.45,.04,0x9c805c);box(x-.03,.43,z-.03,.46,.09,.46,0xaab4a2,.04);box(x-.03,.5,z+.36,.46,.5,.07,0xaab4a2,.035)}
 // 地板逐板铺设，避免一块纯色平面。卫生间另铺砖。
 box(-.12,-.25,-.12,W+.24,.25,D+.24,0xc4b59c);
 const textureLoader=new T.TextureLoader();const localTextures=[];
 function floorTexture(file,color=false){const t=textureLoader.load(new URL('./assets/showroom/'+file,import.meta.url).href,()=>render());if(color)t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(W/2,D/2);localTextures.push(t);return t}
 const floor=box(0,0,0,W,.025,D,0xffffff);floor.material=new T.MeshStandardMaterial({map:floorTexture('wood-color.jpg',true),normalMap:floorTexture('wood-normal.jpg'),roughnessMap:floorTexture('wood-rough.jpg'),roughness:.9});
 const fabricColor=clothTexture;fabricColor.repeat.set(8,8);const fabricNormal=textureLoader.load(new URL('./assets/showroom/fabric-normal.jpg',import.meta.url).href,()=>render());fabricNormal.wrapS=fabricNormal.wrapT=T.RepeatWrapping;fabricNormal.repeat.set(4,4);localTextures.push(fabricNormal);const assetTasks=[];
 function asset(id,x,y,z,w,h,d,rotation=0){const task=loadAsset(id).then(gltf=>{if(disposed)return;const obj=gltf.scene.clone(true);obj.rotation.y=rotation;obj.updateMatrixWorld(true);let bounds=new T.Box3().setFromObject(obj),size=bounds.getSize(new T.Vector3());const scale=Math.min(w/size.x,h/size.y,d/size.z);obj.scale.multiplyScalar(scale);obj.updateMatrixWorld(true);bounds=new T.Box3().setFromObject(obj);obj.position.add(new T.Vector3(x-bounds.min.x,y-bounds.min.y,z-bounds.min.z));obj.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;n.userData.sharedAsset=true;if(id==='sofa_03'){n.material=new T.MeshStandardMaterial({color:0xc3c7bf,map:fabricColor,normalMap:fabricNormal,normalScale:new T.Vector2(.08,.08),roughness:.95});n.userData.ownedMaterial=true}}});obj.userData.asset=id;model.add(obj);render()});assetTasks.push(task);return task}
 // 后墙开窗：窗洞由上下墙、边柱组成，不用玻璃贴图冒充窗户。
 function windowWall(x,w){box(x,0,-.08,w,.88,.12);box(x,2.05,-.08,w,.55,.12);box(x,.88,-.08,.18,1.17,.12);box(x+w-.18,.88,-.08,.18,1.17,.12);let glass=box(x+.18,.9,-.025,w-.36,1.12,.025,0xc4d9da);glass.material=new T.MeshPhysicalMaterial({color:0xd2e3df,roughness:.15,transparent:true,opacity:.38});for(let xx of [x+.17,x+w/2,x+w-.2])box(xx,.88,-.01,.035,1.17,.04,0x797e76);box(x+.13,.86,-.02,w-.26,.06,.22,0xf5f1e9)}
 windowWall(0,split);windowWall(split,W-split);
 const walls=new T.Group();model.add(walls);let partition=[];
 function wall(x,z,w,d){const a=box(x,.025,z,w,.85,d);partition.push(a);box(x,.025,z,w,.06,d+.015,0xb9b2a3);return a}
 wall(W-.08,0,.08,D);wall(split,0,.10,2.8);wall(split,3.75,.10,D-3.75);const bedroomEnd=kind==='buy'?4.8:4.2;wall(split,bedroomEnd,W-split,.1);
 if(kind==='buy')wall(split,8,W-split,.1);
 // 门槛、开门扇与门套明确表达通行动线。
 box(split,.028,2.8,.12,.015,.95,0x9e8a6e);let door=box(split+.12,.03,2.85,.78,.035,.04,0xbca283);door.rotation.y=.7;
 // 使用完整PBR家具模型，保留现代简约的常见住宅布局。
 rug(.32,2.3,split-1,2.9);
 asset('sofa_03',.15,.04,2.55,.95,1.1,2.35,Math.PI/2);
 asset('modern_coffee_table_01',1.35,.04,3.15,1.0,.55,.8);
 asset('potted_plant_01',.18,.025,5.25,.62,1.6,.62);
 box(split-.37,.08,2.1,.3,.35,2.5,0xb29b7d,.02);box(split-.29,.68,2.6,.035,.9,1.35,0x303936,.02);box(split-.3,.65,3.1,.1,.03,.35,0x4f5752);lamp(.3,2.1,1.1);
 const diningZ=D-1.7;box(.7,.72,diningZ,1.3,.07,.8,0xc8ae8a,.04);for(let x of [.75,1.85])for(let z of [diningZ+.05,diningZ+.65])box(x,0,z,.06,.72,.06,0x897453);
 asset('dining_chair_02',.85,.025,diningZ-.65,.52,.9,.55,Math.PI);asset('dining_chair_02',1.4,.025,diningZ+.9,.52,.9,.55);
 cyl(1.65,.79,diningZ+.35,.09,.18,0xdfd6c4);
 // 厨房：分缝柜门、台面、嵌入灶、盆体、水龙头、抽油烟机和冰箱。
 for(let i=0;i<3;i++){let x=.12+i*.63;box(x,.05,.14,.61,.8,.62,0xdedbcf,.012);box(x+.05,.63,.77,.48,.018,.018,0x777d73);box(x,.85,.12,.63,.045,.67,0xe9e7dc)}
 box(.2,.9,.24,.52,.012,.4,0x323c38,.015);for(let x of [.34,.58])for(let z of [.34,.52])cyl(x,.92,z,.075,.015,0x69746a);
 box(.87,.9,.26,.45,.02,.34,0x929f98,.03);box(.92,.92,.29,.35,.012,.25,0x657a75,.03);cyl(1.1,.91,.63,.018,.3,0x9eaba5);box(1.08,1.2,.46,.035,.025,.19,0x9eaba5);
 box(.16,1.9,.17,.65,.12,.48,0xa8afa7);box(.37,2.02,.17,.24,.55,.2,0xb8bdb5);box(1,1.55,.04,.86,.62,.28,0xe0ddcf,.02);box(1.42,1.55,.33,.012,.6,.01,0xa7a79a);box(2.05,.025,.12,.62,1.9,.65,0xc3c7bd,.025);box(2.06,1.35,.78,.6,.018,.012,0x6e7971);
 // 卧室：两套真实不同房间布置。
 bed(split+.65,.7,kind==='buy'?1.8:1.55);box(W-.55,.025,.3,.46,1.85,2.1,0xc2b39d,.02);for(let z of [.7,1.4,2.1])box(W-.08,.8,z,.015,.18,.018,0x786f60);
 if(kind==='buy'){bed(split+.6,5.15,1.4,1.95);box(W-1.1,.75,6.2,.9,.06,.55,0xc3ad8c,.02);box(W-1.05,0,6.2,.05,.75,.5,0x9e8969);chair(W-.95,6.85)}
 // 卫浴：瓷砖、淋浴玻璃、花洒、马桶和洗手台。
 const bz=kind==='buy'?8.1:4.3,bw=W-split;
 for(let x=split+.12;x<W-.1;x+=.4)for(let z=bz;z<D-.1;z+=.4)box(x,.027,z,Math.min(.39,W-.1-x),.016,Math.min(.39,D-.1-z),0xd4d9d1);
 box(W-1.15,.05,D-1.1,1.0,.06,1.0,0xeaece2,.025);let screen=box(W-1.18,.12,D-1.1,.025,1.8,1,0xa9c8c5);screen.material=new T.MeshPhysicalMaterial({color:0xc7e0d9,transparent:true,opacity:.24,roughness:.1});cyl(W-.25,.4,D-.18,.025,1.5,0x8e9c95);box(W-.48,1.85,D-.22,.25,.03,.18,0xb9c5bd);
 box(split+.25,.12,bz+.5,.55,.32,.7,0xe8e9df,.15);box(split+.25,.4,bz+.4,.55,.45,.18,0xf8f7ee,.07);box(split+.3,.45,bz+.65,.45,.04,.4,0xf6f6ed,.15);
 box(split+.25,.05,D-.75,.85,.7,.5,0xb4a58d,.03);box(split+.2,.76,D-.8,.95,.08,.6,0xf6f3e9,.03);cyl(split+.65,.84,D-.5,.2,.08,0xe1e4d9);asset('potted_plant_01',W-.7,.025,3.4,.55,1.4,.55);
 // 室外底座与照明。
 const ground=new T.Mesh(new T.PlaneGeometry(100,100),mat(0xe8e7df));ground.rotation.x=-Math.PI/2;ground.position.y=-.27;ground.receiveShadow=true;scene.add(ground);
 scene.add(new T.HemisphereLight(0xfff9ed,0x929e95,1.5));const sun=new T.DirectionalLight(0xffefda,2.5);sun.position.set(-4,12,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-15;sun.shadow.camera.right=15;sun.shadow.camera.top=15;sun.shadow.camera.bottom=-15;sun.shadow.normalBias=.025;scene.add(sun);scene.add(sun.target);
 function render(){if(disposed)return;if(window.YANYE){YANYE.state.yaw=-28+(yaw+.7)*180/Math.PI;YANYE.state.pitch=55+(pitch-.85)*180/Math.PI;}const r=(focusRadius||Math.max(W,D)*2)*zoom;camera.position.set(target.x+Math.sin(yaw)*Math.cos(pitch)*r,target.y+Math.sin(pitch)*r,target.z+Math.cos(yaw)*Math.cos(pitch)*r);camera.lookAt(target);renderer.render(scene,camera)}
 const ro=new ResizeObserver(()=>{camera.aspect=stage.clientWidth/stage.clientHeight;camera.updateProjectionMatrix();renderer.setSize(stage.clientWidth,stage.clientHeight,false);render()});ro.observe(stage);
 function pause(){window.YANYE?.pause(true)}let drag=null;
 stage.onpointerdown=e=>{if(e.button)return;pause();drag={id:e.pointerId,x:e.clientX,y:e.clientY,a:yaw,p:pitch};stage.setPointerCapture(e.pointerId)};
 stage.onpointermove=e=>{if(!drag||e.pointerId!==drag.id)return;yaw=drag.a-(e.clientX-drag.x)*.008;if(e.pointerType!=='touch')pitch=T.MathUtils.clamp(drag.p+(e.clientY-drag.y)*.005,.28,1.4);render()};stage.onpointerup=stage.onpointercancel=e=>{drag=null;if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId)};
 stage.onkeydown=e=>{if(!e.key.startsWith('Arrow'))return;e.preventDefault();pause();yaw+=e.key==='ArrowLeft'?.12:e.key==='ArrowRight'?-.12:0;pitch=T.MathUtils.clamp(pitch+(e.key==='ArrowUp'?.08:e.key==='ArrowDown'?-.08:0),.28,1.4);render()};
 const toolbar=document.createElement('div');toolbar.className='webgl-controls';toolbar.innerHTML='<span>三维样板房 · 非实测房源</span><button data-camera="reset">复位</button><button data-camera="plan">俯视</button><button data-camera="in">放大</button><button data-camera="out">缩小</button><button data-camera="living">客厅近景</button><button data-camera="bed">卧室近景</button><button data-camera="kitchen">餐厨近景</button><button data-camera="bath">卫浴近景</button>';if(kind==='buy')toolbar.insertAdjacentHTML('beforeend','<button data-camera="second">次卧近景</button>');stage.after(toolbar);toolbar.onclick=e=>{let key=e.target.dataset.camera;if(!key)return;pause();if(key==='reset'){yaw=-.7;pitch=.85;zoom=1;focusRadius=null;target.set(W/2,.3,D/2)}if(key==='living'){target.set(1.6,.7,3.6);focusRadius=6.8;pitch=.6;zoom=1}if(key==='bed'){target.set(split+1.3,.6,1.8);focusRadius=5;pitch=.6;zoom=1}if(key==='second'){target.set(split+1.3,.6,6.6);focusRadius=4.8;pitch=.65;zoom=1}if(key==='kitchen'){target.set(1.4,.8,.65);focusRadius=5;pitch=.55;zoom=1}if(key==='bath'){target.set(W-1.3,.55,D-1);focusRadius=4.2;pitch=.8;zoom=1}if(key==='plan')pitch=1.4;if(key==='in')zoom=Math.max(.55,zoom-.15);if(key==='out')zoom=Math.min(1.6,zoom+.15);render()};
 const reset=document.getElementById('reset-view');if(reset)reset.onclick=()=>{pause();yaw=-.7;pitch=.85;zoom=1;focusRadius=null;target.set(W/2,.3,D/2);render()};
 const status=document.createElement('span');status.className='asset-status';status.textContent='正在载入家具与材质…';status.setAttribute('role','status');stage.append(status);
 Promise.all(assetTasks).then(()=>{if(!disposed){stage.dataset.assetsReady='true';status.textContent='可旋转 · 可缩放 · 虚构案例';render()}}).catch(()=>{if(!disposed){stage.dataset.assetsReady='failed';status.textContent='部分家具载入失败，请刷新重试'}});
 const pmrem=new T.PMREMGenerator(renderer);let environment;
 new RGBELoader().load(new URL('./assets/showroom/studio.hdr',import.meta.url).href,hdr=>{if(disposed){hdr.dispose();return}environment=pmrem.fromEquirectangular(hdr);scene.environment=environment.texture;hdr.dispose();render()});
 stage.dataset.engine='webgl';render();return {kind,render,async exportModel(){const {GLTFExporter}=await import('./assets/vendor/GLTFExporter.js');return new GLTFExporter().parseAsync(model,{binary:true,maxTextureSize:512});},dispose(){disposed=true;ro.disconnect();toolbar.remove();renderer.dispose();renderer.forceContextLoss();scene.traverse(n=>{if(!n.userData.sharedAsset)n.geometry?.dispose()});const used=new Set();scene.traverse(n=>{if(n.material&&(!n.userData.sharedAsset||n.userData.ownedMaterial))used.add(n.material)});for(const m of used)m.dispose();woodTexture.dispose();clothTexture.dispose();localTextures.forEach(t=>t.dispose());environment?.dispose();pmrem.dispose();renderer.domElement.remove()}};
}
function mount(){const stage=document.getElementById('model-stage');if(active?.stage===stage)return;active?.engine.dispose();active=null;if(!stage)return;try{const engine=create(stage,window.YANYE?.state.scenarioId||'rent');active={stage,engine}}catch(e){stage.dataset.engine='unavailable';stage.insertAdjacentHTML('beforeend','<p class="webgl-error">三维场景暂不可用，请使用室内图片与房源资料。</p>');console.error(e)}}
new MutationObserver(mount).observe(document.getElementById('product'),{childList:true});mount();window.YANYE3D={get active(){return active?.engine.kind},async download(){const data=await active.engine.exportModel();const url=URL.createObjectURL(new Blob([data],{type:'model/gltf-binary'}));const a=document.createElement('a');a.href=url;a.download=active.engine.kind+'-showroom.glb';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)},mount};

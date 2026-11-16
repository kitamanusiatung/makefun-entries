// VOID SIEGE - tower defense. Vanilla JS, WebAudio sfx, wave scaling.
'use strict';
const cv=document.getElementById('c'),ctx=cv.getContext('2d');
const W=960,H=600;cv.width=W;cv.height=H;
const hud={gold:document.getElementById('hGold'),wave:document.getElementById('hWave'),lives:document.getElementById('hLives')};
const WAY=[[0,7],[5,7],[5,3],[10,3],[10,11],[15,11],[15,5],[20,5],[20,13],[23,13]].map(p=>[p[0]*40+20,p[1]*40+20]);
const TOWERS=[
 {name:'PEW',cost:40,range:110,rate:0.35,dmg:8,color:'#4cf',speed:420},
 {name:'BLAST',cost:70,range:100,rate:0.9,dmg:14,splash:55,color:'#f84',speed:260},
 {name:'FROST',cost:60,range:95,rate:0.7,dmg:5,slow:true,color:'#8ff',speed:380},
 {name:'RAIL',cost:90,range:190,rate:1.4,dmg:42,color:'#f4f',speed:900}];
const UP_COST=30,UP_MULT=1.35;
let st={run:false,over:false,paused:false,gold:120,lives:20,score:0,wave:0,towers:[],foes:[],bullets:[],parts:[],floats:[],spawnQ:[],spawnT:0,sel:0,hover:null,hoverPos:null,shake:0,flash:0,t:0,demo:location.search.includes('demo')};
function onPath(x,y){for(let i=1;i<WAY.length;i++){const a=WAY[i-1],b=WAY[i];const dx=b[0]-a[0],dy=b[1]-a[1];const L2=dx*dx+dy*dy;let t=((x-a[0])*dx+(y-a[1])*dy)/L2;t=Math.max(0,Math.min(1,t));if(Math.hypot(x-(a[0]+t*dx),y-(a[1]+t*dy))<24)return true}return false}
let AC=null;function ac(){if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();return AC}
function sfx(type){try{const a=ac(),t=a.currentTime;
 if(type==='shoot'){const o=a.createOscillator(),g=a.createGain();o.type='square';o.frequency.setValueAtTime(660,t);o.frequency.exponentialRampToValueAtTime(180,t+.07);g.gain.setValueAtTime(.04,t);g.gain.exponentialRampToValueAtTime(.001,t+.08);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+.09)}
 else if(type==='boom'){const o=a.createOscillator(),g=a.createGain();o.type='sawtooth';o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(40,t+.25);g.gain.setValueAtTime(.12,t);g.gain.exponentialRampToValueAtTime(.001,t+.3);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+.32)}
 else if(type==='build'){const o=a.createOscillator(),g=a.createGain();o.type='triangle';o.frequency.setValueAtTime(300,t);o.frequency.linearRampToValueAtTime(700,t+.12);g.gain.setValueAtTime(.08,t);g.gain.exponentialRampToValueAtTime(.001,t+.15);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+.16)}
 else if(type==='hurt'){const o=a.createOscillator(),g=a.createGain();o.type='sawtooth';o.frequency.setValueAtTime(90,t);g.gain.setValueAtTime(.15,t);g.gain.exponentialRampToValueAtTime(.001,t+.4);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+.42)}
 else if(type==='win'){[523,659,784,1047].forEach((f,i)=>{const o=a.createOscillator(),g=a.createGain();o.type='triangle';o.frequency.value=f;const tt=t+i*.12;o.connect(g);g.connect(a.destination);g.gain.setValueAtTime(.09,tt);g.gain.exponentialRampToValueAtTime(.001,tt+.25);o.start(tt);o.stop(tt+.26)})}}catch(e){}}
let musT=0;function music(dt){if(!st.run||st.paused)return;musT-=dt;if(musT>0)return;musT=.28;try{const a=ac(),o=a.createOscillator(),g=a.createGain();const seq=[110,131,110,98,110,131,147,131];o.type='sine';o.frequency.value=seq[Math.floor(st.t/.28)%seq.length];o.connect(g);g.connect(a.destination);g.gain.setValueAtTime(.03,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.26);o.start();o.stop(a.currentTime+.27)}catch(e){}}
const FOE=[{hp:26,sp:46,col:'#e66',r:9,bounty:6},{hp:60,sp:34,col:'#fa4',r:11,bounty:10},{hp:16,sp:82,col:'#6f6',r:7,bounty:5}];
function waveSpec(n){const list=[];const boss=n%5===0;const cnt=6+Math.floor(n*1.7);
 for(let i=0;i<cnt;i++){const kind=n<3?0:(Math.random()<.25?2:(Math.random()<.5?1:0));list.push({kind,hp:FOE[kind].hp*(1+n*.16),delay:i*0.75})}
 if(boss)list.push({kind:1,hp:FOE[1].hp*(1+n*.16)*7,delay:list.length*0.75,boss:true});
 return list}
function startWave(){st.wave++;st.spawnQ=waveSpec(st.wave);st.spawnT=0}
function newFoe(spec){const f=FOE[spec.kind];return{x:WAY[0][0],y:WAY[0][1],seg:0,t:0,hp:spec.hp,max:spec.hp,sp:f.sp*(spec.boss?.6:1)*(1+st.wave*.012),col:spec.boss?'#d0f':f.col,r:spec.boss?18:f.r,bounty:spec.boss?40:f.bounty,slowT:0,boss:!!spec.boss}}
function updFoes(dt){for(const f of st.foes){if(f.slowT>0)f.slowT-=dt;const sp=f.sp*(f.slowT>0?.55:1);f.t+=sp*dt;let rem=f.t;
 while(f.seg<WAY.length-1&&rem>0){const a=WAY[f.seg],b=WAY[f.seg+1];const L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(rem<L){f.x=a[0]+rem/L*(b[0]-a[0]);f.y=a[1]+rem/L*(b[1]-a[1]);rem=0}else{rem-=L;f.seg++}}
 if(f.seg>=WAY.length-1){f.dead=true;st.lives--;st.flash=.4;st.shake=10;sfx('hurt');if(st.lives<=0)endGame(false)}}
 st.foes=st.foes.filter(f=>!f.dead)}
function updTowers(dt){for(const tw of st.towers){tw.cd-=dt;if(tw.cd>0)continue;const T=TOWERS[tw.type];const rng=T.range*(1+(tw.lvl-1)*(UP_MULT-1)*.6);
 let best=null;for(const f of st.foes){if(Math.hypot(f.x-tw.x,f.y-tw.y)<=rng&&(best===null||f.t>best.t))best=f}
 if(best){tw.cd=T.rate;tw.aim=Math.atan2(best.y-tw.y,best.x-tw.x);const dmg=T.dmg*Math.pow(UP_MULT,tw.lvl-1);
 st.bullets.push({x:tw.x,y:tw.y,tgt:best,sp:T.speed,dmg,splash:T.splash||0,slow:T.slow,col:T.color});sfx('shoot')}}}
function updBullets(dt){for(const b of st.bullets){if(b.tgt.dead){b.dead=true;continue}const dx=b.tgt.x-b.x,dy=b.tgt.y-b.y,d=Math.hypot(dx,dy);
 if(d<b.tgt.sp*dt+6){b.dead=true;hit(b)}else{b.x+=dx/d*b.sp*dt;b.y+=dy/d*b.sp*dt}}
 st.bullets=st.bullets.filter(b=>!b.dead)}
function hit(b){const f=b.tgt;f.hp-=b.dmg;
 if(b.splash){for(const o of st.foes){if(o!==f&&Math.hypot(o.x-f.x,o.y-f.y)<b.splash)o.hp-=b.dmg*.5}
 for(let i=0;i<14;i++)st.parts.push({x:f.x,y:f.y,vx:Math.random()*220-110,vy:Math.random()*220-110,life:.5,col:'#f84'});st.shake=Math.max(st.shake,5);sfx('boom')}
 else for(let i=0;i<6;i++)st.parts.push({x:f.x,y:f.y,vx:Math.random()*160-80,vy:Math.random()*160-80,life:.3,col:b.col});
 if(b.slow)f.slowT=1.6;
 if(f.hp<=0&&!f.dead){f.dead=true;st.gold+=f.bounty;st.score+=f.bounty;st.floats.push({x:f.x,y:f.y,txt:'+'+f.bounty,life:.9});if(f.boss){st.shake=14;sfx('boom')}}}
function updFx(dt){for(const p of st.parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt}st.parts=st.parts.filter(p=>p.life>0);
 for(const f of st.floats){f.y-=26*dt;f.life-=dt}st.floats=st.floats.filter(f=>f.life>0);
 if(st.spawnQ.length){st.spawnT-=dt;if(st.spawnT<=0){const s=st.spawnQ.shift();st.foes.push(newFoe(s));st.spawnT=s.delay}}
 if(!st.spawnQ.length&&!st.foes.length&&st.run&&!st.over){if(st.wave>=15)endGame(true);else{st.gold+=25+st.wave*3;startWave()}}}
function endGame(win){st.over=true;st.run=false;const m=document.getElementById('msg');m.style.display='block';m.innerHTML=(win?'YOU DEFENDED THE CORE':'THE VOID WON')+'<br><span style="font-size:20px">Score: '+st.score+' &middot; Wave '+st.wave+'<br>Click here to restart</span>';if(win)sfx('win');else sfx('boom')}
function reset(){Object.assign(st,{run:false,over:false,paused:false,gold:120,lives:20,score:0,wave:0,towers:[],foes:[],bullets:[],parts:[],floats:[],spawnQ:[],spawnT:0,shake:0,flash:0,t:0})}
function demoPlay(){if(!st.demo)return;const spots=[[6,6],[9,4],[4,9],[11,12],[14,6],[19,6],[16,12],[21,8]];
 for(let i=0;i<spots.length;i++){const s=spots[i];const x=s[0]*40+20,y=s[1]*40+20;
 if(!st.towers.some(t=>t.x===x&&t.y===y)){const type=i%4;const T=TOWERS[type];if(st.gold>=T.cost+20)place(x,y,type,true)}}
 for(const tw of st.towers){const cost=Math.round(UP_COST*Math.pow(1.6,tw.lvl));if(st.gold>cost+40)upgrade(tw,true)}}
function draw(){ctx.save();if(st.shake>0){ctx.translate(Math.random()*st.shake-st.shake/2,Math.random()*st.shake-st.shake/2);st.shake*=.85;if(st.shake<.4)st.shake=0}
 const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0a0f2a');g.addColorStop(1,'#05060f');ctx.fillStyle=g;ctx.fillRect(-20,-20,W+40,H+40);
 ctx.fillStyle='rgba(80,120,255,.12)';for(let x=40;x<W;x+=40)for(let y=40;y<H;y+=40)ctx.fillRect(x-1,y-1,2,2);
 ctx.strokeStyle='#1a2440';ctx.lineWidth=30;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(WAY[0][0],WAY[0][1]);for(const p of WAY.slice(1))ctx.lineTo(p[0],p[1]);ctx.stroke();
 ctx.strokeStyle='rgba(60,90,200,.25)';ctx.lineWidth=22;ctx.setLineDash([10,14]);ctx.lineDashOffset=-st.t*30;ctx.beginPath();ctx.moveTo(WAY[0][0],WAY[0][1]);for(const p of WAY.slice(1))ctx.lineTo(p[0],p[1]);ctx.stroke();ctx.setLineDash([]);
 const end=WAY[WAY.length-1];const pulse=6+Math.sin(st.t*4)*2;ctx.fillStyle='#0ff';ctx.beginPath();ctx.arc(end[0],end[1],pulse,0,7);ctx.fill();ctx.fillStyle='rgba(0,255,255,.25)';ctx.beginPath();ctx.arc(end[0],end[1],pulse+8,0,7);ctx.fill();
 for(const tw of st.towers){const T=TOWERS[tw.type];const rng=T.range*(1+(tw.lvl-1)*(UP_MULT-1)*.6);
 ctx.fillStyle='rgba(255,255,255,.04)';ctx.beginPath();ctx.arc(tw.x,tw.y,rng,0,7);ctx.fill();
 ctx.fillStyle=T.color;ctx.beginPath();ctx.arc(tw.x,tw.y,13,0,7);ctx.fill();
 ctx.fillStyle='#06122a';ctx.beginPath();ctx.arc(tw.x,tw.y,8,0,7);ctx.fill();
 if(tw.aim!==undefined){ctx.strokeStyle=T.color;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(tw.x,tw.y);ctx.lineTo(tw.x+Math.cos(tw.aim)*17,tw.y+Math.sin(tw.aim)*17);ctx.stroke()}
 if(tw.lvl>1){ctx.fillStyle='#ffd700';ctx.font='9px monospace';ctx.fillText('L'+tw.lvl,tw.x-6,tw.y-16)}
 if(tw===st.hover){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(tw.x,tw.y,17,0,7);ctx.stroke()}}
 for(const f of st.foes){ctx.fillStyle=f.col;ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,7);ctx.fill();
 ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(f.x-14,f.y-f.r-8,28,4);ctx.fillStyle='#0f0';ctx.fillRect(f.x-14,f.y-f.r-8,28*Math.max(0,f.hp/f.max),4)}
 for(const b of st.bullets){ctx.fillStyle=b.col;ctx.beginPath();ctx.arc(b.x,b.y,b.splash?6:3,0,7);ctx.fill()}
 for(const p of st.parts){ctx.globalAlpha=Math.max(0,p.life*2);ctx.fillStyle=p.col;ctx.fillRect(p.x-2,p.y-2,4,4)}ctx.globalAlpha=1;
 ctx.font='13px monospace';for(const f of st.floats){ctx.globalAlpha=Math.max(0,f.life);ctx.fillStyle='#ffd700';ctx.fillText(f.txt,f.x-10,f.y)}ctx.globalAlpha=1;
 if(st.run&&!st.over&&st.sel<4&&st.hoverPos){const x=st.hoverPos[0],y=st.hoverPos[1];
 const ok=!onPath(x,y)&&!st.towers.some(t=>Math.hypot(t.x-x,t.y-y)<24)&&st.gold>=TOWERS[st.sel].cost;
 ctx.globalAlpha=.5;ctx.fillStyle=ok?TOWERS[st.sel].color:'#a33';ctx.beginPath();ctx.arc(x,y,13,0,7);ctx.fill();ctx.globalAlpha=1;
 ctx.strokeStyle=ok?'#fff':'#a33';ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(x,y,TOWERS[st.sel].range,0,7);ctx.stroke();ctx.setLineDash([])}
 if(st.flash>0){ctx.fillStyle='rgba(255,0,60,'+(st.flash*.5)+')';ctx.fillRect(-20,-20,W+40,H+40);st.flash-=.02}
 ctx.restore()}
function place(x,y,type,silent){const T=TOWERS[type];if(st.gold<T.cost)return false;if(onPath(x,y))return false;if(st.towers.some(t=>Math.hypot(t.x-x,t.y-y)<24))return false;st.towers.push({x,y,type,lvl:1,cd:0});st.gold-=T.cost;if(!silent)sfx('build');return true}
function upgrade(tw,silent){const cost=Math.round(UP_COST*Math.pow(1.6,tw.lvl));if(st.gold<cost)return false;st.gold-=cost;tw.lvl++;if(!silent)sfx('build');return true}
function sell(tw){const T=TOWERS[tw.type];let paid=T.cost;for(let l=1;l<tw.lvl;l++)paid+=Math.round(UP_COST*Math.pow(1.6,l));st.gold+=Math.round(paid*.7);st.towers=st.towers.filter(t=>t!==tw);st.hover=null;sfx('build')}
cv.addEventListener('mousemove',e=>{const r=cv.getBoundingClientRect();st.hoverPos=[Math.round((e.clientX-r.left)*(W/r.width)),Math.round((e.clientY-r.top)*(H/r.height))];st.hover=st.towers.find(t=>Math.hypot(t.x-st.hoverPos[0],t.y-st.hoverPos[1])<16)||null});
cv.addEventListener('click',e=>{const r=cv.getBoundingClientRect();const x=Math.round((e.clientX-r.left)*(W/r.width)),y=Math.round((e.clientY-r.top)*(H/r.height));
 if(st.hover!==null){if(st.sel===4)upgrade(st.hover);else if(st.sel===5)sell(st.hover);else place(x,y,st.sel);return}
 if(st.sel<4)place(x,y,st.sel)});
document.addEventListener('keydown',e=>{if(e.key==='p'||e.key==='P')st.paused=!st.paused;if(e.key>='1'&&e.key<='4'){st.sel=+e.key-1;document.querySelectorAll('.tbtn').forEach((x,i)=>x.classList.toggle('sel',i===st.sel))}});
document.getElementById('msg').addEventListener('click',()=>{if(!st.run)play()});
function play(){if(st.over||!st.run){reset();st.run=true;startWave()}}
let last=performance.now();
function frame(now){let dt=Math.min(.05,(now-last)/1000);last=now;
 if(st.run&&!st.paused){st.t+=dt;updFoes(dt);updTowers(dt);updBullets(dt);updFx(dt);demoPlay();music(dt)}
 draw();hud.gold.textContent=st.gold;hud.wave.textContent=st.wave+(st.paused?' (PAUSED)':'');hud.lives.textContent=st.lives;
 requestAnimationFrame(frame)}requestAnimationFrame(frame);
const demoBoss=location.search.includes('boss');
if(st.demo){document.getElementById('msg').style.display='none';st.run=true;st.gold=400;startWave();if(demoBoss){st.wave=4;startWave()}else{st.wave=2;startWave()}}

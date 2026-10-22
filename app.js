let uLat=12.97,uLng=77.59,uTZ=5.5,uCity='Bengaluru',uTZID='Asia/Kolkata',uAlt=920;
let apiData=null,wxData=null;
let anaHemi='N';
let jlFlightInputMode='duration';

const SEL={'jl-od':CITIES[0],'jl-dd':null,'ca-d':CITIES[0],'cb-d':null,'lat-d':CITIES[0],'loc-d':null};

function localH(tz){const d=new Date(Date.now()+Math.round(tz*3600000));return d.getUTCHours()+d.getUTCMinutes()/60+d.getUTCSeconds()/3600;}
function localHMS(tz){const d=new Date(Date.now()+Math.round(tz*3600000));return{h:d.getUTCHours(),m:d.getUTCMinutes(),s:d.getUTCSeconds()};}
function fmtH(h){const hh=Math.floor(((h%24)+24)%24);const mm=Math.floor(((h%1+1)%1)*60);return String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');}function fmtHR(h){let hh=Math.floor(((h%24)+24)%24);let mm=Math.round(((h%1+1)%1)*60);if(mm>=60){mm=0;hh=(hh+1)%24;}return String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');}
function pt(t){const[h,m]=(t||'0:0').split(':').map(Number);return h+(m||0)/60;}
function tzLabel(tz){return'UTC'+(tz>=0?'+':'')+tz;}

function getDSTInfo(tzid,dateStr){const date=dateStr?new Date(dateStr+'T12:00:00Z'):new Date();const month=date.getUTCMonth()+1;const day=date.getUTCDate();const usDSTzones=['America/New_York','America/Los_Angeles','America/Chicago','America/Denver','America/Toronto','America/Vancouver'];const euDSTzones=['Europe/London','Europe/Paris','Europe/Berlin','Europe/Madrid','Europe/Rome','Europe/Amsterdam','Europe/Vienna','Europe/Zurich','Europe/Stockholm','Europe/Oslo','Europe/Copenhagen','Europe/Helsinki','Europe/Warsaw','Europe/Prague','Europe/Athens','Europe/Lisbon','Europe/Dublin','Europe/Istanbul'];const shDSTzones=['Australia/Sydney','Australia/Melbourne','Pacific/Auckland','America/Santiago'];let hasDST=false,isDST=false,dstOffset=0,label='';if(usDSTzones.includes(tzid)){hasDST=true;isDST=(month>3&&month<11)||(month===3&&day>=8)||(month===11&&day===1);dstOffset=isDST?1:0;label=isDST?'DST active (+1h)':'Standard time';}else if(euDSTzones.includes(tzid)){hasDST=true;const inDST=(month>3&&month<10)||(month===3&&day>=25)||(month===10&&day<25);isDST=inDST;dstOffset=isDST?1:0;label=isDST?'DST active (CEST/BST +1h)':'Standard time (CET/GMT)';}else if(shDSTzones.includes(tzid)){hasDST=true;isDST=month>=10||month<=3;dstOffset=isDST?1:0;label=isDST?'DST active (+1h)':'Standard time';}return{hasDST,isDST,dstOffset,label};}

function jlFlightMode(mode){jlFlightInputMode=mode;const note=document.getElementById('jl-mode-note');if(mode==='arrival'){note.textContent='✔ Using arrival time — flight duration will be calculated';note.style.color='var(--tel)';document.getElementById('jl-hrs').style.opacity='0.4';document.getElementById('jl-min').style.opacity='0.4';document.getElementById('jl-arrtime').style.borderColor='var(--amb)';}else{note.textContent='✔ Using flight duration — arrival time will be calculated';note.style.color='var(--tel)';document.getElementById('jl-hrs').style.opacity='1';document.getElementById('jl-min').style.opacity='1';document.getElementById('jl-arrtime').style.borderColor='var(--brd2)';}}

function updateDepDSTNote(){const org=SEL['jl-od']||CITIES[0];const dst=SEL['jl-dd'];const dateStr=document.getElementById('jl-depdate').value;const note=document.getElementById('jl-dst-note');if(!dateStr){note.textContent='';return;}let parts=[];const orgDST=getDSTInfo(org.tzid,dateStr);if(orgDST.hasDST)parts.push('Origin: '+orgDST.label);if(dst){const dstDST=getDSTInfo(dst.tzid,dateStr);if(dstDST.hasDST)parts.push('Dest: '+dstDST.label);}note.textContent=parts.length?'🕐 '+parts.join(' · '):'No DST changes on this date.';}

function cs(v,dropId){const drop=document.getElementById(dropId);if(!drop)return;if(!v||v.length<1){drop.classList.remove('open');return;}const q=v.toLowerCase().trim();const seen=new Set();const res=CITIES.filter(c=>{if(seen.has(c.n))return false;if(c.n.toLowerCase().includes(q)||c.c.toLowerCase().includes(q)){seen.add(c.n);return true;}return false;}).slice(0,12);if(!res.length){drop.innerHTML='<div style="padding:7px 11px;font-size:12px;color:var(--t3)">No results</div>';drop.classList.add('open');return;}drop.innerHTML=res.map(c=>{const i=c.n.toLowerCase().indexOf(q);const nm=i>=0?c.n.slice(0,i)+'<mark style="background:var(--ad);color:var(--amb)">'+c.n.slice(i,i+q.length)+'</mark>'+c.n.slice(i+q.length):c.n;return`<div class="dopt" onmousedown="pickC('${dropId}','${c.n.replace(/'/g,"\\'")}',${c.lat},${c.lng},${c.tz},${c.tzStd},'${c.c.replace(/'/g,"\\'")}','${c.tzid}',${c.alt||0})"><span class="dname">${nm}</span><span class="dc">${c.c}</span><span class="dl">${Math.abs(c.lat).toFixed(1)}°${c.lat>=0?'N':'S'} ${tzLabel(c.tz)}</span></div>`;}).join('');drop.classList.add('open');}
function pickC(dropId,name,lat,lng,tz,tzStd,country,tzid,alt){cd(dropId);SEL[dropId]={n:name,c:country,lat,lng,tz,tzStd,tzid,alt:alt||0};const drop=document.getElementById(dropId);const inp=drop?.previousElementSibling;if(inp&&inp.tagName==='INPUT')inp.value=name;const maps={'loc-d':'loc-s','lat-d':'lat-s','jl-od':'jl-os','jl-dd':'jl-ds'};const sid=maps[dropId];if(sid){const s=document.getElementById(sid);if(s)s.textContent=name+', '+country+' — '+Math.abs(lat).toFixed(2)+'°'+(lat>=0?'N':'S')+' '+tzLabel(tz);}if(dropId==='jl-od'||dropId==='jl-dd')updateDepDSTNote();if(dropId==='ana-city-d'){const li=document.getElementById('ana-lat-inp');if(li)li.value=lat.toFixed(2);}}
function cd(id){const d=document.getElementById(id);if(d){d.classList.remove('open');d.innerHTML='';}}
function toggleLoc(){const w=document.getElementById('loc-wrap');w.style.display=w.style.display==='none'?'block':'none';}
function applyLoc(){const c=SEL['loc-d'];if(!c)return;uLat=c.lat;uLng=c.lng;uTZ=c.tz;uCity=c.n;uTZID=c.tzid;uAlt=c.alt||0;document.getElementById('loc-name').textContent=c.n+', '+c.c;document.getElementById('loc-coords').textContent=Math.abs(c.lat).toFixed(2)+'°'+(c.lat>=0?'N':'S')+' '+Math.abs(c.lng).toFixed(2)+'°'+(c.lng>=0?'E':'W');document.getElementById('loc-tzlbl').textContent=tzLabel(c.tz);document.getElementById('dd-city').textContent=c.n;document.getElementById('wx-loc-lbl').textContent=c.n;document.getElementById('loc-wrap').style.display='none';apiData=null;wxData=null;loadApi().then(()=>dash());loadWeather();}

function selectHemi(h){anaHemi=h;document.getElementById('hemi-n').classList.toggle('on',h==='N');document.getElementById('hemi-s').classList.toggle('on',h==='S');drawAnalemma();}

const D2R=Math.PI/180,R2D=180/Math.PI;
function doy(d){return Math.floor((d-new Date(d.getFullYear(),0,0))/864e5);}
function sDecl(d){return 23.45*Math.sin(D2R*(360/365)*(d-81));}
function eot(d){const B=(360/365)*(d-81)*D2R;return 9.87*Math.sin(2*B)-7.53*Math.cos(B)-1.5*Math.sin(B);}
function snoon(lng,tz,d){const raw=12-(4*(lng-tz*15)+eot(d))/60;return((raw%24)+24)%24;}
function haCalc(h,n){return 15*(h-n);}
function elevC(lat,dc,ha){return Math.asin(Math.sin(lat*D2R)*Math.sin(dc*D2R)+Math.cos(lat*D2R)*Math.cos(dc*D2R)*Math.cos(ha*D2R))*R2D;}
function azC(lat,dc,el,ha){
  // Correct solar azimuth: 0°=North, 90°=East, 180°=South, 270°=West
  const latR=lat*D2R,dcR=dc*D2R,elR=el*D2R;
  const cosAz=(Math.sin(dcR)-Math.sin(elR)*Math.sin(latR))/(Math.cos(elR)*Math.cos(latR));
  const az=Math.acos(Math.max(-1,Math.min(1,cosAz)))*R2D;
  // ha>0 means afternoon (sun moving west), ha<0 means morning (sun in east)
  return ha>0?360-az:az;
}
// Solar geometry — asymmetric rise/set definitions:
// SUNRISE: top edge of sun first appears above horizon
//   → sun centre at -0.833° (refraction 0.567° + semi-diameter 0.267°)
// SUNSET START: bottom edge of sun first touches the horizon (sun begins to set — still fully visible)
//   → sun centre at +0.267° above geometric horizon (semi-diameter only; refraction negligible here)
//
// srssH(lat,dc,dep): returns hour-angle half-span for given centre depression angle
//   dep>0 = centre is BELOW geometric horizon, dep<0 = centre is ABOVE
function srssH(lat,dc,dep){
  const ch=(-Math.sin(dep*D2R)-Math.sin(lat*D2R)*Math.sin(dc*D2R))/(Math.cos(lat*D2R)*Math.cos(dc*D2R));
  if(ch<-1)return 'midnight_sun'; // sun never dips to this depression — always above
  if(ch>1) return 'polar_night';  // sun never rises to this angle — always below
  return Math.acos(ch)*R2D/15;   // hours from noon
}
function srss(lat,dc,dep=0.833){
  // Legacy wrapper used by civil twilight (dep=6) and annualEx
  const h=srssH(lat,dc,dep);
  if(h==='midnight_sun')return{r:-6,s:30,dl:24};
  if(h==='polar_night') return{r:12,s:12,dl:0};
  return{r:12-h,s:12+h,dl:2*h};
}
function srTimes(lat,dc,n){
  // Returns {rise, riseEnd, setStart, setEnd, dl} all in local clock hours
  // rise     = top limb clears horizon (dep +0.833) — sun STARTS rising
  // riseEnd  = bottom limb clears horizon (dep -0.267) — sun FULLY RISEN
  // setStart = bottom limb touches horizon — sunset BEGINS (dep -0.267)
  // setEnd   = top limb disappears — sunset COMPLETE (dep +0.833)
  const hRise    =srssH(lat,dc,0.833);
  const hRiseEnd =srssH(lat,dc,-0.267);
  const hSetStart=srssH(lat,dc,-0.267);
  const hSetEnd  =srssH(lat,dc,0.833);
  // hRise can be 'midnight_sun', 'polar_night', or a number
  if(hRise==='midnight_sun')return{rise:null,riseEnd:null,setStart:null,setEnd:null,dl:24,special:'midnight_sun'};
  if(hRise==='polar_night') return{rise:null,riseEnd:null,setStart:null,setEnd:null,dl:0, special:'polar_night'};
  return{
    rise:     n-hRise,
    riseEnd:  (typeof hRiseEnd==='number')?(n-hRiseEnd):null,
    setStart: (typeof hSetStart==='number')?(n+hSetStart):null,
    setEnd:   n+hSetEnd,
    dl:       2*hRise,
    special:  null
  };
}
function luxC(el,cloud=0.1){if(el<-6)return 0;if(el<0)return Math.max(0,5+el*0.8);return Math.round(100000*Math.sin(el*D2R)*(1-cloud*0.85));}
function scnR(lux){if(lux>50000)return'solar noon';if(lux>10000)return'mid-morning/afternoon';if(lux>1000)return'08:30/17:00 equiv';if(lux>100)return'twilight (~06:30)';if(lux>10)return'false sunset signal';if(lux>1)return'night — melatonin rising';return'complete darkness';}
function annualEx(lat,lng,tzStd){
  let minR=99,maxR=0,minS=99,maxS=0;
  let hasMidnightSun=false, hasPolarNight=false, hasNormalDays=false;
  for(let d=1;d<=365;d++){
    const dc=sDecl(d),n=snoon(lng,tzStd,d);
    // Compute ch directly to distinguish midnight sun vs polar night vs normal
    const chR=(-Math.sin(0.833*D2R)-Math.sin(lat*D2R)*Math.sin(dc*D2R))/(Math.cos(lat*D2R)*Math.cos(dc*D2R));
    if(chR<-1){ hasMidnightSun=true; continue; } // midnight sun day — skip for span calc
    if(chR>1){  hasPolarNight=true;  continue; } // polar night day  — skip for span calc
    hasNormalDays=true;
    const hR=Math.acos(chR)*R2D/15; // hours from noon to rise/set
    const r=n-hR, s=n+hR;
    if(r<minR)minR=r; if(r>maxR)maxR=r;
    if(s<minS)minS=s; if(s>maxS)maxS=s;
  }
  // Pure midnight-sun location (no normal days at all) — e.g. North Pole in summer
  if(!hasNormalDays&&hasMidnightSun&&!hasPolarNight){
    // 24h daylight: sunrise always 00:00, sunset always 23:59
    return{minR:0,maxR:0,minS:23.983,maxS:23.983,rVar:0,sVar:0,polar:'midnight_sun_always'};
  }
  // Pure polar night location (no normal days at all)
  if(!hasNormalDays&&hasPolarNight&&!hasMidnightSun){
    return{minR:23.983,maxR:23.983,minS:0,maxS:0,rVar:0,sVar:0,polar:'polar_night_always'};
  }
  // Mixed polar location — has some midnight sun and/or polar night days in addition to normal days
  // For the span: midnight-sun days act as if sunrise=00:00 and sunset=23:59
  //               polar-night days act as if sunrise=23:59 and sunset=00:00
  if(hasMidnightSun){ maxS=Math.max(maxS,23.983); minR=Math.min(minR,0); }
  if(hasPolarNight){  minS=Math.min(minS,0);       maxR=Math.max(maxR,23.983); }
  return{minR,maxR,minS,maxS,rVar:Math.round((maxR-minR)*60),sVar:Math.round((maxS-minS)*60),
    polar:hasMidnightSun&&hasPolarNight?'both':hasMidnightSun?'midnight_sun':hasPolarNight?'polar_night':null};
}

function calcUV(el,lat,altM){if(el<=0)return 0;const sinEl=Math.sin(el*D2R);const ozoneFactor=1.0-0.03*(Math.abs(lat)/90);const altFactor=1+(altM/1000)*0.08;const basePeak=12.0;const airMass=1/(sinEl+0.50572*Math.pow(el+6.07995,-1.6364));const airMassFactor=Math.pow(0.9,Math.max(0.5,Math.min(airMass,40)));return Math.round(Math.max(0,basePeak*sinEl*ozoneFactor*altFactor*airMassFactor)*10)/10;}
function uvCategory(uv){if(uv<3)return{cat:'Low',color:'#4a9eff',badge:'bB',advice:'No protection generally needed.',burn:'60+'};if(uv<6)return{cat:'Moderate',color:'#5cb85c',badge:'bG',advice:'Some protection needed. SPF 15+.',burn:'30–45'};if(uv<8)return{cat:'High',color:'#f0c030',badge:'bA',advice:'Protection essential. SPF 30+, hat.',burn:'15–25'};if(uv<11)return{cat:'Very High',color:'#e86040',badge:'bC',advice:'Extra protection. SPF 50+.',burn:'10–15'};return{cat:'Extreme',color:'#9b59b6',badge:'bP',advice:'Maximum protection. Avoid sun 10–16h.',burn:'<10'};}
function renderUV(uv,lat,altM,el){const info=uvCategory(uv);const pct=Math.min(100,(uv/15)*100);document.getElementById('uv-val').textContent=uv.toFixed(1);document.getElementById('uv-val').style.color=info.color;document.getElementById('uv-cat').textContent=info.cat;document.getElementById('uv-cat').style.color=info.color;document.getElementById('uv-exp').textContent=info.burn+' min to burn (type II skin)';const badge=document.getElementById('uv-badge');badge.textContent=info.cat;badge.className='badge '+info.badge;document.getElementById('uv-advice').textContent=info.advice;document.getElementById('uv-needle').style.left=pct+'%';document.getElementById('uv-lat').textContent=Math.abs(lat).toFixed(2)+'°'+(lat>=0?'N':'S');document.getElementById('uv-alt').textContent=altM+'m';document.getElementById('uv-ozone').textContent=((1.0-0.03*(Math.abs(lat)/90))*100).toFixed(1)+'%';const am=el>0?(1/(Math.sin(el*D2R)+0.50572*Math.pow(el+6.07995,-1.6364))).toFixed(2):'n/a';document.getElementById('uv-airmass').textContent=am;}

async function loadWeather(){document.getElementById('wx-loading').style.display='block';document.getElementById('wx-content').style.display='none';document.getElementById('wx-err').style.display='none';setApiStatus('weather','loading');const url='https://api.open-meteo.com/v1/forecast?latitude='+uLat+'&longitude='+uLng+'&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,dew_point_2m&wind_speed_unit=kmh&timezone=auto&forecast_days=1';const ctrl=new AbortController();const tid=setTimeout(()=>ctrl.abort(),9000);try{const r=await fetch(url,{signal:ctrl.signal,mode:'cors'});clearTimeout(tid);if(!r.ok)throw new Error('HTTP '+r.status);const d=await r.json();if(!d.current)throw new Error('No current');wxData=d.current;setApiStatus('weather','ok');renderWeather(wxData);}catch(e){clearTimeout(tid);setApiStatus('weather','fail');document.getElementById('wx-loading').style.display='none';document.getElementById('wx-err').style.display='block';document.getElementById('wx-err').innerHTML='<div style="color:var(--cor);margin-bottom:5px">⚠ Weather API blocked. <button class="btn sm" onclick="loadWeather()">↺ Retry</button> <button class="btn sm" style="border-color:#1a3860;color:var(--blu)" onclick="showManualWx()">✎ Manual</button></div>';}}
function showManualWx(){document.getElementById('wx-err').innerHTML='<div style="font-size:11px;color:var(--t2);margin-bottom:7px">Enter manually:</div><div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:7px"><div><label style="font-size:9px;color:var(--t3);display:block;margin-bottom:2px">TEMP °C</label><input id="mx-t" type="number" value="28" style="width:60px;background:var(--bg3);border:1px solid var(--brd2);border-radius:6px;color:var(--txt);padding:4px 7px;font-size:12px"></div><div><label style="font-size:9px;color:var(--t3);display:block;margin-bottom:2px">HUMIDITY %</label><input id="mx-h" type="number" value="65" style="width:60px;background:var(--bg3);border:1px solid var(--brd2);border-radius:6px;color:var(--txt);padding:4px 7px;font-size:12px"></div><div><label style="font-size:9px;color:var(--t3);display:block;margin-bottom:2px">PRESSURE hPa</label><input id="mx-p" type="number" value="1013" style="width:70px;background:var(--bg3);border:1px solid var(--brd2);border-radius:6px;color:var(--txt);padding:4px 7px;font-size:12px"></div><div><label style="font-size:9px;color:var(--t3);display:block;margin-bottom:2px">WIND km/h</label><input id="mx-w" type="number" value="10" style="width:60px;background:var(--bg3);border:1px solid var(--brd2);border-radius:6px;color:var(--txt);padding:4px 7px;font-size:12px"></div></div><button class="btn sm" onclick="applyManualWx()">Apply</button>';}
function applyManualWx(){const T=parseFloat(document.getElementById('mx-t').value)||28;const RH=parseFloat(document.getElementById('mx-h').value)||65;const P=parseFloat(document.getElementById('mx-p').value)||1013;const W=parseFloat(document.getElementById('mx-w').value)||10;const a=17.27,b=237.7,g=(a*T/(b+T))+Math.log(RH/100);const dew=Math.round((b*g)/(a-g));wxData={temperature_2m:T,relative_humidity_2m:RH,apparent_temperature:T-0.5,weather_code:1,surface_pressure:P,wind_speed_10m:W,wind_direction_10m:180,dew_point_2m:dew};renderWeather(wxData);document.getElementById('wx-err').style.display='none';}
const WX_CODES={0:'Clear sky',1:'Mostly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',80:'Light showers',81:'Showers',82:'Heavy showers',95:'Thunderstorm'};
const WIND_DIR=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
function renderWeather(w){if(!w)return;document.getElementById('wx-loading').style.display='none';document.getElementById('wx-content').style.display='block';document.getElementById('wx-temp').innerHTML=Math.round(w.temperature_2m)+'<span style="font-size:22px;color:var(--t2)">°C</span>';document.getElementById('wx-desc').textContent=WX_CODES[w.weather_code]||'—';document.getElementById('wx-feels').textContent='Feels like '+Math.round(w.apparent_temperature)+'°C';document.getElementById('wx-hum').innerHTML=w.relative_humidity_2m+'<span class="wx-unit">%</span>';document.getElementById('wx-dew').innerHTML=Math.round(w.dew_point_2m)+'<span class="wx-unit">°C</span>';document.getElementById('wx-pres').innerHTML=Math.round(w.surface_pressure)+'<span class="wx-unit">hPa</span>';document.getElementById('wx-wind').innerHTML=Math.round(w.wind_speed_10m)+'<span class="wx-unit">km/h</span>';document.getElementById('wx-wdir').textContent=WIND_DIR[Math.round(w.wind_direction_10m/22.5)%16];const uvNow=parseFloat(document.getElementById('uv-val').textContent)||0;const wsNow=Math.round(w.wind_speed_10m)||0;const hi=calcHI(w.temperature_2m,w.relative_humidity_2m,uvNow,wsNow);const{hiText,hiBadge}=hiCat(hi);document.getElementById('wx-hi').innerHTML=hi+'<span class="wx-unit">°C</span>';const hib=document.getElementById('wx-hi-badge');hib.textContent=hiText;hib.className='badge '+hiBadge;document.getElementById('wx-hi-note').textContent=`Temp ${Math.round(w.temperature_2m)}°C, RH ${w.relative_humidity_2m}%, UV ${uvNow}, Wind ${wsNow} km/h`;}
function calcHI(T,RH,uv,ws){
  // ws = wind speed in km/h
  ws=ws||0;
  // Wind effect: high wind raises apparent temp when hot (convective heat stress),
  // lowers it when cold (wind chill). We use a signed wind factor:
  //   hot (T>=27): wind adds moderate extra stress (hot air circulation), cap at +2°C
  //   cool (T<10): wind chill reduction using Steadman formula
  //   mild: linear blend
  let windAdj=0;
  if(T>=27){
    // Warm/hot: wind speed above ~15 km/h still drives hot air against skin
    windAdj=Math.min(2.0, ws*0.04);
  } else if(T<10){
    // Wind chill (Steadman): WC = 13.12 + 0.6215*T - 11.37*ws^0.16 + 0.3965*T*ws^0.16
    const wc=13.12+0.6215*T-11.37*Math.pow(ws,0.16)+0.3965*T*Math.pow(ws,0.16);
    windAdj=wc-T; // negative = cooling effect
  } else {
    // Mild range: gentle cooling blend
    windAdj=-Math.min(2.5, ws*0.06)*(10-T)/10;
  }
  let base;
  if(T<27||RH<40){
    base=T+0.33*((RH/100)*6.105*Math.exp(17.27*T/(237.7+T)))-4.0+uv*0.15;
  } else {
    const Tf=T*9/5+32;
    let HI=-42.379+2.04901523*Tf+10.14333127*RH-0.22475541*Tf*RH-6.83783e-3*Tf*Tf-5.481717e-2*RH*RH+1.22874e-3*Tf*Tf*RH+8.5282e-4*Tf*RH*RH-1.99e-6*Tf*Tf*RH*RH;
    if(RH<13&&Tf>=80&&Tf<=112)HI-=((13-RH)/4)*Math.sqrt((17-Math.abs(Tf-95))/17);
    else if(RH>85&&Tf>=80&&Tf<=87)HI+=((RH-85)/10)*((87-Tf)/5);
    base=(HI-32)*5/9+uv*0.18;
  }
  return Math.round(base+windAdj);
}
function hiCat(hi){if(hi<-60)return{hiText:'Fatal — skin freezes <30s',hiBadge:'bP'};if(hi<-40)return{hiText:'Extreme — frostbite 2–5 min',hiBadge:'bP'};if(hi<-27)return{hiText:'Severe — frostbite 10–30 min',hiBadge:'bC'};if(hi<-14)return{hiText:'Very Cold — cover all exposed skin',hiBadge:'bC'};if(hi<-1)return{hiText:'Cold — layers + wind chill risk',hiBadge:'bB'};if(hi<5)return{hiText:'Chilly / Cold — heavy jacket needed',hiBadge:'bB'};if(hi<10)return{hiText:'Chilly — light to medium jacket',hiBadge:'bT'};if(hi<15)return{hiText:'Cool — light jacket or hoodie',hiBadge:'bT'};if(hi<20)return{hiText:'Mild — light layers, pleasant',hiBadge:'bT'};if(hi<27)return{hiText:'Comfortable — ideal range',hiBadge:'bT'};if(hi<32)return{hiText:'Caution — fatigue with prolonged exposure',hiBadge:'bG'};if(hi<39)return{hiText:'Extreme Caution — heat exhaustion possible',hiBadge:'bA'};if(hi<46)return{hiText:'Danger — heat exhaustion likely',hiBadge:'bC'};if(hi<54)return{hiText:'Extreme Danger — heatstroke highly likely',hiBadge:'bP'};return{hiText:'Catastrophic — heatstroke imminent',hiBadge:'bP'};}

async function loadApi(){
  document.getElementById('sky-ld').style.display='block';
  setApiStatus('sunrise','loading');
  const ctrl=new AbortController();
  const tid=setTimeout(()=>ctrl.abort(),9000);
  try{
    // Open-Meteo daily API — no API key, CORS-open, works when downloaded.
    // sunrise = top limb appears (depression 0.833°, default)
    // sunset  = bottom limb touches horizon = sun STARTS to set (depression -0.267°, centre still above horizon by semi-diameter)
    // sunset_end = top limb disappears, sun fully set (depression 0.833°, stored separately for display)
    // We fetch both by using sunrise_depression / sunset_depression params:
    //   sunrise_depression=0.833  (same as default — top limb clears horizon)
    //   sunset_depression=-0.267  (bottom limb AT horizon — sun begins setting)
    // We also fetch solar_noon, dawn, dusk, daylight_duration for the other cards.
    const base='https://api.open-meteo.com/v1/forecast?latitude='+uLat+'&longitude='+uLng+'&timezone='+encodeURIComponent(uTZID)+'&forecast_days=1';
    // Three calls:
    // (1) main: sunrise top limb (dep=0.833) + sunset start bottom limb (dep=-0.267) + extra fields
    // (2) sunset end: top limb gone (dep=0.833)
    // (3) sunrise end: bottom limb fully cleared (dep=-0.267) — sun fully risen
    const urlMain    =base+'&daily=sunrise,sunset,solar_noon,daylight_duration,dawn,dusk&sunrise_depression=0.833&sunset_depression=-0.267';
    const urlSetEnd  =base+'&daily=sunset&sunrise_depression=0.833&sunset_depression=0.833';
    const urlRiseEnd =base+'&daily=sunrise&sunrise_depression=-0.267&sunset_depression=0.833';
    const [rMain,rSetEnd,rRiseEnd]=await Promise.all([
      fetch(urlMain,    {signal:ctrl.signal,mode:'cors'}),
      fetch(urlSetEnd,  {signal:ctrl.signal,mode:'cors'}),
      fetch(urlRiseEnd, {signal:ctrl.signal,mode:'cors'})
    ]);
    clearTimeout(tid);
    if(!rMain.ok)throw new Error('HTTP '+rMain.status);
    const dMain=await rMain.json();
    const dSetEnd  =rSetEnd.ok   ?await rSetEnd.json()  :null;
    const dRiseEnd =rRiseEnd.ok  ?await rRiseEnd.json() :null;
    if(dMain.daily&&dMain.daily.sunrise&&dMain.daily.sunrise[0]){
      function isoToH(iso){if(!iso)return null;const parts=iso.split('T');if(!parts[1])return null;const[h,m]=parts[1].split(':').map(Number);return h+m/60;}
      function isoToHMStr(iso){if(!iso)return null;const h=isoToH(iso);return h===null?null:fmtHR(h);}
      const dlSec=dMain.daily.daylight_duration?dMain.daily.daylight_duration[0]:null;
      let dlH=dlSec?Math.floor(dlSec/3600):null;
      let dlM=dlSec?Math.round((dlSec%3600)/60):null;
      if(dlM>=60){dlM=0;dlH++;}
      const dlStr=dlSec?(dlH+'h '+(dlM<10?'0':'')+dlM+'m'):null;
      const setEndIso =dSetEnd &&dSetEnd.daily &&dSetEnd.daily.sunset  ?dSetEnd.daily.sunset[0]  :null;
      const riseEndIso=dRiseEnd&&dRiseEnd.daily&&dRiseEnd.daily.sunrise?dRiseEnd.daily.sunrise[0]:null;
      apiData={
        sunrise:     isoToHMStr(dMain.daily.sunrise[0]),    // top limb appears — sun STARTS rising
        sunrise_end: isoToHMStr(riseEndIso),                // bottom limb clears — sun FULLY RISEN
        sunset:      isoToHMStr(dMain.daily.sunset[0]),     // bottom limb at horizon — sun STARTS setting
        sunset_end:  isoToHMStr(setEndIso),                 // top limb gone — sun FULLY SET
        dawn:      isoToHMStr(dMain.daily.dawn?dMain.daily.dawn[0]:null),
        dusk:      isoToHMStr(dMain.daily.dusk?dMain.daily.dusk[0]:null),
        solar_noon:isoToHMStr(dMain.daily.solar_noon?dMain.daily.solar_noon[0]:null),
        day_length:dlStr,
        _riseH:    isoToH(dMain.daily.sunrise[0]),
        _riseEndH: isoToH(riseEndIso),                      // fully risen
        _setH:     isoToH(dMain.daily.sunset[0]),           // setStart for arc/countdown
        _setEndH:  isoToH(setEndIso),
        _noonH:    isoToH(dMain.daily.solar_noon?dMain.daily.solar_noon[0]:null),
      };
      setApiStatus('sunrise','ok');
    }else throw new Error('No data');
  }catch(e){
    clearTimeout(tid);
    setApiStatus('sunrise','fail');
    apiData=null;
  }
  document.getElementById('sky-ld').style.display='none';
}
function setApiStatus(api,state){
  const map={sunrise:{dot:'omsr-dot',lbl:'omsr-status'},weather:{dot:'omwx-dot',lbl:'omwx-status'}};
  const ids=map[api]; if(!ids)return;
  const dot=document.getElementById(ids.dot), lbl=document.getElementById(ids.lbl);
  if(!dot||!lbl)return;
  const cfg={
    loading:{bg:'#f0a030',color:'var(--amb)',text:'fetching…'},
    ok:     {bg:'#5cb85c',color:'var(--grn)',text:'live ✓'},
    fail:   {bg:'#e86040',color:'var(--cor)',text:'offline'},
  }[state]||{bg:'#5a5870',color:'var(--t3)',text:'—'};
  dot.style.background=cfg.bg;
  lbl.style.color=cfg.color;
  lbl.textContent=cfg.text;
}
// ── Show/hide polar banner vs normal sunrise/sunset panels ──
function showPolarBanner(type){
  // type: 'midnight_sun' | 'polar_night' | null
  const banner=document.getElementById('solar-polar-banner');
  const riseP =document.getElementById('solar-rise-panel');
  const setP  =document.getElementById('solar-set-panel');
  const progR =document.getElementById('rise-prog-wrap');
  const progS =document.getElementById('set-prog-wrap');
  if(type==='midnight_sun'){
    banner.style.display='block';
    banner.style.background='rgba(240,160,48,.10)';
    banner.style.border='1px solid rgba(240,160,48,.35)';
    document.getElementById('solar-polar-icon').textContent='☀';
    document.getElementById('solar-polar-title').style.color='var(--amb)';
    document.getElementById('solar-polar-title').textContent='MIDNIGHT SUN — No sunrise or sunset today';
    document.getElementById('solar-polar-sub').style.color='var(--amb)';
    document.getElementById('solar-polar-sub').textContent='The sun remains above the horizon for the full 24 hours.\nNo sunrise or sunset occurs at this location today.';
    riseP.style.display='none'; setP.style.display='none';
    if(progR)progR.style.display='none'; if(progS)progS.style.display='none';
  }else if(type==='polar_night'){
    banner.style.display='block';
    banner.style.background='rgba(74,158,255,.08)';
    banner.style.border='1px solid rgba(74,158,255,.30)';
    document.getElementById('solar-polar-icon').textContent='🌑';
    document.getElementById('solar-polar-title').style.color='var(--blu)';
    document.getElementById('solar-polar-title').textContent='POLAR NIGHT — No sunrise or sunset today';
    document.getElementById('solar-polar-sub').style.color='var(--blu)';
    document.getElementById('solar-polar-sub').textContent='The sun stays below the horizon for the full 24 hours.\nNo sunrise or sunset occurs at this location today.';
    riseP.style.display='none'; setP.style.display='none';
    if(progR)progR.style.display='none'; if(progS)progS.style.display='none';
  }else{
    banner.style.display='none';
    riseP.style.display=''; setP.style.display='';
  }
}

// ── Set arc bottom labels for polar cases ──
function setArcPolarLabels(type, noonText){
  const riseWrap=document.getElementById('arc-rise-wrap');
  const noonWrap=document.getElementById('arc-noon-wrap');
  const setWrap =document.getElementById('arc-set-wrap');
  const setBadge=document.getElementById('arc-set-badge');
  const arcR=document.getElementById('arc-r');
  const arcN=document.getElementById('arc-n');
  const arcS=document.getElementById('arc-s');
  if(type==='polar_night'){
    riseWrap.style.display=''; noonWrap.style.display=''; setWrap.style.display='';
    arcR.textContent='No rise'; arcN.textContent=noonText||'—'; arcS.textContent='No rise';
    if(setBadge)setBadge.textContent='Fully Set';
  }else if(type==='midnight_sun'){
    riseWrap.style.display=''; noonWrap.style.display=''; setWrap.style.display='';
    arcR.textContent='No set'; arcN.textContent=noonText||'—'; arcS.textContent='No set';
    if(setBadge)setBadge.textContent='Fully Set';
  }else{
    if(setBadge)setBadge.textContent='Set';
  }
}

// parseAT now handles both "HH:MM" 24-hr strings (from new API) and legacy "H:MM:SS AM/PM" strings
function parseAT(t){if(!t)return null;// 24-hr "HH:MM" or "H:MM"
const m24=t.match(/^(\d{1,2}):(\d{2})$/);if(m24)return parseInt(m24[1])+parseInt(m24[2])/60;// 12-hr legacy
const m=t.match(/(\d+):(\d+):?(\d*)\s*(AM|PM)/i);if(!m)return null;let h=parseInt(m[1]),mn=parseInt(m[2]),pm=m[4].toUpperCase()==='PM';if(pm&&h!==12)h+=12;if(!pm&&h===12)h=0;return h+mn/60;}
function fmtAT(t){const h=parseAT(t);return h===null?'—':fmtHR(h);}

// ═══ DRAW ARC — with fixed midnight sun rendering ═══
function drawArc(rH,nH,sH,nowH,nowEl,specialCase){
  const cv=document.getElementById('c-arc');if(!cv||!cv.offsetWidth)return;
  const ctx=cv.getContext('2d');cv.width=cv.offsetWidth*devicePixelRatio;cv.height=cv.offsetHeight*devicePixelRatio;ctx.scale(devicePixelRatio,devicePixelRatio);
  const W=cv.offsetWidth,H=cv.offsetHeight;ctx.clearRect(0,0,W,H);
  const ml={l:34,r:12,t:12,b:24};const pw=W-ml.l-ml.r,ph=H-ml.t-ml.b;
  const tx=hh=>ml.l+(((hh%24)+24)%24/24)*pw;
  const ty=el=>ml.t+ph-Math.max(0,Math.min(90,el))/90*ph;
  const horizY=ty(0);
  const D=doy(new Date()),dc=sDecl(D);

  // Background + grid
  ctx.fillStyle='rgba(20,30,60,.25)';ctx.fillRect(ml.l,ml.t,pw,ph);
  [0,30,60,90].forEach(deg=>{const y=ty(deg);ctx.strokeStyle='rgba(255,255,255,.06)';ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(ml.l,y);ctx.lineTo(W-ml.r,y);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.35)';ctx.font='8px monospace';ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(deg+'°',ml.l-3,y);});
  ctx.strokeStyle='rgba(255,255,255,.04)';ctx.lineWidth=0.5;
  [0,3,6,9,12,15,18,21,24].forEach(hh=>{ctx.beginPath();ctx.moveTo(tx(hh),ml.t);ctx.lineTo(tx(hh),H-ml.b);ctx.stroke();});
  if(specialCase!=='midnight_sun'){ctx.strokeStyle='rgba(255,255,255,.2)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(ml.l,horizY);ctx.lineTo(W-ml.r,horizY);ctx.stroke();}

  // ── MIDNIGHT SUN — FIXED: full 24h curve anchored to horizY ──
  if(specialCase==='midnight_sun'){
    // Ensure nH is a sane solar-noon value (fallback to 12 if null/0/bad)
    const safeNH=(typeof nH==='number'&&nH>0&&nH<24)?nH:12;
    const pts=[];
    for(let hh=0;hh<=24;hh+=0.05){
      const ha=haCalc(hh,safeNH);
      const el=elevC(uLat,dc,ha);
      // Midnight sun: elevation stays ≥ 0 all day; clamp to at least 0
      pts.push({x:tx(hh),y:ty(Math.max(0,el))});
    }
    // Fill from horizon up to curve
    ctx.beginPath();
    ctx.moveTo(pts[0].x,horizY);
    pts.forEach(p=>ctx.lineTo(p.x,p.y));
    ctx.lineTo(pts[pts.length-1].x,horizY);
    ctx.closePath();
    const fg=ctx.createLinearGradient(0,ml.t,0,horizY);
    fg.addColorStop(0,'rgba(240,160,48,.30)');fg.addColorStop(1,'rgba(240,160,48,.06)');
    ctx.fillStyle=fg;ctx.fill();
    // Curve line only (new path — does NOT include the closing bottom segment)
    ctx.beginPath();ctx.strokeStyle='#f0a030';ctx.lineWidth=2.5;ctx.lineJoin='round';ctx.lineCap='round';
    ctx.moveTo(pts[0].x,pts[0].y);
    pts.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));
    ctx.stroke();
    // Solar noon dashed vertical
    ctx.strokeStyle='#f0a030';ctx.lineWidth=1;ctx.setLineDash([3,3]);
    ctx.beginPath();ctx.moveTo(tx(safeNH),ml.t);ctx.lineTo(tx(safeNH),H-ml.b);ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='#f0a030';ctx.font='bold 11px monospace';ctx.textAlign='center';ctx.textBaseline='top';
    ctx.fillText('MIDNIGHT SUN — sun stays above horizon all 24 hours',W/2,ml.t+6);
    ctx.fillStyle='#f0a030';ctx.font='9px monospace';ctx.textBaseline='bottom';
    ctx.fillText('Noon '+fmtHR(safeNH),tx(safeNH),ml.t+26);
  }
  // ── POLAR NIGHT ──
  else if(specialCase==='polar_night'){
    const safeNH=(typeof nH==='number'&&nH>0&&nH<24)?nH:12;
    const pts=[];
    for(let hh=0;hh<=24;hh+=0.05){
      const ha=haCalc(hh,safeNH);const el=elevC(uLat,dc,ha);
      const mappedY=horizY+Math.min(ph*0.6,(-el/90)*ph*0.6);
      pts.push({x:tx(hh),y:mappedY});
    }
    ctx.setLineDash([4,4]);ctx.strokeStyle='rgba(74,158,255,.4)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.stroke();ctx.setLineDash([]);
    ctx.strokeStyle='#f0a030';ctx.lineWidth=1;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(tx(safeNH),ml.t);ctx.lineTo(tx(safeNH),H-ml.b);ctx.stroke();ctx.setLineDash([]);
    const maxEl=elevC(uLat,dc,0);
    ctx.fillStyle='#4a9eff';ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.textBaseline='top';
    ctx.fillText('POLAR NIGHT — sun never rises today',W/2,ml.t+6);
    ctx.font='10px monospace';ctx.fillStyle='rgba(74,158,255,.7)';
    ctx.fillText('Max elevation: '+maxEl.toFixed(1)+'° (below horizon)',W/2,ml.t+24);
  }
  // ── NORMAL DAY ──
  else{
    function elevAt(hh){if(hh<=rH||hh>=sH)return 0;const ha=haCalc(hh,nH);return Math.max(0,elevC(uLat,dc,ha));}
    const pts=[];for(let hh=rH;hh<=sH+0.04;hh+=0.04){const clamped=Math.min(hh,sH);pts.push({x:tx(clamped),y:ty(elevAt(clamped))});}
    if(pts.length>1){
      ctx.beginPath();ctx.moveTo(tx(rH),horizY);pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.lineTo(tx(sH),horizY);ctx.closePath();
      const fg=ctx.createLinearGradient(0,ml.t,0,horizY);fg.addColorStop(0,'rgba(240,160,48,.22)');fg.addColorStop(1,'rgba(240,160,48,.04)');ctx.fillStyle=fg;ctx.fill();
      ctx.beginPath();ctx.strokeStyle='#f0a030';ctx.lineWidth=2.5;ctx.lineJoin='round';ctx.moveTo(tx(rH),horizY);pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.lineTo(tx(sH),horizY);ctx.stroke();
    }
    [[rH,'#2ec4b6'],[nH,'#f0a030'],[sH,'#e86040']].forEach(([hh,col])=>{ctx.strokeStyle=col;ctx.lineWidth=1;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(tx(hh),ml.t);ctx.lineTo(tx(hh),H-ml.b);ctx.stroke();ctx.setLineDash([]);});
  }

  // Now dot
  const safeNH_dot=(specialCase==='midnight_sun')
    ?((typeof nH==='number'&&nH>0&&nH<24)?nH:12)
    :nH;
  const ha=haCalc(nowH,safeNH_dot);const realEl=elevC(uLat,dc,ha);
  let dotY;
  if(specialCase==='midnight_sun')dotY=ty(Math.max(0,realEl));
  else if(specialCase==='polar_night')dotY=horizY+Math.min(ph*0.6,(-realEl/90)*ph*0.6);
  else dotY=realEl>0?ty(realEl):horizY;
  ctx.fillStyle='#4a9eff';ctx.beginPath();ctx.arc(tx(nowH),dotY,5,0,2*Math.PI);ctx.fill();
  ctx.fillStyle='rgba(74,158,255,.7)';ctx.font='8px monospace';ctx.textAlign='center';ctx.textBaseline='bottom';
  ctx.fillText(fmtH(nowH),tx(nowH),dotY-7);

  // X-axis labels
  ctx.fillStyle='rgba(255,255,255,.25)';ctx.font='8px monospace';ctx.textAlign='center';ctx.textBaseline='top';
  [0,3,6,9,12,15,18,21].forEach(hh=>ctx.fillText(String(hh).padStart(2,'0')+':00',tx(hh),H-ml.b+3));
}

function dash(){
  const now=new Date();const D=doy(now),dc=sDecl(D),n=snoon(uLng,uTZ,D);
  const lH=localH(uTZ);const HA=haCalc(lH,n),EL=elevC(uLat,dc,HA),AZ=azC(uLat,dc,EL,HA);
  const LX=luxC(EL,0.15);const lxs=LX>1000?Math.round(LX/100)*100:Math.round(LX);
  document.getElementById('d-el').textContent=EL.toFixed(1)+'°';
  function azDir(az){const dirs=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];return dirs[Math.round(az/22.5)%16];}
  document.getElementById('d-el-s').textContent=EL>0?azDir(AZ)+' '+AZ.toFixed(0)+'° az':'Below horizon';
  document.getElementById('d-lx').textContent=lxs.toLocaleString();document.getElementById('d-lx-s').textContent=scnR(LX);
  document.getElementById('d-scn').textContent=scnR(LX);document.getElementById('d-dc').textContent=dc.toFixed(2)+'°';
  document.getElementById('d-sub').textContent=dc.toFixed(2)+'°'+(dc>=0?'N':'S');
  const cityDate=new Date(Date.now()+uTZ*3600000);const mo=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  document.getElementById('arc-dt').textContent=cityDate.getUTCDate()+' '+mo[cityDate.getUTCMonth()]+' '+cityDate.getUTCFullYear();
  const uv=calcUV(EL,uLat,uAlt);renderUV(uv,uLat,uAlt,EL);
  let rH,rEndH,sH,sEndH,nH;
  let isMidnightSunOverride=false;
  const vsop=srTimes(uLat,dc,n);
  const isMidnightSun=vsop.special==='midnight_sun'||vsop.dl>=23.0;
  const isPolarNight=vsop.special==='polar_night'||vsop.dl<=0.01;
  if(apiData){
    const apiNoon=parseAT(apiData.solar_noon);
    nH=(apiNoon!==null&&apiNoon>0)?apiNoon:n;
    if(isMidnightSun||isPolarNight){
      // VSOP is authoritative for polar extremes — completely ignore API sunrise/sunset times
      rH=n-6;rEndH=n-5.97;sH=n+6;sEndH=n+6;
      showPolarBanner(isMidnightSun?'midnight_sun':'polar_night');
      setArcPolarLabels(isMidnightSun?'midnight_sun':'polar_night', fmtHR(nH));
    }else{
      const apiRise   =parseAT(apiData.sunrise);      // top limb appears
      const apiRiseEnd=parseAT(apiData.sunrise_end);  // bottom limb clears — fully risen
      const apiSet    =parseAT(apiData.sunset);        // bottom limb at horizon — sunset STARTS
      const apiSetEnd =parseAT(apiData.sunset_end);    // top limb gone — fully set
      if(apiRise!==null&&apiSet!==null&&apiSet<apiRise+1){
        // Wrap-around = effective midnight sun
        rH=vsop.rise||n-6;rEndH=vsop.riseEnd||rH+0.03;sH=vsop.setStart||n+6;sEndH=vsop.setEnd||sH;
        showPolarBanner('midnight_sun');
        document.getElementById('arc-rise-wrap').style.display='';
        document.getElementById('arc-noon-wrap').style.display='';
        document.getElementById('arc-set-wrap').style.display='';
        const arcSetBadge2=document.getElementById('arc-set-badge');if(arcSetBadge2)arcSetBadge2.textContent='Set';
        ['arc-r'].forEach(id=>document.getElementById(id).textContent='~'+fmtHR(apiRise));
        ['arc-s'].forEach(id=>document.getElementById(id).textContent='~'+fmtHR(sEndH||apiSet));
        isMidnightSunOverride=true;
      }else{
        showPolarBanner(null);
        document.getElementById('arc-rise-wrap').style.display='';
        document.getElementById('arc-noon-wrap').style.display='';
        document.getElementById('arc-set-wrap').style.display='';
        const arcSetBadge3=document.getElementById('arc-set-badge');if(arcSetBadge3)arcSetBadge3.textContent='Set';
        rH    =apiRise   !==null?apiRise   :(vsop.rise    ||n-6);
        rEndH =apiRiseEnd!==null?apiRiseEnd:(vsop.riseEnd ||rH+0.03);
        sH    =apiSet    !==null?apiSet    :(vsop.setStart||n+6);
        sEndH =apiSetEnd !==null?apiSetEnd :(vsop.setEnd  ||sH+0.53);
        // Sunrise window
        ['d-rise','arc-r'].forEach(id=>document.getElementById(id).textContent=fmtAT(apiData.sunrise));
        document.getElementById('d-rise-end').textContent=apiData.sunrise_end?fmtAT(apiData.sunrise_end):(fmtHR(rEndH));
        const riseDurMin=Math.round((rEndH-rH)*60);
        document.getElementById('d-rise-dur').textContent=riseDurMin>0?riseDurMin+'min':'~2min';
        // Sunset window
        ['d-set'].forEach(id=>document.getElementById(id).textContent=fmtAT(apiData.sunset));
        document.getElementById('arc-s').textContent=apiData.sunset_end?fmtAT(apiData.sunset_end):(fmtHR(sEndH));
        document.getElementById('d-set-end').textContent=apiData.sunset_end?fmtAT(apiData.sunset_end):(fmtHR(sEndH));
        const setDurMin=Math.round((sEndH-sH)*60);
        document.getElementById('d-set-dur').textContent=setDurMin>0?setDurMin+'min':'~2min';
      }
    }
    ['d-noon','arc-n'].forEach(id=>document.getElementById(id).textContent=fmtHR(nH));
    document.getElementById('d-dawn').textContent=(isMidnightSun||isPolarNight)?'—':fmtAT(apiData.dawn);
    document.getElementById('d-dusk').textContent=(isMidnightSun||isPolarNight)?'—':fmtAT(apiData.dusk);
    document.getElementById('d-len').textContent=isMidnightSun?'24h 00m':isPolarNight?'0h 00m':(apiData.day_length||'—');
  }
  else{
    // VSOP fallback — srTimes gives asymmetric rise/riseEnd/setStart/setEnd
    const civ=srss(uLat,dc,6);
    if(isMidnightSun||isPolarNight){
      rH=n-6;rEndH=n-5.97;sH=n+6;sEndH=n+6;nH=n;
      showPolarBanner(isMidnightSun?'midnight_sun':'polar_night');
      setArcPolarLabels(isMidnightSun?'midnight_sun':'polar_night', fmtHR(n));
      document.getElementById('d-dawn').textContent='—';
      document.getElementById('d-dusk').textContent='—';
      const dlH=isMidnightSun?24:0;
      document.getElementById('d-len').textContent=isMidnightSun?'24h 00m':'0h 00m';
    }else{
    showPolarBanner(null);
    document.getElementById('arc-rise-wrap').style.display='';
    document.getElementById('arc-noon-wrap').style.display='';
    document.getElementById('arc-set-wrap').style.display='';
    const arcSetBadge5=document.getElementById('arc-set-badge');if(arcSetBadge5)arcSetBadge5.textContent='Set';
    rH    =vsop.rise    !==null?vsop.rise    :(n-6);
    rEndH =vsop.riseEnd !==null?vsop.riseEnd :(rH+0.03);
    sH    =vsop.setStart!==null?vsop.setStart:(n+6);
    sEndH =vsop.setEnd  !==null?vsop.setEnd  :(n+6.53);
    nH=n;
    ['d-rise','arc-r'].forEach(id=>document.getElementById(id).textContent=fmtHR(rH));
    document.getElementById('d-rise-end').textContent=fmtHR(rEndH);
    const riseDurMin=Math.round((rEndH-rH)*60);
    document.getElementById('d-rise-dur').textContent=riseDurMin>0?riseDurMin+'min':'~2min';
    ['d-set'].forEach(id=>document.getElementById(id).textContent=fmtHR(sH));
    document.getElementById('arc-s').textContent=fmtHR(sEndH);
    document.getElementById('d-set-end').textContent=fmtHR(sEndH);
    const setDurMinFb=Math.round((sEndH-sH)*60);
    document.getElementById('d-set-dur').textContent=setDurMinFb>0?setDurMinFb+'min':'~2min';
    ['d-noon','arc-n'].forEach(id=>document.getElementById(id).textContent=fmtHR(n));
    document.getElementById('d-dawn').textContent=fmtHR(civ.r+n-12);
    document.getElementById('d-dusk').textContent=fmtHR(civ.s+n-12);
    let dlH=Math.floor(vsop.dl),dlM=Math.round((vsop.dl-dlH)*60);if(dlM>=60){dlM=0;dlH++;}
    document.getElementById('d-len').textContent=dlH+'h '+dlM+'m';
    }
  }
  document.getElementById('dd-lx').textContent=lxs.toLocaleString()+' lux';document.getElementById('dd-bd').textContent=scnR(LX);const _tNow=localHMS(uTZ);document.getElementById('dd-now').textContent=String(_tNow.h).padStart(2,'0')+':'+String(_tNow.m).padStart(2,'0');document.getElementById('dd-city').textContent=uCity;
  // ── SOLAR TIME: Local Time + Longitude Correction + Equation of Time ──
  const tzMeridian=uTZ*15;
  const lngCorMin=(uLng-tzMeridian)*4;
  const eotMin=eot(D);
  const lngCorSign=lngCorMin>=0?'+':'-';
  const lngCorAbs=Math.abs(lngCorMin).toFixed(1);
  const eotSign=eotMin>=0?'+':'-';
  const eotAbs=Math.abs(eotMin).toFixed(1);

  document.getElementById('dd-solar-s').textContent='LngCorr '+lngCorSign+lngCorAbs+'m · EoT '+eotSign+eotAbs+'m';
  const mel=LX>1000?{t:'suppressed',c:'bT'}:lH>=21||lH<4?{t:'rising/peak',c:'bA'}:lH>=18&&LX<500?{t:'beginning',c:'bA'}:{t:'suppressed',c:'bT'};
  const cor=lH>=6&&lH<=8&&EL>5?{t:'peak (CAR)',c:'bA'}:lH>=6&&lH<=12?{t:'elevated',c:'bA'}:lH>=12&&lH<=16?{t:'declining',c:'bB'}:{t:'low',c:'bB'};
  const mEl=document.getElementById('d-mel'),cEl=document.getElementById('d-cor');mEl.textContent=mel.t;mEl.className='badge '+mel.c;cEl.textContent=cor.t;cEl.className='badge '+cor.c;
  const da=document.getElementById('dd-al');if(LX<500&&EL>0&&lH>10&&lH<16){da.className='al alW';da.textContent='⚠ Midday lux <500 — false sunset signal in '+uCity+'.';}else da.innerHTML='';

  // ── PROGRESS BARS: sunrise window / sunset window ──
  const riseProgWrap=document.getElementById('rise-prog-wrap');
  const setProgWrap =document.getElementById('set-prog-wrap');
  if(rH&&rEndH&&lH>=rH&&lH<=rEndH){
    const pct=Math.round(((lH-rH)/(rEndH-rH))*100);
    riseProgWrap.style.display='block';
    document.getElementById('rise-prog-bar').style.width=pct+'%';
    document.getElementById('rise-prog-pct').textContent=pct+'%';
  }else if(riseProgWrap){riseProgWrap.style.display='none';}
  if(sH&&sEndH&&lH>=sH&&lH<=sEndH){
    const pct=Math.round(((lH-sH)/(sEndH-sH))*100);
    setProgWrap.style.display='block';
    document.getElementById('set-prog-bar').style.width=pct+'%';
    document.getElementById('set-prog-pct').textContent=pct+'%';
  }else if(setProgWrap){setProgWrap.style.display='none';}

  // ── NEXT EVENT countdown ──
  function fmtCD(m){return m<60?m+'min':Math.floor(m/60)+'h'+(m%60?' '+m%60+'min':'');}
  const nxtEl=document.getElementById('d-nxt');
  if(isMidnightSun||isMidnightSunOverride){
    nxtEl.textContent='';
    nxtEl.innerHTML='<span style="display:inline-block;width:18px;height:18px;border-radius:3px;background:#f0c040;vertical-align:middle"></span>';
  }else if(isPolarNight){
    nxtEl.textContent='';
    nxtEl.innerHTML='<span style="display:inline-block;width:18px;height:18px;border-radius:3px;background:#1a2a6c;vertical-align:middle"></span>';
  }else{
    let nxt='';
    if(lH<rH){nxt='Sunrise in '+fmtCD(Math.round((rH-lH)*60));}
    else if(lH<rEndH){nxt='Sun fully rising — '+fmtCD(Math.round((rEndH-lH)*60))+' to clear horizon';}
    else if(lH<nH){nxt='Solar noon in '+fmtCD(Math.round((nH-lH)*60));}
    else if(lH<sH){nxt='Sunset begins in '+fmtCD(Math.round((sH-lH)*60));}
    else if(lH<sEndH){nxt='Sun fully sets in '+fmtCD(Math.round((sEndH-lH)*60));}
    else{let minsToSunrise=Math.round((rH+24-lH)*60);if(minsToSunrise>24*60)minsToSunrise-=24*60;nxt='Sunrise in '+fmtCD(minsToSunrise);}
    nxtEl.textContent=nxt;
  }

  let specialCase=null;
  if(isMidnightSun||isMidnightSunOverride)specialCase='midnight_sun';
  else if(isPolarNight)specialCase='polar_night';
  drawArc(rH,nH,sEndH,lH,EL,specialCase);if(wxData)renderWeather(wxData);
}

function doLat(){
  const city=SEL['lat-d']||CITIES[0];const lat=city.lat,lng=city.lng,tzStd=city.tzStd!==undefined?city.tzStd:city.tz;
  const ex=annualEx(lat,lng,tzStd);
  // For polar-only locations, sVar would be 0 (pure pole) — base fmt24 on latitude instead
  const sVarForScore=(ex.polar==='midnight_sun_always'||ex.polar==='polar_night_always')?Math.abs(lat)*5:ex.sVar;
  const fmt24=Math.min(10,Math.round(sVarForScore/30));const stab=Math.max(1,10-Math.round(sVarForScore/30));const jetlag=Math.min(10,Math.round(Math.abs(lat-12.97)/5));const mood=Math.min(10,Math.round(sVarForScore/30));const wkRel=ex.rVar<30?'Very reliable':ex.rVar<60?'Reliable':ex.rVar<90?'Moderate':ex.rVar<120?'Unreliable':'Very unreliable';const hasDST=city.tzStd!==undefined&&city.tzStd!==city.tz;
  // Build polar-aware display strings for the sunrise/sunset span cards
  let rvText, rvSub, svText, svSub, cascadeRise, cascadeSet, latRiseStr, latSetStr;
  const p=ex.polar;
  if(p==='midnight_sun_always'){
    rvText='∞'; rvSub='00:00–00:00 · 24h daylight all year — no sunrise';
    svText='∞'; svSub='23:59–23:59 · 24h daylight all year — no sunset';
    cascadeRise='Midnight sun all year — no sunrise/sunset'; cascadeSet=cascadeRise;
    latRiseStr='00:00–00:00 · 24h daylight all year — no sunrise';
    latSetStr ='23:59–23:59 · 24h daylight all year — no sunset';
  } else if(p==='polar_night_always'){
    rvText='∞'; rvSub='23:59–23:59 · polar night all year — no sunrise';
    svText='∞'; svSub='00:00–00:00 · polar night all year — no sunset';
    cascadeRise='Polar night all year — no sunrise/sunset'; cascadeSet=cascadeRise;
    latRiseStr='23:59–23:59 · polar night all year — no sunrise';
    latSetStr ='00:00–00:00 · polar night all year — no sunset';
  } else if(p==='midnight_sun'||p==='both'){
    // Has midnight sun periods: sunrise can be as early as 00:00
    rvText='00:00–23:59'; rvSub='full clock range — polar extremes';
    svText='00:00–23:59'; svSub='full clock range — polar extremes';
    cascadeRise='Rise: 00:00–'+fmtHR(ex.maxR)+' (incl. midnight sun)';
    cascadeSet='Set: '+fmtHR(ex.minS)+'–23:59 (incl. midnight sun)';
    latRiseStr='00:00–23:59 · full clock range — polar extremes';
    latSetStr ='00:00–23:59 · full clock range — polar extremes';
  } else if(p==='polar_night'){
    // Has polar night periods: latest sunrise is 23:59, earliest sunset is 00:00
    rvText='00:00–23:59'; rvSub='full clock range — polar extremes';
    svText='00:00–23:59'; svSub='full clock range — polar extremes';
    cascadeRise='Rise: '+fmtHR(ex.minR)+'–23:59 (incl. polar night)';
    cascadeSet='Set: 00:00–'+fmtHR(ex.maxS)+' (incl. polar night)';
    latRiseStr='00:00–23:59 · full clock range — polar extremes';
    latSetStr ='00:00–23:59 · full clock range — polar extremes';
  } else {
    // Normal (no polar extremes)
    rvText=ex.rVar+'min'; rvSub=fmtHR(ex.minR)+' earliest · '+fmtHR(ex.maxR)+' latest — first limb';
    svText=ex.sVar+'min'; svSub=fmtHR(ex.minS)+' earliest · '+fmtHR(ex.maxS)+' latest — fully set';
    cascadeRise='Rise first limb: '+fmtHR(ex.minR)+'–'+fmtHR(ex.maxR);
    cascadeSet='Set fully set: '+fmtHR(ex.minS)+'–'+fmtHR(ex.maxS);
    latRiseStr=fmtHR(ex.minR)+' earliest · '+fmtHR(ex.maxR)+' latest — first limb';
    latSetStr =fmtHR(ex.minS)+' earliest · '+fmtHR(ex.maxS)+' latest — fully set';
  }
  document.getElementById('a-lat').textContent=Math.abs(lat).toFixed(2)+'°'+(lat>=0?'N':'S');document.getElementById('a-city').textContent=city.n+(hasDST?' (std. '+tzLabel(tzStd)+')':'');document.getElementById('a-fmt').textContent=fmt24+'/10';
  document.getElementById('a-rv').textContent=rvText; document.getElementById('a-rv-s').textContent=rvSub;
  document.getElementById('a-sv').textContent=svText; document.getElementById('a-sv-s').textContent=svSub;
  document.getElementById('a-wk').textContent=wkRel;
  document.getElementById('lat-c').innerHTML=[`<span style="color:var(--amb)">Lat ${Math.abs(lat).toFixed(1)}°${lat>=0?'N':'S'}</span> → sunrise spans ${ex.rVar}min/year`,hasDST?`<span style="color:var(--tel)">DST excluded</span> — using std offset ${tzLabel(tzStd)}`:'No DST',`<span style="color:var(--amb)">Rise</span> ${cascadeRise}`,`<span style="color:var(--amb)">Set</span> ${cascadeSet}`,`<span style="color:var(--amb)">Sun-wake</span> ${wkRel} · 24hr need ${fmt24}/10`].join('<br>');
  document.getElementById('lat-r').innerHTML=`<b style="color:var(--amb)">${city.n}</b> at ${Math.abs(lat).toFixed(2)}°${lat>=0?'N':'S'}${hasDST?' — standard offset '+tzLabel(tzStd):''}. Sunrise span (first limb appears) ${ex.rVar}min (${latRiseStr}). Sunset span (sun fully set) ${ex.sVar}min (${latSetStr}).`;
  document.getElementById('lat-sc').innerHTML=[{l:'24hr format need',v:fmt24},{l:'Circadian stability',v:stab},{l:'Seasonal mood risk',v:mood},{l:'Jet lag from Bengaluru',v:jetlag},{l:'Sun-wake reliability',v:Math.max(1,10-Math.round(ex.rVar/20))}].map(s=>`<div class="srow"><div class="sbl">${s.l}</div><div class="sbar"><div class="sbf" style="width:${s.v*10}%;background:${s.v>=7?'var(--cor)':s.v>=4?'var(--amb)':'var(--tel)'}"></div></div><div class="sv">${s.v}/10</div></div>`).join('');
  buildParadoxTable();
}

function buildParadoxTable(){
  const paradoxCities=[{city:'Bengaluru',cityKey:'Bengaluru',fmt:'12hr dominant',logic:'Should use 24hr — minimal need',logicGood:false},{city:'Singapore',cityKey:'Singapore',fmt:'24hr official',logic:'Correct — almost no variation',logicGood:true},{city:'Tokyo',cityKey:'Tokyo',fmt:'24hr casual',logic:'Correct — variation justifies it',logicGood:true},{city:'New York',cityKey:'New York',fmt:'12hr dominant',logic:'Needs 24hr most — uses 12hr',logicGood:false},{city:'London',cityKey:'London',fmt:'12hr dominant',logic:'Highest need, still uses 12hr',logicGood:false},{city:'Berlin',cityKey:'Berlin',fmt:'24hr casual',logic:'Correct — same latitude as London',logicGood:true},{city:'Moscow',cityKey:'Moscow',fmt:'24hr dominant',logic:'Correct — high variation',logicGood:true},{city:'Reykjavik',cityKey:'Reykjavik',fmt:'24hr',logic:'Correct — extreme variation',logicGood:true},{city:'Mumbai',cityKey:'Mumbai',fmt:'12hr dominant',logic:'Low variation — cultural lag',logicGood:false},{city:'Sydney',cityKey:'Sydney',fmt:'12hr dominant',logic:'High southern lat — should use 24hr',logicGood:false}];
  const tbody=document.getElementById('paradox-tbody');if(!tbody)return;
  let html='';
  for(const row of paradoxCities){const cityObj=CITIES.find(c=>c.n===row.cityKey);let sVar='—',latStr='—';if(cityObj){const tzStd=cityObj.tzStd!==undefined?cityObj.tzStd:cityObj.tz;const ex=annualEx(cityObj.lat,cityObj.lng,tzStd);sVar=ex.sVar+'min';latStr=Math.abs(cityObj.lat).toFixed(2)+'°'+(cityObj.lat>=0?'N':'S');}const fmtBadge=row.fmt.includes('24')?'<span class="badge bT">'+row.fmt+'</span>':'<span class="badge bC">'+row.fmt+'</span>';const logicColor=row.logicGood?'var(--grn)':'var(--cor)';html+=`<tr><td><b>${row.city}</b></td><td class="mono" style="color:var(--amb)">${latStr}</td><td class="mono" style="color:var(--amb)">${sVar}</td><td>${fmtBadge}</td><td style="color:${logicColor};font-size:11px">${row.logic}</td></tr>`;}
  tbody.innerHTML=html;
}

function doCmp(){
  const A=SEL['ca-d']||CITIES[0];const B=SEL['cb-d'];if(!B){document.getElementById('cmp-out').innerHTML='<div class="al alW">Select a second city.</div>';return;}
  const tzA=A.tzStd!==undefined?A.tzStd:A.tz;const tzB=B.tzStd!==undefined?B.tzStd:B.tz;
  const exA=annualEx(A.lat,A.lng,tzA);const exB=annualEx(B.lat,B.lng,tzB);
  const wA=exA.rVar<30?'Very reliable':exA.rVar<60?'Reliable':exA.rVar<90?'Moderate':'Unreliable';const wB=exB.rVar<30?'Very reliable':exB.rVar<60?'Reliable':exB.rVar<90?'Moderate':'Unreliable';
  document.getElementById('cmp-out').innerHTML=`<table class="ct"><thead><tr><th>Metric</th><th>${A.n}</th><th>${B.n}</th></tr></thead><tbody><tr><td>Latitude</td><td class="mono">${Math.abs(A.lat).toFixed(2)}°${A.lat>=0?'N':'S'}</td><td class="mono">${Math.abs(B.lat).toFixed(2)}°${B.lat>=0?'N':'S'}</td></tr><tr><td>Earliest sunrise</td><td class="mono">${fmtHR(exA.minR)}</td><td class="mono">${fmtHR(exB.minR)}</td></tr><tr><td>Latest sunrise</td><td class="mono">${fmtHR(exA.maxR)}</td><td class="mono">${fmtHR(exB.maxR)}</td></tr><tr><td>Sunrise variation</td><td class="mono">${exA.rVar}min</td><td class="mono">${exB.rVar}min</td></tr><tr><td>Earliest sunset</td><td class="mono">${fmtHR(exA.minS)}</td><td class="mono">${fmtHR(exB.minS)}</td></tr><tr><td>Latest sunset</td><td class="mono">${fmtHR(exA.maxS)}</td><td class="mono">${fmtHR(exB.maxS)}</td></tr><tr><td>Sun-wake reliability</td><td>${wA}</td><td>${wB}</td></tr></tbody></table>`;
}

function applyAnaCity(){
  const sel=SEL['ana-city-d'];if(!sel)return;
  const lbl=document.getElementById('ana-city-label');const latInp=document.getElementById('ana-lat-inp');
  if(latInp)latInp.value=sel.lat.toFixed(2);
  if(sel.lat<0){anaHemi='S';document.getElementById('hemi-s').classList.add('on');document.getElementById('hemi-n').classList.remove('on');}
  else{anaHemi='N';document.getElementById('hemi-n').classList.add('on');document.getElementById('hemi-s').classList.remove('on');}
  if(lbl)lbl.textContent=sel.n+' · '+Math.abs(sel.lat).toFixed(2)+'°'+(sel.lat>=0?'N':'S');
  drawAnalemma();
}

function drawAnalemma(){
  const isSH=(anaHemi==='S');const timeStr=document.getElementById('ana-time').value||'12:00';
  const lbl=document.getElementById('ana-hemi-label');if(lbl)lbl.textContent=(isSH?'🌏 Southern Hemisphere — Dec solstice at top':'🌍 Northern Hemisphere — Jun solstice at top');
  const latVal=parseFloat(document.getElementById('ana-lat-inp')?document.getElementById('ana-lat-inp').value:13)||0;
  const tiltDeg=80*(1-Math.abs(latVal)/90);const tiltRad=tiltDeg*Math.PI/180;
  const today=doy(new Date());const rawPts=[];let todayRaw=null;
  for(let d=1;d<=365;d++){const dc=sDecl(d);const eotMin=eot(d);const rx=-eotMin;const ry=isSH?-dc:dc;const cosT=Math.cos(tiltRad),sinT=Math.sin(tiltRad);const x=rx*cosT-ry*sinT;const y=rx*sinT+ry*cosT;rawPts.push({x,y,rx,ry,d,dc,eotMin});if(d===today)todayRaw={x,y,rx,ry,d,dc,eotMin};}
  function seasonColor(d,isSouth){const dc=sDecl(d);const inMarEq=(d>=70&&d<=100);const inSepEq=(d>=255&&d<=275);if(inMarEq)return isSouth?'#f0c030':'#5cb85c';if(inSepEq)return isSouth?'#5cb85c':'#f0c030';if(!isSouth){if(dc>10)return'#e86040';if(dc<-10)return'#4a9eff';return dc>0?'#f0a030':'#6aa0d0';}else{if(dc>10)return'#4a9eff';if(dc<-10)return'#e86040';return dc<0?'#f0a030':'#6aa0d0';}}
  const junSolIdx=171;const decSolIdx=354;const topSolstice=isSH?rawPts[decSolIdx]:rawPts[junSolIdx];const botSolstice=isSH?rawPts[junSolIdx]:rawPts[decSolIdx];const topLabel=isSH?'Summer (Dec 21)':'Summer (Jun 21)';const botLabel=isSH?'Winter (Jun 21)':'Winter (Dec 21)';
  const cv=document.getElementById('c-ana');if(!cv||!cv.offsetWidth)return;cv.width=cv.offsetWidth*devicePixelRatio;cv.height=cv.offsetHeight*devicePixelRatio;const ctx=cv.getContext('2d');ctx.scale(devicePixelRatio,devicePixelRatio);const W=cv.offsetWidth,H=cv.offsetHeight;ctx.clearRect(0,0,W,H);
  const ml={l:22,r:22,t:42,b:46};const pw=W-ml.l-ml.r,ph=H-ml.t-ml.b;
  const xs=rawPts.map(p=>p.x),ys=rawPts.map(p=>p.y);const xMin=Math.min(...xs)-2,xMax=Math.max(...xs)+2;const yMin=Math.min(...ys)-2,yMax=Math.max(...ys)+2;const xRange=xMax-xMin,yRange=yMax-yMin;const range=Math.max(xRange,yRange);const xMid=(xMin+xMax)/2,yMid=(yMin+yMax)/2;const fxMin=xMid-range/2,fxMax=xMid+range/2;const fyMin=yMid-range/2,fyMax=yMid+range/2;
  function atx(xv){return ml.l+(xv-fxMin)/(fxMax-fxMin)*pw;}function aty(yv){return ml.t+ph-(yv-fyMin)/(fyMax-fyMin)*ph;}
  ctx.fillStyle='rgba(10,15,30,.65)';ctx.fillRect(ml.l,ml.t,pw,ph);
  ctx.strokeStyle='rgba(255,255,255,.07)';ctx.lineWidth=0.5;
  for(let v=Math.ceil(fyMin);v<=Math.floor(fyMax);v+=5){ctx.beginPath();ctx.moveTo(ml.l,aty(v));ctx.lineTo(W-ml.r,aty(v));ctx.stroke();}
  for(let v=Math.ceil(fxMin);v<=Math.floor(fxMax);v+=5){ctx.beginPath();ctx.moveTo(atx(v),ml.t);ctx.lineTo(atx(v),H-ml.b);ctx.stroke();}
  ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=1;const x0=atx(0),y0=aty(0);if(y0>=ml.t&&y0<=H-ml.b){ctx.beginPath();ctx.moveTo(ml.l,y0);ctx.lineTo(W-ml.r,y0);ctx.stroke();}if(x0>=ml.l&&x0<=W-ml.r){ctx.beginPath();ctx.moveTo(x0,ml.t);ctx.lineTo(x0,H-ml.b);ctx.stroke();}
  ctx.beginPath();ctx.strokeStyle='rgba(200,200,220,.1)';ctx.lineWidth=4;rawPts.forEach((p,i)=>i===0?ctx.moveTo(atx(p.x),aty(p.y)):ctx.lineTo(atx(p.x),aty(p.y)));ctx.closePath();ctx.stroke();
  ctx.lineWidth=2.5;ctx.lineJoin='round';for(let i=1;i<rawPts.length;i++){ctx.beginPath();ctx.strokeStyle=seasonColor(rawPts[i].d,isSH);ctx.moveTo(atx(rawPts[i-1].x),aty(rawPts[i-1].y));ctx.lineTo(atx(rawPts[i].x),aty(rawPts[i].y));ctx.stroke();}
  const sumCol='#e86040',winCol='#4a9eff';ctx.fillStyle=isSH?winCol:sumCol;ctx.beginPath();ctx.arc(atx(topSolstice.x),aty(topSolstice.y),6,0,2*Math.PI);ctx.fill();ctx.fillStyle=isSH?winCol:sumCol;ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText(topLabel,atx(topSolstice.x),aty(topSolstice.y)-8);
  ctx.fillStyle=isSH?sumCol:winCol;ctx.beginPath();ctx.arc(atx(botSolstice.x),aty(botSolstice.y),6,0,2*Math.PI);ctx.fill();ctx.fillStyle=isSH?sumCol:winCol;ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText(botLabel,atx(botSolstice.x),aty(botSolstice.y)+8);
  const marPt=rawPts[79];const sepPt=rawPts[263];const marCol=isSH?'#f0c030':'#5cb85c';ctx.fillStyle=marCol;ctx.beginPath();ctx.arc(atx(marPt.x),aty(marPt.y),5,0,2*Math.PI);ctx.fill();ctx.fillStyle=marCol;ctx.font='8px sans-serif';ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(isSH?'Mar Eq (SH autumn)':'Mar Equinox',atx(marPt.x)-8,aty(marPt.y));
  const sepCol=isSH?'#5cb85c':'#f0c030';ctx.fillStyle=sepCol;ctx.beginPath();ctx.arc(atx(sepPt.x),aty(sepPt.y),5,0,2*Math.PI);ctx.fill();ctx.fillStyle=sepCol;ctx.font='8px sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(isSH?'Sep Eq (SH spring)':'Sep Equinox',atx(sepPt.x)+8,aty(sepPt.y));
  if(todayRaw){ctx.beginPath();ctx.arc(atx(todayRaw.x),aty(todayRaw.y),10,0,2*Math.PI);ctx.strokeStyle='rgba(255,255,255,.2)';ctx.lineWidth=1.5;ctx.stroke();ctx.beginPath();ctx.arc(atx(todayRaw.x),aty(todayRaw.y),5,0,2*Math.PI);ctx.fillStyle='#fff';ctx.fill();ctx.beginPath();ctx.arc(atx(todayRaw.x),aty(todayRaw.y),3,0,2*Math.PI);ctx.fillStyle='#e86040';ctx.fill();const tLX=todayRaw.x>0?atx(todayRaw.x)+13:atx(todayRaw.x)-13;const tA=todayRaw.x>0?'left':'right';ctx.fillStyle='#fff';ctx.font='bold 9px sans-serif';ctx.textAlign=tA;ctx.textBaseline='middle';ctx.fillText('Today',tLX,aty(todayRaw.y));ctx.fillStyle='rgba(255,255,255,.6)';ctx.font='8px monospace';ctx.fillText('EoT '+(-todayRaw.rx).toFixed(1)+'m',tLX,aty(todayRaw.y)+11);}
  const hemiName=isSH?'Southern Hemisphere':'Northern Hemisphere';const latAbs=Math.abs(latVal);const tiltNote=latAbs<5?'Equator — nearly horizontal':latAbs<25?'Tropical — slight tilt':latAbs<50?'Mid-latitude — moderate tilt':latAbs<70?'High-latitude — steep tilt':'Polar — nearly upright';
  const maxTitleW=W-16;ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='top';const titleFull='Solar Analemma \u2014 '+hemiName+' \u2014 '+timeStr;const titleShort='Analemma \u2014 '+timeStr;const titleStr=ctx.measureText(titleFull).width<=maxTitleW?titleFull:ctx.measureText(titleShort).width<=maxTitleW?titleShort:'Analemma '+timeStr;ctx.fillStyle='rgba(255,255,255,.55)';ctx.fillText(titleStr,W/2,6);ctx.font='8px sans-serif';const subFull=latAbs.toFixed(1)+'\u00b0 lat \u00b7 '+tiltNote;const subShort=latAbs.toFixed(1)+'\u00b0 \u00b7 '+tiltNote.split(' \u2014 ')[0];const subStr=ctx.measureText(subFull).width<=maxTitleW?subFull:ctx.measureText(subShort).width<=maxTitleW?subShort:latAbs.toFixed(1)+'\u00b0 lat';ctx.fillStyle='rgba(46,196,182,.6)';ctx.fillText(subStr,W/2,20);
  const legendY=H-ml.b+18;ctx.font='8px sans-serif';ctx.textBaseline='top';[['■ Summer','#e86040'],['■ Winter','#4a9eff'],['■ Mar Eq','#5cb85c'],['■ Sep Eq','#f0c030']].forEach(([lab,col],i)=>{ctx.fillStyle=col;ctx.textAlign='left';ctx.fillText(lab,ml.l+i*(pw/4),legendY);});
  const todayEoT=eot(today);const todayDec=sDecl(today);
  document.getElementById('ana-info').innerHTML=`<div style="margin-bottom:5px"><b style="color:var(--amb)">${hemiName}</b> · <b style="color:var(--tel)">${latAbs.toFixed(1)}° lat</b></div><div>Plot time: <b style="color:var(--txt)">${timeStr}</b> local</div><div>Tilt: <b style="color:var(--txt)">${tiltDeg.toFixed(0)}° from vertical</b></div><div>Summer at: <b style="color:var(--cor)">${isSH?'December solstice':'June solstice'}</b></div><div>Winter at: <b style="color:var(--blu)">${isSH?'June solstice':'December solstice'}</b></div><div class="div"></div><div style="color:var(--amb);font-weight:600;margin-bottom:2px">Today (day ${today})</div><div>Declination: <b style="color:var(--txt)">${todayDec.toFixed(2)}°${todayDec>=0?'N':'S'}</b></div><div>Equation of Time: <b style="color:var(--txt)">${todayEoT>0?'+':''}${todayEoT.toFixed(1)} min</b></div><div style="font-size:10px;color:var(--t3)">${todayEoT>0?'Sun ahead of clock — solar noon is early':'Sun behind clock — solar noon is late'}</div><div class="div"></div><div style="font-size:11px;color:var(--t2)"><div>EoT range: <span style="color:var(--txt)">±16.4 min</span></div><div>Decl range: <span style="color:var(--txt)">±23.45°</span></div><div style="margin-top:4px;color:var(--t3)">Colour key (NH):</div><div><span style="color:#e86040">●</span> Red = Summer &nbsp; <span style="color:#4a9eff">●</span> Blue = Winter</div><div><span style="color:#5cb85c">●</span> Green = Mar Eq &nbsp; <span style="color:#f0c030">●</span> Yellow = Sep Eq</div></div>`;
}

function doJetlag(){
  const org=SEL['jl-od']||CITIES[0];const dst=SEL['jl-dd'];if(!dst){document.getElementById('jl-out').innerHTML='<div class="al alW" style="margin-top:8px">Please select a destination city.</div>';return;}
  const depDateStr=document.getElementById('jl-depdate').value;const depH=pt(document.getElementById('jl-dep').value);const stay=parseInt(document.getElementById('jl-days').value)||7;
  const orgDSTinfo=depDateStr?getDSTInfo(org.tzid,depDateStr):{hasDST:false,isDST:false,dstOffset:0,label:''};const dstDSTinfo=depDateStr?getDSTInfo(dst.tzid,depDateStr):{hasDST:false,isDST:false,dstOffset:0,label:''};
  const orgTZeff=(org.tzStd!==undefined?org.tzStd:org.tz)+orgDSTinfo.dstOffset;const dstTZeff=(dst.tzStd!==undefined?dst.tzStd:dst.tz)+dstDSTinfo.dstOffset;
  const orgSleep=pt(document.getElementById('jl-o-sleep').value||'23:00');const orgWake=pt(document.getElementById('jl-o-wake').value||'07:00');const orgDur=((orgWake-orgSleep+24)%24);
  const dstSleep=pt(document.getElementById('jl-d-sleep').value||'23:00');const dstWake=pt(document.getElementById('jl-d-wake').value||'07:00');const dstDur=((dstWake-dstSleep+24)%24);
  const tzDiff=dstTZeff-orgTZeff;const west=tzDiff<0;const abs=Math.abs(tzDiff);
  let fltTotalH,arrH;const arrTimeInput=(document.getElementById('jl-arrtime').value||'').trim();
  if(jlFlightInputMode==='arrival'&&arrTimeInput){arrH=pt(arrTimeInput);const depInUTC=depH-orgTZeff;const arrInUTC=arrH-dstTZeff;fltTotalH=((arrInUTC-depInUTC+48)%24);if(fltTotalH<0.5)fltTotalH+=24;}
  else{const fltH=parseInt(document.getElementById('jl-hrs').value)||0;const fltM=parseInt(document.getElementById('jl-min').value)||0;fltTotalH=fltH+fltM/60;arrH=((depH+fltTotalH+tzDiff)%24+24)%24;}
  const fltHours=Math.floor(fltTotalH);const fltMins=Math.round((fltTotalH-fltHours)*60);const fltStr=fltHours+'h'+(fltMins>0?' '+fltMins+'min':'');
  const adjDays=Math.max(1,Math.ceil(abs*(west?0.67:1.0)));const preDays=Math.min(3,Math.floor(abs/2));const shiftPerPreDay=preDays>0?(abs/2)/preDays:0;
  const dinnerH=((dstSleep-3+24)%24);const melH=((dstSleep-2+24)%24);const depInDst=((depH+tzDiff)%24+24)%24;const hrsToBlueCut=((18-depInDst+24)%24);const blueCutInFlight=hrsToBlueCut<fltTotalH;const blueCutFlightLabel=blueCutInFlight?'T+'+Math.floor(hrsToBlueCut)+'h'+(Math.round((hrsToBlueCut%1)*60)>0?' '+Math.round((hrsToBlueCut%1)*60)+'min':''):'After landing';
  const daySchedule=[];for(let i=1;i<=Math.min(7,stay);i++){const synced=i>adjDays;daySchedule.push({day:i,sleep:dstSleep,wake:dstWake,dur:dstDur.toFixed(1),synced,note:i===1?'Arrival day — force awake until this time. No naps.':i<=adjDays?'Strict schedule. Morning light immediately on wake.':'Fully synced. Maintain.'});}
  const depDateDisp=depDateStr?(()=>{const d=new Date(depDateStr+'T12:00:00Z');const mo=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return d.getUTCDate()+' '+mo[d.getUTCMonth()]+' '+d.getUTCFullYear();})():'Date not set';
  const dstAlerts=[];if(depDateStr&&orgDSTinfo.hasDST)dstAlerts.push(`<b>${org.n}:</b> ${orgDSTinfo.label} → effective offset UTC${orgTZeff>=0?'+':''}${orgTZeff}`);if(depDateStr&&dstDSTinfo.hasDST)dstAlerts.push(`<b>${dst.n}:</b> ${dstDSTinfo.label} → effective offset UTC${dstTZeff>=0?'+':''}${dstTZeff}`);
  document.getElementById('jl-out').innerHTML=`${dstAlerts.length?`<div class="al alI" style="margin-top:8px">🕐 <b>DST on ${depDateDisp}:</b> ${dstAlerts.join(' · ')}</div>`:''}<div class="row" style="margin-top:8px"><div class="card A" style="flex:1;min-width:175px"><div class="rt">Route summary</div><div style="font-size:12px;color:var(--t2);line-height:2.2"><div><b style="color:var(--amb)">${org.n}</b> <span style="color:var(--t3)">→</span> <b style="color:var(--amb)">${dst.n}</b></div><div>Departure: <b style="color:var(--txt)">${depDateDisp} · ${fmtHR(depH)}</b></div><div>Direction: <b style="color:var(--txt)">${west?'Westward':'Eastward'}</b></div><div>TZ shift: <b style="color:var(--txt)">${tzDiff>0?'+':''}${tzDiff.toFixed(1)}h</b>${(orgDSTinfo.dstOffset||dstDSTinfo.dstOffset)?'<span style="font-size:10px;color:var(--tel);margin-left:6px">(DST adjusted)</span>':''}</div><div>Flight: <b style="color:var(--txt)">${fltStr}</b></div><div>Arrival (dst local): <b style="color:var(--txt)">${fmtHR(arrH)}</b></div><div>Est. full sync: <b style="color:var(--txt)">~${adjDays} day${adjDays>1?'s':''}</b></div></div></div><div class="card" style="flex:1;min-width:175px"><div class="rt">Schedules</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px"><div style="background:var(--bg3);border-radius:7px;padding:8px"><div style="font-size:9px;color:var(--amb);margin-bottom:4px;font-weight:600">ORIGIN · ${org.n}</div><div>😴 Sleep: <b class="mono">${fmtHR(orgSleep)}</b></div><div>⏰ Wake: <b class="mono">${fmtHR(orgWake)}</b></div><div>⏱ <b>${orgDur.toFixed(1)}h</b></div></div><div style="background:var(--bg3);border-radius:7px;padding:8px"><div style="font-size:9px;color:var(--tel);margin-bottom:4px;font-weight:600">TARGET · ${dst.n}</div><div>😴 Sleep: <b class="mono">${fmtHR(dstSleep)}</b></div><div>⏰ Wake: <b class="mono">${fmtHR(dstWake)}</b></div><div>⏱ <b>${dstDur.toFixed(1)}h</b></div></div></div></div></div>${preDays>0?`<div class="card" style="margin-bottom:9px"><div class="rt" style="margin-bottom:6px">Pre-departure — ${preDays} day${preDays>1?'s':''} before, at ${org.n}</div><div class="tl">${Array.from({length:preDays},(_,i)=>{const daysOut=preDays-i;const shift=shiftPerPreDay*(i+1);const ns=((orgSleep+(west?shift:-shift)+24)%24);const nw=((orgWake+(west?shift:-shift)+24)%24);return`<div class="tli"><div class="tlt">Day −${daysOut}</div><div class="tla">Sleep <b>${fmtHR(ns)}</b> · Wake <b>${fmtHR(nw)}</b></div><div class="tln">Shift ${Math.round(shiftPerPreDay*60)}min ${west?'later':'earlier'}</div></div>`;}).join('')}</div></div>`:''}<div class="card B" style="margin-bottom:9px"><div class="rt" style="margin-bottom:7px">✈ In-flight protocol — times in <b style="color:var(--amb)">${dst.n} local time</b></div><div class="tl"><div class="tli"><div class="tlt">At boarding</div><div class="tla">Set watch/phone to <b>${dst.n}</b> time immediately</div></div><div class="tli"><div class="tlt">18:00 dst — ${blueCutFlightLabel}</div><div class="tla"><b>Blue light cutoff</b> — screens to night mode, close window blinds</div></div>${fltTotalH>=6?`<div class="tli"><div class="tlt">If overnight segment</div><div class="tla">Sleep only if it falls within <b>${fmtHR(dstSleep)}–${fmtHR(dstWake)}</b> dst window</div></div>`:''}</div></div><div class="card A" style="margin-bottom:9px"><div class="rt" style="margin-bottom:7px">🛬 Arrival day · ${dst.n} · ${fmtHR(arrH)}</div><div class="al alW" style="margin-bottom:9px">⚠ <b>Do not nap.</b> Stay awake until <b>${fmtHR(dstSleep)}</b> regardless of fatigue.</div><div class="tl"><div class="tli"><div class="tlt">Arrival — ${fmtHR(arrH)}</div><div class="tla">Seek outdoor daylight immediately if it is daytime at destination</div></div><div class="tli"><div class="tlt">${fmtHR(melH)} · Melatonin</div><div class="tla"><b>0.5mg melatonin</b> — low dose only, 2h before target sleep</div></div><div class="tli"><div class="tlt">${fmtHR(dinnerH)} · Dinner</div><div class="tla"><b>Last meal by ${fmtHR(dinnerH)}</b> — exactly 3h before target sleep</div></div><div class="tli"><div class="tlt">${fmtHR(dstSleep)} · Sleep</div><div class="tla"><b>Target sleep time</b></div></div><div class="tli"><div class="tlt">${fmtHR(dstWake)} · Wake</div><div class="tla"><b>Target wake — outdoor light within 20min.</b></div></div></div></div><div class="card" style="margin-bottom:9px"><div class="rt" style="margin-bottom:7px">Daily schedule at ${dst.n}</div><div style="overflow-x:auto"><table class="ct" style="min-width:380px"><thead><tr><th>Day</th><th>Sleep</th><th>Wake</th><th>Duration</th><th>Protocol focus</th></tr></thead><tbody>${daySchedule.map(d=>`<tr><td><b>Day ${d.day}</b></td><td><span class="mono" style="color:${d.synced?'var(--grn)':'var(--amb)'}">${fmtHR(d.sleep)}</span></td><td><span class="mono" style="color:${d.synced?'var(--grn)':'var(--amb)'}">${fmtHR(d.wake)}</span></td><td class="mono">${d.dur}h</td><td style="font-size:10px;color:var(--t2)">${d.note}</td></tr>`).join('')}</tbody></table></div></div><div class="card G"><div class="rt" style="margin-bottom:6px">🏠 Return to ${org.n}</div><div style="font-size:12px;color:var(--t2);line-height:1.9">Resume origin schedule from day 1.<br>Sleep: <b class="mono" style="color:var(--grn)">${fmtHR(orgSleep)}</b> · Wake: <b class="mono" style="color:var(--grn)">${fmtHR(orgWake)}</b></div></div>`;
}

function genProto(){const cw=pt(document.getElementById('p-cw').value);const tw=pt(document.getElementById('p-tw').value);const cs2=pt(document.getElementById('p-cs').value);const sd=pt(document.getElementById('p-sd').value||'7:00');const ts=(tw-sd+24)%24;const diff=(cw-tw)*60;const days=diff>0?Math.ceil(diff/17.5):0;const spd=diff>0?Math.round(diff/days):0;const actDur=((cw-cs2+24)%24).toFixed(1);document.getElementById('p-sum').innerHTML=diff<=0?`<span style="color:var(--grn)">Already at or before target.</span>`:`<b style="color:var(--amb)">Shift ${Math.round(diff)}min earlier</b><br>${spd}min every 2 days · ~${days*2} days<br><br>Wake: ${fmtHR(cw)} → <b>${fmtHR(tw)}</b><br>Sleep: ${fmtHR(cs2)} → <b>${fmtHR(ts)}</b><br>Duration now: ${actDur}h → target: ${document.getElementById('p-sd').value}`;const tl=document.getElementById('p-tl');tl.style.display='block';document.getElementById('p-tl-in').innerHTML=[{h:ts-3,a:'Dim all lights — warm amber only',n:'3hr melatonin environment'},{h:ts-2,a:'Screens max warm tone',n:'Blue light below 480nm suppressed'},{h:ts-1,a:'Screen-free — book or silence',n:'ipRGC cells need darkness'},{h:ts-0.25,a:'Room below 19°C, blackout curtains',n:'Core temp drop triggers sleep'},{h:ts,a:'Target sleep: '+fmtHR((ts+24)%24),n:'Consistent ±15min every night'}].map(t=>`<div class="tli"><div class="tlt">${fmtHR((t.h+24)%24)}</div><div class="tla">${t.a}</div><div class="tln">${t.n}</div></div>`).join('');}
function scoreAnchors(){const morning=parseInt(document.getElementById('an-m').value)||0;const meal=pt(document.getElementById('an-meal').value);const ex=pt(document.getElementById('an-ex').value);const dark=pt(document.getElementById('an-dk').value);const mScore=morning>=30?10:morning>=20?7:morning>=10?4:1;const mealScore=meal>=6&&meal<=9?10:meal>=5&&meal<=10?7:4;const exScore=ex>=15&&ex<=17?10:ex>=14&&ex<=18?7:ex>=12&&ex<=20?4:1;const darkScore=dark<=21?10:dark<=22?7:dark<=23?4:1;function sc(s){return s>=8?'var(--grn)':s>=5?'var(--amb)':'var(--cor)';}function chip(s){return`<span class="schip" style="background:${s>=8?'var(--gd)':s>=5?'var(--ad)':'var(--cd)'};color:${sc(s)};border:1px solid ${sc(s)}">${s}/10</span>`;}document.getElementById('an-m-sc').innerHTML=chip(mScore)+`<span style="font-size:11px;color:${sc(mScore)}">${morning>=30?'✓ Strong':morning>=20?'△ Good — try 30min':morning>=10?'△ Marginal':'✗ Insufficient'}</span>`;document.getElementById('an-meal-sc').innerHTML=chip(mealScore)+`<span style="font-size:11px;color:${sc(mealScore)}">${mealScore>=7?'✓ Good anchor':'△ Consistency is key'}</span>`;document.getElementById('an-ex-sc').innerHTML=chip(exScore)+`<span style="font-size:11px;color:${sc(exScore)}">${exScore>=8?'✓ Optimal':ex<15?'△ Earlier than ideal':ex>17?'△ Slightly late':'✗ Too late'}</span>`;document.getElementById('an-dk-sc').innerHTML=chip(darkScore)+`<span style="font-size:11px;color:${sc(darkScore)}">${darkScore>=8?'✓ Good protection':darkScore>=5?'△ Aim for 21:00':'✗ Suppressing melatonin'}</span>`;const overall=Math.round((mScore+mealScore+exScore+darkScore)/4);const g=overall>=8?{t:'Excellent',s:'Strong circadian signals.',c:'var(--grn)'}:overall>=6?{t:'Good',s:'Minor improvements possible.',c:'var(--amb)'}:overall>=4?{t:'Fair',s:'Focus on morning light first.',c:'var(--amb)'}:{t:'Poor',s:'Morning light is highest-leverage.',c:'var(--cor)'};document.getElementById('anchor-out').innerHTML=`<div style="background:var(--bg3);border-radius:10px;padding:12px;border-left:3px solid ${g.c}"><div style="display:flex;align-items:center;gap:12px;margin-bottom:7px;flex-wrap:wrap"><div style="font-family:monospace;font-size:28px;font-weight:700;color:${g.c}">${overall}/10</div><div><div style="font-size:14px;font-weight:600;color:${g.c}">${g.t}</div><div style="font-size:12px;color:var(--t2)">${g.s}</div></div></div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center">${[{l:'☀ Morning',v:mScore},{l:'🍽 Meal',v:mealScore},{l:'🏃 Exercise',v:exScore},{l:'🌑 Darkness',v:darkScore}].map(x=>`<div style="background:var(--bg4);border-radius:6px;padding:5px"><div style="font-size:10px;color:var(--t3);margin-bottom:2px">${x.l}</div><div style="font-family:monospace;font-size:17px;color:${sc(x.v)}">${x.v}/10</div></div>`).join('')}</div></div>`;}

function doTf(v){if(!v){document.getElementById('tf-res').innerHTML='';return;}const q=v.toLowerCase();const cRes=COUNTRIES.filter(c=>c.n.toLowerCase().includes(q)).slice(0,3);const cityRes=CITIES.filter(c=>c.n.toLowerCase().includes(q)).slice(0,2);let html='';cRes.forEach(co=>{const sv=Math.min(500,Math.round(Math.abs(co.lat)*6.5));const s24=Math.min(10,Math.round(sv/30));html+=`<div class="card" style="margin-bottom:8px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap"><b style="font-size:14px;color:var(--txt)">${co.n}</b><span class="cbadge ${co.fmt==='12'?'cb12':co.fmt==='24'?'cb24':'cbboth'}">${co.fmt==='12'?'12hr dominant':co.fmt==='24'?'24hr dominant':'Both / mixed'}</span><span style="font-size:10px;color:var(--t3)">${Math.abs(co.lat)}°${co.lat>=0?'N':'S'} · ~${sv}min sunset variation</span></div><div style="font-size:12px;color:var(--t2);line-height:1.6;margin-bottom:8px">${co.note}</div><div style="display:flex;gap:8px;flex-wrap:wrap"><div style="flex:1;min-width:110px;background:var(--bg3);border-radius:6px;padding:8px"><div style="font-size:9px;color:var(--t3);margin-bottom:3px">24hr COMPATIBILITY</div><div style="height:5px;background:var(--bg4);border-radius:3px;margin-bottom:3px"><div style="width:${s24*10}%;height:100%;background:var(--tel);border-radius:3px"></div></div><div style="font-size:11px;color:var(--tel)">${s24}/10</div></div><div style="flex:1;min-width:110px;background:var(--bg3);border-radius:6px;padding:8px"><div style="font-size:9px;color:var(--t3);margin-bottom:3px">12hr GEOGRAPHIC CASE</div><div style="height:5px;background:var(--bg4);border-radius:3px;margin-bottom:3px"><div style="width:${Math.max(0,10-s24)*10}%;height:100%;background:var(--cor);border-radius:3px"></div></div><div style="font-size:11px;color:var(--cor)">${Math.max(0,10-s24)}/10</div></div></div></div>`;});cityRes.forEach(city=>{const tzS=city.tzStd!==undefined?city.tzStd:city.tz;const ex=annualEx(city.lat,city.lng,tzS);const s24=Math.min(10,Math.round(ex.sVar/30));html+=`<div class="card" style="margin-bottom:8px"><b style="color:var(--txt)">${city.n}, ${city.c}</b><div style="font-size:12px;color:var(--t2);margin-top:5px;line-height:1.8">Lat: ${Math.abs(city.lat).toFixed(2)}°${city.lat>=0?'N':'S'} · Sunrise span: ${ex.rVar}min · Sunset span: ${ex.sVar}min · 24hr need: <b style="color:var(--tel)">${s24}/10</b></div></div>`;});document.getElementById('tf-res').innerHTML=html||`<div style="font-size:13px;color:var(--t3)">No results</div>`;}

function buildSVFTable(){const svfCities=[{city:'Singapore',cityKey:'Singapore',fmt:'24hr official/casual',risk:'None',riskColor:'var(--tel)'},{city:'Bengaluru',cityKey:'Bengaluru',fmt:'12hr dominant',risk:'Moderate',riskColor:'var(--amb)'},{city:'Mumbai',cityKey:'Mumbai',fmt:'12hr dominant',risk:'Moderate',riskColor:'var(--amb)'},{city:'Tokyo',cityKey:'Tokyo',fmt:'24hr casual speech',risk:'Low',riskColor:'var(--grn)'},{city:'Seoul',cityKey:'Seoul',fmt:'24hr official/casual',risk:'Low',riskColor:'var(--grn)'},{city:'New York',cityKey:'New York',fmt:'12hr dominant',risk:'High',riskColor:'var(--cor)'},{city:'Berlin',cityKey:'Berlin',fmt:'24hr casual',risk:'None',riskColor:'var(--tel)'},{city:'London',cityKey:'London',fmt:'12hr dominant',risk:'High',riskColor:'var(--cor)'},{city:'Stockholm',cityKey:'Stockholm',fmt:'24hr',risk:'None',riskColor:'var(--tel)'},{city:'Reykjavik',cityKey:'Reykjavik',fmt:'24hr',risk:'None',riskColor:'var(--tel)'}];const tbody=document.getElementById('svf-tbody');if(!tbody)return;let html='';for(const row of svfCities){const cityObj=CITIES.find(c=>c.n===row.cityKey);let sVar='—',latStr='—';if(cityObj){const tzStd=cityObj.tzStd!==undefined?cityObj.tzStd:cityObj.tz;const ex=annualEx(cityObj.lat,cityObj.lng,tzStd);sVar=ex.sVar+'min';latStr=Math.abs(cityObj.lat).toFixed(1)+'°'+(cityObj.lat>=0?'N':'S');}const riskBadgeStyle=`background:var(--bg3);color:${row.riskColor};border:1px solid ${row.riskColor};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600`;html+=`<tr><td><b>${row.city}</b></td><td class="mono" style="color:var(--amb)">${latStr}</td><td class="mono" style="color:var(--amb)">${sVar}</td><td style="color:var(--t2);font-size:11px">${row.fmt}</td><td><span style="${riskBadgeStyle}">${row.risk}</span></td></tr>`;}tbody.innerHTML=html;}

function buildTf(){const f12=COUNTRIES.filter(c=>c.fmt==='12');const f24=COUNTRIES.filter(c=>c.fmt==='24');const fb=COUNTRIES.filter(c=>c.fmt==='both');document.getElementById('tf-12').innerHTML=f12.map(c=>`<span class="cbadge cb12">${c.n}</span>`).join('');document.getElementById('tf-24').innerHTML=f24.map(c=>`<span class="cbadge cb24">${c.n}</span>`).join('');document.getElementById('tf-both').innerHTML=fb.map(c=>`<span class="cbadge cbboth">${c.n}</span>`).join('');document.getElementById('tf-pb').innerHTML=[{city:'Bengaluru',lat:12.97,cityKey:'Bengaluru',fmt:'12hr',ok:false},{city:'New York',lat:40.7,cityKey:'New York',fmt:'12hr',ok:false},{city:'London',lat:51.5,cityKey:'London',fmt:'12hr',ok:false},{city:'Berlin',lat:52.5,cityKey:'Berlin',fmt:'24hr casual',ok:true},{city:'Singapore',lat:1.3,cityKey:'Singapore',fmt:'24hr official',ok:true},{city:'Tokyo',lat:35.6,cityKey:'Tokyo',fmt:'24hr casual',ok:true}].map(r=>{const cityObj=CITIES.find(c=>c.n===r.cityKey);let sVar='—';if(cityObj){const tzS=cityObj.tzStd!==undefined?cityObj.tzStd:cityObj.tz;const ex=annualEx(cityObj.lat,cityObj.lng,tzS);sVar=ex.sVar+'min';}return`<tr><td>${r.city}</td><td class="mono">${Math.abs(r.lat).toFixed(1)}°N</td><td class="mono" style="color:var(--amb)">${sVar}</td><td><span class="badge ${r.fmt.includes('24')?'bT':'bA'}">${r.fmt}</span></td><td style="font-size:10px;color:${r.ok?'var(--grn)':'var(--cor)'}">${r.ok?'Correct':'Irony'}</td></tr>`;}).join('');buildSVFTable();}

function buildWhy(){drawClocks();drawGlob();document.getElementById('why-c').innerHTML=[{n:'USA',a:'At 40°N, ~243min variation. "Meet at 6" — morning or evening? The US military, airlines, hospitals use 24hr. Civilian 12hr is pure inertia.'},{n:'India',a:'12–28°N. Tech industry runs on 24hr. For global operations 24hr eliminates a class of scheduling errors.'},{n:'UK',a:'BBC, NHS, transport and military already use 24hr. At 51°N with 325min variation, the case is overwhelming.'},{n:'Philippines',a:'14°N, US colonial 12hr. Filipinos work across Middle East, Asia and Europe. 24hr eliminates cross-timezone confusion.'},{n:'Everyone',a:'Even at the equator — "8pm" still requires knowing you mean evening. 24hr removes that requirement entirely.'}].map(c=>`<div style="background:var(--bg3);border-radius:8px;padding:11px;margin-bottom:7px;border-left:2px solid var(--amb)"><div style="font-weight:600;color:var(--txt);margin-bottom:3px">${c.n}</div><div style="font-size:12px;color:var(--t2);line-height:1.6">${c.a}</div></div>`).join('');}
function drawClocks(){const now=new Date();const h=now.getHours(),m=now.getMinutes(),s=now.getSeconds();function draw(id,is24){const cv=document.getElementById(id);if(!cv)return;const sz=168;cv.width=sz*devicePixelRatio;cv.height=sz*devicePixelRatio;cv.style.width=sz+'px';cv.style.height=sz+'px';const ctx=cv.getContext('2d');ctx.scale(devicePixelRatio,devicePixelRatio);const cx=sz/2,cy=sz/2,R=sz/2-7;ctx.clearRect(0,0,sz,sz);ctx.beginPath();ctx.arc(cx,cy,R,0,2*Math.PI);ctx.fillStyle='#141820';ctx.fill();ctx.strokeStyle=is24?'#2ec4b6':'#e86040';ctx.lineWidth=2;ctx.stroke();const divs=is24?24:12;for(let i=0;i<divs;i++){const ang=(i/divs)*2*Math.PI-Math.PI/2;const isEven=is24?(i%2===0):true;ctx.strokeStyle=isEven?'rgba(255,255,255,.38)':'rgba(255,255,255,.16)';ctx.lineWidth=isEven?1.5:0.8;ctx.beginPath();ctx.moveTo(cx+Math.cos(ang)*(R-(isEven?7:4)),cy+Math.sin(ang)*(R-(isEven?7:4)));ctx.lineTo(cx+Math.cos(ang)*(R-1),cy+Math.sin(ang)*(R-1));ctx.stroke();const lbl=is24?i:(i===0?12:i);if(is24){const lr=isEven?R-16:R-15;ctx.font=isEven?'bold 8px monospace':'6px monospace';ctx.fillStyle=isEven?'rgba(255,255,255,.75)':'rgba(255,255,255,.32)';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(lbl).padStart(2,'0'),cx+Math.cos(ang)*lr,cy+Math.sin(ang)*lr);}else{ctx.font='9px monospace';ctx.fillStyle='rgba(255,255,255,.55)';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(lbl),cx+Math.cos(ang)*(R-16),cy+Math.sin(ang)*(R-16));}}const mAng=((m+s/60)/60)*2*Math.PI-Math.PI/2;ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(mAng)*(R*0.78),cy+Math.sin(mAng)*(R*0.78));ctx.stroke();const hAng=is24?((h+(m+s/60)/60)/24)*2*Math.PI-Math.PI/2:((h%12+(m+s/60)/60)/12)*2*Math.PI-Math.PI/2;ctx.strokeStyle=is24?'#2ec4b6':'#e86040';ctx.lineWidth=3.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(hAng)*(R*0.55),cy+Math.sin(hAng)*(R*0.55));ctx.stroke();ctx.beginPath();ctx.arc(cx,cy,4,0,2*Math.PI);ctx.fillStyle=is24?'#2ec4b6':'#e86040';ctx.fill();const lbl2=is24?String(h).padStart(2,'0')+':'+String(m).padStart(2,'0'):(String(h%12||12)+':'+String(m).padStart(2,'0'));ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=is24?'#2ec4b6':'#e86040';ctx.fillText(lbl2,cx,cy+R*0.32);if(!is24){ctx.font='9px sans-serif';ctx.fillStyle='#e86040';ctx.fillText(h<12?'AM':'PM',cx,cy+R*0.5);}}draw('c-12h',false);draw('c-24h',true);document.getElementById('lbl12').textContent=String(h%12||12)+':'+String(m).padStart(2,'0')+(h<12?' AM':' PM');document.getElementById('lbl24').textContent=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');}
function drawGlob(){const cv=document.getElementById('c-glob');if(!cv||!cv.offsetWidth)return;const ctx=cv.getContext('2d');cv.width=cv.offsetWidth*devicePixelRatio;cv.height=cv.offsetHeight*devicePixelRatio;ctx.scale(devicePixelRatio,devicePixelRatio);const W=cv.offsetWidth,H=cv.offsetHeight;ctx.clearRect(0,0,W,H);const ml={l:42,r:14,t:22,b:30};const pw=W-ml.l-ml.r,ph=H-ml.t-ml.b;const tc='rgba(255,255,255,.3)';[0,100,200,300,400,500].forEach(v=>{const y=ml.t+ph-(v/520)*ph;ctx.fillStyle=tc;ctx.font='8px monospace';ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(v+'m',ml.l-4,y);ctx.strokeStyle='rgba(255,255,255,.04)';ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(ml.l,y);ctx.lineTo(W-ml.r,y);ctx.stroke();});const lats=[-65,-55,-45,-35,-25,-15,-5,5,15,25,35,45,55,65];const bw=pw/lats.length-2;lats.forEach((lat,i)=>{const ex=annualEx(lat,0,0);const bh=(Math.min(520,ex.sVar)/520)*ph;const x=ml.l+i*(pw/lats.length)+1;const g=ctx.createLinearGradient(0,ml.t+ph-bh,0,ml.t+ph);const isH=ex.sVar>180;g.addColorStop(0,isH?'rgba(240,160,48,.9)':'rgba(46,196,182,.8)');g.addColorStop(1,isH?'rgba(240,160,48,.2)':'rgba(46,196,182,.15)');ctx.fillStyle=g;try{ctx.roundRect(x,ml.t+ph-bh,bw,bh,3);}catch{ctx.rect(x,ml.t+ph-bh,bw,bh);}ctx.fill();ctx.fillStyle=tc;ctx.font='8px monospace';ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText(lat+'°',x+bw/2,H-ml.b+3);if(ex.sVar>80){ctx.fillStyle='rgba(255,255,255,.4)';ctx.font='8px monospace';ctx.textBaseline='bottom';ctx.fillText(ex.sVar,x+bw/2,ml.t+ph-bh-2);}});}

function show(id,btn){document.querySelectorAll('.sec').forEach(s=>s.classList.remove('on'));document.querySelectorAll('.nb').forEach(b=>b.classList.remove('on'));document.getElementById('sect-'+id).classList.add('on');if(btn)btn.classList.add('on');if(id==='lat'){SEL['lat-d']=SEL['lat-d']||CITIES[0];setTimeout(()=>{doLat();drawAnalemma();},80);}if(id==='why')setTimeout(buildWhy,80);if(id==='tf')setTimeout(buildTf,80);}

function updateClock(){const t=localHMS(uTZ);document.getElementById('clk').textContent=String(t.h).padStart(2,'0')+':'+String(t.m).padStart(2,'0')+':'+String(t.s).padStart(2,'0');const nowEl=document.getElementById('dd-now');const solEl=document.getElementById('dd-solar');if(nowEl||solEl){const lH=localH(uTZ);if(nowEl)nowEl.textContent=String(t.h).padStart(2,'0')+':'+String(t.m).padStart(2,'0');if(solEl){const now=new Date();const D=doy(now);const lngCorMin=(uLng-uTZ*15)*4;const eotMin=eot(D);const corrTotalMin=parseFloat((lngCorMin+eotMin).toFixed(1));const corrSec=corrTotalMin*60;const rawSec=t.h*3600+t.m*60+t.s+corrSec;const wrapSec=((rawSec%86400)+86400)%86400;const sh=Math.floor(wrapSec/3600);const sm=Math.floor((wrapSec%3600)/60);const ss=Math.floor(wrapSec%60);solEl.textContent=String(sh).padStart(2,'0')+':'+String(sm).padStart(2,'0');}}}

(function(){
  const today=new Date();const yyyy=today.getFullYear();const mm=String(today.getMonth()+1).padStart(2,'0');const dd=String(today.getDate()).padStart(2,'0');const dateInput=document.getElementById('jl-depdate');if(dateInput){dateInput.value=`${yyyy}-${mm}-${dd}`;dateInput.addEventListener('change',updateDepDSTNote);}
  updateDepDSTNote();jlFlightMode('duration');
})();

updateClock();
loadApi().then(()=>dash());loadWeather();
setTimeout(()=>{buildTf();},400);
setInterval(updateClock,1000);
setInterval(()=>{if(document.getElementById('sect-sky').classList.contains('on'))dash();},15000);
setInterval(()=>{if(document.getElementById('sect-why').classList.contains('on'))drawClocks();},1000);
window.addEventListener('resize',()=>{if(document.getElementById('sect-sky').classList.contains('on'))dash();if(document.getElementById('sect-why').classList.contains('on'))buildWhy();if(document.getElementById('sect-lat').classList.contains('on'))drawAnalemma();});

/* ---- Backend integration (server/ folder) ----
   When the page is served by the Node server, the Backend pill shows "live" and
   the server's solar noon for the current location. Opened as a plain file, it shows "offline". */
let backendUp=false;
function setBackend(state,text){
  const dot=document.getElementById('omsv-dot'), lbl=document.getElementById('omsv-status');
  if(!dot||!lbl)return;
  const col={ok:['#5cb85c','var(--grn)'],fail:['#e86040','var(--cor)'],loading:['#f0a030','var(--amb)']}[state]||['#5a5870','var(--t3)'];
  dot.style.background=col[0];
  lbl.style.color=col[1];
  lbl.textContent=text;
}
async function loadServerSun(){
  const q=new URLSearchParams({lat:uLat,lng:uLng,tz:uTZ,date:new Date().toISOString().slice(0,10)});
  const ctrl=new AbortController();
  const tid=setTimeout(()=>ctrl.abort(),5000);
  try{
    const r=await fetch('/api/solar?'+q.toString(),{signal:ctrl.signal,cache:'no-store'});
    if(!r.ok)throw new Error('solar '+r.status);
    const d=await r.json();
    setBackend('ok','live \u00b7 noon '+d.solarNoon);
  }finally{
    clearTimeout(tid);
  }
}
async function checkBackend(){
  setBackend('loading','checking');
  try{
    const r=await fetch('/api/health',{cache:'no-store'});
    if(!r.ok)throw new Error('health '+r.status);
    backendUp=true;
    await loadServerSun();
  }catch(e){
    backendUp=false;
    setBackend('fail','offline');
  }
}
// Re-ask the server whenever the user picks a new location.
const _applyLocBase=applyLoc;
applyLoc=function(){
  _applyLocBase();
  if(backendUp)loadServerSun().catch(()=>setBackend('fail','offline'));
};
checkBackend();

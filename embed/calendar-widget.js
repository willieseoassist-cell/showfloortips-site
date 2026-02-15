/**
 * ShowFloorTips - Trade Show Calendar Widget
 * <div id="sft-calendar" data-category="all"></div>
 * <script src="https://showfloortips.com/embed/calendar-widget.js"></script>
 */
(function(){
'use strict';
var B='https://showfloortips.com',A=B+'/api/shows-widget',el=document.getElementById('sft-calendar');
if(!el)return;
var cat=el.getAttribute('data-category')||'all',th=el.getAttribute('data-theme')||'light';
var dk=th==='dark',C=dk?{b:'#1a1a1a',r:'#333',t:'#e5e5e5',s:'#999',h:'#2a2a2a',f:'#666',fb:'#151515',
td:'#60a5fa',tw:'#fff',dt:'#60a5fa',dh:'#242424',o:'#444',p:'#242424',hb:'#1e1e1e',bg:'#2a2a2a',bt:'#aaa'}
:{b:'#fff',r:'#e5e5e5',t:'#0a0a0a',s:'#737373',h:'#fafafa',f:'#a3a3a3',fb:'#fafafa',
td:'#0a0a0a',tw:'#fff',dt:'#0a0a0a',dh:'#f5f5f5',o:'#d4d4d4',p:'#fafafa',hb:'#fafafa',bg:'#f5f5f5',bt:'#737373'};
var now=new Date(),vM=now.getMonth(),vY=now.getFullYear(),cache={},sel=null;
var root=el.attachShadow?el.attachShadow({mode:'open'}):el;
var st=document.createElement('style');
st.textContent=':host{display:block;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;line-height:1.5}'+
'*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}'+
'.c{background:'+C.b+';border:1px solid '+C.r+';border-radius:12px;overflow:hidden;max-width:420px;width:100%}'+
'.ch{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:'+C.hb+';border-bottom:1px solid '+C.r+'}'+
'.ch h3{font-size:15px;font-weight:700;color:'+C.t+';margin:0;min-width:160px;text-align:center}'+
'.ch button{width:32px;height:32px;border:1px solid '+C.r+';border-radius:8px;background:'+C.b+';cursor:pointer;display:flex;align-items:center;justify-content:center;color:'+C.t+';padding:0}'+
'.ch button:hover{background:'+C.h+'}'+
'.ch button svg{width:16px;height:16px}'+
'.cg{padding:8px 12px}table{width:100%;border-collapse:collapse;table-layout:fixed}'+
'th{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:'+C.s+';padding:6px 0;text-align:center}'+
'td{text-align:center;padding:2px}'+
'.d{width:100%;aspect-ratio:1;border-radius:8px;border:none;background:none;cursor:pointer;font-size:12px;font-weight:500;color:'+C.t+';display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;transition:background .12s}'+
'.d:hover{background:'+C.dh+'}.d.o{color:'+C.o+'}'+
'.d.t{background:'+C.td+';color:'+C.tw+';font-weight:700}.d.t:hover{opacity:.9}'+
'.d.s{background:'+C.td+';color:#fff;font-weight:700}'+
'.d.has .dots{display:flex;gap:2px;justify-content:center}'+
'.dot{width:4px;height:4px;border-radius:50%;background:'+C.dt+'}'+
'.d.t .dot{background:'+C.tw+'}.d.s .dot{background:#fff}'+
'.dp{padding:0 12px 12px;display:none}.dp.op{display:block}'+
'.dp h4{font-size:12px;font-weight:600;color:'+C.s+';padding:8px 4px 6px;text-transform:uppercase;letter-spacing:.3px;border-top:1px solid '+C.r+'}'+
'.ds{list-style:none;padding:0;margin:0}'+
'.di{display:block;padding:8px 10px;background:'+C.p+';border:1px solid '+C.r+';border-radius:8px;margin-bottom:6px;text-decoration:none;color:inherit}'+
'.di:hover{background:'+C.dh+'}'+
'.dit{font-size:12px;font-weight:600;color:'+C.t+';line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}'+
'.dim{font-size:10px;color:'+C.s+';margin-top:2px}'+
'.dib{display:inline-block;font-size:9px;font-weight:600;color:'+C.bt+';background:'+C.bg+';padding:1px 6px;border-radius:3px;margin-top:3px;text-transform:uppercase;letter-spacing:.3px}'+
'.cf{padding:10px 16px;background:'+C.fb+';border-top:1px solid '+C.r+';text-align:center}'+
'.cf a{font-size:11px;color:'+C.f+';text-decoration:none;font-weight:500}.cf a:hover{color:'+C.t+'}'+
'.ld{text-align:center;padding:16px;font-size:11px;color:'+C.s+'}'+
'@keyframes sp{to{transform:rotate(360deg)}}'+
'.sp{display:inline-block;width:14px;height:14px;border:2px solid '+C.r+';border-top-color:'+C.t+';border-radius:50%;animation:sp .6s linear infinite;vertical-align:middle;margin-right:6px}'+
'@media(max-width:480px){.c{border-radius:8px}.ch{padding:12px}.cg{padding:6px 8px}.d{font-size:11px}}';
root.appendChild(st);
var w=document.createElement('div');w.className='c';
w.setAttribute('role','complementary');w.setAttribute('aria-label','Trade Show Calendar');
var hd=document.createElement('div');hd.className='ch';
hd.innerHTML='<button aria-label="Previous month"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg></button><h3 class="tt"></h3><button aria-label="Next month"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 6 15 12 9 18"/></svg></button>';
w.appendChild(hd);
var gr=document.createElement('div');gr.className='cg';w.appendChild(gr);
var pn=document.createElement('div');pn.className='dp';w.appendChild(pn);
var ft=document.createElement('div');ft.className='cf';
ft.innerHTML='<a href="'+B+'/calendar.html?ref=widget" target="_blank" rel="noopener">Powered by ShowFloorTips.com</a>';
w.appendChild(ft);root.appendChild(w);
var btns=hd.querySelectorAll('button');
btns[0].addEventListener('click',function(){vM--;if(vM<0){vM=11;vY--}sel=null;render()});
btns[1].addEventListener('click',function(){vM++;if(vM>11){vM=0;vY++}sel=null;render()});
var MN=['January','February','March','April','May','June','July','August','September','October','November','December'];
var DN=['Su','Mo','Tu','We','Th','Fr','Sa'];
function render(){
root.querySelector('.tt').textContent=MN[vM]+' '+vY;
pn.className='dp';pn.innerHTML='';
var k=vY+'-'+(vM+1);
if(cache[k])buildG(cache[k]);
else{gr.innerHTML='<div class="ld"><span class="sp"></span>Loading...</div>';
fetch(vY,vM+1,function(e,d){if(e||!d||!d.shows){cache[k]=[];buildG([]);return}cache[k]=d.shows;buildG(d.shows)})}}
function buildG(shows){
var bd={};for(var i=0;i<shows.length;i++){var s=shows[i];if(!s.sd)continue;var dy=parseInt(s.sd.split('-')[2],10);if(!bd[dy])bd[dy]=[];bd[dy].push(s)}
var fd=new Date(vY,vM,1).getDay(),dm=new Date(vY,vM+1,0).getDate(),pm=new Date(vY,vM,0).getDate();
var td=new Date(),cm=td.getMonth()===vM&&td.getFullYear()===vY,tn=td.getDate();
var h='<table><thead><tr>';for(var i=0;i<7;i++)h+='<th>'+DN[i]+'</th>';
h+='</tr></thead><tbody><tr>';
for(var p=0;p<fd;p++)h+='<td><button class="d o" disabled>'+(pm-fd+p+1)+'</button></td>';
var cc=fd;
for(var d=1;d<=dm;d++){var cl='d',hs=bd[d]&&bd[d].length>0;
if(hs)cl+=' has';if(cm&&d===tn)cl+=' t';if(d===sel)cl+=' s';
h+='<td><button class="'+cl+'" data-d="'+d+'">'+d;
if(hs){var n=Math.min(bd[d].length,3);h+='<div class="dots">';for(var x=0;x<n;x++)h+='<span class="dot"></span>';h+='</div>'}
h+='</button></td>';cc++;if(cc%7===0&&d<dm)h+='</tr><tr>'}
var rm=7-(cc%7);if(rm<7)for(var n=1;n<=rm;n++)h+='<td><button class="d o" disabled>'+n+'</button></td>';
h+='</tr></tbody></table>';gr.innerHTML=h;
var bs=gr.querySelectorAll('.d.has');
for(var b=0;b<bs.length;b++)bs[b].addEventListener('click',function(){
var dy=parseInt(this.getAttribute('data-d'),10);
if(sel===dy){sel=null;pn.className='dp';pn.innerHTML='';this.classList.remove('s');return}
sel=dy;var all=gr.querySelectorAll('.d');for(var r=0;r<all.length;r++)all[r].classList.remove('s');
this.classList.add('s');showP(dy,bd[dy]||[])})}
function showP(day,shows){
var ds=MN[vM]+' '+day+', '+vY;
var h='<h4>'+esc(ds)+' &mdash; '+shows.length+' show'+(shows.length!==1?'s':'')+'</h4><div class="ds">';
for(var i=0;i<shows.length;i++){var s=shows[i],l=[s.ci,s.co].filter(Boolean).join(', ');
h+='<a class="di" href="'+B+'/shows/'+s.s+'?ref=calendar-widget" target="_blank" rel="noopener">'+
'<div class="dit">'+esc(s.t)+'</div>'+(l?'<div class="dim">'+esc(l)+'</div>':'')+
(s.ca?'<div class="dib">'+esc(s.ca)+'</div>':'')+'</a>'}
h+='</div>';pn.innerHTML=h;pn.className='dp op'}
function fetch(y,m,cb){var u=A+'?month='+m+'&year='+y+'&category='+encodeURIComponent(cat);
var x=new XMLHttpRequest();x.open('GET',u,true);
x.onreadystatechange=function(){if(x.readyState===4){if(x.status===200){try{cb(null,JSON.parse(x.responseText))}catch(e){cb(e)}}else cb(new Error('HTTP '+x.status))}};x.send()}
function esc(s){if(!s)return'';var d=document.createElement('div');d.appendChild(document.createTextNode(s));return d.innerHTML}
render();
})();

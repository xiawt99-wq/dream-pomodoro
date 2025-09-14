import {LS, defaultSettings, defaultRole, defaultStats, $, load, save} from './common.js';

let settings = load(LS.SETTINGS, defaultSettings);
let role = load(LS.ROLE, defaultRole);
let tasks = load(LS.TASKS, []);
let stats = load(LS.STATS, defaultStats());

const timeText = $('#timeText'), btnStart = $('#btnStart'), btnPause = $('#btnPause'), btnReset = $('#btnReset');
const focusInput = $('#focusMinutes'), breakInput = $('#breakMinutes');
const speechBox = $('#roleSpeech'), roleAvatar = $('#roleAvatar'), currentTaskSel = $('#currentTask');
const todayPomodoros = $('#todayPomodoros'), todayFocus = $('#todayFocus');
const sndStart = document.getElementById('soundStart'), sndEnd = document.getElementById('soundEnd');

let mode = 'focus', timer = null, endAt = null, remainingMs = 0;

function setRemaining(ms){ remainingMs=Math.max(0,ms); const s=Math.ceil(ms/1000); const mm=String(Math.floor(s/60)).padStart(2,'0'); const ss=String(s%60).padStart(2,'0'); timeText.textContent=`${mm}:${ss}`; }
function ensureToday(){ const d=new Date().toISOString().slice(0,10); if(stats.date!==d){ stats=defaultStats(); save(LS.STATS,stats); } }
function renderStats(){ ensureToday(); todayPomodoros.textContent=stats.pomodoros; todayFocus.textContent=`${stats.focusMinutes}m`; }
function renderSettings(){ focusInput.value=settings.focusMin; breakInput.value=settings.breakMin; }
function renderRole(){
  roleAvatar.src = role.avatarDataUrl || 'https://picsum.photos/200?blur=3';
  say('startPrompt');
}
function renderTaskOptions(){
  currentTaskSel.innerHTML=''; const op=document.createElement('option'); op.value=''; op.textContent='（不指定）'; currentTaskSel.appendChild(op);
  tasks.forEach(t=>{ const o=document.createElement('option'); o.value=t.id; o.textContent=t.title; currentTaskSel.appendChild(o); });
}

function say(kind){
  const arr = role.speeches?.[kind] || [];
  let t = arr.length ? arr[Math.floor(Math.random()*arr.length)] : '（尚未為此時機新增台詞）';
  const taskName = (tasks.find(x=>x.id===currentTaskSel.value)||{}).title || '這一輪';
  t = t.replaceAll('{task}', taskName).replaceAll('{you}', role.youNickname || '你').replaceAll('{role}', role.name || '夢角');
  speechBox.textContent = `${role.name || '夢角'}：${t}`;
}
function setMode(m){
  mode=m; if(timer){clearInterval(timer); timer=null;}
  const minutes=(mode==='focus'?settings.focusMin:settings.breakMin);
  setRemaining(minutes*60*1000);
  say(mode==='focus'?'startPrompt':'breakPrompt');
}
function tick(){ const left=endAt-Date.now(); if(left<=0){stop(); onDone();} else setRemaining(left); }
function start(){ if(timer) return; endAt=Date.now()+(remainingMs||((mode==='focus'?settings.focusMin:settings.breakMin)*60*1000)); timer=setInterval(tick,250); try{sndStart.currentTime=0;sndStart.play();}catch{} say('onStart'); }
function pause(){ if(!timer) return; clearInterval(timer); timer=null; remainingMs=Math.max(0,endAt-Date.now()); say('onPause'); }
function stop(){ if(timer){clearInterval(timer);timer=null;} endAt=null; }
function reset(){ stop(); const m=(mode==='focus'?settings.focusMin:settings.breakMin); setRemaining(m*60*1000); say('onReset'); }
function onDone(){
  setRemaining(0); try{sndEnd.currentTime=0;sndEnd.play();}catch{}
  if(mode==='focus'){ ensureToday(); stats.pomodoros+=1; stats.focusMinutes+=settings.focusMin; save(LS.STATS,stats); renderStats(); say('onFocusEnd'); setMode('break'); }
  else { say('onBreakEnd'); setMode('focus'); }
}

/* 事件與初始化 */
btnStart.addEventListener('click', start);
btnPause.addEventListener('click', pause);
btnReset.addEventListener('click', reset);
focusInput.addEventListener('change', ()=>{ settings.focusMin=Math.max(1,Math.min(180, +focusInput.value||25)); save(LS.SETTINGS,settings); if(mode==='focus') reset(); });
breakInput.addEventListener('change', ()=>{ settings.breakMin=Math.max(1,Math.min(60, +breakInput.value||5)); save(LS.SETTINGS,settings); if(mode==='break') reset(); });
currentTaskSel.addEventListener('change', ()=> say('onStart'));

renderSettings();
renderRole();
renderTaskOptions();
renderStats();
setMode('focus');

/* ===== 本地 key & 預設 ===== */
const LS = {
  SETTINGS: 'pomodoro_settings',
  TASKS: 'pomodoro_tasks',
  ROLE: 'pomodoro_role',
  STATS: 'pomodoro_stats_v3'
};
const defaultSettings = { focusMin: 25, breakMin: 5 };
const defaultRole = {
  name: '',
  youNickname: '',
  avatarDataUrl: '',
  speeches: {
    startPrompt: [], breakPrompt: [], onStart: [], onPause: [],
    onReset: [], onFocusEnd: [], onBreakEnd: []
  }
};
const defaultStats = () => ({ date: new Date().toISOString().slice(0,10), pomodoros: 0, focusMinutes: 0 });

/* ===== 工具 ===== */
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const load = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const uuid = () => Math.random().toString(36).slice(2,9);

/* ====== 主題（整站換色） ====== */
const THEME_KEY = 'pomodoro_theme';
const THEMES = {
  base: { // 粉白
    '--bg':'#2a2328','--bg2':'#1b161a','--card':'#2a2530','--border':'#3a3340',
    '--text':'#fff4f8','--muted':'#e4c9d6','--primary':'#f7a9c6','--primary2':'#ffa6e7','--accent':'#ffd3e6'
  },
  black: { // 深灰黑（預設）
    '--bg':'#0d0e11','--bg2':'#0a0a0d','--card':'#171922','--border':'#2a2a3a',
    '--text':'#f3f4f9','--muted':'#a7a7bb','--primary':'#646b75','--primary2':'#8b9099','--accent':'#3d3f46'
  },
  brown: { // 咖啡棕
    '--bg':'#1a1514','--bg2':'#130f0e','--card':'#231a1a','--border':'#3b2b2a',
    '--text':'#f5f2ef','--muted':'#cbbfb7','--primary':'#8a6a5a','--primary2':'#b08974','--accent':'#d9c2b4'
  },
  green: { // 薄荷綠
    '--bg':'#0f1513','--bg2':'#0c110f','--card':'#16221c','--border':'#254036',
    '--text':'#eef8f2','--muted':'#b7d0c2','--primary':'#7ed9a8','--primary2':'#b0f0cf','--accent':'#c7f5df'
  }
};
function applyTheme(name){
  const theme = THEMES[name] || THEMES.black;
  const root = document.documentElement;
  Object.entries(theme).forEach(([k,v])=> root.style.setProperty(k,v));
  localStorage.setItem(THEME_KEY, name);
}
function currentTheme(){ return localStorage.getItem(THEME_KEY) || 'black'; }
function renderThemePicker(){
  const wrap = document.getElementById('themes'); if(!wrap) return;
  wrap.innerHTML = '';
  const items = [['base','基礎'],['black','黑色'],['brown','棕色'],['green','綠色']];
  items.forEach(([key,label])=>{
    const btn = document.createElement('button');
    btn.className = 'theme-btn'; btn.dataset.key = key; btn.setAttribute('aria-label',label);
    // 四象限示意色塊（不顯示任何圖片/文字）
    const t = THEMES[key], blocks=[t['--primary'],t['--accent'],t['--card'],t['--bg']];
    blocks.forEach(c=>{ const s=document.createElement('span'); s.style.background=c; btn.appendChild(s); });
    const box = document.createElement('div'); box.className='theme-wrap';
    const lab = document.createElement('div'); lab.className='theme-label'; lab.textContent=label;
    if(key===currentTheme()) btn.classList.add('active');
    btn.addEventListener('click', ()=>{
      [...wrap.querySelectorAll('.theme-btn')].forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); applyTheme(key);
    });
    box.append(btn, lab); wrap.appendChild(box);
  });
}

/* ===== 狀態 ===== */
let settings = load(LS.SETTINGS, defaultSettings);
let role = load(LS.ROLE, defaultRole);
let tasks = load(LS.TASKS, []);
let stats = load(LS.STATS, defaultStats());

/* ===== DOM ===== */
const timeText = $('#timeText'), btnStart = $('#btnStart'), btnPause = $('#btnPause'), btnReset = $('#btnReset');
const focusInput = $('#focusMinutes'), breakInput = $('#breakMinutes');
const tabs = $$('.tab'), speechBox = $('#roleSpeech'), roleAvatar = $('#roleAvatar'), currentTaskSel = $('#currentTask');
const todayPomodoros = $('#todayPomodoros'), todayFocus = $('#todayFocus');
const newTaskInput = $('#newTaskInput'), addTaskBtn = $('#addTaskBtn'), taskList = $('#taskList');
const roleName = $('#roleName'), youNickname = $('#youNickname'), avatarFile = $('#avatarFile'), avatarPreview = $('#avatarPreview'), saveRoleBtn = $('#saveRole');
const speechEditor = $('#speechEditor');
const sndStart = $('#soundStart'), sndEnd = $('#soundEnd');

/* ===== 計時器 ===== */
let mode = 'focus', timer = null, endAt = null, remainingMs = 0;

function setMode(m){
  mode = m;
  tabs.forEach(t=>t.classList.toggle('active', t.dataset.mode===mode));
  stopTimer();
  const minutes = (mode==='focus'? settings.focusMin : settings.breakMin);
  setRemaining(minutes*60*1000);
  say(mode==='focus' ? 'startPrompt' : 'breakPrompt');
}
function setRemaining(ms){ remainingMs = Math.max(0,ms); renderTime(remainingMs); }
function renderTime(ms){
  const s = Math.ceil(ms/1000), mm = String(Math.floor(s/60)).padStart(2,'0'), ss = String(s%60).padStart(2,'0');
  timeText.textContent = `${mm}:${ss}`;
}
function tick(){
  const left = endAt - Date.now();
  if(left <= 0){ stopTimer(); onTimerComplete(); } else { setRemaining(left); }
}
function startTimer(){
  if(timer) return;
  endAt = Date.now() + (remainingMs || (mode==='focus'? settings.focusMin : settings.breakMin)*60*1000);
  timer = setInterval(tick, 250);
  try{ sndStart.currentTime=0; sndStart.play(); }catch{}
  say('onStart');
}
function pauseTimer(){ if(!timer) return; clearInterval(timer); timer=null; remainingMs = Math.max(0, endAt - Date.now()); say('onPause'); }
function stopTimer(){ if(timer){ clearInterval(timer); timer=null; } endAt=null; }
function resetTimer(){ stopTimer(); const m = (mode==='focus'? settings.focusMin : settings.breakMin); setRemaining(m*60*1000); say('onReset'); }
function onTimerComplete(){
  setRemaining(0);
  try{ sndEnd.currentTime=0; sndEnd.play(); }catch{}
  if(mode==='focus'){
    ensureToday(); stats.pomodoros += 1; stats.focusMinutes += settings.focusMin; save(LS.STATS, stats); renderStats(); say('onFocusEnd'); setMode('break');
  }else{ say('onBreakEnd'); setMode('focus'); }
}

/* ===== 台詞（全自訂） ===== */
const TRIGGERS = [
  ['startPrompt','切到番茄鐘時'],
  ['breakPrompt','切到休息時'],
  ['onStart','按開始'],
  ['onPause','按暫停'],
  ['onReset','按重置'],
  ['onFocusEnd','番茄完成'],
  ['onBreakEnd','休息結束']
];
function say(kind){
  const arr = role.speeches?.[kind] || [];
  let t = arr.length ? arr[Math.floor(Math.random()*arr.length)] : '（尚未為此時機新增台詞）';
  const taskName = (tasks.find(x=>x.id===currentTaskSel.value)||{}).title || '這一輪';
  t = t.replaceAll('{task}', taskName).replaceAll('{you}', role.youNickname || '你').replaceAll('{role}', role.name || '夢角');
  speechBox.textContent = `${role.name || '夢角'}：${t}`;
}
function buildSpeechEditor(){
  speechEditor.innerHTML = '';
  TRIGGERS.forEach(([key, label])=>{
    const block = document.createElement('div'); block.className='speech-block';
    block.innerHTML = `
      <h4>${label}（${key}）</h4>
      <div class="rows" data-key="${key}"></div>
      <div class="speech-row">
        <input type="text" placeholder="輸入一句台詞，支援 {you}/{task}/{role}" />
        <button class="addBtn">新增</button>
      </div>`;
    const rows = block.querySelector('.rows');
    const renderRows = ()=>{
      rows.innerHTML='';
      (role.speeches[key]||[]).forEach((line,idx)=>{
        const r = document.createElement('div'); r.className='speech-row';
        r.innerHTML = `<input type="text" value="${line.replace(/"/g,'&quot;')}" data-idx="${idx}"/><button class="delBtn" data-idx="${idx}">刪除</button>`;
        rows.appendChild(r);
      });
    };
    renderRows();

    block.querySelector('.addBtn').addEventListener('click', ()=>{
      const input = block.querySelector('.speech-row input');
      const v = input.value.trim(); if(!v) return;
      role.speeches[key] = role.speeches[key] || []; role.speeches[key].push(v);
      input.value=''; renderRows(); save(LS.ROLE, role); say('startPrompt');
    });
    block.addEventListener('click', e=>{
      if(e.target.classList.contains('delBtn')){
        const idx = +e.target.dataset.idx;
        role.speeches[key].splice(idx,1);
        save(LS.ROLE, role); renderRows();
      }
    });
    block.addEventListener('change', e=>{
      if(e.target.matches('input[type="text"][data-idx]')){
        const idx = +e.target.dataset.idx; role.speeches[key][idx] = e.target.value;
        save(LS.ROLE, role);
      }
    });
    speechEditor.appendChild(block);
  });
}

/* ===== 任務 ===== */
function renderTasks(){
  taskList.innerHTML='';
  tasks.forEach(task=>{
    const li=document.createElement('li'); li.className='task'+(task.done?' done':''); li.draggable=true; li.dataset.id=task.id;
    const handle=document.createElement('span'); handle.textContent='≡'; handle.className='handle';
    const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=!!task.done;
    const title=document.createElement('div'); title.className='title'; title.textContent=task.title;
    const del=document.createElement('button'); del.textContent='刪除';
    cb.addEventListener('change', ()=>{ task.done=cb.checked; save(LS.TASKS,tasks); renderTasks(); renderTaskOptions(); });
    del.addEventListener('click', ()=>{ tasks = tasks.filter(t=>t.id!==task.id); save(LS.TASKS,tasks); renderTasks(); renderTaskOptions(); });
    li.addEventListener('dragstart', e=>{ e.dataTransfer.setData('text/plain', task.id); });
    li.addEventListener('dragover', e=>e.preventDefault());
    li.addEventListener('drop', e=>{ e.preventDefault(); const fromId=e.dataTransfer.getData('text/plain'); const toId=task.id;
      const a=tasks.findIndex(t=>t.id===fromId), b=tasks.findIndex(t=>t.id===toId); const [m]=tasks.splice(a,1); tasks.splice(b,0,m);
      save(LS.TASKS,tasks); renderTasks(); renderTaskOptions();
    });
    li.append(handle,cb,title,del); taskList.appendChild(li);
  });
}
function renderTaskOptions(){
  currentTaskSel.innerHTML=''; const opt=document.createElement('option'); opt.value=''; opt.textContent='（不指定）'; currentTaskSel.appendChild(opt);
  tasks.forEach(t=>{ const o=document.createElement('option'); o.value=t.id; o.textContent=t.title; currentTaskSel.appendChild(o); });
}
$('#addTaskBtn').addEventListener('click', addTask);
$('#newTaskInput').addEventListener('keydown', e=>{ if(e.key==='Enter') addTask(); });
function addTask(){ const v=newTaskInput.value.trim(); if(!v) return; tasks.push({id:uuid(), title:v, done:false}); newTaskInput.value=''; save(LS.TASKS,tasks); renderTasks(); renderTaskOptions(); }

/* ===== 角色設定 ===== */
function renderRole(){
  roleName.value = role.name || '';
  youNickname.value = role.youNickname || '';
  avatarPreview.src = role.avatarDataUrl || '';
  roleAvatar.src = role.avatarDataUrl || 'https://picsum.photos/200?blur=3';
  buildSpeechEditor();
  say('startPrompt');
}
avatarFile.addEventListener('change', e=>{
  const f = e.target.files?.[0]; if(!f) return;
  const reader=new FileReader(); reader.onload=()=>{ avatarPreview.src=reader.result; }; reader.readAsDataURL(f);
});
saveRoleBtn.addEventListener('click', ()=>{
  role.name = roleName.value.trim();
  role.youNickname = youNickname.value.trim();
  role.avatarDataUrl = avatarPreview.src || role.avatarDataUrl;
  save(LS.ROLE, role); renderRole();
});

/* ===== 設定 & 統計 ===== */
function ensureToday(){ const today=new Date().toISOString().slice(0,10); if(stats.date!==today){ stats=defaultStats(); save(LS.STATS,stats); } }
function renderStats(){ ensureToday(); todayPomodoros.textContent=stats.pomodoros; todayFocus.textContent=`${stats.focusMinutes}m`; }
function renderSettings(){ focusInput.value=settings.focusMin; breakInput.value=settings.breakMin; }
focusInput.addEventListener('change', ()=>{ const v=+focusInput.value||25; settings.focusMin=Math.max(1,Math.min(180,v)); save(LS.SETTINGS,settings); if(mode==='focus') resetTimer(); });
breakInput.addEventListener('change', ()=>{ const v=+breakInput.value||5; settings.breakMin=Math.max(1,Math.min(60,v)); save(LS.SETTINGS,settings); if(mode==='break') resetTimer(); });

/* ===== 綁定 ===== */
btnStart.addEventListener('click', startTimer);
btnPause.addEventListener('click', pauseTimer);
btnReset.addEventListener('click', resetTimer);
tabs.forEach(t=>t.addEventListener('click', ()=>setMode(t.dataset.mode)));
currentTaskSel.addEventListener('change', ()=> say('onStart') );

/* ===== 初始化 ===== */
(function init(){
  applyTheme(currentTheme());
  renderThemePicker();
  renderSettings(); renderRole(); renderTasks(); renderTaskOptions(); renderStats(); setMode('focus');
})();

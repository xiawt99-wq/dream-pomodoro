/* ===== 共用：localStorage keys ===== */
export const LS = {
  SETTINGS: 'pomodoro_settings',
  TASKS: 'pomodoro_tasks',
  ROLE: 'pomodoro_role',
  STATS: 'pomodoro_stats_v3',
  THEME: 'pomodoro_theme'
};
export const defaultSettings = { focusMin: 25, breakMin: 5 };
export const defaultRole = {
  name: '', youNickname: '', avatarDataUrl: '',
  speeches: { startPrompt:[], breakPrompt:[], onStart:[], onPause:[], onReset:[], onFocusEnd:[], onBreakEnd:[] }
};
export const defaultStats = () => ({ date: new Date().toISOString().slice(0,10), pomodoros:0, focusMinutes:0 });

export const $ = s => document.querySelector(s);

/* ===== 共用：存取 ===== */
export const load = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
export const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
export const uuid = () => Math.random().toString(36).slice(2,9);

/* ===== 共用：主題（整站換色） ===== */
const THEMES = {
  base: { '--bg':'#2a2328','--bg2':'#1b161a','--card':'#2a2530','--border':'#3a3340','--text':'#fff4f8','--muted':'#e4c9d6','--primary':'#f7a9c6','--primary2':'#ffa6e7','--accent':'#ffd3e6' },
  black:{ '--bg':'#0d0e11','--bg2':'#0a0a0d','--card':'#171922','--border':'#2a2a3a','--text':'#f3f4f9','--muted':'#a7a7bb','--primary':'#646b75','--primary2':'#8b9099','--accent':'#3d3f46' },
  brown:{ '--bg':'#1a1514','--bg2':'#130f0e','--card':'#231a1a','--border':'#3b2b2a','--text':'#f5f2ef','--muted':'#cbbfb7','--primary':'#8a6a5a','--primary2':'#b08974','--accent':'#d9c2b4' },
  green:{ '--bg':'#0f1513','--bg2':'#0c110f','--card':'#16221c','--border':'#254036','--text':'#eef8f2','--muted':'#b7d0c2','--primary':'#7ed9a8','--primary2':'#b0f0cf','--accent':'#c7f5df' }
};
export function applyTheme(name){
  const theme = THEMES[name] || THEMES.black;
  Object.entries(theme).forEach(([k,v])=> document.documentElement.style.setProperty(k,v));
  localStorage.setItem(LS.THEME, name);
}
export function currentTheme(){ return localStorage.getItem(LS.THEME) || 'black'; }
export function mountThemePicker(selectEl){
  if(!selectEl) return;
  selectEl.innerHTML = '';
  [['base','基礎'],['black','黑色'],['brown','棕色'],['green','綠色']].forEach(([v,l])=>{
    const op=document.createElement('option'); op.value=v; op.textContent=l; selectEl.appendChild(op);
  });
  selectEl.value = currentTheme();
  selectEl.addEventListener('change', ()=> applyTheme(selectEl.value));
}

/* ===== 共用：導覽列 ===== */
export function mountNav(active){
  const nav = document.querySelector('.nav');
  if(!nav) return;
  const items = [
    ['index.html','計時'],
    ['tasks.html','任務'],
    ['role.html','夢角設定']
  ];
  nav.innerHTML = items.map(([href,label])=>`<a href="${href}" class="${active===href?'active':''}">${label}</a>`).join('');
}

/* 初始套主題 */
applyTheme(currentTheme());

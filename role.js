import {LS, defaultRole, $, load, save} from './common.js';

let role = load(LS.ROLE, defaultRole);

const roleName = $('#roleName');
const youNickname = $('#youNickname');
const avatarFile = $('#avatarFile');
const avatarPreview = $('#avatarPreview');
const saveRoleBtn = $('#saveRole');
const speechEditor = $('#speechEditor');

const TRIGGERS = [
  ['startPrompt','切到番茄鐘時'],
  ['breakPrompt','切到休息時'],
  ['onStart','按開始'],
  ['onPause','按暫停'],
  ['onReset','按重置'],
  ['onFocusEnd','番茄完成'],
  ['onBreakEnd','休息結束']
];

function buildSpeechEditor(){
  speechEditor.innerHTML = '';
  TRIGGERS.forEach(([key,label])=>{
    const block = document.createElement('div'); block.className='speech-block';
    block.innerHTML = `
      <h4>${label}（${key}）</h4>
      <div class="rows" data-key="${key}"></div>
      <div class="speech-row">
        <input type="text" placeholder="輸入一句台詞，支援 {you}/{task}/{role}" />
        <button class="addBtn">新增</button>
      </div>`;
    const rows = block.querySelector('.rows');
    function renderRows(){
      rows.innerHTML='';
      (role.speeches[key]||[]).forEach((line,idx)=>{
        const r = document.createElement('div'); r.className='speech-row';
        r.innerHTML = `<input type="text" value="${line.replace(/"/g,'&quot;')}" data-idx="${idx}"/><button class="delBtn" data-idx="${idx}">刪除</button>`;
        rows.appendChild(r);
      });
    }
    renderRows();

    block.querySelector('.addBtn').addEventListener('click', ()=>{
      const input = block.querySelector('.speech-row input');
      const v = input.value.trim(); if(!v) return;
      role.speeches[key] = role.speeches[key] || []; role.speeches[key].push(v);
      input.value=''; renderRows(); save(LS.ROLE, role);
    });
    block.addEventListener('click', e=>{
      if(e.target.classList.contains('delBtn')){
        const idx = +e.target.dataset.idx; role.speeches[key].splice(idx,1); save(LS.ROLE, role); renderRows();
      }
    });
    block.addEventListener('change', e=>{
      if(e.target.matches('input[type="text"][data-idx]')){ const idx=+e.target.dataset.idx; role.speeches[key][idx]=e.target.value; save(LS.ROLE, role); }
    });
    speechEditor.appendChild(block);
  });
}

function renderRole(){
  roleName.value = role.name || '';
  youNickname.value = role.youNickname || '';
  avatarPreview.src = role.avatarDataUrl || '';
  buildSpeechEditor();
}

avatarFile.addEventListener('change', e=>{
  const f = e.target.files?.[0]; if(!f) return;
  const reader = new FileReader();
  reader.onload = ()=> { avatarPreview.src = reader.result; };
  reader.readAsDataURL(f);
});

saveRoleBtn.addEventListener('click', ()=>{
  role.name = roleName.value.trim();
  role.youNickname = youNickname.value.trim();
  role.avatarDataUrl = avatarPreview.src || role.avatarDataUrl;
  save(LS.ROLE, role);
  alert('已儲存夢角設定');
});

renderRole();

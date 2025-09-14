import {LS, $, load, save, uuid} from './common.js';

let tasks = load(LS.TASKS, []);

const newTaskInput = $('#newTaskInput');
const addTaskBtn   = $('#addTaskBtn');
const taskList     = $('#taskList');

function render(){
  taskList.innerHTML='';
  tasks.forEach(task=>{
    const li=document.createElement('li'); li.className='task'+(task.done?' done':''); li.draggable=true; li.dataset.id=task.id;
    const handle=document.createElement('span'); handle.textContent='≡'; handle.className='handle';
    const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=!!task.done;
    const title=document.createElement('div'); title.className='title'; title.textContent=task.title;
    const del=document.createElement('button'); del.textContent='刪除';
    cb.addEventListener('change', ()=>{ task.done=cb.checked; save(LS.TASKS,tasks); render(); });
    del.addEventListener('click', ()=>{ tasks = tasks.filter(t=>t.id!==task.id); save(LS.TASKS,tasks); render(); });
    li.addEventListener('dragstart', e=> e.dataTransfer.setData('text/plain', task.id));
    li.addEventListener('dragover', e=> e.preventDefault());
    li.addEventListener('drop', e=>{
      e.preventDefault(); const fromId=e.dataTransfer.getData('text/plain'); const toId=task.id;
      const a=tasks.findIndex(t=>t.id===fromId), b=tasks.findIndex(t=>t.id===toId);
      const [m]=tasks.splice(a,1); tasks.splice(b,0,m); save(LS.TASKS,tasks); render();
    });
    li.append(handle, cb, title, del); taskList.appendChild(li);
  });
}
function addTask(){
  const v = newTaskInput.value.trim(); if(!v) return;
  tasks.push({id:uuid(), title:v, done:false});
  newTaskInput.value=''; save(LS.TASKS,tasks); render();
}
addTaskBtn.addEventListener('click', addTask);
newTaskInput.addEventListener('keydown', e=>{ if(e.key==='Enter') addTask(); });

render();

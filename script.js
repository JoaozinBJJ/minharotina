const STORAGE_KEY = 'rotina.tasks';
const THEME_KEY = 'rotina.theme';
const app = document.getElementById('app');
const form = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const list = document.getElementById('taskList');
const count = document.getElementById('count');
const undone = document.getElementById('undone');
const themeToggle = document.getElementById('themeToggle');

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let theme = localStorage.getItem(THEME_KEY) || 'light';

document.documentElement.setAttribute('data-theme', theme);
themeToggle.textContent = theme === 'dark' ? 'Modo Claro' : 'Modo Escuro';

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
function render(){
    list.innerHTML='';
    tasks.slice().reverse().forEach(t => {
        const el = document.createElement('div');
        el.className = 'task' + (t.done ? ' done' : '');
        el.innerHTML = `
            <div class="left">
                <div>
                    <div class="title">${escapeHtml(t.title)}</div>
                    <div class="meta">${new Date(t.created).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                </div>
            </div>
            <div class="actions">
                <button class="icon-btn toggle" title="Marcar como feita">${t.done ? '↺' : '✓'}</button>
                <button class="icon-btn delete" title="Remover">✕</button>
            </div>
        `;
        // eventos
        el.querySelector('.toggle').addEventListener('click', ()=>{ t.done = !t.done; save(); render(); });
        el.querySelector('.delete').addEventListener('click', ()=>{ tasks = tasks.filter(x=>x.id!==t.id); save(); render(); });
        list.appendChild(el);
    });
    count.textContent = `${tasks.length} ${tasks.length===1? 'tarefa' : 'tarefas'}`;
    undone.textContent = `${tasks.filter(t=>!t.done).length} pendentes`;
}

form.addEventListener('submit', e => {
    e.preventDefault();
    const title = taskInput.value.trim();
    if(!title) return;
    const task = { id: Date.now(), title, done:false, created: Date.now() };
    tasks.push(task);
    save();
    render();
    form.reset();
    taskInput.focus();
});

// tema
themeToggle.addEventListener('click', ()=>{
    theme = theme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'dark' ? 'Modo Claro' : 'Modo Escuro';
    localStorage.setItem(THEME_KEY, theme);
});


function escapeHtml(str){ return str.replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]); }


render();

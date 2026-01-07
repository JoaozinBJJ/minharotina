const STORAGE_KEY = 'rotina.tasks';
const THEME_KEY = 'rotina.theme';
const app = document.getElementById('app');
const form = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const list = document.getElementById('taskList');
const count = document.getElementById('count');
const undone = document.getElementById('undone');
const themeToggle = document.getElementById('themeToggle');

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').map(t => ({ ...t, urgency: t.urgency || 'Normal' }));
let theme = localStorage.getItem(THEME_KEY) || 'light';

document.documentElement.setAttribute('data-theme', theme);
themeToggle.textContent = theme === 'dark' ? 'Modo Claro' : 'Modo Escuro';

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
function render(){
    list.innerHTML='';
    tasks.slice().reverse().forEach(t => {
        const el = document.createElement('div');
        el.className = 'task' + (t.done ? ' done' : '');
        el.setAttribute('data-urgency', t.urgency || 'Normal');
        el.innerHTML = `
            <div class="left">
                <div>
                    <div class="title">${escapeHtml(t.title)}</div>
                    <div class="meta">${new Date(t.created).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                </div>
            </div>
            <div class="actions">
                <select class="urgency-select" aria-label="Urgência">
                    <option value="Normal"${t.urgency === 'Normal' ? ' selected' : ''}>Normal</option>
                    <option value="Alta"${t.urgency === 'Alta' ? ' selected' : ''}>Alta</option>
                    <option value="Urgente"${t.urgency === 'Urgente' ? ' selected' : ''}>Urgente</option>
                </select>
                <button class="icon-btn toggle" title="Marcar como feita">${t.done ? '↺' : '✓'}</button>
                <button class="icon-btn delete" title="Remover">✕</button>
            </div>
        `;
        // eventos
        el.querySelector('.urgency-select').addEventListener('change', (e)=>{ t.urgency = e.target.value; save(); render(); });
        el.querySelector('.toggle').addEventListener('click', ()=>{ t.done = !t.done; if(t.done){ t.completedAt = Date.now(); } else { delete t.completedAt; } save(); render(); });
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
    const task = { id: Date.now(), title, urgency: 'Normal', done:false, created: Date.now() };
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

// Analytics (charts)
const analyticsBtn = document.getElementById('analyticsBtn');
const analyticsModal = document.getElementById('analyticsModal');
const closeAnalytics = document.getElementById('closeAnalytics');
let chartCompleted, chartUrgency, chartAvgTime;

function msToMinutes(ms){ return ms / 60000; }
function formatMinutes(mins){ if(mins === 0) return '0'; if(mins < 60) return `${Math.round(mins)}m`; const h = Math.floor(mins/60); const m = Math.round(mins%60); return `${h}h ${m}m`; }

function computeStats(){
    const total = tasks.length;
    const completedCount = tasks.filter(t=>t.done).length;
    const pendingCount = total - completedCount;
    const urgencies = ['Normal','Alta','Urgente'];
    const urgencyCounts = urgencies.map(u => tasks.filter(t => t.urgency === u).length);
    const avgMinutesByUrgency = urgencies.map(u => {
        const list = tasks.filter(t => t.urgency === u && t.completedAt).map(x => msToMinutes(x.completedAt - x.created));
        if(list.length === 0) return 0;
        return list.reduce((a,b) => a + b, 0) / list.length;
    });
    return { total, completedCount, pendingCount, urgencies, urgencyCounts, avgMinutesByUrgency };
}

function renderAnalytics(){
    const s = computeStats();
    // Completed doughnut
    const ctxC = document.getElementById('chartCompleted').getContext('2d');
    const dataC = { labels:['Concluídas','Pendentes'], datasets:[{ data:[s.completedCount, s.pendingCount], backgroundColor:['#7b5cff','#e6e6ee'] }] };
    if(chartCompleted){ chartCompleted.data = dataC; chartCompleted.update(); } else { chartCompleted = new Chart(ctxC, { type:'doughnut', data:dataC, options:{ responsive:true, plugins:{legend:{position:'bottom'}} } }); }

    // Urgency bar
    const ctxU = document.getElementById('chartUrgency').getContext('2d');
    const dataU = { labels:s.urgencies, datasets:[{ label:'Qtd tarefas', data:s.urgencyCounts, backgroundColor:['#bfa3ff','#ffb86b','#ff6b6b'] }] };
    if(chartUrgency){ chartUrgency.data = dataU; chartUrgency.update(); } else { chartUrgency = new Chart(ctxU, { type:'bar', data:dataU, options:{responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true,precision:0}} } }); }

    // Avg time bar (minutes)
    const ctxT = document.getElementById('chartAvgTime').getContext('2d');
    const avgRounded = s.avgMinutesByUrgency.map(v => Math.round(v*10)/10);
    const dataT = { labels:s.urgencies, datasets:[{ label:'Tempo médio (min)', data:avgRounded, backgroundColor:['#bfa3ff','#ffb86b','#ff6b6b'] }] };
    if(chartAvgTime){ chartAvgTime.data = dataT; chartAvgTime.update(); } else { chartAvgTime = new Chart(ctxT, { type:'bar', data:dataT, options:{responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}} } }); }

    // add textual info under charts (optional) - below each canvas we could add info, but for simplicity we rely on chart tooltips.
}

analyticsBtn.addEventListener('click', ()=>{
    analyticsModal.classList.add('open');
    analyticsModal.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
    renderAnalytics();
});
closeAnalytics.addEventListener('click', ()=>{
    analyticsModal.classList.remove('open');
    analyticsModal.setAttribute('aria-hidden','true');
    document.body.classList.remove('modal-open');
});
analyticsModal.addEventListener('click', (e)=>{ if(e.target === analyticsModal){ analyticsModal.classList.remove('open'); analyticsModal.setAttribute('aria-hidden','true'); document.body.classList.remove('modal-open'); }});

render();

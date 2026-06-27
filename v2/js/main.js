/* ═══════════════════════════════════════════════════════════════
   HMGOS v2.0 — Main JavaScript
   Features: Boot, Matrix, Window Manager, Terminal, Clock, Monitor
═══════════════════════════════════════════════════════════════ */

// ─── BOOT SEQUENCE ───────────────────────────────────────────
const BOOT_MSGS = [
    'Initializing system...',
    'Loading kernel modules...',
    'Starting system services...',
    'Mounting filesystems...',
    'Starting network services...',
    'Loading portfolio data...',
    'Initializing desktop...',
    'Welcome, Hari.'
];

let bootProgress = 0;
const bootBar = document.getElementById('boot-bar');
const bootMsg = document.getElementById('boot-msg');
const bootScreen = document.getElementById('boot-screen');
const osEl = document.getElementById('os');

function runBoot() {
    let msgIdx = 0;
    const interval = setInterval(() => {
        bootProgress += Math.floor(Math.random() * 18) + 8;
        if (bootProgress > 100) bootProgress = 100;
        bootBar.style.width = bootProgress + '%';
        if (msgIdx < BOOT_MSGS.length) {
            bootMsg.textContent = BOOT_MSGS[msgIdx++];
        }
        if (bootProgress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                bootScreen.style.opacity = '0';
                setTimeout(() => {
                    bootScreen.classList.add('hidden');
                    osEl.classList.remove('hidden');
                    initOS();
                }, 600);
            }, 600);
        }
    }, 120);
}

// ─── WINDOW MANAGER ──────────────────────────────────────────
let topZ = 10;
let dragging = null;
let dragOffsetX = 0, dragOffsetY = 0;
let maximizedWin = null;
let savedGeometry = {};

const windowMap = {
    terminal: 'win-terminal',
    notes: 'win-notes',
    files: 'win-files',
    about: 'win-about',
    projects: 'win-projects',
    cyber: 'win-cyber',
    webdev: 'win-webdev',
    radar: 'win-radar',
    contact: 'win-contact',
    trash: 'win-trash'
};

function getWin(id) {
    return document.getElementById(id);
}

function focusWindow(winId) {
    document.querySelectorAll('.window').forEach(w => {
        w.classList.remove('focused');
    });
    const el = getWin(winId);
    if (el) {
        el.classList.add('focused');
        el.style.zIndex = ++topZ;
    }
}

function openWindow(appKey) {
    const winId = windowMap[appKey];
    if (!winId) return;
    const el = getWin(winId);
    if (!el) return;

    if (el.classList.contains('hidden')) {
        el.classList.remove('hidden');
        // Center window on first open if not already positioned
        const desktop = document.getElementById('desktop');
        const dw = desktop.offsetWidth;
        const dh = desktop.offsetHeight;
        const ww = el.offsetWidth || 400;
        const wh = el.offsetHeight || 300;
        if (!el.dataset.positioned) {
            const left = Math.max(10, Math.min(dw - ww - 10, (dw - ww) / 2 + Math.random() * 40 - 20));
            const top = Math.max(5, Math.min(dh - wh - 10, (dh - wh) / 3 + Math.random() * 40 - 20));
            el.style.left = left + 'px';
            el.style.top = top + 'px';
            el.dataset.positioned = 'true';
        }
    }
    focusWindow(winId);

    // Special init for radar mini
    if (appKey === 'radar') {
        setTimeout(initRadarMini, 100);
    }
}

function openFolderItem(key) {
    openWindow(key);
}

function closeWindow(winId) {
    const el = getWin(winId);
    if (el) {
        el.classList.add('hidden');
        el.classList.remove('focused', 'maximized');
    }
}

function minimizeWindow(winId) {
    const el = getWin(winId);
    if (el) el.classList.add('hidden');
}

function maximizeWindow(winId) {
    const el = getWin(winId);
    if (!el) return;
    if (el.classList.contains('maximized')) {
        // Restore
        el.classList.remove('maximized');
        if (savedGeometry[winId]) {
            el.style.left = savedGeometry[winId].left;
            el.style.top = savedGeometry[winId].top;
            el.style.width = savedGeometry[winId].width;
            el.style.height = savedGeometry[winId].height;
        }
    } else {
        // Save & maximize
        savedGeometry[winId] = {
            left: el.style.left,
            top: el.style.top,
            width: el.style.width,
            height: el.style.height
        };
        el.classList.add('maximized');
    }
    focusWindow(winId);
}

// ─── DRAG ────────────────────────────────────────────────────
function startDrag(e, winId) {
    if (e.target.closest('.wc') || e.target.closest('.win-actions') ||
        e.target.closest('.menu-item') || e.target.closest('input') || e.target.closest('button')) {
        return;
    }
    const el = getWin(winId);
    if (!el || el.classList.contains('maximized')) return;
    focusWindow(winId);
    dragging = el;
    const rect = el.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    e.preventDefault();
}

document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const desktop = document.getElementById('desktop');
    const dRect = desktop.getBoundingClientRect();
    let nx = e.clientX - dRect.left - dragOffsetX;
    let ny = e.clientY - dRect.top - dragOffsetY;
    nx = Math.max(-100, Math.min(dRect.width - 80, nx));
    ny = Math.max(0, Math.min(dRect.height - 30, ny));
    dragging.style.left = nx + 'px';
    dragging.style.top = ny + 'px';
});

document.addEventListener('mouseup', () => { dragging = null; });

// Click any window to focus
document.querySelectorAll('.window').forEach(win => {
    win.addEventListener('mousedown', () => focusWindow(win.id));
});

// ─── WORKSPACE SWITCHING ──────────────────────────────────────
function switchWorkspace(el) {
    document.querySelectorAll('.ws').forEach(w => w.classList.remove('active'));
    el.classList.add('active');
}

// ─── APP GRID ────────────────────────────────────────────────
function toggleAppGrid() {
    const overlay = document.getElementById('app-grid-overlay');
    overlay.classList.toggle('hidden');
    if (!overlay.classList.contains('hidden')) {
        document.getElementById('app-search').focus();
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const overlay = document.getElementById('app-grid-overlay');
        if (!overlay.classList.contains('hidden')) {
            overlay.classList.add('hidden');
        }
    }
});

// ─── CLOCK ───────────────────────────────────────────────────
function updateClock() {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 || 12;
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');

    const clockEl = document.getElementById('clock-time');
    const dateEl = document.getElementById('clock-date');
    const topTimeEl = document.getElementById('topbar-time');

    if (clockEl) clockEl.textContent = `${String(hh).padStart(2,'0')}:${mm}:${ss}`;
    if (dateEl) {
        const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        dateEl.textContent = `${days[now.getDay()]} | ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    }
    if (topTimeEl) topTimeEl.textContent = `${hh}:${mm} ${ampm}`;
}
setInterval(updateClock, 1000);

// ─── SYSTEM MONITOR ──────────────────────────────────────────
let sysData = { cpu: 23, ram: 41, disk: 57 };

function updateSysmon() {
    sysData.cpu = Math.max(5, Math.min(95, sysData.cpu + (Math.random() - 0.5) * 8));
    sysData.ram = Math.max(30, Math.min(80, sysData.ram + (Math.random() - 0.5) * 3));
    sysData.disk = Math.max(50, Math.min(70, sysData.disk + (Math.random() - 0.5) * 1));

    const cpu = Math.round(sysData.cpu);
    const ram = Math.round(sysData.ram);
    const disk = Math.round(sysData.disk);

    const cpuBar = document.getElementById('cpu-bar');
    const cpuVal = document.getElementById('cpu-val');
    const ramBar = document.getElementById('ram-bar');
    const ramVal = document.getElementById('ram-val');
    const diskBar = document.getElementById('disk-bar');
    const diskVal = document.getElementById('disk-val');
    const netDown = document.getElementById('net-down');
    const netUp = document.getElementById('net-up');

    if (cpuBar) { cpuBar.style.width = cpu + '%'; cpuVal.textContent = cpu + '%'; }
    if (ramBar) { ramBar.style.width = ram + '%'; ramVal.textContent = ram + '%'; }
    if (diskBar) { diskBar.style.width = disk + '%'; diskVal.textContent = disk + '%'; }

    const down = (Math.random() * 3 + 0.5).toFixed(1);
    const up = (Math.random() * 4 + 0.5).toFixed(1);
    if (netDown) netDown.textContent = `↓ ${down} KB/s`;
    if (netUp) netUp.textContent = `↑ ${up} KB/s`;
}
setInterval(updateSysmon, 2000);

// ─── FILE MANAGER NAVIGATION ──────────────────────────────────
const FM_VIEWS = {
    home: {
        label: 'Home',
        items: [
            { type:'folder', name:'About_Me',     icon:'fa-user',           color:'#1a6bc4,#2196f3', action: ()=>openFolderItem('about')    },
            { type:'folder', name:'Projects',     icon:'fa-code',           color:'#2e7d32,#4caf50', action: ()=>openFolderItem('projects')  },
            { type:'folder', name:'Cyber_Lab',    icon:'fa-shield-halved',  color:'#7f0000,#c62828', action: ()=>openFolderItem('cyber')     },
            { type:'folder', name:'Web_Dev',      icon:'fa-globe',          color:'#0d47a1,#1976d2', action: ()=>openFolderItem('webdev')    },
            { type:'folder', name:'Radar_Lab',    icon:'fa-satellite-dish', color:'#1b5e20,#388e3c', action: ()=>openFolderItem('radar')     },
            { type:'folder', name:'Certificates', icon:'fa-certificate',    color:'#4a148c,#7b1fa2', action: ()=>openFolderItem('certs')     },
            { type:'pdf',    name:'Resume.pdf',                             action: ()=>window.open('assets/resume.pdf', '_blank') },
            { type:'txt',    name:'Notes.txt',                              action: ()=>openWindow('notes')       }
        ]
    },
    documents: {
        label: 'Documents',
        items: [
            { type:'pdf', name:'Resume.pdf', action: ()=>window.open('assets/resume.pdf', '_blank') },
            { type:'txt', name:'Notes.txt',  action: ()=>openWindow('notes')       }
        ]
    },
    recent: {
        label: 'Recent',
        items: [
            { type:'txt',    name:'Notes.txt',  action: ()=>openWindow('notes')       },
            { type:'folder', name:'Projects',   icon:'fa-code',           color:'#2e7d32,#4caf50', action: ()=>openFolderItem('projects') },
            { type:'pdf',    name:'Resume.pdf', action: ()=>window.open('assets/resume.pdf', '_blank') },
            { type:'folder', name:'Radar_Lab',  icon:'fa-satellite-dish', color:'#1b5e20,#388e3c', action: ()=>openFolderItem('radar')   }
        ]
    },
    starred: {
        label: 'Starred',
        items: [
            { type:'folder', name:'Projects',  icon:'fa-code',           color:'#2e7d32,#4caf50', action: ()=>openFolderItem('projects') },
            { type:'folder', name:'Cyber_Lab', icon:'fa-shield-halved',  color:'#7f0000,#c62828', action: ()=>openFolderItem('cyber')   }
        ]
    },
    downloads: { label: 'Downloads',  items: [] },
    pictures:  { label: 'Pictures',   items: [] },
    videos:    { label: 'Videos',     items: [] },
    trash:     { label: 'Trash',      items: [] }
};

function renderFMGrid(viewKey) {
    const view  = FM_VIEWS[viewKey] || FM_VIEWS.home;
    const grid  = document.getElementById('fm-grid');
    const empty = document.getElementById('fm-empty');
    const pathBar = document.getElementById('fm-path-bar');

    if (pathBar) pathBar.textContent = `Home${viewKey === 'home' ? '' : ' › ' + view.label}`;

    if (!grid || !empty) return;

    if (view.items.length === 0) {
        grid.classList.add('hidden');
        empty.classList.remove('hidden');
        const msgEl = document.getElementById('fm-empty-msg');
        if (msgEl) {
            const emptyMsgs = {
                downloads: 'Downloads folder is empty',
                pictures:  'No pictures available',
                videos:    'No videos available',
                trash:     'Trash is empty'
            };
            msgEl.textContent = emptyMsgs[viewKey] || 'This folder is empty';
        }
        return;
    }

    empty.classList.add('hidden');
    grid.classList.remove('hidden');
    grid.innerHTML = '';

    view.items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'fm-item';
        div.title = item.name;
        div.addEventListener('dblclick', item.action);

        if (item.type === 'folder') {
            div.innerHTML = `
                <div class="fm-folder-icon" style="background:linear-gradient(135deg,${item.color});">
                    <i class="fa-solid ${item.icon}"></i>
                </div>
                <span class="fm-name mono">${item.name}</span>`;
        } else if (item.type === 'pdf') {
            div.innerHTML = `
                <div class="fm-file-icon pdf-icon">
                    <span class="file-ext mono">PDF</span>
                    <i class="fa-solid fa-file-pdf"></i>
                </div>
                <span class="fm-name mono">${item.name}</span>`;
        } else {
            div.innerHTML = `
                <div class="fm-file-icon txt-icon">
                    <span class="file-ext mono">TXT</span>
                    <i class="fa-solid fa-file-lines"></i>
                </div>
                <span class="fm-name mono">${item.name}</span>`;
        }
        grid.appendChild(div);
    });
}

function fmNav(viewKey, sidebarEl) {
    // Update active sidebar
    document.querySelectorAll('.fm-sidebar-item').forEach(el => el.classList.remove('active'));
    if (sidebarEl) sidebarEl.classList.add('active');
    // Update title bar location text
    const titleEl = document.querySelector('#win-files .win-title');
    if (titleEl) {
        const view = FM_VIEWS[viewKey] || FM_VIEWS.home;
        titleEl.textContent = view.label;
    }
    renderFMGrid(viewKey);
}

function initFM() {
    renderFMGrid('home');
}

// ─── MATRIX BACKGROUND ───────────────────────────────────────

function initMatrix() {
    const canvas = document.getElementById('matrix-bg');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ';

    function resize() {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const fontSize = 10;
    let columns = Math.floor(canvas.width / fontSize);
    let drops = Array(columns).fill(1).map(() => Math.random() * -100);

    function draw() {
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ff41';
        ctx.font = `${fontSize}px JetBrains Mono, monospace`;
        columns = Math.floor(canvas.width / fontSize);
        while (drops.length < columns) drops.push(Math.random() * -100);

        for (let i = 0; i < drops.length; i++) {
            const ch = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(ch, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i] += 0.15;
        }
    }
    setInterval(draw, 80);
}

// ─── NEOFETCH ART ────────────────────────────────────────────
const HARI_ART = `██╗  ██╗ █████╗ ██████╗ ██╗
██║  ██║██╔══██╗██╔══██╗██║
███████║███████║██████╔╝██║
██╔══██║██╔══██║██╔══██╗██║
██║  ██║██║  ██║██║  ██║██║
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝

Full Stack Developer | Cybersecurity Enthusiast
Embedded Systems Explorer`;

// ─── TERMINAL ────────────────────────────────────────────────
const FS = {
    '~': {
        type: 'dir',
        contents: {
            'projects': {
                type: 'dir',
                contents: {
                    'vigil_sense.txt': { type: 'file', content: 'Vigil Sense — PyQt5 + TI IWR6843AOP mmWave Radar\nPeople tracking, fall detection, restricted zone breach alerts.\nTech: Python, PyQt5, UART, TLV Parsing' },
                    'nec_cbcs.txt': { type: 'file', content: 'NEC CBCS — Choice-Based Credit System Portal\nElective allocation and registration for National Engineering College.\nTech: React, Node.js, Express, MongoDB' },
                    'paperhub.txt': { type: 'file', content: 'PaperHub — n8n Automation Telegram Bot\nQuestion paper retrieval bot for NEC students.\nTech: n8n, Supabase, PostgreSQL, Hugging Face' },
                    'codeverse.txt': { type: 'file', content: 'CodeVerse — Coding Events Platform\nQuizzes, coding challenges, and leaderboard.\nTech: HTML/CSS/JS, Node.js, Express\nDemo: https://codeverse-ymd8.onrender.com/' },
                    'least_laxity_first.txt': { type: 'file', content: 'Least Laxity First — OS CPU Scheduling GUI\nVisual animated Gantt chart for scheduling simulation.\nTech: Python, Tkinter' },
                    'club_management.txt': { type: 'file', content: 'Club Management System — Academic Project\nFull-stack college club registry app.\nTech: Spring Boot, JWT, MySQL, HTML/JS' },
                    'image_encryption.txt': { type: 'file', content: 'Image Encryption & Decryption — Cryptography GUI\nTool to encrypt/decrypt images using a custom security key.\nTech: Python, Tkinter' },
                    'password_analyser.txt': { type: 'file', content: 'Password Complexity Analyser — Security Tool\nEvaluates password strength & entropy with recommendations.\nTech: Python, Tkinter' }
                }
            },
            'skills': {
                type: 'dir',
                contents: {
                    'languages.txt': { type: 'file', content: 'Languages: Java, Python, JavaScript, SQL\nTools: Git, Linux, Docker, Postman' },
                    'frameworks.txt': { type: 'file', content: 'Spring Boot, Node.js, Express.js, React.js\nMongoDB, MySQL, n8n' },
                    'cyber.txt': { type: 'file', content: 'CTF: HackTheBox, TryHackMe\nSkills: OSINT, Pen Testing, Network Security\nWeb Exploitation, Forensics, Rev Engineering' },
                    'embedded.txt': { type: 'file', content: 'Hardware: TI IWR6843AOP mmWave Radar\nProtocol: UART, Serial Comm\nParsing: TLV Frame Analysis' }
                }
            },
            'about.txt': { type: 'file', content: 'Hari Muthu Ganesh R\n3rd-year CSE student, National Engineering College, Kovilpatti\nCGPA: 8.65/10.0\n\nFull Stack Dev | Embedded Systems Eng | Cyber Security Enthusiast | CTF Player\n\nhariganesh260@gmail.com\ngithub.com/HariMuthuGanesh' },
            'readme.txt': { type: 'file', content: 'HMGOS v2.0 — Portfolio Terminal\n\nType help for available commands.\nThis is a simulated terminal environment.\n\nWelcome to my engineering portfolio!' }
        }
    }
};

let curPath = ['~'];
let cmdHistory = [];
let histIdx = -1;

function getDir(pathArr) {
    let cur = FS;
    for (const p of pathArr) {
        if (cur[p] && cur[p].type === 'dir') cur = cur[p].contents;
        else return null;
    }
    return cur;
}

function pathStr() {
    return curPath.join('/');
}

function updatePrompt() {
    const p = document.getElementById('term-prompt');
    if (p) p.innerHTML = `<span class="tp-user">hari@portfolio</span>:<span class="tp-path">${pathStr()}</span>$ `;
}

function print(msg, cls = '') {
    const out = document.getElementById('term-output');
    if (!out) return;
    const line = document.createElement('p');
    if (cls) line.className = cls;
    line.innerHTML = msg.replace(/\n/g, '<br>');
    out.appendChild(line);
    const tb = document.getElementById('terminal-win-body');
    if (tb) tb.scrollTop = tb.scrollHeight;
}

function handleCmd(raw) {
    const parts = raw.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();

    // Log input
    print(`<span class="tp-user">hari@portfolio</span>:<span class="tp-path">${pathStr()}</span>$ ${raw}`);

    if (!cmd) return;
    cmdHistory.unshift(raw);
    histIdx = -1;

    switch (cmd) {
        case 'help':
            print(`<span style="color:var(--green);">Available commands:</span>
  ls           - list directory contents
  cd &lt;dir&gt;     - change directory
  cat &lt;file&gt;   - read a file
  pwd          - print working directory
  clear        - clear terminal
  whoami       - show current user
  uname -a     - system info
  neofetch     - display system info
  echo &lt;msg&gt;   - print a message
  open &lt;app&gt;   - open app (about/projects/cyber/radar/contact)
  skills       - show skills overview
  github       - open GitHub profile
  date         - show current date/time`);
            break;

        case 'ls': {
            const dir = getDir(curPath);
            if (!dir) { print('ls: cannot read directory', 'err'); break; }
            const items = Object.keys(dir).map(k =>
                dir[k].type === 'dir'
                    ? `<span style="color:var(--blue);">${k}/</span>`
                    : `<span style="color:var(--text-primary);">${k}</span>`
            );
            print(items.join('  ') || '(empty)');
            break;
        }

        case 'cd': {
            const target = parts[1];
            if (!target || target === '~') { curPath = ['~']; updatePrompt(); break; }
            if (target === '..') {
                if (curPath.length > 1) curPath.pop();
                updatePrompt();
                break;
            }
            const dir = getDir(curPath);
            if (dir && dir[target] && dir[target].type === 'dir') {
                curPath.push(target);
                updatePrompt();
            } else if (dir && dir[target] && dir[target].type === 'file') {
                print(`cd: ${target}: Not a directory`, 'err');
            } else {
                print(`cd: ${target}: No such file or directory`, 'err');
            }
            break;
        }

        case 'cat': {
            const target = parts[1];
            if (!target) { print('cat: missing file operand', 'err'); break; }
            const dir = getDir(curPath);
            if (dir && dir[target]) {
                if (dir[target].type === 'file') print(dir[target].content);
                else print(`cat: ${target}: Is a directory`, 'err');
            } else {
                print(`cat: ${target}: No such file or directory`, 'err');
            }
            break;
        }

        case 'pwd':
            print('/' + curPath.join('/'));
            break;

        case 'clear': {
            const out = document.getElementById('term-output');
            if (out) out.innerHTML = '';
            return;
        }

        case 'whoami':
            print('hari');
            break;

        case 'uname':
            print('Linux portfolio 6.6.0-custom #1 SMP PREEMPT_DYNAMIC HMGOS x86_64 GNU/Linux');
            break;

        case 'neofetch':
            print(`<span style="color:var(--green);">${HARI_ART.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>`, 'info');
            print(`<span style="color:var(--green);">hari@portfolio</span>
--------------------
<span style="color:var(--green);">OS:</span> HMGOS (Ubuntu Based)
<span style="color:var(--green);">Kernel:</span> 6.6.0-custom
<span style="color:var(--green);">Uptime:</span> 2 days, 14 hours
<span style="color:var(--green);">Shell:</span> bash 5.1.16
<span style="color:var(--green);">CPU:</span> Intel i5-11400H
<span style="color:var(--green);">Memory:</span> 4032MiB / 8192MiB`);
            break;

        case 'echo':
            print(parts.slice(1).join(' ') || '');
            break;

        case 'open': {
            const app = parts[1];
            if (!app) { print('open: specify an app (about/projects/cyber/radar/contact/notes)', 'err'); break; }
            if (windowMap[app]) {
                openWindow(app);
                print(`Opening ${app}...`, 'info');
            } else {
                print(`open: ${app}: Application not found`, 'err');
            }
            break;
        }

        case 'skills':
            print(`<span style="color:var(--green);">SKILLS OVERVIEW</span>
Languages : Java, Python, JavaScript, SQL
Frameworks: Spring Boot, Node.js, React.js, Express
Databases : MySQL, MongoDB
Security  : CTF, OSINT, Pen Testing, Network Security
Embedded  : TI mmWave Radar, UART, TLV Parsing
Tools     : Git, Linux, Docker, Postman`);
            break;

        case 'github':
            window.open('https://github.com/HariMuthuGanesh', '_blank');
            print('Opening GitHub profile...', 'info');
            break;

        case 'date':
            print(new Date().toString());
            break;

        case 'sudo':
            if (parts.slice(1).join(' ').includes('rm -rf')) {
                triggerKernelPanic();
            } else {
                print('hari is not in the sudoers file. This incident will be reported.', 'err');
            }
            break;

        case 'rm':
            if (parts.includes('-rf') && (parts.includes('/') || parts.includes('/*'))) {
                triggerKernelPanic();
            } else {
                print(`rm: cannot remove '${parts[1] || ''}': Permission denied`, 'err');
            }
            break;

        case 'exit':
        case 'logout':
            print('Logging out... Just kidding, you cannot leave! 😄', 'info');
            break;

        case 'matrix':
            print('The matrix has you...', 'info');
            document.getElementById('matrix-bg').style.opacity = '0.3';
            setTimeout(() => {
                document.getElementById('matrix-bg').style.opacity = '0.08';
            }, 3000);
            break;

        default:
            print(`${cmd}: command not found. Type 'help' for available commands.`, 'err');
    }
}

function triggerKernelPanic() {
    const overlay = document.createElement('div');
    overlay.id = 'crash-overlay';
    overlay.innerHTML = `
        <div class="crash-text">
            <h1 style="font-size:3rem;letter-spacing:5px;margin-bottom:15px;font-family:monospace;color:#fff;">KERNEL PANIC</h1>
            <p style="font-family:monospace;color:#ffbbbb;">Fatal error: system process corrupted</p>
            <p style="font-family:monospace;color:rgba(255,255,255,0.5);margin-top:10px;">Rebooting in 5 seconds...</p>
        </div>`;
    Object.assign(overlay.style, {
        position: 'fixed', inset: '0', background: '#8b0000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: '99999', flexDirection: 'column', textAlign: 'center',
        animation: 'none'
    });
    document.body.appendChild(overlay);
    document.body.classList.add('glitch-active');
    setTimeout(() => location.reload(), 5000);
}

// ─── TERMINAL INPUT ──────────────────────────────────────────
function initTerminal() {
    const input = document.getElementById('term-input');
    const nfArt = document.getElementById('nf-art');
    if (nfArt) nfArt.textContent = HARI_ART;
    if (!input) return;

    // Auto-run neofetch display on open
    print('<span style="color:var(--green);">hari@portfolio:~$ neofetch</span>');

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const val = input.value;
            input.value = '';
            handleCmd(val);
            histIdx = -1;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (histIdx < cmdHistory.length - 1) histIdx++;
            input.value = cmdHistory[histIdx] || '';
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (histIdx > 0) histIdx--;
            else { histIdx = -1; input.value = ''; return; }
            input.value = cmdHistory[histIdx] || '';
        }
    });

    // Focus input when clicking anywhere in terminal body
    const body = document.getElementById('terminal-win-body');
    if (body) body.addEventListener('click', () => input.focus());
}

// ─── MINI RADAR (Radar Lab window) ───────────────────────────
function initRadarMini() {
    const canvas = document.getElementById('radar-mini-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2, cy = canvas.height / 2, r = cx - 5;
    let angle = 0;

    const targets = [
        { a: 0.8, d: 0.5, label: 'Vigil Sense' },
        { a: 2.1, d: 0.7, label: 'PaperHub' },
        { a: 3.5, d: 0.35, label: 'NEC CBCS' },
        { a: 5.0, d: 0.6, label: 'CodeVerse' }
    ];

    function drawRadar() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#050f05';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Rings
        [0.25, 0.5, 0.75, 1].forEach(f => {
            ctx.beginPath();
            ctx.arc(cx, cy, r * f, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0,255,65,0.15)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        });

        // Cross hairs
        ctx.strokeStyle = 'rgba(0,255,65,0.1)';
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();

        // Sweep gradient — simple linear sweep
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        const sweepGrad = ctx.createLinearGradient(0, 0, r, 0);
        sweepGrad.addColorStop(0, 'rgba(0,255,65,0.5)');
        sweepGrad.addColorStop(1, 'rgba(0,255,65,0)');
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r, -0.25, 0);
        ctx.fillStyle = sweepGrad;
        ctx.fill();
        ctx.restore();

        // Sweep line
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
        ctx.strokeStyle = 'rgba(0,255,65,0.9)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Targets
        targets.forEach(t => {
            const tx = cx + r * t.d * Math.cos(t.a);
            const ty = cy + r * t.d * Math.sin(t.a);
            const diff = Math.abs((angle - t.a + Math.PI * 4) % (Math.PI * 2));
            const alpha = diff < 0.3 ? 1 : Math.max(0, 1 - diff * 0.5);
            if (alpha > 0.05) {
                ctx.beginPath();
                ctx.arc(tx, ty, 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0,255,65,${alpha})`;
                ctx.fill();
                if (alpha > 0.3) {
                    ctx.shadowColor = 'rgba(0,255,65,0.8)';
                    ctx.shadowBlur = 6;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }
        });

        angle += 0.03;
        if (angle > Math.PI * 2) angle -= Math.PI * 2;
        requestAnimationFrame(drawRadar);
    }
    drawRadar();
}

// ─── MAIN RADAR CANVAS (if still in index) ───────────────────
// (Removed — radar is now in the Radar Lab window)

// ─── DOCK ACTIVE STATE ───────────────────────────────────────
function updateDockActive(winOpen) {
    // Simple: all terminal items keep active
}

// ─── INIT OS ─────────────────────────────────────────────────
function initOS() {
    // Matrix background
    initMatrix();

    // Clock
    updateClock();

    // System monitor
    updateSysmon();

    // Terminal
    initTerminal();
    updatePrompt();

    // File Manager
    initFM();

    // Assign initial z-indices
    let z = 1;
    document.querySelectorAll('.window').forEach(w => {
        w.style.zIndex = z++;
        w.addEventListener('mousedown', () => focusWindow(w.id));
    });

    // Focus terminal by default
    focusWindow('win-terminal');
    focusWindow('win-notes');
    focusWindow('win-files');
    focusWindow('win-terminal'); // Terminal on top

    // Auto-focus terminal input
    setTimeout(() => {
        const inp = document.getElementById('term-input');
        if (inp) inp.focus();
    }, 300);

    // Animate sysmon bars in
    setTimeout(updateSysmon, 500);
}

// ─── START ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', runBoot);

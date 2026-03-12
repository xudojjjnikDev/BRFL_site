// ===================== CONFIGURATION =====================
const CONFIG = {
SUPABASE_URL: ‘https://rqjgqsdofvvigqsoiglx.supabase.co’,
SUPABASE_KEY: ‘eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxamdxc2RvZnZ2aWdxc29pZ2x4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzI4NDMsImV4cCI6MjA4ODc0ODg0M30.qfIIBtDooO5zzFBHqYZ7Y-9qK_ldO2a3XspfjY1VP7o’,
ADMIN_PASSWORD: null, // хранится в Supabase
ADMIN_USERNAME: null,
CROP_SIZE: 220
};

// ===================== SUPABASE CLIENT =====================
const SB_HEADERS = {
‘Content-Type’: ‘application/json’,
‘apikey’: CONFIG.SUPABASE_KEY,
‘Authorization’: ’Bearer ’ + CONFIG.SUPABASE_KEY,
‘X-Client-Info’: ‘supabase-js-web/2.0.0’,
‘Accept’: ‘application/json’,
‘Cache-Control’: ‘no-cache’
};

async function sbGet(table, params = ‘’) {
try {
const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${table}?${params}`, {
headers: SB_HEADERS,
credentials: ‘omit’,
mode: ‘cors’
});
if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
return response.json();
} catch (error) {
console.error(‘Supabase GET error:’, error);
throw error;
}
}

async function sbPost(table, body) {
try {
const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${table}`, {
method: ‘POST’,
headers: { …SB_HEADERS, ‘Prefer’: ‘return=representation’ },
body: JSON.stringify(body),
credentials: ‘omit’,
mode: ‘cors’
});
if (!response.ok) {
const errorText = await response.text();
console.error(‘Supabase POST error response:’, errorText);
throw new Error(`HTTP ${response.status}: ${errorText}`);
}
return response.json();
} catch (error) {
console.error(‘Supabase POST error:’, error);
throw error;
}
}

async function sbPatch(table, match, body) {
const q = Object.entries(match).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join(’&’);
const r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${table}?${q}`, {
method: ‘PATCH’,
headers: { …SB_HEADERS, ‘Prefer’: ‘return=representation’ },
body: JSON.stringify(body)
});
if (!r.ok) throw new Error(await r.text());
return r.json();
}

async function sbDelete(table, match) {
const q = Object.entries(match).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join(’&’);
const r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${table}?${q}`, {
method: ‘DELETE’,
headers: SB_HEADERS
});
if (!r.ok) throw new Error(await r.text());
}

async function sbUpsert(table, body) {
const r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${table}`, {
method: ‘POST’,
headers: { …SB_HEADERS, ‘Prefer’: ‘resolution=merge-duplicates,return=representation’ },
body: JSON.stringify(body)
});
if (!r.ok) throw new Error(await r.text());
return r.json();
}

async function sbSetting(key) {
const rows = await sbGet(‘settings’, `key=eq.${key}&select=value`);
return rows.length ? rows[0].value : null;
}

async function sbSetSetting(key, value) {
await sbUpsert(‘settings’, { key, value: typeof value === ‘string’ ? value : JSON.stringify(value) });
}

// ===================== UTILITIES =====================
function formatDate(str) {
if (!str) return ‘’;
const d = new Date(str);
return d.toLocaleDateString(‘ru-RU’, { day: ‘2-digit’, month: ‘long’, weekday: ‘short’ });
}

function plural(n, one, few, many) {
const mod10 = n % 10;
const mod100 = n % 100;
if (mod10 === 1 && mod100 !== 11) return one;
if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
return many;
}

function matchWord(n)  { return plural(n, ‘матч’,   ‘матча’,   ‘матчей’); }
function teamWord(n)   { return plural(n, ‘команда’, ‘команды’, ‘команд’); }
function playerWord(n) { return plural(n, ‘игрок’,   ‘игрока’,  ‘игроков’); }
function goalWord(n)   { return plural(n, ‘гол’,     ‘гола’,    ‘голов’); }

function fileToBase64(file) {
return new Promise((resolve, reject) => {
const reader = new FileReader();
reader.onload = () => resolve(reader.result);
reader.onerror = reject;
reader.readAsDataURL(file);
});
}

function isAdminRoute() {
return window.location.pathname === ‘/admin’ || window.location.pathname === ‘/admin/’;
}

function showLoader(msg = ‘Загрузка…’) {
if (!isAdminRoute()) return; // показываем только в админке
let el = document.getElementById(‘sb-loader’);
if (!el) {
el = document.createElement(‘div’);
el.id = ‘sb-loader’;
el.style.cssText = ‘position:fixed;top:0;left:0;right:0;z-index:9999;background:var(–green);color:#000;font-family:“Barlow Condensed”,sans-serif;font-weight:700;font-size:0.85rem;padding:6px 1rem;text-align:center;letter-spacing:0.05em;transition:opacity 0.3s’;
document.body.appendChild(el);
}
el.textContent = msg;
el.style.opacity = ‘1’;
}

function hideLoader() {
const el = document.getElementById(‘sb-loader’);
if (el) {
el.style.opacity = ‘0’;
setTimeout(() => el.remove(), 300);
}
}

function showError(msg) {
const el = document.createElement(‘div’);
el.style.cssText = ‘position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);background:#ff4d4d;color:#fff;padding:0.75rem 1.25rem;border-radius:8px;font-size:0.85rem;z-index:9999;max-width:90vw;text-align:center’;
el.textContent = msg;
document.body.appendChild(el);
setTimeout(() => el.remove(), 5000);
}

function showSuccess(msg) {
const el = document.createElement(‘div’);
el.style.cssText = ‘position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);background:var(–green);color:#000;padding:0.75rem 1.25rem;border-radius:8px;font-size:0.85rem;font-weight:600;z-index:9999;max-width:90vw;text-align:center’;
el.textContent = msg;
document.body.appendChild(el);
setTimeout(() => el.remove(), 3000);
}

// ===================== STATE =====================
let teams = [];
let upcoming = [];
let results = [];
let standings = [];
let heroStats = { teams: 0, matches: 0, players: 0, goals: 0 };
let leagueLogo = null;
let actionLog = [];
let actionHistory = [];

// Crop state
let _cropTarget = null;
let _cropScale = 1;
let _cropMinScale = 1;
let _cropImgOffset = { x: 0, y: 0 };
let _cropDrag = false;
let _cropDragStart = { x: 0, y: 0 };
let _cropOffsetStart = { x: 0, y: 0 };

// ===================== DATA LOADING =====================
async function loadAllData() {
showLoader(‘⏳ Загрузка…’);
try {
const [teamsRaw, playersRaw, upRaw, resRaw, stRaw, heroRaw, logoRaw, logRaw] = await Promise.all([
sbGet(‘teams’, ‘order=id.asc’),
sbGet(‘players’, ‘order=id.asc’),
sbGet(‘upcoming’, ‘order=date.asc’),
sbGet(‘results’, ‘order=date.desc’),
sbGet(‘standings’, ‘order=pts.desc’),
sbSetting(‘hero_stats’),
sbSetting(‘league_logo’),
sbSetting(‘action_log’),
]);

```
    teams = teamsRaw.map(t => ({
        ...t,
        players: playersRaw.filter(p => p.team_id === t.id).map(p => ({
            id: p.id,
            name: p.name,
            pos: p.pos || 'Нападающий',
            matches: p.matches || 0,
            goals: p.goals || 0,
            assists: p.assists || 0,
            yellow: p.yellow || 0,
            red: p.red || 0,
            photo: p.photo || '',
            recentMatches: []
        }))
    }));

    upcoming = upRaw.map(u => ({
        id: u.id,
        team1: u.team1,
        team2: u.team2,
        date: u.date,
        time: u.time,
        venue: u.venue,
        kind: u.kind || 'official',
        lineup1: u.lineup1 || [],
        lineup2: u.lineup2 || []
    }));

    results = resRaw.map(r => ({
        id: r.id,
        team1: r.team1,
        team2: r.team2,
        date: r.date,
        g1: r.g1 || 0,
        g2: r.g2 || 0,
        kind: r.kind || 'official',
        events: Array.isArray(r.events) ? r.events : (r.events ? JSON.parse(r.events) : [])
    }));

    standings = stRaw.map(s => ({
        id: s.id,
        team: s.team,
        p: s.p || 0,
        w: s.w || 0,
        d: s.d || 0,
        l: s.l || 0,
        pts: s.pts || 0
    }));

    heroStats = heroRaw ? JSON.parse(heroRaw) : { teams: 0, matches: 0, players: 0, goals: 0 };
    leagueLogo = logoRaw;
    actionLog = logRaw ? JSON.parse(logRaw) : [];
    actionHistory = [];

    hideLoader();
} catch (e) {
    hideLoader();
    console.error('Supabase load error:', e);
    showError('Ошибка загрузки данных: ' + e.message);
}
```

}

// ===================== RENDERING =====================
function renderSchedule() {
const grid = document.getElementById(‘schedule-grid’);
if (!grid) return;

```
grid.innerHTML = upcoming.map(m => {
    const isFriendly = m.kind === 'friendly';
    const l1 = m.lineup1 || [];
    const l2 = m.lineup2 || [];
    const hasLineup = l1.length > 0 || l2.length > 0;

    const kindBadge = isFriendly
        ? '<span class="match-kind friendly">🤝 Товарищеский</span>'
        : '<span class="match-kind official">⚽ Официальный</span>';

    const lineupHtml = hasLineup ? `
        <div class="match-lineup-toggle">
            <button class="match-lineup-btn" data-lineup-toggle="${m.id}">
                👥 Заявки на матч <span class="lineup-count">${l1.length + l2.length} ${playerWord(l1.length + l2.length)}</span>
            </button>
            <div class="match-lineup-body" id="lineup-body-${m.id}">
                <div class="match-lineup">
                    <div class="lineup-team">
                        <div class="lineup-title">${m.team1} <span class="lineup-num">${l1.length}</span></div>
                        ${l1.length ? l1.map(n => `<div class="lineup-player">• ${n}</div>`).join('') : '<div class="lineup-empty">Нет игроков</div>'}
                    </div>
                    <div class="lineup-team">
                        <div class="lineup-title">${m.team2} <span class="lineup-num">${l2.length}</span></div>
                        ${l2.length ? l2.map(n => `<div class="lineup-player">• ${n}</div>`).join('') : '<div class="lineup-empty">Нет игроков</div>'}
                    </div>
                </div>
            </div>
        </div>` : '';

    return `
        <div class="match-card">
            <div class="match-date-row">
                <span class="match-date">${formatDate(m.date)}</span>
                ${kindBadge}
            </div>
            <div class="match-venue-row">
                <span class="match-venue">📍 ${m.venue}</span>
            </div>
            <div class="match-teams">
                <div class="match-team">${m.team1}</div>
                <div class="match-vs">VS</div>
                <div class="match-team away">${m.team2}</div>
            </div>
            <div class="match-time">🕐 Начало в ${m.time}</div>
            ${lineupHtml}
        </div>
    `;
}).join('') || '<div class="no-data">Предстоящих матчей нет</div>';
```

}

function renderTeams() {
const grid = document.getElementById(‘teams-grid’);
if (!grid) return;

```
const colors = ['#1a3a2b', '#2b1a1a', '#1a2b1a', '#2b2a1a', '#1a1a2b', '#2b2a1a', '#1a2a2b', '#2b1a2a', '#1a2b1a', '#1a1a2b'];

grid.innerHTML = teams.map((t, i) => {
    const emblemContent = t.logo
        ? `<img src="${t.logo}" alt="${t.name}">`
        : (t.emoji || '⚽');

    return `
        <div class="team-card" data-team-id="${t.id}">
            <div class="team-emblem" style="background:${colors[i % colors.length]}">${emblemContent}</div>
            <div class="team-name">${t.name}</div>
            <div class="team-info">${t.players.length} ${playerWord(t.players.length)}</div>
            <div class="team-arrow">Состав →</div>
        </div>
    `;
}).join('');
```

}

function renderStandings() {
const tbody = document.getElementById(‘standings-body’);
if (!tbody) return;

```
const sorted = [...standings]
    .filter(s => s.team && s.team.trim())
    .sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || b.w - a.w);

tbody.innerHTML = sorted.map((s, i) => {
    const pos = i < 3
        ? `<span class="pos-badge pos-${i + 1}">${i + 1}</span>`
        : `<span class="pos-number">${i + 1}</span>`;

    const gf = s.gf || 0;
    const ga = s.ga || 0;
    return `
        <tr>
            <td>${pos}</td>
            <td class="team-col"><strong>${s.team}</strong></td>
            <td>${s.p}</td>
            <td>${s.w}</td>
            <td>${s.d}</td>
            <td>${s.l}</td>
            <td>${gf}:${ga}</td>
            <td class="pts-col">${s.pts}</td>
        </tr>
    `;
}).join('') || '<tr><td colspan="8" class="no-data">Нет данных</td></tr>';
```

}

function renderResults() {
const container = document.getElementById(‘results-list’);
if (!container) return;

```
// Group results by team pair
const groups = {};
results.forEach(r => {
    const key = [r.team1, r.team2].sort().join('|||');
    if (!groups[key]) {
        groups[key] = { team1: r.team1, team2: r.team2, matches: [] };
    }
    groups[key].matches.push(r);
});

const sortedGroups = Object.values(groups).sort((a, b) => {
    const la = a.matches[0]?.date || '';
    const lb = b.matches[0]?.date || '';
    return lb.localeCompare(la);
});

container.innerHTML = sortedGroups.map(g => {
    const header = `
        <div class="results-group-header">
            <span>${g.team1}</span>
            <span class="vs-dot">·</span>
            <span>${g.team2}</span>
            <span class="matches-count">${g.matches.length} ${matchWord(g.matches.length)}</span>
        </div>
    `;

    const rows = g.matches.map(r => {
        const dateStr = r.date
            ? new Date(r.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
            : '';
        const kindBadge = r.kind === 'friendly'
            ? '<span class="result-kind">🤝 Товарищ.</span>'
            : '';

        return `
            <div class="result-card" data-result-id="${r.id}">
                <div class="result-date-col">${dateStr}</div>
                <div class="result-teams-col">
                    ${kindBadge}
                    <span class="result-team-name">${r.team1}</span>
                    <span class="result-vs">vs</span>
                    <span class="result-team-name">${r.team2}</span>
                </div>
                <div class="result-score">${r.g1}:${r.g2}</div>
                <div class="result-details-btn">Протокол</div>
            </div>
        `;
    }).join('');

    return `<div class="results-group">${header}${rows}</div>`;
}).join('') || '<div class="no-data">Нет результатов</div>';
```

}

function renderScorers() {
// Build live stats from results
const pMap = {};

```
teams.forEach(t => {
    t.players.forEach(p => {
        pMap[`${p.name}||${t.name}`] = {
            ...p,
            teamName: t.name,
            teamId: t.id,
            liveGoals: 0,
            liveAssists: 0
        };
    });
});

results.forEach(r => {
    if (r.kind === 'friendly') return;
    (r.events || []).forEach(e => {
        const key = `${e.playerName}||${e.teamName}`;
        if (pMap[key] && e.type === 'goal') {
            pMap[key].liveGoals++;
            if (e.assistName) {
                const aKey = `${e.assistName}||${e.teamName}`;
                if (pMap[aKey]) pMap[aKey].liveAssists++;
            }
        }
    });
});

const all = Object.values(pMap)
    .map(p => ({
        ...p,
        goals: results.length ? p.liveGoals : p.goals,
        assists: results.length ? p.liveAssists : (p.assists || 0)
    }))
    .filter(p => p.goals > 0)
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists);

const posEmoji = {
    Вратарь: '🧤',
    Защитник: '🛡️',
    Нападающий: '⚡',
    Полузащитник: '🎯',
    Президент: '👑',
    Тренер: '📋'
};

const container = document.getElementById('scorers-list');
if (!container) return;

container.innerHTML = all.slice(0, 10).map((p, i) => {
    const rankClass = i === 0 ? 'scorer-rank-1' : i === 1 ? 'scorer-rank-2' : i === 2 ? 'scorer-rank-3' : '';

    return `
        <div class="scorer-row" data-team-id="${p.teamId}" data-player-id="${p.id}">
            <div class="scorer-rank ${rankClass}">${i + 1}</div>
            <div class="scorer-photo">
                ${p.photo ? `<img src="${p.photo}" alt="${p.name}">` : (posEmoji[p.pos] || '👤')}
            </div>
            <div class="scorer-info">
                <div class="scorer-name">${p.name}</div>
                <div class="scorer-team">${p.pos} · ${p.teamName}</div>
            </div>
            <div class="scorer-stats">
                <div class="scorer-stat">${p.goals}</div>
                <div class="scorer-stat-label">голов</div>
            </div>
            <div class="scorer-assists">
                <div class="scorer-assist-num">${p.assists || 0}</div>
                <div class="scorer-stat-label">пасов</div>
            </div>
        </div>
    `;
}).join('') || '<div class="no-data">Нет данных</div>';
```

}

function renderDiscipline() {
const pMap = {};

```
teams.forEach(t => {
    t.players.forEach(p => {
        pMap[`${p.name}||${t.name}`] = {
            ...p,
            teamName: t.name,
            teamId: t.id,
            liveYellow: 0,
            liveRed: 0
        };
    });
});

results.forEach(r => {
    if (r.kind === 'friendly') return;
    (r.events || []).forEach(e => {
        const key = `${e.playerName}||${e.teamName}`;
        if (pMap[key]) {
            if (e.type === 'yellow') pMap[key].liveYellow++;
            if (e.type === 'red') pMap[key].liveRed++;
        }
    });
});

const all = Object.values(pMap)
    .map(p => ({
        ...p,
        yellow: results.length ? p.liveYellow : p.yellow,
        red: results.length ? p.liveRed : p.red
    }))
    .filter(p => p.yellow > 0 || p.red > 0)
    .sort((a, b) => (b.red * 3 + b.yellow) - (a.red * 3 + a.yellow));

const posEmoji = {
    Вратарь: '🧤',
    Защитник: '🛡️',
    Нападающий: '⚡',
    Полузащитник: '🎯',
    Президент: '👑',
    Тренер: '📋'
};

const container = document.getElementById('discipline-list');
if (!container) return;

container.innerHTML = all.slice(0, 10).map((p, i) => {
    const cards = [];
    if (p.yellow > 0) cards.push(`<span class="yellow-card">${p.yellow}🟨</span>`);
    if (p.red > 0) cards.push(`<span class="red-card">${p.red}🟥</span>`);

    return `
        <div class="scorer-row" data-team-id="${p.teamId}" data-player-id="${p.id}">
            <div class="scorer-rank">${i + 1}</div>
            <div class="scorer-photo">
                ${p.photo ? `<img src="${p.photo}" alt="${p.name}">` : (posEmoji[p.pos] || '👤')}
            </div>
            <div class="scorer-info">
                <div class="scorer-name">${p.name}</div>
                <div class="scorer-team">${p.pos} · ${p.teamName}</div>
            </div>
            <div class="discipline-cards">${cards.join(' ')}</div>
        </div>
    `;
}).join('') || '<div class="no-data">Нет нарушений</div>';
```

}

function renderHeroStats() {
const officialResults = results.filter(r => r.kind !== ‘friendly’);
const totalGoals = officialResults.reduce((s, r) => s + (r.g1 || 0) + (r.g2 || 0), 0);
const totalMatches = officialResults.length;
const totalPlayers = teams.reduce((s, t) => s + t.players.length, 0);
const totalTeams = teams.length;

```
document.getElementById('hstat-teams').textContent = totalTeams || heroStats.teams;
document.getElementById('hstat-matches').textContent = totalMatches || heroStats.matches;
document.getElementById('hstat-players').textContent = totalPlayers || heroStats.players;
document.getElementById('hstat-goals').textContent = totalGoals || heroStats.goals;
```

}

// ===================== PLAYER HISTORY =====================
function getPlayerMatchHistory(playerName, teamName) {
const history = [];

```
results.forEach(r => {
    const isParticipant = r.events && r.events.some(e =>
        (e.playerName === playerName && e.teamName === teamName) ||
        (e.type === 'sub' && e.subOutName === playerName && e.teamName === teamName)
    );

    if (!isParticipant) return;

    const opp = r.team1 === teamName ? r.team2 : r.team1;
    const score = `${r.g1}:${r.g2}`;
    const dateStr = r.date
        ? new Date(r.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
        : '';

    let goals = 0, assists = 0, yellow = 0, red = 0, subIn = null, subOut = null;
    const goalMins = [];

    (r.events || []).forEach(e => {
        if (e.playerName === playerName && e.teamName === teamName) {
            if (e.type === 'goal') {
                goals++;
                goalMins.push(e.min);
            }
            if (e.type === 'yellow') yellow++;
            if (e.type === 'red') red++;
            if (e.type === 'sub') subIn = e.min;
        }
        if (e.type === 'goal' && e.assistName === playerName && e.teamName === teamName) {
            assists++;
        }
        if (e.type === 'sub' && e.subOutName === playerName && e.teamName === teamName) {
            subOut = e.min;
        }
    });

    history.push({
        opp,
        score,
        dateStr,
        goals,
        goalMins,
        assists,
        yellow,
        red,
        subIn,
        subOut,
        date: r.date
    });
});

history.sort((a, b) => new Date(b.date) - new Date(a.date));
return history;
```

}

// ===================== MODALS =====================
function openModal(id) {
const modal = document.getElementById(id);
if (modal) {
modal.classList.add(‘open’);
document.body.style.overflow = ‘hidden’;
}
}

function closeModal(id) {
const modal = document.getElementById(id);
if (modal) {
modal.classList.remove(‘open’);
document.body.style.overflow = ‘’;
}
}

function openTeamModal(teamId, view = ‘main’) {
const team = teams.find(t => t.id === teamId);
if (!team) return;

```
document.getElementById('team-modal-title').textContent = (team.logo ? '' : (team.emoji || '⚽') + ' ') + team.name;

const posEmoji = {
    Вратарь: '🧤',
    Защитник: '🛡️',
    Нападающий: '⚡',
    Полузащитник: '🎯',
    Президент: '👑',
    Тренер: '📋'
};

const posColor = {
    Вратарь: '#4a90d9',
    Защитник: '#7b68ee',
    Полузащитник: '#50c878',
    Нападающий: '#ff7043'
};

const nonPlaying = ['Президент', 'Тренер'];
const mainPlayers = team.players.filter(p => !nonPlaying.includes(p.pos));
const allPlayers = team.players;
const players = view === 'main' ? mainPlayers : allPlayers;

const tabsHtml = `
    <div class="team-modal-tabs">
        <button class="team-tab ${view === 'main' ? 'active' : ''}" data-team-id="${team.id}" data-view="main">
            ⚽ Основной состав (${mainPlayers.length})
        </button>
        <button class="team-tab ${view === 'all' ? 'active' : ''}" data-team-id="${team.id}" data-view="all">
            👥 Вся команда (${allPlayers.length})
        </button>
    </div>
`;

document.getElementById('team-modal-sub').innerHTML = tabsHtml;

const playersGrid = document.getElementById('team-players-grid');
playersGrid.innerHTML = players.length
    ? players.map(p => `
        <div class="player-card" data-team-id="${team.id}" data-player-id="${p.id}">
            <div class="player-avatar">
                ${p.photo ? `<img src="${p.photo}" alt="${p.name}">` : (posEmoji[p.pos] || '👤')}
            </div>
            <div class="player-name-card">${p.name}</div>
            <div class="player-pos-card" style="color:${posColor[p.pos] || 'var(--grey)'}">${p.pos}</div>
        </div>
    `).join('')
    : '<div class="no-data">Нет игроков</div>';

openModal('team-modal');
```

}

function openPlayerModal(teamId, playerId) {
const team = teams.find(t => t.id === teamId);
const player = team?.players.find(p => p.id === playerId);
if (!player) return;

```
const posEmoji = {
    Вратарь: '🧤',
    Защитник: '🛡️',
    Нападающий: '⚡',
    Полузащитник: '🎯',
    Президент: '👑',
    Тренер: '📋'
};

document.getElementById('player-modal-title').textContent = player.name;

const matchHistory = getPlayerMatchHistory(player.name, team.name);

const liveGoals = matchHistory.reduce((s, m) => s + m.goals, 0);
const liveAssists = matchHistory.reduce((s, m) => s + m.assists, 0);
const liveYellow = matchHistory.reduce((s, m) => s + m.yellow, 0);
const liveRed = matchHistory.reduce((s, m) => s + m.red, 0);

const goals = matchHistory.length ? liveGoals : player.goals;
const assists = matchHistory.length ? liveAssists : (player.assists || 0);
const yellow = matchHistory.length ? liveYellow : player.yellow;
const red = matchHistory.length ? liveRed : player.red;

const avatarHtml = player.photo
    ? `<img src="${player.photo}" alt="${player.name}" class="player-detail-avatar-img">`
    : `<div class="player-detail-avatar-emoji">${posEmoji[player.pos] || '👤'}</div>`;

const matchHistoryHtml = matchHistory.length ? `
    <div class="recent-matches">
        <h4>История матчей</h4>
        ${matchHistory.map(m => {
            const badges = [];

            if (m.goals) {
                const goalMinsHtml = m.goalMins.map(mn => `<span class="goal-minute">${mn}'</span>`).join('');
                badges.push(`<span class="goal-badge">${m.goals > 1 ? m.goals + '×' : ''}⚽${goalMinsHtml}</span>`);
            }
            if (m.assists) {
                badges.push(`<span class="assist-badge">${m.assists > 1 ? m.assists + '×' : ''}🎯</span>`);
            }
            if (m.yellow) badges.push('<span class="yellow-badge">🟨</span>');
            if (m.red) badges.push('<span class="red-badge">🟥</span>');
            if (m.subIn) badges.push(`<span class="sub-in-badge">↑${m.subIn}'</span>`);
            if (m.subOut) badges.push(`<span class="sub-out-badge">↓${m.subOut}'</span>`);

            return `
                <div class="recent-match-row">
                    <span class="match-date">${m.dateStr}</span>
                    <span class="match-opponent">vs <strong>${m.opp}</strong> <span class="match-score">${m.score}</span></span>
                    <span class="match-badges">${badges.join('')}</span>
                </div>
            `;
        }).join('')}
    </div>
` : '';

const isNonPlaying = ['Президент', 'Тренер'].includes(player.pos);

const statsHtml = isNonPlaying ? `
    <div class="non-playing-badge">
        ${player.pos === 'Президент' ? '👑 Президент клуба' : '📋 Тренер команды'}
    </div>
` : `
    <div class="stat-boxes">
        <div class="stat-box">
            <div class="stat-box-num">${player.matches}</div>
            <div class="stat-box-label">Матчей</div>
        </div>
        <div class="stat-box">
            <div class="stat-box-num" style="color:var(--green)">${goals}</div>
            <div class="stat-box-label">Голов</div>
        </div>
        <div class="stat-box">
            <div class="stat-box-num" style="color:#60a5fa">${assists}</div>
            <div class="stat-box-label">Пасов</div>
        </div>
        <div class="stat-box">
            <div class="stat-box-num" style="color:#FFD700">${yellow}</div>
            <div class="stat-box-label">ЖК</div>
        </div>
        <div class="stat-box">
            <div class="stat-box-num" style="color:#ff4d4d">${red}</div>
            <div class="stat-box-label">КК</div>
        </div>
    </div>
`;

document.getElementById('player-modal-body').innerHTML = `
    <div class="player-detail-header">
        <div class="player-detail-avatar">${avatarHtml}</div>
        <div>
            <div class="player-detail-name">${player.name}</div>
            <div class="player-detail-pos">${player.pos} · ${team.name}</div>
        </div>
    </div>
    ${statsHtml}
    ${matchHistoryHtml}
`;

openModal('player-modal');
```

}

function openProtocolModal(resultId) {
const result = results.find(r => r.id === resultId);
if (!result) return;

```
const eventsHtml = (result.events || [])
    .sort((a, b) => a.min - b.min)
    .map(e => {
        let icon, text;

        if (e.type === 'goal') {
            icon = '⚽';
            text = `<strong>${e.playerName}</strong> (${e.teamName})`;
            if (e.assistName) {
                text += ` <span class="protocol-assist">пас: ${e.assistName}</span>`;
            }
        } else if (e.type === 'yellow') {
            icon = '🟨';
            text = `${e.playerName} (${e.teamName})`;
        } else if (e.type === 'red') {
            icon = '🟥';
            text = `${e.playerName} (${e.teamName})`;
        } else if (e.type === 'sub') {
            icon = '🔄';
            text = `↑ ${e.playerName} / ↓ ${e.subOutName} (${e.teamName})`;
        } else {
            icon = '•';
            text = e.playerName || '';
        }

        return `
            <div class="timeline-event">
                <span class="timeline-min">${e.min}'</span>
                <span class="event-icon">${icon}</span>
                <span class="event-text">${text}</span>
            </div>
        `;
    }).join('');

const dateStr = result.date
    ? new Date(result.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })
    : '';

document.getElementById('protocol-modal-body').innerHTML = `
    <div class="protocol-header">
        <div class="protocol-score">${result.g1} : ${result.g2}</div>
        <div class="protocol-teams">
            <span>${result.team1}</span>
            <span>${result.team2}</span>
        </div>
        ${dateStr ? `<div class="protocol-date">${dateStr}</div>` : ''}
    </div>
    ${eventsHtml ? `<div class="timeline"><h4>Хронология событий</h4>${eventsHtml}</div>` : '<p class="no-data">Событий не добавлено</p>'}
`;

openModal('protocol-modal');
```

}

// ===================== NAVIGATION =====================
function showAdmin() {
if (!isAdminRoute()) {
history.pushState({}, ‘’, ‘/admin’);
}
document.getElementById(‘main-site’).style.display = ‘none’;
document.getElementById(‘admin-section’).style.display = ‘block’;
document.getElementById(‘main-header’).style.display = ‘flex’;

```
const loggedIn = sessionStorage.getItem('bfl_admin');
if (loggedIn) {
    showAdminPanel();
}
```

}

function showMain() {
if (isAdminRoute()) {
history.pushState({}, ‘’, ‘/’);
}
document.getElementById(‘admin-section’).style.display = ‘none’;
document.getElementById(‘main-site’).style.display = ‘block’;
}

// ===================== ADMIN =====================
async function adminLogin(username, password) {
try {
const rows = await sbGet(‘settings?key=eq.admin_credentials&select=value’);
if (!rows || !rows.length) {
// Если записи нет — используем дефолтные (только для первого входа)
if (username === ‘admin’ && password === ‘brfl2026’) {
sessionStorage.setItem(‘bfl_admin’, ‘1’);
document.getElementById(‘login-error’).style.display = ‘none’;
showAdminPanel();
return true;
}
} else {
const creds = JSON.parse(rows[0].value);
if (username === creds.username && password === creds.password) {
sessionStorage.setItem(‘bfl_admin’, ‘1’);
document.getElementById(‘login-error’).style.display = ‘none’;
showAdminPanel();
return true;
}
}
} catch(e) {
console.error(‘Login check failed:’, e);
}
document.getElementById(‘login-error’).style.display = ‘block’;
return false;
}

function adminLogout() {
sessionStorage.removeItem(‘bfl_admin’);
document.getElementById(‘admin-panel’).style.display = ‘none’;
document.getElementById(‘admin-login’).style.display = ‘block’;
}

function showAdminPanel() {
document.getElementById(‘admin-login’).style.display = ‘none’;
document.getElementById(‘admin-panel’).style.display = ‘block’;
populateAdminSelects();
renderAdminUpcoming();
renderAdminResults();
renderAdminStandingsEdit();
populatePlayerTeamSelect();
}

function showAdminTab(tabId) {
document.querySelectorAll(’.admin-content’).forEach(c => c.classList.remove(‘active’));
document.querySelectorAll(’.admin-tab’).forEach(t => t.classList.remove(‘active’));

```
const tab = document.getElementById(tabId);
if (tab) tab.classList.add('active');

const activeTabBtn = Array.from(document.querySelectorAll('.admin-tab')).find(
    btn => btn.dataset.tab === tabId
);
if (activeTabBtn) activeTabBtn.classList.add('active');

if (tabId === 'tab-teams') renderAdminTeamsList();
if (tabId === 'tab-settings') initSettingsTab();
if (tabId === 'tab-log') renderActionLog();
```

}

function populateTeamSelects() {
const options = teams.map(t => `<option value="${t.name}">${t.name}</option>`).join(’’);

```
['a-t1', 'a-t2', 'r-t1', 'r-t2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = options;
});
```

}

function populateAdminSelects() {
populateTeamSelects();
}

function renderAdminUpcoming() {
const list = document.getElementById(‘admin-upcoming-list’);
if (!list) return;

```
const nonPlaying = ['Президент', 'Тренер'];

list.innerHTML = upcoming.map(m => {
    const badge = m.kind === 'friendly' ? '🤝 ' : '⚽ ';
    const l1 = m.lineup1 || [];
    const l2 = m.lineup2 || [];

    const team1obj = teams.find(t => t.name === m.team1);
    const team2obj = teams.find(t => t.name === m.team2);

    const players1 = (team1obj?.players || []).filter(p => !nonPlaying.includes(p.pos));
    const players2 = (team2obj?.players || []).filter(p => !nonPlaying.includes(p.pos));

    const renderCheckboxes = (players, selected, teamIdx, matchId) => {
        if (!players.length) return `<div class="lineup-no-players">Нет игроков</div>`;
        return players.map(p => {
            const checked = selected.includes(p.name) ? 'checked' : '';
            return `<label class="lineup-checkbox-label${checked ? ' selected' : ''}"><input type="checkbox" class="lineup-cb" data-match-id="${matchId}" data-team="${teamIdx}" value="${p.name}" ${checked}><span class="lineup-cb-name">${p.name}</span><span class="lineup-cb-pos">${p.pos}</span></label>`;
        }).join('');
    };

    const total = l1.length + l2.length;

    return `
        <li>
            <div class="upcoming-item">
                <span class="upcoming-info">
                    ${badge}${m.team1} vs ${m.team2} · ${m.date}
                    ${total ? `<span class="lineup-badge">${total} игр.</span>` : ''}
                </span>
                <div class="upcoming-actions">
                    <button class="btn-sm btn-sm-green lineup-toggle" data-match-id="${m.id}">📋 Заявка</button>
                    <button class="btn-sm delete-upcoming" data-match-id="${m.id}">✕</button>
                </div>
            </div>
            <div class="lineup-panel" id="lineup-panel-${m.id}">
                <div class="lineup-editor-header">
                    <span>Отметьте игроков в заявку</span>
                    <div class="lineup-counters">
                        <span class="lineup-counter" id="lc1-${m.id}">${m.team1}: <b>${l1.length}</b></span>
                        <span class="lineup-counter" id="lc2-${m.id}">${m.team2}: <b>${l2.length}</b></span>
                    </div>
                </div>
                <div class="lineup-grid">
                    <div class="lineup-col">
                        <div class="lineup-team-title">
                            ${m.team1}
                            <span class="lineup-col-actions">
                                <button class="btn-sm btn-sm-green lineup-select-all" data-match-id="${m.id}" data-team="1">Все</button>
                                <button class="btn-sm lineup-clear-all" data-match-id="${m.id}" data-team="1">Сброс</button>
                            </span>
                        </div>
                        <div class="lineup-checkboxes" id="lcb1-${m.id}">${renderCheckboxes(players1, l1, 1, m.id)}</div>
                    </div>
                    <div class="lineup-col">
                        <div class="lineup-team-title">
                            ${m.team2}
                            <span class="lineup-col-actions">
                                <button class="btn-sm btn-sm-green lineup-select-all" data-match-id="${m.id}" data-team="2">Все</button>
                                <button class="btn-sm lineup-clear-all" data-match-id="${m.id}" data-team="2">Сброс</button>
                            </span>
                        </div>
                        <div class="lineup-checkboxes" id="lcb2-${m.id}">${renderCheckboxes(players2, l2, 2, m.id)}</div>
                    </div>
                </div>
                <button class="btn-sm btn-sm-green save-lineup" data-match-id="${m.id}" style="margin-top:0.75rem;width:100%;padding:0.6rem;">💾 Сохранить заявку</button>
            </div>
        </li>
    `;
}).join('') || '<li class="no-data">Нет матчей</li>';
```

}

function renderAdminResults() {
const list = document.getElementById(‘admin-results-list’);
if (!list) return;

```
list.innerHTML = results.map(r => `
    <li>
        <span class="result-info" data-result-id="${r.id}">
            ${r.team1} ${r.g1}:${r.g2} ${r.team2}
            <span class="events-count">(${r.events?.length || 0} событий)</span>
        </span>
        <div class="result-actions">
            <button class="btn-sm btn-sm-green edit-protocol" data-result-id="${r.id}" title="Редактировать протокол">✏️</button>
            <button class="btn-sm delete-result" data-result-id="${r.id}">✕</button>
        </div>
    </li>
`).join('') || '<li class="no-data">Нет результатов</li>';
```

}

function renderAdminStandingsEdit() {
const tbody = document.getElementById(‘admin-standings-edit’);
if (!tbody) return;

```
tbody.innerHTML = standings.map((s, i) => `
    <tr data-standing-id="${s.id}">
        <td><input type="text" class="standing-team" value="${s.team}" placeholder="Команда"></td>
        <td><input type="number" class="standing-p" value="${s.p}" min="0"></td>
        <td><input type="number" class="standing-w" value="${s.w}" min="0"></td>
        <td><input type="number" class="standing-d" value="${s.d}" min="0"></td>
        <td><input type="number" class="standing-l" value="${s.l}" min="0"></td>
        <td><input type="number" class="standing-pts" value="${s.pts}" min="0"></td>
        <td><button class="btn-sm btn-sm-green save-standing" data-index="${i}">💾</button></td>
    </tr>
`).join('');
```

}

function populatePlayerTeamSelect() {
const select = document.getElementById(‘p-team’);
if (!select) return;

```
select.innerHTML = teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
renderAdminPlayersList();
```

}

function renderAdminPlayersList(forceTeamId) {
const teamId = forceTeamId !== undefined ? forceTeamId : parseInt(document.getElementById(‘p-team’)?.value);
const team = teams.find(t => t.id === teamId);

```
const list = document.getElementById('admin-players-list');
if (!list) return;

if (!team) {
    list.innerHTML = '<li class="no-data">Выберите команду</li>';
    return;
}

const countEl = document.getElementById('players-count');
if (countEl) countEl.textContent = `· ${team.players.length} ${playerWord(team.players.length)}`;

const posEmoji = {
    Вратарь: '🧤',
    Защитник: '🛡️',
    Нападающий: '⚡',
    Полузащитник: '🎯',
    Президент: '👑',
    Тренер: '📋'
};

list.innerHTML = team.players.map(p => `
    <li>
        <span class="player-info">
            <span class="player-avatar-mini">
                ${p.photo ? `<img src="${p.photo}" alt="${p.name}">` : (posEmoji[p.pos] || '👤')}
            </span>
            <span class="player-name-mini">
                ${p.name} <span class="player-pos-mini">${p.pos}</span>
            </span>
        </span>
        <span class="player-stats-mini">
            <span class="stat-goal">${p.goals}⚽</span>
            <span class="stat-yellow">${p.yellow}🟨</span>
            <span class="stat-red">${p.red}🟥</span>
        </span>
        <span class="player-actions">
            <button class="btn-sm btn-sm-green edit-player" data-team-id="${team.id}" data-player-id="${p.id}">✏️</button>
            <button class="btn-sm delete-player" data-team-id="${team.id}" data-player-id="${p.id}">✕</button>
        </span>
    </li>
`).join('') || '<li class="no-data">Нет игроков</li>';
```

}

function renderAdminTeamsList() {
const list = document.getElementById(‘admin-teams-list’);
if (!list) return;

```
list.innerHTML = teams.map(t => {
    const logoHtml = t.logo
        ? `<img src="${t.logo}" alt="${t.name}" class="team-logo-mini">`
        : `<span class="team-emoji-mini">${t.emoji || '⚽'}</span>`;

    return `
        <li>
            <span class="team-info-mini">
                ${logoHtml}
                <span class="team-name-mini">${t.name}</span>
            </span>
            <span class="team-actions">
                <button class="btn-sm btn-sm-green edit-team" data-team-id="${t.id}">✏️</button>
                <button class="btn-sm delete-team" data-team-id="${t.id}">✕</button>
            </span>
        </li>
    `;
}).join('') || '<li class="no-data">Нет команд</li>';
```

}

function renderActionLog() {
const container = document.getElementById(‘action-log-list’);
if (!container) return;

```
if (!actionLog.length) {
    container.innerHTML = '<p class="no-data">Журнал пуст</p>';
    return;
}

const icons = {
    add: '➕',
    edit: '✏️',
    delete: '🗑️',
    result: '⚽',
    match: '📅',
    team: '🏟️',
    settings: '⚙️',
    logo: '🖼️'
};

container.innerHTML = actionLog.map(e => {
    const icon = icons[e.type] || '•';
    let editBtn = '', delBtn = '';

    if (e.ref && e.type !== 'delete') {
        if (e.ref.entity === 'player' && e.ref.teamId && e.ref.id) {
            editBtn = `<button class="btn-sm btn-sm-green log-edit" data-ref='${JSON.stringify(e.ref)}'>✏️</button>`;
            delBtn = `<button class="btn-sm log-delete" data-log-id="${e.id}">🗑️</button>`;
        } else if (e.ref.entity === 'team' && e.ref.id) {
            editBtn = `<button class="btn-sm btn-sm-green log-edit" data-ref='${JSON.stringify(e.ref)}'>✏️</button>`;
            delBtn = `<button class="btn-sm log-delete" data-log-id="${e.id}">🗑️</button>`;
        } else if (e.ref.entity === 'match' && e.ref.id) {
            delBtn = `<button class="btn-sm log-delete" data-log-id="${e.id}">🗑️</button>`;
        } else if (e.ref.entity === 'result' && e.ref.id) {
            editBtn = `<button class="btn-sm btn-sm-green log-edit" data-ref='${JSON.stringify(e.ref)}'>✏️</button>`;
            delBtn = `<button class="btn-sm log-delete" data-log-id="${e.id}">🗑️</button>`;
        }
    }

    return `
        <div class="log-entry">
            <span class="log-icon">${icon}</span>
            <div class="log-content">
                <div class="log-description">${e.description}</div>
                <div class="log-time">${e.time}</div>
            </div>
            <div class="log-actions">
                ${editBtn}
                ${delBtn}
            </div>
        </div>
    `;
}).join('');
```

}

// ===================== ADMIN ACTIONS =====================
async function addMatch() {
// Получаем значения из формы
const t1 = document.getElementById(‘a-t1’).value;
const t2 = document.getElementById(‘a-t2’).value;
const date = document.getElementById(‘a-date’).value;
const time = document.getElementById(‘a-time’).value;
const venue = document.getElementById(‘a-venue’).value;
const kind = document.getElementById(‘a-kind’)?.value || ‘official’;

```
// Валидация
if (!date) {
    alert('Выберите дату матча');
    return;
}

if (t1 === t2) {
    alert('Команды должны быть разными');
    return;
}

if (!t1 || !t2) {
    alert('Выберите обе команды');
    return;
}

showLoader('Сохранение матча...');

try {
    // Генерируем уникальный ID
    const id = 'match_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Данные для отправки
    const matchData = {
        id: id,
        team1: t1,
        team2: t2,
        date: date,
        time: time,
        venue: venue,
        kind: kind,
        lineup1: [],
        lineup2: []
    };

    console.log('Отправляем данные:', matchData);

    // Отправляем в Supabase
    const result = await sbPost('upcoming', matchData);
    console.log('Ответ от Supabase:', result);

    // Добавляем в локальный массив
    upcoming.push(matchData);

    // Обновляем отображение
    renderSchedule();
    renderAdminUpcoming();

    // Логируем действие
    logAction('match', `Добавлен матч: ${t1} vs ${t2} (${date})${kind === 'friendly' ? ' [Товарищ.]' : ''}`, { 
        entity: 'match', 
        id: id 
    });

    // Очищаем форму
    document.getElementById('a-date').value = '';
    document.getElementById('a-time').value = '15:00';
    document.getElementById('a-venue').value = 'Бронницкий городской стадион';

    showSuccess('Матч успешно добавлен!');

} catch (error) {
    console.error('Ошибка при добавлении матча:', error);
    
    // Показываем понятное сообщение об ошибке
    let errorMessage = 'Ошибка при добавлении матча: ';
    
    if (error.message.includes('400')) {
        errorMessage += 'Проверьте правильность заполнения формы';
    } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage += 'Ошибка авторизации. Попробуйте перезайти в админку';
    } else if (error.message.includes('network')) {
        errorMessage += 'Проблема с сетью. Проверьте подключение';
    } else {
        errorMessage += error.message;
    }
    
    showError(errorMessage);
}

hideLoader();
```

}

async function deleteUpcoming(id) {
const match = upcoming.find(m => m.id === id);
if (!match) return;

```
if (!confirm(`Удалить матч ${match.team1} vs ${match.team2}?`)) return;

showLoader('Удаление...');

try {
    await sbDelete('upcoming', { id });
    upcoming = upcoming.filter(m => m.id !== id);

    renderSchedule();
    renderAdminUpcoming();
    logAction('delete', `Удалён матч: ${match.team1} vs ${match.team2}`);
    showSuccess('Удалено!');
} catch (e) {
    showError('Ошибка: ' + e.message);
}

hideLoader();
```

}

async function saveLineup(matchId) {
const match = upcoming.find(m => m.id === matchId);
if (!match) return;

```
const getChecked = (team) =>
    [...document.querySelectorAll(`.lineup-cb[data-match-id="${matchId}"][data-team="${team}"]:checked`)]
        .map(cb => cb.value);

const l1 = getChecked(1);
const l2 = getChecked(2);

match.lineup1 = l1;
match.lineup2 = l2;

showLoader('Сохранение...');
try {
    await sbPatch('upcoming', { id: matchId }, { lineup1: l1, lineup2: l2 });
    renderSchedule();
    renderAdminUpcoming();
    showSuccess(`Заявка сохранена: ${l1.length + l2.length} ${playerWord(l1.length + l2.length)}`);
} catch (e) {
    showError('Ошибка: ' + e.message);
}
hideLoader();
```

}

function toggleLineupPanel(matchId) {
const panel = document.getElementById(‘lineup-panel-’ + matchId);
const btn = document.querySelector(`.lineup-toggle[data-match-id="${matchId}"]`);
if (panel) {
panel.classList.toggle(‘open’);
if (btn) btn.classList.toggle(‘active’);
}
}

function updateLineupCounter(matchId, team) {
const count = document.querySelectorAll(`.lineup-cb[data-match-id="${matchId}"][data-team="${team}"]:checked`).length;
const match = upcoming.find(m => m.id === matchId);
const teamName = team == 1 ? match?.team1 : match?.team2;
const counter = document.getElementById(`lc${team}-${matchId}`);
if (counter) counter.innerHTML = `${teamName}: <b>${count}</b>`;
}

async function addResult() {
const t1 = document.getElementById(‘r-t1’).value;
const t2 = document.getElementById(‘r-t2’).value;
const date = document.getElementById(‘r-date’).value;
const g1 = parseInt(document.getElementById(‘r-g1’).value) || 0;
const g2 = parseInt(document.getElementById(‘r-g2’).value) || 0;

```
if (!date || t1 === t2) {
    alert('Заполните все поля и выберите разные команды');
    return;
}

showLoader('Сохранение...');

try {
    const kind = document.getElementById('r-kind')?.value || 'official';
    const id = 'r' + Date.now();

    await sbPost('results', { id, team1: t1, team2: t2, date, g1, g2, events: [], kind });
    results.unshift({ id, team1: t1, team2: t2, date, g1, g2, events: [], kind });

    renderResults();
    renderAdminResults();
    openProtocolEditor(id);
    logAction('result', `Добавлен результат: ${t1} ${g1}:${g2} ${t2} (${date})`, { entity: 'result', id });
    await autoSyncStats();
    showSuccess('Результат добавлен!');
} catch (e) {
    showError('Ошибка: ' + e.message);
}

hideLoader();
```

}

async function deleteResult(id) {
const result = results.find(r => r.id === id);
if (!result) return;

```
if (!confirm(`Удалить матч ${result.team1} ${result.g1}:${result.g2} ${result.team2}?`)) return;

showLoader('Удаление...');

try {
    await sbDelete('results', { id });
    results = results.filter(r => r.id !== id);

    renderResults();
    renderAdminResults();

    const editor = document.getElementById('protocol-editor');
    if (editor) editor.style.display = 'none';

    logAction('delete', `Удалён результат: ${result.team1} ${result.g1}:${result.g2} ${result.team2}`);
    await autoSyncStats();
    showSuccess('Удалено!');
} catch (e) {
    showError('Ошибка: ' + e.message);
}

hideLoader();
```

}

// ===================== PROTOCOL EDITOR =====================
function openProtocolEditor(resultId) {
const result = results.find(r => r.id === resultId);
if (!result) return;

```
document.getElementById('proto-result-id').value = resultId;
document.getElementById('proto-label').textContent = `${result.team1} ${result.g1}:${result.g2} ${result.team2}`;

const teamOpts = [result.team1, result.team2].map(t => `<option value="${t}">${t}</option>`).join('');
document.getElementById('ev-team').innerHTML = teamOpts;

onEvTeamChange();
onEvTypeChange();
renderProtoEventsList(result);

const editor = document.getElementById('protocol-editor');
if (editor) {
    editor.style.display = 'block';
    editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
```

}

function onEvTeamChange() {
const resultId = document.getElementById(‘proto-result-id’).value;
const result = results.find(r => r.id === resultId);
if (!result) return;

```
const teamName = document.getElementById('ev-team').value;
const team = teams.find(t => t.name === teamName);

const playerOpts = team
    ? ['<option value="">— выбрать —</option>', ...team.players.map(p => `<option value="${p.name}">${p.name}</option>`)].join('')
    : '<option>Нет игроков</option>';

document.getElementById('ev-player').innerHTML = playerOpts;
document.getElementById('ev-assist').innerHTML = '<option value="">— нет —</option>' + (team ? team.players.map(p => `<option value="${p.name}">${p.name}</option>`).join('') : '');
document.getElementById('ev-subout').innerHTML = playerOpts;
```

}

function onEvTypeChange() {
const type = document.getElementById(‘ev-type’).value;

```
document.getElementById('ev-assist-wrap').style.display = type === 'goal' ? 'block' : 'none';
document.getElementById('ev-subout-wrap').style.display = type === 'sub' ? 'block' : 'none';

const playerLabel = document.getElementById('ev-player-label');
if (playerLabel) {
    playerLabel.textContent = type === 'sub' ? 'Выходит на поле' : 'Игрок';
}
```

}

async function addProtocolEvent() {
const resultId = document.getElementById(‘proto-result-id’).value;
const result = results.find(r => r.id === resultId);
if (!result) return;

```
const type = document.getElementById('ev-type').value;
const min = parseInt(document.getElementById('ev-min').value) || 1;
const teamName = document.getElementById('ev-team').value;
const playerName = document.getElementById('ev-player').value;

if (!playerName) {
    alert('Выберите игрока');
    return;
}

const event = { min, type, playerName, teamName };

if (type === 'goal') {
    const assist = document.getElementById('ev-assist').value;
    if (assist && assist !== playerName) {
        event.assistName = assist;
    }
}

if (type === 'sub') {
    event.subOutName = document.getElementById('ev-subout').value;
}

if (!result.events) result.events = [];
result.events.push(event);
result.events.sort((a, b) => a.min - b.min);

try {
    await sbPatch('results', { id: result.id }, { events: result.events, g1: result.g1, g2: result.g2 });
} catch (e) {
    showError('Ошибка сохранения: ' + e.message);
}

renderProtoEventsList(result);
renderResults();
await autoSyncStats();
```

}

async function deleteProtocolEvent(resultId, index) {
const result = results.find(r => r.id === resultId);
if (!result) return;

```
result.events.splice(index, 1);

try {
    await sbPatch('results', { id: result.id }, { events: result.events });
} catch (e) {
    showError('Ошибка: ' + e.message);
}

renderProtoEventsList(result);
renderResults();
await autoSyncStats();
```

}

function renderProtoEventsList(result) {
const container = document.getElementById(‘proto-events-list’);
if (!container) return;

```
if (!result.events || !result.events.length) {
    container.innerHTML = '<p class="no-data">Событий пока нет</p>';
    return;
}

container.innerHTML = result.events.map((e, i) => {
    const icon = e.type === 'goal' ? '⚽' : e.type === 'yellow' ? '🟨' : e.type === 'red' ? '🟥' : '🔄';

    let desc = `${e.playerName} (${e.teamName})`;
    if (e.type === 'goal' && e.assistName) desc += ` · пас: ${e.assistName}`;
    if (e.type === 'sub' && e.subOutName) desc += ` ↔ ${e.subOutName}`;

    return `
        <div class="protocol-event">
            <span class="event-minute">${e.min}'</span>
            <span class="event-icon">${icon}</span>
            <span class="event-description">${desc}</span>
            <button class="btn-sm delete-event" data-result-id="${result.id}" data-event-index="${i}">✕</button>
        </div>
    `;
}).join('');
```

}

// ===================== ADMIN PLAYERS =====================
async function addPlayer() {
const teamId = parseInt(document.getElementById(‘p-team’).value);
const name = document.getElementById(‘p-name’).value.trim();
const pos = document.getElementById(‘p-pos’).value;
const matches = parseInt(document.getElementById(‘p-matches’).value) || 0;
const goals = parseInt(document.getElementById(‘p-goals’).value) || 0;
const yellow = parseInt(document.getElementById(‘p-yellow’).value) || 0;
const red = parseInt(document.getElementById(‘p-red’).value) || 0;

```
if (!name) {
    alert('Введите имя игрока');
    return;
}

const team = teams.find(t => t.id === teamId);
if (!team) return;

showLoader('Добавление игрока...');

try {
    let photo = document.getElementById('p-photo-url').value.trim();
    const fileEl = document.getElementById('p-photo-file');

    if (fileEl._croppedData) {
        photo = await uploadToStorage('logos', `players/p_${Date.now()}`, fileEl._croppedData);
        fileEl._croppedData = null;
    } else if (fileEl.files[0]) {
        const b64 = await fileToBase64(fileEl.files[0]);
        photo = await uploadToStorage('logos', `players/p_${Date.now()}`, b64);
    }

    const [row] = await sbPost('players', {
        team_id: teamId,
        name,
        pos,
        matches,
        goals,
        assists: 0,
        yellow,
        red,
        photo: photo || ''
    });

    const newPlayer = {
        id: row.id,
        name,
        pos,
        matches,
        goals,
        yellow,
        red,
        photo: photo || '',
        recentMatches: []
    };

    team.players.push(newPlayer);

    renderAdminPlayersList(teamId);
    renderTeams();
    renderScorers();
    renderDiscipline();

    // Clear form
    document.getElementById('p-name').value = '';
    document.getElementById('p-photo-url').value = '';
    fileEl.value = '';
    document.getElementById('p-matches').value = '0';
    document.getElementById('p-goals').value = '0';
    document.getElementById('p-yellow').value = '0';
    document.getElementById('p-red').value = '0';

    logAction('add', `Добавлен игрок: ${name} (${team.name}, ${pos})`, { entity: 'player', id: row.id, teamId });
    showSuccess('Игрок добавлен!');
} catch (e) {
    showError('Ошибка: ' + e.message);
}

hideLoader();
```

}

async function deletePlayer(teamId, playerId) {
const team = teams.find(t => t.id === teamId);
const player = team?.players.find(p => p.id === playerId);

```
if (!player || !confirm(`Удалить игрока ${player.name}?`)) return;

showLoader('Удаление...');

try {
    await sbDelete('players', { id: playerId });
    team.players = team.players.filter(p => p.id !== playerId);

    renderAdminPlayersList(teamId);
    renderTeams();
    renderScorers();
    renderDiscipline();

    const editCard = document.getElementById('edit-player-card');
    if (editCard) editCard.style.display = 'none';

    logAction('delete', `Удалён игрок: ${player.name} (${team.name})`);
    showSuccess('Игрок удалён!');
} catch (e) {
    showError('Ошибка: ' + e.message);
}

hideLoader();
```

}

function openEditPlayer(teamId, playerId) {
const team = teams.find(t => t.id === teamId);
const player = team?.players.find(p => p.id === playerId);
if (!player) return;

```
document.getElementById('ep-teamid').value = teamId;
document.getElementById('ep-playerid').value = playerId;
document.getElementById('ep-name').value = player.name;
document.getElementById('ep-pos').value = player.pos;
document.getElementById('ep-matches').value = player.matches;
document.getElementById('ep-goals').value = player.goals;
document.getElementById('ep-yellow').value = player.yellow;
document.getElementById('ep-red').value = player.red;
document.getElementById('ep-photo-url').value = (player.photo && !player.photo.startsWith('data:')) ? player.photo : '';
document.getElementById('ep-photo-file').value = '';

const preview = document.getElementById('ep-photo-preview');
const img = document.getElementById('ep-photo-img');

if (player.photo) {
    img.src = player.photo;
    preview.style.display = 'block';
} else {
    preview.style.display = 'none';
}

document.getElementById('edit-player-label').textContent = player.name;
toggleStatFields(player.pos);

const card = document.getElementById('edit-player-card');
if (card) {
    card.style.display = 'block';
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
```

}

async function savePlayer() {
const teamId = parseInt(document.getElementById(‘ep-teamid’).value);
const playerId = parseInt(document.getElementById(‘ep-playerid’).value);

```
const team = teams.find(t => t.id === teamId);
const player = team?.players.find(p => p.id === playerId);
if (!player) return;

showLoader('Сохранение...');

try {
    const oldName = player.name;

    player.name = document.getElementById('ep-name').value.trim() || player.name;
    player.pos = document.getElementById('ep-pos').value;
    player.matches = parseInt(document.getElementById('ep-matches').value) || 0;
    player.goals = parseInt(document.getElementById('ep-goals').value) || 0;
    player.yellow = parseInt(document.getElementById('ep-yellow').value) || 0;
    player.red = parseInt(document.getElementById('ep-red').value) || 0;

    const urlVal = document.getElementById('ep-photo-url').value.trim();
    const fileEl = document.getElementById('ep-photo-file');

    if (fileEl._croppedData) {
        player.photo = await uploadToStorage('logos', `players/p_${playerId}`, fileEl._croppedData);
        fileEl._croppedData = null;
    } else if (fileEl.files[0]) {
        const b64 = await fileToBase64(fileEl.files[0]);
        player.photo = await uploadToStorage('logos', `players/p_${playerId}`, b64);
    } else if (urlVal) {
        player.photo = urlVal;
    }

    await sbPatch('players', { id: playerId }, {
        name: player.name,
        pos: player.pos,
        matches: player.matches,
        goals: player.goals,
        assists: player.assists || 0,
        yellow: player.yellow,
        red: player.red,
        photo: player.photo
    });

    renderAdminPlayersList(teamId);
    renderTeams();
    renderScorers();
    renderDiscipline();

    document.getElementById('edit-player-label').textContent = player.name;
    document.getElementById('edit-player-card').style.display = 'none';
    fileEl.value = '';

    logAction('edit', `Изменён игрок: ${oldName} (${team.name})`, { entity: 'player', id: playerId, teamId });
    showSuccess('Игрок сохранён!');
} catch (e) {
    showError('Ошибка: ' + e.message);
}

hideLoader();
```

}

function toggleStatFields(pos) {
const isNonPlaying = [‘Президент’, ‘Тренер’].includes(pos);
const fields = document.querySelectorAll(’.stat-only-field’);

```
fields.forEach(el => {
    el.style.display = isNonPlaying ? 'none' : '';
});
```

}

// ===================== ADMIN STANDINGS =====================
function updateStanding(index, field, value) {
if (field === ‘team’) {
standings[index].team = value;
} else {
standings[index][field] = parseInt(value) || 0;
}
}

async function saveStandings() {
showLoader(‘Сохранение таблицы…’);

```
try {
    for (const s of standings) {
        await sbPatch('standings', { id: s.id }, {
            team: s.team,
            p: s.p,
            w: s.w,
            d: s.d,
            l: s.l,
            pts: s.pts
        });
    }

    renderStandings();
    logAction('edit', 'Сохранена турнирная таблица');
    showSuccess('Таблица сохранена!');
} catch (e) {
    showError('Ошибка: ' + e.message);
}

hideLoader();
```

}

// ===================== ИСПРАВЛЕННАЯ ФУНКЦИЯ ПЕРЕСЧЁТА ТАБЛИЦЫ =====================
async function recalcStandings() {
if (!confirm(‘Пересчитать таблицу автоматически по результатам матчей? Текущие данные будут заменены.’)) return;

```
showLoader('Пересчёт...');

try {
    // ШАГ 1: Удаляем ВСЕ существующие записи в таблице standings
    const allExisting = [...standings];
    for (const s of allExisting) {
        try {
            await sbDelete('standings', { id: s.id });
        } catch (e) {
            console.warn('Не удалось удалить запись:', s.id);
        }
    }
    
    // Очищаем локальный массив
    standings = [];

    // ШАГ 2: Создаём карту статистики из результатов
    const statsMap = {};

    // Инициализируем все команды
    teams.forEach(t => {
        statsMap[t.name] = {
            team: t.name,
            p: 0,
            w: 0,
            d: 0,
            l: 0,
            gf: 0,
            ga: 0,
            pts: 0
        };
    });

    // Считаем статистику из официальных матчей
    results.forEach(r => {
        if (r.kind === 'friendly') return;
        
        const t1 = statsMap[r.team1];
        const t2 = statsMap[r.team2];
        
        if (!t1 || !t2) return; // Пропускаем, если команда не найдена
        
        t1.p++;
        t2.p++;
        t1.gf += r.g1 || 0;
        t1.ga += r.g2 || 0;
        t2.gf += r.g2 || 0;
        t2.ga += r.g1 || 0;

        if (r.g1 > r.g2) {
            t1.w++;
            t1.pts += 3;
            t2.l++;
        } else if (r.g1 < r.g2) {
            t2.w++;
            t2.pts += 3;
            t1.l++;
        } else {
            t1.d++;
            t2.d++;
            t1.pts++;
            t2.pts++;
        }
    });

    // ШАГ 3: Сохраняем каждую команду в базу данных (только по одной записи!)
    for (const teamName in statsMap) {
        const row = statsMap[teamName];
        
        try {
            const [inserted] = await sbPost('standings', row);
            standings.push({ ...row, id: inserted.id });
        } catch (e) {
            console.error('Ошибка при сохранении команды', teamName, e);
        }
    }

    // ШАГ 4: Перерисовываем всё
    renderStandings();
    renderAdminStandingsEdit();
    
    logAction('edit', 'Таблица пересчитана автоматически (дубликаты удалены)');
    showSuccess(`Таблица обновлена! Теперь ${teams.length} команд`);
} catch (e) {
    showError('Ошибка: ' + e.message);
    console.error(e);
}

hideLoader();
```

}

// ===================== ФУНКЦИЯ ОЧИСТКИ ТАБЛИЦЫ =====================
async function clearStandingsTable() {
if (!confirm(‘⚠️ Это удалит ВСЕ записи из турнирной таблицы! Вы уверены?’)) return;
if (!confirm(‘Точно уверены? После этого нужно будет нажать “Пересчитать по результатам”’)) return;

```
showLoader('Очистка таблицы...');

try {
    // Получаем все ID записей из standings
    const allStandings = await sbGet('standings', 'select=id');
    
    // Удаляем каждую запись
    for (const s of allStandings) {
        await sbDelete('standings', { id: s.id });
    }
    
    // Очищаем локальный массив
    standings = [];
    
    // Перерисовываем
    renderAdminStandingsEdit();
    renderStandings();
    
    showSuccess('Таблица очищена! Теперь нажмите "Пересчитать по результатам"');
    logAction('edit', 'Таблица очищена от дубликатов');
} catch (e) {
    showError('Ошибка: ' + e.message);
}

hideLoader();
```

}

// ===================== ADMIN TEAMS =====================
function editTeam(id) {
const team = teams.find(t => t.id === id);
if (!team) return;

```
document.getElementById('nt-name').value = team.name;
document.getElementById('nt-emoji').value = team.emoji || '';
document.getElementById('nt-logo-url').value = team.logo || '';
document.getElementById('nt-edit-id').value = id;
document.getElementById('team-edit-title').textContent = 'Редактировать команду';
document.getElementById('nt-cancel-btn').style.display = 'block';

if (team.logo) {
    document.getElementById('nt-logo-img').src = team.logo;
    document.getElementById('nt-logo-preview').style.display = 'block';
}
```

}

function cancelTeamEdit() {
document.getElementById(‘nt-name’).value = ‘’;
document.getElementById(‘nt-emoji’).value = ‘’;
document.getElementById(‘nt-logo-url’).value = ‘’;
document.getElementById(‘nt-edit-id’).value = ‘’;
document.getElementById(‘team-edit-title’).textContent = ‘Добавить команду’;
document.getElementById(‘nt-cancel-btn’).style.display = ‘none’;
document.getElementById(‘nt-logo-preview’).style.display = ‘none’;
}

async function saveTeam() {
const name = document.getElementById(‘nt-name’).value.trim();
const emoji = document.getElementById(‘nt-emoji’).value.trim() || ‘⚽’;
const logoUrl = document.getElementById(‘nt-logo-url’).value.trim();
const editId = parseInt(document.getElementById(‘nt-edit-id’).value);

```
if (!name) {
    alert('Введите название');
    return;
}

const fileEl = document.getElementById('nt-logo-file');

showLoader('Сохранение команды...');

const doSave = async (logoData) => {
    try {
        let logo = logoUrl || null;

        if (logoData) {
            logo = await uploadToStorage('logos', `teams/t_${editId || Date.now()}`, logoData);
        }

        if (editId) {
            const team = teams.find(t => t.id === editId);
            if (team) {
                const oldName = team.name;
                team.name = name;
                team.emoji = emoji;
                if (logo !== null) team.logo = logo;

                await sbPatch('teams', { id: editId }, { name, emoji, logo: team.logo });
                logAction('edit', `Изменена команда: ${oldName} → ${name}`, { entity: 'team', id: editId });
            }
        } else {
            const [row] = await sbPost('teams', { name, emoji, logo });
            teams.push({ id: row.id, name, emoji, logo: logo || null, players: [] });
            logAction('add', `Добавлена команда: ${name}`, { entity: 'team', id: row.id });
        }

        renderTeams();
        renderAdminTeamsList();
        populateTeamSelects();
        cancelTeamEdit();
        showSuccess(editId ? 'Команда обновлена!' : 'Команда добавлена!');
    } catch (e) {
        showError('Ошибка: ' + e.message);
    }

    hideLoader();
};

if (fileEl._croppedData) {
    const data = fileEl._croppedData;
    fileEl._croppedData = null;
    await doSave(data);
} else if (fileEl.files[0]) {
    const b64 = await fileToBase64(fileEl.files[0]);
    await doSave(b64);
} else {
    await doSave(null);
}
```

}

async function deleteTeam(id) {
const team = teams.find(t => t.id === id);
if (!team || !confirm(`Удалить команду «${team.name}»? Все игроки будут удалены.`)) return;

```
showLoader('Удаление...');

try {
    await sbDelete('teams', { id });
    logAction('delete', `Удалена команда: ${team.name}`);
    teams = teams.filter(t => t.id !== id);

    renderTeams();
    renderAdminTeamsList();
    populateTeamSelects();
    showSuccess('Команда удалена!');
} catch (e) {
    showError('Ошибка: ' + e.message);
}

hideLoader();
```

}

// ===================== SEARCH =====================
function onPlayerSearch(query) {
const drop = document.getElementById(‘search-drop’);
const q = query.trim().toLowerCase();

```
if (q.length < 2) {
    drop.classList.remove('open');
    return;
}

const results = [];

teams.forEach(t => {
    t.players.forEach(p => {
        if (p.name.toLowerCase().includes(q)) {
            results.push({ team: t, player: p });
        }
    });
});

if (!results.length) {
    drop.innerHTML = '<div class="search-result-item"><span class="search-result-meta">Ничего не найдено</span></div>';
} else {
    const posEmoji = {
        Вратарь: '🧤',
        Защитник: '🛡️',
        Нападающий: '⚡',
        Полузащитник: '🎯',
        Президент: '👑',
        Тренер: '📋'
    };

    drop.innerHTML = results.slice(0, 8).map(({ team, player }) => `
        <div class="search-result-item" data-team-id="${team.id}" data-player-id="${player.id}">
            <div class="scorer-photo">
                ${player.photo ? `<img src="${player.photo}" alt="${player.name}">` : (posEmoji[player.pos] || '👤')}
            </div>
            <div>
                <div class="search-result-name">${player.name}</div>
                <div class="search-result-meta">${player.pos} · ${team.name}</div>
            </div>
        </div>
    `).join('');
}

drop.classList.add('open');
```

}

// ===================== AUTO SYNC STATS =====================
async function autoSyncStats() {
const pStats = {}; // key: `${playerName}||${teamName}`
const teamGoals = {};

```
results.forEach(r => {
    if (r.kind === 'friendly') return;

    const matchPlayers = new Set();

    (r.events || []).forEach(e => {
        const key = `${e.playerName}||${e.teamName}`;

        if (!pStats[key]) {
            pStats[key] = { goals: 0, assists: 0, yellow: 0, red: 0, matches: new Set() };
        }

        pStats[key].matches.add(r.id);
        matchPlayers.add(key);

        if (e.type === 'goal') {
            pStats[key].goals++;
            teamGoals[e.teamName] = (teamGoals[e.teamName] || 0) + 1;

            if (e.assistName) {
                const aKey = `${e.assistName}||${e.teamName}`;
                if (!pStats[aKey]) {
                    pStats[aKey] = { goals: 0, assists: 0, yellow: 0, red: 0, matches: new Set() };
                }
                pStats[aKey].assists++;
                pStats[aKey].matches.add(r.id);
            }
        }

        if (e.type === 'yellow') pStats[key].yellow++;
        if (e.type === 'red') pStats[key].red++;

        if (e.type === 'sub' && e.subOutName) {
            const outKey = `${e.subOutName}||${e.teamName}`;
            if (!pStats[outKey]) {
                pStats[outKey] = { goals: 0, assists: 0, yellow: 0, red: 0, matches: new Set() };
            }
            pStats[outKey].matches.add(r.id);
        }
    });
});

const updatePromises = [];

teams.forEach(t => {
    t.players.forEach(p => {
        if (['Президент', 'Тренер'].includes(p.pos)) return;

        const key = `${p.name}||${t.name}`;
        const s = pStats[key];
        if (!s) return;

        const newMatches = s.matches.size;
        const newGoals = s.goals;
        const newAssists = s.assists;
        const newYellow = s.yellow;
        const newRed = s.red;

        if (p.matches !== newMatches || p.goals !== newGoals ||
            (p.assists || 0) !== newAssists || p.yellow !== newYellow || p.red !== newRed) {

            p.matches = newMatches;
            p.goals = newGoals;
            p.assists = newAssists;
            p.yellow = newYellow;
            p.red = newRed;

            updatePromises.push(
                sbPatch('players', { id: p.id }, {
                    matches: newMatches,
                    goals: newGoals,
                    assists: newAssists,
                    yellow: newYellow,
                    red: newRed
                }).catch(err => console.error('Failed to update player stats:', err))
            );
        }
    });
});

// Update standings
const standMap = {};

const ensureSt = (name) => {
    if (!standMap[name]) {
        standMap[name] = { team: name, p: 0, w: 0, d: 0, l: 0, pts: 0 };
    }
};

results.forEach(r => {
    if (r.kind === 'friendly') return;

    ensureSt(r.team1);
    ensureSt(r.team2);

    const s1 = standMap[r.team1];
    const s2 = standMap[r.team2];

    s1.p++;
    s2.p++;

    if (r.g1 > r.g2) {
        s1.w++;
        s1.pts += 3;
        s2.l++;
    } else if (r.g1 < r.g2) {
        s2.w++;
        s2.pts += 3;
        s1.l++;
    } else {
        s1.d++;
        s2.d++;
        s1.pts++;
        s2.pts++;
    }
});

// СОЗДАЁМ КАРТУ СУЩЕСТВУЮЩИХ ЗАПИСЕЙ
const existingStandingsMap = {};
standings.forEach(s => {
    existingStandingsMap[s.team] = s;
});

const updateStandingsPromises = [];

for (const row of Object.values(standMap)) {
    const existing = existingStandingsMap[row.team];

    if (existing) {
        // Обновляем существующую
        existing.p = row.p;
        existing.w = row.w;
        existing.d = row.d;
        existing.l = row.l;
        existing.pts = row.pts;

        updateStandingsPromises.push(
            sbPatch('standings', { id: existing.id }, {
                p: row.p,
                w: row.w,
                d: row.d,
                l: row.l,
                pts: row.pts
            }).catch(err => console.error('Failed to update standings:', err))
        );
    } else {
        // Создаём новую
        updateStandingsPromises.push(
            sbPost('standings', row).then(([inserted]) => {
                standings.push({ ...row, id: inserted.id });
            }).catch(err => console.error('Failed to insert standings:', err))
        );
    }
}

// Удаляем записи, которых нет в standMap
const teamsToKeep = new Set(Object.keys(standMap));
const toDelete = standings.filter(s => !teamsToKeep.has(s.team));

for (const s of toDelete) {
    updateStandingsPromises.push(
        sbDelete('standings', { id: s.id }).catch(err => console.error('Failed to delete standings:', err))
    );
}

standings = standings.filter(s => teamsToKeep.has(s.team));

// Update hero stats
const officialResults = results.filter(r => r.kind !== 'friendly');
const totalGoals = officialResults.reduce((s, r) => s + (r.g1 || 0) + (r.g2 || 0), 0);
const totalMatches = officialResults.length;
const totalPlayers = teams.reduce((s, t) => s + t.players.length, 0);
const totalTeams = teams.length;

heroStats = { teams: totalTeams, matches: totalMatches, players: totalPlayers, goals: totalGoals };

updateStandingsPromises.push(
    sbSetSetting('hero_stats', JSON.stringify(heroStats)).catch(err => console.error('Failed to save hero stats:', err))
);

await Promise.all([...updatePromises, ...updateStandingsPromises]);

// Re-render everything
renderHeroStats();
renderStandings();
renderAdminStandingsEdit();
renderScorers();
renderDiscipline();
renderTeams();
```

}

// ===================== HERO STATS =====================
function initHeroStatsForm() {
document.getElementById(‘hs-teams’).value = heroStats.teams;
document.getElementById(‘hs-matches’).value = heroStats.matches;
document.getElementById(‘hs-players’).value = heroStats.players;
document.getElementById(‘hs-goals’).value = heroStats.goals;
}

async function saveHeroStats() {
heroStats = {
teams: parseInt(document.getElementById(‘hs-teams’).value) || 0,
matches: parseInt(document.getElementById(‘hs-matches’).value) || 0,
players: parseInt(document.getElementById(‘hs-players’).value) || 0,
goals: parseInt(document.getElementById(‘hs-goals’).value) || 0,
};

```
showLoader('Сохранение...');

try {
    await sbSetSetting('hero_stats', JSON.stringify(heroStats));
    renderHeroStats();
    logAction('settings', 'Обновлена статистика на главной');
    showSuccess('Сохранено!');
} catch (e) {
    showError('Ошибка: ' + e.message);
}

hideLoader();
```

}

// ===================== LEAGUE LOGO =====================
function applyLeagueLogo() {
const img = document.getElementById(‘logo-img’);
const em = document.getElementById(‘logo-emoji’);

```
if (leagueLogo) {
    img.src = leagueLogo;
    img.style.display = 'block';
    em.style.display = 'none';

    const previewImg = document.getElementById('league-logo-img');
    if (previewImg) {
        previewImg.src = leagueLogo;
        document.getElementById('league-logo-preview').style.display = 'block';
    }
} else {
    img.style.display = 'none';
    em.style.display = 'block';
}
```

}

async function saveLeagueLogo() {
const urlVal = document.getElementById(‘league-logo-url’).value.trim();
const fileEl = document.getElementById(‘league-logo-file’);

```
showLoader('Загрузка логотипа...');

try {
    if (urlVal) {
        leagueLogo = urlVal;
    } else if (fileEl._croppedData) {
        leagueLogo = await uploadToStorage('logos', 'league/logo', fileEl._croppedData);
        fileEl._croppedData = null;
    } else if (fileEl.files[0]) {
        const b64 = await fileToBase64(fileEl.files[0]);
        leagueLogo = await uploadToStorage('logos', 'league/logo', b64);
    } else {
        hideLoader();
        alert('Укажите URL или загрузите файл');
        return;
    }

    await sbSetSetting('league_logo', leagueLogo);
    applyLeagueLogo();
    logAction('logo', 'Обновлён логотип лиги');
    showSuccess('Логотип сохранён!');
} catch (e) {
    showError('Ошибка: ' + e.message);
}

hideLoader();
```

}

async function resetLeagueLogo() {
showLoader(‘Сброс…’);

```
try {
    leagueLogo = null;
    await sbSetSetting('league_logo', '');
    applyLeagueLogo();
    logAction('logo', 'Логотип лиги сброшен');
    showSuccess('Логотип сброшен');
} catch (e) {
    showError('Ошибка: ' + e.message);
}

hideLoader();
```

}

function initSettingsTab() {
initHeroStatsForm();
applyLeagueLogo();
}

// ===================== IMAGE UPLOAD =====================
async function uploadToStorage(bucket, path, base64DataUrl) {
const arr = base64DataUrl.split(’,’);
const mime = arr[0].match(/:(.*?);/)[1];
const bstr = atob(arr[1]);
const bytes = new Uint8Array(bstr.length);

```
for (let i = 0; i < bstr.length; i++) {
    bytes[i] = bstr.charCodeAt(i);
}

const blob = new Blob([bytes], { type: mime });
const ext = mime.split('/')[1].replace('jpeg', 'jpg');
const fullPath = `${path}.${ext}?t=${Date.now()}`;

const r = await fetch(`${CONFIG.SUPABASE_URL}/storage/v1/object/${bucket}/${fullPath}`, {
    method: 'POST',
    headers: {
        'apikey': CONFIG.SUPABASE_KEY,
        'Authorization': 'Bearer ' + CONFIG.SUPABASE_KEY,
        'Content-Type': mime,
        'x-upsert': 'true'
    },
    body: blob
});

if (!r.ok) {
    const e = await r.text();
    throw new Error(e);
}

return `${CONFIG.SUPABASE_URL}/storage/v1/object/public/${bucket}/${fullPath}`;
```

}

// ===================== IMAGE CROP =====================
function openCropModal(target) {
const fileInput = document.getElementById(target === ‘league-logo’ ? ‘league-logo-file’ : ‘nt-logo-file’);
const file = fileInput.files[0];
if (!file) return;

```
_cropTarget = target;

const reader = new FileReader();
reader.onload = e => {
    const img = document.getElementById('crop-img');
    img.onload = () => {
        const containerW = Math.min(420, window.innerWidth - 48);
        const container = document.getElementById('crop-container');
        container.style.width = containerW + 'px';
        container.style.height = containerW + 'px';

        const box = document.getElementById('crop-box');
        box.style.width = CONFIG.CROP_SIZE + 'px';
        box.style.height = CONFIG.CROP_SIZE + 'px';
        box.style.left = ((containerW - CONFIG.CROP_SIZE) / 2) + 'px';
        box.style.top = ((containerW - CONFIG.CROP_SIZE) / 2) + 'px';

        const minScale = Math.max(
            CONFIG.CROP_SIZE / img.naturalWidth,
            CONFIG.CROP_SIZE / img.naturalHeight
        );

        _cropMinScale = minScale;
        _cropScale = minScale;

        const slider = document.getElementById('crop-scale');
        slider.min = minScale;
        slider.max = minScale * 4;
        slider.step = minScale * 0.01;
        slider.value = minScale;

        _applyCropTransform(img, containerW, containerW);
    };

    img.src = e.target.result;
};

reader.readAsDataURL(file);
openModal('crop-modal');
```

}

function _applyCropTransform(img, containerW, containerH) {
img = img || document.getElementById(‘crop-img’);
containerW = containerW || document.getElementById(‘crop-container’).clientWidth;
containerH = containerH || document.getElementById(‘crop-container’).clientHeight;

```
const iw = img.naturalWidth * _cropScale;
const ih = img.naturalHeight * _cropScale;

const boxLeft = (containerW - CONFIG.CROP_SIZE) / 2;
const boxTop = (containerH - CONFIG.CROP_SIZE) / 2;

const minX = boxLeft + CONFIG.CROP_SIZE - iw;
const maxX = boxLeft;
const minY = boxTop + CONFIG.CROP_SIZE - ih;
const maxY = boxTop;

_cropImgOffset.x = Math.max(minX, Math.min(maxX, _cropImgOffset.x));
_cropImgOffset.y = Math.max(minY, Math.min(maxY, _cropImgOffset.y));

if (!img._cropInitDone) {
    _cropImgOffset.x = boxLeft - (iw - CONFIG.CROP_SIZE) / 2;
    _cropImgOffset.y = boxTop - (ih - CONFIG.CROP_SIZE) / 2;
    img._cropInitDone = true;
}

img.style.position = 'absolute';
img.style.left = _cropImgOffset.x + 'px';
img.style.top = _cropImgOffset.y + 'px';
img.style.width = iw + 'px';
img.style.height = ih + 'px';
```

}

function updateCropScale() {
_cropScale = parseFloat(document.getElementById(‘crop-scale’).value);
const img = document.getElementById(‘crop-img’);
img._cropInitDone = true;
_applyCropTransform(img);
}

function getXY(e) {
const t = e.touches ? e.touches[0] : e;
return { x: t.clientX, y: t.clientY };
}

function applyCrop() {
const img = document.getElementById(‘crop-img’);
const box = document.getElementById(‘crop-box’);
const container = document.getElementById(‘crop-container’);

```
const boxLeft = parseFloat(box.style.left);
const boxTop = parseFloat(box.style.top);
const boxSize = CONFIG.CROP_SIZE;

const srcX = (boxLeft - _cropImgOffset.x) / _cropScale;
const srcY = (boxTop - _cropImgOffset.y) / _cropScale;
const srcW = boxSize / _cropScale;
const srcH = boxSize / _cropScale;

const canvas = document.createElement('canvas');
canvas.width = 300;
canvas.height = 300;

const ctx = canvas.getContext('2d');
ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, 300, 300);

const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

if (_cropTarget === 'league-logo') {
    document.getElementById('league-logo-img').src = dataUrl;
    document.getElementById('league-logo-preview').style.display = 'block';
    document.getElementById('league-logo-url').value = '';
    document.getElementById('league-logo-file')._croppedData = dataUrl;
} else {
    document.getElementById('nt-logo-img').src = dataUrl;
    document.getElementById('nt-logo-preview').style.display = 'block';
    document.getElementById('nt-logo-url').value = '';
    document.getElementById('nt-logo-file')._croppedData = dataUrl;
}

closeCropModal();
```

}

function closeCropModal() {
closeModal(‘crop-modal’);
const img = document.getElementById(‘crop-img’);
if (img) img._cropInitDone = false;
}

// ===================== ACTION LOG =====================
function logAction(type, description, ref) {
const entry = {
id: Date.now(),
time: new Date().toLocaleString(‘ru-RU’),
type,
description,
ref: ref || null
};

```
actionLog.unshift(entry);

if (actionLog.length > 50) {
    actionLog = actionLog.slice(0, 50);
}

actionHistory.unshift(entry);

if (actionHistory.length > 20) {
    actionHistory = actionHistory.slice(0, 20);
}

sbSetSetting('action_log', JSON.stringify(actionLog)).catch(() => {});
renderActionLog();
```

}

async function clearLog() {
if (!confirm(‘Очистить журнал?’)) return;

```
actionLog = [];
actionHistory = [];

await sbSetSetting('action_log', '[]').catch(() => {});
renderActionLog();
```

}

// ===================== EVENT LISTENERS =====================
function initEventListeners() {
// Burger menu
const burger = document.getElementById(‘burger’);
const nav = document.getElementById(‘main-nav’);

```
if (burger) {
    burger.addEventListener('click', () => {
        burger.classList.toggle('open');
        nav.classList.toggle('open');
    });
}

// Navigation links
nav?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
        burger?.classList.remove('open');
        nav?.classList.remove('open');

        const mainSite = document.getElementById('main-site');
        if (mainSite && mainSite.style.display === 'none') {
            showMain();
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                setTimeout(() => {
                    const el = document.querySelector(href);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }
    });
});

// Modal close buttons
document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const modalId = btn.dataset.modal || btn.closest('.modal-overlay')?.id;
        if (modalId) closeModal(modalId);
    });
});

// Modal overlay clicks
document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal.id);
    });
});

// Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(modal => {
            closeModal(modal.id);
        });
    }
});

// Admin login
const loginBtn = document.getElementById('admin-login-btn');
const passInput = document.getElementById('admin-pass');

if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        const username = document.getElementById('admin-user').value;
        const password = document.getElementById('admin-pass').value;
        adminLogin(username, password);
    });
}

if (passInput) {
    passInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const username = document.getElementById('admin-user').value;
            const password = document.getElementById('admin-pass').value;
            adminLogin(username, password);
        }
    });
}

// Admin logout
const logoutBtn = document.getElementById('admin-logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', adminLogout);
}

// Back to site
const backBtn = document.getElementById('back-to-site');
if (backBtn) {
    backBtn.addEventListener('click', () => {
        history.pushState({}, '', '/');
        showMain();
    });
}

// Logo click — всегда возвращает на главную
const logoLink = document.getElementById('logo-link');
if (logoLink) {
    logoLink.addEventListener('click', (e) => {
        const adminSection = document.getElementById('admin-section');
        if (adminSection && adminSection.style.display !== 'none') {
            e.preventDefault();
            showMain();
            setTimeout(() => {
                const hero = document.getElementById('hero');
                if (hero) hero.scrollIntoView({ behavior: 'smooth' });
            }, 50);
        }
    });
}

// Test connection button
const testConnBtn = document.getElementById('test-connection-btn');
if (testConnBtn) {
    testConnBtn.addEventListener('click', async () => {
        testConnBtn.textContent = '⏳ Проверка...';
        testConnBtn.disabled = true;
        try {
            const data = await sbGet('teams', 'select=id&limit=1');
            console.log('Supabase connection OK:', data);
            showSuccess('✅ Соединение установлено! Supabase работает.');
        } catch (e) {
            console.error('Supabase connection FAIL:', e);
            showError('❌ Ошибка соединения: ' + e.message);
        } finally {
            testConnBtn.textContent = '🔌 Проверить соединение';
            testConnBtn.disabled = false;
        }
    });
}

// Admin tabs
document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        const tabId = tab.dataset.tab;
        if (tabId) showAdminTab(tabId);
    });
});

// Stats tabs
document.querySelectorAll('.stats-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        const tabId = tab.dataset.tab;

        document.querySelectorAll('.stats-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        document.querySelectorAll('.stats-panel').forEach(p => p.classList.remove('active'));
        const targetPanel = document.getElementById('panel-' + tabId);
        if (targetPanel) targetPanel.classList.add('active');
    });
});

// Team cards click
document.addEventListener('click', (e) => {
    const teamCard = e.target.closest('.team-card');
    if (teamCard) {
        const teamId = teamCard.dataset.teamId;
        if (teamId) openTeamModal(parseInt(teamId));
    }

    // Player card click
    const playerCard = e.target.closest('.player-card');
    if (playerCard) {
        const teamId = playerCard.dataset.teamId;
        const playerId = playerCard.dataset.playerId;
        if (teamId && playerId) openPlayerModal(parseInt(teamId), parseInt(playerId));
    }

    // Team modal tabs
    const teamTab = e.target.closest('.team-tab');
    if (teamTab) {
        const teamId = teamTab.dataset.teamId;
        const view = teamTab.dataset.view;
        if (teamId && view) openTeamModal(parseInt(teamId), view);
    }

    // Scorer row click
    const scorerRow = e.target.closest('.scorer-row');
    if (scorerRow) {
        const teamId = scorerRow.dataset.teamId;
        const playerId = scorerRow.dataset.playerId;
        if (teamId && playerId) {
            openTeamModal(parseInt(teamId));
            setTimeout(() => openPlayerModal(parseInt(teamId), parseInt(playerId)), 120);
        }
    }

    // Result card click
    const resultCard = e.target.closest('.result-card');
    if (resultCard) {
        const resultId = resultCard.dataset.resultId;
        if (resultId) openProtocolModal(resultId);
    }

    // Search result click
    const searchResult = e.target.closest('.search-result-item');
    if (searchResult) {
        const teamId = searchResult.dataset.teamId;
        const playerId = searchResult.dataset.playerId;

        if (teamId && playerId) {
            openTeamModal(parseInt(teamId));
            setTimeout(() => openPlayerModal(parseInt(teamId), parseInt(playerId)), 120);

            document.getElementById('player-search').value = '';
            document.getElementById('search-drop').classList.remove('open');
        }
    }

    // Admin: lineup toggle
    if (e.target.closest('.lineup-toggle')) {
        const btn = e.target.closest('.lineup-toggle');
        const matchId = btn.dataset.matchId;
        if (matchId) toggleLineupPanel(matchId);
    }

    // Public: lineup toggle на карточке матча
    if (e.target.closest('[data-lineup-toggle]')) {
        const btn = e.target.closest('[data-lineup-toggle]');
        const matchId = btn.dataset.lineupToggle;
        const body = document.getElementById('lineup-body-' + matchId);
        if (body) {
            body.classList.toggle('open');
            btn.classList.toggle('open');
        }
    }

    // Admin: save lineup
    if (e.target.closest('.save-lineup')) {
        const btn = e.target.closest('.save-lineup');
        const matchId = btn.dataset.matchId;
        if (matchId) saveLineup(matchId);
    }

    // Admin: выбрать всех игроков команды
    if (e.target.closest('.lineup-select-all')) {
        const btn = e.target.closest('.lineup-select-all');
        const matchId = btn.dataset.matchId;
        const team = btn.dataset.team;
        document.querySelectorAll(`.lineup-cb[data-match-id="${matchId}"][data-team="${team}"]`)
            .forEach(cb => { cb.checked = true; cb.closest('.lineup-checkbox-label').classList.add('selected'); });
        updateLineupCounter(matchId, team);
    }

    // Admin: сбросить всех игроков команды
    if (e.target.closest('.lineup-clear-all')) {
        const btn = e.target.closest('.lineup-clear-all');
        const matchId = btn.dataset.matchId;
        const team = btn.dataset.team;
        document.querySelectorAll(`.lineup-cb[data-match-id="${matchId}"][data-team="${team}"]`)
            .forEach(cb => { cb.checked = false; cb.closest('.lineup-checkbox-label').classList.remove('selected'); });
        updateLineupCounter(matchId, team);
    }

    // Admin: клик по чекбоксу игрока
    if (e.target.classList.contains('lineup-cb')) {
        const cb = e.target;
        cb.closest('.lineup-checkbox-label').classList.toggle('selected', cb.checked);
        updateLineupCounter(cb.dataset.matchId, cb.dataset.team);
    }

    // Admin: delete upcoming
    if (e.target.closest('.delete-upcoming')) {
        const btn = e.target.closest('.delete-upcoming');
        const matchId = btn.dataset.matchId;
        if (matchId) deleteUpcoming(matchId);
    }

    // Admin: edit protocol
    if (e.target.closest('.edit-protocol')) {
        const btn = e.target.closest('.edit-protocol');
        const resultId = btn.dataset.resultId;
        if (resultId) openProtocolEditor(resultId);
    }

    // Admin: delete result
    if (e.target.closest('.delete-result')) {
        const btn = e.target.closest('.delete-result');
        const resultId = btn.dataset.resultId;
        if (resultId) deleteResult(resultId);
    }

    // Admin: result info click (open protocol)
    if (e.target.closest('.result-info')) {
        const el = e.target.closest('.result-info');
        const resultId = el.dataset.resultId;
        if (resultId) openProtocolEditor(resultId);
    }

    // Admin: save standing
    if (e.target.closest('.save-standing')) {
        const btn = e.target.closest('.save-standing');
        const index = btn.dataset.index;

        const row = btn.closest('tr');
        const teamInput = row.querySelector('.standing-team');
        const pInput = row.querySelector('.standing-p');
        const wInput = row.querySelector('.standing-w');
        const dInput = row.querySelector('.standing-d');
        const lInput = row.querySelector('.standing-l');
        const ptsInput = row.querySelector('.standing-pts');

        updateStanding(index, 'team', teamInput.value);
        updateStanding(index, 'p', pInput.value);
        updateStanding(index, 'w', wInput.value);
        updateStanding(index, 'd', dInput.value);
        updateStanding(index, 'l', lInput.value);
        updateStanding(index, 'pts', ptsInput.value);

        saveStandings();
    }

    // Admin: edit player
    if (e.target.closest('.edit-player')) {
        const btn = e.target.closest('.edit-player');
        const teamId = btn.dataset.teamId;
        const playerId = btn.dataset.playerId;
        if (teamId && playerId) openEditPlayer(parseInt(teamId), parseInt(playerId));
    }

    // Admin: delete player
    if (e.target.closest('.delete-player')) {
        const btn = e.target.closest('.delete-player');
        const teamId = btn.dataset.teamId;
        const playerId = btn.dataset.playerId;
        if (teamId && playerId) deletePlayer(parseInt(teamId), parseInt(playerId));
    }

    // Admin: edit team
    if (e.target.closest('.edit-team')) {
        const btn = e.target.closest('.edit-team');
        const teamId = btn.dataset.teamId;
        if (teamId) editTeam(parseInt(teamId));
    }

    // Admin: delete team
    if (e.target.closest('.delete-team')) {
        const btn = e.target.closest('.delete-team');
        const teamId = btn.dataset.teamId;
        if (teamId) deleteTeam(parseInt(teamId));
    }

    // Admin: cancel edit team
    if (e.target.closest('#nt-cancel-btn')) {
        cancelTeamEdit();
    }

    // Admin: cancel edit player
    if (e.target.closest('#cancel-edit-player')) {
        document.getElementById('edit-player-card').style.display = 'none';
    }

    // Admin: log edit
    if (e.target.closest('.log-edit')) {
        const btn = e.target.closest('.log-edit');
        const ref = JSON.parse(btn.dataset.ref);

        if (ref.entity === 'player' && ref.teamId && ref.id) {
            showAdminTab('tab-players');
            setTimeout(() => {
                const select = document.getElementById('p-team');
                if (select) {
                    select.value = ref.teamId;
                    renderAdminPlayersList(ref.teamId);
                }
                setTimeout(() => openEditPlayer(ref.teamId, ref.id), 150);
            }, 100);
        } else if (ref.entity === 'team' && ref.id) {
            showAdminTab('tab-teams');
            setTimeout(() => editTeam(ref.id), 100);
        } else if (ref.entity === 'result' && ref.id) {
            showAdminTab('tab-results');
            setTimeout(() => openProtocolEditor(ref.id), 100);
        }
    }

    // Admin: log delete
    if (e.target.closest('.log-delete')) {
        const btn = e.target.closest('.log-delete');
        const logId = parseInt(btn.dataset.logId);

        actionLog = actionLog.filter(e => e.id !== logId);
        sbSetSetting('action_log', JSON.stringify(actionLog)).catch(() => {});
        renderActionLog();
    }

    // Admin: delete event from protocol
    if (e.target.closest('.delete-event')) {
        const btn = e.target.closest('.delete-event');
        const resultId = btn.dataset.resultId;
        const index = parseInt(btn.dataset.eventIndex);
        deleteProtocolEvent(resultId, index);
    }
});

// Search input
const searchInput = document.getElementById('player-search');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        onPlayerSearch(e.target.value);
    });
}

// Close search dropdown on outside click
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-bar-wrap')) {
        document.getElementById('search-drop')?.classList.remove('open');
    }
});

// Admin: add match
const addMatchBtn = document.getElementById('add-match-btn');
if (addMatchBtn) {
    addMatchBtn.addEventListener('click', addMatch);
}

// Admin: add result
const addResultBtn = document.getElementById('add-result-btn');
if (addResultBtn) {
    addResultBtn.addEventListener('click', addResult);
}

// Admin: add protocol event
const addEventBtn = document.getElementById('add-protocol-event');
if (addEventBtn) {
    addEventBtn.addEventListener('click', addProtocolEvent);
}

// Admin: add player
const addPlayerBtn = document.getElementById('add-player-btn');
if (addPlayerBtn) {
    addPlayerBtn.addEventListener('click', addPlayer);
}

// Admin: save player
const savePlayerBtn = document.getElementById('save-player-btn');
if (savePlayerBtn) {
    savePlayerBtn.addEventListener('click', savePlayer);
}

// Admin: recalc standings
const recalcBtn = document.getElementById('recalc-standings-btn');
if (recalcBtn) {
    recalcBtn.addEventListener('click', recalcStandings);
}

// Admin: clear standings (новая кнопка)
const clearBtn = document.getElementById('clear-standings-btn');
if (clearBtn) {
    clearBtn.addEventListener('click', clearStandingsTable);
}

// Admin: save team
const saveTeamBtn = document.getElementById('save-team-btn');
if (saveTeamBtn) {
    saveTeamBtn.addEventListener('click', saveTeam);
}

// Admin: save hero stats
const saveHeroBtn = document.getElementById('save-hero-stats');
if (saveHeroBtn) {
    saveHeroBtn.addEventListener('click', saveHeroStats);
}

// Admin: save league logo
const saveLogoBtn = document.getElementById('save-league-logo');
if (saveLogoBtn) {
    saveLogoBtn.addEventListener('click', saveLeagueLogo);
}

// Admin: reset league logo
const resetLogoBtn = document.getElementById('reset-league-logo');
if (resetLogoBtn) {
    resetLogoBtn.addEventListener('click', resetLeagueLogo);
}

// Admin: clear log
const clearLogBtn = document.getElementById('clear-log-btn');
if (clearLogBtn) {
    clearLogBtn.addEventListener('click', clearLog);
}

// Crop modal controls
const cropScale = document.getElementById('crop-scale');
if (cropScale) {
    cropScale.addEventListener('input', updateCropScale);
}

const applyCropBtn = document.getElementById('apply-crop-btn');
if (applyCropBtn) {
    applyCropBtn.addEventListener('click', applyCrop);
}

// Team select change
const pTeam = document.getElementById('p-team');
if (pTeam) {
    pTeam.addEventListener('change', (e) => {
        renderAdminPlayersList(parseInt(e.target.value));
    });
}

// Protocol editor event type change
const evType = document.getElementById('ev-type');
if (evType) {
    evType.addEventListener('change', onEvTypeChange);
}

const evTeam = document.getElementById('ev-team');
if (evTeam) {
    evTeam.addEventListener('change', onEvTeamChange);
}

// File inputs for crop
const leagueLogoFile = document.getElementById('league-logo-file');
if (leagueLogoFile) {
    leagueLogoFile.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            openCropModal('league-logo');
        }
    });
}

const ntLogoFile = document.getElementById('nt-logo-file');
if (ntLogoFile) {
    ntLogoFile.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            openCropModal('nt-logo');
        }
    });
}

// Position change for player form
const pPos = document.getElementById('p-pos');
if (pPos) {
    pPos.addEventListener('change', (e) => {
        const icons = { Вратарь: '🧤', Защитник: '🛡️', Полузащитник: '🎯', Нападающий: '⚡' };
        document.getElementById('p-photo-url').value = '';
    });
}

const epPos = document.getElementById('ep-pos');
if (epPos) {
    epPos.addEventListener('change', (e) => {
        toggleStatFields(e.target.value);
    });
}

// Drag for crop
let cropDrag = false;
let dragStart = { x: 0, y: 0 };
let offsetStart = { x: 0, y: 0 };

document.addEventListener('mousedown', (e) => {
    if (e.target.id === 'crop-img') {
        cropDrag = true;
        const p = getXY(e);
        dragStart = p;
        offsetStart = { ..._cropImgOffset };
        e.preventDefault();
    }
});

document.addEventListener('touchstart', (e) => {
    if (e.target.id === 'crop-img') {
        cropDrag = true;
        const p = getXY(e);
        dragStart = p;
        offsetStart = { ..._cropImgOffset };
    }
}, { passive: true });

const onMove = (e) => {
    if (!cropDrag) return;
    const p = getXY(e);
    _cropImgOffset.x = offsetStart.x + (p.x - dragStart.x);
    _cropImgOffset.y = offsetStart.y + (p.y - dragStart.y);
    _applyCropTransform();
};

document.addEventListener('mousemove', onMove);
document.addEventListener('touchmove', onMove, { passive: true });

document.addEventListener('mouseup', () => {
    cropDrag = false;
});

document.addEventListener('touchend', () => {
    cropDrag = false;
});
```

}

// ===================== INITIALIZATION =====================
async function init() {
// Обработка SPA редиректа с 404.html (для GitHub Pages)
const redirectPath = sessionStorage.getItem(‘spa_redirect’);
if (redirectPath) {
sessionStorage.removeItem(‘spa_redirect’);
history.replaceState({}, ‘’, redirectPath);
}

```
initEventListeners();

// Роутинг через pathname
if (isAdminRoute()) {
    showAdmin();
}

await loadAllData();

renderSchedule();
renderTeams();
renderStandings();
renderResults();
renderScorers();
renderDiscipline();
renderHeroStats();
applyLeagueLogo();
renderActionLog();

// Если уже залогинен — показываем панель
if (isAdminRoute() && sessionStorage.getItem('bfl_admin')) {
    showAdminPanel();
}
```

}

// Обработка навигации браузера (кнопка назад/вперёд)
window.addEventListener(‘popstate’, () => {
if (isAdminRoute()) {
showAdmin();
} else {
showMain();
}
});

// Start the app
document.addEventListener(‘DOMContentLoaded’, init);
// ---- State ----
const ALL_POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
const INFIELD_POS = ['1B', '2B', '3B', 'SS'];
const OUTFIELD_POS = ['LF', 'CF', 'RF'];
const FIELD_COORDS = {
  P:    { x: 50, y: 54 },
  C:    { x: 50, y: 81 },
  '1B': { x: 68, y: 54 },
  '2B': { x: 61, y: 40 },
  SS:   { x: 39, y: 40 },
  '3B': { x: 32, y: 54 },
  LF:   { x: 18, y: 23 },
  CF:   { x: 50, y: 10 },
  RF:   { x: 82, y: 23 },
};

const DEFAULT_ROSTER = [
  { name: 'Emma', canPlay: ['1B', '2B', 'LF', 'CF', 'RF'] },
  { name: 'Bailey', canPlay: ['1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'] },
  { name: 'Cassie', canPlay: ['1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'] },
  { name: 'Dottie', canPlay: ['1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'] },
  { name: 'Georgia', canPlay: ['1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'] },
  { name: 'Harper', canPlay: ['1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'] },
  { name: 'Lexi', canPlay: ['1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'] },
  { name: 'Maddy', canPlay: ['1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'] },
  { name: 'Maisie', canPlay: ['1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'] },
  { name: 'Payton', canPlay: ['1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'] },
  { name: 'Tinley', canPlay: ['1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'] },
];

let roster = loadRoster();
function loadRoster() {
  const saved = JSON.parse(localStorage.getItem('softball_roster') || 'null');
  if (!saved || saved.length === 0) return DEFAULT_ROSTER.map(p => ({ ...p }));
  const oldValues = ['pitcher', 'catcher', 'infield', 'outfield'];
  const hasOldFormat = saved.some(p => p.canPlay.some(v => oldValues.includes(v)));
  if (hasOldFormat) { localStorage.removeItem('softball_roster'); return DEFAULT_ROSTER.map(p => ({ ...p })); }
  return saved;
}

let attendance = JSON.parse(localStorage.getItem('softball_attendance') || '[]');
let lineup = JSON.parse(localStorage.getItem('softball_lineup') || 'null');
let battingOrder = JSON.parse(localStorage.getItem('softball_batting') || '[]');
let currentInning = 0;
let innings = parseInt(localStorage.getItem('softball_innings') || '7');

function save() {
  localStorage.setItem('softball_roster', JSON.stringify(roster));
  localStorage.setItem('softball_attendance', JSON.stringify(attendance));
  localStorage.setItem('softball_lineup', JSON.stringify(lineup));
  localStorage.setItem('softball_batting', JSON.stringify(battingOrder));
  localStorage.setItem('softball_innings', innings.toString());
}

// ---- Theme Toggle ----
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('theme-toggle').textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('softball_theme', theme);
}
const savedTheme = localStorage.getItem('softball_theme') || 'dark';
applyTheme(savedTheme);
document.getElementById('theme-toggle').addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// ---- Innings Config ----
const inningsSelect = document.getElementById('innings-select');
inningsSelect.value = innings.toString();
inningsSelect.addEventListener('change', () => {
  innings = parseInt(inningsSelect.value);
  save();
});

// ---- Tabs ----
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'gameday') renderAttendance();
    if (btn.dataset.tab === 'lineup') renderLineup();
    if (btn.dataset.tab === 'batting') renderBattingOrder();
  });
});

// ---- Roster ----
function renderRoster() {
  const list = document.getElementById('roster-list');
  list.innerHTML = '';
  roster.forEach((p, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <span>${p.name}</span>
        <span class="positions">${p.canPlay.join(', ')}</span>
      </div>
      <div style="display:flex;gap:0.3rem;">
        <button class="edit-btn" data-idx="${i}" style="background:var(--surface-active);font-size:0.75rem;padding:0.2rem 0.5rem;">✎</button>
        <button class="remove-btn" data-idx="${i}">✕</button>
      </div>
    `;
    list.appendChild(li);
  });
  list.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      roster.splice(parseInt(btn.dataset.idx), 1);
      save();
      renderRoster();
    });
  });
  list.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      const p = roster[idx];
      document.getElementById('player-name').value = p.name;
      const checks = document.querySelectorAll('#add-player-form input[type=checkbox]');
      checks.forEach(c => { c.checked = p.canPlay.includes(c.value); });
      const form = document.getElementById('add-player-form');
      form.querySelector('button[type=submit]').textContent = 'Update Player';
      form.dataset.editIdx = idx;
    });
  });
}

document.getElementById('add-player-form').addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('player-name').value.trim();
  if (!name) return;
  const checks = [...e.target.querySelectorAll('input[type=checkbox]:checked')].map(c => c.value);
  if (checks.length === 0) { alert('Select at least one position'); return; }

  const editIdx = e.target.dataset.editIdx;
  if (editIdx !== undefined && editIdx !== '') {
    roster[parseInt(editIdx)] = { name, canPlay: checks };
    delete e.target.dataset.editIdx;
    e.target.querySelector('button[type=submit]').textContent = 'Add Player';
  } else {
    roster.push({ name, canPlay: checks });
  }
  document.getElementById('player-name').value = '';
  e.target.querySelectorAll('input[type=checkbox]').forEach(c => c.checked = false);
  save();
  renderRoster();
});

renderRoster();

// ---- Attendance / Game Day ----
function renderAttendance() {
  const container = document.getElementById('attendance-list');
  container.innerHTML = '';
  if (roster.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted)">Add players to your roster first.</p>';
    return;
  }
  roster.forEach((p, i) => {
    const present = attendance.includes(p.name);
    const row = document.createElement('div');
    row.className = 'attendance-row';
    row.innerHTML = `
      <input type="checkbox" id="att-${i}" ${present ? 'checked' : ''}>
      <label for="att-${i}">${p.name} <span style="color:var(--text-muted);font-size:0.8rem">(${p.canPlay.join(', ')})</span></label>
    `;
    row.querySelector('input').addEventListener('change', e => {
      if (e.target.checked) {
        if (!attendance.includes(p.name)) attendance.push(p.name);
      } else {
        attendance = attendance.filter(n => n !== p.name);
      }
      save();
      renderOverrides();
    });
    container.appendChild(row);
  });

  let overrideDiv = document.getElementById('override-section');
  if (!overrideDiv) {
    overrideDiv = document.createElement('div');
    overrideDiv.id = 'override-section';
    overrideDiv.className = 'override-section';
    container.parentElement.insertBefore(overrideDiv, document.getElementById('generate-lineup-btn'));
  }
  renderOverrides();
}

function renderOverrides() {
  const overrideDiv = document.getElementById('override-section');
  if (!overrideDiv) return;
  const presentPlayers = roster.filter(p => attendance.includes(p.name));
  const pitchers = presentPlayers.filter(p => p.canPlay.includes('P'));
  const catchers = presentPlayers.filter(p => p.canPlay.includes('C'));

  overrideDiv.innerHTML = `
    <h3>Assign Pitcher & Catcher per Inning</h3>
    <p style="color:var(--text-muted);font-size:0.8rem;margin-bottom:0.5rem">Leave blank to auto-assign.</p>
    <div id="pitcher-catcher-grid"></div>
  `;

  const grid = document.getElementById('pitcher-catcher-grid');
  for (let inn = 0; inn < innings; inn++) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:0.5rem;align-items:center;margin-bottom:0.3rem;';
    row.innerHTML = `
      <span style="width:60px;font-size:0.85rem;">Inn ${inn + 1}:</span>
      <select data-role="pitcher" data-inning="${inn}">
        <option value="">Auto P</option>
        ${pitchers.map(p => `<option value="${p.name}">${p.name}</option>`).join('')}
      </select>
      <select data-role="catcher" data-inning="${inn}">
        <option value="">Auto C</option>
        ${catchers.map(p => `<option value="${p.name}">${p.name}</option>`).join('')}
      </select>
    `;
    grid.appendChild(row);
  }
}

function getOverrides() {
  const overrides = [];
  for (let inn = 0; inn < innings; inn++) {
    const pSel = document.querySelector(`select[data-role="pitcher"][data-inning="${inn}"]`);
    const cSel = document.querySelector(`select[data-role="catcher"][data-inning="${inn}"]`);
    overrides.push({
      pitcher: pSel ? pSel.value : '',
      catcher: cSel ? cSel.value : '',
    });
  }
  return overrides;
}

// ---- Lineup Generation ----
document.getElementById('generate-lineup-btn').addEventListener('click', () => {
  const present = roster.filter(p => attendance.includes(p.name));
  if (present.length < 4) { alert('Need at least 4 players checked in.'); return; }
  const overrides = getOverrides();
  lineup = generateLineup(present, overrides);
  // Auto-generate batting order from present players if not set
  const presentNames = present.map(p => p.name);
  battingOrder = presentNames.slice();
  save();
  currentInning = 0;
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
  document.querySelector('[data-tab="lineup"]').classList.add('active');
  document.getElementById('lineup').classList.add('active');
  renderLineup();
});

function generateLineup(players, overrides) {
  const n = players.length;
  const stats = {};
  players.forEach(p => {
    stats[p.name] = { played: 0, infield: 0, outfield: 0, P: 0, C: 0, positions: {} };
    ALL_POSITIONS.forEach(pos => { stats[p.name].positions[pos] = 0; });
  });

  const inningsList = [];

  for (let inn = 0; inn < innings; inn++) {
    const assignment = {};
    const assigned = new Set();

    // Pitcher
    let pitcherName = overrides[inn] ? overrides[inn].pitcher : '';
    if (pitcherName && players.find(p => p.name === pitcherName)) {
      assignment.P = pitcherName;
      assigned.add(pitcherName);
    } else {
      const eligible = players.filter(p => p.canPlay.includes('P') && !assigned.has(p.name));
      if (eligible.length > 0) {
        eligible.sort((a, b) => stats[a.name].P - stats[b.name].P || stats[a.name].played - stats[b.name].played);
        assignment.P = eligible[0].name;
        assigned.add(eligible[0].name);
      }
    }

    // Catcher
    let catcherName = overrides[inn] ? overrides[inn].catcher : '';
    if (catcherName && players.find(p => p.name === catcherName) && !assigned.has(catcherName)) {
      assignment.C = catcherName;
      assigned.add(catcherName);
    } else {
      const eligible = players.filter(p => p.canPlay.includes('C') && !assigned.has(p.name));
      if (eligible.length > 0) {
        eligible.sort((a, b) => stats[a.name].C - stats[b.name].C || stats[a.name].played - stats[b.name].played);
        assignment.C = eligible[0].name;
        assigned.add(eligible[0].name);
      }
    }

    // Fill remaining positions
    const fieldPositions = [...INFIELD_POS, ...OUTFIELD_POS];
    const totalSlots = Math.min(9, n);
    const batteryCount = (assignment.P ? 1 : 0) + (assignment.C ? 1 : 0);
    const remainingSlots = totalSlots - batteryCount;

    const remaining = players.filter(p => !assigned.has(p.name));
    remaining.sort((a, b) => stats[a.name].played - stats[b.name].played);

    const playingThisInning = remaining.slice(0, remainingSlots);
    const bench = remaining.slice(remainingSlots);

    const positionsToFill = fieldPositions.slice(0, remainingSlots);
    const unassignedPlayers = [...playingThisInning];

    function assignmentScore(player, pos) {
      if (!player.canPlay.includes(pos)) return 9999;
      const s = stats[player.name];
      const totalFielded = s.infield + s.outfield || 1;
      const isInfield = INFIELD_POS.includes(pos);
      const ratio = isInfield ? s.infield / totalFielded : s.outfield / totalFielded;
      return ratio * 10 + s.positions[pos];
    }

    const posAssignments = {};
    const usedPlayers = new Set();

    const sortedPositions = positionsToFill.slice().sort((a, b) => {
      const aCount = unassignedPlayers.filter(p => p.canPlay.includes(a)).length;
      const bCount = unassignedPlayers.filter(p => p.canPlay.includes(b)).length;
      return aCount - bCount;
    });

    for (const pos of sortedPositions) {
      const candidates = unassignedPlayers.filter(p => !usedPlayers.has(p.name) && p.canPlay.includes(pos));
      if (candidates.length === 0) {
        const fallback = unassignedPlayers.filter(p => !usedPlayers.has(p.name));
        if (fallback.length > 0) { posAssignments[pos] = fallback[0].name; usedPlayers.add(fallback[0].name); }
        continue;
      }
      candidates.sort((a, b) => assignmentScore(a, pos) - assignmentScore(b, pos));
      posAssignments[pos] = candidates[0].name;
      usedPlayers.add(candidates[0].name);
    }

    Object.assign(assignment, posAssignments);

    for (const [pos, name] of Object.entries(assignment)) {
      if (!stats[name]) continue;
      stats[name].played++;
      stats[name].positions[pos] = (stats[name].positions[pos] || 0) + 1;
      if (pos === 'P') stats[name].P++;
      else if (pos === 'C') stats[name].C++;
      else if (INFIELD_POS.includes(pos)) stats[name].infield++;
      else if (OUTFIELD_POS.includes(pos)) stats[name].outfield++;
    }

    inningsList.push({ assignment, bench: bench.map(p => p.name) });
  }

  return { innings: inningsList, stats };
}

// ---- Lineup Rendering ----
function getAllPresentPlayers() {
  return roster.filter(p => attendance.includes(p.name));
}

function recalcStats() {
  if (!lineup) return;
  const presentPlayers = getAllPresentPlayers();
  const stats = {};
  presentPlayers.forEach(p => {
    stats[p.name] = { played: 0, infield: 0, outfield: 0, P: 0, C: 0, positions: {} };
    ALL_POSITIONS.forEach(pos => { stats[p.name].positions[pos] = 0; });
  });
  for (const inning of lineup.innings) {
    for (const [pos, name] of Object.entries(inning.assignment)) {
      if (!stats[name]) continue;
      stats[name].played++;
      stats[name].positions[pos] = (stats[name].positions[pos] || 0) + 1;
      if (pos === 'P') stats[name].P++;
      else if (pos === 'C') stats[name].C++;
      else if (INFIELD_POS.includes(pos)) stats[name].infield++;
      else if (OUTFIELD_POS.includes(pos)) stats[name].outfield++;
    }
  }
  lineup.stats = stats;
  save();
}

function handlePositionSwap(inningIdx, pos, newName) {
  const inning = lineup.innings[inningIdx];
  const oldName = inning.assignment[pos];
  if (newName === oldName) return;

  if (newName === '') {
    if (oldName) {
      delete inning.assignment[pos];
      if (!inning.bench.includes(oldName)) inning.bench.push(oldName);
    }
  } else {
    const existingPos = Object.entries(inning.assignment).find(([p, n]) => n === newName && p !== pos);
    if (existingPos) {
      if (oldName) { inning.assignment[existingPos[0]] = oldName; }
      else { delete inning.assignment[existingPos[0]]; }
    }
    inning.bench = inning.bench.filter(n => n !== newName);
    if (oldName && !existingPos && oldName !== newName) {
      if (!Object.values(inning.assignment).includes(oldName)) inning.bench.push(oldName);
    }
    inning.assignment[pos] = newName;
  }

  recalcStats();
  renderLineup();
}

function renderLineup() {
  if (!lineup) {
    document.getElementById('inning-nav').innerHTML = '<p style="color:var(--text-muted)">Generate a lineup from the Game Day tab.</p>';
    document.getElementById('field-positions').innerHTML = '';
    document.getElementById('bench-list').innerHTML = '';
    document.getElementById('fairness-summary').innerHTML = '';
    return;
  }

  const nav = document.getElementById('inning-nav');
  nav.innerHTML = '';
  for (let i = 0; i < lineup.innings.length; i++) {
    const btn = document.createElement('button');
    btn.className = 'inning-btn' + (i === currentInning ? ' active' : '');
    btn.textContent = `${i + 1}`;
    btn.addEventListener('click', () => { currentInning = i; renderLineup(); });
    nav.appendChild(btn);
  }

  const inning = lineup.innings[currentInning];
  const allPresent = getAllPresentPlayers().map(p => p.name);

  const posContainer = document.getElementById('field-positions');
  posContainer.innerHTML = '';
  for (const [pos, coords] of Object.entries(FIELD_COORDS)) {
    const currentPlayer = inning.assignment[pos] || '';
    const div = document.createElement('div');
    div.className = 'field-pos';
    div.style.left = coords.x + '%';
    div.style.top = coords.y + '%';

    const options = ['<option value="">—</option>'];
    allPresent.forEach(name => {
      const selected = name === currentPlayer ? ' selected' : '';
      options.push(`<option value="${name}"${selected}>${name}</option>`);
    });

    div.innerHTML = `
      <div class="pos-label">${pos}</div>
      <select class="pos-select" data-pos="${pos}">${options.join('')}</select>
    `;
    div.querySelector('select').addEventListener('change', e => {
      handlePositionSwap(currentInning, pos, e.target.value);
    });
    posContainer.appendChild(div);
  }

  const benchList = document.getElementById('bench-list');
  benchList.innerHTML = '';
  if (inning.bench.length === 0) {
    benchList.innerHTML = '<span style="color:var(--text-muted)">Nobody on the bench</span>';
  } else {
    inning.bench.forEach(name => {
      const span = document.createElement('span');
      span.textContent = name;
      benchList.appendChild(span);
    });
  }

  renderFairness();
}

function renderFairness() {
  if (!lineup) return;
  const container = document.getElementById('fairness-summary');
  const stats = lineup.stats;
  let html = '<h3>Playing Time Summary</h3><table><tr><th>Player</th><th>Inn</th><th>IF</th><th>OF</th><th>P</th><th>C</th></tr>';
  for (const [name, s] of Object.entries(stats)) {
    html += `<tr><td>${name}</td><td>${s.played}</td><td>${s.infield}</td><td>${s.outfield}</td><td>${s.P}</td><td>${s.C}</td></tr>`;
  }
  html += '</table>';
  container.innerHTML = html;
}

// ---- Batting Order (Drag & Drop) ----
let dragSrcIdx = null;

function renderBattingOrder() {
  const list = document.getElementById('batting-list');
  list.innerHTML = '';

  // Sync batting order with present players
  const presentNames = getAllPresentPlayers().map(p => p.name);
  if (presentNames.length === 0) {
    list.innerHTML = '<p style="color:var(--text-muted)">Check in players on the Game Day tab first.</p>';
    return;
  }
  // Keep existing order for players still present, add new ones at end
  battingOrder = battingOrder.filter(n => presentNames.includes(n));
  presentNames.forEach(n => { if (!battingOrder.includes(n)) battingOrder.push(n); });
  save();

  battingOrder.forEach((name, i) => {
    const li = document.createElement('li');
    li.draggable = true;
    li.dataset.idx = i;
    li.innerHTML = `
      <span class="drag-handle">☰</span>
      <span style="flex:1">${name}</span>
      <button class="move-btn" data-dir="up" data-idx="${i}" ${i === 0 ? 'disabled' : ''}>▲</button>
      <button class="move-btn" data-dir="down" data-idx="${i}" ${i === battingOrder.length - 1 ? 'disabled' : ''}>▼</button>
    `;

    li.addEventListener('dragstart', e => {
      dragSrcIdx = i;
      li.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
      list.querySelectorAll('li').forEach(el => el.classList.remove('drag-over'));
    });
    li.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      li.classList.add('drag-over');
    });
    li.addEventListener('dragleave', () => {
      li.classList.remove('drag-over');
    });
    li.addEventListener('drop', e => {
      e.preventDefault();
      li.classList.remove('drag-over');
      const targetIdx = parseInt(li.dataset.idx);
      if (dragSrcIdx === null || dragSrcIdx === targetIdx) return;
      const moved = battingOrder.splice(dragSrcIdx, 1)[0];
      battingOrder.splice(targetIdx, 0, moved);
      save();
      renderBattingOrder();
    });

    // Touch support for mobile
    let touchStartY = 0;
    li.addEventListener('touchstart', e => {
      dragSrcIdx = i;
      touchStartY = e.touches[0].clientY;
      li.classList.add('dragging');
    }, { passive: true });
    li.addEventListener('touchmove', e => {
      e.preventDefault();
      const touch = e.touches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      list.querySelectorAll('li').forEach(el => el.classList.remove('drag-over'));
      if (target && target.closest('#batting-list li')) {
        target.closest('#batting-list li').classList.add('drag-over');
      }
    }, { passive: false });
    li.addEventListener('touchend', e => {
      li.classList.remove('dragging');
      const touch = e.changedTouches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      list.querySelectorAll('li').forEach(el => el.classList.remove('drag-over'));
      if (target && target.closest('#batting-list li')) {
        const targetIdx = parseInt(target.closest('#batting-list li').dataset.idx);
        if (dragSrcIdx !== null && dragSrcIdx !== targetIdx) {
          const moved = battingOrder.splice(dragSrcIdx, 1)[0];
          battingOrder.splice(targetIdx, 0, moved);
          save();
          renderBattingOrder();
        }
      }
    });

    list.appendChild(li);
  });

  // Up/down button handlers
  list.querySelectorAll('.move-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      const dir = btn.dataset.dir;
      if (dir === 'up' && idx > 0) {
        [battingOrder[idx - 1], battingOrder[idx]] = [battingOrder[idx], battingOrder[idx - 1]];
      } else if (dir === 'down' && idx < battingOrder.length - 1) {
        [battingOrder[idx], battingOrder[idx + 1]] = [battingOrder[idx + 1], battingOrder[idx]];
      }
      save();
      renderBattingOrder();
    });
  });
}

// ---- Print / PDF ----
function buildPrintHTML() {
  if (!lineup) return '';
  let html = `
    <html><head><title>Firecracker Field Scheduler</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 1rem; color: #111; }
      h1 { font-size: 1.3rem; margin-bottom: 0.5rem; }
      h2 { font-size: 1rem; margin: 1rem 0 0.3rem; border-bottom: 1px solid #ccc; padding-bottom: 0.2rem; }
      table { border-collapse: collapse; width: 100%; margin-bottom: 0.5rem; font-size: 0.85rem; }
      th, td { border: 1px solid #ccc; padding: 0.25rem 0.5rem; text-align: left; }
      th { background: #eee; font-size: 0.75rem; text-transform: uppercase; }
      .bench { font-size: 0.85rem; color: #555; margin-bottom: 0.5rem; }
      .summary { margin-top: 1rem; }
      .batting { margin-top: 1rem; }
      .batting ol { margin-left: 1.5rem; font-size: 0.85rem; }
      @media print { body { margin: 0.5cm; } }
    </style></head><body>
    <h1>🧨 Firecracker Field Scheduler</h1>
  `;

  for (let i = 0; i < lineup.innings.length; i++) {
    const inn = lineup.innings[i];
    html += `<h2>Inning ${i + 1}</h2><table><tr><th>Position</th><th>Player</th></tr>`;
    for (const pos of ALL_POSITIONS) {
      html += `<tr><td>${pos}</td><td>${inn.assignment[pos] || '—'}</td></tr>`;
    }
    html += '</table>';
    if (inn.bench.length > 0) html += `<div class="bench">Bench: ${inn.bench.join(', ')}</div>`;
  }

  // Batting order
  if (battingOrder.length > 0) {
    html += '<div class="batting"><h2>Batting Order</h2><ol>';
    battingOrder.forEach(name => { html += `<li>${name}</li>`; });
    html += '</ol></div>';
  }

  // Fairness summary
  html += '<div class="summary"><h2>Playing Time Summary</h2><table><tr><th>Player</th><th>Innings</th><th>IF</th><th>OF</th><th>P</th><th>C</th></tr>';
  for (const [name, s] of Object.entries(lineup.stats)) {
    html += `<tr><td>${name}</td><td>${s.played}</td><td>${s.infield}</td><td>${s.outfield}</td><td>${s.P}</td><td>${s.C}</td></tr>`;
  }
  html += '</table></div></body></html>';
  return html;
}

function openPrintView() {
  if (!lineup) { alert('Generate a lineup first.'); return; }
  const w = window.open('', '_blank');
  w.document.write(buildPrintHTML());
  w.document.close();
  w.focus();
  w.print();
}

document.getElementById('print-lineup-btn').addEventListener('click', openPrintView);
document.getElementById('pdf-lineup-btn').addEventListener('click', () => {
  if (!lineup) { alert('Generate a lineup first.'); return; }
  const w = window.open('', '_blank');
  w.document.write(buildPrintHTML());
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
});
document.getElementById('print-batting-btn').addEventListener('click', openPrintView);
document.getElementById('pdf-batting-btn').addEventListener('click', () => {
  if (!lineup) { alert('Generate a lineup first.'); return; }
  const w = window.open('', '_blank');
  w.document.write(buildPrintHTML());
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
});

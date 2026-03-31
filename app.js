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
  // Migrate old format: if any player has old-style values, reset to defaults
  const oldValues = ['pitcher', 'catcher', 'infield', 'outfield'];
  const hasOldFormat = saved.some(p => p.canPlay.some(v => oldValues.includes(v)));
  if (hasOldFormat) {
    localStorage.removeItem('softball_roster');
    return DEFAULT_ROSTER.map(p => ({ ...p }));
  }
  return saved;
}
let attendance = JSON.parse(localStorage.getItem('softball_attendance') || '[]');
let lineup = JSON.parse(localStorage.getItem('softball_lineup') || 'null');
let currentInning = 0;
const INNINGS = 7;

function save() {
  localStorage.setItem('softball_roster', JSON.stringify(roster));
  localStorage.setItem('softball_attendance', JSON.stringify(attendance));
  localStorage.setItem('softball_lineup', JSON.stringify(lineup));
}

// ---- Tabs ----
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'gameday') renderAttendance();
    if (btn.dataset.tab === 'lineup') renderLineup();
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
        <button class="edit-btn" data-idx="${i}" style="background:#0f3460;font-size:0.75rem;padding:0.2rem 0.5rem;">✎</button>
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
      // Temporarily change form to "update" mode
      const form = document.getElementById('add-player-form');
      const submitBtn = form.querySelector('button[type=submit]');
      submitBtn.textContent = 'Update Player';
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
    container.innerHTML = '<p style="color:#aaa">Add players to your roster first.</p>';
    return;
  }
  roster.forEach((p, i) => {
    const present = attendance.includes(p.name);
    const row = document.createElement('div');
    row.className = 'attendance-row';
    row.innerHTML = `
      <input type="checkbox" id="att-${i}" ${present ? 'checked' : ''}>
      <label for="att-${i}">${p.name} <span style="color:#aaa;font-size:0.8rem">(${p.canPlay.join(', ')})</span></label>
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
    <p style="color:#aaa;font-size:0.8rem;margin-bottom:0.5rem">Leave blank to auto-assign. You can assign different players per inning.</p>
    <div id="pitcher-catcher-grid"></div>
  `;

  const grid = document.getElementById('pitcher-catcher-grid');
  for (let inn = 0; inn < INNINGS; inn++) {
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
  for (let inn = 0; inn < INNINGS; inn++) {
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
  if (present.length < 4) {
    alert('Need at least 4 players checked in.');
    return;
  }
  const overrides = getOverrides();
  lineup = generateLineup(present, overrides);
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

  const innings = [];

  for (let inn = 0; inn < INNINGS; inn++) {
    const assignment = {};
    const assigned = new Set();

    // 1. Pitcher override or auto
    let pitcherName = overrides[inn].pitcher;
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

    // 2. Catcher override or auto
    let catcherName = overrides[inn].catcher;
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

    // 3. Fill remaining 7 field positions (1B, 2B, 3B, SS, LF, CF, RF)
    const fieldPositions = [...INFIELD_POS, ...OUTFIELD_POS];
    const totalSlots = Math.min(9, n);
    const batteryCount = (assignment.P ? 1 : 0) + (assignment.C ? 1 : 0);
    const remainingSlots = totalSlots - batteryCount;

    // Get remaining players sorted by fewest innings played
    const remaining = players.filter(p => !assigned.has(p.name));
    remaining.sort((a, b) => stats[a.name].played - stats[b.name].played);

    const playingThisInning = remaining.slice(0, remainingSlots);
    const bench = remaining.slice(remainingSlots);

    // Assign players to specific positions using a greedy approach
    // that respects canPlay and balances infield/outfield time
    const positionsToFill = fieldPositions.slice(0, remainingSlots);
    const unassignedPlayers = [...playingThisInning];

    // Score: for each (player, position) pair, compute a desirability score
    // Lower score = better assignment
    // Considers: can they play it? how much IF/OF have they had? how many times at this exact position?
    function assignmentScore(player, pos) {
      if (!player.canPlay.includes(pos)) return 9999;
      const s = stats[player.name];
      const totalFielded = s.infield + s.outfield || 1;
      const isInfield = INFIELD_POS.includes(pos);
      const ratio = isInfield ? s.infield / totalFielded : s.outfield / totalFielded;
      // Prefer assigning to the type they've played less of
      return ratio * 10 + s.positions[pos];
    }

    // Greedy assignment: iterate positions, pick best available player
    // Do two passes: first assign players who can only play limited positions
    const posAssignments = {};
    const usedPlayers = new Set();

    // Sort positions by how many available players can fill them (most constrained first)
    const sortedPositions = positionsToFill.slice().sort((a, b) => {
      const aCount = unassignedPlayers.filter(p => p.canPlay.includes(a)).length;
      const bCount = unassignedPlayers.filter(p => p.canPlay.includes(b)).length;
      return aCount - bCount;
    });

    for (const pos of sortedPositions) {
      const candidates = unassignedPlayers.filter(p => !usedPlayers.has(p.name) && p.canPlay.includes(pos));
      if (candidates.length === 0) {
        // Fallback: assign anyone not used
        const fallback = unassignedPlayers.filter(p => !usedPlayers.has(p.name));
        if (fallback.length > 0) {
          posAssignments[pos] = fallback[0].name;
          usedPlayers.add(fallback[0].name);
        }
        continue;
      }
      candidates.sort((a, b) => assignmentScore(a, pos) - assignmentScore(b, pos));
      posAssignments[pos] = candidates[0].name;
      usedPlayers.add(candidates[0].name);
    }

    Object.assign(assignment, posAssignments);

    // Update stats
    for (const [pos, name] of Object.entries(assignment)) {
      if (!stats[name]) continue;
      stats[name].played++;
      stats[name].positions[pos] = (stats[name].positions[pos] || 0) + 1;
      if (pos === 'P') stats[name].P++;
      else if (pos === 'C') stats[name].C++;
      else if (INFIELD_POS.includes(pos)) stats[name].infield++;
      else if (OUTFIELD_POS.includes(pos)) stats[name].outfield++;
    }

    innings.push({
      assignment,
      bench: bench.map(p => p.name),
    });
  }

  return { innings, stats };
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
    // Move current player to bench
    if (oldName) {
      delete inning.assignment[pos];
      if (!inning.bench.includes(oldName)) inning.bench.push(oldName);
    }
  } else {
    // Check if newName is already assigned to another position this inning
    const existingPos = Object.entries(inning.assignment).find(([p, n]) => n === newName && p !== pos);
    if (existingPos) {
      // Swap: put old player in the other position
      if (oldName) {
        inning.assignment[existingPos[0]] = oldName;
      } else {
        delete inning.assignment[existingPos[0]];
      }
    }
    // If newName was on bench, remove from bench
    inning.bench = inning.bench.filter(n => n !== newName);
    // If old player is displaced and not swapped, bench them
    if (oldName && !existingPos && oldName !== newName) {
      if (!Object.values(inning.assignment).includes(oldName)) {
        inning.bench.push(oldName);
      }
    }
    inning.assignment[pos] = newName;
  }

  recalcStats();
  renderLineup();
}

function renderLineup() {
  if (!lineup) {
    document.getElementById('inning-nav').innerHTML = '<p style="color:#aaa">Generate a lineup from the Game Day tab.</p>';
    document.getElementById('field-positions').innerHTML = '';
    document.getElementById('bench-list').innerHTML = '';
    document.getElementById('fairness-summary').innerHTML = '';
    return;
  }

  const nav = document.getElementById('inning-nav');
  nav.innerHTML = '';
  for (let i = 0; i < INNINGS; i++) {
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
    benchList.innerHTML = '<span style="color:#aaa">Nobody on the bench</span>';
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

// ---- Print / PDF ----
function buildPrintHTML() {
  if (!lineup) return '';
  const present = getAllPresentPlayers().map(p => p.name);
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
      .summary { page-break-before: auto; margin-top: 1rem; }
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
    if (inn.bench.length > 0) {
      html += `<div class="bench">Bench: ${inn.bench.join(', ')}</div>`;
    }
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
  const printWindow = window.open('', '_blank');
  printWindow.document.write(buildPrintHTML());
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

document.getElementById('print-lineup-btn').addEventListener('click', openPrintView);
document.getElementById('pdf-lineup-btn').addEventListener('click', () => {
  if (!lineup) { alert('Generate a lineup first.'); return; }
  const printWindow = window.open('', '_blank');
  printWindow.document.write(buildPrintHTML());
  printWindow.document.close();
  printWindow.focus();
  // Small delay to let content render before print dialog
  setTimeout(() => printWindow.print(), 300);
});

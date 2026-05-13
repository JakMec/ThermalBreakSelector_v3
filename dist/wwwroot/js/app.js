// ── State ─────────────────────────────────────────────────────────────────
let tableRows = [];
let nextId = 1;
let editingRowId = null;
let currentSupport = 'slab-slab';
let currentInsulation = 'iso80';
let currentBreakType = 'ebea';
let crossbarActive = false;
let loadDirs = { bm: 'negBm', sl: 'posSl' };
let productDatabase = [];
let selectedProductRow = null;

// ── Init ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    initDropdowns();
    setSupport(currentSupport);
    selectInsulation(currentInsulation);
    selectBreakType(currentBreakType);
    setLoadDir('bm', loadDirs.bm);
    setLoadDir('sl', loadDirs.sl);
    renderTable();
    await loadDatabase();
});

async function loadDatabase() {
    try {
        const res = await fetch('/api/database');
        productDatabase = await res.json();
    } catch (e) {
        console.error('Failed to load product database:', e);
    }
}

function initDropdowns() {
    const insOpts = range(0, 70, 5).map(v => ({ value: v, label: String(v) }));
    populateSelect('extra-ins-top', insOpts);
    populateSelect('extra-ins-bottom', insOpts);
    updateConnectorHeight();
    updateConcreteCover();
}

function updateConnectorHeight() {
    const opts = currentBreakType === 'ebea'
        ? range(160, 300, 20).map(v => ({ value: v, label: String(v) }))
        : range(160, 250, 10).map(v => ({ value: v, label: String(v) }));
    populateSelect('connector-height', opts);
}

function range(from, to, step) {
    const arr = [];
    for (let v = from; v <= to; v += step) arr.push(v);
    return arr;
}

function populateSelect(id, items) {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = '';
    items.forEach(({ value, label }) => {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = label;
        sel.appendChild(opt);
    });
}

// ── Concrete cover ────────────────────────────────────────────────────────
function updateConcreteCover() {
    let opts;
    if (currentBreakType === 'tebea') {
        opts = currentSupport === 'horizontal'
            ? [{ value: 35, label: '35' }]
            : [{ value: 35, label: '35' }, { value: 55, label: '55' }];
    } else {
        opts = currentSupport === 'slab-slab'
            ? [{ value: 30, label: '30' }, { value: 45, label: '45' }]
            : [{ value: 30, label: '30' }];
    }
    populateSelect('concrete-cover', opts);
}

// ── EBEA-only fields ──────────────────────────────────────────────────────
function updateEbeaOnlyFields() {
    const ebea = currentBreakType === 'ebea';
    setSelectDisabled('extra-ins-top', !ebea);
    setSelectDisabled('extra-ins-bottom', !ebea);
    const crossbarRow = document.getElementById('crossbar-row');
    if (crossbarRow) crossbarRow.classList.toggle('opacity-40', !ebea);
    const crossbarEl = document.getElementById('crossbar-track');
    if (crossbarEl) crossbarEl.closest('[onclick]')?.toggleAttribute('disabled', !ebea);
    if (!ebea) {
        document.getElementById('extra-ins-top').value = 0;
        document.getElementById('extra-ins-bottom').value = 0;
        if (crossbarActive) toggleCrossbar();
    }
}

function setSelectDisabled(id, disabled) {
    const el = document.getElementById(id);
    if (!el) return;
    el.disabled = disabled;
    el.classList.toggle('opacity-40', disabled);
    el.classList.toggle('cursor-not-allowed', disabled);
}

// ── Anchorage length ──────────────────────────────────────────────────────
function updateAnchorageLength() {
    const slider = document.getElementById('anchorage-length');
    const valDisplay = document.getElementById('anchorage-length-val');
    if (!slider) return;
    const enabled = currentSupport === 'slab-wall';
    slider.disabled = !enabled;
    if (enabled) {
        const min = currentBreakType === 'ebea' ? 120 : 145;
        slider.min = min;
        slider.max = 220;
        slider.step = 5;
        slider.value = 145;
        if (valDisplay) valDisplay.textContent = '145';
    }
}

// ── Type of support ───────────────────────────────────────────────────────
function setSupport(type) {
    currentSupport = type;
    ['slab-slab', 'slab-wall', 'horizontal'].forEach(t => {
        const btn = document.getElementById(`support-${t}`);
        if (!btn) return;
        const active = t === type;
        btn.classList.toggle('border-teal-500', active);
        btn.classList.toggle('border-2', active);
        btn.classList.toggle('bg-teal-500', active);
        btn.classList.toggle('text-white', active);
        btn.classList.toggle('border-gray-300', !active);
        btn.classList.toggle('bg-white', !active);
        btn.classList.toggle('text-gray-600', !active);
    });
    onTypeOfSupportChange();
}

function onTypeOfSupportChange() {
    const isHoriz = currentSupport === 'horizontal';
    setInputDisabled('bending-moment', isHoriz);
    setInputDisabled('shear-load', isHoriz);
    setInputDisabled('horizontal-load', !isHoriz);
    setSelectDisabled('concrete-cover', isHoriz);
    if (isHoriz) {
        document.getElementById('bending-moment').value = '';
        document.getElementById('shear-load').value = '';
    } else {
        document.getElementById('horizontal-load').value = '';
    }
    updateConcreteCover();
    updateAnchorageLength();
    updateConnectorLengths();
    clearSelection();
}

function setInputDisabled(id, disabled) {
    const el = document.getElementById(id);
    if (!el) return;
    el.disabled = disabled;
    el.classList.toggle('bg-gray-100', disabled);
    el.classList.toggle('text-gray-400', disabled);
    el.classList.toggle('cursor-not-allowed', disabled);
    el.classList.toggle('bg-white', !disabled);
    el.classList.toggle('text-gray-900', !disabled);
}

function updateConnectorLengths(productRow) {
    const sel = document.getElementById('connector-length');
    if (!sel) return;
    if (!productRow) {
        sel.innerHTML = '<option value="">—</option>';
        return;
    }
    const minLen = Number(productRow['minLength']) || 0;
    const maxLen = Number(productRow['ProductLength']) || 0;
    const step = currentBreakType === 'tebea' ? 500 : 50;
    const opts = [];
    for (let v = minLen; v <= maxLen; v += step) {
        opts.push({ value: v, label: String(v) });
    }
    if (!opts.length) opts.push({ value: maxLen, label: String(maxLen) });
    populateSelect('connector-length', opts);
    sel.value = maxLen;
}

// ── Load direction toggles ─────────────────────────────────────────────────
const DIR_BTNS = {
    bm: { negBm: 'btn-bm-negBm', posNegBm: 'btn-bm-posNegBm' },
    sl: { posSl: 'btn-sl-posSl', posNegSl: 'btn-sl-posNegSl' },
};

function setLoadDir(load, dir) {
    loadDirs[load] = dir;
    if (load === 'bm' && dir === 'posNegBm') setLoadDir('sl', 'posNegSl');
    Object.entries(DIR_BTNS[load]).forEach(([d, id]) => {
        const el = document.getElementById(id);
        if (!el) return;
        const active = d === dir;
        el.classList.toggle('bg-teal-500', active);
        el.classList.toggle('border-teal-500', active);
        el.classList.toggle('text-white', active);
        el.classList.toggle('border-gray-300', !active);
        el.classList.toggle('text-gray-500', !active);
        el.classList.toggle('bg-white', !active);
    });
}

// ── Insulation / break type toggles ──────────────────────────────────────
function selectInsulation(type) {
    currentInsulation = type;
    setPairToggle('btn-iso80', 'btn-iso120', type === 'iso80');
    const tebeaBtn = document.getElementById('btn-tebea');
    if (tebeaBtn) {
        const disable = type === 'iso80';
        tebeaBtn.disabled = disable;
        tebeaBtn.classList.toggle('opacity-40', disable);
        tebeaBtn.classList.toggle('cursor-not-allowed', disable);
    }
    if (type === 'iso80' && currentBreakType === 'tebea') selectBreakType('ebea');
    clearSelection();
}

function selectBreakType(type) {
    currentBreakType = type;
    setPairToggle('btn-ebea', 'btn-tebea', type === 'ebea');
    updateConnectorHeight();
    updateConcreteCover();
    updateAnchorageLength();
    updateEbeaOnlyFields();
    clearSelection();
}

function setPairToggle(idA, idB, aActive) {
    [[idA, aActive], [idB, !aActive]].forEach(([id, active]) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.toggle('bg-teal-500', active);
        el.classList.toggle('border-teal-500', active);
        el.classList.toggle('text-white', active);
        el.classList.toggle('bg-white', !active);
        el.classList.toggle('border-gray-300', !active);
        el.classList.toggle('text-gray-700', !active);
    });
}

function clearSelection() {
    selectedProductRow = null;
    const sel = document.getElementById('selected-type');
    if (sel) { sel.innerHTML = '<option value="">Select</option>'; }
    updateConnectorLengths(null);
}

// ── Crossbar toggle ───────────────────────────────────────────────────────
function toggleCrossbar() {
    if (currentBreakType !== 'ebea') return;
    crossbarActive = !crossbarActive;
    document.getElementById('crossbar-track').classList.toggle('bg-teal-500', crossbarActive);
    document.getElementById('crossbar-track').classList.toggle('bg-gray-300', !crossbarActive);
    document.getElementById('crossbar-knob').classList.toggle('translate-x-5', crossbarActive);
}

// ── Product selection ─────────────────────────────────────────────────────
function selectProduct() {
    if (!productDatabase.length) {
        alert('Database not yet loaded, please try again.');
        return;
    }

    const height = parseInt(document.getElementById('connector-height').value);
    const coverVal = parseInt(document.getElementById('concrete-cover').value);
    const concreteClass = document.getElementById('concrete-grade').value;
    const concreteStrength = concreteClass === 'C20/25' ? 20 : concreteClass === 'C25/30' ? 25 : 30;
    const insThickness = currentInsulation === 'iso80' ? 80 : 120;

    const csvSupport = currentSupport === 'slab-slab' ? 'Slab-to-Slab'
        : currentSupport === 'slab-wall' ? 'Slab-to-Wall'
        : 'Horizontal El.';

    const doubleMoment = loadDirs.bm === 'posNegBm';
    const doubleShear = loadDirs.sl === 'posNegSl';

    const bendingMoment = parseFloat(document.getElementById('bending-moment').value) || 0;
    const shearLoad = parseFloat(document.getElementById('shear-load').value) || 0;
    const horizontalLoad = parseFloat(document.getElementById('horizontal-load').value) || 0;
    const maxUtil = parseFloat(document.getElementById('max-utilization').value) / 100;
    const anchorageLength = parseInt(document.getElementById('anchorage-length').value) || 0;

    // Step 1 — exact-match filter
    // Horizontal products always have TopCover=0 in the DB — skip that filter for horizontal
    const isHoriz = currentSupport === 'horizontal';
    let candidates = productDatabase.filter(p =>
        p['Type'] === csvSupport &&
        Number(p['Height']) === height &&
        Number(p['f__ck']) === concreteStrength &&
        (isHoriz || Number(p['TopCover']) === coverVal) &&
        String(p['ProductFamily']).toUpperCase() === currentBreakType.toUpperCase() &&
        Number(p['InsThickness']) === insThickness
    );

    // Step 2 — DoubleMoment / DoubleShear flags (only for non-horizontal)
    if (currentSupport !== 'horizontal') {
        candidates = candidates.filter(p =>
            Boolean(p['DoubleMoment']) === doubleMoment &&
            Boolean(p['DoubleShear']) === doubleShear
        );
    }

    // Step 3 — load-capacity filter
    candidates = candidates.filter(p => {
        const util = calcUtilization(p, bendingMoment, shearLoad, horizontalLoad);
        if (util === null || util > maxUtil) return false;

        if (currentSupport === 'horizontal') {
            const hRd = numOrNull(p['HRd']);
            return hRd !== null && hRd / 1000 >= horizontalLoad;
        }

        const mRdNeg = numOrNull(p['MRdNeg']);
        const mRdPos = numOrNull(p['MRdPos']);
        const vRdPos = numOrNull(p['VRdPos']);
        const vRdNeg = numOrNull(p['VRdNeg']);
        const vRdMax = numOrNull(p['VRdMax']);

        if (mRdNeg === null || mRdPos === null || vRdPos === null || vRdNeg === null || vRdMax === null)
            return false;

        const bmCheck = bendingMoment === 0
            ? mRdPos === 0 && mRdNeg === 0
            : mRdNeg / 1e6 <= bendingMoment && mRdPos / 1e6 >= bendingMoment;

        const basicCheck =
            bmCheck &&
            vRdPos / 1000 >= shearLoad &&
            vRdNeg / 1000 <= shearLoad &&
            vRdMax / 1000 >= shearLoad;

        if (!basicCheck) return false;

        if (currentSupport === 'slab-wall' && currentBreakType === 'ebea') {
            const dbAncho = numOrNull(p['AnchoLength']);
            if (dbAncho === null) return false;
            return anchorageLength >= dbAncho;
        }

        return true;
    });

    const sel = document.getElementById('selected-type');
    if (!candidates.length) {
        sel.innerHTML = '<option value="">no model available</option>';
        selectedProductRow = null;
        updateConnectorLengths(null);
        return;
    }

    sel.innerHTML = '';
    candidates.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p['ProductType'];
        opt.textContent = p['ProductType'];
        opt.dataset.rowIdx = productDatabase.indexOf(p);
        sel.appendChild(opt);
    });

    onSelectedTypeChange();
}

function calcUtilization(p, bm, sl, hl) {
    if (currentSupport === 'horizontal') {
        const hRd = numOrNull(p['HRd']);
        if (!hRd) return null;
        return hl / (hRd / 1000);
    }
    const mRdNeg = numOrNull(p['MRdNeg']);
    const mRdPos = numOrNull(p['MRdPos']);
    const vRdPos = numOrNull(p['VRdPos']);
    const vRdNeg = numOrNull(p['VRdNeg']);
    if (mRdNeg === null || mRdPos === null || vRdPos === null || vRdNeg === null) return null;
    const ratios = [];
    if (mRdNeg !== 0) ratios.push(bm / (mRdNeg / 1e6));
    if (mRdPos !== 0) ratios.push(bm / (mRdPos / 1e6));
    if (vRdPos !== 0) ratios.push(sl / (vRdPos / 1000));
    if (vRdNeg !== 0) ratios.push(sl / (vRdNeg / 1000));
    return ratios.length ? Math.max(...ratios) : 0;
}

function numOrNull(v) {
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
}

function onSelectedTypeChange() {
    const sel = document.getElementById('selected-type');
    if (!sel) return;
    const opt = sel.options[sel.selectedIndex];
    if (!opt || opt.dataset.rowIdx === undefined) {
        selectedProductRow = null;
        updateConnectorLengths(null);
        return;
    }
    selectedProductRow = productDatabase[parseInt(opt.dataset.rowIdx)];
    updateConnectorLengths(selectedProductRow);
}

// ── Add to list ───────────────────────────────────────────────────────────
function addToList() {
    const position    = document.getElementById('position-name').value.trim();
    const length      = parseInt(document.getElementById('connector-length').value) || 0;
    const quantity    = Math.max(1, parseInt(document.getElementById('quantity').value) || 1);
    const selectedType = document.getElementById('selected-type').value;

    if (!selectedType || selectedType === 'Select' || selectedType === 'no model available') return;

    const anchorage    = parseInt(document.getElementById('anchorage-length').value) || 0;
    const extraTop     = parseInt(document.getElementById('extra-ins-top').value) || 0;
    const extraBottom  = parseInt(document.getElementById('extra-ins-bottom').value) || 0;
    const height       = parseInt(document.getElementById('connector-height').value) || 0;

    const connector = buildProductCode(selectedType, length, anchorage, extraTop, extraBottom, height);

    const p = selectedProductRow;
    const bm = parseFloat(document.getElementById('bending-moment').value) || 0;
    const sl = parseFloat(document.getElementById('shear-load').value) || 0;
    const hl = parseFloat(document.getElementById('horizontal-load').value) || 0;

    const mRdNeg = p ? numOrNull(p['MRdNeg']) : null;
    const mRdPos = p ? numOrNull(p['MRdPos']) : null;
    const vRdPos = p ? numOrNull(p['VRdPos']) : null;
    const vRdNeg = p ? numOrNull(p['VRdNeg']) : null;
    const hRd    = p ? numOrNull(p['HRd'])    : null;
    const stiff  = p ? numOrNull(p['SpringStiff']) : null;

    const mRdDisplay = loadDirs.bm === 'negBm'
        ? (mRdNeg !== null ? round2(mRdNeg / 1e6) : null)
        : (mRdPos !== null && mRdNeg !== null ? round2(Math.min(Math.abs(mRdNeg / 1e6), mRdPos / 1e6)) : null);

    const vRdDisplay = loadDirs.sl === 'posSl'
        ? (vRdPos !== null ? round2(vRdPos / 1000) : null)
        : (vRdPos !== null && vRdNeg !== null ? round2(Math.min(vRdPos / 1000, Math.abs(vRdNeg / 1000))) : null);

    const hRdDisplay = hRd !== null ? round2(hRd / 1000) : null;
    const stiffDisplay = stiff !== null ? round2(stiff) : null;

    const etaM = mRdDisplay && mRdDisplay !== 0 ? round2(bm / mRdDisplay) : null;
    const etaV = vRdDisplay && vRdDisplay !== 0 ? round2(sl / vRdDisplay) : null;
    const etaH = hRdDisplay && hRdDisplay !== 0 ? round2(hl / hRdDisplay) : null;

    tableRows.push({
        id: nextId++,
        position: position || '—',
        connector,
        length,
        quantity,
        mEd: currentSupport !== 'horizontal' ? round2(bm) : null,
        mRd: currentSupport !== 'horizontal' ? mRdDisplay : null,
        etaM: currentSupport !== 'horizontal' ? etaM : null,
        vEd: currentSupport !== 'horizontal' ? round2(sl) : null,
        vRd: currentSupport !== 'horizontal' ? vRdDisplay : null,
        etaV: currentSupport !== 'horizontal' ? etaV : null,
        hEd: currentSupport === 'horizontal' ? round2(hl) : null,
        hRd: currentSupport === 'horizontal' ? hRdDisplay : null,
        etaH: currentSupport === 'horizontal' ? etaH : null,
        stiffness: stiffDisplay,
    });
    renderTable();
}

function buildProductCode(selectedType, length, anchorage, extraTop, extraBottom, height) {
    if (currentBreakType === 'tebea') {
        let code = `${selectedType}-L${length}`;
        if (currentSupport === 'slab-wall') code += `-LR${anchorage}`;
        return code;
    }
    const totalHeight = height + extraTop + extraBottom;
    let code = `${selectedType} Dt${totalHeight}`;
    if (extraTop > 0) code += ` +IO${extraTop}`;
    if (extraBottom > 0) code += ` +IU${extraBottom}`;
    code += ` SW${currentInsulation === 'iso80' ? 80 : 120}`;
    code += ` L${length}`;
    if (currentSupport === 'slab-wall') code += ` S11=${anchorage}`;
    code += ' REI120';
    if (!crossbarActive) code += ' OQ';
    return code;
}

function round2(v) {
    return Math.round(v * 100) / 100;
}

// ── Table rendering ───────────────────────────────────────────────────────
function renderTable() {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';
    tableRows.forEach((row, idx) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50';
        tr.innerHTML = `
            <td class="border border-gray-200 px-2 py-1 text-center">
                <input type="checkbox" class="row-cb cursor-pointer" data-id="${row.id}">
            </td>
            <td class="border border-gray-200 px-3 py-1 text-gray-500">${idx + 1}.</td>
            <td class="border border-gray-200 px-3 py-1">${esc(row.position)}</td>
            <td class="border border-gray-200 px-3 py-1">${esc(row.connector)}</td>
            <td class="border border-gray-200 px-3 py-1 text-right">${row.length}</td>
            <td class="border border-gray-200 px-3 py-1 text-right">${row.quantity}</td>
            <td class="border border-gray-200 px-2 py-1 text-center">
                <button onclick="openEditModal(${row.id})"
                        class="border border-gray-300 rounded px-2 py-0.5 hover:bg-gray-100 text-xs">Edit</button>
            </td>
            <td class="border border-gray-200 px-3 py-1 text-right text-gray-400">${fmt(row.mEd)}</td>
            <td class="border border-gray-200 px-3 py-1 text-right text-gray-400">${fmt(row.mRd)}</td>
            <td class="border border-gray-200 px-3 py-1 text-center text-gray-400">${fmt(row.etaM)}</td>
            <td class="border border-gray-200 px-3 py-1 text-right text-gray-400">${fmt(row.vEd)}</td>
            <td class="border border-gray-200 px-3 py-1 text-right text-gray-400">${fmt(row.vRd)}</td>
            <td class="border border-gray-200 px-3 py-1 text-center text-gray-400">${fmt(row.etaV)}</td>
            <td class="border border-gray-200 px-3 py-1 text-right text-gray-400">${fmt(row.hEd)}</td>
            <td class="border border-gray-200 px-3 py-1 text-right text-gray-400">${fmt(row.hRd)}</td>
            <td class="border border-gray-200 px-3 py-1 text-center text-gray-400">${fmt(row.etaH)}</td>
            <td class="border border-gray-200 px-3 py-1 text-right text-gray-400">${fmt(row.stiffness)}</td>`;
        tbody.appendChild(tr);
    });
    const selectAll = document.getElementById('select-all');
    if (selectAll) selectAll.checked = false;
}

function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmt(v) { return v != null ? v : ''; }

// ── Select all ────────────────────────────────────────────────────────────
function toggleSelectAll(checked) {
    document.querySelectorAll('.row-cb').forEach(cb => { cb.checked = checked; });
}

// ── Edit modal ────────────────────────────────────────────────────────────
function openEditModal(id) {
    const row = tableRows.find(r => r.id === id);
    if (!row) return;
    editingRowId = id;
    document.getElementById('edit-position').value = row.position === '—' ? '' : row.position;
    document.getElementById('edit-quantity').value = row.quantity;
    document.getElementById('edit-modal').classList.remove('hidden');
}

function closeEditModal() {
    editingRowId = null;
    document.getElementById('edit-modal').classList.add('hidden');
}

function saveEdit() {
    if (editingRowId === null) return;
    const row = tableRows.find(r => r.id === editingRowId);
    if (!row) return;
    row.position = document.getElementById('edit-position').value.trim() || '—';
    row.quantity = Math.max(1, parseInt(document.getElementById('edit-quantity').value) || 1);
    closeEditModal();
    renderTable();
}

// ── Delete ────────────────────────────────────────────────────────────────
function deleteSelected() {
    const ids = new Set(
        [...document.querySelectorAll('.row-cb:checked')].map(cb => parseInt(cb.dataset.id))
    );
    if (!ids.size) return;
    tableRows = tableRows.filter(r => !ids.has(r.id));
    renderTable();
}

// ── Export CSV ────────────────────────────────────────────────────────────
function exportCSV() {
    const v = id => document.getElementById(id)?.value?.trim() ?? '';
    const date = new Date().toLocaleDateString();

    const projectMeta = [
        ['Designer', '', 'Project', ''],
        ['Company:', v('proj-designer-company'), 'Company:', v('proj-company')],
        ['Address:', v('proj-designer-address'), 'Location:', v('proj-location')],
        ['Phone:',   v('proj-designer-phone'),   'Contact person:', v('proj-contact')],
        ['Name:',    v('proj-designer-name'),     'Comments:', v('proj-comments')],
        ['Email:',   v('proj-designer-email'),    'Date:', date],
        [],
    ];

    const headers = [
        'No.', 'Position', 'Connector', 'Length [mm]', 'Quantity [pcs]',
        'mEd [kNm/m]', 'mRd [kNm/m]', 'ηm',
        'vEd [kN/m]', 'vRd [kN/m]', 'ηV',
        'HEd [kN]', 'HRd [kN]', 'ηH', 'Stiffness [kNm/rad/m]',
    ];
    const rows = tableRows.map((r, i) => [
        i + 1, r.position, r.connector, r.length, r.quantity,
        r.mEd ?? '', r.mRd ?? '', r.etaM ?? '',
        r.vEd ?? '', r.vRd ?? '', r.etaV ?? '',
        r.hEd ?? '', r.hRd ?? '', r.etaH ?? '', r.stiffness ?? '',
    ]);

    downloadText(
        [...projectMeta, headers, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n'),
        'thermal-break-selection.csv', 'text/csv;charset=utf-8'
    );
}

function csvCell(v) {
    const s = String(v ?? '');
    return (s.includes(',') || s.includes('"') || s.includes('\n'))
        ? `"${s.replace(/"/g, '""')}"` : s;
}

// ── Import CSV ────────────────────────────────────────────────────────────
function importCSV() { document.getElementById('csv-file-input').click(); }

function handleCSVImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        const lines = e.target.result.split(/\r?\n/).filter(l => l.trim());
        for (let i = 1; i < lines.length; i++) {
            const cols = parseCSVLine(lines[i]);
            if (cols.length < 5) continue;
            tableRows.push({
                id: nextId++,
                position: cols[1] || '—',
                connector: cols[2] || '',
                length: parseInt(cols[3]) || 0,
                quantity: Math.max(1, parseInt(cols[4]) || 1),
                mEd: null, mRd: null, etaM: null,
                vEd: null, vRd: null, etaV: null,
                hEd: null, hRd: null, etaH: null,
                stiffness: null,
            });
        }
        renderTable();
        event.target.value = '';
    };
    reader.readAsText(file);
}

function parseCSVLine(line) {
    const result = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
            if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
            else inQ = !inQ;
        } else if (c === ',' && !inQ) {
            result.push(cur.trim()); cur = '';
        } else cur += c;
    }
    result.push(cur.trim());
    return result;
}

// ── Save as JSON ──────────────────────────────────────────────────────────
function saveAsJSON() {
    const v = id => document.getElementById(id)?.value ?? '';
    downloadText(JSON.stringify({
        globalInputs: {
            typeOfSupport: currentSupport,
            bendingMoment: v('bending-moment'), bmDir: loadDirs.bm,
            shearLoad: v('shear-load'), slDir: loadDirs.sl,
            horizontalLoad: v('horizontal-load'),
            connectorHeight: v('connector-height'),
            concreteGrade: v('concrete-grade'),
            thermalInsulation: currentInsulation,
            breakType: currentBreakType,
            concreteCover: v('concrete-cover'),
            maxUtilization: v('max-utilization'),
        },
        projectSettings: {
            designerCompany: v('proj-designer-company'),
            designerAddress: v('proj-designer-address'),
            designerPhone: v('proj-designer-phone'),
            designerName: v('proj-designer-name'),
            designerEmail: v('proj-designer-email'),
            projectCompany: v('proj-company'),
            projectLocation: v('proj-location'),
            projectContact: v('proj-contact'),
            projectComments: v('proj-comments'),
        },
        tableRows,
    }, null, 2), 'thermal-break-project.json', 'application/json');
}

// ── Open / load JSON ──────────────────────────────────────────────────────
function openFile() { document.getElementById('json-file-input').click(); }

function handleJSONLoad(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            const setV = (id, val) => {
                if (val !== undefined && val !== null && val !== '') {
                    const el = document.getElementById(id);
                    if (el) el.value = val;
                }
            };
            const g = data.globalInputs || {};
            if (g.typeOfSupport) setSupport(g.typeOfSupport);
            setV('bending-moment', g.bendingMoment);
            setV('shear-load', g.shearLoad);
            setV('horizontal-load', g.horizontalLoad);
            if (g.bmDir) setLoadDir('bm', g.bmDir);
            if (g.slDir) setLoadDir('sl', g.slDir);
            setV('connector-height', g.connectorHeight);
            setV('concrete-grade', g.concreteGrade);
            if (g.thermalInsulation) selectInsulation(g.thermalInsulation);
            if (g.breakType) selectBreakType(g.breakType);
            setV('concrete-cover', g.concreteCover);
            setV('max-utilization', g.maxUtilization);

            const p = data.projectSettings || {};
            setV('proj-designer-company', p.designerCompany);
            setV('proj-designer-address', p.designerAddress);
            setV('proj-designer-phone', p.designerPhone);
            setV('proj-designer-name', p.designerName);
            setV('proj-designer-email', p.designerEmail);
            setV('proj-company', p.projectCompany);
            setV('proj-location', p.projectLocation);
            setV('proj-contact', p.projectContact);
            setV('proj-comments', p.projectComments);

            if (Array.isArray(data.tableRows)) {
                tableRows = data.tableRows;
                nextId = (tableRows.length ? Math.max(...tableRows.map(r => r.id)) : 0) + 1;
                renderTable();
            }
        } catch (err) {
            console.error('Load failed:', err);
        }
        event.target.value = '';
    };
    reader.readAsText(file);
}

// ── Print ─────────────────────────────────────────────────────────────────
function printPDF() {
    const v = id => document.getElementById(id)?.value?.trim() ?? '';
    const set = (spanId, val) => {
        const el = document.getElementById(spanId);
        if (el) el.textContent = val;
    };
    set('ph-designer-company', v('proj-designer-company'));
    set('ph-designer-address', v('proj-designer-address'));
    set('ph-designer-phone',   v('proj-designer-phone'));
    set('ph-designer-name',    v('proj-designer-name'));
    set('ph-designer-email',   v('proj-designer-email'));
    set('ph-proj-company',     v('proj-company'));
    set('ph-proj-location',    v('proj-location'));
    set('ph-proj-contact',     v('proj-contact'));
    set('ph-proj-comments',    v('proj-comments'));
    set('ph-date', new Date().toLocaleDateString());
    window.print();
}

// ── Navigation ────────────────────────────────────────────────────────────
function navTo(panel) {
    const overlay = document.getElementById('overlay-panel');
    if (panel === 'main') {
        overlay.classList.add('hidden');
        return;
    }
    overlay.classList.remove('hidden');
    document.getElementById('panel-project').classList.toggle('hidden', panel !== 'project');
    document.getElementById('panel-file').classList.toggle('hidden', panel !== 'file');
}

// ── Helpers ───────────────────────────────────────────────────────────────
function downloadText(content, filename, type) {
    const blob = new Blob(['﻿' + content], { type });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    a.click();
    URL.revokeObjectURL(url);
}

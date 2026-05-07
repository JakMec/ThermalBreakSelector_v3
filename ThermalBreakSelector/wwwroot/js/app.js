// ── State ─────────────────────────────────────────────────────────────────
let tableRows = [];
let nextId = 1;
let editingRowId = null;
let currentSupport = 'slab-slab';
let currentInsulation = 'iso80';
let currentBreakType = 'ebea';
let crossbarActive = false;
let loadDirs = { bm: 'ccw', sl: 'down' };

// ── Init ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initDropdowns();
    updateConnectorLengths(currentSupport);
    updateSelectedPanel();
    onTypeOfSupportChange();
    renderTable();
});

function initDropdowns() {
    populateSelect('connector-height', range(160, 300, 10).map(v => ({ value: v, label: String(v) })));

    const anchorageOpts = [{ value: '', label: 'Select' }, ...range(145, 175, 5).map(v => ({ value: v, label: String(v) }))];
    populateSelect('anchorage-length', anchorageOpts);

    const insOpts = range(0, 70, 5).map(v => ({ value: v, label: String(v) }));
    populateSelect('extra-ins-top', insOpts);
    populateSelect('extra-ins-bottom', insOpts);
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
    if (isHoriz) {
        document.getElementById('bending-moment').value = '';
        document.getElementById('shear-load').value = '';
    } else {
        document.getElementById('horizontal-load').value = '';
    }
    updateConnectorLengths(currentSupport);
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

function updateConnectorLengths(supportType) {
    const opts = supportType === 'horizontal'
        ? [{ value: 250, label: '250' }]
        : [{ value: 1000, label: '1000' }, { value: 500, label: '500' }];
    populateSelect('connector-length', opts);
}

// ── Load direction toggles ─────────────────────────────────────────────────
const DIR_BTNS = {
    bm: { ccw: 'btn-bm-ccw', cw: 'btn-bm-cw' },
    sl: { up: 'btn-sl-up', down: 'btn-sl-down' },
};

function setLoadDir(load, dir) {
    loadDirs[load] = dir;
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
    updateSelectedPanel();
}

function selectBreakType(type) {
    currentBreakType = type;
    setPairToggle('btn-ebea', 'btn-tebea', type === 'ebea');
    updateSelectedPanel();
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

// ── Panel switching ───────────────────────────────────────────────────────
function updateSelectedPanel() {}
function switchTab(tab) {}

// ── Crossbar toggle ───────────────────────────────────────────────────────
function toggleCrossbar() {
    crossbarActive = !crossbarActive;
    document.getElementById('crossbar-track').classList.toggle('bg-teal-500', crossbarActive);
    document.getElementById('crossbar-track').classList.toggle('bg-gray-300', !crossbarActive);
    document.getElementById('crossbar-knob').classList.toggle('translate-x-5', crossbarActive);
}

// ── Product selection (placeholder) ──────────────────────────────────────
function selectProduct() {
    // Placeholder — product database lookup to be implemented
}

// ── Add to list ───────────────────────────────────────────────────────────
function addToList() {
    const position    = document.getElementById('position-name').value.trim();
    const length      = parseInt(document.getElementById('connector-length').value) || 0;
    const quantity    = Math.max(1, parseInt(document.getElementById('quantity').value) || 1);
    const selectedType = document.getElementById('selected-type').value;
    const anchorage   = document.getElementById('anchorage-length').value;
    const extraTop    = document.getElementById('extra-ins-top').value;
    const extraBottom = document.getElementById('extra-ins-bottom').value;

    const breakLabel  = currentBreakType.toUpperCase();
    const connectorName = `${currentInsulation.toUpperCase()} ${breakLabel}${selectedType ? ' · ' + selectedType : ''}`;

    tableRows.push({
        id: nextId++,
        position: position || '—',
        connector: connectorName,
        length,
        quantity,
        insulation: currentInsulation,
        breakType: currentBreakType,
        support: currentSupport,
        bendingMoment: document.getElementById('bending-moment').value,
        shearLoad: document.getElementById('shear-load').value,
        horizontalLoad: document.getElementById('horizontal-load').value,
        concreteGrade: document.getElementById('concrete-grade').value,
        connectorHeight: document.getElementById('connector-height').value,
        concreteCover: document.getElementById('concrete-cover').value,
        maxUtilization: document.getElementById('max-utilization').value,
        selectedType,
        anchorageLength: anchorage,
        extraInsTop: extraTop,
        extraInsBottom: extraBottom,
        crossbar: crossbarActive,
        mEd: null, mRd: null, etaM: null,
        vEd: null, vRd: null, etaV: null,
        hEd: null, hRd: null, etaH: null,
        stiffness: null,
    });
    renderTable();
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
        [headers, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n'),
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
            horizontalLoad: v('horizontal-load'), hlDir: loadDirs.hl,
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
            if (g.hlDir) setLoadDir('hl', g.hlDir);
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
function printPDF() { window.print(); }

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

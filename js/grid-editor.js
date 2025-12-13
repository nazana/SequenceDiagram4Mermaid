/**
 * Logic for the Grid UI Editor.
 */

let currentModel = null;
let onChangeCallback = null;

export function initGridEditor(callback) {
    onChangeCallback = callback;
}

export function renderGridEditor(container, model) {
    currentModel = model;
    container.innerHTML = '';

    // Wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'grid-wrapper';

    // 1. Participants Section
    const pSection = document.createElement('div');
    pSection.className = 'grid-section';
    pSection.innerHTML = `<h3>참여자 (Participants)</h3>`;

    const pList = document.createElement('div');
    pList.className = 'participant-list';

    model.participants.forEach((p, index) => {
        const item = document.createElement('div');
        item.className = 'participant-item';
        item.innerHTML = `
            <input type="text" class="input-sm p-id" value="${p.id}" placeholder="ID (e.g. A)">
            <input type="text" class="input-sm p-name" value="${p.name}" placeholder="Name (Display)">
            <button class="btn-icon btn-sm btn-delete-p" data-index="${index}"><i class="ph ph-trash"></i></button>
        `;

        // Events
        const inputs = item.querySelectorAll('input');
        inputs.forEach(inp => inp.addEventListener('input', (e) => updateParticipant(index, e.target.classList.contains('p-id') ? 'id' : 'name', e.target.value)));

        item.querySelector('.btn-delete-p').addEventListener('click', () => deleteParticipant(index));

        pList.appendChild(item);
    });

    const btnAddP = document.createElement('button');
    btnAddP.className = 'btn btn-ghost btn-sm';
    btnAddP.innerHTML = `<i class="ph ph-plus"></i> 참여자 추가`;
    btnAddP.onclick = addParticipant;

    pSection.appendChild(pList);
    pSection.appendChild(btnAddP);
    wrapper.appendChild(pSection);

    // 2. Sequence Section
    const sSection = document.createElement('div');
    sSection.className = 'grid-section';
    sSection.innerHTML = `<h3>시퀀스 (Sequence)</h3>`;

    const sTable = document.createElement('div');
    sTable.className = 'sequence-table';

    // Header
    sTable.innerHTML = `
        <div class="seq-row seq-header">
            <span class="col-handle"></span>
            <span class="col-source">Source</span>
            <span class="col-type">Type</span>
            <span class="col-target">Target</span>
            <span class="col-msg">Message</span>
            <span class="col-actions"></span>
        </div>
    `;

    model.items.forEach((item, index) => {
        if (item.type !== 'message') return; // Only support messages for now

        const row = document.createElement('div');
        row.className = 'seq-row';
        row.innerHTML = `
            <span class="col-handle"><i class="ph ph-dots-six-vertical"></i></span>
            <span class="col-source">
                <select class="input-sm seq-source">
                    ${getParticipantOptions(model.participants, item.source)}
                </select>
            </span>
            <span class="col-type">
                <select class="input-sm seq-type">
                    <option value="->>" ${item.arrow === '->>' ? 'selected' : ''}>->> (Solid)</option>
                    <option value="-->>" ${item.arrow === '-->>' ? 'selected' : ''}>-->> (Dotted)</option>
                    <option value="->" ${item.arrow === '->' ? 'selected' : ''}>-> (Solid No Arrow)</option>
                    <option value="-->" ${item.arrow === '-->' ? 'selected' : ''}>--> (Dotted No Arrow)</option>
                </select>
            </span>
            <span class="col-target">
                <select class="input-sm seq-target">
                    ${getParticipantOptions(model.participants, item.target)}
                </select>
            </span>
            <span class="col-msg">
                <input type="text" class="input-sm seq-content" value="${item.content}" placeholder="Message...">
            </span>
            <span class="col-actions">
                <button class="btn-icon btn-sm btn-delete-s" data-index="${index}"><i class="ph ph-trash"></i></button>
            </span>
        `;

        // Events
        row.querySelector('.seq-source').addEventListener('input', (e) => updateItem(index, 'source', e.target.value));
        row.querySelector('.seq-type').addEventListener('input', (e) => updateItem(index, 'arrow', e.target.value));
        row.querySelector('.seq-target').addEventListener('input', (e) => updateItem(index, 'target', e.target.value));
        row.querySelector('.seq-content').addEventListener('input', (e) => updateItem(index, 'content', e.target.value));
        row.querySelector('.btn-delete-s').addEventListener('click', () => deleteItem(index));

        sTable.appendChild(row);
    });

    const btnAddS = document.createElement('button');
    btnAddS.className = 'btn btn-ghost btn-sm';
    btnAddS.innerHTML = `<i class="ph ph-plus"></i> 메시지 추가`;
    btnAddS.onclick = addItem;

    sSection.appendChild(sTable);
    sSection.appendChild(btnAddS);
    wrapper.appendChild(sSection);

    container.appendChild(wrapper);
}

function getParticipantOptions(participants, selectedId) {
    return participants.map(p =>
        `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${p.id} (${p.name})</option>`
    ).join('');
}

// Actions
function triggerChange() {
    if (onChangeCallback) onChangeCallback(currentModel);
}

function addParticipant() {
    const id = `P${currentModel.participants.length + 1}`;
    currentModel.participants.push({ id, name: `Participant ${id}`, type: 'participant' });
    triggerChange(); // UI refresh happens on callback from app.js typically, but app.js will just regenerate code and push back?
    // Actually, simple flow: Grid Change -> Callback -> App Update Code -> App Re-renders Grid (to be safe)
}

function updateParticipant(index, field, value) {
    currentModel.participants[index][field] = value;
    triggerChange();
}

function deleteParticipant(index) {
    currentModel.participants.splice(index, 1);
    triggerChange();
}

function addItem() {
    // Default to first two participants
    const source = currentModel.participants[0]?.id || 'A';
    const target = currentModel.participants[1]?.id || 'B';
    currentModel.items.push({ type: 'message', source, target, arrow: '->>', content: 'Message' });
    triggerChange();
}

function updateItem(index, field, value) {
    currentModel.items[index][field] = value;
    triggerChange();
}

function deleteItem(index) {
    currentModel.items.splice(index, 1);
    triggerChange();
}

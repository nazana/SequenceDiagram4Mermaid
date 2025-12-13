/**
 * Logic for the Grid UI Editor.
 */

let currentModel = null;
let onChangeCallback = null;
let currentContainer = null; // Store container for re-rendering

// SVG Definitions for Arrows
const ARROW_SVGS = {
    '->>': `<svg viewBox="0 0 80 14" fill="none" class="arrow-svg"><path d="M0 7H70" stroke="currentColor" stroke-width="2"/><path d="M70 7L60 2V12L70 7Z" fill="currentColor"/></svg>`,
    '-->>': `<svg viewBox="0 0 80 14" fill="none" class="arrow-svg"><path d="M0 7H70" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/><path d="M70 7L60 2V12L70 7Z" fill="currentColor"/></svg>`,
    '-)': `<svg viewBox="0 0 80 14" fill="none" class="arrow-svg"><path d="M0 7H70" stroke="currentColor" stroke-width="2"/><path d="M60 2L70 7L60 12" stroke="currentColor" stroke-width="2"/></svg>`,
    '--)': `<svg viewBox="0 0 80 14" fill="none" class="arrow-svg"><path d="M0 7H70" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/><path d="M60 2L70 7L60 12" stroke="currentColor" stroke-width="2"/></svg>`,
    '->': `<svg viewBox="0 0 80 14" fill="none" class="arrow-svg"><path d="M0 7H80" stroke="currentColor" stroke-width="2"/></svg>`,
    '-->': `<svg viewBox="0 0 80 14" fill="none" class="arrow-svg"><path d="M0 7H80" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/></svg>`,
    '-x': `<svg viewBox="0 0 80 14" fill="none" class="arrow-svg"><path d="M0 7H70" stroke="currentColor" stroke-width="2"/><path d="M63 3L73 11M73 3L63 11" stroke="currentColor" stroke-width="2"/></svg>`,
    '--x': `<svg viewBox="0 0 80 14" fill="none" class="arrow-svg"><path d="M0 7H70" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/><path d="M63 3L73 11M73 3L63 11" stroke="currentColor" stroke-width="2"/></svg>`,
    '<<->>': `<svg viewBox="0 0 80 14" fill="none" class="arrow-svg"><path d="M0 7L10 12V2L0 7Z" fill="currentColor"/><path d="M10 7H70" stroke="currentColor" stroke-width="2"/><path d="M70 7L60 2V12L70 7Z" fill="currentColor"/></svg>`,
    '<<-->>': `<svg viewBox="0 0 80 14" fill="none" class="arrow-svg"><path d="M0 7L10 12V2L0 7Z" fill="currentColor"/><path d="M10 7H70" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/><path d="M70 7L60 2V12L70 7Z" fill="currentColor"/></svg>`
};

export function initGridEditor(callback) {
    onChangeCallback = callback;
}

export function renderGridEditor(container, model) {
    currentModel = model;
    currentContainer = container; // Save ref
    container.innerHTML = '';

    // Wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'grid-wrapper';

    // 1. Participants Section
    const pSection = document.createElement('div');
    pSection.className = 'grid-section';
    pSection.innerHTML = `<h3>참여자 (Participants)</h3>`;

    // Wrapper for Visual Unity
    const pWrapper = document.createElement('div');
    pWrapper.className = 'participant-table-wrapper';
    pWrapper.style.border = '1px solid var(--color-border)';
    pWrapper.style.borderRadius = 'var(--border-radius)';
    pWrapper.style.overflow = 'hidden';
    pWrapper.style.marginBottom = '0.5rem';

    // Header for Participants
    const pHeader = document.createElement('div');
    pHeader.className = 'participant-header';
    pHeader.style.display = 'flex';
    pHeader.style.gap = '0.5rem';
    pHeader.style.padding = '0.5rem'; // Remove extra left padding, use span instead
    pHeader.style.backgroundColor = 'var(--color-bg-hover)'; // Match sequence header
    pHeader.style.borderBottom = '1px solid var(--color-border)';
    pHeader.style.color = 'var(--color-text-secondary)';
    pHeader.style.fontSize = '0.85rem';
    pHeader.style.fontWeight = '600';
    pHeader.innerHTML = `
        <span class="col-handle"></span>
        <span style="width: 80px;">ID</span>
        <span style="flex: 1;">표시 이름 (Name)</span>
        <span style="width: 28px;"></span> 
    `;
    pWrapper.appendChild(pHeader);

    const pList = document.createElement('div');
    pList.className = 'participant-list';
    pList.style.marginBottom = '0'; // Remove default margin if any

    model.participants.forEach((p, index) => {
        const item = document.createElement('div');
        item.className = 'participant-item';
        // Add data-id for sorting
        item.dataset.index = index;

        item.innerHTML = `
            <span class="col-handle"><i class="ph ph-dots-six-vertical"></i></span>
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

    pWrapper.appendChild(pList);
    pSection.appendChild(pWrapper);

    // Init Sortable for Participants
    if (typeof Sortable !== 'undefined') {
        new Sortable(pList, {
            handle: '.col-handle',
            animation: 150,
            onEnd: function (evt) {
                // Reorder model.participants
                const item = currentModel.participants.splice(evt.oldIndex, 1)[0];
                currentModel.participants.splice(evt.newIndex, 0, item);

                // Re-render
                renderGridEditor(currentContainer, currentModel);
                triggerChange();
            }
        });
    }

    const btnAddP = document.createElement('button');
    btnAddP.className = 'btn btn-ghost btn-sm';
    btnAddP.style.marginTop = '0.5rem';
    btnAddP.innerHTML = `<i class="ph ph-plus"></i> 참여자 추가`;
    btnAddP.onclick = addParticipant;

    pSection.appendChild(btnAddP);
    wrapper.appendChild(pSection);

    // 2. Sequence Section
    const sSection = document.createElement('div');
    sSection.className = 'grid-section';
    sSection.innerHTML = `<h3>시퀀스 (Sequence)</h3>`;

    // Container for visual unity
    const sWrapper = document.createElement('div');
    sWrapper.className = 'sequence-table-wrapper';
    sWrapper.style.border = '1px solid var(--color-border)';
    sWrapper.style.borderRadius = 'var(--border-radius)';
    sWrapper.style.overflow = 'hidden';

    // Header (Outside Sortable Container)
    const sHeader = document.createElement('div');
    sHeader.className = 'sequence-header'; // Changed class name slightly to avoid default table styles if any
    sHeader.style.backgroundColor = 'var(--color-bg-hover)'; // Match sequence header design
    sHeader.style.borderBottom = '1px solid var(--color-border)';
    sHeader.innerHTML = `
        <div class="seq-row seq-header" style="border: none;">
            <span class="col-handle"></span>
            <span class="col-source">Source</span>
            <span class="col-type">Type</span>
            <span class="col-target">Target</span>
            <span class="col-msg">Message</span>
            <span class="col-actions"></span>
        </div>
    `;
    sWrapper.appendChild(sHeader);

    const sTable = document.createElement('div');
    sTable.className = 'sequence-table';
    sTable.style.border = 'none'; // Remove component border
    sTable.style.borderRadius = '0'; // Remove radius

    // sTable does not need header logic anymore

    model.items.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'seq-row';
        row.dataset.index = index; // real index in model
        row.style.borderBottom = '1px solid var(--color-border)'; // Inner separators
        if (index === model.items.length - 1) row.style.borderBottom = 'none'; // Last item no border

        if (item.type === 'message') {
            row.innerHTML = `
                <span class="col-handle"><i class="ph ph-dots-six-vertical"></i></span>
                <span class="col-source">
                    <select class="input-sm seq-source">
                        ${getParticipantOptions(model.participants, item.source)}
                    </select>
                </span>
                <span class="col-type">
                    <button class="btn-arrow-type" title="Change Line Type">
                        ${ARROW_SVGS[item.arrow] || ARROW_SVGS['->>']}
                    </button>
                    <!-- Actual value stored in model, no hidden input needed for this logic -->
                </span>
                <span class="col-target">
                     <select class="input-sm seq-target">
                        ${getParticipantOptions(model.participants, item.target)}
                    </select>
                </span>
                <span class="col-msg"><input type="text" class="input-sm seq-content" value="${item.content || ''}"></span>
                <span class="col-actions">
                    <button class="btn-icon btn-sm btn-delete-s" data-index="${index}"><i class="ph ph-trash"></i></button>
                </span>
            `;

            // Events
            row.querySelector('.seq-source').addEventListener('change', (e) => updateItem(index, 'source', e.target.value));

            // Custom Arrow Selector Event
            row.querySelector('.btn-arrow-type').addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent bubble
                openArrowSelector(e, index, item.arrow);
            });

            row.querySelector('.seq-target').addEventListener('change', (e) => updateItem(index, 'target', e.target.value));
            row.querySelector('.seq-content').addEventListener('input', (e) => updateItem(index, 'content', e.target.value));
            row.querySelector('.btn-delete-s').addEventListener('click', () => deleteItem(index));
        } else {
            // Other types (Note, Loop, etc.) - Readonly for now
            row.innerHTML = `
                <span class="col-handle"><i class="ph ph-dots-six-vertical"></i></span>
                <span class="col-msg" style="flex: 1; padding: 0 1rem; color: var(--color-text-secondary); font-style: italic;">
                    [${item.type}] ${item.content || ''}
                </span>
                <span class="col-actions">
                    <button class="btn-icon btn-sm btn-delete-s" data-index="${index}"><i class="ph ph-trash"></i></button>
                </span>
            `;
            row.querySelector('.btn-delete-s').addEventListener('click', () => deleteItem(index));
        }

        sTable.appendChild(row);
    });

    // Init Sortable for Sequence Items
    if (typeof Sortable !== 'undefined') {
        new Sortable(sTable, {
            handle: '.col-handle',
            animation: 150,
            onEnd: function (evt) {
                // Reorder model.items using splice
                const item = currentModel.items.splice(evt.oldIndex, 1)[0];
                currentModel.items.splice(evt.newIndex, 0, item);

                // Re-render (Delayed)
                setTimeout(() => {
                    renderGridEditor(currentContainer, currentModel);
                    triggerChange();
                }, 0);
            }
        });
    }

    sWrapper.appendChild(sTable); // Put table inside wrapper
    sSection.appendChild(sWrapper); // Put wrapper inside section

    const btnAddS = document.createElement('button');
    btnAddS.className = 'btn btn-ghost btn-sm';
    btnAddS.style.marginTop = '0.5rem';
    btnAddS.innerHTML = `<i class="ph ph-plus"></i> 메시지 추가`;
    btnAddS.onclick = addItem;

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
    renderGridEditor(currentContainer, currentModel);
    triggerChange();
}

function updateParticipant(index, field, value) {
    currentModel.participants[index][field] = value;
    triggerChange();
}

function deleteParticipant(index) {
    currentModel.participants.splice(index, 1);
    renderGridEditor(currentContainer, currentModel);
    triggerChange();
}

function addItem() {
    // Default to first two participants
    const source = currentModel.participants[0]?.id || 'A';
    const target = currentModel.participants[1]?.id || 'B';
    currentModel.items.push({ type: 'message', source, target, arrow: '->>', content: 'Message' });
    renderGridEditor(currentContainer, currentModel);
    triggerChange();
}

function updateItem(index, field, value) {
    currentModel.items[index][field] = value;

    // If updating arrow type, re-render to show new SVG icon
    if (field === 'arrow') {
        renderGridEditor(currentContainer, currentModel);
    }

    triggerChange();
}

function deleteItem(index) {
    currentModel.items.splice(index, 1);
    renderGridEditor(currentContainer, currentModel);
    triggerChange();
}

function openArrowSelector(event, index, currentVal) {
    // Close existing
    const existing = document.querySelector('.arrow-selector-popover');
    if (existing) existing.remove();

    const btn = event.currentTarget;
    const rect = btn.getBoundingClientRect();

    const popover = document.createElement('div');
    popover.className = 'arrow-selector-popover';

    // Position
    popover.style.top = `${rect.bottom + window.scrollY + 4}px`;
    popover.style.left = `${rect.left + window.scrollX}px`;

    const labels = {
        '->>': 'Solid / Arrow',
        '-->>': 'Dotted / Arrow',
        '-)': 'Solid / Open',
        '--)': 'Dotted / Open',
        '->': 'Solid / Line',
        '-->': 'Dotted / Line',
        '-x': 'Solid / Cross',
        '--x': 'Dotted / Cross',
        '<<->>': 'Solid / Bidirectional',
        '<<-->>': 'Dotted / Bidirectional'
    };

    Object.keys(ARROW_SVGS).forEach(type => {
        const option = document.createElement('div');
        option.className = `arrow-option ${type === currentVal ? 'selected' : ''}`;
        option.innerHTML = `
            ${ARROW_SVGS[type]}
            <span>${labels[type]}</span>
        `;
        option.onclick = (e) => {
            e.stopPropagation();
            updateItem(index, 'arrow', type);
            popover.remove();
        };
        popover.appendChild(option);
    });

    document.body.appendChild(popover);

    // Close on click outside
    const closeHandler = (e) => {
        if (!popover.contains(e.target) && e.target !== btn) {
            popover.remove();
            document.removeEventListener('click', closeHandler);
        }
    };

    // Defer to next tick to avoid immediate close
    setTimeout(() => {
        document.addEventListener('click', closeHandler);
    }, 0);
}

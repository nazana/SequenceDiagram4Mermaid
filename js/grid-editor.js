/**
 * Logic for the Grid UI Editor.
 */

let currentModel = null;
let onChangeCallback = null;
let currentContainer = null; // Store container for re-rendering

// SVG Definitions for Arrows
const ARROW_SVGS = {
    '->>': `<svg viewBox="0 0 80 14" fill="none" class="arrow-svg"><path d="M20 7H60" stroke="currentColor" stroke-width="2"/><path d="M60 7L50 2V12L60 7Z" fill="currentColor"/></svg>`,
    '-->>': `<svg viewBox="0 0 80 14" fill="none" class="arrow-svg"><path d="M20 7H60" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/><path d="M60 7L50 2V12L60 7Z" fill="currentColor"/></svg>`,
    '-)': `<svg viewBox="0 0 80 14" fill="none" class="arrow-svg"><path d="M20 7H60" stroke="currentColor" stroke-width="2"/><path d="M50 2L60 7L50 12" stroke="currentColor" stroke-width="2"/></svg>`,
    '--)': `<svg viewBox="0 0 80 14" fill="none" class="arrow-svg"><path d="M20 7H60" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/><path d="M50 2L60 7L50 12" stroke="currentColor" stroke-width="2"/></svg>`,
    '->': `<svg viewBox="0 0 80 14" fill="none" class="arrow-svg"><path d="M20 7H60" stroke="currentColor" stroke-width="2"/></svg>`,
    '-->': `<svg viewBox="0 0 80 14" fill="none" class="arrow-svg"><path d="M20 7H60" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/></svg>`,
    '-x': `<svg viewBox="0 0 80 14" fill="none" class="arrow-svg"><path d="M20 7H60" stroke="currentColor" stroke-width="2"/><path d="M53 3L63 11M63 3L53 11" stroke="currentColor" stroke-width="2"/></svg>`,
    '--x': `<svg viewBox="0 0 80 14" fill="none" class="arrow-svg"><path d="M20 7H60" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/><path d="M53 3L63 11M63 3L53 11" stroke="currentColor" stroke-width="2"/></svg>`,
    '<<->>': `<svg viewBox="0 0 80 14" fill="none" class="arrow-svg"><path d="M20 7L30 12V2L20 7Z" fill="currentColor"/><path d="M30 7H60" stroke="currentColor" stroke-width="2"/><path d="M60 7L50 2V12L60 7Z" fill="currentColor"/></svg>`,
    '<<-->>': `<svg viewBox="0 0 80 14" fill="none" class="arrow-svg"><path d="M20 7L30 12V2L20 7Z" fill="currentColor"/><path d="M30 7H60" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/><path d="M60 7L50 2V12L60 7Z" fill="currentColor"/></svg>`
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
    sSection.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <h3 style="margin:0;">시퀀스 (Sequence)</h3>
            <label class="toggle-label" style="display: flex; align-items: center; font-size: 0.85rem; color: var(--color-text-secondary); cursor: pointer;">
                <input type="checkbox" id="chk-autonumber" ${model.config?.autonumber ? 'checked' : ''} style="margin-right: 0.5rem;">
                Autonumber
            </label>
        </div>
    `;

    // Bind Event immediately after creating elements
    setTimeout(() => {
        const chk = sSection.querySelector('#chk-autonumber');
        if (chk) {
            chk.addEventListener('change', (e) => {
                if (!currentModel.config) currentModel.config = {};
                currentModel.config.autonumber = e.target.checked;
                triggerChange();
            });
        }
    }, 0);

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
            <span class="col-no grid-col-no" style="font-weight:600">No.</span>
            <span class="col-source">Source</span>
            <span class="col-swap"></span>
            <span class="col-target">Target</span>
            <span class="col-type">Type</span>
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
                <span class="col-no grid-col-no">${index + 1}</span>

                <span class="col-source">
                    <select class="input-sm seq-source">
                        ${getParticipantOptions(model.participants, item.source)}
                    </select>
                </span>
                <span class="col-swap">
                    <button class="btn-swap" title="Swap Source/Target">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M221.66,133.66l-40,40a8,8,0,0,1-11.32-11.32L204.69,128H136V40a8,8,0,0,1,16,0v80h52.69l-34.35-34.34a8,8,0,0,1,11.32-11.32l40,40A8,8,0,0,1,221.66,133.66Zm-59-19A8,8,0,0,0,168,112H120V40a8,8,0,0,0-16,0V112H51.31l34.35-34.34a8,8,0,0,0-11.32-11.32l-40,40a8,8,0,0,0,0,11.32l40,40a8,8,0,0,0,11.32-11.32L51.31,128H104v96a8,8,0,0,0,16,0V128h42.69Z"></path></svg>
                    </button>
                </span>
                <span class="col-target">
                     <select class="input-sm seq-target">
                        ${getParticipantOptions(model.participants, item.target)}
                    </select>
                </span>
                <span class="col-type">
                    <button class="btn-arrow-type" title="Change Line Type">
                        ${ARROW_SVGS[item.arrow] || ARROW_SVGS['->>']}
                    </button>
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

            // Swap Event
            const btnSwap = row.querySelector('.btn-swap');
            if (btnSwap) {
                // Use SVG for icon, Phosphor icon seems missing/not displaying well with just class sometimes or SVG is safer
                // Or I can use Phosphor class: <i class="ph ph-arrows-left-right"></i>
                // The user requested functionality, I used SVG directly in HTML above for robustness.
                // Let's replace SVG with Phosphor if consistent with other icons. 
                // Wait, previous code used <i class="ph ph-..."></i>. Let's use Phosphor for consistency.
                btnSwap.innerHTML = '<i class="ph ph-arrows-left-right"></i>';

                btnSwap.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const temp = item.source;
                    item.source = item.target;
                    item.target = temp;
                    // We need to update the UI specifically or re-render
                    // Simplest is to update the selects directly if we want to avoid full re-render for performance?
                    // But re-render handles everything cleaner.
                    renderGridEditor(container, currentModel);
                    triggerChange();
                });
            }

            row.querySelector('.seq-target').addEventListener('change', (e) => updateItem(index, 'target', e.target.value));
            row.querySelector('.seq-content').addEventListener('input', (e) => updateItem(index, 'content', e.target.value));
            row.querySelector('.btn-delete-s').addEventListener('click', () => deleteItem(index));
        } else {
            // Other types (Note, Loop, etc.) - Readonly for now
            row.innerHTML = `
                <span class="col-handle"><i class="ph ph-dots-six-vertical"></i></span>
                <span class="col-no grid-col-no">${index + 1}</span>
                <span class="col-msg" style="flex: 1; padding: 0 1rem; color: var(--color-text-secondary); font-style: italic;">
                    [${item.type}] ${item.content || ''}
                </span>
                <span class="col-actions">
                    <button class="btn-icon btn-sm btn-delete-s" data-index="${index}"><i class="ph ph-trash"></i></button>
                </span>
            `;
            row.querySelector('.btn-delete-s').addEventListener('click', () => deleteItem(index));
        }



        // Row Click for Highlighting
        row.addEventListener('click', (e) => {
            // Ignore input clicks
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'BUTTON' || e.target.closest('button')) return;

            if (window.onGridRowSelect) {
                window.onGridRowSelect(index);
            }
        });

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

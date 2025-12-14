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
    pSection.innerHTML = `
        <div class="section-toggle" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; margin-bottom: 0.5rem; user-select: none;">
            <h3 style="margin:0;">참여자 (Participants)</h3>
            <i class="ph ph-caret-down" style="transition: transform 0.2s;"></i>
        </div>
        <div class="section-content"></div>
    `;

    const pHeaderToggle = pSection.querySelector('.section-toggle');
    const pContent = pSection.querySelector('.section-content');
    const pIcon = pHeaderToggle.querySelector('i');

    pHeaderToggle.addEventListener('click', () => {
        const isHidden = pContent.style.display === 'none';
        pContent.style.display = isHidden ? 'block' : 'none';
        pIcon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)'; // Rotate 180 for up
    });

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
    pHeader.style.padding = '0.5rem';
    pHeader.style.backgroundColor = 'var(--color-bg-hover)';
    pHeader.style.borderBottom = '1px solid var(--color-border)';
    pHeader.style.color = 'var(--color-text-secondary)';
    pHeader.style.fontSize = '0.85rem';
    pHeader.style.fontWeight = '600';
    pHeader.innerHTML = `
        <span class="col-handle"></span>
        <span style="width: 80px;">ID</span>
        <span style="width: 90px;">Type</span>
        <span style="flex: 1;">표시 이름 (Name)</span>
        <span style="width: 28px;"></span> 
    `;
    pWrapper.appendChild(pHeader);

    pContent.appendChild(pWrapper);

    const pList = document.createElement('div');
    pList.className = 'participant-list';
    pList.style.marginBottom = '0';

    model.participants.forEach((p, index) => {
        const item = document.createElement('div');
        item.className = 'participant-item';
        item.dataset.index = index;

        item.innerHTML = `
            <span class="col-handle"><i class="ph ph-dots-six-vertical"></i></span>
            <input type="text" class="input-sm p-id" value="${p.logicalId || p.id}" placeholder="ID (Logical)">
            <select class="input-sm p-type" style="width: 90px;">
                <option value="participant" ${p.type === 'participant' ? 'selected' : ''}>Participant</option>
                <option value="actor" ${p.type === 'actor' ? 'selected' : ''}>Actor</option>
            </select>
            <input type="text" class="input-sm p-name" value="${p.name || ''}" placeholder="Name (Display)">
            <button class="btn-icon btn-sm btn-delete-p" data-index="${index}"><i class="ph ph-trash"></i></button>
        `;

        const inputs = item.querySelectorAll('input, select');
        inputs.forEach(inp => inp.addEventListener('input', (e) => {
            const cls = e.target.classList;
            let field = 'name';
            if (cls.contains('p-id')) field = 'logicalId';
            else if (cls.contains('p-type')) field = 'type';

            updateParticipant(index, field, e.target.value);
        }));

        item.querySelector('.btn-delete-p').addEventListener('click', () => deleteParticipant(index));
        pList.appendChild(item);
    });

    pWrapper.appendChild(pList);

    if (typeof Sortable !== 'undefined') {
        new Sortable(pList, {
            handle: '.col-handle',
            animation: 150,
            onEnd: function (evt) {
                const item = currentModel.participants.splice(evt.oldIndex, 1)[0];
                currentModel.participants.splice(evt.newIndex, 0, item);
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
    pContent.appendChild(btnAddP);
    wrapper.appendChild(pSection);

    // 2. Sequence Section
    const sSection = document.createElement('div');
    sSection.className = 'grid-section';
    sSection.innerHTML = `
        <div class="section-toggle" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; cursor: pointer; user-select: none;">
            <h3 style="margin:0;">시퀀스 (Sequence)</h3>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <button id="btn-autonumber" class="btn-icon ${model.config?.autonumber ? 'active' : ''}" title="Toggle Autonumber" onclick="event.stopPropagation()" style="color: ${model.config?.autonumber ? 'var(--color-primary)' : 'var(--color-text-secondary)'}">
                    <i class="ph ph-list-numbers" style="font-size: 1.2rem;"></i>
                </button>
                <i class="ph ph-caret-down" style="transition: transform 0.2s;"></i>
            </div>
        </div>
        <div class="section-content"></div>
    `;

    const sHeaderToggle = sSection.querySelector('.section-toggle');
    const sContent = sSection.querySelector('.section-content');
    const sIcon = sHeaderToggle.querySelector('.ph-caret-down');

    const btnAutonumber = sSection.querySelector('#btn-autonumber');
    btnAutonumber.addEventListener('click', (e) => {
        if (!model.config) model.config = {};
        model.config.autonumber = !model.config.autonumber;

        const isActive = model.config.autonumber;
        btnAutonumber.classList.toggle('active', isActive);
        btnAutonumber.style.color = isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)';
        triggerChange();
    });

    sHeaderToggle.addEventListener('click', () => {
        const isHidden = sContent.style.display === 'none';
        sContent.style.display = isHidden ? 'block' : 'none';
        sIcon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
    });

    const sWrapper = document.createElement('div');
    sWrapper.className = 'sequence-table-wrapper';
    sWrapper.style.border = '1px solid var(--color-border)';
    sWrapper.style.borderRadius = 'var(--border-radius)';
    sWrapper.style.overflow = 'hidden';

    const sHeader = document.createElement('div');
    sHeader.className = 'sequence-header';
    sHeader.style.backgroundColor = 'var(--color-bg-hover)';
    sHeader.style.borderBottom = '1px solid var(--color-border)';
    sHeader.innerHTML = `
        <div class="seq-row seq-header" style="border: none;">
            <span class="col-handle"></span>
            <span class="col-activation" style="width: 30px;"></span>
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
    sTable.style.border = 'none';
    sTable.style.borderRadius = '0';

    // Brackets Calculation (Visual Only, Logic is handled separately per button)
    const brackets = [];
    const openActivations = [];
    const activeCounts = {};

    model.items.forEach((item, idx) => {
        const act = item.activation;
        if (act) {
            if (act.deactivate) {
                if (activeCounts[item.source] > 0) activeCounts[item.source]--;
                if (openActivations.length > 0) {
                    const last = openActivations.pop();
                    brackets.push({ start: last.startRow, end: idx, level: last.level });
                }
            }
            if (act.activate) {
                activeCounts[item.target] = (activeCounts[item.target] || 0) + 1;
                openActivations.push({ startRow: idx, level: openActivations.length });
            }
        }
    });
    openActivations.forEach(a => brackets.push({ start: a.startRow, end: model.items.length - 1, level: a.level }));


    model.items.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'seq-row';
        row.dataset.index = index;
        row.style.borderBottom = '1px solid var(--color-border)';
        if (index === model.items.length - 1) row.style.borderBottom = 'none';

        if (item.type === 'message') {
            // 1. Validation for Deactivate Button (-)
            const isDeactivateActive = !!item.activation?.deactivate;
            // Check: Is Source currently active at this point?
            const isSourceActive = checkIsActiveAt(model, index, item.source);

            // Check: If we turn ON deactivate (from OFF state), is it safe? (Does it break future?)
            let isSafeToEnableDeactivate = true;
            if (!isDeactivateActive) {
                // Determine if enabling Deactivate here would break future rows
                isSafeToEnableDeactivate = checkSimulation(model, index, { deactivate: true }, item.source);
            }

            const canDeactivate = isDeactivateActive || (isSourceActive && isSafeToEnableDeactivate);
            // Hint text
            let deactivateTitle = "Deactivate Source (-)";
            if (!isSourceActive) deactivateTitle = "Inactive (nothing to deactivate)";
            else if (!isSafeToEnableDeactivate) deactivateTitle = "Cannot deactivate (breaks future flow)";


            // 2. Validation for Activate Button (+)
            const isActivateActive = !!item.activation?.activate;

            // Check: If we turn OFF activate (from ON state), is it safe?
            let isSafeToDisableActivate = true;
            if (isActivateActive) {
                isSafeToDisableActivate = checkSimulation(model, index, { activate: false }, item.target);
            }

            const canActivate = !isActivateActive || isSafeToDisableActivate;
            // Hint text
            let activateTitle = "Activate Target (+)";
            if (isActivateActive && !isSafeToDisableActivate) activateTitle = "Cannot disable (required by later deactivate)";


            row.innerHTML = `
                <span class="col-handle"><i class="ph ph-dots-six-vertical"></i></span>
                <span class="col-activation" style="width: 30px; position: relative;">
                    ${renderActivationLines(index, brackets)}
                </span>
                <span class="col-no grid-col-no">${index + 1}</span>

                <span class="col-source" style="display: flex; align-items: center; gap: 4px;">
                    <button class="btn-icon btn-sm btn-deactivate ${isDeactivateActive ? 'active' : ''}" 
                        title="${deactivateTitle}"
                        ${!canDeactivate ? 'disabled' : ''}>
                        <i class="ph ph-minus-circle"></i>
                    </button>
                    <select class="input-sm seq-source" style="flex:1">
                        ${getParticipantOptions(model.participants, item.source)}
                    </select>
                </span>
                <span class="col-swap">
                    <button class="btn-swap" title="Swap Source/Target">
                        <i class="ph ph-arrows-left-right"></i>
                    </button>
                </span>
                <span class="col-target" style="display: flex; align-items: center; gap: 4px;">
                     <select class="input-sm seq-target" style="flex:1">
                        ${getParticipantOptions(model.participants, item.target)}
                    </select>
                    <button class="btn-icon btn-sm btn-activate ${isActivateActive ? 'active' : ''}" 
                        title="${activateTitle}"
                        ${!canActivate ? 'disabled' : ''}>
                        <i class="ph ph-plus-circle"></i>
                    </button>
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

            row.querySelector('.seq-source').addEventListener('change', (e) => updateItem(index, 'source', e.target.value));

            row.querySelector('.btn-arrow-type').addEventListener('click', (e) => {
                e.stopPropagation();
                openArrowSelector(e, index, item.arrow);
            });

            const btnSwap = row.querySelector('.btn-swap');
            if (btnSwap) {
                btnSwap.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const temp = item.source;
                    item.source = item.target;
                    item.target = temp;
                    // Reset
                    item.activation = { activate: false, deactivate: false };
                    renderGridEditor(container, currentModel);
                    triggerChange();
                });
            }

            row.querySelector('.seq-target').addEventListener('change', (e) => updateItem(index, 'target', e.target.value));
            row.querySelector('.seq-content').addEventListener('input', (e) => updateItem(index, 'content', e.target.value));
            row.querySelector('.btn-delete-s').addEventListener('click', () => deleteItem(index));

            const btnDeactivate = row.querySelector('.btn-deactivate');
            if (!btnDeactivate.disabled) {
                btnDeactivate.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const current = item.activation || { activate: false, deactivate: false };
                    updateItem(index, 'activation', { ...current, deactivate: !current.deactivate });
                });
            }

            const btnActivate = row.querySelector('.btn-activate');
            if (!btnActivate.disabled) {
                btnActivate.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const current = item.activation || { activate: false, deactivate: false };
                    updateItem(index, 'activation', { ...current, activate: !current.activate });
                });
            }
        } else {
            row.innerHTML = `
                <span class="col-handle"><i class="ph ph-dots-six-vertical"></i></span>
                <span class="col-activation" style="width: 30px; position: position;">${renderActivationLines(index, brackets)}</span>
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

        row.addEventListener('click', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
            if (window.onGridRowSelect) {
                window.onGridRowSelect(index);
            }
        });

        sTable.appendChild(row);
    });

    if (typeof Sortable !== 'undefined') {
        new Sortable(sTable, {
            handle: '.col-handle',
            animation: 150,
            onEnd: function (evt) {
                const item = currentModel.items.splice(evt.oldIndex, 1)[0];
                currentModel.items.splice(evt.newIndex, 0, item);
                setTimeout(() => {
                    renderGridEditor(currentContainer, currentModel);
                    triggerChange();
                }, 0);
            }
        });
    }

    sWrapper.appendChild(sTable);
    sContent.appendChild(sWrapper);

    const btnAddS = document.createElement('button');
    btnAddS.className = 'btn btn-ghost btn-sm';
    btnAddS.style.marginTop = '0.5rem';
    btnAddS.innerHTML = `<i class="ph ph-plus"></i> 메시지 추가`;
    btnAddS.onclick = addItem;

    sContent.appendChild(btnAddS);
    wrapper.appendChild(sSection);

    container.appendChild(wrapper);
}

// ** Logic for Validation: SIMULATION **
// Checks if the active count for `participantId` is > 0 at the BEGINNING of `rowIndex`
function checkIsActiveAt(model, rowIndex, participantId) {
    let count = 0;
    for (let i = 0; i < rowIndex; i++) {
        const item = model.items[i];
        if (item.activation?.deactivate && item.source === participantId) count--;
        if (item.activation?.activate && item.target === participantId) count++;
    }
    return count > 0;
}

// Checks if the simulation is VALID for `participantId` if we apply `overrideState` at `overrideIndex`.
function checkSimulation(model, overrideIndex, overrideState, participantId) {
    let count = 0;

    for (let i = 0; i < model.items.length; i++) {
        const item = model.items[i];

        let deactivate = item.activation?.deactivate;
        let activate = item.activation?.activate;

        // Apply override
        if (i === overrideIndex) {
            if (overrideState.deactivate !== undefined) deactivate = overrideState.deactivate;
            if (overrideState.activate !== undefined) activate = overrideState.activate;
        }

        // 1. Deactivate (Source) Logic
        if (deactivate && item.source === participantId) {
            if (count <= 0) return false; // Invalid: Deactivating inactive participant!
            count--;
        }

        // 2. Activate (Target) Logic
        if (activate && item.target === participantId) {
            count++;
        }
    }

    return true; // Survived the simulation
}

function getParticipantOptions(participants, selectedId) {
    return participants.map(p => {
        const logicalId = p.logicalId || p.id;
        const name = p.name || logicalId;
        return `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>[${logicalId}] ${name}</option>`;
    }).join('');
}

function triggerChange() {
    if (onChangeCallback) onChangeCallback(currentModel);
}

function addParticipant() {
    const id = `P${currentModel.participants.length + 1}`;
    currentModel.participants.push({ id, logicalId: id, name: `Participant ${id}`, type: 'participant' });
    renderGridEditor(currentContainer, currentModel);
    triggerChange();
}

function updateParticipant(index, field, value) {
    currentModel.participants[index][field] = value;
    const selects = currentContainer.querySelectorAll('.seq-source, .seq-target');
    selects.forEach(select => {
        const currentVal = select.value;
        select.innerHTML = getParticipantOptions(currentModel.participants, currentVal);
    });
    triggerChange();
}

function deleteParticipant(index) {
    currentModel.participants.splice(index, 1);
    renderGridEditor(currentContainer, currentModel);
    triggerChange();
}

function addItem() {
    const source = currentModel.participants[0]?.id || 'A';
    const target = currentModel.participants[1]?.id || 'B';
    currentModel.items.push({ type: 'message', source, target, arrow: '->>', content: 'Message' });
    renderGridEditor(currentContainer, currentModel);
    triggerChange();
}

function updateItem(index, field, value) {
    if (field === 'source' || field === 'target') {
        const item = currentModel.items[index];
        if (item[field] !== value) {
            item.activation = { activate: false, deactivate: false };
        }
    }

    currentModel.items[index][field] = value;
    if (field === 'arrow' || field === 'activation' || field === 'source' || field === 'target') {
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
    const existing = document.querySelector('.arrow-selector-popover');
    if (existing) existing.remove();

    const btn = event.currentTarget;
    const rect = btn.getBoundingClientRect();

    const popover = document.createElement('div');
    popover.className = 'arrow-selector-popover';

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
        '<<->>': 'Solid / Bi-dir',
        '<<-->>': 'Dotted / Bi-dir'
    };

    Object.keys(ARROW_SVGS).forEach(key => {
        const item = document.createElement('div');
        item.className = 'arrow-selector-item';
        if (key === currentVal) item.classList.add('selected');

        item.innerHTML = `
            <div style="width: 60px; display:flex; justify-content:center;">${ARROW_SVGS[key]}</div>
            <span style="font-size: 0.8rem;">${labels[key] || key}</span>
        `;

        item.addEventListener('click', (e) => {
            e.stopPropagation();
            updateItem(index, 'arrow', key);
            popover.remove();
        });

        popover.appendChild(item);
    });

    document.body.appendChild(popover);

    const closeHandler = (e) => {
        if (!popover.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
            popover.remove();
            document.removeEventListener('mousedown', closeHandler);
        }
    };
    document.addEventListener('mousedown', closeHandler);
}

function renderActivationLines(rowIndex, brackets) {
    const activeBrackets = brackets.filter(b => b.start <= rowIndex && b.end >= rowIndex);
    if (activeBrackets.length === 0) return '';

    let svg = `<svg width="100%" height="100%" style="position:absolute; top:0; left:0; pointer-events:none;">`;

    activeBrackets.forEach(b => {
        const x = b.level * 8 + 6;
        let path = '';
        const topY = 10;
        const bottomY = 36;

        if (b.start === rowIndex && b.end === rowIndex) {
            path = `M${x + 6} ${topY} H${x} V${bottomY} H${x + 6}`;
        } else if (b.start === rowIndex) {
            path = `M${x + 6} ${topY} H${x} V50`;
        } else if (b.end === rowIndex) {
            path = `M${x} 0 V${bottomY} H${x + 6}`;
        } else {
            path = `M${x} 0 V50`;
        }
        svg += `<path d="${path}" stroke="currentColor" stroke-width="1.5" fill="none" class="activation-line" style="color: var(--color-text-tertiary);"/>`;
    });

    svg += `</svg>`;
    return svg;
}

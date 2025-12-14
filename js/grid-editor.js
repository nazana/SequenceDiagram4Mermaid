/**
 * Logic for the Grid UI Editor.
 */

import { ARROW_SVGS } from './mermaid-utils.js';

let currentModel = null;
let onChangeCallback = null;
let currentContainer = null; // Store container for re-rendering

// Persist view state across re-renders
const viewState = {
    participantsExpanded: true,
    sequenceExpanded: true
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

    pContent.style.display = viewState.participantsExpanded ? 'block' : 'none';
    pIcon.style.transform = viewState.participantsExpanded ? 'rotate(180deg)' : 'rotate(0deg)';

    pHeaderToggle.addEventListener('click', () => {
        viewState.participantsExpanded = !viewState.participantsExpanded;
        pContent.style.display = viewState.participantsExpanded ? 'block' : 'none';
        pIcon.style.transform = viewState.participantsExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
    });

    const pWrapper = document.createElement('div');
    pWrapper.className = 'participant-table-wrapper';
    pWrapper.style.border = '1px solid var(--color-border)';
    pWrapper.style.borderRadius = 'var(--border-radius)';
    pWrapper.style.overflow = 'hidden';
    pWrapper.style.marginBottom = '0.5rem';

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

    // Ordered: Handle > No > Type > ID > Name
    pHeader.innerHTML = `
        <span class="col-handle"></span>
        <span class="col-no grid-col-no" style="font-weight:600">No.</span>
        <span style="width: 90px;">Type</span>
        <span style="width: 80px;">ID</span>
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
            <span class="col-no grid-col-no">${index + 1}</span>
            <button class="btn-participant-select p-type-btn" style="width: 90px; flex: none;">
                ${p.type.charAt(0).toUpperCase() + p.type.slice(1)}
            </button>
            <input type="text" class="input-sm p-id" style="width: 80px;" value="${p.logicalId || p.id}" placeholder="ID">
            <input type="text" class="input-sm p-name" style="flex: 1;" value="${p.name || ''}" placeholder="Name (Display)">
            <button class="btn-icon btn-sm btn-delete-p" data-index="${index}"><i class="ph ph-trash"></i></button>
        `;

        const inputs = item.querySelectorAll('input');
        inputs.forEach(inp => inp.addEventListener('input', (e) => {
            const cls = e.target.classList;
            let field = 'name';
            if (cls.contains('p-id')) field = 'logicalId';

            updateParticipant(index, field, e.target.value);
        }));

        item.querySelector('.p-type-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            openParticipantTypeSelector(e, index, p.type);
        });

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

    sContent.style.display = viewState.sequenceExpanded ? 'block' : 'none';
    sIcon.style.transform = viewState.sequenceExpanded ? 'rotate(180deg)' : 'rotate(0deg)';

    const btnAutonumber = sSection.querySelector('#btn-autonumber');
    btnAutonumber.addEventListener('click', (_e) => {
        if (!model.config) model.config = {};
        model.config.autonumber = !model.config.autonumber;

        const isActive = model.config.autonumber;
        btnAutonumber.classList.toggle('active', isActive);
        btnAutonumber.style.color = isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)';
        triggerChange();
    });

    sHeaderToggle.addEventListener('click', () => {
        viewState.sequenceExpanded = !viewState.sequenceExpanded;
        sContent.style.display = viewState.sequenceExpanded ? 'block' : 'none';
        sIcon.style.transform = viewState.sequenceExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
    });

    const sWrapper = document.createElement('div');
    sWrapper.className = 'sequence-table-wrapper';
    sWrapper.style.border = '1px solid var(--color-border)';
    sWrapper.style.borderRadius = 'var(--border-radius)';
    sWrapper.style.overflow = 'hidden';

    // Sequence Header: Ordered to match Participants
    const sHeader = document.createElement('div');
    sHeader.className = 'sequence-header';
    sHeader.style.backgroundColor = 'var(--color-bg-hover)';
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
    sTable.style.border = 'none';
    sTable.style.borderRadius = '0';

    // Brackets Calculation
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
    // Mark unclosed activations
    openActivations.forEach(a => {
        brackets.push({ start: a.startRow, end: model.items.length - 1, level: a.level, unclosed: true });
    });


    model.items.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'seq-row';
        row.dataset.index = index;
        row.style.borderBottom = '1px solid var(--color-border)';
        if (index === model.items.length - 1) row.style.borderBottom = 'none';

        if (item.type === 'message') {
            const isDeactivateActive = !!item.activation?.deactivate;
            const isSourceActive = checkIsActiveAt(model, index, item.source);

            let isSafeToEnableDeactivate = true;
            if (!isDeactivateActive) {
                isSafeToEnableDeactivate = checkSimulation(model, index, { deactivate: true }, item.source);
            }

            const canDeactivate = isDeactivateActive || (isSourceActive && isSafeToEnableDeactivate);

            let deactivateTitle = "Deactivate Source (-)";
            if (!isSourceActive) deactivateTitle = "Inactive (nothing to deactivate)";
            else if (!isSafeToEnableDeactivate) deactivateTitle = "Cannot deactivate (breaks future flow)";

            const isActivateActive = !!item.activation?.activate;
            let isSafeToDisableActivate = true;
            if (isActivateActive) {
                isSafeToDisableActivate = checkSimulation(model, index, { activate: false }, item.target);
            }

            const canActivate = !isActivateActive || isSafeToDisableActivate;
            let activateTitle = "Activate Target (+)";
            if (isActivateActive && !isSafeToDisableActivate) activateTitle = "Cannot disable (required by later deactivate)";


            row.style.position = 'relative';
            row.innerHTML = `
                ${renderActivationLines(index, brackets)}
                <span class="col-handle" style="position: relative;">
                    <i class="ph ph-dots-six-vertical"></i>
                </span>
                <span class="col-no grid-col-no">${index + 1}</span>

                <span class="col-source" style="display: flex; align-items: center; gap: 4px;">
                    <button class="btn-icon btn-sm btn-deactivate ${isDeactivateActive ? 'active' : ''}" 
                        title="${deactivateTitle}"
                        ${!canDeactivate ? 'disabled' : ''}>
                        <i class="ph ph-minus-circle"></i>
                    </button>
                    <button class="btn-participant-select seq-source-btn">
                        ${getParticipantLabel(model.participants, item.source)}
                    </button>
                </span>
                <span class="col-swap">
                    <button class="btn-swap" title="Swap Source/Target">
                        <i class="ph ph-arrows-left-right"></i>
                    </button>
                </span>
                <span class="col-target" style="display: flex; align-items: center; gap: 4px;">
                     <button class="btn-participant-select seq-target-btn">
                        ${getParticipantLabel(model.participants, item.target)}
                    </button>
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

            // Events
            row.querySelector('.seq-source-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                openParticipantSelector(e, index, 'source', item.source);
            });

            row.querySelector('.btn-arrow-type').addEventListener('click', (e) => {
                e.stopPropagation();
                openArrowSelector(e, index, item.arrow);
            });
            // Arrow selector single line fix is in openArrowSelector

            const btnSwap = row.querySelector('.btn-swap');
            if (btnSwap) {
                btnSwap.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const temp = item.source;
                    item.source = item.target;
                    item.target = temp;
                    item.activation = { activate: false, deactivate: false };
                    try {
                        autoCorrectActivations(currentModel); // Fix future inconsistencies
                        renderGridEditor(container, currentModel);
                    } catch (e) {
                        console.error("Auto-correction error in Swap:", e);
                    }
                    triggerChange();
                });
            }

            row.querySelector('.seq-target-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                openParticipantSelector(e, index, 'target', item.target);
            });
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
            row.style.position = 'relative';
            row.innerHTML = `
                ${renderActivationLines(index, brackets)}
                <span class="col-handle" style="position: relative;">
                    <i class="ph ph-dots-six-vertical"></i>
                </span>
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

// ** Logic for Validation **
function checkIsActiveAt(model, rowIndex, participantId) {
    let count = 0;
    for (let i = 0; i < rowIndex; i++) {
        const item = model.items[i];
        if (item.activation?.deactivate && item.source === participantId) count--;
        if (item.activation?.activate && item.target === participantId) count++;
    }
    return count > 0;
}

function checkSimulation(model, overrideIndex, overrideState, participantId) {
    let count = 0;

    for (let i = 0; i < model.items.length; i++) {
        const item = model.items[i];

        let deactivate = item.activation?.deactivate;
        let activate = item.activation?.activate;

        if (i === overrideIndex) {
            if (overrideState.deactivate !== undefined) deactivate = overrideState.deactivate;
            if (overrideState.activate !== undefined) activate = overrideState.activate;
        }

        if (deactivate && item.source === participantId) {
            if (count <= 0) return false;
            count--;
        }

        if (activate && item.target === participantId) {
            count++;
        }
    }
    return true;
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
    renderGridEditor(currentContainer, currentModel);
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

// ... (previous code)

function autoCorrectActivations(model) {
    const activeCounts = {};
    let changed = false;

    model.items.forEach(item => {
        // 1. Check Deactivate
        if (item.activation?.deactivate) {
            const count = activeCounts[item.source] || 0;
            if (count <= 0) {
                // Invalid deactivate! Turn it off.
                item.activation.deactivate = false;
                changed = true;
            } else {
                activeCounts[item.source]--;
            }
        }

        // 2. Apply Activate
        if (item.activation?.activate) {
            activeCounts[item.target] = (activeCounts[item.target] || 0) + 1;
        }
    });

    return changed;
}

function updateItem(index, field, value) {
    if (field === 'source' || field === 'target') {
        const item = currentModel.items[index];
        if (item[field] !== value) {
            // Reset activation on the changed row itself
            item.activation = { activate: false, deactivate: false };
        }
    }

    currentModel.items[index][field] = value;

    let shouldRender = false;

    // Auto-correct subsequent rows if activation flow changed
    if (field === 'activation' || field === 'source' || field === 'target') {
        try {
            const wasCorrected = autoCorrectActivations(currentModel);
            if (wasCorrected) {
                // Optional: Show toast or log to let user know why it turned off
                console.warn("Auto-corrected invalid activations.");
            }
        } catch (e) {
            console.error("Auto-correction error in updateItem:", e);
        }
        shouldRender = true;
    } else if (field !== 'content') {
        // Convert arrow, etc. requires re-render to update icon
        shouldRender = true;
    }

    if (shouldRender) {
        renderGridEditor(currentContainer, currentModel);
    }

    triggerChange();
}

function deleteItem(index) {
    currentModel.items.splice(index, 1);
    try {
        autoCorrectActivations(currentModel); // Check consistency after delete
        renderGridEditor(currentContainer, currentModel);
    } catch (e) {
        console.error("Auto-correction error in deleteItem:", e);
    }
    triggerChange();
}

// ... internal Swap Logic needs update too ...


function getParticipantLabel(participants, id) {
    const p = participants.find(p => p.id === id);
    if (!p) return id;
    const logicalId = p.logicalId || p.id;
    const name = p.name || logicalId;
    return `[${logicalId}] ${name}`;
}

function openParticipantSelector(event, index, field, currentVal) {
    const existing = document.querySelector('.participant-selector-popover');
    if (existing) existing.remove();

    const btn = event.currentTarget;

    const popover = document.createElement('div');
    popover.className = 'participant-selector-popover';
    popover.style.position = 'fixed';

    // Positioning logic (same as arrow selector)
    const updatePosition = () => {
        const rect = btn.getBoundingClientRect();
        popover.style.top = `${rect.bottom + 4}px`;
        popover.style.left = `${rect.left}px`;
        // Adjust width to match button or min-width
        popover.style.minWidth = `${rect.width}px`;
    };
    updatePosition();

    currentModel.participants.forEach(p => {
        const item = document.createElement('div');
        item.className = 'participant-option';
        if (p.id === currentVal) item.classList.add('selected');

        const logicalId = p.logicalId || p.id;
        const name = p.name || logicalId;
        const label = `[${logicalId}] ${name}`;

        item.innerHTML = `<span>${label}</span>`;

        item.addEventListener('click', (e) => {
            e.stopPropagation();
            updateItem(index, field, p.id);
            cleanup();
        });

        popover.appendChild(item);
    });

    document.body.appendChild(popover);

    const cleanup = () => {
        popover.remove();
        document.removeEventListener('mousedown', closeHandler);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
    };

    const closeHandler = (e) => {
        if (!popover.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
            cleanup();
        }
    };

    document.addEventListener('mousedown', closeHandler);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
}

function openParticipantTypeSelector(event, index, currentVal) {
    const existing = document.querySelector('.participant-selector-popover');
    if (existing) existing.remove();

    const btn = event.currentTarget;

    const popover = document.createElement('div');
    popover.className = 'participant-selector-popover';
    popover.style.position = 'fixed';

    const updatePosition = () => {
        const rect = btn.getBoundingClientRect();
        popover.style.top = `${rect.bottom + 4}px`;
        popover.style.left = `${rect.left}px`;
        popover.style.minWidth = `${rect.width}px`;
    };
    updatePosition();

    const types = [
        { id: 'participant', label: 'Participant' },
        { id: 'actor', label: 'Actor' }
    ];

    types.forEach(t => {
        const item = document.createElement('div');
        item.className = 'participant-option';
        if (t.id === currentVal) item.classList.add('selected');

        item.innerHTML = `<span>${t.label}</span>`;

        item.addEventListener('click', (e) => {
            e.stopPropagation();
            updateParticipant(index, 'type', t.id);
            cleanup();
        });

        popover.appendChild(item);
    });

    document.body.appendChild(popover);

    const cleanup = () => {
        popover.remove();
        document.removeEventListener('mousedown', closeHandler);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
    };

    const closeHandler = (e) => {
        if (!popover.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
            cleanup();
        }
    };

    document.addEventListener('mousedown', closeHandler);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
}

function openArrowSelector(event, index, currentVal) {
    const existing = document.querySelector('.arrow-selector-popover');
    if (existing) existing.remove();

    const btn = event.currentTarget;

    // Create popover
    const popover = document.createElement('div');
    popover.className = 'arrow-selector-popover';
    // Ensure fixed positioning via JS or CSS (CSS likely has absolute, so override)
    popover.style.position = 'fixed';

    const updatePosition = () => {
        const rect = btn.getBoundingClientRect();
        // Check if button is off-screen (optional, but good UX)
        // For now, just follow.
        popover.style.top = `${rect.bottom + 4}px`;
        popover.style.left = `${rect.left}px`;
    };

    // Initial position
    updatePosition();

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
        item.className = 'arrow-option';
        if (key === currentVal) item.classList.add('selected');

        item.innerHTML = `
            <div style="width: 60px; display:flex; justify-content:center;">${ARROW_SVGS[key]}</div>
            <span style="font-size: 0.8rem;">${labels[key] || key}</span>
        `;

        item.addEventListener('click', (e) => {
            e.stopPropagation();
            updateItem(index, 'arrow', key);
            cleanup();
        });

        popover.appendChild(item);
    });

    document.body.appendChild(popover);

    // Event Listeners for cleanup and update
    const cleanup = () => {
        popover.remove();
        document.removeEventListener('mousedown', closeHandler);
        window.removeEventListener('scroll', updatePosition, true); // Capture phase to catch all scrolls
        window.removeEventListener('resize', updatePosition);
    };

    const closeHandler = (e) => {
        if (!popover.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
            cleanup();
        }
    };

    document.addEventListener('mousedown', closeHandler);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
}

function renderActivationLines(rowIndex, brackets) {
    // Filter: Hide unclosed brackets
    const activeBrackets = brackets.filter(b => !b.unclosed && b.start <= rowIndex && b.end >= rowIndex);
    if (activeBrackets.length === 0) return '';

    // SVG Position: left 42px (34px + 8px padding) to align clearly between handle and No column
    let svg = `<svg width="100%" height="100%" style="position:absolute; top:0; left:42px; pointer-events:none; overflow:visible;">`;

    activeBrackets.forEach(b => {
        const x = b.level * 6;
        const w = 4; // Bracket horizontal width
        const stroke = `stroke="currentColor" stroke-width="1.5" style="color: var(--color-text-tertiary);"`;

        if (b.start === rowIndex && b.end === rowIndex) {
            // Single row: short bracket around center
            svg += `<line x1="${x + w}" y1="30%" x2="${x}" y2="30%" ${stroke}/>`;
            svg += `<line x1="${x}" y1="30%" x2="${x}" y2="70%" ${stroke}/>`;
            svg += `<line x1="${x}" y1="70%" x2="${x + w}" y2="70%" ${stroke}/>`;
        } else if (b.start === rowIndex) {
            // Start: Center(50%) -> Bottom(100%)
            svg += `<line x1="${x + w}" y1="50%" x2="${x}" y2="50%" ${stroke}/>`;
            svg += `<line x1="${x}" y1="50%" x2="${x}" y2="100%" ${stroke}/>`;
        } else if (b.end === rowIndex) {
            // End: Top(0%) -> Center(50%)
            svg += `<line x1="${x}" y1="0%" x2="${x}" y2="50%" ${stroke}/>`;
            svg += `<line x1="${x}" y1="50%" x2="${x + w}" y2="50%" ${stroke}/>`;
        } else {
            // Middle: Full height
            svg += `<line x1="${x}" y1="0%" x2="${x}" y2="100%" ${stroke}/>`;
        }
    });

    svg += `</svg>`;
    return svg;
}

/* global lucide */
import { renderMermaid, parseMermaidCode, generateMermaidCode, sanitizeMermaidCode } from './mermaid-utils.js';
import { initGridEditor, renderGridEditor } from './grid-editor.js';
import { getCurrentUser, saveUser, getDiagram, createDiagram, updateDiagram, getDiagramVersions, getVersion, getGroup } from './storage.js';
import { showAlert, showPrompt, showConfirm } from './ui-utils.js';

import {
    initSmartGuide
} from './editor-guide.js';

// DOM Elements
const markdownInput = document.getElementById('markdown-input');
const mermaidOutput = document.getElementById('mermaid-output');
const mermaidContainer = document.getElementById('mermaid-container');
const btnZoomIn = document.getElementById('btn-zoom-in');
const btnZoomOut = document.getElementById('btn-zoom-out');
const btnZoomReset = document.getElementById('btn-zoom-reset');
const tabButtons = document.querySelectorAll('.tab-item');
const tabContents = document.querySelectorAll('.tab-content');
const gridContainer = document.getElementById('grid-editor-container');

// Toolbar Buttons
const btnSave = document.getElementById('btn-save');
const btnHistory = document.getElementById('btn-history');
const btnNew = document.getElementById('btn-new');

// Modal Elements
const historyModal = document.getElementById('history-modal');
const btnCloseHistory = document.getElementById('btn-close-history');
const historyList = document.getElementById('history-list');

// State
let panzoomInstance = null;
let activeTab = 'grid'; // grid | markdown
let currentDiagramId = null;
window.isPanning = false;

// Initial Default Diagram
// Initial Default Diagram
const DEFAULT_DIAGRAM = `sequenceDiagram
    participant A as Alice
    participant B as Bob

    A ->> B: Hello Bob, how are you ?
    B ->> A : Great!
        `;

// Initialize App
async function init() {
    console.log('Initializing Mermaid Editor...');

    // Check URL Param
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const groupId = urlParams.get('groupId');
    if (groupId) {
        window.currentGroupId = groupId;
    }

    if (id) {
        const diagram = getDiagram(id);
        if (diagram) {
            console.log('Loaded diagram:', diagram);
            console.log('Loaded diagram:', diagram);
            currentDiagramId = id;

            // Render Breadcrumb in Header
            renderHeaderBreadcrumb(diagram);

            // Get latest version
            const latestVersion = getVersion(diagram.latestVersionId);
            // Sanitize content to fix potential data corruption (e.g. invalid arrow dashes)
            markdownInput.value = sanitizeMermaidCode(latestVersion ? latestVersion.code : DEFAULT_DIAGRAM);
        } else {
            await showAlert('Diagram not found. Redirecting to dashboard.');
            window.location.href = 'dashboard.html';
            return;
        }
    } else {
        // New Diagram
        markdownInput.value = DEFAULT_DIAGRAM;
    }

    // Initialize Grid Logic
    initGridEditor(onGridChange);

    // Setup Panzoom
    if (typeof Panzoom !== 'undefined') {
        panzoomInstance = Panzoom(mermaidOutput, {
            maxScale: 10,
            minScale: 0.1,
            step: 0.1, // 10% step
            canvas: true, // Treat as canvas (better for SVG)
        });

        // Fix for "problems with mermaid": Mermaid re-rendering might not need Panzoom re-init, 
        // as we attached it to the wrapper.
    } else {
        console.error('Panzoom library not loaded');
    }

    // Setup Event Listeners
    setupEditors();
    setupToolbar();
    setupDetailPanel();
    setupDataActions();

    // Initial Render
    await syncFromMarkdown();

    // Set initial tab UI
    updateTabUI();

    // Initialize Icons
    if (window.lucide) {
        lucide.createIcons();
    }
}

function updateTabUI() {
    tabButtons.forEach(btn => {
        if (btn.dataset.tab === activeTab) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    tabContents.forEach(content => {
        if (content.id === `tab-${activeTab}`) content.classList.remove('hidden');
        else content.classList.add('hidden');
    });
}

function onGridChange(model) {
    try {
        const code = generateMermaidCode(model);
        if (markdownInput.value !== code) {
            markdownInput.value = code;
            renderMermaid(code, mermaidOutput).then((success) => {
                if (success) {
                    setupCanvasInteractions();
                } else {
                    console.error('Mermaid render failed');
                }
            });
        }
    } catch (e) {
        console.error('Error generating mermaid code:', e);
        // showToast('Error updating diagram: ' + e.message);
    }
}

async function syncFromMarkdown() {
    const code = markdownInput.value;
    await renderMermaid(code, mermaidOutput);
    setupCanvasInteractions();
    const model = parseMermaidCode(code);
    renderGridEditor(gridContainer, model);
}

// Breadcrumb Logic
function renderHeaderBreadcrumb(diagram) {
    const headerLogoArea = document.getElementById('header-logo-area');
    if (!headerLogoArea) return;

    const path = [];
    if (diagram.groupId) {
        let curr = getGroup(diagram.groupId);
        while (curr) {
            path.unshift(curr);
            if (!curr.parentId) break;
            curr = getGroup(curr.parentId);
        }
    }

    // Build HTML
    // Home > Group > ... > Diagram
    // Build HTML
    // Home > Group > ... > Diagram
    let html = `
    <a href="dashboard.html" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 0.5rem;" title="Dashboard">
        <i data-lucide="house" style="width: 1.2rem; height: 1.2rem;"></i>
    </a>
    `;

    path.forEach(g => {
        html += `
    <span style="opacity: 0.5; font-size: 0.8rem; display: flex; align-items: center;"><i data-lucide="chevron-right" style="width: 14px; height: 14px;"></i></span>
        <a href="dashboard.html?groupId=${g.id}" style="text-decoration: none; color: inherit; font-size: 0.95rem;">
            ${g.name}
        </a>
`;
    });

    html += `
    <span style="opacity: 0.5; font-size: 0.8rem; display: flex; align-items: center;"><i data-lucide="chevron-right" style="width: 14px; height: 14px;"></i></span>
        <span style="font-weight: 600; color: var(--color-primary); font-size: 0.95rem;">
            ${diagram.title}
        </span>
`;

    headerLogoArea.innerHTML = html;
    if (window.lucide) lucide.createIcons();
}

// Global functions for Interaction
window.onGridRowSelect = function (index) {
    // 1. Highlight Grid Row
    const rows = document.querySelectorAll('.seq-row');
    rows.forEach(r => r.classList.remove('selected'));

    // Find row with dataset.index == index
    const targetRow = Array.from(rows).find(r => parseInt(r.dataset.index) === index);
    if (targetRow) {
        targetRow.classList.add('selected');
        // Scroll into view if needed
        targetRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // 2. Highlight Mermaid Element
    // We need to find the corresponding message in SVG.
    // Strategy: Assuming .messageText elements correspond roughly to message items.
    // Notes are .noteText.

    // Clear previous highlights & Reset Markers
    mermaidOutput.querySelectorAll('.mermaid-selected-text').forEach(el => el.classList.remove('mermaid-selected-text'));
    mermaidOutput.querySelectorAll('.mermaid-selected-line').forEach(el => {
        el.classList.remove('mermaid-selected-line');
        // Reset marker if changed
        if (el.dataset.originalMarker) {
            el.setAttribute('marker-end', el.dataset.originalMarker);
            delete el.dataset.originalMarker;
        }
    });

    // Remove any previously created temporary markers to keep DOM clean
    const svg = mermaidOutput.querySelector('svg');
    if (svg) {
        svg.querySelectorAll('.temp-selected-marker').forEach(m => m.remove());
    }

    // Grid index includes ALL items (messages + notes).
    const model = parseMermaidCode(markdownInput.value);

    // Check if the selected item is actually a message
    if (model.items[index] && model.items[index].type === 'message') {

        // 1. Calculate which "Message Index" (k-th message) this Grid Item corresponds to
        let targetMsgIndex = 0;
        for (let i = 0; i < index; i++) {
            if (model.items[i].type === 'message') targetMsgIndex++;
        }

        // 2. Get all Message Texts from DOM and Sort by Y-coordinate (Visual Order)
        // This bypasses any internal index mismatch or content drift issues.
        const allTexts = Array.from(mermaidOutput.querySelectorAll('.messageText'));
        allTexts.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

        if (allTexts[targetMsgIndex]) {
            const textEl = allTexts[targetMsgIndex];
            textEl.classList.add('mermaid-selected-text');

            // Note: Line highlighting logic removed as per user request to only highlight label.
        }
    }
};

// Setup click interactions for Mermaid diagram elements
function setupCanvasInteractions() {
    const messageTexts = Array.from(mermaidOutput.querySelectorAll('.messageText'));
    const model = parseMermaidCode(markdownInput.value);

    messageTexts.forEach((el) => {
        // Enforce pointer cursor so user knows it's clickable
        el.style.cursor = 'pointer';
        el.style.pointerEvents = 'all'; // Ensure it captures events

        // Remove old listeners to be safe (though usually new elements)
        // Since we are adding anonymous function, we can't remove easily.
        // Assuming elements are fresh from renderMermaid.

        el.onclick = (e) => {
            e.stopPropagation();

            // Panning check removed to ensure click works. 
            // If dragging happens, usually click is suppressed by browser or library, but if not, selecting row is harmless.

            // 1. Determine Visual Index
            // Re-query to get current visual order
            const currentTexts = Array.from(mermaidOutput.querySelectorAll('.messageText'));
            // Visual sort
            currentTexts.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

            const visualIndex = currentTexts.indexOf(el);

            if (visualIndex === -1) {
                console.warn('Clicked element not found in current text list');
                return;
            }

            // 2. Map Visual Index -> Grid Index
            let currentMsgCount = 0;
            let targetGridIndex = -1;

            for (let i = 0; i < model.items.length; i++) {
                if (model.items[i].type === 'message') {
                    if (currentMsgCount === visualIndex) {
                        targetGridIndex = i;
                        break;
                    }
                    currentMsgCount++;
                }
            }

            if (targetGridIndex !== -1) {
                window.onGridRowSelect(targetGridIndex);
            }
        };
    });
}

function setupEditors() {
    let timeout;
    markdownInput.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            syncFromMarkdown();
        }, 500);
    });

    // Initialize Smart Guide
    // initSmartGuide(markdownInput);

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            if (activeTab === tabName) return;

            activeTab = tabName;

            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            tabContents.forEach(c => c.classList.add('hidden'));
            document.getElementById(`tab-${tabName}`).classList.remove('hidden');

            if (tabName === 'grid') {
                const model = parseMermaidCode(markdownInput.value);
                renderGridEditor(gridContainer, model);
            }
        });
    });
}

function setupToolbar() {
    if (!panzoomInstance) return;

    // Custom Linear Zoom (Add/Subtract 0.1) to prevent exponential zooming (100 > 111 > 122)
    function performLinearZoom(isZoomIn) {
        const currentScale = panzoomInstance.getScale();
        const step = 0.1;
        let newScale;

        if (isZoomIn) {
            // e.g. 1.0 -> 1.1
            newScale = Math.round((currentScale + step) * 10) / 10;
        } else {
            // e.g. 1.0 -> 0.9
            newScale = Math.round((currentScale - step) * 10) / 10;
        }

        // Clamp
        newScale = Math.max(0.1, Math.min(10, newScale));

        // Apply zoom
        panzoomInstance.zoom(newScale);
    }

    // Wheel Zoom with Throttling to prevent erratic jumping
    let wheelThrottleTimer = null;
    mermaidContainer.addEventListener('wheel', (e) => {
        e.preventDefault();

        // Simple throttle: run only if no timer active
        if (wheelThrottleTimer) return;

        wheelThrottleTimer = setTimeout(() => {
            wheelThrottleTimer = null;
        }, 20); // 20ms throttling for smoother but controlled feel

        if (e.deltaY < 0) {
            performLinearZoom(true);
        } else {
            performLinearZoom(false);
        }
    });

    btnZoomIn.addEventListener('click', () => performLinearZoom(true));
    btnZoomOut.addEventListener('click', () => performLinearZoom(false));
    btnZoomReset.addEventListener('click', () => panzoomInstance.reset());

    // Zoom Level Display
    const zoomLevelEl = document.getElementById('zoom-level');
    const updateZoomLevel = () => {
        if (panzoomInstance && zoomLevelEl) {
            const scale = panzoomInstance.getScale();
            zoomLevelEl.textContent = `${Math.round(scale * 100)}% `;
        }
    };

    mermaidOutput.addEventListener('panzoomzoom', updateZoomLevel);
    mermaidOutput.addEventListener('panzoomreset', updateZoomLevel);
    // Initial update
    updateZoomLevel();
}

function setupDetailPanel() {
    const resizer = document.getElementById('resizer');
    const editorPanel = document.querySelector('.editor-panel');

    const btnCloseSidebar = document.getElementById('btn-close-sidebar');

    let isCollapsed = false;

    // Create collapsed sidebar toggle button
    const collapsedBtn = document.createElement('div');
    collapsedBtn.className = 'collapsed-sidebar-btn';
    collapsedBtn.title = '에디터 열기';
    collapsedBtn.innerHTML = '<i data-lucide="chevrons-right"></i>';
    collapsedBtn.addEventListener('click', toggleSidebar);
    editorPanel.appendChild(collapsedBtn);
    if (window.lucide) lucide.createIcons();

    function toggleSidebar() {
        isCollapsed = !isCollapsed;

        if (isCollapsed) {
            editorPanel.classList.add('collapsed');

            // Show floating open button
            if (!document.querySelector('.collapsed-sidebar-trans-btn')) {
                const floatBtn = document.createElement('div');
                floatBtn.className = 'collapsed-sidebar-trans-btn';
                floatBtn.title = '에디터 열기';
                floatBtn.innerHTML = '<i data-lucide="panel-left-open"></i>';
                floatBtn.addEventListener('click', toggleSidebar);
                document.querySelector('.app-main').appendChild(floatBtn);
                if (window.lucide) lucide.createIcons();
            } else {
                document.querySelector('.collapsed-sidebar-trans-btn').style.display = 'flex';
            }
        } else {
            editorPanel.classList.remove('collapsed');
            const floatBtn = document.querySelector('.collapsed-sidebar-trans-btn');
            if (floatBtn) floatBtn.style.display = 'none';
        }
    }


    btnCloseSidebar.addEventListener('click', toggleSidebar);

    // Hide Resizer as width is fixed
    if (resizer) resizer.style.display = 'none';
}

function setupDataActions() {
    // New
    btnNew.addEventListener('click', async () => {
        if (await showConfirm('Create new diagram? Unsaved changes will be lost.', '새 다이어그램')) {
            window.location.href = 'index.html';
        }
    });

    // Save
    btnSave.addEventListener('click', async () => {
        let user = getCurrentUser();
        // If no user, ask for name
        if (!user || !user.name) {
            const name = await showPrompt('작성자 이름을 입력해주세요:', 'User', '사용자 등록');
            if (name) {
                user = saveUser(name);
            } else {
                return;
            }
        }

        const code = markdownInput.value;
        if (!code.trim()) {
            await showAlert('저장할 내용이 없습니다.');
            return;
        }

        try {
            // Capture Thumbnail (SVG String)
            let thumbnail = null;
            try {
                const svgEl = mermaidOutput.querySelector('svg');
                if (svgEl) {
                    const clone = svgEl.cloneNode(true);
                    clone.removeAttribute('height'); // Remove fixed height for better scaling
                    clone.removeAttribute('width');
                    clone.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                    clone.style.maxWidth = '100%';
                    thumbnail = clone.outerHTML;
                }
            } catch (err) {
                console.warn('Thumbnail capture failed:', err);
            }

            if (currentDiagramId) {
                // Update
                const note = await showPrompt('변경 사항에 대한 메모를 남겨주세요:', 'Update', '버전 저장');
                if (note === null) return; // Cancelled
                updateDiagram(currentDiagramId, code, user.name, note, thumbnail);
                await showAlert('저장되었습니다!');
            } else {
                // Create
                const title = await showPrompt('다이어그램 제목을 입력해주세요:', 'My Diagram', '새 다이어그램');
                if (!title) return; // Cancelled
                const diagram = createDiagram(title, code, user.name, window.currentGroupId || null, thumbnail);
                currentDiagramId = diagram.id;

                // Update Breadcrumb
                renderHeaderBreadcrumb(diagram);

                // Update URL without reload
                const newUrl = `${window.location.pathname}?id = ${currentDiagramId} `;
                window.history.pushState({ path: newUrl }, '', newUrl);
                await showAlert('새로운 다이어그램이 생성되었습니다!');
            }
        } catch (e) {
            console.error('Save failed:', e);
            await showAlert('저장 중 오류가 발생했습니다: ' + e.message, '오류');
        }
    });

    // History
    btnHistory.addEventListener('click', async () => {
        if (!currentDiagramId) {
            await showAlert('저장된 다이어그램 이력이 없습니다.');
            return;
        }

        const versions = getDiagramVersions(currentDiagramId);
        renderHistoryList(versions);
        historyModal.classList.remove('hidden');
    });

    btnCloseHistory.addEventListener('click', () => {
        historyModal.classList.add('hidden');
    });

    // Close modal on click outside
    historyModal.addEventListener('click', (e) => {
        if (e.target === historyModal) {
            historyModal.classList.add('hidden');
        }
    });
}

function renderHistoryList(versions) {
    historyList.innerHTML = versions.map((v, index) => `
    < li class="history-item" data - id="${v.id}" >
            <div class="history-item-meta">
                <span>Version ${versions.length - index}</span>
                <span>${new Date(v.timestamp).toLocaleString()}</span>
            </div>
            <div class="history-item-note">${v.note || 'No note'}</div>
            <div class="history-item-meta">By ${v.authorName}</div>
        </li >
    `).join('');

    // Add click listeners
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            if (confirm('이 버전으로 복구하시겠습니까? 현재 내용은 덮어씌워집니다.')) {
                const versionId = item.dataset.id;
                const version = getVersion(versionId);
                if (version) {
                    markdownInput.value = version.code;
                    syncFromMarkdown();
                    historyModal.classList.add('hidden');
                }
            }
        });
    });
}

// Start
init();

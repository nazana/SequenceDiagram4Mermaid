import { renderMermaid, parseMermaidCode, generateMermaidCode, sanitizeMermaidCode } from './mermaid-utils.js';
import { initGridEditor, renderGridEditor } from './grid-editor.js';
import { getCurrentUser, saveUser, getDiagram, createDiagram, updateDiagram, getDiagramVersions, getVersion } from './storage.js';
import { showAlert, showPrompt, showConfirm } from './ui-utils.js';

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

// Initial Default Diagram
// Initial Default Diagram
const DEFAULT_DIAGRAM = `sequenceDiagram
    participant A as Alice
    participant B as Bob
    
    A->>B: Hello Bob, how are you?
    B->>A: Great!
`;

// Initialize App
async function init() {
    console.log('Initializing Mermaid Editor...');

    // Check URL Param
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (id) {
        const diagram = getDiagram(id);
        if (diagram) {
            console.log('Loaded diagram:', diagram);
            currentDiagramId = id;
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
    /*
    panzoomInstance = Panzoom(mermaidOutput, {
        maxScale: 5,
        minScale: 0.1,
        step: 0.1,
        contain: 'outside',
    });
    */

    // Setup Event Listeners
    setupEditors();
    // setupToolbar();
    setupDetailPanel();
    setupDataActions();

    // Initial Render
    await syncFromMarkdown();

    // Set initial tab UI
    updateTabUI();
}

function updateTabUI() {
    tabButtons.forEach(btn => {
        if (btn.dataset.tab === activeTab) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    tabContents.forEach(content => {
        if (content.id === `${activeTab}-editor`) content.classList.add('active');
        else content.classList.remove('active');
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
    const messageTexts = mermaidOutput.querySelectorAll('.messageText');

    // Clear previous highlights
    mermaidOutput.querySelectorAll('.mermaid-selected-text').forEach(el => el.classList.remove('mermaid-selected-text'));
    mermaidOutput.querySelectorAll('.mermaid-selected-line').forEach(el => el.classList.remove('mermaid-selected-line'));

    // Grid index includes ALL items (messages + notes).
    // But .messageText ONLY includes messages.
    // We need to map Grid Item Index -> Message Index (skipping items that act as messages but are not messages? Wait.
    // items in grid: [Msg, Note, Msg] -> Indices: 0, 1, 2.
    // Mermaid .messageText: [Msg, Msg]. Indices: 0, 1.
    // Note .noteText: [Note].

    // So we need to count how many messages are before the selected index in the Grid Model.
    // To do this accurately, we need the current Model in 'onGridRowSelect'.
    // We can re-parse markdownInput to get model... or pass it. But for now simplest is re-parse or global state.
    const model = parseMermaidCode(markdownInput.value);

    // Check if the selected item is actually a message
    if (model.items[index] && model.items[index].type === 'message') {
        // Calculate message index (nth message)
        let msgIndex = 0;
        for (let i = 0; i < index; i++) {
            if (model.items[i].type === 'message') msgIndex++;
        }

        if (messageTexts[msgIndex]) {
            const textEl = messageTexts[msgIndex];
            textEl.classList.add('mermaid-selected-text');

            // Try to highlight the line too. 
            // Usually the line is a path with id like 'L-A-B-0', but sometimes hard to find.
            // Often it is a sibling or nearby.
            // For now, text highlight is effective enough, or we can look for .messageLine0, .messageLine1 (Mermaid internal classes).
            const lineEl = mermaidOutput.querySelector(`.messageLine${msgIndex}`);
            if (lineEl) lineEl.classList.add('mermaid-selected-line');

            // Panzoom to element? Maybe too jarring.
        }
    }
};

function setupCanvasInteractions() {
    // Add click listeners to Mermaid Messages
    const messageTexts = mermaidOutput.querySelectorAll('.messageText');
    const model = parseMermaidCode(markdownInput.value);

    messageTexts.forEach((el, msgIndex) => {
        el.style.cursor = 'pointer';
        el.addEventListener('click', (e) => {
            e.stopPropagation();

            // Reverse mapping: Message Index -> Grid Index
            let currentMsgCount = 0;
            let targetGridIndex = -1;

            for (let i = 0; i < model.items.length; i++) {
                if (model.items[i].type === 'message') {
                    if (currentMsgCount === msgIndex) {
                        targetGridIndex = i;
                        break;
                    }
                    currentMsgCount++;
                }
            }

            if (targetGridIndex !== -1) {
                window.onGridRowSelect(targetGridIndex);
            }
        });
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
    mermaidContainer.addEventListener('wheel', panzoomInstance.zoomWithWheel);
    btnZoomIn.addEventListener('click', () => panzoomInstance.zoomIn());
    btnZoomOut.addEventListener('click', () => panzoomInstance.zoomOut());
    btnZoomReset.addEventListener('click', () => panzoomInstance.reset());
}

function setupDetailPanel() {
    const resizer = document.getElementById('resizer');
    const editorPanel = document.querySelector('.editor-panel');
    let isResizing = false;
    let isVertical = window.innerWidth <= 768; // Initial check

    window.addEventListener('resize', () => {
        isVertical = window.innerWidth <= 768;
    });

    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const btnCloseSidebar = document.getElementById('btn-close-sidebar');

    let isCollapsed = false;
    let lastWidth = '50%';

    // Create collapsed sidebar toggle button
    const collapsedBtn = document.createElement('div');
    collapsedBtn.className = 'collapsed-sidebar-btn';
    collapsedBtn.title = '에디터 열기';
    collapsedBtn.innerHTML = '<i class="ph ph-caret-double-right"></i>';
    collapsedBtn.addEventListener('click', toggleSidebar);
    editorPanel.appendChild(collapsedBtn);

    function toggleSidebar() {
        isCollapsed = !isCollapsed;

        if (isCollapsed) {
            lastWidth = editorPanel.style.width || '50%';
            editorPanel.classList.add('collapsed');
            editorPanel.style.width = ''; // Let CSS take over
            editorPanel.style.minWidth = ''; // Let CSS take over
            editorPanel.style.flex = 'none'; // Ensure CSS width works
            resizer.style.display = 'none';
        } else {
            editorPanel.classList.remove('collapsed');
            editorPanel.style.flex = 'none';
            editorPanel.style.width = lastWidth;
            editorPanel.style.minWidth = '300px';
            resizer.style.display = 'flex';
        }
    }

    btnToggleSidebar.addEventListener('click', toggleSidebar);
    btnCloseSidebar.addEventListener('click', toggleSidebar);

    // Initial resize check logic removed or simplified
    window.addEventListener('resize', () => {
        isVertical = window.innerWidth <= 768;
    });

    // Make sure resizing sets flex to none to respect width
    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        editorPanel.style.flex = 'none';
        document.body.style.cursor = isVertical ? 'row-resize' : 'col-resize';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        if (isVertical) {
            // Adjust Height
            const newHeight = e.clientY - 60; // Subtract header height approx
            if (newHeight > 100 && newHeight < document.body.clientHeight - 100) {
                editorPanel.style.height = `${newHeight}px`;
            }
        } else {
            // Adjust Width
            const newWidth = e.clientX;
            if (newWidth > 200 && newWidth < document.body.clientWidth - 200) {
                editorPanel.style.width = `${newWidth}px`;
            }
        }
    });

    document.addEventListener('mouseup', () => {
        isResizing = false;
        document.body.style.cursor = '';
    });
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
            if (currentDiagramId) {
                // Update
                const note = await showPrompt('변경 사항에 대한 메모를 남겨주세요:', 'Update', '버전 저장');
                if (note === null) return; // Cancelled
                updateDiagram(currentDiagramId, code, user.name, note);
                await showAlert('저장되었습니다!');
            } else {
                // Create
                const title = await showPrompt('다이어그램 제목을 입력해주세요:', 'My Diagram', '새 다이어그램');
                if (!title) return; // Cancelled
                const diagram = createDiagram(title, code, user.name);
                currentDiagramId = diagram.id;

                // Update URL without reload
                const newUrl = `${window.location.pathname}?id=${currentDiagramId}`;
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
        <li class="history-item" data-id="${v.id}">
            <div class="history-item-meta">
                <span>Version ${versions.length - index}</span>
                <span>${new Date(v.timestamp).toLocaleString()}</span>
            </div>
            <div class="history-item-note">${v.note || 'No note'}</div>
            <div class="history-item-meta">By ${v.authorName}</div>
        </li>
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

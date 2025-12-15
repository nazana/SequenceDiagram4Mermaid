/**
 * UI Utilities for replacement of native alert/confirm/prompt
 */

let modalContainer = null;

function ensureModalContainer() {
    if (document.getElementById('custom-modal-container')) {
        modalContainer = document.getElementById('custom-modal-container');
        return;
    }

    modalContainer = document.createElement('div');
    modalContainer.id = 'custom-modal-container';
    modalContainer.className = 'modal-backdrop hidden';
    modalContainer.innerHTML = `
        <div class="modal-content" style="width: 400px; margin: 0 auto; margin-top: 15vh;">
            <div class="modal-header">
                <h3 id="modal-title">Title</h3>
                <button class="btn-icon" id="modal-close"><i class="ph ph-x"></i></button>
            </div>
            <div class="modal-body" id="modal-body">
                <!-- Content -->
            </div>
            <div class="modal-footer" id="modal-footer">
                <!-- Buttons -->
            </div>
        </div>
    `;
    document.body.appendChild(modalContainer);

    // Close on backdrop click (optional, maybe not for confirm/prompt)
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            // Close logic if needed, but for confirm/prompt we might want to force choice
        }
    });

    modalContainer.querySelector('#modal-close').addEventListener('click', () => {
        closeModal(null);
    });
}

let currentResolve = null;

function openModal(title, contentHtml, buttons = []) {
    ensureModalContainer();

    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = contentHtml;

    const footer = document.getElementById('modal-footer');
    footer.innerHTML = '';

    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.className = `btn ${btn.class || 'btn-secondary'}`;
        button.textContent = btn.text;
        button.onclick = () => {
            closeModal(btn.value);
        };
        footer.appendChild(button);
    });

    modalContainer.classList.remove('hidden');

    // Focus first input if exists
    const input = modalContainer.querySelector('input');
    if (input) {
        input.focus();
        input.select(); // Select text for easier editing
    } else {
        // Focus confirm button if no input
        // Find the primary button or simply focus the container to trap keyboard
        const primaryBtn = footer.querySelector('.btn-primary');
        if (primaryBtn) primaryBtn.focus();
    }

    // Keyboard Handler
    const handleKeydown = (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            closeModal(null);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            // Trigger the last button (usually 'Confirm' or 'OK')
            // Or specifically looks for btn-primary
            const primaryBtn = footer.querySelector('.btn-primary');
            if (primaryBtn) primaryBtn.click();
        }
    };

    window.addEventListener('keydown', handleKeydown);

    return new Promise((resolve) => {
        currentResolve = (value) => {
            window.removeEventListener('keydown', handleKeydown);
            resolve(value);
        };
    });
}

function closeModal(value) {
    if (modalContainer) {
        modalContainer.classList.add('hidden');
    }
    if (currentResolve) {
        currentResolve(value);
        currentResolve = null;
    }
}

// --- Public API ---

export async function showAlert(message, title = '알림') {
    return openModal(title, `<p>${message}</p>`, [
        { text: '확인', value: true, class: 'btn-primary' }
    ]);
}

export async function showConfirm(message, title = '확인') {
    return openModal(title, `<p>${message}</p>`, [
        { text: '취소', value: false, class: 'btn-ghost' },
        { text: '확인', value: true, class: 'btn-primary' }
    ]);
}

export async function showPrompt(message, defaultValue = '', title = '입력') {
    const content = `
        <p style="margin-bottom: 0.5rem;">${message}</p>
        <input type="text" id="modal-prompt-input" class="input-text" value="${defaultValue}" style="width: 100%" autocomplete="off">
    `;

    const result = await openModal(title, content, [
        { text: '취소', value: null, class: 'btn-ghost' },
        { text: '확인', value: 'submit', class: 'btn-primary' }
    ]);

    if (result === 'submit') {
        return document.getElementById('modal-prompt-input').value;
    }
    return null;
}

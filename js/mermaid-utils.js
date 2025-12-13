/**
 * Mermaid utility module for initialization, rendering, and parsing.
 */

// Initialize Mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    sequence: {
        showSequenceNumbers: false,
        actorMargin: 50,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35,
        mirrorActors: false,
        bottomMarginAdj: 1,
        useMaxWidth: true,
        fontFamily: "'JetBrains Mono', monospace",
        messageFontFamily: "'Inter', sans-serif",
        actorFontFamily: "'Inter', sans-serif"
    }
});

/**
 * Renders the mermaid diagram into the specified element.
 * @param {string} code - The mermaid syntax code.
 * @param {HTMLElement} container - The container element to render into.
 * @returns {Promise<boolean>}
 */
export async function renderMermaid(code, container) {
    try {
        container.innerHTML = '';
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, code);
        container.innerHTML = svg;
        return true;
    } catch (error) {
        console.warn('Mermaid render error (likely incomplete syntax):', error);
        // Do not verify/throw here, just let it fail silently or show small indicator if needed.
        // For editor experience, we might want to keep previous valid render or show simple error.
        container.innerHTML = `<div style="color: #ff6b6b; padding: 1rem; border: 1px solid #ff6b6b; border-radius: 4px; background: rgba(255,107,107,0.1);">
            <h3 style="margin-bottom:0.5rem">Syntax Error</h3>
            <pre style="white-space: pre-wrap; font-family: monospace;">${error.message}</pre>
        </div>`;
        return false;
    }
}

/**
 * Parses Mermaid sequence diagram code into a structured model.
 * @param {string} code 
 * @returns {object} { participants: [], items: [] }
 */
export function parseMermaidCode(code) {
    const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'));

    const participants = [];
    const items = [];

    // Regex helpers
    // participant A as Alice
    const participantRegex = /^(participant|actor)\s+([^\s]+)(?:\s+as\s+(.+))?$/i;
    // A->>B: text
    const messageRegex = /^([^\s]+)\s*(-+>>?|--+>>?)\s*([^\s]+)\s*(?::\s*(.+))?$/;
    // Note right of A: text
    const noteRegex = /^Note\s+(right of|left of|over)\s+([^:]+)\s*:\s*(.+)$/i;

    lines.forEach(line => {
        if (line === 'sequenceDiagram') return;

        // Match Participant
        const pMatch = line.match(participantRegex);
        if (pMatch) {
            const type = pMatch[1]; // participant or actor
            const id = pMatch[2];
            const name = pMatch[3] || id; // if no alias, use id
            // Avoid duplicates
            if (!participants.find(p => p.id === id)) {
                participants.push({ id, name, type });
            }
            return;
        }

        // Match Message
        const mMatch = line.match(messageRegex);
        if (mMatch) {
            items.push({
                type: 'message',
                source: mMatch[1],
                arrow: mMatch[2],
                target: mMatch[3],
                content: mMatch[4] || ''
            });
            // Auto-add participants if implicit? 
            // Mermaid allows implicit, but for our grid we might want explicit ones. 
            // For now, let's just collect used IDs and add to participants if missing?
            // Actually, keep it simple.
            return;
        }

        // Match Note
        const nMatch = line.match(noteRegex);
        if (nMatch) {
            items.push({
                type: 'note',
                position: nMatch[1], // right of, etc
                target: nMatch[2], // participant(s)
                content: nMatch[3]
            });
            return;
        }
    });

    return { participants, items };
}

/**
 * Generates Mermaid code from the model.
 * @param {object} model { participants, items }
 * @returns {string}
 */
export function generateMermaidCode(model) {
    let code = 'sequenceDiagram\n';

    // Participants
    model.participants.forEach(p => {
        // quotes for name if needed? 
        const safeName = p.name.includes(' ') ? `"${p.name}"` : p.name;
        code += `    participant ${p.id} as ${safeName}\n`;
    });

    code += '\n';

    // Items
    model.items.forEach(item => {
        if (item.type === 'message') {
            code += `    ${item.source}${item.arrow}${item.target}: ${item.content}\n`;
        } else if (item.type === 'note') {
            code += `    Note ${item.position} ${item.target}: ${item.content}\n`;
        }
    });

    return code;
}

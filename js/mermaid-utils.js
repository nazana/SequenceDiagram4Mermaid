/**
 * Mermaid utility module for initialization, rendering, and parsing.
 */

// Initialize Mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    sequence: {

        actorMargin: 50,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35,
        mirrorActors: false,
        bottomMarginAdj: 1,
        useMaxWidth: false,
        fontFamily: "'JetBrains Mono', monospace",
        messageFontFamily: "'Inter', sans-serif",
        actorFontFamily: "'Inter', sans-serif"
    },
    themeVariables: {
        lineColor: '#e2e8f0',
        signalColor: '#e2e8f0',
        signalTextColor: '#e2e8f0',
        actorBorder: '#e2e8f0',
        labelBoxBorderColor: '#e2e8f0',
        actorTextColor: '#e2e8f0'
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
 * @returns {object} { participants: [], items: [], config: { autonumber: boolean } }
 */
export function parseMermaidCode(code) {
    const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'));

    const participants = [];
    const items = [];
    const config = { autonumber: false };

    // Regex helpers
    // participant A as Alice
    const participantRegex = /^(participant|actor)\s+([^\s]+)(?:\s+as\s+(.+))?$/i;
    // A->>B: text, A-)B: text, A-xB: text
    // Improved regex: use lazy match (+?) for source/target to handle "A->B" without spaces
    const messageRegex = /^([^\s]+?)\s*((?:<<-+(?:>>?))|(?:-+(?:>>?|x|\)|>)))\s*([^\s]+?)(?::\s*(.+))?$/;
    // Note right of A: text
    const noteRegex = /^Note\s+(right of|left of|over)\s+([^:]+)\s*:\s*(.+)$/i;

    lines.forEach(line => {
        if (line === 'sequenceDiagram') return;

        if (line === 'autonumber') {
            config.autonumber = true;
            return;
        }

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
            let arrow = mMatch[2];

            // Validate arrow
            if (!arrow || arrow.length < 2) arrow = '->>';

            // Normalize arrow to supported types
            if (arrow.startsWith('<<')) {
                const isDotted = arrow.includes('--');
                arrow = isDotted ? '<<-->>' : '<<->>';
            } else {
                const isDotted = arrow.startsWith('--');
                let suffix = '>'; // Default to Line
                if (arrow.endsWith('>>')) suffix = '>>';
                else if (arrow.endsWith(')')) suffix = ')';
                else if (arrow.endsWith('x')) suffix = 'x';
                // else if (arrow.endsWith('>')) suffix = '>'; // Already default

                arrow = (isDotted ? '--' : '-') + suffix;
            }

            items.push({
                type: 'message',
                source: mMatch[1],
                arrow: arrow,
                target: mMatch[3],
                content: (mMatch[4] || '').replace(/^\d+\.\s*/, '')
            });
            return;
        }

        // Match Note
        const nMatch = line.match(noteRegex);
        if (nMatch) {
            items.push({
                type: 'note',
                position: nMatch[1], // right of, etc
                target: nMatch[2], // participant(s)
                content: (nMatch[3] || '').replace(/^\d+\.\s*/, '')
            });
            return;
        }
    });

    return { participants, items, config };
}

/**
 * Generates Mermaid code from the model.
 * @param {object} model { participants, items, config }
 * @returns {string}
 */
export function generateMermaidCode(model) {
    let code = 'sequenceDiagram\n';
    if (model.config && model.config.autonumber) {
        code += '    autonumber\n';
    }

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
            let arrow = item.arrow;
            // Safer normalize before generating code
            if (arrow) {
                if (arrow.startsWith('<<')) {
                    const isDotted = arrow.includes('--');
                    arrow = isDotted ? '<<-->>' : '<<->>';
                } else {
                    const isDotted = arrow.startsWith('--');
                    let suffix = '>'; // Default
                    if (arrow.endsWith('>>')) suffix = '>>';
                    else if (arrow.endsWith(')')) suffix = ')';
                    else if (arrow.endsWith('x')) suffix = 'x';
                    arrow = (isDotted ? '--' : '-') + suffix;
                }
            } else {
                arrow = '->>'; // Default fallback
            }
            // Add spaces around arrow for better parsing stability
            code += `    ${item.source} ${arrow} ${item.target}: ${item.content}\n`;
        } else if (item.type === 'note') {
            code += `    Note ${item.position} ${item.target}: ${item.content}\n`;
        }
    });

    return code;
}

/**
 * Sanitizes Mermaid code to fix common syntax errors (e.g. invalid arrow lengths).
 * @param {string} code 
 * @returns {string}
 */
export function sanitizeMermaidCode(code) {
    if (!code) return code;

    let sanitized = code;

    // Fix arrows with too many dashes (e.g. --->, ---->, --->>, ---x, ---)) -> --suffix
    // This normalizes accidentally long dotted arrows to standard dotted arrows.
    sanitized = sanitized.replace(/---+(>>?|x|\)|>)/g, (match, suffix) => {
        return '--' + suffix;
    });

    return sanitized;
}


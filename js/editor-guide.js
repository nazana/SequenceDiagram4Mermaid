/**
 * editor-guide.js
 * Provides Rule-based Smart Guide and Autocomplete for the Markdown Editor.
 */
import { ARROW_SVGS, ARROW_LABELS } from './mermaid-utils.js';

let suggestionBox = null;
let currentInput = null;

// Suggestion Data
const SUGGESTIONS = {
    arrow: Object.keys(ARROW_SVGS).map(key => ({
        label: key,
        value: key,
        isArrow: true
    })),
    keywords: [
        { label: 'participant', value: 'participant ', info: 'Define a participant' },
        { label: 'actor', value: 'actor ', info: 'Define an actor symbol' },
        { label: 'Note right of', value: 'Note right of ', info: 'Add a note' },
        { label: 'Note left of', value: 'Note left of ', info: 'Add a note' },
        { label: 'Note over', value: 'Note over ', info: 'Note spanning participants' },
        { label: 'loop', value: 'loop ', info: 'Loop block' },
        { label: 'alt', value: 'alt ', info: 'Alternative path' },
        { label: 'opt', value: 'opt ', info: 'Optional path' },
        { label: 'rect', value: 'rect rgb(0,0,0)', info: 'Background color block' },
    ]
};

export function initSmartGuide(textareaElement) {
    currentInput = textareaElement;

    // Create UI
    createSuggestionBox();

    // Event Listeners
    textareaElement.addEventListener('input', handleInput);
    textareaElement.addEventListener('keydown', handleKeydown);
    textareaElement.addEventListener('click', hideSuggestions);
}

function createSuggestionBox() {
    suggestionBox = document.createElement('div');
    suggestionBox.id = 'editor-suggestion-box';
    suggestionBox.className = 'suggestion-box hidden';
    document.body.appendChild(suggestionBox);
}

function handleInput(_e) {
    const text = currentInput.value;
    const cursorPos = currentInput.selectionStart;

    // Get current line context
    const lines = text.slice(0, cursorPos).split('\n');
    const currentLine = lines[lines.length - 1]; // Text from start of line to cursor

    // 1. Check for Arrow trigger ('-')
    // Trigger if line ends with '-' or '--' or '<'
    if (currentLine.match(/-$/) || currentLine.match(/<$/)) {
        showSuggestions(SUGGESTIONS.arrow, cursorPos);
        return;
    }

    // 2. Check for Keyword trigger (Start of line or after space)
    // Minimal length 2 to avoid spam
    const lastWordMatch = currentLine.match(/(\w+)$/);
    if (lastWordMatch && lastWordMatch[1].length >= 2) {
        const word = lastWordMatch[1].toLowerCase();
        const matches = SUGGESTIONS.keywords.filter(k => k.label.toLowerCase().startsWith(word));
        if (matches.length > 0) {
            showSuggestions(matches, cursorPos);
            return;
        }
    }

    // 3. Participants suggestions? (e.g. after '->>')
    // TODO: Parse current model to get participant names

    hideSuggestions();
}

function showSuggestions(items, _cursorPos) {
    if (!items.length) {
        hideSuggestions();
        return;
    }

    // Build UI
    suggestionBox.innerHTML = '';
    items.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        if (index === 0) div.className += ' selected';

        if (item.isArrow) {
            // Render Arrow SVG
            div.innerHTML = `
                <div style="width: 80px; display:flex; align-items:center;">
                    ${ARROW_SVGS[item.value]}
                </div>
                <span class="s-info">${ARROW_LABELS[item.value] || item.value}</span>
            `;
        } else {
            // Text Suggestion
            div.innerHTML = `
                <span class="s-value">${item.label}</span>
                <span class="s-info">${item.info}</span>
            `;
        }

        div.addEventListener('click', () => applySuggestion(item.value));
        suggestionBox.appendChild(div);
    });

    // Position UI (Naive approach: caret-coordinates would be better but complex)
    // For now, fixed offset or simple calculation
    const rect = currentInput.getBoundingClientRect();
    // We need a helper to find X,Y of cursor. 
    // Using a simpler fallback: near the textarea caret?
    // Let's use a library or simple mirror div trick for accurate positioning later.
    // For MVP: Place near cursor roughly? No, textarea text cursor pos is hard.
    // Fallback: Fixed position relative to textarea bottom-left for now?
    // Better: library 'textarea-caret' is standard, but we want vanilla.

    const coordinates = getCaretCoordinates(currentInput, currentInput.selectionEnd);

    suggestionBox.style.left = (rect.left + coordinates.left) + 'px';
    suggestionBox.style.top = (rect.top + coordinates.top + 24) + 'px'; // + Line height

    suggestionBox.classList.remove('hidden');
}

function hideSuggestions() {
    if (suggestionBox) suggestionBox.classList.add('hidden');
}

function handleKeydown(e) {
    if (suggestionBox.classList.contains('hidden')) return;

    const items = suggestionBox.querySelectorAll('.suggestion-item');
    let selectedIndex = Array.from(items).findIndex(el => el.classList.contains('selected'));

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[selectedIndex].classList.remove('selected');
        selectedIndex = (selectedIndex + 1) % items.length;
        items[selectedIndex].classList.add('selected');
        items[selectedIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items[selectedIndex].classList.remove('selected');
        selectedIndex = (selectedIndex - 1 + items.length) % items.length;
        items[selectedIndex].classList.add('selected');
        items[selectedIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        // Trigger click on selected


        // Re-find based on text content is risky. Let's bind data.
        // Actually click handler uses closure, so we can just simulate click?
        items[selectedIndex].click();
    } else if (e.key === 'Escape') {
        hideSuggestions();
    }
}

function applySuggestion(value) {
    const cursorPos = currentInput.selectionStart;
    const text = currentInput.value;

    const after = text.substring(cursorPos);

    // Naive replacement: just insert. 
    // Ideally we replace the "trigger word".
    // For arrows (-), we append.
    // For keywords (par..), we replace query.

    // Quick fix: if substituting keyword, remove typed part.
    // Detecting context...
    const lines = text.slice(0, cursorPos).split('\n');
    const currentLine = lines[lines.length - 1];

    let newText = text;
    let newCursorPos = cursorPos;

    if (currentLine.match(/-$/)) {
        // Arrow mode: replace last '-' with full arrow? 
        // User typed '-', suggestion is '->>'. Result '->>'.
        // So remove last char.
        newText = text.substring(0, cursorPos - 1) + value + after;
        newCursorPos = cursorPos - 1 + value.length;
    } else {
        // Keyword mode
        const match = currentLine.match(/(\w+)$/);
        if (match) {
            const typed = match[1];
            newText = text.substring(0, cursorPos - typed.length) + value + after;
            newCursorPos = cursorPos - typed.length + value.length;
        }
    }

    currentInput.value = newText;
    currentInput.selectionStart = newCursorPos;
    currentInput.selectionEnd = newCursorPos;
    currentInput.focus();

    // Trigger input event to update diagram
    currentInput.dispatchEvent(new Event('input'));

    hideSuggestions();
}


// --- Helper: Get Caret Coordinates (Simplified version of standard approach) ---
function getCaretCoordinates(element, position) {
    const div = document.createElement('div');
    const style = getComputedStyle(element);

    for (const prop of [
        'direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
        'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
        'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
        'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize',
        'fontSizeAdjust', 'lineHeight', 'fontFamily', 'textAlign', 'textTransform',
        'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing'
    ]) {
        div.style[prop] = style[prop];
    }

    div.textContent = element.value.substring(0, position);
    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    div.appendChild(span);

    // Overlay to measure
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word'; // Important for textarea

    document.body.appendChild(div);

    const coordinates = {
        top: span.offsetTop + parseInt(style['borderTopWidth']),
        left: span.offsetLeft + parseInt(style['borderLeftWidth']),
        height: parseInt(style['lineHeight'])
    };

    document.body.removeChild(div);
    return coordinates;
}

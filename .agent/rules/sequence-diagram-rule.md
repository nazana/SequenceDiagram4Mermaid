---
trigger: always_on
---


# Project: Sequence Diagram Editor (Vanilla JS)

## Tech Stack
- **Core**: Vanilla JavaScript (ES Modules), HTML5, CSS3.
- **No Build Step**: Code runs directly in the browser (ESM). No Webpack/Babel.
- **Libraries**:
  - `mermaid.js` (CDN/Local): Diagram rendering.
  - `phosphor-icons` (Script): UI Icons.
  - `Sortable.js`: Drag-and-drop reordering.

## Project Structure
- `index.html`: Entry point. Layout scaffolding.
- `css/style.css`: Global styles, CSS Variables (Theming), Glassmorphism effects.
- `js/`:
  - `app.js`: Main application controller. Handles Tab switching (`setupTabs`), Event delegation, and **Synchronization** (`onGridChange`, `syncFromMarkdown`).
  - `grid-editor.js`: **Core UI Logic**. Renders the Grid Editor. Handles complex DOM manipulation, Event listeners (`updateItem`, `deleteItem`), and **Activation Validation**.
  - `mermaid-utils.js`: **Pure Logic**. `parseMermaidCode` and `generateMermaidCode`. Responsible for accurate Mermaid syntax conversion.
  - `storage.js`: LocalStorage management (`saveDiagram`, `loadDiagram`).

## UI/UX Design System
- **Aesthetics**: "Premium Dark Mode" with Glassmorphism (`backdrop-filter: blur`).
- **Colors**: Strictly use CSS Variables (`--color-bg-primary`, `--color-primary`, etc.).
- **Typography**: System fonts + Inter (if available).
- **Layout**: 
  - Flexbox for rows/toolbars.
  - Absolute positioning for "Activation Lines" (`renderActivationLines`) to span row heights.

## Coding Conventions
1. **Module System**: Use `import { func } from './module.js';`.
2. **DOM Manipulation**: 
   - Use `document.createElement` for container structures.
   - Use `innerHTML` for repetitive row templates or icon injection.
   - Always clean up event listeners or use delegation where possible.
3. **State Management**:
   - `grid-editor.js` maintains `currentModel`.
   - Any change runs `triggerChange()` -> `app.js:onGridChange()` -> Updates Markdown & Mermaid.

## Critical Business Logic (DO NOT BREAK)
1. **Activation Validation (`autoCorrectActivations`)**:
   - Mermaid requires strict `Activate (+)` before `Deactivate (-)`.
   - Grid Editor MUST automatically disable invalid `Deactivate` actions to prevent syntax errors.
   - Always run `autoCorrectActivations` inside a `try-catch` block during `updateItem` or `Swap`.
2. **Synchronization**:
   - Grid -> Markdown: `generateMermaidCode`. Check `item.activation` state carefully.
   - Markdown -> Grid: `parseMermaidCode`. Must handle various arrow types (`->>`, `-->`) correctly.
3. **Activation Lines**:
   - Rendered via SVG overlay in `grid-editor.js`.
   - Must calculate `brackets` to draw continuous vertical lines.

## Known Issues / Quirks
- **Browser Compability**: `scrollbar-gutter` is used for layout stability.
- **Sync Discrepancy**: If Grid shows "Red" (Active) but Markdown shows nothing, it implies `autoCorrect` disabled it but UI didn't refresh. Ensure `renderGridEditor` is called after correction.

대화와 문서는 한국어로 작성한다.
commit은 사용자가 요청할 경우만 진행한다.
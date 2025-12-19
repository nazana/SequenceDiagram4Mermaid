# Project Context & Operations

## Business Goal
Mermaid Sequence Diagram의 시각적 편집 도구(Grid Editor)를 제공하여 비개발자도 직관적으로 다이어그램을 작성할 수 있게 함.
Grid와 Markdown 간의 실시간 양방향 동기화 및 자동 문법 교정 기능을 핵심 가치로 함.

## Tech Stack
- **Core**: Vanilla JavaScript (ESM), HTML5, CSS3.
- **Build**: No Build Step (Browser direct execution).
- **Libraries**: `mermaid.js` (Rendering), `phosphor-icons` (UI), `Sortable.js` (Drag & Drop), `http-server` (Local Dev).

## Operational Commands
- **Run (Dev)**: `npm start` (Runs local server via `node bin/cli.js`)
- **Lint**: `npm run lint`

# Golden Rules

## Immutable Constraints
1. **Zero External Build**: Webpack, Babel 등의 번들러를 절대 도입하지 않음. 순수 ESM 표준을 유지.
2. **Local Storage Only**: 사용자 데이터는 브라우저 로컬 스토리지에만 저장하며 서버로 전송하지 않음.
3. **Strict Validation**: Mermaid 문법(Activation open/close) 오류를 방지하는 로직을 UI 레벨에서 강제함.

## Do's & Don'ts
- **DO** 모든 문서(주석, 커밋 메시지 본문 포함)는 **한국어**로 작성하십시오.
- **DO** UI 디자인은 `index.css`의 CSS Variables를 활용하여 Premium Dark Mode 일관성을 유지하십시오.
- **DON'T** 이모지를 파일명, 커밋 메시지, 문서 내용에 사용하지 마십시오.
- **DON'T** `var` 키워드를 사용하지 말고 `const`와 `let`만 사용하십시오.
- **DON'T** Framework(React, Vue 등) 코드를 혼용하지 마십시오. Vanilla JS 패턴을 유지하십시오.

# Standards & References

## Code Conventions
- **Module**: `import { function } from './file.js';` (확장자 .js 필수)
- **Style**: Glassmorphism (`backdrop-filter`) 및 Semantic CSS Variables 사용.

## Maintenance Policy
- 이 파일(`AGENTS.md`)의 규칙과 실제 코드 간의 괴리가 발견될 경우, 즉시 규칙을 업데이트하거나 코드를 수정하여 동기화하십시오.

# Context Map (Action-Based Routing)

- **[Core Logic & Event Handling](./js/AGENTS.md)** — 상태 동기화, Mermaid 파싱, 그리드 편집 로직 작업 시.
- **[UI Styling & Layout](./css/AGENTS.md)** — CSS Variables, 다크 모드, 레이아웃 및 애니메이션 수정 시.

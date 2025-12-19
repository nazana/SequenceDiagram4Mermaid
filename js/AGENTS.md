# Module Context
- **Role**: Mermaid Sequence Diagram 편집기의 핵심 비즈니스 로직 담당.
- **Components**:
  - `app.js`: 메인 컨트롤러 및 이벤트 위임자.
  - `grid-editor.js`: UI 렌더링 및 DOM 조작, Activation 유효성 검사.
  - `mermaid-utils.js`: Mermaid 코드 파싱/생성 순수 함수 집합.
  - `storage.js`: LocalStorage 데이터 관리.

# Tech Stack & Constraints
- **Language**: Vanilla JavaScript (ES2020+).
- **Module System**: ES Modules (`import`/`export`) 필수.
- **Dependencies**: `mermaid`, `Sortable`, `phosphor-icons` (Global Scope 사용 가능하나 의존성 명확히 할 것).
- **Browser Only**: Node.js API 사용 불가 (파일 시스템 접근 등).

# Implementation Patterns
- **DOM Manipulation**:
  - 대량의 DOM 업데이트 시 `document.createDocumentFragment()` 사용.
  - 이벤트 리스너는 개별 요소 대신 상위 컨테이너에 위임(Event Delegation)하여 메모리 누수 방지.
- **State Sync**:
  - Grid 상태 변경 시 반드시 `triggerChange()`를 호출하여 Markdown 에디터와 동기화.
- **Activation Correction**:
  - `+`(Activate)와 `-`(Deactivate)의 쌍을 맞추는 로직은 `grid-editor.js` 내에서 엄격하게 관리.

# Testing Strategy
- **Manual Verification**: 브라우저 콘솔에서 `app` 객체 상태 확인.
- **Critical Path Test**:
  1. Grid에서 행 추가/삭제 시 Markdown 즉시 반영 여부.
  2. Activation 토글 시 문법 오류 없이 Mermaid 렌더링 정상 동작 여부.

# Local Golden Rules (Do's & Don'ts)
- **DO** `mermaid-utils.js`는 DOM에 의존하지 않는 순수 함수로 유지하십시오.
- **DO** 모든 DOM 요소 생성 시 `semantic` 태그를 우선 사용하십시오.
- **DON'T** `innerHTML` 사용 시 XSS 위험을 고려하여 사용자 입력 데이터는 반드시 이스케이프 처리하거나 `textContent`를 사용하십시오.
- **DON'T** 전역 변수 오염을 최소화하고, 필요한 경우 `window.app` 네임스페이스 하위로 제한하십시오.

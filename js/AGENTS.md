# Module Context

이 디렉토리는 시퀀스 다이어그램 에디터의 핵심 비즈니스 로직을 포함합니다.
Mermaid 코드 파싱, 양방향 동기화(Grid <-> Markdown), 로컬 스토리지 데이터 관리를 담당합니다.

**Key Modules:**
-   `app.js`: 메인 엔트리 포인트, 이벤트 리스너 연결, UI 조정.
-   `mermaid-utils.js`: Mermaid 렌더링, 정규식 기반 파싱, 코드 생성 로직.
-   `grid-editor.js`: 테이블 형태의 에디터 인터페이스 로직.
-   `storage.js`: 다이어그램 저장 및 버전 관리를 위한 LocalStorage 래퍼.

# Tech Stack & Constraints

-   **Environment:** 브라우저 네이티브 ES Modules (`import`/`export`).
-   **No Build Step:** 모듈은 변환 없이 직접 서빙됩니다. Client 코드에서 Node 전용 API(`require` 등) 사용 금지.
-   **Mermaid:** v11.x 이상 버전을 사용하며, 비동기 렌더링을 신중하게 처리해야 합니다.

# Implementation Patterns

-   **Sync Logic (동기화 로직):**
    -   `Grid Editor` 변경 -> `generateMermaidCode()` -> `Markdown` 업데이트 -> 렌더링.
    -   `Markdown` 변경 -> `parseMermaidCode()` -> `Grid Editor` 업데이트 -> 렌더링.
-   **Parsing (파싱):**
    -   참여자(Participant)와 메시지(Message) 추출 시 엄격한 정규식(Regex)을 사용하십시오.
    -   Mermaid 렌더링 충돌 방지를 위해 입력값은 렌더링 전 반드시 살균(sanitize) 처리해야 합니다.

# Local Golden Rules

**Do's:**
-   `mermaid.render`의 비동기 에러를 항상 우아하게(gracefully) 처리하십시오.
-   사용자 입력 데이터를 처리하기 전에 `sanitizeMermaidCode`를 호출하십시오.
-   전역 상태는 `window` 객체를 오염시키지 말고 `app.js` 또는 전용 상태 관리 모듈 내에 캡슐화하십시오.

**Don'ts:**
-   복잡한 UI 업데이트를 위해 DOM 문자열을 직접 조작하지 말고, 헬퍼 함수를 사용하십시오.
-   데이터 수정 시 `parseMermaidCode` -> `model` 변환 흐름을 우회하지 마십시오.

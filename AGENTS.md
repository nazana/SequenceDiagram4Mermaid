# Project Context & Operations

이 프로젝트는 Mermaid 시퀀스 다이어그램을 위한 고품질 시각적 에디터입니다.
Grid(표)와 Markdown(코드) 에디터 간 양방향 동기화, 실시간 렌더링, 버전 관리 기능을 제공합니다.

**Tech Stack:**
-   **Core:** Grid 및 로직 처리를 위한 Vanilla HTML5, CSS3, JavaScript (ES Modules).
-   **Library:** Mermaid.js (v11+), Panzoom (줌/팬), Lucide Icons (아이콘).
-   **Server:** 로컬 개발용 Node.js (http-server).

**Operational Commands:**
-   **Start Server:** `npm start` (http://127.0.0.1:8080 에서 실행)
-   **Lint Code:** `npm run lint`

# Golden Rules

**Immutable Principles:**
1.  **Language Policy:** 모든 문서, 주석, 태스크 리스트는 **반드시 한국어**로 작성합니다. (단, 변수명 및 커밋 메시지는 영문 권장)
2.  **Branch Strategy:** 기능 개발 시 `feat/feature-name` 브랜치 사용. 완료 후 `main` 병합 및 `CHANGELOG.md` 업데이트 필수.
3.  **Design Philosophy:** "Premium Dark Theme" 유지. 심미성과 사용자 경험(UX)을 최우선으로 고려합니다.

**Do's:**
-   UI 요소에는 `lucide` 아이콘을 사용하여 일관성을 유지하십시오.
-   대시보드와 에디터 레이아웃은 항상 반응형으로 동작해야 합니다.
-   사용자 입력 시 Mermaid 코드 파싱 에러를 방지하기 위해 반드시 `sanitize` 로직을 거치십시오.
-   **라이브러리 검증:** 외부 라이브러리 도입 및 사용 시 반드시 **Context7 MCP**를 통해 최신 문서와 적합성을 검증하고 진행하십시오.

**Don'ts:**
-   복잡한 사용자 인터랙션에 브라우저 기본 `alert`를 사용하지 마십시오. (커스텀 모달 사용)
-   `index.html` 내부에 긴 스크립트를 작성하지 마십시오. 모든 로직은 `js/` 모듈로 분리하십시오.

# Standards & References

-   **Code Style:** 표준 ESLint 설정을 준수합니다.
-   **Markdown:** 데이터 일관성을 위해 Markdown 에디터는 읽기 전용으로 유지하고, 데이터 수정은 Grid 에디터를 통합니다.

# Context Map (Action-Based Routing)

-   **[자바스크립트 로직 / 모듈](./js/AGENTS.md)** — 핵심 애플리케이션 로직, Mermaid 파싱/렌더링, 상태 관리.
-   **[스타일링 / 테마](./css/AGENTS.md)** — CSS 변수, 다크 모드 스타일링, 반응형 레이아웃 규칙.

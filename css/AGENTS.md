# Module Context

이 디렉토리는 시퀀스 다이어그램 에디터의 시각적 표현을 관리합니다.
"Premium Dark Theme" 미학, 레이아웃 관리, 반응형 동작에 중점을 둡니다.

**Key Files:**
-   `style.css`: 핵심 애플리케이션 스타일, CSS 변수, 컴포넌트 클래스.
-   `fullscreen.css`: 몰입형(Distraction-free) 보기 모드를 위한 전용 스타일.

# Tech Stack & Constraints

-   **CSS Approach:** Vanilla CSS3.
-   **Variables:** 테마 적용을 위해 CSS Custom Properties (`--color-primary`, `--bg-dark`)를 적극 활용.
-   **No Preprocessors:** 별도의 빌드 단계가 없으므로 Sass/Less 등 전처리기는 사용하지 않습니다.

# Implementation Patterns

-   **Theming (테마):**
    -   모든 색상은 `:root`에 변수로 정의해야 합니다.
    -   유연성을 위해 `hsl()` 기반 색상 값을 사용하십시오.
-   **Layout (레이아웃):**
    -   툴바 및 1차원 레이아웃에는 Flexbox를 사용하십시오.
    -   대시보드 카드 배치 등 2차원 레이아웃에는 CSS Grid를 사용하십시오.
-   **Components (컴포넌트):**
    -   클래스 명명 시 접두사를 일관되게 사용하십시오 (예: `.btn-primary`, `.modal-overlay`).

# Local Golden Rules

**Do's:**
-   모달이나 오버레이에는 `backdrop-filter: blur()`를 사용하여 글래스모피즘 효과를 적용하십시오.
-   모든 상호작용 요소(버튼 등)에는 명확한 `hover` 및 `active` 상태 스타일을 정의하십시오.
-   다크 모드에서의 가독성을 위해 텍스트의 명도 대비를 높게 유지하십시오.

**Don'ts:**
-   컴포넌트 클래스 내부에 Hex 색상 코드를 하드코딩하지 마십시오. 항상 `var()`를 사용하십시오.
-   특정 클래스 없이 `div`, `span` 등 일반 태그에 전역 스타일을 적용하지 마십시오.

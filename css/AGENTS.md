# Module Context
- **Role**: 애플리케이션의 시각적 디자인, 레이아웃, 반응형 처리 담당.
- **Key Files**:
  - `style.css`: 전역 스타일 및 디자인 시스템 (Variables).
  - `fullscreen.css`: 프레젠테이션 모드 전용 스타일.

# Tech Stack & Constraints
- **Language**: Standard CSS3.
- **Preprocessor**: None (No SASS/LESS).
- **Methodology**: CSS Variables 기반의 테마 시스템.

# Implementation Patterns
- **Design System (`:root`)**:
  - 색상, 여백, 폰트 크기 등은 반드시 `var(--variable-name)` 형태로 참조.
  - Hard-coded hex 값 사용 지양.
- **Premium Dark Mode**:
  - `backdrop-filter: blur()`를 활용한 Glassmorphism 효과 적극 활용.
  - 텍스트 대비(Contrast)를 충분히 확보하여 가독성 유지.
- **Layout**:
  - Flexbox를 주력으로 사용하되, 복잡한 2차원 레이아웃은 CSS Grid 사용.
  - `position: absolute` 사용 시 `z-index` 컨텍스트 관리 주의.

# Testing Strategy
- **Visual Regression**: 주요 브라우저(Chrome, Edge)에서의 렌더링 일관성 확인.
- **Responsive**: 창 크기 조절 시 레이아웃 깨짐 없는지 확인 (특히 Grid Editor 테이블).

# Local Golden Rules (Do's & Don'ts)
- **DO** 새로운 색상 도입 시 `style.css`의 `:root` 섹션에 변수로 먼저 정의하십시오.
- **DO** `!important` 사용은 디자인 시스템 재정의 등 불가피한 경우에만 제한적으로 허용하십시오.
- **DON'T** 인라인 스타일(`style="..."`)을 남용하지 마십시오. 클래스 기반 스타일링을 우선하십시오.
- **DON'T** CSS 프레임워크(Tailwind, Bootstrap)를 혼용하지 마십시오.

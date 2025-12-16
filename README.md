# Mermaid Sequence Diagram Editor

**"복잡한 코드는 가라, 직관이 왔다"**  
A powerful, visual editor for [Mermaid](https://mermaid.js.org/) sequence diagrams.

![Mermaid Editor Preview](https://via.placeholder.com/800x400?text=Mermaid+Editor+Preview)

Mermaid Editor는 개발자와 기획자가 시퀀스 다이어그램을 더 빠르고 직관적으로 작성할 수 있도록 돕는 웹 기반 도구입니다. 엑셀과 같은 **Grid Interface**를 통해 다이어그램을 편집하면, 코드가 자동으로 생성되고 실시간으로 렌더링됩니다.

---

## ✨ Key Features (핵심 기능)

### 1. Dual Editor System & Real-time Sync
- **Grid Editor**: 엑셀처럼 행을 추가/삭제하고 드래그하여 순서를 바꿉니다. 복잡한 문법을 외울 필요가 없습니다.
- **Markdown Editor**: 생성된 Mermaid 코드를 직접 수정할 수도 있습니다.
- **양방향 동기화**: 어느 쪽을 수정하든 즉시 상대방에게 반영됩니다.

### 2. Smart Validation (지능형 문법 교정)
- **Automatic Activation Fix**: 시퀀스 다이어그램에서 가장 골치 아픈 'Activation(막대바)'의 열고 닫는 순서를 자동으로 감지하고 수정합니다.
- 실수로 `Deactivate`를 누락하거나 순서가 꼬여도 에디터가 알아서 문법 오류를 방지합니다.

### 3. Dashboard & Organization (체계적인 관리)
- **Grouping System**: 다이어그램을 폴더(Group)로 정리하여 관리할 수 있습니다.
- **Drag & Drop**: 직관적인 드래그 앤 드롭으로 다이어그램을 이동하거나 순서를 정리하세요.
- **Compact Search**: 개선된 검색 바와 필터링 옵션으로 필요한 다이어그램을 빠르게 찾습니다.

### 4. Zero Server & Data Privacy
- **Local Storage**: 모든 데이터는 브라우저의 로컬 스토리지에만 저장됩니다.
- **Improved Version Control**: 작업 이력을 슬라이드 패널로 확인하고, 원하는 시점으로 즉시 복구(Restore)하거나 삭제할 수 있습니다.
- **No Data Leak**: 서버로 그 어떤 데이터도 전송되지 않아 보안상 매우 안전합니다.

### 5. Enhanced UX (향상된 사용자 경험)
- **Fullscreen Mode**: 다이어그램을 화면 가득히 채워 프레젠테이션이나 리뷰에 집중할 수 있습니다.
- **Context Menu Shortcuts**: 단축키(`M`:이동, `D`:복제, `Space`:상세편집, `Del`:삭제)로 마우스 없이 빠르게 작업하세요.
- **Interactive Viewer**: Zoom & Pan, Element Highlight 기능을 지원합니다.

---

## 🚀 Quick Start (설치 없이 바로 실행)

Node.js가 설치되어 있다면, 터미널에서 다음 명령어 한 줄로 즉시 실행할 수 있습니다.

```bash
npx github:nazana/SequenceDiagram4Mermaid
```

이 명령어는 로컬 서버를 띄우고 기본 브라우저에서 에디터를 자동으로 엽니다.

---

## 📦 Installation (로컬 설치)

소스 코드를 수정하거나 오프라인 환경에서 셋업하고 싶다면 아래 절차를 따르세요.

### 1. Repository 복제
```bash
git clone https://github.com/nazana/SequenceDiagram4Mermaid.git
cd SequenceDiagram4Mermaid
```

### 2. 의존성 설치 및 실행
```bash
npm install
npm start
```
> **참고**: 별도의 빌드 과정(Webpack, Babel 등)이 없는 **Vanilla JS (ES Modules)** 프로젝트입니다. 그냥 `index.html` 파일을 브라우저로 열어도 작동하지만, ESM 보안 정책 때문에 로컬 웹 서버(`live-server`, `http-server` 등)를 사용하는 것을 권장합니다.

---

## 🎨 Design & UI/UX

### Premium Dark Mode
- 눈의 피로를 최소화하고 몰입감을 높이는 **Glassmorphism** 디자인을 적용했습니다.
- **Phosphor Icons**를 사용하여 모던하고 직관적인 아이콘 시스템을 구축했습니다.
- 모든 UI 요소는 반응형으로 동작하며, 모바일/태블릿 환경에서도 뷰어 기능을 사용할 수 있습니다.

### User Guide
상세한 사용법은 애플리케이션 내의 **[가이드 페이지](guide.html)**에서 확인할 수 있습니다.
- 참여자(Participant) 관리
- 메시지 및 활성화(Activation) 제어
- 단축키 및 팁

---

## 🛠 Project Structure

이 프로젝트는 복잡한 프레임워크 없이 순수 표준 기술로 작성되었습니다.

```bash
.
├── index.html          # 메인 에디터 페이지
├── dashboard.html      # 다이어그램 목록 관리 대시보드
├── guide.html          # 사용자 가이드 페이지
│
├── css/
│   ├── style.css       # 전역 스타일 (CSS Variables 활용)
│   └── fullscreen.css  # 전체 화면 모드 스타일
│
├── js/
│   ├── app.js          # 메인 컨트롤러 (이벤트, 탭 관리)
│   ├── grid-editor.js  # 핵심 로직 (Grid UI 렌더링 및 조작)
│   ├── mermaid-utils.js# Mermaid 코드 파싱 및 생성, 정규화 로직
│   └── storage.js      # 로컬 스토리지 데이터 관리 (CRUD)
│
└── bin/
    └── cli.js          # npx 실행을 위한 CLI 스크립트
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

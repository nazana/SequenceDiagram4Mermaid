# 프로젝트 Conventions

이 프로젝트는 개발 및 유지보수 시 다음 규칙을 엄격히 준수해야 합니다.

## 1. 언어 (Language)
- **모든 커뮤니케이션**: 한국어 (Korean)
- **모든 문서화**: 한국어 (Task List, Changelog, Readme, 주석 등)
  - 단, 코드 변수명이나 커밋 메시지의 prefix(feat, fix 등)는 영문을 허용합니다.

## 2. 브랜치 전략 (Branch Strategy)
- 새 기능 개발 시 항상 새로운 브랜치를 생성합니다. (`feat/feature-name`)
- 작업 완료 후 `main` 브랜치에 병합합니다.
- 병합 시 `CHANGELOG.md`를 반드시 업데이트합니다.

## 3. 코드 스타일
- **HTML/CSS/JS**: Vanilla 스택을 유지합니다.
- **디자인**: 프리미엄 다크 테마를 유지하며, 심미성을 최우선으로 고려합니다.

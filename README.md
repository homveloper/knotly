# 🎨 Knotly

> 손글씨 노트 느낌의 평평한 그래프 구조 기반 노트 애플리케이션
> **바이브코딩과 Speckit 사양 기반 개발 방법론으로 구현하는 Node.js 풀스택 학습 프로젝트**

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React 18" />
  <img src="https://img.shields.io/badge/NestJS-CQRS-E0234E?logo=nestjs" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Speckit-SDD-FF6B6B" alt="Speckit" />
</p>

---

## 💡 프로젝트 정체성

**Knotly**는 대학 노트 필기 스타일의 자유로운 사고 정리를 제공하는 손글씨 노트 애플리케이션입니다. 기존 마인드맵 도구들의 딱딱한 비즈니스 느낌과 달리, 낙서장처럼 편안하고 개인적인 경험을 제공합니다.

이 프로젝트는 **Node.js 풀스택 개발 학습**과 **모던 웹 개발 방법론 실습**을 목적으로 하는 포트폴리오 프로젝트입니다.

### 🎯 학습 목표

- **Node.js 풀스택 개발**: React + NestJS 기반 실전 프로젝트 경험
- **모던 웹 기술 스택**: TypeScript, CQRS, 이벤트 소싱, PWA 학습
- **배포 및 DevOps**: Docker, CI/CD, 클라우드 배포 파이프라인 구축
- **실시간 협업 시스템**: WebSocket 기반 동시 편집 구현 (Phase 2)
- **AI 페어 프로그래밍**: Claude Code와 함께하는 바이브코딩 경험

---

## 🔥 개발 방법론

### 바이브코딩 (Vibe Coding)

**Claude Code**(AI 페어 프로그래머)와 함께 빠르게 프로토타이핑하고 반복하는 개발 방식입니다.

전통적인 TDD나 Bottom-up 방식이 아닌, **사양을 정의하고 AI와 협업하여 빠르게 구현하며 학습하는 Top-down 접근법**을 채택했습니다. 이를 통해:

- ⚡️ 빠른 프로토타이핑과 실험
- 🎓 학습과 구현을 병행
- 🤖 AI의 제안을 받아들이고 개선하는 반복적 개발
- 💬 자연어로 의도를 전달하고 코드로 구체화

### Speckit 사양 기반 개발 (Specification-Driven Development)

[Speckit](https://github.com/specify-kit/speckit) 프레임워크를 활용한 체계적인 개발 프로세스를 적용합니다.

#### 핵심 원칙

- **WHAT에 초점**: HOW(구현 방법)가 아닌 WHAT(무엇을 만들 것인가)을 먼저 정의
- **마일스톤 기반 진화**: 프로그램이 점진적으로 발전하는 구조로 설계
- **사양 문서 우선**: `features/loadmap.md`에 전체 로드맵을 정의하고 이를 기반으로 개발
- **명확한 완료 기준**: 각 마일스톤별 체크리스트로 진행 상황 추적

#### Speckit 워크플로우

```bash
# 1. 기능 사양 작성
/speckit.specify

# 2. 설계 아티팩트 생성
/speckit.plan

# 3. 실행 가능한 태스크 분해
/speckit.tasks

# 4. 구현 실행
/speckit.implement
```

📂 **사양 문서 위치**: `.specify/` 디렉토리
📄 **전체 로드맵**: [features/loadmap.md](./features/loadmap.md)

---

## ✨ 프로젝트 특징

### 🖊 손글씨 노트 느낌

- **rough.js**: 손으로 그린 듯한 자연스러운 도형 렌더링
- **손글씨 폰트**: 나눔손글씨 펜(한글) + Caveat(영문)
- **모눈종이 배경**: 20px 간격의 그리드로 대학 노트 느낌 재현

### 🔗 평평한 그래프 구조

- 계층 없이 모든 노드가 **동등한 관계**
- 점선으로 자유롭게 연결
- @멘션으로 빠른 노드 참조

### 📱 모바일 퍼스트

- **PWA**: 홈화면에 설치 가능
- **오프라인 지원**: IndexedDB + Service Worker
- **터치 제스처**: 핀치 줌, 팬, 롱프레스 최적화

### 🎨 12가지 도형 타입

동그라미, 네모, 둥근네모, 구름, 말풍선, 텍스트만, 별, 하트, 배너, 체크박스, 화살표, 포스트잇

### 🌈 8가지 파스텔 색상

노란색, 하늘색, 민트, 주황, 보라, 베이지, 흰색, 투명

---

## 🏗 아키텍처

### 시스템 구조

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (PWA)                    │
│  React 18 + TypeScript + Zustand + Tailwind CSS    │
│              rough.js + react-use-gesture           │
└──────────────────┬──────────────────────────────────┘
                   │ REST API / WebSocket (Phase 2)
┌──────────────────▼──────────────────────────────────┐
│              Backend (NestJS + CQRS)                │
│          Prisma ORM + PostgreSQL                    │
│     Event Sourcing (Phase 2) + Socket.io           │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│              Data Layer                             │
│   PostgreSQL (Neon/Supabase) + IndexedDB (Local)   │
└─────────────────────────────────────────────────────┘
```

### MVP 아키텍처 (Milestone 1-5)

- **프론트엔드 단독**: IndexedDB 로컬 저장
- **백엔드 준비**: 데이터 모델 설계 및 API 스캐폴딩
- **오프라인 우선**: Service Worker 캐싱

### Phase 2 아키텍처

- **실시간 협업**: Socket.io 양방향 통신
- **이벤트 소싱**: 완벽한 히스토리 추적
- **서버 동기화**: PostgreSQL 중앙 저장소

---

## 🛠 기술 스택

### Frontend

| 기술 | 용도 | 학습 목표 |
|------|------|-----------|
| **React 18** | UI 프레임워크 | 최신 React 패턴 (Hooks, Suspense) |
| **TypeScript** | 타입 안전성 | 대규모 프로젝트 타입 설계 |
| **Zustand** | 상태 관리 | 경량 상태 관리 라이브러리 |
| **Tailwind CSS** | 스타일링 | Utility-first CSS 방법론 |
| **rough.js** | 손그림 렌더링 | Canvas/SVG 그래픽 라이브러리 |
| **react-use-gesture** | 터치 제스처 | 모바일 UX 최적화 |
| **Fuse.js** | 퍼지 검색 | 전문 검색 알고리즘 |
| **PWA** | 오프라인 지원 | Service Worker, IndexedDB |

### Backend

| 기술 | 용도 | 학습 목표 |
|------|------|-----------|
| **NestJS** | 백엔드 프레임워크 | 엔터프라이즈급 Node.js 아키텍처 |
| **CQRS 패턴** | 읽기/쓰기 분리 | 확장 가능한 아키텍처 설계 |
| **Prisma ORM** | 데이터베이스 ORM | 타입 안전 쿼리 + 마이그레이션 |
| **PostgreSQL** | RDBMS | 관계형 데이터 모델링 |
| **Socket.io** (Phase 2) | 실시간 통신 | WebSocket 기반 협업 시스템 |
| **이벤트 소싱** (Phase 2) | 히스토리 추적 | 이벤트 기반 아키텍처 |

### DevOps & Infrastructure

| 기술 | 용도 | 학습 목표 |
|------|------|-----------|
| **Docker** | 컨테이너화 | 로컬 개발 환경 표준화 |
| **Vercel / Netlify** | 프론트엔드 배포 | JAMstack 배포 전략 |
| **Railway / Fly.io** | 백엔드 배포 | Node.js 서버 호스팅 |
| **GitHub Actions** | CI/CD | 자동화 파이프라인 구축 |
| **Neon / Supabase** | PostgreSQL | 클라우드 데이터베이스 |

---

## 🗺 개발 로드맵

### Milestone 0: 프로젝트 기반 구축 (Week 0)
- ✅ React + Vite 프로젝트 초기화
- ✅ NestJS + Prisma 셋업
- ✅ Docker Compose 개발 환경

### Milestone 1: 최소 동작 프로토타입 (Week 1-2)
- 🎯 도형 1개 렌더링 (rough.js)
- 🎯 손글씨 폰트 1개 (나눔손글씨 펜)
- 🎯 SVG text 렌더링

### Milestone 2: 기본 CRUD 및 모바일 제스처 (Week 3-4)
- 🎯 노드 생성/편집/이동/삭제
- 🎯 그리드 배경 + 3가지 배경색
- 🎯 FAB 버튼, 핀치/팬 제스처

### Milestone 3: 연결선 시스템 (Week 5-6)
- 🎯 점선 연결 생성/삭제
- 🎯 @멘션 자동 연결

### Milestone 4: 데이터 영속성 및 PWA (Week 7-8)
- 🎯 IndexedDB 자동 저장 (500ms 디바운싱)
- 🎯 Service Worker + 오프라인 지원
- 🎯 PWA manifest.json

### Milestone 5: 검색 기능 및 접근성 (Week 9-10)
- 🎯 Fuse.js 전문 검색
- 🎯 키보드 네비게이션
- 🎯 WCAG 2.1 AA 준수
- **🎉 MVP 완성!**

### Milestone 6: 멀티 디바이스 UX (Week 11-12)
- 🎯 12가지 도형 타입 완성
- 🎯 5가지 연결선 스타일
- 🎯 태블릿/데스크톱 최적화

### Phase 2: 협업 및 고급 기능 (3-6개월)
- 실시간 협업 (Socket.io)
- 계정 시스템 (User/Workspace)
- Undo/Redo (이벤트 소싱)
- 다크모드, 색맹 모드

### Phase 3: AI 및 고급 그래프 (6개월+)
- AI 기반 자동 연결 제안
- 그래프 분석 (최단 경로, 클러스터)
- 리치 미디어 지원 (이미지, 파일)

📄 **자세한 로드맵**: [features/loadmap.md](./features/loadmap.md)

---

## 🚀 실행 방법

### 사전 요구사항

- Node.js 18+
- Docker & Docker Compose
- pnpm (권장) 또는 npm

### 로컬 개발 환경 설정

```bash
# 1. 저장소 클론
git clone https://github.com/yourusername/knotly.git
cd knotly

# 2. 의존성 설치
pnpm install

# 3. Docker로 PostgreSQL 실행
docker-compose up -d

# 4. 데이터베이스 마이그레이션
cd backend
pnpm prisma migrate dev

# 5. 개발 서버 실행
# Terminal 1: Frontend
cd frontend
pnpm dev

# Terminal 2: Backend
cd backend
pnpm start:dev
```

### 환경 변수 설정

```bash
# backend/.env
DATABASE_URL="postgresql://user:password@localhost:5432/knotly"
JWT_SECRET="your-secret-key"

# frontend/.env
VITE_API_URL="http://localhost:3000"
```

---

## 📦 배포 전략

### Frontend (Vercel)

```bash
# Vercel CLI로 배포
cd frontend
vercel deploy --prod
```

- **빌드 커맨드**: `pnpm build`
- **출력 디렉토리**: `dist`
- **환경 변수**: `VITE_API_URL`

### Backend (Railway / Fly.io)

```bash
# Railway CLI로 배포
cd backend
railway up
```

- **시작 커맨드**: `pnpm start:prod`
- **환경 변수**: `DATABASE_URL`, `JWT_SECRET`
- **포트**: 3000

### Database (Neon / Supabase)

- PostgreSQL 15 인스턴스
- 자동 백업 설정
- Connection pooling (PgBouncer)

### CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
- Frontend: Vercel 자동 배포
- Backend: Railway 자동 배포
- Database: Prisma 마이그레이션
- 테스트: Jest + Playwright E2E
```

---

## 📚 학습 리소스

### 블로그 (개발 일지)

각 마일스톤별 학습 내용과 회고를 블로그에 기록하고 있습니다:

- [링크 예정] Milestone 1: rough.js와 손글씨 폰트 통합
- [링크 예정] Milestone 2: 모바일 터치 제스처 최적화
- [링크 예정] Milestone 3: @멘션 자동완성 구현
- [링크 예정] Phase 2: Socket.io 실시간 협업 구현

### 참고 문서

- [Speckit 공식 문서](https://github.com/specify-kit/speckit)
- [NestJS CQRS 패턴](https://docs.nestjs.com/recipes/cqrs)
- [rough.js 공식 문서](https://roughjs.com/)

---

## 🤝 프로젝트 진행 상황

현재 진행 중인 마일스톤: **Milestone 0 - 프로젝트 기반 구축**

- [x] 프로젝트 구조 설계
- [x] 로드맵 문서 작성
- [ ] React + Vite 프로젝트 초기화
- [ ] NestJS + Prisma 셋업
- [ ] Docker Compose 개발 환경

---

## 👤 Author

**[Your Name]**

- GitHub: [@yourusername](https://github.com/yourusername)
- Blog: [https://yourblog.com](https://yourblog.com)
- Email: your.email@example.com

---

## 📄 라이선스

이 프로젝트는 학습 목적의 포트폴리오 프로젝트입니다.

---

<p align="center">
  Made with ☕️ and <a href="https://claude.ai">Claude Code</a>
</p>

# Knotly 개발 환경 설정

> 로컬 개발 환경 구축 가이드

## 🛠 사전 요구사항

### 필수 설치

| 도구 | 버전 | 설치 링크 |
|------|------|-----------|
| **Node.js** | 18.x LTS | https://nodejs.org |
| **pnpm** | 8.x | `npm install -g pnpm` |
| **Docker** | 24.x | https://docker.com |
| **Git** | 2.x | https://git-scm.com |

### 권장 도구

| 도구 | 용도 |
|------|------|
| **VS Code** | 코드 에디터 |
| **Postman** | API 테스트 (Phase 2) |
| **TablePlus** | DB 관리 |

---

## 📦 프로젝트 클론

```bash
# 1. 저장소 클론
git clone https://github.com/yourusername/knotly.git
cd knotly

# 2. 브랜치 확인
git branch -a
git checkout develop  # 개발 브랜치
```

---

## 🎨 Frontend 개발 환경

### 1. 의존성 설치

```bash
cd frontend
pnpm install
```

### 2. 환경 변수 설정

```bash
# frontend/.env.local 파일 생성
VITE_API_URL=http://localhost:3000
VITE_ENV=development
```

### 3. 개발 서버 실행

```bash
pnpm dev
# http://localhost:5173
```

### 4. VS Code 확장 프로그램

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### 5. ESLint + Prettier 설정

```json
// frontend/.eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "rules": {
    "react/react-in-jsx-scope": "off"
  }
}
```

```json
// frontend/.prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

---

## 🚀 Backend 개발 환경 (Phase 2)

### 1. Docker Compose로 PostgreSQL 실행

```yaml
# docker-compose.yml (프로젝트 루트)
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: knotly-db
    environment:
      POSTGRES_USER: knotly
      POSTGRES_PASSWORD: dev-password
      POSTGRES_DB: knotly
    ports:
      - '5432:5432'
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

```bash
# Docker Compose 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f postgres
```

### 2. 의존성 설치

```bash
cd backend
pnpm install
```

### 3. 환경 변수 설정

```bash
# backend/.env 파일 생성
DATABASE_URL="postgresql://knotly:dev-password@localhost:5432/knotly"
JWT_SECRET="dev-secret-key-change-in-production"
NODE_ENV=development
PORT=3000
```

### 4. Prisma 마이그레이션

```bash
# 스키마 정의 (backend/prisma/schema.prisma)
# 이미 정의되어 있음

# 마이그레이션 생성 및 적용
pnpm prisma migrate dev --name init

# Prisma Studio (DB GUI) 실행
pnpm prisma studio
# http://localhost:5555
```

### 5. 개발 서버 실행

```bash
pnpm start:dev
# http://localhost:3000

# API 문서 (Swagger)
# http://localhost:3000/api/docs
```

---

## 🧪 테스트 환경

### Frontend 테스트

```bash
cd frontend

# 단위 테스트 (Vitest)
pnpm test

# 테스트 커버리지
pnpm test:coverage

# E2E 테스트 (Playwright)
pnpm test:e2e
```

### Backend 테스트

```bash
cd backend

# 단위 테스트 (Jest)
pnpm test

# E2E 테스트
pnpm test:e2e

# 테스트 커버리지
pnpm test:cov
```

---

## 🔧 개발 도구

### Git Hooks (Husky)

```json
// package.json (루트)
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

### 커밋 메시지 컨벤션

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Type**:
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드 설정 등

**예시**:
```
feat(canvas): add grid snap functionality

Implement 20px grid snap when dragging nodes.
Users can toggle snap in settings.

Closes #42
```

---

## 📂 프로젝트 구조

```
knotly/
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/         # UI 컴포넌트
│   │   ├── domain/             # 도메인 모델
│   │   ├── application/        # Use Cases
│   │   ├── infrastructure/     # API, IndexedDB
│   │   └── store/              # Zustand 스토어
│   ├── public/
│   └── package.json
│
├── backend/                    # NestJS Backend
│   ├── src/
│   │   ├── domain/             # 도메인 모델
│   │   ├── application/        # Use Cases
│   │   ├── infrastructure/     # Prisma, Repositories
│   │   └── presentation/       # Controllers
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
├── docs/                       # 문서
│   ├── architecture.md
│   ├── deployment.md
│   └── ...
│
├── features/                   # 도메인별 사양
│   ├── loadmap.md
│   ├── context-map.md
│   ├── canvas/
│   ├── graph/
│   └── ...
│
├── docker-compose.yml
└── README.md
```

---

## 🐛 디버깅

### Frontend 디버깅 (Chrome DevTools)

1. Chrome DevTools 열기 (F12)
2. Sources 탭 → `webpack://` → 소스 코드
3. 중단점 설정
4. React DevTools 확장 설치

### Backend 디버깅 (VS Code)

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug NestJS",
      "runtimeArgs": ["--nolazy", "-r", "ts-node/register"],
      "args": ["${workspaceFolder}/backend/src/main.ts"],
      "cwd": "${workspaceFolder}/backend",
      "protocol": "inspector",
      "console": "integratedTerminal"
    }
  ]
}
```

---

## 🔍 코드 품질

### ESLint 실행

```bash
# Frontend
cd frontend
pnpm lint
pnpm lint:fix

# Backend
cd backend
pnpm lint
pnpm lint:fix
```

### TypeScript 타입 체크

```bash
# Frontend
cd frontend
pnpm type-check

# Backend
cd backend
pnpm build  # tsc --noEmit
```

---

## 📊 성능 프로파일링

### Frontend

```bash
# Lighthouse 실행
npm install -g @lhci/cli
lhci autorun

# Bundle 분석
pnpm build
pnpm analyze
```

### Backend (Phase 2)

```bash
# Clinic.js 프로파일링
npm install -g clinic
clinic doctor -- node dist/main.js
```

---

## 🆘 트러블슈팅

### 자주 발생하는 문제

#### 1. `pnpm install` 실패

```bash
# 캐시 삭제 후 재설치
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### 2. Docker PostgreSQL 연결 실패

```bash
# 컨테이너 재시작
docker-compose down
docker-compose up -d

# 로그 확인
docker-compose logs postgres
```

#### 3. Prisma 마이그레이션 충돌

```bash
# 개발 DB 리셋 (주의: 데이터 삭제!)
pnpm prisma migrate reset

# 또는 수동 수정
pnpm prisma migrate resolve --rolled-back <migration-name>
```

#### 4. 포트 이미 사용 중

```bash
# 프로세스 찾기 (macOS/Linux)
lsof -ti:5173 | xargs kill -9  # Frontend
lsof -ti:3000 | xargs kill -9  # Backend

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

---

## 📚 추가 리소스

### 공식 문서
- React: https://react.dev
- NestJS: https://docs.nestjs.com
- Prisma: https://www.prisma.io/docs
- Tailwind CSS: https://tailwindcss.com/docs

### 학습 자료
- TypeScript 핸드북: https://www.typescriptlang.org/docs/handbook/
- DDD 패턴: https://domainlanguage.com/ddd/
- CQRS 패턴: https://martinfowler.com/bliki/CQRS.html

---

**작성일**: 2025-10-17
**마지막 업데이트**: 2025-10-17

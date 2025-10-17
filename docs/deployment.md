# Knotly 배포 전략

> 프론트엔드, 백엔드, 데이터베이스의 배포 가이드 및 전략

## 📦 배포 환경

| 환경 | 용도 | URL |
|------|------|-----|
| **Local** | 로컬 개발 | http://localhost:5173 |
| **Staging** | 테스트 & QA | https://staging.knotly.app |
| **Production** | 실서비스 | https://knotly.app |

---

## 🎨 Frontend 배포 (Vercel)

### 준비 사항

```bash
# 환경 변수 설정
VITE_API_URL=https://api.knotly.app         # Production API
VITE_ENV=production
```

### Vercel CLI 배포

```bash
# 1. Vercel CLI 설치
npm install -g vercel

# 2. Vercel 로그인
vercel login

# 3. 프로젝트 초기화
cd frontend
vercel

# 4. Production 배포
vercel --prod
```

### GitHub Actions 자동 배포

```yaml
# .github/workflows/deploy-frontend.yml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./frontend
```

### Vercel 설정 (`vercel.json`)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm ci",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/service-worker.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

---

## 🚀 Backend 배포 (Railway)

### 준비 사항

```bash
# 환경 변수 설정
DATABASE_URL=postgresql://user:pass@db.railway.app:5432/knotly
JWT_SECRET=your-super-secret-key
NODE_ENV=production
PORT=3000
```

### Railway CLI 배포

```bash
# 1. Railway CLI 설치
npm install -g @railway/cli

# 2. Railway 로그인
railway login

# 3. 프로젝트 초기화
cd backend
railway init

# 4. 환경 변수 설정
railway variables set DATABASE_URL="postgresql://..."
railway variables set JWT_SECRET="..."

# 5. 배포
railway up
```

### Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# 의존성 설치
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# 소스 복사 및 빌드
COPY . .
RUN npm run build

# Prisma 클라이언트 생성
RUN npx prisma generate

# Production 이미지
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3000

# 마이그레이션 후 서버 시작
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
```

### GitHub Actions 자동 배포

```yaml
# .github/workflows/deploy-backend.yml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Railway CLI
        run: npm install -g @railway/cli

      - name: Deploy to Railway
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 🗄️ Database 배포 (Neon PostgreSQL)

### Neon 프로젝트 생성

1. https://neon.tech 회원가입
2. 새 프로젝트 생성: `knotly-db`
3. 리전 선택: `AWS us-east-1`
4. Connection String 복사:
   ```
   postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/knotly
   ```

### Prisma 마이그레이션

```bash
# 1. DATABASE_URL 환경 변수 설정
export DATABASE_URL="postgresql://..."

# 2. 마이그레이션 실행
cd backend
npx prisma migrate deploy

# 3. 스키마 확인
npx prisma studio
```

### 백업 전략

**자동 백업** (Neon 기본 기능):
- 매일 자동 백업 (7일 보관)
- Point-in-time recovery (PITR)

**수동 백업**:
```bash
# pg_dump로 백업
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# 복원
psql $DATABASE_URL < backup-20250117.sql
```

---

## 🔄 CI/CD 파이프라인

### 전체 플로우

```
git push → GitHub
    │
    ▼
GitHub Actions
    │
    ├──► Frontend Tests → Build → Deploy to Vercel
    └──► Backend Tests → Build → Deploy to Railway
                              │
                              ▼
                        Prisma Migrate
                              │
                              ▼
                          Neon DB
```

### 브랜치 전략

| 브랜치 | 환경 | 자동 배포 |
|--------|------|-----------|
| `main` | Production | ✅ |
| `develop` | Staging | ✅ |
| `feature/*` | Local | ❌ |

---

## 🧪 배포 전 체크리스트

### Frontend

- [ ] `npm run build` 성공
- [ ] Lighthouse 점수 90+ (Performance)
- [ ] PWA manifest.json 설정 확인
- [ ] Service Worker 동작 확인
- [ ] 환경 변수 설정 확인

### Backend

- [ ] `npm run build` 성공
- [ ] Prisma migrate 성공
- [ ] 환경 변수 설정 확인 (DATABASE_URL, JWT_SECRET)
- [ ] Health check endpoint 동작 확인
- [ ] 로그 레벨 설정 (production: error)

### Database

- [ ] 마이그레이션 스크립트 테스트
- [ ] Connection pool 설정 (max 100)
- [ ] 백업 자동화 확인
- [ ] 인덱스 최적화 확인

---

## 📊 모니터링 설정

### Vercel Analytics

```typescript
// frontend/src/main.tsx
import { Analytics } from '@vercel/analytics/react';

<Analytics />
```

### Railway 로그 확인

```bash
railway logs
```

### Sentry 에러 트래킹 (Phase 2)

```typescript
// backend/src/main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

---

## 🚨 롤백 전략

### Frontend 롤백 (Vercel)

```bash
# 1. Vercel 대시보드에서 이전 배포 선택
# 2. "Promote to Production" 클릭

# 또는 CLI로
vercel rollback <deployment-url>
```

### Backend 롤백 (Railway)

```bash
# 1. Railway 대시보드에서 이전 배포 선택
# 2. "Redeploy" 클릭

# 또는 Git revert 후 재배포
git revert HEAD
git push origin main
```

### Database 롤백

```bash
# Prisma 마이그레이션 롤백 (주의!)
npx prisma migrate resolve --rolled-back <migration-name>

# 백업에서 복원
psql $DATABASE_URL < backup-20250117.sql
```

---

## 🔒 보안 체크리스트

- [ ] HTTPS 강제 (Vercel/Railway 자동)
- [ ] 환경 변수는 절대 커밋하지 않음 (.env → .gitignore)
- [ ] CORS 설정 (Backend: 허용된 도메인만)
- [ ] Rate Limiting (100 req/min)
- [ ] JWT Secret은 충분히 복잡한 문자열 (최소 32자)
- [ ] Database는 퍼블릭 접근 차단 (Railway/Neon VPC)

---

## 📝 배포 후 확인 사항

1. **Frontend**
   - [ ] https://knotly.app 접속 확인
   - [ ] PWA 설치 가능 확인
   - [ ] 오프라인 모드 동작 확인

2. **Backend** (Phase 2)
   - [ ] Health check: `GET /health` → 200 OK
   - [ ] API 응답 시간 < 200ms (p95)
   - [ ] WebSocket 연결 확인

3. **Database**
   - [ ] Connection pool 정상 동작
   - [ ] 쿼리 성능 모니터링
   - [ ] 백업 자동 실행 확인

---

**작성일**: 2025-10-17
**마지막 업데이트**: 2025-10-17

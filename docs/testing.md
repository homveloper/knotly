# Knotly 테스트 전략

> 단위 테스트, 통합 테스트, E2E 테스트 가이드

## 🎯 테스트 전략 개요

### 테스트 피라미드

```
         /\
        /  \    E2E (10%)
       /────\   Playwright, Cypress
      /      \
     /────────\  통합 테스트 (30%)
    /          \ React Testing Library, Jest
   /────────────\
  /              \ 단위 테스트 (60%)
 /________________\ Vitest, Jest
```

**목표**:
- 테스트 커버리지 80% 이상
- 단위 테스트 위주, E2E는 Critical Path만
- 테스트 실행 시간 < 5분 (CI)

---

## 🧪 Frontend 테스트

### 단위 테스트 (Vitest)

#### 설정

```typescript
// frontend/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
});
```

#### 예시: Node Aggregate 테스트

```typescript
// frontend/src/domain/graph/Node.spec.ts
import { describe, it, expect } from 'vitest';
import { Node } from './Node';
import { Position } from './Position';
import { Content } from './Content';

describe('Node Aggregate', () => {
  describe('create', () => {
    it('should create a new node with valid params', () => {
      // Given
      const position = Position.from(100, 200);
      const content = Content.from('Test Node');

      // When
      const node = Node.create({ position, content });

      // Then
      expect(node.getId()).toBeDefined();
      expect(node.getPosition()).toEqual(position);
      expect(node.getUncommittedEvents()).toHaveLength(1);
    });

    it('should throw error when content exceeds limit', () => {
      // Given
      const position = Position.from(100, 200);
      const longText = 'a'.repeat(1001);
      const content = Content.from(longText);

      // When & Then
      expect(() => Node.create({ position, content })).toThrow(
        'Content exceeds 1000 characters'
      );
    });
  });

  describe('moveTo', () => {
    it('should move node to new position', () => {
      // Given
      const node = createTestNode();
      const newPosition = Position.from(300, 400);

      // When
      node.moveTo(newPosition);

      // Then
      expect(node.getPosition()).toEqual(newPosition);
      expect(node.getUncommittedEvents()).toContainEqual(
        expect.objectContaining({
          eventName: 'NodeMoved',
          position: newPosition,
        })
      );
    });
  });
});

// Test Helper
function createTestNode(): Node {
  return Node.create({
    position: Position.from(100, 100),
    content: Content.from('Test'),
  });
}
```

---

### 컴포넌트 테스트 (React Testing Library)

```typescript
// frontend/src/components/Canvas/Canvas.spec.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Canvas } from './Canvas';
import { useCanvasStore } from '@/store/canvasStore';

describe('Canvas Component', () => {
  it('should render grid background', () => {
    // Given
    render(<Canvas />);

    // Then
    expect(screen.getByTestId('canvas-grid')).toBeInTheDocument();
  });

  it('should create node on FAB button click', async () => {
    // Given
    const createNode = vi.fn();
    useCanvasStore.setState({ createNode });

    render(<Canvas />);
    const fabButton = screen.getByRole('button', { name: /add node/i });

    // When
    fireEvent.click(fabButton);

    // Then
    expect(createNode).toHaveBeenCalledOnce();
  });

  it('should zoom in on pinch gesture', async () => {
    // Given
    render(<Canvas />);
    const canvas = screen.getByTestId('canvas');

    // When
    fireEvent.touchStart(canvas, {
      touches: [
        { clientX: 0, clientY: 0 },
        { clientX: 100, clientY: 100 },
      ],
    });

    fireEvent.touchMove(canvas, {
      touches: [
        { clientX: 0, clientY: 0 },
        { clientX: 200, clientY: 200 },
      ],
    });

    // Then
    const zoom = useCanvasStore.getState().zoom;
    expect(zoom).toBeGreaterThan(1);
  });
});
```

---

### E2E 테스트 (Playwright)

#### 설정

```typescript
// frontend/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### 예시: Critical Path 테스트

```typescript
// frontend/e2e/create-and-connect-nodes.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Node Creation and Connection', () => {
  test('should create two nodes and connect them', async ({ page }) => {
    // Given: 앱 접속
    await page.goto('/');

    // When: 첫 번째 노드 생성
    await page.click('[data-testid="fab-button"]');
    await page.fill('[data-testid="node-input"]', 'Node 1');
    await page.press('[data-testid="node-input"]', 'Enter');

    // And: 두 번째 노드 생성
    await page.click('[data-testid="fab-button"]');
    await page.fill('[data-testid="node-input"]', 'Node 2');
    await page.press('[data-testid="node-input"]', 'Enter');

    // And: 연결 모드 진입
    await page.click('[data-testid="connect-button"]');

    // And: 두 노드 순차 클릭
    await page.click('text=Node 1');
    await page.click('text=Node 2');

    // Then: 점선 연결 확인
    const edge = page.locator('[data-testid="edge"]');
    await expect(edge).toBeVisible();
    await expect(edge).toHaveAttribute('stroke-dasharray', '5, 5');
  });

  test('should auto-connect using @mention', async ({ page }) => {
    // Given: 노드 1개 생성
    await page.goto('/');
    await page.click('[data-testid="fab-button"]');
    await page.fill('[data-testid="node-input"]', 'Target Node');
    await page.press('[data-testid="node-input"]', 'Enter');

    // When: 새 노드에서 @ 입력
    await page.click('[data-testid="fab-button"]');
    await page.type('[data-testid="node-input"]', 'Mention @');

    // And: 자동완성 목록에서 선택
    await page.click('text=Target Node');

    // Then: 자동 연결 확인
    const edges = page.locator('[data-testid="edge"]');
    await expect(edges).toHaveCount(1);
  });
});
```

---

## 🚀 Backend 테스트 (Phase 2)

### 단위 테스트 (Jest)

```typescript
// backend/src/domain/graph/Node.spec.ts
import { Node } from './Node';
import { NodeId } from './NodeId';
import { Position } from './Position';

describe('Node Aggregate', () => {
  describe('create', () => {
    it('should create node with valid params', () => {
      // Given
      const params = {
        position: new Position(100, 100),
        content: 'Test Node',
      };

      // When
      const node = Node.create(params);

      // Then
      expect(node.getId()).toBeInstanceOf(NodeId);
      expect(node.getPosition()).toEqual(params.position);
    });
  });
});
```

---

### 통합 테스트 (Repository + DB)

```typescript
// backend/src/infrastructure/NodeRepository.integration.spec.ts
import { Test } from '@nestjs/testing';
import { PrismaService } from '@/infrastructure/prisma/PrismaService';
import { NodeRepositoryImpl } from './NodeRepositoryImpl';
import { Node } from '@/domain/graph/Node';

describe('NodeRepository Integration', () => {
  let repository: NodeRepositoryImpl;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [PrismaService, NodeRepositoryImpl],
    }).compile();

    repository = module.get(NodeRepositoryImpl);
    prisma = module.get(PrismaService);
  });

  afterEach(async () => {
    await prisma.node.deleteMany();
  });

  it('should save and retrieve node', async () => {
    // Given
    const node = Node.create({
      position: new Position(100, 100),
      content: 'Test',
    });

    // When
    await repository.save(node);
    const retrieved = await repository.findById(node.getId());

    // Then
    expect(retrieved).toBeDefined();
    expect(retrieved?.getContent()).toBe('Test');
  });
});
```

---

### E2E 테스트 (Supertest)

```typescript
// backend/test/graph.e2e-spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';

describe('Graph API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /nodes - should create a new node', () => {
    return request(app.getHttpServer())
      .post('/nodes')
      .send({
        position: { x: 100, y: 100 },
        content: 'Test Node',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
        expect(res.body.content).toBe('Test Node');
      });
  });

  it('GET /nodes/:id - should retrieve node', async () => {
    // Given: 노드 생성
    const createRes = await request(app.getHttpServer())
      .post('/nodes')
      .send({ position: { x: 100, y: 100 }, content: 'Test' });

    const nodeId = createRes.body.id;

    // When & Then
    return request(app.getHttpServer())
      .get(`/nodes/${nodeId}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe(nodeId);
        expect(res.body.content).toBe('Test');
      });
  });
});
```

---

## 📊 테스트 커버리지

### 목표 커버리지

| 레이어 | 목표 | 도구 |
|--------|------|------|
| Domain | 90%+ | Vitest / Jest |
| Application | 80%+ | Vitest / Jest |
| Infrastructure | 70%+ | Integration Tests |
| Presentation | 60%+ | RTL / Supertest |

### 커버리지 확인

```bash
# Frontend
cd frontend
pnpm test:coverage
open coverage/index.html

# Backend
cd backend
pnpm test:cov
open coverage/lcov-report/index.html
```

---

## 🔄 CI/CD 테스트 파이프라인

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd frontend
          pnpm install

      - name: Run unit tests
        run: pnpm test

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/coverage-final.json

  backend-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Run tests
        run: |
          cd backend
          pnpm install
          pnpm test:e2e
```

---

## ✅ 테스트 체크리스트

### PR 전 필수 체크

- [ ] 모든 단위 테스트 통과 (`pnpm test`)
- [ ] E2E Critical Path 테스트 통과
- [ ] 커버리지 80% 이상 유지
- [ ] ESLint 경고 없음
- [ ] TypeScript 타입 에러 없음

---

**작성일**: 2025-10-17
**마지막 업데이트**: 2025-10-17

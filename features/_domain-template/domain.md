# [DOMAIN_NAME] Domain

> 이 도메인의 핵심 책임과 도메인 모델을 정의합니다.

## 📋 Bounded Context 정의

**이름**: [DOMAIN_NAME] Context
**타입**: ☐ Core Domain ☐ Supporting Domain ☐ Generic Domain

**핵심 책임**:
- [책임 1]
- [책임 2]
- [책임 3]

**Ubiquitous Language (용어)**:
- [용어1]: [정의]
- [용어2]: [정의]
- [용어3]: [정의]

---

## 🎯 Aggregates

### Aggregate 1: [AGGREGATE_NAME]

**Aggregate Root**: [EntityName]

**포함된 Entities**:
- [Entity1]: [설명]
- [Entity2]: [설명]

**Value Objects**:
- [VO1]: [설명 및 불변 조건]
- [VO2]: [설명 및 불변 조건]

**불변 조건 (Invariants)**:
1. [불변 조건 1]
2. [불변 조건 2]
3. [불변 조건 3]

**도메인 규칙 (Business Rules)**:
- [규칙 1]
- [규칙 2]

**도메인 이벤트**:
- `[EventName1]`: [발생 조건]
- `[EventName2]`: [발생 조건]

---

### Aggregate 2: [AGGREGATE_NAME]

_(위와 동일한 구조)_

---

## 🔄 도메인 서비스 (Domain Services)

### [ServiceName]

**책임**: [도메인 로직 설명]

**메서드**:
- `methodName(params): Result` - [설명]

**사용 예시**:
```typescript
const service = new [ServiceName](repository);
const result = service.methodName(params);
```

---

## 📦 Repository 인터페이스

### [EntityName]Repository

```typescript
interface [EntityName]Repository {
  // Create
  save(entity: [EntityName]): Promise<void>;

  // Read
  findById(id: [EntityName]Id): Promise<[EntityName] | null>;
  findAll(): Promise<[EntityName][]>;

  // Update
  update(entity: [EntityName]): Promise<void>;

  // Delete
  delete(id: [EntityName]Id): Promise<void>;
}
```

---

## 🔗 다른 Bounded Context와의 관계

### Upstream (제공받음)
- **[Context Name]**: [받는 데이터/이벤트]

### Downstream (제공함)
- **[Context Name]**: [제공하는 데이터/이벤트]

### 통합 이벤트
- `[IntegrationEvent1]`: [목적]
- `[IntegrationEvent2]`: [목적]

---

## 📐 설계 결정 사항 (ADR)

### ADR-001: [결정 사항 제목]

**상황**:
[어떤 문제를 해결하려고 하는가?]

**결정**:
[어떤 결정을 내렸는가?]

**결과**:
[이 결정으로 인한 장단점]

---

## ✅ 완료 체크리스트

도메인 모델링 완료 기준:

- [ ] Aggregate Root 식별 완료
- [ ] 불변 조건 명시 완료
- [ ] 도메인 이벤트 정의 완료
- [ ] Repository 인터페이스 정의 완료
- [ ] 다른 Context와의 관계 정의 완료
- [ ] Event Storming 결과와 일치 확인

---

**작성일**: [YYYY-MM-DD]
**작성자**: [Name]
**마지막 업데이트**: [YYYY-MM-DD]

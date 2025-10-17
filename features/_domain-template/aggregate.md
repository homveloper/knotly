# [AGGREGATE_NAME] Aggregate 상세 설계

> Aggregate의 구현 레벨 설계를 TypeScript 코드로 정의합니다.

## 📦 Aggregate 개요

**Aggregate Root**: [EntityName]
**Bounded Context**: [DOMAIN_NAME] Context
**책임**: [핵심 책임 한 줄 설명]

---

## 🏗 Entity: [EntityName] (Aggregate Root)

### 인터페이스 설계

```typescript
// Domain/[DOMAIN_NAME]/Entity/[EntityName].ts

import { AggregateRoot } from '@/shared/domain/AggregateRoot';
import { [EntityName]Id } from './[EntityName]Id';
import { [VO1] } from './[VO1]';
import { [VO2] } from './[VO2]';

export class [EntityName] extends AggregateRoot {
  private readonly id: [EntityName]Id;
  private prop1: [VO1];
  private prop2: [VO2];
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(
    id: [EntityName]Id,
    prop1: [VO1],
    prop2: [VO2],
    createdAt: Date
  ) {
    super();
    this.id = id;
    this.prop1 = prop1;
    this.prop2 = prop2;
    this.createdAt = createdAt;
    this.updatedAt = new Date();
  }

  // Factory Methods
  static create(params: Create[EntityName]Params): [EntityName] {
    const entity = new [EntityName](
      [EntityName]Id.generate(),
      params.prop1,
      params.prop2,
      new Date()
    );

    entity.recordEvent(
      new [EntityName]Created(
        entity.id.value,
        entity.prop1.value,
        entity.prop2.value
      )
    );

    return entity;
  }

  static reconstitute(params: Reconstitute[EntityName]Params): [EntityName] {
    return new [EntityName](
      new [EntityName]Id(params.id),
      params.prop1,
      params.prop2,
      params.createdAt
    );
  }

  // Domain Logic (Public Methods)
  public methodName(param: Type): void {
    // 1. 불변 조건 검증
    this.ensureInvariant(param);

    // 2. 상태 변경
    this.prop1 = newValue;
    this.updatedAt = new Date();

    // 3. 도메인 이벤트 발행
    this.recordEvent(new [EventName](this.id.value, newValue));
  }

  // Invariant Enforcement (Private)
  private ensureInvariant(param: Type): void {
    if (!this.isValid(param)) {
      throw new [DomainException]('불변 조건 위반 메시지');
    }
  }

  private isValid(param: Type): boolean {
    // 검증 로직
    return true;
  }

  // Getters
  public getId(): [EntityName]Id {
    return this.id;
  }

  public getProp1(): [VO1] {
    return this.prop1;
  }

  // Domain Event Accessors
  public getUncommittedEvents(): DomainEvent[] {
    return this.uncommittedEvents;
  }

  public markEventsAsCommitted(): void {
    this.uncommittedEvents = [];
  }
}
```

---

## 💎 Value Objects

### VO 1: [VO_NAME]

```typescript
// Domain/[DOMAIN_NAME]/ValueObject/[VO_NAME].ts

export class [VO_NAME] {
  private readonly _value: [Type];

  constructor(value: [Type]) {
    this.validate(value);
    this._value = value;
  }

  private validate(value: [Type]): void {
    if (!this.isValid(value)) {
      throw new Invalid[VO_NAME]Error('검증 실패 메시지');
    }
  }

  private isValid(value: [Type]): boolean {
    // 검증 로직
    return true;
  }

  public get value(): [Type] {
    return this._value;
  }

  // Equality (Value Object는 값으로 비교)
  public equals(other: [VO_NAME]): boolean {
    return this._value === other._value;
  }

  // 편의 메서드
  public static from(value: [Type]): [VO_NAME] {
    return new [VO_NAME](value);
  }
}
```

---

### VO 2: [VO_NAME]

_(위와 동일한 구조)_

---

## 🆔 Entity ID

```typescript
// Domain/[DOMAIN_NAME]/ValueObject/[EntityName]Id.ts

import { v4 as uuidv4 } from 'uuid';

export class [EntityName]Id {
  private readonly _value: string;

  constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  private validate(value: string): void {
    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Invalid[EntityName]IdError('Invalid UUID format');
    }
  }

  public static generate(): [EntityName]Id {
    return new [EntityName]Id(uuidv4());
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: [EntityName]Id): boolean {
    return this._value === other._value;
  }
}
```

---

## 📢 Domain Events

### Event 1: [EventName]

```typescript
// Domain/[DOMAIN_NAME]/Event/[EventName].ts

import { DomainEvent } from '@/shared/domain/DomainEvent';

export class [EventName] implements DomainEvent {
  public readonly occurredOn: Date;
  public readonly aggregateId: string;

  constructor(
    aggregateId: string,
    public readonly field1: Type1,
    public readonly field2: Type2
  ) {
    this.occurredOn = new Date();
    this.aggregateId = aggregateId;
  }

  public eventName(): string {
    return '[EventName]';
  }
}
```

---

## ⚠️ Domain Exceptions

```typescript
// Domain/[DOMAIN_NAME]/Exception/[DomainException].ts

export class [DomainException] extends Error {
  constructor(message: string) {
    super(message);
    this.name = '[DomainException]';
  }
}
```

**정의된 예외**:
- `Invalid[VO_NAME]Error`: [설명]
- `[AggregateRule]ViolationError`: [설명]

---

## 🧪 단위 테스트

### Aggregate 생성 테스트

```typescript
// Domain/[DOMAIN_NAME]/Entity/[EntityName].spec.ts

describe('[EntityName] Aggregate', () => {
  describe('create', () => {
    it('should create a new [EntityName] with valid params', () => {
      // Given
      const params = {
        prop1: [VO1].from('validValue'),
        prop2: [VO2].from('validValue'),
      };

      // When
      const entity = [EntityName].create(params);

      // Then
      expect(entity.getId()).toBeDefined();
      expect(entity.getProp1()).toEqual(params.prop1);
      expect(entity.getUncommittedEvents()).toHaveLength(1);
      expect(entity.getUncommittedEvents()[0]).toBeInstanceOf([EntityName]Created);
    });

    it('should throw error when invariant is violated', () => {
      // Given
      const invalidParams = {
        prop1: [VO1].from('invalidValue'),
        prop2: [VO2].from('validValue'),
      };

      // When & Then
      expect(() => [EntityName].create(invalidParams)).toThrow([DomainException]);
    });
  });

  describe('methodName', () => {
    it('should change state and publish event', () => {
      // Given
      const entity = createTestEntity();

      // When
      entity.methodName(param);

      // Then
      expect(entity.getProp1()).toEqual(expectedValue);
      expect(entity.getUncommittedEvents()).toContainEqual(
        expect.objectContaining({
          aggregateId: entity.getId().value,
          field1: expectedValue,
        })
      );
    });
  });
});
```

---

## 🔍 Repository 구현 스펙

```typescript
// Domain/[DOMAIN_NAME]/Repository/[EntityName]Repository.ts

export interface [EntityName]Repository {
  save(entity: [EntityName]): Promise<void>;
  findById(id: [EntityName]Id): Promise<[EntityName] | null>;
  findAll(): Promise<[EntityName][]>;
  update(entity: [EntityName]): Promise<void>;
  delete(id: [EntityName]Id): Promise<void>;
}
```

**구현 참고사항**:
- Prisma ORM을 사용한 구현은 Infrastructure Layer에서
- Domain Layer는 인터페이스만 정의
- Event 발행은 Repository에서 처리 (UnitOfWork 패턴)

---

## 📋 불변 조건 체크리스트

- [ ] [불변 조건 1] - `ensureInvariant1()` 메서드로 검증
- [ ] [불변 조건 2] - `ensureInvariant2()` 메서드로 검증
- [ ] [불변 조건 3] - Value Object 생성자에서 검증

---

## 🎯 구현 우선순위

**Phase 1 (MVP)**:
- [ ] Aggregate Root 구현
- [ ] 핵심 Value Objects 구현
- [ ] 필수 도메인 이벤트 구현
- [ ] Repository 인터페이스 정의

**Phase 2**:
- [ ] 추가 도메인 로직
- [ ] 복잡한 Value Objects
- [ ] 통합 이벤트 핸들링

---

**작성일**: [YYYY-MM-DD]
**마지막 업데이트**: [YYYY-MM-DD]

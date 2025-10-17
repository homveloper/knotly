You must follow these core development principles when writing code for this project:

NEVER use throw or exception for error handling. Always use error as value pattern. Return Result types that explicitly represent success or failure states. Functions must return objects containing either the successful value or error information, allowing callers to handle errors explicitly without try-catch blocks.

NEVER use inheritance or is-a relationships. Always prefer composition and has-a relationships. Build complex objects by composing simpler objects together rather than creating class hierarchies. This makes code more flexible and easier to test.

Always use explicit dependency injection. All dependencies must be passed in as constructor parameters or function arguments. NEVER create dependencies inside a class or function. This makes dependencies visible, testable, and replaceable.

NEVER use constructors for object creation. Always use static factory functions or creation functions instead. Constructors cannot return errors or perform validation properly because they must return an instance or throw. Factory functions can validate inputs and return error values, ensuring all created objects are in valid states.

Maintain high code quality standards. Write clean, readable, and maintainable code. Use TypeScript strict mode to catch type errors at compile time. Follow domain-driven design patterns to keep business logic isolated from infrastructure concerns. Prefer immutability and pure functions that do not cause side effects. Keep functions small and focused on a single responsibility.

Follow rigorous testing standards. Write unit tests for all domain logic with at least 80 percent test coverage. Use the test pyramid approach with 60 percent unit tests, 30 percent integration tests, and 10 percent end-to-end tests. Structure tests using Given-When-Then pattern for clarity. Run all tests in CI/CD pipeline before merging code.

Ensure user experience consistency across all devices. Design mobile-first with touch-optimized interfaces. Support keyboard navigation for all interactive elements. Meet WCAG 2.1 AA accessibility standards for color contrast and screen reader compatibility. Maintain 60fps rendering performance for smooth animations and interactions. Test on actual mobile devices, not just desktop browsers.

Meet strict performance requirements. Frontend must render 100 nodes at 60fps without frame drops. API responses must have p95 latency under 200ms. Database queries must use proper indexes and connection pooling. Keep memory usage under 50MB on mobile devices. Use debouncing, memoization, and virtualization to optimize expensive operations.

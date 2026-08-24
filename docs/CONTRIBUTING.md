# Launchly — Contributing Guidelines

Thank you for contributing to Launchly! We maintain high standards for code quality, architectural consistency, and commit history.

---

## 1. Commit Message Conventions

We strictly enforce [Conventional Commits](https://www.conventionalcommits.org/). Every commit message must be lowercase with one of the following prefixes:

| Prefix | Usage | Example |
| :--- | :--- | :--- |
| `feat(...)` | A new user-facing feature or capability | `feat(bot): add AI node execution to flow engine` |
| `fix(...)` | A bug fix in existing code | `fix(crm): resolve live chat websocket reconnection loop` |
| `test(...)` | Adding or updating unit, integration, or E2E tests | `test(backend): add testcontainers integration tests for billing` |
| `refactor(...)`| Code change that neither fixes a bug nor adds a feature | `refactor(auth): simplify token rotation interceptor` |
| `ci(...)` | Changes to CI/CD workflows and deployment scripts | `ci(github): add surefire report parser to checks workflow` |
| `docs(...)` | Documentation updates | `docs(readme): add architecture diagrams and local dev guide` |
| `chore(...)` | Maintenance tasks, dependency bumps | `chore(deps): upgrade spring boot to 4.0.6` |

---

## 2. Branching & PR Strategy

- **`main`**: Production branch. Deployments to production environments trigger automatically on merge.
- **`dev`**: Active integration branch. All feature branches branch off and merge back into `dev`.
- **Feature Branches**: Format as `feat/short-description`, `fix/issue-description`.

---

## 3. Pull Request Checklist

Before submitting a Pull Request, ensure:
1. **Full-Stack Tests Pass**: All 700+ tests pass cleanly (389+ backend tests via `mvn clean verify -B` and 310+ frontend tests via `npm run test:coverage`).
2. **Frontend Quality Passes**: `npm run lint`, `npm run test:coverage`, and `npm run build` pass with zero errors.
3. **No Unused Imports / Lint Errors**: All TypeScript and Java files adhere to project style.
4. **Database Migrations**: Any JPA entity modifications must include a corresponding Liquibase changelog script registered in `db-changelog-master.yaml`.
5. **No Secrets**: Never commit `.env`, `application-secrets.properties`, or raw API keys.

---

## 4. Code Quality & SonarCloud

- All code pushed to `main` and `dev` is scanned via SonarCloud.
- Maintain code coverage across backend business logic layers (`service/impl`, `controller`, `util`).
- Avoid code duplication above the repository standard.

# Contributing to Alpha Dentkart

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install && cd functions && npm install && cd ..`
3. Copy env files: `cp .env.example .env && cp functions/.env.example functions/.env`
4. Start dev server: `npm start`

## Branch Strategy

- `main` — Production branch (auto-deploys)
- `develop` — Integration branch
- `feature/*` — Feature branches
- `fix/*` — Bug fix branches

## Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add product search autocomplete
fix: resolve cart sync race condition
docs: update API endpoint documentation
test: add coupon controller unit tests
chore: update dependencies
```

## Code Quality

- Run `npm run lint` before committing
- Run `npm run typecheck` to verify TypeScript
- Write tests for new features
- Follow existing code patterns and styles

## Pull Request Process

1. Create a feature branch from `develop`
2. Make your changes with descriptive commits
3. Ensure all tests pass: `npm run test:run`
4. Submit PR with description of changes
5. Wait for CI checks and code review

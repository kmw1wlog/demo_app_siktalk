# AGENTS.md

## Project

This repository is the MVP for “식톡(SikTalk)”, a Korean AI strategy archive app.

The product converts a user's natural-language trading idea into a human-readable strategy card. It saves the card into a local “식 서랍”, generates a mock strategy-understanding report, and records fake-door demand for future platform conversion features.

## Core Product Rule

Do not build a real trading, real recommendation, or real automated order system.

This MVP must not:
- recommend buying or selling specific securities
- claim profitability
- place real orders
- connect to real brokerage APIs
- generate accurate Pine Script
- generate accurate Kiwoom condition search formulas
- generate accurate YesTrader formulas
- imply that fake-door conversion features already work

The MVP should:
- structure a user idea into a strategy card
- split the idea into entry, exit, universe, filter, and risk conditions
- save and compare cards
- generate mock educational reports
- show risk warnings
- record conversion demand through honest fake-door UI

## Tech Stack

Use:
- Next.js App Router
- TypeScript
- Tailwind CSS
- Route Handlers under app/api
- localStorage for MVP persistence
- deterministic mock functions for AI parsing and mock backtest

Do not add a database unless explicitly requested.
Do not add real payment unless explicitly requested.
Do not add real trading API integration unless explicitly requested.

## Commands

Run the following before finishing a task:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

If a command fails, fix the issue and rerun it.

## UI Language

The UI must be Korean-first.

Recommended copy:

- “말하면 전략 카드가 된다, 식톡”
- “조건식 몰라도 괜찮습니다.”
- “말로 적으면 AI가 진입·청산·종목·필터 조건으로 나눠줍니다.”
- “현재는 전략 이해용 모의검증이며 실제 투자 추천이 아닙니다.”
- “이 기능은 현재 베타 수요를 확인 중입니다.”

Avoid copy:

- “수익 나는 전략”
- “급등 보장”
- “매수 추천”
- “자동매매까지 됩니다”
- “정확한 조건식 생성”
- “수익 확정”

## File Organization

Use this structure:

```text
src/app
src/components
src/lib
src/tests
```

Important files:

- `src/lib/types.ts`
- `src/lib/strategy-parser.ts`
- `src/lib/mock-backtest.ts`
- `src/lib/mock-improver.ts`
- `src/lib/oracle.ts`
- `src/lib/storage.ts`
- `src/lib/analytics.ts`
- `src/components/strategy/*`
- `src/components/report/*`
- `src/components/conversion/*`
- `src/app/api/*/route.ts`

## Development Style

- Prefer simple, readable code over clever abstractions.
- Keep types explicit.
- Keep client components small.
- Use server routes for mock API boundaries.
- Use deterministic mock data so demos are reproducible.
- Handle empty states and invalid input.
- Do not hide the fact that reports and conversions are mock/beta.
- Make the app usable on mobile.

## Done Criteria

A task is done only when:

- the feature works in the browser
- TypeScript passes
- lint passes
- build passes
- fake-door UI is honest
- investment-risk disclaimer is visible where relevant

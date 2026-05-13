---
project_name: 'cut-stack'
user_name: 'Yury_Aniskou'
date: '2026-05-12'
sections_completed:
  [
    'technology_stack',
    'language_rules',
    'framework_rules',
    'testing_rules',
    'quality_rules',
    'workflow_rules',
    'anti_patterns',
  ]
status: 'complete'
rule_count: 45
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **Монорепо:** pnpm `9.0.0`, Turborepo `2.9.12`, Node.js `>=18`
- **Язык:** TypeScript `5.9.2` (корень); в `apps/clients/web` — `^5`
- **Web:** Next.js `16.2.6`, React `19.2.4`, App Router в `apps/clients/web/src/app/`
- **Стили:** Tailwind CSS `^4`, PostCSS через `@tailwindcss/postcss`
- **React Compiler:** включён в `apps/clients/web/next.config.ts`
- **Линтинг:** ESLint `^9`, `eslint-config-next` `16.2.6`
- **Форматирование:** Prettier `^3.7.4`
- **Общие пакеты:** `@repo/ui`, `@repo/eslint-config`, `@repo/typescript-config`
- **Workspace:** `apps/*`, `apps/clients/*`, `apps/services/*`, `packages/*`
- **Скрипты:** `pnpm dev|build|lint|check-types` через Turbo; форматирование — `prettier --write "**/*.{ts,tsx,md}"`
- **Архитектурного `architecture.md` нет** — версии и ограничения брать из `package.json` и конфигов пакетов

## Critical Implementation Rules

### Language-Specific Rules

- **TypeScript:** в `apps/clients/web` — `strict: true`, `moduleResolution: "bundler"`, `jsx: "react-jsx"`, `noEmit: true`; в `@repo/typescript-config/base.json` — `noUncheckedIndexedAccess: true`, `moduleResolution: "NodeNext"`. Не смешивать настройки между app и shared packages.
- **Импорты:** в Next app — alias `@/*` → `apps/clients/web/src/*`; типы из `next` — `import type`; страницы и layout — `default export`.
- **Shared UI:** `@repo/ui` — named exports; интерактивные компоненты — `"use client"`; `tsconfig` extends `@repo/typescript-config/react-library.json`.
- **Props:** для React children/props — `Readonly<{...}>` или явные интерфейсы; не ослаблять `strict` локальными `any`.
- **ESM:** `packages/eslint-config` — `"type": "module"`; конфиги ESLint — `.mjs` / ESM `export default`.
- **Ошибки:** явных project-wide паттернов error handling нет; не вводить глобальные обёртки без согласования.

### Framework-Specific Rules

- **Next.js App Router:** маршруты только в `apps/clients/web/src/app/`; `layout.tsx` — корневой layout, `metadata` и глобальные стили; страницы — `page.tsx` с `default export`.
- **Server vs Client:** по умолчанию Server Components; `"use client"` — только для интерактива и browser API; не помечать layout/page client без необходимости.
- **React 19 + Compiler:** `reactCompiler: true` в `next.config.ts`; не дублировать ручным `memo`/`useMemo`/`useCallback` без измеримой причины.
- **Стили:** Tailwind v4 через `@import "tailwindcss"` в `globals.css`; токены — `@theme inline` и CSS variables; шрифты Geist — `next/font/google` в layout, не подключать отдельным `<link>`.
- **Изображения и ссылки:** статика — `next/image`; внешние ссылки — `rel="noopener noreferrer"` и `target="_blank"` по образцу `page.tsx`.
- **Shared UI:** импорт из `@repo/ui` по workspace exports (`@repo/ui/button` и т.п.); не копировать компоненты в app без причины.
- **Состояние:** глобального state manager нет; локальный state и server data — по мере появления фич, без лишних библиотек в v1.
- **Домен продукта:** цикл «габариты → 3D → детали → guillotine-раскрой → фурнитура»; не размазывать логику цеха по разрозненным UI-слоям.

### Testing Rules

- **Сейчас:** в репозитории нет `*.test.*` / `*.spec.*`, Vitest/Jest/Playwright и `test` в Turbo не настроены.
- **Новые тесты:** не добавлять runner и первый suite в одном PR без явного выбора стека и согласования с монорепо.
- **Граница:** unit — чистая логика (раскрой, размеры, фурнитура); интеграция — app routes и UI; e2e — только после базового runner.
- **Имена и место:** рядом с модулем или в `__tests__` внутри пакета; не смешивать стили в одном PR.
- **Моки:** минимально; не мокать Next/React без причины; не ослаблять `strict` в тестах.
- **Покрытие:** порогов нет; для доменной логики — кейсы на kerf, trim, grain lock и допуски из PRD.
- **CI:** пока опираться на `lint` и `check-types`; тестовый gate — после появления `test` в Turbo.

### Code Quality & Style Rules

- **ESLint:** flat config; web — `eslint-config-next` (core-web-vitals + typescript); `@repo/ui` — `eslint . --max-warnings 0`.
- **Prettier:** корневой `format` для `**/*.{ts,tsx,md}`; отдельного `.prettierrc` нет — не вводить второй стиль без согласования.
- **Typecheck:** `check-types` через Turbo с `dependsOn: ["^check-types"]`; в shared packages — `tsc --noEmit`.
- **Структура:** app UI в `apps/clients/web/src/`; переиспользуемое — `packages/ui/src/`; конфиги — `packages/eslint-config`, `packages/typescript-config`.
- **Имена:** kebab-case файлов в `@repo/ui`; React-компоненты — PascalCase; app routes — `page.tsx`, `layout.tsx`, `globals.css`.
- **Комментарии:** без лишних пояснений к очевидному коду; доменные допуски (kerf, trim, кромка) — в типах/константах или PRD, не в UI-строках.
- **Зависимости:** workspace `workspace:*` для внутренних пакетов; новые runtime deps — в `package.json` нужного пакета, не только в корень.

### Development Workflow Rules

- **Пакетный менеджер:** только `pnpm` (`packageManager: pnpm@9.0.0`); задачи монорепо — через Turbo, не обходить скрипты пакетов.
- **Локальный цикл:** `pnpm dev` / `pnpm build` / `pnpm lint` / `pnpm check-types` из корня; точечно — `pnpm exec turbo <task> --filter=<package>`.
- **Кэш Turbo:** `build` зависит от `^build`; `dev` без кэша; учитывать `.env*` в inputs build.
- **Артефакты планирования:** PRD, brief, research — в `_bmad-output/planning-artifacts/`; не смешивать с runtime-кодом без явной связи.
- **Git/CI:** в репозитории нет `.github/workflows` и формализованных правил веток/коммитов — не выдумывать policy; при добавлении CI сначала `lint` + `check-types`.
- **Деплой:** web на Next.js 16; remote cache Turbo/Vercel — опционально, не обязателен для локальной разработки.
- **Объём изменений:** правки в границах задачи; без drive-by рефакторинга и лишних markdown вне запроса.

### Critical Don't-Miss Rules

- **Не путать слои размеров:** чистовая деталь, заготовка под кромку, рабочая зона листа (trim, kerf) — разные величины; не сводить к одному «габариту на экране».
- **Guillotine под ручную пилу:** раскладка должна оставаться исполнимой на станке; оптимизация yield не важнее исполнимости карты.
- **Grain lock и декор:** ориентация текстуры влияет на раскладку; не игнорировать при поворотах и экспорте CSV/PDF.
- **Ручная правка карты:** ожидаемый сценарий, не ошибка алгоритма; UI и модель данных должны это допускать.
- **Границы v1:** без кухонь, ERP, ЧПУ, облачного SaaS, внешних интеграций (БАЗИС, 1С) — не протягивать в код «на будущее».
- **Критерий успеха:** «золотой тест с рулеткой» и эталонные корпуса (шкаф, тумба, L-гардеробная) важнее красоты 3D или процента отходов.
- **Фурнитура v1:** только согласованные сценарии и семейства; не раздувать до полного каталога петель и направляющих.
- **Монорепо:** не класть доменную логику цеха в `apps/clients/web` без выделения в пакет/модуль, если она переиспользуется или тестируется отдельно.
- **Безопасность:** пока нет auth и multi-tenant; не добавлять учётные записи и серверное хранение проектов без явного scope.
- **Производительность:** тяжёлый 3D и пересчёт раскроя не блокировать UI; длинные расчёты — отдельно от рендера, с явной стратегией.

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge

**For Humans:**

- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-05-12

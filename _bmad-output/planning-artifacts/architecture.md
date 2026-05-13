---
stepsCompleted:
  - step-01-init
  - step-02-context
  - step-03-starter
  - step-04-decisions
  - step-05-patterns
  - step-06-structure
  - step-07-validation
  - step-08-complete
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/product-brief-cut-stack.md
  - _bmad-output/planning-artifacts/mvp-scope-v1.md
  - _bmad-output/planning-artifacts/research/domain-raskroi-dsp-mdf-ruchnoi-research-2026-05-12.md
  - _bmad-output/project-context.md
workflowType: architecture
lastStep: 8
status: complete
completedAt: '2026-05-13'
project_name: cut-stack
user_name: Yury_Aniskou
date: '2026-05-12'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

Документация задаёт 30 FR в семи продуктовых контурах, которые напрямую мапятся на архитектурные границы:

- **Профиль мастерской и проекты (FR1–FR3):** отдельный слой настроек (пресеты листов, kerf, trim, зазоры фасада) и жизненный цикл проектов (создание, открытие, сохранение, копирование) с применением профиля к новому проекту без повторного ввода базовых параметров.
- **Конструирование корпусов (FR4–FR8):** параметрические модели типовых изделий (шкаф, тумба, линейная и L-гардеробная под 90°) и назначение фасадов только на выбранные секции; требуется единая модель композиции модулей, а не набор несвязанных экранов.
- **Детали и припуски (FR9–FR12):** двухслойная модель размеров (чистовая деталь vs заготовка под кромку), кромка 0,4/2 мм, толщина из пресета материала, grain lock при раскладке; доменная логика должна быть централизована и переиспользуема, не размазана по UI.
- **Раскрой (FR13–FR17):** guillotine под ручную пилу, выбор формата листа из пресетов v1, 2–3 варианта или повторный прогон, ручная правка с сохранением исполнимости, привязка каждой детали к листу и позиции.
- **Фурнитура (FR18–FR22):** ограниченные сценарии v1 (накладные петли, один выдвижной ящик, перечень без полного каталога) с расчётом количества и отверстий по шаблонам семейств.
- **3D-проверка (FR23–FR25):** интерактивный просмотр сборки, проёма, зазоров, стыков и зон фурнитуры без фотореализма; отдельный интерактивный контур от табличной деталировки и 2D-карты.
- **Экспорт и цеховой пакет (FR26–FR29):** CSV v1 и PDF с явным разделением слоя «на пилу» vs чистовых обозначений и дисклеймером об ответственности производителя.
- **Границы v1 (FR30):** основной цикл не зависит от CAD, ERP, ЧПУ и учётных систем.

Эпики и user stories в входных артефактах не загружены; опора — PRD, product brief, `mvp-scope-v1.md`, domain research и `project-context.md`.

**Non-Functional Requirements:**

- **Performance:** отзывчивый UI на эталонных проектах; пересчёт guillotine с индикатором прогресса без длительной блокировки основного потока; интерактивный 3D без заметных фризов на целевом desktop-браузере.
- **Security:** в v1 нет multi-tenant и обязательной аутентификации; проекты не публикуются по умолчанию; при сетевом хранении — TLS; ПДн заказчиков не собираются без явного scope; экспорт без скрытых служебных полей вне схемы v1.
- **Reliability:** восстановление сохранённых проектов и профиля мастерской после перезапуска; сбой пересчёта раскроя не повреждает проект, допускается повтор или откат к последнему сохранённому состоянию карты.
- **Accessibility:** читаемые формы и подписи на desktop; контраст карты в PDF для цеха; полный WCAG AA для маркетинга не цель v1.
- **Integration:** внешние интеграции не обязательны; CSV v1 стабильна по полям между минорными релизами v1 с явным версионированием схемы.

**Scale & Complexity:**

- **Primary domain:** full-stack web-приложение (Next.js App Router, монорепо pnpm/Turbo), brownfield.
- **Complexity level:** medium — один пользователь, без SaaS и внешних интеграций, но с доменно насыщенным ядром (размеры, раскрой, фурнитура, 3D, экспорт).
- **Estimated architectural components:** профиль мастерской; проекты и персистентность; параметрические корпуса и композиция модулей; деталировка и двухслойные размеры; движок guillotine-раскроя и ручная правка карты; шаблоны фурнитуры; 3D-сборка; экспорт CSV/PDF; справочники материалов и пресетов листов; слой оркестрации UI и фоновых расчётов.

### Technical Constraints & Dependencies

- **Стек и репозиторий:** TypeScript, Next.js 16, React 19, Tailwind v4, React Compiler; workspace `apps/*`, `packages/*`; доменная логика — в переиспользуемых пакетах, UI — в `apps/clients/web`.
- **Рендеринг и клиент:** Server Components по умолчанию; client — 3D, интерактив раскроя, правка карты; desktop-first (Chromium, Safari, Firefox); мобильный браузер у пилы не целевой для v1.
- **Данные v1:** локально или простое хранилище без multi-tenant; auth не в MVP; при облаке — 152-ФЗ и минимизация ПДн.
- **Доменные ограничения:** guillotine-first; free-cut, DXF, ЧПУ, склад, ERP, кухни, углы ≠ 90° — вне v1; ручная правка карты — штатный сценарий.
- **Качество и тесты:** `lint` и `check-types` обязательны; runner тестов пока не зафиксирован; доменные unit-тесты — на kerf, trim, grain lock и допуски по мере появления runner.
- **Критерий приёмки:** «золотой тест с рулеткой» и эталонные корпуса важнее yield и визуальной полировки 3D.

### Cross-Cutting Concerns Identified

- **Двухслойная и трёхконтурная модель размеров:** чистовая деталь, заготовка под кромку, рабочая зона листа (trim, kerf) — единые правила во всех модулях и в экспорте.
- **Исполнимость guillotine и human-in-the-loop:** автоматическая раскладка, варианты, ручная правка и валидация «невозможных» резов.
- **Grain lock и ориентация декора:** влияние на раскладку, UI и CSV/PDF.
- **Персистентность и целостность:** профиль мастерской, проекты, состояние карты раскроя; отказоустойчивость пересчёта.
- **Производительность и изоляция нагрузки:** 3D и nesting не блокируют UI; тяжёлые расчёты — фоном или отдельным job.
- **Экспорт и версионирование схем:** стабильная CSV v1, PDF для цеха, дисклеймеры, разделение слоёв размеров в выводе.
- **Регуляторика и ответственность:** ГОСТ на справочник листов и допуски; UX карты под 835н; ТР ТС 025 на изделие, не на калькулятор.
- **Границы v1 и анти-паттерны:** не протягивать ERP, auth, multi-tenant и внешние интеграции «на будущее» без явного scope.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack **web_app** на TypeScript: desktop-first Next.js (App Router) с доменными пакетами в монорепо. PRD и `project-context.md` задают brownfield-контекст — опора на существующий репозиторий, а не на новый scaffold.

### Starter Options Considered

| Вариант | Назначение | Почему не «чистый» выбор для cut-stack |
|---------|------------|----------------------------------------|
| `create-next-app@latest` | Один Next.js 16 (TS, Tailwind, ESLint, App Router, Turbopack) | Нет workspace для доменной логики, `@repo/ui` и будущих `apps/services/*` |
| `pnpm dlx create-turbo@latest` | Turborepo + pnpm, несколько apps и shared packages | Совпадает с формой репозитория; пересоздание с нуля не нужно |
| T3 / Nest-only стартеры | Auth, API, ORM из коробки | Auth, multi-tenant и внешние интеграции вне v1 |

UX-спека не загружена; для 3D, 2D-карты и форм параметров достаточно текущего Next + client islands, без отдельного UI-старта.

### Selected Starter: существующий монорепозиторий cut-stack (Turborepo + pnpm + Next.js)

**Rationale for Selection:**

Репозиторий уже инициализирован под PRD: pnpm workspaces (`apps/*`, `apps/clients/*`, `apps/services/*`, `packages/*`), Turbo-скрипты `dev` / `build` / `lint` / `check-types`, web-клиент в `apps/clients/web`, shared UI и конфиги в `packages/`. Соответствует правилу выносить домен из UI. Новый `create-next-app` или `create-turbo` не даёт выигрыша и ломает brownfield.

**Эквивалентная инициализация (для справки, не для пересоздания):**

```bash
pnpm dlx create-turbo@latest
# затем Next.js app в apps/clients/web (App Router, TypeScript, Tailwind, ESLint)
```

**Фактическая точка входа для разработки:**

```bash
pnpm install
pnpm dev
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:** TypeScript (корень 5.9.2; в web — ^5); Node `>=18` в `engines` (для Next.js 16 в официальном upgrade guide ориентир Node 20.9+ — при CI/проде сверить с [Upgrading to Version 16](https://nextjs.org/docs/app/guides/upgrading/version-16)).

**Styling Solution:** Tailwind CSS v4 через `@tailwindcss/postcss`; токены в `globals.css`.

**Build Tooling:** Turborepo 2.9.12; `next dev` / `next build` в web; React Compiler в `next.config.ts`.

**Testing Framework:** в стартере не зафиксирован; runner и первый suite — отдельное согласование (см. project context).

**Code Organization:** UI в `apps/clients/web/src/`; переиспользуемое в `packages/`; маршруты App Router в `src/app/`.

**Development Experience:** Prettier на `**/*.{ts,tsx,md}`; ESLint flat config + `eslint-config-next`; alias `@/*` в web.

**Note:** первая implementation story — не «создать проект из CLI», а расширить текущий монорепо (доменные пакеты, персистентность, 3D/раскрой) в существующих границах workspace.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

- Персистентность v1 в браузере с версионируемой схемой сущностей (профиль мастерской, проект, снимок карты раскроя).
- Граница домена: расчёты и правила размеров/раскроя — в `packages/*`; UI и оркестрация — в `apps/clients/web`.
- Экспорт: стабильная **CSV v1** и **PDF** с явным слоем «на пилу»; дисклеймер в выводе.

**Important Decisions (Shape Architecture):**

- Коммуникация слоёв: Server Actions и/или прямые импорты доменных пакетов; Route Handlers — точечно (например PDF).
- Изоляция тяжёлого nesting от UI: Web Worker или отложенный batch с индикатором прогресса (конкретный механизм — в story, принцип зафиксирован).
- Согласование **Node.js ≥ 20.9** с требованиями Next.js 16 при CI/проде; обновить корневой `engines` при первом пайплайне.

**Deferred Decisions (Post-MVP):**

- Облачное хранилище, учётные записи, 152-ФЗ, multi-tenant.
- Отдельный backend-сервис (Nest и т.п.), публичный REST/GraphQL, внешние интеграции (CAD, ERP, ЧПУ).
- Склад остатков, этикетки, планшет у пилы, e2e-раннер — после явного scope.

### Data Architecture

- **Хранилище v1:** браузер, **IndexedDB** (или тонкая обёртка) как основной контур для проектов и профиля мастерской; явное поле версии схемы документа и миграции read/write.
- **Моделирование:** типизированные DTO/доменные типы в пакете (например `packages/cut-stack-domain` или эквивалент по согласованию имени); UI не дублирует бизнес-инварианты без типов из домена.
- **Валидация:** на границе загрузки из хранилища и на границе пользовательского ввода; несовместимая версия — явный путь миграции или «создать проект заново», без тихой порчи данных.
- **Кэширование:** без распределённого кэша в v1; допускается in-memory кэш в рамках сессии для последнего результата nesting при неизменных входах.

### Authentication & Security

- **Аутентификация:** не требуется в v1; не проектировать обязательный login в модели данных.
- **Авторизация:** не применима (один пользователь, локальные данные).
- **Сеть:** при появлении sync/API — только TLS; минимизация полей ПДн заказчиков до отдельного scope.
- **Экспорт:** CSV/PDF только по согласованной схеме v1; без скрытых служебных колонок.

### API & Communication Patterns

- **Стиль:** нет публичного API в v1; внутренние вызовы — TypeScript-модули и при необходимости **Server Actions** для серверной части.
- **Route Handlers (`app/api/...`):** по необходимости (например генерация PDF на сервере, если браузерный путь недостаточен); без версионирования публичного REST.
- **Ошибки:** типизированные результаты (`Result` / discriminated union) в домене; на UI — явное отображение сбоя пересчёта без порчи сохранённого проекта (см. PRD NFR Reliability).

### Frontend Architecture

- **Рендеринг:** Server Components по умолчанию; `"use client"` для Three.js/канваса раскроя, DnD правки карты, индикаторов прогресса.
- **Состояние:** локальный React state и/или небольшие контексты у feature; без глобального Redux в v1.
- **Маршрутизация:** App Router в `apps/clients/web/src/app/`.
- **Производительность:** не блокировать главный поток длительным nesting; 3D — отдельные client-модули с умеренной нагрузкой на эталонных сценах PRD.

### Infrastructure & Deployment

- **Локальная разработка:** `pnpm dev` из корня; задачи через Turbo.
- **CI/CD:** при появлении — минимум `pnpm lint` и `pnpm check-types`; тестовый gate после выбора runner.
- **Node:** для Next.js 16 ориентир **Node ≥ 20.9** ([upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16)); выровнять `engines` в корневом `package.json` при введении CI или деплоя.
- **Хостинг v1:** не обязателен; при статическом/edge-хостинге учитывать ограничения IndexedDB (тот же origin).

### Decision Impact Analysis

**Implementation Sequence:**

1. Доменные типы и правила (размеры, лист, kerf/trim, grain).
2. Персистентность и жизненный цикл проекта/профиля.
3. Движок guillotine, варианты раскладки, ручная правка и валидация исполнимости.
4. Экспорт CSV v1 и PDF + дисклеймер.
5. 3D-сборка для проверки геометрии.
6. Шаблоны фурнитуры v1.

**Cross-Component Dependencies:**

- Экспорт и UI зависят от единой доменной модели размеров (чистовой / заготовка / «на пилу»).
- Карта раскроя и деталировка должны ссылаться на одни и те же идентификаторы деталей и листов.
- Персистентность должна сохранять промежуточные снимки карты для отката при сбое пересчёта (политика «последнее известное хорошее состояние» — в story).

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** зоны, где разные агенты могут разойтись без явных правил — имена пакетов и файлов, граница домен/UI, формат CSV v1, идентификаторы деталей и листов, обработка ошибок пересчёта, размещение тестов и граница Server/Client.

### Naming Patterns

**Database Naming Conventions:** в v1 нет серверной БД; при появлении PostgreSQL и т.п. — **snake_case** для таблиц и колонок в SQL, **camelCase** в TypeScript-слое доступа, явные FK `..._id`.

**API Naming Conventions:** внутренние Route Handlers — **kebab-case** сегментов пути (`/api/export/pdf`), без версии в URL до публичного API; query — **snake_case** для стабильности с CSV.

**Code Naming Conventions:** как в project context: в `@repo/ui` файлы **kebab-case**, React-компоненты **PascalCase**; в app routes — `page.tsx`, `layout.tsx`; функции и переменные **camelCase**; доменные типы **PascalCase**; константы домена **SCREAMING_SNAKE** только для физических констант (kerf по умолчанию и т.д.) — иначе **camelCase** объекты-конфиги.

### Structure Patterns

**Project Organization:** новый домен — в `packages/<name>/src/` с `package.json` и полем `exports`; UI-фичи — под `apps/clients/web/src/app/` (маршруты) и при необходимости `apps/clients/web/src/components/` или feature-папках **kebab-case**; не класть расчёт раскроя в `components` без вызова из `packages`.

**File Structure Patterns:** конфиги пакетов в корне пакета; общие eslint/ts — только в `packages/eslint-config`, `packages/typescript-config`; артефакты BMad — только в `_bmad-output/`, не в runtime-коде.

**Tests:** по согласованию runner — **рядом с модулем** `*.test.ts` или `__tests__/` внутри пакета; не смешивать в одном PR новый runner и большой рефакторинг.

### Format Patterns

**API Response Formats:** для внутренних Route Handlers — JSON с **camelCase** полями; ошибки — `{ "error": { "code": string, "message": string } }` без утечки стека в прод (когда появится прод).

**Data Exchange Formats:** **CSV v1** — заголовки и имена колонок в **snake_case**, разделитель и десятичный формат зафиксировать в спецификации экспорта (отдельный документ или раздел PRD); внутренние JSON-снимки проекта — **camelCase** для совместимости с TypeScript.

### Communication Patterns

**Event System Patterns:** без глобального event-bus в v1; для UI — колбэки и props; для длительного nesting — **Async** + явный статус в state (`idle` | `running` | `success` | `error`).

**State Management Patterns:** иммутабельные обновления; не мутировать объекты домена после отдачи из пакета; крупные структуры — обновление через чистые функции или структурное копирование точечных полей.

### Process Patterns

**Error Handling Patterns:** домен возвращает **Result** / tagged union; UI показывает сообщение и не перезаписывает сохранённый проект при ошибке пересчёта; логирование в консоль только в dev, без PII в логах.

**Loading State Patterns:** локальные флаги `is…Pending` у виджета пересчёта/экспорта; без глобального спиннера на всё приложение в v1.

### Enforcement Guidelines

**All AI Agents MUST:**

- Импортировать доменные правила из `packages/*`, а не дублировать формулы kerf/trim/кромки в UI.
- Соблюдать границу Server vs Client из `project-context.md`.
- Помечать колонки и слои размеров в экспорте так, как зафиксировано в CSV v1 и PRD.
- Не добавлять auth, multi-tenant и внешние интеграции без явного изменения architecture/PRD.

**Pattern Enforcement:** `pnpm lint` и `pnpm check-types` в CI; при появлении тестов — обязательный прогон в PR; несоответствие имени пакета/экспорта — правка в PR review.

### Pattern Examples

**Good Examples:** `packages/cut-stack-nesting/src/guillotine.ts` экспортирует чистую функцию; `CutLayoutView` в client-компоненте вызывает её через worker/async; CSV-заголовок `blank_length_mm`, `edge_tape_mm`.

**Anti-Patterns:** дублирование расчёта заготовки под кромку в `page.tsx`; хранение «сырых» размеров без связи с `projectId`/`partId`; silent catch без отката состояния карты.

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
cut-stack/
├── README.md
├── LICENSE
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── turbo.json
├── .npmrc
├── .gitignore
├── apps/
│   ├── clients/
│   │   └── web/
│   │       ├── package.json
│   │       ├── next.config.ts
│   │       ├── tsconfig.json
│   │       ├── eslint.config.mjs
│   │       ├── postcss.config.mjs
│   │       ├── public/
│   │       └── src/
│   │           └── app/
│   │               ├── layout.tsx
│   │               ├── page.tsx
│   │               ├── globals.css
│   │               └── favicon.ico
│   └── services/
│       └── (пусто или будущие сервисы — не обязательны для v1)
├── packages/
│   ├── eslint-config/
│   ├── typescript-config/
│   ├── ui/
│   │   └── src/
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       └── code.tsx
│   ├── cut-stack-domain/          # план: типы, размеры, лист, кромка, grain
│   │   └── src/
│   ├── cut-stack-nesting/         # план: guillotine, варианты, валидация
│   │   └── src/
│   ├── cut-stack-hardware/        # план: шаблоны петель/направляющих v1
│   │   └── src/
│   ├── cut-stack-persistence/     # план: IndexedDB, миграции схемы
│   │   └── src/
│   └── cut-stack-export/          # план: CSV v1, PDF, дисклеймер
│       └── src/
├── _bmad-output/
│   ├── planning-artifacts/
│   └── project-context.md
└── .cursor/                         # скиллы IDE; не runtime
```

Не считать частью целевой структуры для агентов: `node_modules/`, `apps/clients/web/.next/`, кэши Turbo.

### Architectural Boundaries

**API Boundaries:** публичного REST в v1 нет; опционально `apps/clients/web/src/app/api/**/route.ts` для точечных задач (например PDF). Вызов домена из UI — через импорт `workspace:*` пакетов и при необходимости Server Actions в `src/app/`.

**Component Boundaries:** Server Components в `page.tsx` / `layout.tsx`; client-острова для 3D, 2D-карты раскроя, DnD и прогресса — отдельные файлы с `"use client"`; презентация без дублирования формул из `cut-stack-domain`.

**Service Boundaries:** `apps/services/*` зарезервировано в workspace; в v1 логика остаётся в `packages/*` и web без обязательного отдельного процесса.

**Data Boundaries:** единый слой доступа к сохранённым проектам — `cut-stack-persistence` (или согласованное имя) поверх IndexedDB; UI не разбрасывает прямые вызовы IndexedDB по множеству модулей.

### Requirements to Structure Mapping

| Контур FR | Каталоги / пакеты |
|-----------|-------------------|
| Профиль и проекты (FR1–FR3) | `cut-stack-persistence`; маршруты `src/app/.../projects/` (по согласованию URL); формы — client по необходимости |
| Корпуса (FR4–FR8) | `cut-stack-domain`; UI в `src/app/...` |
| Детали и припуски (FR9–FR12) | `cut-stack-domain` |
| Раскрой (FR13–FR17) | `cut-stack-nesting`; превью карты в `src/components/...` (kebab-case папок) |
| Фурнитура (FR18–FR22) | `cut-stack-hardware` |
| 3D (FR23–FR25) | client-компоненты под `src/components/...`; геометрия и инварианты из домена |
| Экспорт (FR26–FR29) | `cut-stack-export`; опционально `src/app/api/export/` |
| Границы v1 (FR30) | без внешних сервисов в `apps/services` до смены scope |

**Cross-cutting:** `@repo/ui` — атомарные контролы; доменные типы не «вытекают» из UI как источник правды без re-export из пакета.

### Integration Points

**Internal communication:** web → `workspace:*` пакеты; пакеты не импортируют `next/*` из слоя UI; тяжёлый nesting — async/worker из client-модуля с типами из `cut-stack-nesting`.

**External integrations:** нет в v1 (PRD).

**Data flow:** ввод → валидация на границе → доменное состояние в памяти → персистентность (версия схемы) → экспорт.

### File Organization Patterns

**Configuration:** корень — Turbo, Prettier; в web — `next.config.ts`, ESLint; в пакетах — `tsconfig`, `exports` в `package.json`.

**Source:** домен только в `packages/cut-stack-*/src/`; маршруты — только в `apps/clients/web/src/app/`.

**Tests:** `*.test.ts` рядом с модулем в пакете после выбора runner.

**Assets:** `apps/clients/web/public/` для статики приложения; не смешивать с пользовательским выводом CSV/PDF.

### Development Workflow Integration

**Dev:** `pnpm dev` из корня (Turbo).

**Build:** `pnpm build`; web — `next build`.

**Deploy:** вне обязательного scope v1; при деплое — тот же origin для IndexedDB и Node ≥ 20.9 для Next.js 16.

Имена пакетов `cut-stack-*` — рабочие; при первой story допускается иное дерево при условии явного обновления этого раздела.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** Стек согласован: Next.js 16 + React 19 + TypeScript + pnpm + Turborepo + Tailwind v4 + React Compiler — без противоречий с паттернами и структурой. Персистентность в браузере не конфликтует с отсутствием auth в v1. Тяжёлый nesting вынесен от UI принципиально, что согласуется с NFR Performance.

**Pattern Consistency:** Именование (camelCase в TS/JSON, snake_case в CSV, kebab-case путей UI) согласовано с границами пакетов и экспортом. Структура `packages/cut-stack-*` поддерживает решение «домен вне UI».

**Structure Alignment:** Дерево отражает текущий brownfield и целевые пакеты; границы API, данных и компонентов соответствуют разделу решений.

### Requirements Coverage Validation ✅

**Epic/Feature Coverage:** Эпики не загружались — покрытие через FR.

**Functional Requirements Coverage:** FR1–FR30 покрыты сопоставлением в «Requirements to Structure Mapping» и решениями по домену, nesting, hardware, export, persistence и client 3D. Граница FR30 (без внешних интеграций) зафиксирована в решениях и паттернах.

**Non-Functional Requirements Coverage:** Performance (фоновый nesting, client 3D), Security (нет auth, TLS при sync), Reliability (откат пересчёта, персистентность), Accessibility (базовый уровень), стабильность CSV v1 — отражены в Core Decisions и Patterns.

### Implementation Readiness Validation ✅

**Decision Completeness:** Критические решения задокументированы; версии стека указаны в разделе стартера; Node ≥ 20.9 для Next.js 16 вынесен как действие при CI/проде.

**Structure Completeness:** Текущие пути репозитория и планируемые пакеты заданы явно; интеграционные точки описаны.

**Pattern Completeness:** Конфликтные зоны (имена, форматы, ошибки, loading) покрыты примерами и anti-patterns.

### Gap Analysis Results

**Critical Gaps:** нет — отсутствие кода в `packages/cut-stack-*` ожидаемо на этапе архитектуры; первые stories — scaffold пакетов и границы импорта.

**Important Gaps:** (1) Выровнять `engines.node` в корневом `package.json` с Next.js 16 (≥ 20.9) при появлении CI/деплоя. (2) Оформить отдельную спецификацию полей **CSV v1** (таблица колонок, разделитель, десятичный формат) и приложить ссылку из `cut-stack-export`. (3) Зафиксировать выбор **Web Worker vs main-thread async** для nesting в первой story перфоманса.

**Nice-to-Have Gaps:** Storybook для `@repo/ui`; шаблон `.github/workflows` под lint/types.

### Validation Issues Addressed

Явных противоречий между PRD и архитектурой не выявлено. Риск «домен в UI» снижен паттернами и структурой.

### Architecture Completeness Checklist

**Requirements Analysis**

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**

- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**

- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**

- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION — критических пробелов нет, чеклист закрыт; пункты из Important Gaps не блокируют старт кодирования, если их взять в первые задачи.

**Confidence Level:** high

**Key Strengths:** узкий v1, явные границы домен/UI, guillotine-first, human-in-the-loop, экспорт и персистентность заложены в структуру пакетов.

**Areas for Future Enhancement:** backend/sync, CI, расширение тестов после выбора runner.

### Implementation Handoff

**AI Agent Guidelines:**

- Следовать этому документу и `_bmad-output/project-context.md` при любых спорных решениях.
- Соблюдать паттерны именования и форматов; не дублировать домен в UI.
- Уважать границы пакетов и Server/Client.

**First Implementation Priority:** создать каркас `packages/cut-stack-domain` (или согласованное имя) с публичными типами и инвариантами размеров/листа; затем `cut-stack-persistence` с версией схемы и миграцией; не менять корневой scaffold без обновления этого документа.


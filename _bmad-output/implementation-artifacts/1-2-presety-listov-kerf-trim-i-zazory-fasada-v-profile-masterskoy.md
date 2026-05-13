# Story 1.2: Пресеты листов, kerf, trim и зазоры фасада в профиле мастерской

Status: ready-for-dev

## Story

As a владелец мастерской,
I want задать пресеты листов, kerf, trim и зазоры фасада в форме мастерской,
so that не вводить эти значения заново в каждом заказе.

## Acceptance Criteria

1. **Given** пользователь на экране «Мастерская» (`/workshop`)
   **When** он вводит допустимые значения пресетов листа (форматы из PRD v1: 3500×1750, 2750×1830, 2440×1220 и пользовательский произвольный) и задаёт kerf, trim и зазоры фасада
   **Then** данные валидируются (zod + react-hook-form, onBlur) и сохраняются в IndexedDB с обязательным полем **версии схемы** (`schemaVersion`)

2. **And** после **перезагрузки страницы** (F5 / открытие вкладки заново) введённые значения профиля восстанавливаются без потери ни одного поля (NFR7); несовместимая версия схемы — явный путь миграции или отображение «заполнить заново» без тихой порчи данных

3. **And** единицы измерения «мм» однозначно видны рядом с каждым числовым полем; поля kerf/trim/зазор принимают дробные значения; пресет листа задаётся шириной × высотой в мм

4. **And** форма отображает ошибки валидации под каждым полем (`FormMessage`); при блокирующей ошибке — `Alert` вверху формы (UX-DR13, UX-DR14); disabled кнопка «Сохранить» при наличии ошибок объясняет причину через `Tooltip`

5. **And** доменные типы `WorkshopProfile` и `SheetPreset` с инвариантами (положительные числа, версия схемы) живут в `packages/cut-stack-domain`; персистентность — в `packages/cut-stack-persistence`; UI не дублирует формулы и типы из домена

6. **And** `pnpm lint` и `pnpm check-types` из корня репозитория проходят без ошибок после всех изменений

## Tasks / Subtasks

- [ ] **Создать пакет `cut-stack-domain`** (AC: #5)
  - [ ] Инициализировать `packages/cut-stack-domain/package.json` (workspace:*, exports, tsconfig extends `@repo/typescript-config/base.json`)
  - [ ] Определить `SheetPreset`: `{ id: string; name: string; widthMm: number; heightMm: number }`
  - [ ] Определить `WorkshopProfile`: `{ schemaVersion: number; sheetPresets: SheetPreset[]; kerfMm: number; trimMm: number; facadeGapMm: number }`
  - [ ] Добавить zod-схему `workshopProfileSchema` для валидации ввода (синхронизировать с TypeScript-типом)
  - [ ] Экспортировать из корня пакета через `index.ts`
  - [ ] Добавить пакет в `pnpm-workspace.yaml` / turbo.json при необходимости (проверить текущую конфигурацию)

- [ ] **Создать пакет `cut-stack-persistence`** (AC: #1, #2, #5)
  - [ ] Инициализировать `packages/cut-stack-persistence/package.json` (workspace:*, зависимость от `cut-stack-domain`)
  - [ ] Выбрать минимальную обёртку над IndexedDB: `idb` (npm) или нативный `indexedDB` API — зафиксировать выбор в Dev Agent Record
  - [ ] Реализовать `WorkshopProfileStore`:
    - `saveWorkshopProfile(profile: WorkshopProfile): Promise<void>`
    - `loadWorkshopProfile(): Promise<WorkshopProfile | null>`
    - При загрузке — проверка `schemaVersion`; текущая версия: `1`; несовместимая — возврат `null` + log
  - [ ] SSR-безопасность: не вызывать IndexedDB во время Server-side rendering (guard `typeof window !== 'undefined'`)
  - [ ] Экспортировать из `index.ts`

- [ ] **Форма профиля мастерской** (AC: #1, #3, #4)
  - [ ] Установить `react-hook-form` и `@hookform/resolvers` в `apps/clients/web/package.json` (если не установлены после Story 1.1)
  - [ ] Установить shadcn-компоненты, необходимые для формы: `Form`, `Input`, `Label`, `Button`, `Card`, `Alert`, `Tooltip`, `Separator` (если не добавлены в Story 1.1)
  - [ ] Реализовать `WorkshopProfileForm` — клиентский компонент (`"use client"`) в `apps/clients/web/src/components/cut/workshop-profile-form.tsx`:
    - Поля: **Пресеты листов** (список добавляемых форматов — ширина × высота; встроенные 3500×1750 и 2750×1830 как defaults), **Kerf (мм)**, **Trim (мм)**, **Зазор фасада (мм)**
    - react-hook-form + zod resolver (схема из `cut-stack-domain`)
    - Валидация onBlur; submit — сохранение через `cut-stack-persistence`
    - `FormMessage` под полем; `Alert` при ошибке загрузки
    - Кнопка «Сохранить» primary; disabled с `Tooltip` при наличии ошибок
  - [ ] Подключить `WorkshopProfileForm` в `apps/clients/web/src/app/(app)/workshop/page.tsx` (заменить заглушку из Story 1.1)
  - [ ] Загружать текущий профиль из IndexedDB при монтировании; показать состояние загрузки (skeleton или disabled форма)

- [ ] **Интеграция монорепо** (AC: #5, #6)
  - [ ] Добавить `cut-stack-domain` и `cut-stack-persistence` как зависимости в `apps/clients/web/package.json` (`workspace:*`)
  - [ ] Убедиться, что Turborepo видит новые пакеты (проверить `turbo.json` `pipeline` / `tasks`)
  - [ ] `pnpm install` из корня — пакеты разрешаются без ошибок

- [ ] **Проверка** (AC: #6)
  - [ ] `pnpm lint` и `pnpm check-types` из корня без ошибок
  - [ ] Ручная проверка: заполнить форму → сохранить → F5 → значения восстановлены
  - [ ] Ручная проверка: ввести невалидные данные (отрицательный kerf) → ошибка под полем

## Dev Notes

### Зависимость от Story 1.1

Эта история **требует** завершения Story 1.1: маршрут `/workshop` с файлом `apps/clients/web/src/app/(app)/workshop/page.tsx` (хотя бы заглушка), установленный shadcn, настроенные CSS-переменные и `ProjectAppShell`. Реализовывать 1.2 только после того, как 1.1 в статусе `done` или хотя бы имеются указанные файлы.

### Доменные типы и инварианты

Пакет `packages/cut-stack-domain` — **первый приоритет** по архитектуре (Architecture → Implementation Sequence, п.1 и п.2). Типы `WorkshopProfile` и `SheetPreset` будут использоваться Story 1.3, 1.4 и всеми последующими историями, работающими с профилем.

Критические инварианты:
- `kerfMm`, `trimMm`, `facadeGapMm` — строго положительные (`> 0`), дробные допустимы
- `widthMm`, `heightMm` для `SheetPreset` — строго положительные целые или дробные
- `schemaVersion` — целое число `>= 1`; текущая: `1`
- `sheetPresets` — минимум 1 элемент при сохранении (пользователь должен задать хоть один лист)

Zod-схема **синхронна с TypeScript-типами** — не расходиться между схемой и интерфейсом.

Пресеты листов v1 из PRD (первоначальные defaults):
- 3500 × 1750 мм (основной)
- 2750 × 1830 мм
- 2440 × 1220 мм (ориентир из research)

### Персистентность: IndexedDB и версионирование схемы

Архитектура явно требует **IndexedDB** с версией схемы ([Source: architecture.md — Data Architecture]):
- Поле `schemaVersion: number` в документе профиля обязательно
- На загрузке — проверить версию; если `schemaVersion > 1` или неизвестна — не портить данные, вернуть `null`, показать пользователю «Профиль не совместим — задайте заново»
- Имя базы данных: `cut-stack-db`; store: `workshop-profile`

SSR: Next.js App Router может рендерить компоненты на сервере. `WorkshopProfileStore` **не должен** инициализироваться во время SSR. Guard:
```ts
if (typeof window === 'undefined') return null;
```
Лучший паттерн — lazy-инициализация с `useEffect` в клиентском компоненте.

### Структура файлов (ожидаемый результат)

```text
packages/
  cut-stack-domain/
    package.json              # NEW
    tsconfig.json             # NEW (extends @repo/typescript-config/base.json)
    src/
      index.ts                # NEW: re-export всего публичного
      workshop-profile.ts     # NEW: WorkshopProfile, SheetPreset, workshopProfileSchema (zod)

  cut-stack-persistence/
    package.json              # NEW (зависит от cut-stack-domain)
    tsconfig.json             # NEW
    src/
      index.ts                # NEW: re-export
      workshop-profile-store.ts  # NEW: saveWorkshopProfile, loadWorkshopProfile

apps/clients/web/
  package.json                # UPDATE: + cut-stack-domain, cut-stack-persistence
  src/
    components/
      cut/
        workshop-profile-form.tsx  # NEW: "use client", react-hook-form + zod
    app/
      (app)/
        workshop/
          page.tsx            # UPDATE: заменить заглушку на WorkshopProfileForm
```

### UI/UX: форма профиля мастерской

Из UX-спеки ([Source: ux-design-specification.md — Form Patterns, Component Strategy]):
- **Одна колонка**, группировка через `Card` + заголовки секций («Параметры раскроя», «Пресеты листов»)
- Числовые поля: тип `number` с шагом 0.1 для kerf/trim/зазора; суффикс «мм» в `Label`
- Пресеты листов: возможность добавить произвольный формат (ширина × высота) + удалить; встроенные defaults при пустом хранилище
- **Шрифт для чисел:** Geist Mono (`font-mono`) на полях с мм-значениями (UX-DR11)
- Кнопка «Сохранить» — primary, одна на форму (UX-DR12)
- Toast «Профиль сохранён» после успешного сохранения (UX-DR13 — только для проверяемых действий)

### Границы server/client

Из project-context.md и архитектуры:
- `WorkshopProfileForm` — **`"use client"`** (использует useEffect, useState, react-hook-form)
- `workshop/page.tsx` — по умолчанию Server Component; `WorkshopProfileForm` импортируется как client-island
- Логика IndexedDB — **только в `cut-stack-persistence`**, не инлайнить в компонент

### Типы TypeScript: точные настройки

Из project-context.md:
- `packages/cut-stack-*` — `tsconfig` extends `@repo/typescript-config/base.json`; `noUncheckedIndexedAccess: true`
- В `apps/clients/web` — `moduleResolution: "bundler"`, `strict: true`
- Нет `any` без явного обоснования; `Readonly<...>` для доменных объектов

### Зависимости

Новые пакеты npm (только если нужны):
- `idb` (MIT, ~5 KB, стандартная обёртка IndexedDB) — рекомендован для `cut-stack-persistence`
- `react-hook-form` и `@hookform/resolvers` — в `apps/clients/web/package.json`
- `zod` — в `packages/cut-stack-domain/package.json` (если ещё нет)

Добавлять зависимости в **конкретный** пакет, не в корень репозитория.

### Тестирование

Автотестов в репозитории пока нет (project-context.md — Testing Rules). Достаточно:
- `pnpm lint` и `pnpm check-types` без ошибок
- Ручная проверка сохранения / восстановления после F5
- Ручная проверка валидации onBlur

При появлении runner — кандидаты для unit-тестов: `workshopProfileSchema.parse(...)` с граничными значениями (kerf = 0 → error, kerf = 3.5 → ok).

### Риски

- **Peer dependencies:** `idb` должна быть совместима с TypeScript `moduleResolution: "NodeNext"` в пакетах; проверить поле `exports` пакета `idb` при установке.
- **SSR crash:** IndexedDB в SSR без guard выбросит `ReferenceError`; обязателен `typeof window !== 'undefined'` или динамический импорт.
- **React Compiler:** `reactCompiler: true` в `next.config.ts` — не вводить ручные `memo`/`useMemo` без измеримой причины.

## References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 1, Story 1.2]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Data Architecture, Data Boundaries, Requirements to Structure Mapping, Naming Patterns]
- [Source: `_bmad-output/planning-artifacts/prd.md` — FR1, NFR7, пресеты листов 3500×1750 / 2750×1830 / 2440×1220]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Form Patterns, Component Strategy, Design System Foundation, Feedback Patterns]
- [Source: `_bmad-output/project-context.md` — Technology Stack, Language-Specific Rules, Framework-Specific Rules, Critical Don't-Miss Rules]

## Dev Agent Record

### Agent Model Used

_(заполняется при dev-story)_

### Debug Log References

### Completion Notes List

### File List

_(заполняется при реализации)_

---

_Ultimate context engine analysis completed — comprehensive developer guide created._

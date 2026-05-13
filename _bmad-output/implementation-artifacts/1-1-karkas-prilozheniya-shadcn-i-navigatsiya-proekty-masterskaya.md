# Story 1.1: Каркас приложения, shadcn и навигация «Проекты / Мастерская»

Status: done

## Story

As a владелец мастерской,
I want открыть приложение с понятной навигацией между списком проектов и настройками мастерской,
So that быстро переключаться между заказами и пресетами без потери контекста.

## Acceptance Criteria

1. **Given** пустой или частично инициализированный клиент в `apps/clients/web`  
   **When** пользователь открывает приложение (корневой маршрут или явный вход в рабочую зону)  
   **Then** отображается компонент **`ProjectAppShell`**: боковая навигация с пунктами **«Проекты»** и **«Мастерская»**, слот основного контента; поведение согласовано с **UX-DR5** и визуальным **направлением 1** из UX-спеки (спокойный «цеховой» desktop, без шаблона create-next-app как главного UX).

2. **And** в `apps/clients/web` инициализирован **shadcn/ui** (UX-DR1): CLI в корне web-приложения, компоненты в согласованном пути (по умолчанию `src/components/ui`); добавлен **минимальный набор** примитивов, достаточный для shell и дальнейших историй: как минимум `Button`, `Sheet`, `Separator`; при необходимости для sidebar — `ScrollArea`.

3. **And** **CSS variables** shadcn (`--background`, `--foreground`, `--muted`, `--border`, `--primary`, `--destructive`, `--ring` и др. по шаблону shadcn) **согласованы** с существующим `globals.css` и блоком **`@theme inline`** / переменными Geist (UX-DR2): одна согласованная **светлая** палитра v1; не ломать подключение шрифтов из `layout.tsx` (`--font-geist-sans`, `--font-geist-mono`).

4. **And** зафиксировано правило **сосуществования с `@repo/ui`** (UX-DR3, вариант A): новые экраны и хром cut-stack строятся на **shadcn в web**; `@repo/ui` не дублировать для новых кнопок/полей — допускается оставить пакет для демо или тонких re-export позже; в коде/комментарии в `ProjectAppShell` или `README` web-пакета кратко зафиксировать правило (1–3 предложения).

5. **And** на ширинах **ниже `lg` (1024px)** боковая панель **схлопывается** в оверлей на базе **`Sheet`** с кнопкой открытия меню; разделы «Проекты» и «Мастерская» остаются доступны (UX-DR15, UX-DR16). На **`lg` и выше** — постоянный sidebar.

6. **And** маршруты разделов существуют и связаны с навигацией (пример соглашения): `/projects` — зона проектов (пока заглушка контента допустима), `/workshop` — «Мастерская» (заглушка); активный пункт визуально выделен; корень `/` ведёт в рабочую зону без «маркетинговой» страницы create-next-app.

7. **And** `pnpm lint` и `pnpm check-types` из **корня** репозитория проходят после изменений.

## Tasks / Subtasks

- [x] **Инициализация shadcn** (AC: #2, #3)  
  - [x] Из корня монорепо: `pnpm dlx shadcn@latest init` в контексте `apps/clients/web` (или эквивалент по официальной [документации shadcn Next.js](https://ui.shadcn.com/docs/installation/next) и [Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4)).  
  - [x] Убедиться, что версии peer-deps совместимы с **Next 16.2.6**, **React 19.2.4**, **Tailwind 4**; при конфликтах — зафиксировать выбор в Dev Notes story после правки.

- [x] **Токены и типографика** (AC: #3)  
  - [x] Объединить переменные shadcn с `@theme inline` в `globals.css`; убрать рассинхрон «Arial» vs Geist: базовый шрифт интерфейса — **Geist Sans** из layout (см. UX-DR11, project-context).

- [x] **`ProjectAppShell`** (AC: #1, #5, #6)  
  - [x] Реализовать клиентский компонент (например `src/components/cut/project-app-shell.tsx` или `src/components/project-app-shell.tsx`) с `"use client"`: desktop sidebar + mobile `Sheet`.  
  - [x] Семантика: `nav` для sidebar, `main` для контента; подписи навигации на **русском**.  
  - [x] Подключить shell через **layout** сегмента маршрутов (например группа `(app)`), не размазывая разметку по каждой `page.tsx`.

- [x] **Маршруты** (AC: #6)  
  - [x] `app/(app)/layout.tsx` — обёртка `ProjectAppShell` + `children`.  
  - [x] `app/(app)/projects/page.tsx`, `app/(app)/workshop/page.tsx` — явные заглушки с заголовком раздела.  
  - [x] `app/page.tsx` — редирект на `/projects` или первый раздел по продуктовой логике.

- [x] **Корневой layout и метаданные** (AC: #1)  
  - [x] Обновить `metadata` в `layout.tsx`: название и описание **cut-stack**, `lang="ru"` для `<html>`.

- [x] **Документирование границы `@repo/ui` / shadcn** (AC: #4)  
  - [x] Краткая заметка в `apps/clients/web/README.md` или в шапке `ProjectAppShell` (комментарий), без простыни.

- [x] **Проверка** (AC: #7)  
  - [x] `pnpm lint` и `pnpm check-types` с корня.  
  - [x] Ручная проверка: ширина ≥1024 — sidebar; &lt;1024 — меню через Sheet, оба раздела открываются.

### Review Findings

**Decision Needed:**
- [x] [Review][Decision] Тёмная палитра `.dark` при ограничении AC3 «светлая палитра v1» — оставлено как задел shadcn init для будущего dark mode; активации нет, v1 не нарушено

**Patches:**
- [x] [Review][Patch] Цикличная CSS-переменная `--color-popover` — ложная тревога, код уже верный [`globals.css`]
- [x] [Review][Patch] `shadcn` перемещён из `dependencies` в `devDependencies` [`package.json`]
- [x] [Review][Patch] Убран лишний `<Separator />` после `border-b`-div в шапке sidebar [`project-app-shell.tsx`]
- [x] [Review][Patch] Исправлен Tailwind-селектор: `[a]:hover:` → `[&:is(a)]:hover:` [`button.tsx`]

**Deferred:**
- [x] [Review][Defer] `"use client"` на всей оболочке — только `NavLinks` и Sheet-toggle нуждаются в клиенте; оптимизация на потом [`project-app-shell.tsx`] — deferred, архитектурное улучшение
- [x] [Review][Defer] Токены `--chart-*` идентичны в светлой и тёмной теме [`globals.css`] — deferred, графики не используются в этой story
- [x] [Review][Defer] Trailing slash не обрабатывается в `isActivePath` [`project-app-shell.tsx:isActivePath`] — deferred, текущие href без trailing slash
- [x] [Review][Defer] Sheet закрывается до подтверждения успешной навигации [`project-app-shell.tsx:NavLinks`] — deferred, edge case v1
- [x] [Review][Defer] Горизонтальный `ScrollBar` отсутствует в `ScrollArea` [`scroll-area.tsx`] — deferred, sidebar не переполняется горизонтально

## Dev Notes

### Текущее состояние кода (что трогаем)

- **`apps/clients/web/src/app/layout.tsx`**: сейчас шаблон Create Next App (`metadata` на английском, `lang="en"`), Geist уже подключены — **сохранить** шрифты, обновить метаданные и язык.  
- **`apps/clients/web/src/app/page.tsx`**: шаблонная промо-страница — **заменить** редиректом или переносом в другой сегмент, чтобы не оставлять «ложный» UX продукта.  
- **`apps/clients/web/src/app/globals.css`**: минимальные `:root` + `@theme inline` — **расширить** переменными shadcn и выровнять `body` под Geist.  
- **`apps/clients/web/package.json`**: нет radix/class-variance/tailwind-merge — появятся как транзитивные или прямые зависимости после `shadcn init`; не добавлять лишние библиотеки вне CLI.

### Архитектура и границы

- **Server vs client:** страницы разделов по возможности остаются **Server Components**; интерактив shell (Sheet, кнопка меню, возможно состояние открытия) — в **одном** клиентском обёрточном компоненте ([Source: `_bmad-output/planning-artifacts/architecture.md` — Frontend Architecture]).  
- **Домен:** в этой story **нет** логики IndexedDB и доменных пакетов — только UI-каркас; не создавать `cut-stack-persistence` «заодно» без отдельной story.  
- Противоречие с формулировкой «First priority = domain package» в `architecture.md` **не блокирует** эту story: в **`epics.md`** первая implementation story эпика 1 явно про shell и shadcn; порядок в архитектуре — общий handoff, эпик 1 стартует с UX-каркаса.

### UX и доступность

- **WCAG:** фокус, видимое кольцо (`--ring`), клавиатурный доступ к пунктам навигации и кнопке открытия Sheet ([Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Accessibility Strategy]).  
- **Desktop-first:** брейкпоинт `lg` для переключения sidebar ↔ Sheet ([Source: тот же файл — Breakpoint Strategy]).

### Структура файлов (ожидаемый результат)

```text
apps/clients/web/src/
  app/
    layout.tsx                 # UPDATE: metadata, lang
    page.tsx                   # UPDATE: redirect
    globals.css                # UPDATE: shadcn tokens + Geist body
    (app)/
      layout.tsx               # NEW: ProjectAppShell wrapper
      projects/page.tsx        # NEW
      workshop/page.tsx        # NEW
  components/
    ui/                        # NEW (shadcn CLI)
    cut/                       # NEW (optional папка)
      project-app-shell.tsx    # NEW: "use client"
```

Имена маршрутов `workshop` — кодовое; подписи в UI — **«Мастерская»**.

### Тестирование (v1 репозитория)

- Автотестов пока нет ([Source: `_bmad-output/project-context.md` — Testing Rules]): не вводить runner в этой story.  
- Достаточно **lint + check-types** и ручной проверки responsive.

### Риски

- **Peer dependencies** React 19 / Next 16: при ошибке установки — задокументировать точные флаги (`--legacy-peer-deps` и т.д.) в Dev Agent Record, не ослаблять `strict` в TS.

## References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 1, Story 1.1]  
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Frontend Architecture, Project Structure, Implementation Handoff]  
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Design System Foundation, Component Strategy `ProjectAppShell`, Navigation / Responsive]  
- [Source: `_bmad-output/project-context.md` — Stack, Server/Client, Tailwind v4]  
- Внешнее: [shadcn/ui — Next.js](https://ui.shadcn.com/docs/installation/next), [Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4)

## Dev Agent Record

### Agent Model Used

Composer (Cursor)

### Debug Log References

_(нет)_

### Implementation Plan

- Инициализация через `pnpm dlx shadcn@latest init -d -y` в `apps/clients/web`, затем `add sheet separator scroll-area`; пресет **base-nova**, Tailwind v4, без конфликтов peer-deps.
- В `@theme inline` исправлена циклическая ссылка `--font-sans` → `var(--font-geist-sans)` для согласования с Geist из `layout.tsx`.
- Shell: `ProjectAppShell` в сегменте `(app)`; навигация «Проекты» / «Мастерская»; `lg+` постоянный sidebar, ниже `lg` — `Sheet` слева и кнопка меню.

### Completion Notes List

- Реализованы shadcn (Button, Sheet, Separator, ScrollArea), токены в `globals.css`, оболочка и маршруты `/projects`, `/workshop`, редирект `/` → `/projects`.
- Метаданные и `lang="ru"` в корневом layout; правило shadcn vs `@repo/ui` — в README и комментарии у `ProjectAppShell`.
- Добавлен скрипт `check-types` в пакет `web`; с корня успешно: `pnpm lint`, `pnpm check-types`, `pnpm build`.

### File List

- `_bmad-output/implementation-artifacts/1-1-karkas-prilozheniya-shadcn-i-navigatsiya-proekty-masterskaya.md`
- `pnpm-lock.yaml`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `apps/clients/web/README.md`
- `apps/clients/web/components.json`
- `apps/clients/web/package.json`
- `apps/clients/web/src/app/(app)/layout.tsx`
- `apps/clients/web/src/app/(app)/projects/page.tsx`
- `apps/clients/web/src/app/(app)/workshop/page.tsx`
- `apps/clients/web/src/app/globals.css`
- `apps/clients/web/src/app/layout.tsx`
- `apps/clients/web/src/app/page.tsx`
- `apps/clients/web/src/components/cut/project-app-shell.tsx`
- `apps/clients/web/src/components/ui/button.tsx`
- `apps/clients/web/src/components/ui/scroll-area.tsx`
- `apps/clients/web/src/components/ui/separator.tsx`
- `apps/clients/web/src/components/ui/sheet.tsx`
- `apps/clients/web/src/lib/utils.ts`

## Change Log

- 2026-05-13 — Story 1.1: shadcn/ui, `ProjectAppShell`, маршруты Проекты/Мастерская, редирект с `/`, метаданные и README; lint, check-types, build.

---

_Ultimate context engine analysis completed — comprehensive developer guide created._

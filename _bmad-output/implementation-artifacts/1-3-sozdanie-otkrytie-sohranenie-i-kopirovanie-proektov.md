# Story 1.3: Создание, открытие, сохранение и копирование проектов

Status: ready-for-dev

## Story

As a владелец мастерской,
I want создавать, открывать, сохранять и копировать проекты из списка,
so that вести несколько заказов и быстро стартовать копию под похожий корпус.

## Acceptance Criteria

1. **Given** раздел «Проекты» (`/projects`)
   **When** пользователь нажимает «Новый проект»
   **Then** создаётся запись с **стабильным уникальным `id`** (например `crypto.randomUUID()`), осмысленным именем по умолчанию (например «Новый проект» + суффикс или дата/время, если нужна уникальность в списке), полем **`updatedAt`** (ISO-8601), версией документа проекта (`projectSchemaVersion`, целое ≥ 1; стартовое значение **1**)
   **And** пользователь переходит в контекст этого проекта (отдельный маршрут, см. Dev Notes) и видит, что проект «существует» после перезагрузки страницы (NFR7)

2. **Given** список сохранённых проектов
   **When** пользователь открывает `/projects`
   **Then** метаданные (**имя**, **дата изменения**) отображаются в **`Table`** (UX-DR10); пустой список — понятный empty state с тем же primary-действием «Новый проект» (UX-DR13 / empty state из UX-спеки)

3. **Given** строка проекта в таблице
   **When** пользователь открывает меню действий
   **Then** доступны как минимум **«Открыть»** и **«Копировать»**; копирование реализовано через **`DropdownMenu`** в строке (UX-DR19)
   **And** при копировании создаётся **новый `id`**, имя копии по умолчанию **явное** (например `«Исходное имя» — копия` или `«Исходное имя» (копия)`); отдельное модальное подтверждение **не требуется** (UX-DR19)

4. **Given** открытый проект (маршрут детали)
   **When** пользователь меняет имя проекта и нажимает **«Сохранить»**
   **Then** изменения записываются в IndexedDB, **`updatedAt`** обновляется, в списке на `/projects` отображаются новые данные после возврата или обновления списка
   **And** при ошибке записи (квота, сбой транзакции IndexedDB) показывается **`Alert`** и/или **`FormMessage`**; введённое имя **не сбрасывается** молча (UX-DR13, UX-DR14)

5. **And** вся работа с IndexedDB идёт через **`cut-stack-persistence`**; доменные типы и zod-схемы границы ввода/загрузки — в **`cut-stack-domain`**; UI не содержит «сырых» вызовов `indexedDB` вне пакета персистентности (архитектура: Data Boundaries)

6. **And** `pnpm lint` и `pnpm check-types` с корня репозитория проходят без ошибок

## Tasks / Subtasks

- [ ] **Домен: проект** (AC: #1, #5)
  - [ ] В `packages/cut-stack-domain` добавить типы (или файл `project.ts`): `ProjectId` (брендированный string / alias), `ProjectRecord` с полями `id`, `name`, `updatedAt` (string ISO), `projectSchemaVersion`, `data` (минимальный объект-заглушка v1, например `{ "kind": "empty" }` — расширяется в Epic 2+ и Story 1.4)
  - [ ] Zod: `projectRecordSchema` для валидации после чтения из IndexedDB и для формы переименования (имя: непустая строка, разумный max length, например 120 символов)

- [ ] **Персистентность: store проектов** (AC: #1, #3, #5)
  - [ ] В `packages/cut-stack-persistence` добавить **object store** `projects` в той же БД **`cut-stack-db`**, что и профиль мастерской (Story 1.2), с **`keyPath: "id"`** и индексом по `updatedAt` при необходимости сортировки
  - [ ] Поднять **версию БД** (`DB_VERSION`) и в `onupgradeneeded` создать store, если отсутствует; не ломать существующий store `workshop-profile` из Story 1.2
  - [ ] API (пример сигнатур): `listProjects()`, `getProject(id)`, `putProject(record)`, `deleteProject?` — удаление **вне обязательных AC** FR2; не добавлять без явного согласования
  - [ ] `duplicateProject(sourceId, nameForCopy)` — читает исходный, новый `id`, новое имя, `updatedAt` = now, shallow copy `data`
  - [ ] SSR-guard: любой код, открывающий БД, только в браузере (как в Story 1.2)

- [ ] **UI: список проектов** (AC: #2, #3)
  - [ ] Добавить shadcn-компоненты через CLI при необходимости: **`Table`**, **`DropdownMenu`**, **`Alert`**, **`Card`** (если ещё не добавлены в 1.1/1.2)
  - [ ] Клиентский компонент `ProjectsTable` (например `apps/clients/web/src/components/cut/projects-table.tsx`, `"use client"`): загрузка списка при mount, сортировка по `updatedAt` по убыванию
  - [ ] Колонки: **Имя**, **Изменён** (локализованный формат даты RU; для чисел/дат в таблице — `font-mono` по UX-DR11 где уместно)
  - [ ] Кнопка primary **«Новый проект»** над таблицей (иерархия кнопок UX-DR12)
  - [ ] В каждой строке: `DropdownMenu` с пунктами «Открыть», «Копировать»; иконка «⋯» или текст «Действия» с `Tooltip` при необходимости

- [ ] **UI: деталь проекта и сохранение** (AC: #1, #4)
  - [ ] Маршрут `apps/clients/web/src/app/(app)/projects/[projectId]/page.tsx` — страница «каркас» проекта: отображение текущего имени, поле ввода имени, кнопка **«Сохранить»**; остальные табы корпуса/3D — **вне scope** этой story (заглушка одной строкой допустима)
  - [ ] При невалидном `projectId` в URL — `Alert` «Проект не найден» и ссылка назад на `/projects`

- [ ] **Интеграция и проверка** (AC: #6)
  - [ ] Зависимости web-пакета: `workspace:*` на `cut-stack-domain` и `cut-stack-persistence` (если ещё не подключены после 1.2)
  - [ ] `pnpm lint` и `pnpm check-types` с корня

## Dev Notes

### Текущее состояние репозитория (на момент написания story)

В `apps/clients/web/src` сейчас только шаблонные `layout.tsx`, `page.tsx`, `globals.css` — **маршрутов `(app)/projects` ещё нет**; они ожидаются из **Story 1.1**. Пакетов `cut-stack-domain` / `cut-stack-persistence` в `packages/` **ещё нет** — они ожидаются из **Story 1.2**. Реализация 1.3 = **надстройка** после 1.1 и 1.2 (или параллельно только при уже готовых пакетах и shell).

### Что обновляется по сравнению с предыдущими историями

| Область | Story 1.1 | Story 1.2 | Story 1.3 (эта) |
|--------|-----------|-----------|-----------------|
| Маршруты | `/projects`, `/workshop`, shell | форма мастерской | `/projects/[projectId]`, список ≠ заглушка |
| IndexedDB | нет | `workshop-profile` | + store `projects` |
| Домен | нет | `WorkshopProfile` | + `ProjectRecord` |

### Интеллект из предыдущих историй (чтобы не повторять ошибки)

- **Story 1.1:** `ProjectAppShell`, группа `(app)`, русский UI, sidebar / `Sheet` на `<lg`; не размазывать shell по страницам.
- **Story 1.2:** одна БД `cut-stack-db`, версия схемы документа, zod на границе, **никакого IndexedDB в SSR**; паттерн клиентского острова для данных из браузера.

### Согласование со Story 1.4 (без scope creep)

В **Story 1.4** в новый проект копируются пресеты профиля мастерской. В **этой** story поле `data` может оставаться минимальным (`{ kind: "empty" }`). **Не** подтягивать профиль мастерской в `data` автоматически здесь — иначе дублирование и расхождение с AC 1.4.

### Архитектура и границы (обязательно)

- **Единый слой IndexedDB:** только `cut-stack-persistence` ([Source: `_bmad-output/planning-artifacts/architecture.md` — Data Boundaries]).
- **Валидация:** при **чтении** из IndexedDB и при **вводе** в форме ([Source: тот же файл — Data Architecture]).
- **Формат обмена:** внутренние снимки — **camelCase**; не путать с snake_case CSV экспорта (Epic 7).
- **Ошибки домена/IO:** по возможности `Result` / union в пакете персистентности; на UI — `Alert`, без «тихого» failed save.

### Файлы (ожидаемый результат)

```text
packages/cut-stack-domain/src/
  project.ts                 # NEW или расширение index.ts

packages/cut-stack-persistence/src/
  db.ts                      # UPDATE: версия БД, onupgradeneeded + store projects
  project-store.ts           # NEW: list/get/put/duplicate

apps/clients/web/src/
  app/(app)/projects/
    page.tsx                 # UPDATE: список вместо заглушки (или обёртка + client)
    [projectId]/page.tsx     # NEW: деталь + сохранение имени
  components/cut/
    projects-table.tsx       # NEW: "use client"
```

Имена маршрутов на латинице; подписи в UI — **русский** (UX-DR21).

### Доступность и UX

- Таблица: семантика `table`/`thead`/`tbody`; фокус и клавиатура для `DropdownMenu` (Radix).
- Не полагаться только на цвет для состояния ошибки — текст в `Alert` (UX-DR17).
- Подтверждение копирования не требуется (UX-DR19).

### Тестирование

Автотестов в репозитории пока нет ([Source: `_bmad-output/project-context.md`]). Достаточно **lint + check-types** и ручного сценария: создать два проекта → копировать → переименовать → сохранить → F5 → список и деталь согласованы.

### Git intelligence

Последние коммиты — планирование и scaffold монорепо; паттернов приложения cut-stack в git пока нет — ориентир на story 1.1–1.2 и `project-context.md`.

### Актуальные технические примечания

- **`crypto.randomUUID()`** — стандарт для id в браузере; типы DOM доступны при корректном `lib` в TS.
- **IndexedDB:** при добавлении object store обязателен **инкремент версии БД**; миграции только в `onupgradeneeded`.
- Библиотека **`idb`** (если выбрана в 1.2) — использовать тот же стиль транзакций, что и для профиля мастерской.

## References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 1, Story 1.3; контекст Story 1.4 для границы `data`]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Data Architecture, Data Boundaries, Format Patterns, Requirements to Structure Mapping (FR1–FR3)]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — UX-DR10 Table, UX-DR19 копирование, Form/Feedback patterns]
- [Source: `_bmad-output/planning-artifacts/prd.md` — FR2, NFR7]
- [Source: `_bmad-output/implementation-artifacts/1-1-karkas-prilozheniya-shadcn-i-navigatsiya-proekty-masterskaya.md`]
- [Source: `_bmad-output/implementation-artifacts/1-2-presety-listov-kerf-trim-i-zazory-fasada-v-profile-masterskoy.md`]
- [Source: `_bmad-output/project-context.md`]

## Dev Agent Record

### Agent Model Used

_(заполняется при dev-story)_

### Debug Log References

### Completion Notes List

### File List

_(заполняется при реализации)_

---

_Ultimate context engine analysis completed — comprehensive developer guide created._

### Открытые вопросы (не блокируют старт)

- Точный шаблон имени копии — зафиксировать в UI одной строкой в `Dev Agent Record` при реализации; главное — **явность** по UX-DR19.

# Story 1.4: Новый проект с подставленными параметрами профиля мастерской

Status: ready-for-dev

## Story

As a владелец мастерской,
I want чтобы новый проект автоматически подтягивал пресеты листа, kerf, trim и зазоры из профиля мастерской,
so that не повторять базовый ввод при каждом заказе.

## Acceptance Criteria

1. **Given** в IndexedDB есть **валидный сохранённый** профиль мастерской (`WorkshopProfile` из Story 1.2)
   **When** пользователь создаёт **новый** проект (поток «Новый проект» из Story 1.3)
   **Then** в запись проекта попадает **снимок** профиля (deep copy): те же `sheetPresets`, `kerfMm`, `trimMm`, `facadeGapMm` и `schemaVersion` профиля на момент создания; глобальный документ профиля мастерской **не изменяется**

2. **Given** открыт проект со снимком профиля
   **When** пользователь редактирует параметры листа/kerf/trim/зазора **в контексте проекта** и сохраняет проект
   **Then** обновляется только **`ProjectRecord`** в store `projects`; вызовы **`saveWorkshopProfile`** из этого экрана **отсутствуют** (глобальная мастерская не перезаписывается)
   **And** действие «Синхронизировать с мастерской» **не входит в scope** этой story: отдельной кнопки/потока, который пишет в глобальный профиль из проекта, **не добавлять**

3. **Given** глобальный профиль мастерской **отсутствует** (`loadWorkshopProfile()` → `null` или невалидные данные)
   **When** пользователь нажимает «Новый проект»
   **Then** создание **не** выполняется с «тихим» пустым снимком; показывается **`Alert`** с понятным текстом и ссылкой/кнопкой перехода на **`/workshop`** (условие эпиков: «Given сохранённый профиль»)

4. **Given** проект, созданный в Story 1.3, с `data` вида `{ "kind": "empty" }` (без снимка)
   **When** пользователь открывает карточку проекта после внедрения Story 1.4
   **Then** UI **не ломается**; отображается предложение **однократно** подставить текущий глобальный профиль (кнопка «Заполнить из мастерской») **или** явный empty state с переходом в мастерскую — выбрать **один** паттерн и зафиксировать в `Dev Agent Record` при реализации (минимум: не падать, не мутировать глобальный профиль без действия пользователя)

5. **Given** пользователь дублирует проект (Story 1.3)
   **When** у исходного проекта уже есть снимок профиля в `data`
   **Then** копия содержит **независимый** снимок (тот же набор полей, новый `id` проекта); изменения в копии не затрагивают оригинал
   **And** если у исходного `data.kind === "empty"` **и** глобальный профиль доступен — при дублировании в копию **один раз** подставляется актуальный глобальный снимок (чтобы копия была полезна для «похожего заказа»)

6. **And** форма полей проекта использует **те же zod-инварианты**, что и глобальная мастерская (`workshopProfileSchema` / типы из `cut-stack-domain`); дублировать числовые правила в UI **нельзя**

7. **And** `pnpm lint` и `pnpm check-types` с корня проходят без ошибок

## Tasks / Subtasks

- [ ] **Домен: снимок в проекте** (AC: #1, #6)
  - [ ] В `packages/cut-stack-domain` расширить модель `ProjectRecord.data` (см. Story 1.3) до **дискриминированного union**, например:
    - `{ kind: "empty" }` — legacy после 1.3
    - `{ kind: "workshopSnapshot"; workshop: WorkshopProfile }` — целевое состояние после создания/подстановки
  - [ ] Zod: `projectDataSchema` + парсинг после чтения из IndexedDB; несовместимый `data` → ошибка загрузки проекта с `Alert`, без silent reset
  - [ ] Чистая функция **`cloneWorkshopProfile(input: WorkshopProfile): WorkshopProfile`** (рекомендация: `structuredClone` при поддержке браузера + повторная валидация через `workshopProfileSchema`, либо `JSON.parse(JSON.stringify(...))` с последующим `safeParse` — зафиксировать выбор в коде)

- [ ] **Персистентность: создание и копирование** (AC: #1, #3, #5)
  - [ ] Расширить API `cut-stack-persistence`: например `createProjectFromWorkshop({ name, workshop })` или параметризовать существующий `createProject` из 1.3 — главное: **одна** точка записи нового проекта со снимком
  - [ ] Обновить `duplicateProject`: глубокое копирование `data`; правило для `empty` + глобальный профиль — как в AC #5
  - [ ] При необходимости поднять **`projectSchemaVersion`** в `ProjectRecord` (если вводили в 1.3) с миграцией только чтения/отображения, без порчи старых ключей IndexedDB

- [ ] **UI: рефактор формы мастерской** (AC: #2, #6)
  - [ ] Выделить из `WorkshopProfileForm` (Story 1.2) презентационный блок полей (например `WorkshopProfileFields`) с пропсами `defaultValues`, `onSubmit`, заголовком секции и подписью «Изменения сохраняются в …» (глобально vs в проекте), чтобы **не копировать** разметку полей
  - [ ] На странице **`/projects/[projectId]`**: секция **«Параметры мастерской для этого заказа»** с формой, сохраняющей в **`putProject`** только блок `data.workshop`

- [ ] **UI: список проектов — «Новый проект»** (AC: #1, #3)
  - [ ] В обработчике «Новый проект»: `loadWorkshopProfile()` → при успехе `createProjectFromWorkshop`, иначе `Alert` (AC #3)
  - [ ] Не ослаблять валидацию: снимок перед записью прогнать через `workshopProfileSchema`

- [ ] **Проверка** (AC: #7)
  - [ ] Ручной сценарий: сохранить мастерскую → новый проект → открыть проект → изменить kerf в проекте → сохранить → `/workshop` — глобальный kerf **без изменений**
  - [ ] Ручной сценарий: изменить глобальную мастерскую → создать второй проект — в нём новые значения; первый проект сохраняет **старый** снимок до ручного редактирования в проекте
  - [ ] `pnpm lint` и `pnpm check-types`

## Dev Notes

### Зависимости

Требуются **Story 1.2** (типы и форма мастерской, store профиля) и **Story 1.3** (проекты, `ProjectRecord`, store `projects`, маршруты списка и детали). Реализовывать 1.4 после стабилизации 1.2–1.3 или согласованного merge.

### Текущее состояние кода (на момент написания story)

В репозитории ещё нет реализации 1.1–1.3 в `apps/clients/web` (только шаблон Next). Пути и имена файлов выровнять с уже созданными story-доками 1.1–1.3 при появлении кода.

### Интеллект из Story 1.3

- Проект живёт в store **`projects`**, отдельно от **`workshop-profile`**.
- Поле `data` изначально `{ kind: "empty" }` — в 1.4 появляется ветка со снимком; миграции БД IndexedDB только через **`onupgradeneeded`** и инкремент версии БД при добавлении новых store/индексов; **изменение формы JSON внутри существующих записей** не требует upgrade DB, только парсинг версий в приложении.

### FR3 и граница ответственности

FR3: «применяет профиль мастерской к новому проекту без повторного ввода» — выполняется **снимком при создании** + возможность правки **локально** в проекте (AC #2). Глобальный профиль остаётся источником правды только для **новых** проектов и для экрана `/workshop`.

### Архитектура

- Импорт типов и схем только из **`cut-stack-domain`**; запись в IndexedDB только через **`cut-stack-persistence`** ([Source: `_bmad-output/planning-artifacts/architecture.md` — Data Boundaries, Data Architecture]).
- **Immutability:** не мутировать объекты, возвращённые из парсинга zod, перед повторной записью — создавать новые объекты при `putProject`.

### UX

- Одна primary на форму сохранения проекта (UX-DR12); подписи на русском, мм с `font-mono` для чисел (UX-DR11).
- Ошибки — `Alert` / `FormMessage`, без потери ввода (UX-DR13, UX-DR14).

### Тестирование

Автотестов в репозитории пока нет ([Source: `_bmad-output/project-context.md`]). Достаточно lint/typecheck и ручных сценариев из задач.

### Git intelligence

История коммитов пока не отражает фичи cut-stack — ориентир на story-файлы 1.1–1.3 и `project-context.md`.

### Актуальные технические примечания

- **`structuredClone`** поддерживается в целевых Chromium для desktop; при сомнении — JSON round-trip + `workshopProfileSchema.safeParse`.
- Следить за **одинаковым** `schemaVersion` внутри `WorkshopProfile` в снимке: это версия **схемы профиля**, а не проекта; при эволюции профиля миграции читать в Story профиля, не смешивать с `projectSchemaVersion`.

## References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 1, Story 1.4]
- [Source: `_bmad-output/planning-artifacts/prd.md` — FR3, NFR7]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Data Architecture, Data Boundaries, Format Patterns]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Form Patterns, Feedback]
- [Source: `_bmad-output/implementation-artifacts/1-2-presety-listov-kerf-trim-i-zazory-fasada-v-profile-masterskoy.md`]
- [Source: `_bmad-output/implementation-artifacts/1-3-sozdanie-otkrytie-sohranenie-i-kopirovanie-proektov.md`]
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

- Точная копирайт-строка для `Alert` при отсутствии профиля и для empty legacy-проектов — выбрать при реализации одну тональность (строго vs дружелюбно).

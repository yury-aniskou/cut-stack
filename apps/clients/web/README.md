# cut-stack — веб-клиент

Next.js 16 (App Router), React 19, Tailwind CSS v4, шрифты Geist через `next/font`.

## Дизайн-система: shadcn и `@repo/ui`

Новые экраны и хром cut-stack собираем на **shadcn/ui** в этом пакете (`src/components/ui`). Общий пакет **`@repo/ui`** в монорепо не дублируем для новых кнопок и полей; его можно оставить для демо или тонких re-export без копирования примитивов.

## Запуск

Из корня монорепо:

```bash
pnpm dev --filter=web
```

Локально в каталоге приложения: `pnpm dev`.

## Полезные ссылки

- [Next.js](https://nextjs.org/docs)
- [shadcn/ui — Next.js](https://ui.shadcn.com/docs/installation/next)

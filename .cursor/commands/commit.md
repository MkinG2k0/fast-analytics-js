# Создание коммита

Проанализируй все изменения в текущей ветке (используй `git status` и `git diff`) и создай коммит с точным описанием
того, что было сделано.

## Формат коммита

```text
{type_commit}(issue-{number}): {text_commit}
```

Где:

- **{number}** - номер задачи из названия ветки (например, из ветки `feature/issue-2278-fix-test` извлекается `2278`)
- **{text_commit}** - краткое описание изменений на английском языке в прошедшем времени (например, "fixed form
  validation", "added date filter")
- **{type_commit}** - тип изменений, один из:

    - `feat` - новая функциональность
    - `fix` - исправление бага
    - `refactor` - рефакторинг кода без изменения функциональности
    - `perf` - улучшение производительности
    - `style` - изменения форматирования, стиля кода (не влияют на логику)
    - `docs` - изменения в документации
    - `test` - добавление или изменение тестов
    - `chore` - рутинные задачи (обновление зависимостей, конфигурации и т.д.)
    - `build` - изменения в системе сборки
    - `ci` - изменения в CI/CD

## Процесс анализа

1. Проверь текущую ветку: `git branch --show-current`
2. Извлеки номер задачи из названия ветки (формат: `issue-{number}` или `{number}`)
3. Проанализируй изменения: `git status` и `git diff`
4. Определи тип коммита на основе характера изменений
5. Составь краткое описание изменений на английском языке в прошедшем времени (например, "fixed", "added", "
   refactored", "improved")
6. Создай коммит с помощью `git commit -m "{сообщение}"`

## Примеры хороших коммитов

- `feat(issue-2278): added date filtering to waybills list`
- `fix(issue-1234): fixed email validation in registration form`
- `refactor(issue-5678): refactored TripEdit component structure`
- `perf(issue-9012): improved data loading with caching`
- `docs(issue-3456): updated API usage documentation`

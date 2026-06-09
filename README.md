# Local Altcha Forms

Drupal-модуль, который добавляет собственный CAPTCHA type для модуля
[`captcha`](https://www.drupal.org/project/captcha).

Тип называется **Local Altcha**. Он показывает пользователю обычный checkbox
**«Я не робот»**, локально генерирует challenge, решает proof-of-work в браузере
и проверяет payload на сервере при отправке формы.

Внешние CAPTCHA-сервисы, Google reCAPTCHA и CDN не используются.

## Почему Через CAPTCHA Module

На многих Drupal-сайтах reCAPTCHA подключается именно через модуль `captcha`.
Поэтому логичнее заменить reCAPTCHA не самостоятельным `hook_form_alter`, а новым
CAPTCHA type:

- формы выбираются стандартными CAPTCHA points;
- администратор может включать/выключать защиту в привычном интерфейсе CAPTCHA;
- модуль не должен сам угадывать form ID и обходить дерево всех форм;
- замена reCAPTCHA становится проще: в CAPTCHA point меняется тип проверки.

## Совместимость

- Drupal 8, 9, 10
- PHP 7.1+
- Требуется contrib-модуль `captcha`

## Что Делает Модуль

Модуль предоставляет CAPTCHA type **Local Altcha**.

Когда этот тип выбран для CAPTCHA point, он:

1. Добавляет обязательный checkbox **«Я не робот»**.
2. Добавляет скрытое поле `altcha` для payload.
3. При клике по checkbox получает challenge с локального endpoint `/altcha/challenge`.
4. Решает SHA-256 proof-of-work в браузере.
5. Записывает base64 JSON payload в скрытое поле.
6. Проверяет payload на сервере во время CAPTCHA/Form API validation.
7. Блокирует отправку формы, если проверка не пройдена.

## Установка

Установите и включите модуль `captcha`, если он еще не установлен.

Скопируйте этот модуль в проект Drupal, например:

```bash
web/modules/custom/local_altcha_forms
```

Включите модуль:

```bash
drush en captcha local_altcha_forms -y
drush cr
```

Если Drush не используется, включите модули через страницу **Extend** в админке
Drupal и очистите кеши.

## Настройка Форм

Формы настраиваются средствами CAPTCHA module.

Обычно это делается так:

1. Откройте настройки CAPTCHA module в админке Drupal.
2. Найдите CAPTCHA points.
3. Для нужной формы укажите CAPTCHA type **Local Altcha**.
4. Сохраните настройки и очистите кеш.

На разных версиях CAPTCHA module интерфейс может немного отличаться, но принцип
тот же: этот модуль предоставляет тип проверки, а CAPTCHA module решает, где его
показывать.

## Настройки `settings.php`

Модуль читает легкие настройки из `settings.php`.

Пример:

```php
$settings['local_altcha_forms'] = [
  'robot_label' => 'Я не робот',
  'challenge_ttl' => 900,
  'max_number' => 50000,
  // Рекомендуется для production, особенно если несколько web-серверов.
  // Не коммитьте реальный секрет в репозиторий.
  'hmac_key' => getenv('LOCAL_ALTCHA_FORMS_HMAC_KEY'),
];
```

Такой же пример лежит в файле:

```text
examples/settings.local_altcha_forms.php
```

Если `hmac_key` не задан, модуль сам создаст секрет и сохранит его в Drupal state.
Для production-кластера или нескольких web-серверов лучше явно задать `hmac_key`
через переменную окружения.

## Локальный Challenge Endpoint

Endpoint:

```text
/altcha/challenge
```

Он возвращает JSON:

```json
{
  "algorithm": "SHA-256",
  "challenge": "...",
  "salt": "...?expires=...",
  "signature": "...",
  "maxnumber": 50000
}
```

Challenge подписывается через HMAC-SHA256. При отправке формы сервер проверяет:

- алгоритм;
- HMAC-подпись;
- найденное browser-side решение;
- допустимый диапазон числа;
- срок жизни challenge через timestamp в `salt`.

## Визуальная Часть

Модуль добавляет обычный checkbox **«Я не робот»** и небольшой текстовый статус
проверки рядом с ним.

В комплекте есть минимальный CSS:

```text
css/local_altcha_forms.css
```

Он отвечает только за базовое расположение checkbox и текста статуса. Внешний вид
конкретных форм лучше дорабатывать в теме сайта.

## Замена reCAPTCHA

Если на сайте уже используется reCAPTCHA через CAPTCHA module:

1. Установите и включите `local_altcha_forms`.
2. Откройте CAPTCHA points.
3. Найдите формы, где выбран тип reCAPTCHA.
4. Замените тип на **Local Altcha**.
5. Отключите/удалите reCAPTCHA module, если он больше нигде не используется.
6. Очистите кеш Drupal.

## Production Checklist

Перед тем как считать внедрение завершенным:

- найдите все публичные формы сайта и URL, где они встречаются;
- убедитесь, что в CAPTCHA points для нужных форм выбран **Local Altcha**;
- убедитесь, что на каждой целевой форме появился checkbox **«Я не робот»**;
- убедитесь, что Google reCAPTCHA больше не грузится;
- проверьте, что `/altcha/challenge` возвращает `200` и no-cache headers;
- проверьте, что клик по **«Я не робот»** заполняет hidden payload;
- проверьте, что форма без валидного payload не отправляется;
- очистите кеш Drupal и повторите проверку после rebuild.

## Важно

Это не официальный виджет Altcha. Это небольшая локальная реализация той же идеи:
сервер генерирует и подписывает challenge, браузер решает proof-of-work, сервер
проверяет payload при submit.

Для пользователя это обычный checkbox **«Я не робот»**, а все внешние антиспам-
сервисы остаются за пределами сайта.

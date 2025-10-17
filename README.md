# 📞 Phone Numbers System — Полный проект (Backend + Frontend + DB)

## 🧭 Описание

Проект представляет собой серверную систему для хранения телефонных номеров с REST API и веб-интерфейсом администратора.

Состоит из трёх частей:

1. **База данных PostgreSQL** — хранит номера телефонов.
2. **Backend (FastAPI)** — реализует API для получения, добавления, редактирования и удаления номеров.
3. **Frontend (Next.js)** — веб-интерфейс администратора для работы с базой.

---

## ⚙️ Структура проекта

```
PhoneNumbers/
├── backend/               # FastAPI сервер
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── ...
│
├── frontend/              # Next.js интерфейс администратора
│   ├── app/
│   ├── components/
│   ├── package.json
│   ├── Dockerfile
│   └── ...
│
└── docker-compose.yml     # общий файл для запуска всех сервисов
```

---

## 🚀 Быстрый старт

### 📋 Требования

* **Docker** + **Docker Compose** (v3.9+)
* **Порты должны быть свободны:** 5432, 8000, 3000
* **Git** (для клонирования репозитория)

### ⚡ Запуск проекта

1. **Клонируйте репозиторий:**
   ```bash
   git clone <URL_РЕПОЗИТОРИЯ>
   cd phone_numbers
   ```

2. **Запустите все сервисы:**
   ```bash
   docker-compose up --build
   ```

3. **Дождитесь запуска всех контейнеров** (около 1-2 минут)

### 🌐 Доступ к сервисам

| Сервис | URL | Описание |
|--------|-----|----------|
| **🎨 Веб-интерфейс** | http://localhost:3000 | Админ-панель для управления номерами |
| **📚 API документация** | http://localhost:8000/docs | Swagger UI с полным описанием API |
| **🔧 Backend API** | http://localhost:8000 | REST API для работы с номерами |
| **🗄️ База данных** | localhost:5432 | PostgreSQL (только для разработки) |

### 🔐 Авторизация

* **Пароль администратора:** `changeme`
* Введите пароль на главной странице для доступа к админ-панели

### 🧪 Тестирование

1. **Откройте веб-интерфейс:** http://localhost:3000
2. **Введите пароль:** `changeme`
3. **Изучите функционал:**
   - Просмотр списка номеров
   - Добавление одного номера
   - Массовое добавление номеров
   - Загрузка номеров из файла
   - Редактирование и удаление номеров

4. **Изучите API документацию:** http://localhost:8000/docs

### 3. Остановка контейнеров

```bash
docker-compose down
```

---

## 🧩 Сервисы в `docker-compose.yml`

```yaml
version: '3.9'

services:
  db:
    image: postgres:15
    container_name: phone_db
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: phones
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build:
      context: ./backend
    container_name: phone_backend
    restart: always
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/phones
      ADMIN_PASSWORD: changeme
    depends_on:
      - db
    ports:
      - "8000:8000"
    networks:
      - appnet

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: phone_frontend
    restart: always
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8000
    depends_on:
      - backend
    ports:
      - "3000:3000"
    networks:
      - appnet

networks:
  appnet:
    driver: bridge

volumes:
  pgdata:
```

---

## 🛠️ Backend (FastAPI)

**Функции API:**

* `GET /api/v1/phones` — получить список номеров (опционально с `limit` и `prefix`).
* `POST /api/v1/phones` — добавить номер вручную.
* `POST /api/v1/phones/bulk` — добавить несколько номеров (построчно).
* `POST /api/v1/phones/upload` — загрузить `.txt` файл с номерами.
* `PUT /api/v1/phones/{id}` — изменить номер.
* `DELETE /api/v1/phones/{id}` — удалить номер.

**Примеры запросов:**

```bash
GET /api/v1/phones?limit=100&prefix=+7
POST /api/v1/phones  { phone_number: "+79001234567", password: "changeme" }
```

**Swagger-документация:** доступна по адресу `/docs`

**Авторизация:** через поле `password` в теле запроса. Пароль задаётся переменной окружения `ADMIN_PASSWORD`.

---

## 🧑‍💻 Frontend (Next.js)

Фронтенд предоставляет админскую панель с функциями:

* Добавление номеров вручную.
* Загрузка `.txt` файла с номерами.
* Просмотр, фильтрация, сортировка, удаление и редактирование номеров.

### ⚙️ Переменные окружения

Создай файл `.env.local` в папке `frontend/`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🔐 Безопасность

* Обязательно измени пароль администратора в `docker-compose.yml` → `ADMIN_PASSWORD`
* Рекомендуется настроить HTTPS через Traefik, Nginx или Caddy.
* API по умолчанию не требует JWT, но можно добавить аутентификацию позже.

---

## 📦 Полезные команды

**Сбросить БД:**

```bash
docker-compose down -v
```

**Пересобрать образы:**

```bash
docker-compose build --no-cache
```

**Логи контейнеров:**

```bash
docker-compose logs -f backend
```

---

## 📅 Roadmap (планы развития)

* [ ] JWT авторизация вместо простого пароля.
* [ ] Добавить экспорт/импорт номеров в CSV.
* [ ] Реализовать пагинацию и фильтрацию по дате.
* [ ] Создать docker healthcheck.

---

## 📚 Контакты и помощь

Если проект запускается с ошибками:

* Проверь логи: `docker-compose logs`
* Убедись, что `.env.local` в `frontend` содержит корректный адрес API.
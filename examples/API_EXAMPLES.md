# 📚 Примеры использования API

## 🔐 Авторизация

Все админские операции требуют пароль: `changeme`

## 📋 Примеры запросов

### 1. Получить список номеров

```bash
# Получить 10 номеров
curl "http://localhost:8000/api/v1/phones?limit=10"

# Получить номера с префиксом +7
curl "http://localhost:8000/api/v1/phones?prefix=+7&limit=5"

# Получить номера с паролем (для админских функций)
curl "http://localhost:8000/api/v1/phones?limit=10&password=changeme"
```

### 2. Добавить один номер

```bash
curl -X POST "http://localhost:8000/api/v1/phones" \
  -F "phone_number=+79001234567" \
  -F "name=Тестовый номер" \
  -F "password=changeme"
```

### 3. Массовое добавление номеров

```bash
curl -X POST "http://localhost:8000/api/v1/phones/bulk" \
  -F "numbers=+79001234567
+79001234568
+79001234569" \
  -F "password=changeme"
```

### 4. Загрузка номеров из файла

```bash
curl -X POST "http://localhost:8000/api/v1/phones/upload" \
  -F "file=@examples/sample_phones.txt" \
  -F "password=changeme"
```

### 5. Редактировать номер

```bash
curl -X PUT "http://localhost:8000/api/v1/phones/1" \
  -F "phone_number=+79001234599" \
  -F "name=Обновленный номер" \
  -F "password=changeme"
```

### 6. Удалить номер

```bash
curl -X DELETE "http://localhost:8000/api/v1/phones/1" \
  -F "password=changeme"
```

## 📊 Формат ответов

### Список номеров
```json
{
  "count": 3,
  "items": [
    {"id": 1, "phone_number": "+79001234567"},
    {"id": 2, "phone_number": "+79001234568"},
    {"id": 3, "phone_number": "+79001234569"}
  ]
}
```

### Результат добавления
```json
{
  "added": 5,
  "skipped": 2
}
```

### Добавленный номер
```json
{
  "id": 1,
  "phone_number": "+79001234567"
}
```

## 🧪 Тестирование с помощью Postman

1. Импортируйте коллекцию из файла `examples/postman_collection.json`
2. Установите переменную `base_url` = `http://localhost:8000`
3. Установите переменную `password` = `changeme`
4. Запустите запросы по порядку

## 🔍 Проверка статуса

```bash
# Проверить, что API работает
curl "http://localhost:8000/api/v1/phones?limit=1"

# Проверить документацию
curl "http://localhost:8000/docs"
```

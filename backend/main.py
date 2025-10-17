import os
import re
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List, Optional
import phonenumbers
from phonenumbers import NumberParseException
from database import SessionLocal, engine
from models import Base, PhoneNumber

def wait_for_db():
    """Ждем готовности базы данных"""
    max_retries = 30
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            # Пытаемся подключиться к базе данных
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("Database connection successful!")
            return True
        except Exception as e:
            retry_count += 1
            print(f"Database connection failed (attempt {retry_count}/{max_retries}): {e}")
            time.sleep(2)
    
    raise Exception("Could not connect to database after maximum retries")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Waiting for database...")
    wait_for_db()
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")
    yield
    # Shutdown
    print("Shutting down...")

app = FastAPI(
    title='Phone Numbers API',
    description="""
    ## 📞 API для управления номерами телефонов
    
    Система для хранения, управления и получения номеров телефонов с веб-интерфейсом администратора.
    
    ### 🔧 Основные возможности:
    - **Получение номеров** с фильтрацией по префиксу и лимиту
    - **Добавление номеров** по одному или массово
    - **Загрузка номеров** из текстовых файлов
    - **Редактирование и удаление** номеров
    - **Валидация формата** номеров телефонов
    
    ### 🔐 Авторизация:
    - Для админских операций требуется пароль администратора
    - Пароль передается в параметрах запроса
    
    ### 📋 Формат номеров:
    - Поддерживаемый формат: `^\+?[0-9]{10,15}$`
    - Примеры: `+79001234567`, `79001234568`, `+380501234567`
    
    ### 🌐 Веб-интерфейс:
    - Доступен по адресу: http://localhost:3000
    - Админская панель с полным функционалом управления
    """,
    version='1.0.0',
    contact={
        "name": "Phone Numbers System",
        "email": "admin@example.com",
    },
    license_info={
        "name": "MIT",
    },
    lifespan=lifespan
)

# Добавляем CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Регулярка валидации номера
PHONE_RE = re.compile(r'^\+?[0-9]{10,15}$')
# Регулярка для извлечения префикса (country code с плюсом, если есть)
PREFIX_RE = re.compile(r'^(\+?\d{1,3})')

ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'changeme')

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class PhoneOut(BaseModel):
    id: int
    phone_number: str
    prefix: str
    created_at: str

    class Config:
        from_attributes = True

class PhoneListResponse(BaseModel):
    count: int
    items: List[PhoneOut]

class BulkAddResponse(BaseModel):
    added: int
    skipped: int

class PhoneAddResponse(BaseModel):
    id: int
    phone_number: str

class DeleteResponse(BaseModel):
    ok: bool

@app.get(
    '/api/v1/phones',
    summary="Получить список номеров телефонов",
    description="""
    Возвращает список номеров телефонов в случайном порядке.
    
    **Параметры:**
    - `limit`: Количество номеров для возврата (по умолчанию 100, максимум 1000)
    - `prefix`: Фильтр по префиксу номера (например, +7, +380)
    - `password`: Пароль администратора (опционально, для админских функций)
    
    **Возвращает:**
    - `count`: Количество возвращенных номеров
    - `items`: Массив объектов с номерами телефонов
    
    **Примеры:**
    - Получить 50 номеров: `GET /api/v1/phones?limit=50`
    - Получить номера с префиксом +7: `GET /api/v1/phones?prefix=+7`
    - Получить 10 номеров с префиксом +380: `GET /api/v1/phones?limit=10&prefix=+380`
    """,
    response_description="Список номеров телефонов",
    response_model=PhoneListResponse,
    tags=["Номера телефонов"]
)
def get_phones(limit: int = 100, prefix: Optional[str] = None, password: Optional[str] = None, db: Session = Depends(get_db)):
    # Проверка пароля для админских функций
    if password and password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail='Unauthorized')
    
    q = db.query(PhoneNumber)
    if prefix:
        q = q.filter(PhoneNumber.prefix == prefix)
    # случайный порядок
    q = q.order_by(func.random()).limit(limit)
    items = q.all()
    return {'count': len(items), 'items': [{'id': i.id, 'phone_number': i.phone_number, 'prefix': i.prefix, 'created_at': i.created_at.isoformat() if i.created_at else None} for i in items]}


@app.post(
    '/api/v1/phones/bulk',
    summary="Массовое добавление номеров",
    description="""
    Добавляет несколько номеров телефонов одновременно из текстового поля.
    
    **Параметры:**
    - `numbers`: Многострочный текст с номерами телефонов (каждая строка = один номер)
    - `password`: Пароль администратора (обязательно)
    
    **Формат номеров:**
    - Каждый номер на отдельной строке
    - Поддерживаемый формат: `^\+?[0-9]{10,15}$`
    - Примеры: `+79001234567`, `79001234568`, `+380501234567`
    
    **Возвращает:**
    - `added`: Количество успешно добавленных номеров
    - `skipped`: Количество пропущенных номеров (дубликаты или неверный формат)
    
    **Пример использования:**
    ```
    +79001234567
    +79001234568
    +380501234567
    79001234569
    ```
    """,
    response_description="Результат массового добавления",
    response_model=BulkAddResponse,
    tags=["Администрирование"]
)
def bulk_add(numbers: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    # numbers — многострочное поле, каждая строка = номер
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail='Unauthorized')

    lines = [l.strip() for l in numbers.splitlines() if l.strip()]
    added = 0
    skipped = 0
    
    # Убираем дубликаты из самого файла
    unique_lines = list(dict.fromkeys(lines))  # Сохраняет порядок
    
    for raw in unique_lines:
        if not PHONE_RE.match(raw):
            skipped += 1
            continue
        prefix = extract_prefix(raw)
        
        # Проверяем существование в БД
        existing = db.query(PhoneNumber).filter(PhoneNumber.phone_number == raw).first()
        if existing:
            skipped += 1
            continue
            
        # Пытаемся добавить каждый номер отдельно с обработкой исключений
        try:
            pn = PhoneNumber(phone_number=raw, prefix=prefix)
            db.add(pn)
            db.commit()
            added += 1
        except Exception:
            # Если произошла ошибка (например, дубликат), откатываем транзакцию
            db.rollback()
            skipped += 1
    
    return {'added': added, 'skipped': skipped}

@app.post(
    '/api/v1/phones/upload',
    summary="Загрузка номеров из файла",
    description="""
    Загружает номера телефонов из текстового файла (.txt).
    
    **Параметры:**
    - `file`: Текстовый файл с номерами телефонов (каждая строка = один номер)
    - `password`: Пароль администратора (обязательно)
    
    **Формат файла:**
    - Текстовый файл (.txt)
    - Кодировка: UTF-8
    - Каждый номер на отдельной строке
    - Поддерживаемый формат: `^\+?[0-9]{10,15}$`
    
    **Возвращает:**
    - `added`: Количество успешно добавленных номеров
    - `skipped`: Количество пропущенных номеров (дубликаты или неверный формат)
    
    **Пример содержимого файла:**
    ```
    +79001234567
    +79001234568
    +380501234567
    79001234569
    ```
    """,
    response_description="Результат загрузки файла",
    response_model=BulkAddResponse,
    tags=["Администрирование"]
)
def upload_txt(file: UploadFile = File(...), password: str = Form(...), db: Session = Depends(get_db)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail='Unauthorized')
    content = file.file.read().decode('utf-8', errors='ignore')
    # Перепользуем bulk_add логику
    return bulk_add(numbers=content, password=password, db=db)

@app.post(
    '/api/v1/phones',
    summary="Добавить один номер",
    description="""
    Добавляет один номер телефона в базу данных.
    
    **Параметры:**
    - `phone_number`: Номер телефона (обязательно)
    - `name`: Имя/описание номера (опционально)
    - `password`: Пароль администратора (обязательно)
    
    **Формат номера:**
    - Поддерживаемый формат: `^\+?[0-9]{10,15}$`
    - Примеры: `+79001234567`, `79001234568`, `+380501234567`
    
    **Возвращает:**
    - `id`: Уникальный идентификатор добавленного номера
    - `phone_number`: Добавленный номер телефона
    
    **Ошибки:**
    - `400`: Неверный формат номера
    - `401`: Неверный пароль
    - `409`: Номер уже существует (дубликат)
    """,
    response_description="Добавленный номер телефона",
    response_model=PhoneAddResponse,
    tags=["Администрирование"]
)
def add_single(phone_number: str = Form(...), name: Optional[str] = Form(None), password: str = Form(...), db: Session = Depends(get_db)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail='Unauthorized')
    if not PHONE_RE.match(phone_number):
        raise HTTPException(status_code=400, detail='Invalid phone format')
    prefix = extract_prefix(phone_number)
    existing = db.query(PhoneNumber).filter(PhoneNumber.phone_number == phone_number).first()
    if existing:
        # по умолчанию игнорируем дубликат, можно изменить на перезапись
        raise HTTPException(status_code=409, detail='Duplicate')
    pn = PhoneNumber(phone_number=phone_number, prefix=prefix, name=name)
    db.add(pn)
    db.commit()
    db.refresh(pn)
    return {'id': pn.id, 'phone_number': pn.phone_number}

@app.delete(
    '/api/v1/phones/{phone_id}',
    summary="Удалить номер",
    description="""
    Удаляет номер телефона по его идентификатору.
    
    **Параметры:**
    - `phone_id`: Уникальный идентификатор номера (в URL)
    - `password`: Пароль администратора (обязательно)
    
    **Возвращает:**
    - `ok`: true, если номер успешно удален
    
    **Ошибки:**
    - `401`: Неверный пароль
    - `404`: Номер не найден
    
    **Пример:**
    `DELETE /api/v1/phones/123` - удалить номер с ID 123
    """,
    response_description="Результат удаления",
    response_model=DeleteResponse,
    tags=["Администрирование"]
)
def delete_phone(phone_id: int, password: str = Form(...), db: Session = Depends(get_db)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail='Unauthorized')
    obj = db.query(PhoneNumber).get(phone_id)
    if not obj:
        raise HTTPException(status_code=404, detail='Not found')
    db.delete(obj)
    db.commit()
    return {'ok': True}

@app.put(
    '/api/v1/phones/{phone_id}',
    summary="Редактировать номер",
    description="""
    Редактирует существующий номер телефона.
    
    **Параметры:**
    - `phone_id`: Уникальный идентификатор номера (в URL)
    - `phone_number`: Новый номер телефона (обязательно)
    - `name`: Новое имя/описание номера (опционально)
    - `password`: Пароль администратора (обязательно)
    
    **Формат номера:**
    - Поддерживаемый формат: `^\+?[0-9]{10,15}$`
    - Примеры: `+79001234567`, `79001234568`, `+380501234567`
    
    **Возвращает:**
    - `id`: Идентификатор обновленного номера
    - `phone_number`: Обновленный номер телефона
    
    **Ошибки:**
    - `400`: Неверный формат номера
    - `401`: Неверный пароль
    - `404`: Номер не найден
    
    **Пример:**
    `PUT /api/v1/phones/123` - редактировать номер с ID 123
    """,
    response_description="Обновленный номер телефона",
    response_model=PhoneAddResponse,
    tags=["Администрирование"]
)
def edit_phone(phone_id: int, phone_number: str = Form(...), name: Optional[str] = Form(None), password: str = Form(...), db: Session = Depends(get_db)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail='Unauthorized')
    if not PHONE_RE.match(phone_number):
        raise HTTPException(status_code=400, detail='Invalid phone format')
    pn = db.query(PhoneNumber).get(phone_id)
    if not pn:
        raise HTTPException(status_code=404, detail='Not found')
    pn.phone_number = phone_number
    pn.prefix = extract_prefix(phone_number)
    pn.name = name
    db.commit()
    db.refresh(pn)
    return {'id': pn.id, 'phone_number': pn.phone_number}


# вспомогательные функции
def extract_prefix(phone: str) -> str:
    """
    Извлекает корректный префикс номера телефона с использованием библиотеки phonenumbers
    """
    try:
        # Парсим номер телефона
        parsed_number = phonenumbers.parse(phone, None)
        
        # Проверяем, что номер валидный
        if phonenumbers.is_valid_number(parsed_number):
            # Возвращаем префикс в формате +XX
            return f"+{parsed_number.country_code}"
        else:
            # Если номер не валидный, пробуем извлечь код страны
            if parsed_number.country_code:
                return f"+{parsed_number.country_code}"
            else:
                # Fallback на старую логику
                return extract_prefix_fallback(phone)
                
    except NumberParseException:
        # Если не удалось распарсить, используем fallback
        return extract_prefix_fallback(phone)
    except Exception:
        # Любая другая ошибка - fallback
        return extract_prefix_fallback(phone)

def extract_prefix_fallback(phone: str) -> str:
    """
    Fallback функция для извлечения префикса (старая логика)
    """
    m = PREFIX_RE.match(phone)
    if m:
        return m.group(1)
    # fallback — первые 2 символа
    return phone[:2]

from sqlalchemy import Column, Integer, String, Text, DateTime, func, Index
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class PhoneNumber(Base):
    __tablename__ = 'phone_numbers'

    id = Column(Integer, primary_key=True, autoincrement=True)
    phone_number = Column(String(32), nullable=False, unique=True, index=True)
    prefix = Column(String(32), nullable=False, index=True)
    name = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Дополнительные индексы (по префиксу уже есть index=True)
    # __table_args__ = (
    #     Index('ix_phone_prefix', 'prefix'),
    # )

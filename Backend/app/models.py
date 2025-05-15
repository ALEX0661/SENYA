from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, Enum, ForeignKey, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()

class Unit(Base):
    __tablename__ = 'units'

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), unique=True, nullable=False)
    description = Column(Text)
    order_index = Column(Integer, default=0)
    status = Column(Enum('active', 'inactive'), default='active')
    archived = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    lessons = relationship(
        'Lesson',
        back_populates='unit',
        order_by='Lesson.order_index',
        lazy='selectin',
    )

class Lesson(Base):
    __tablename__ = 'lessons'

    id = Column(Integer, primary_key=True, autoincrement=True)
    unit_id = Column(Integer, ForeignKey('units.id'), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    image_url = Column(String(512))
    rubies_reward = Column(Integer, default=0)
    order_index = Column(Integer, default=0)
    archived = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    unit = relationship('Unit', back_populates='lessons')
    signs = relationship(
        'Sign',
        back_populates='lesson',
        order_by='Sign.id',
        lazy='selectin',
    )

    @property
    def progress_bar(self):
        return 0

class Sign(Base):
    __tablename__ = 'signs'

    id = Column(Integer, primary_key=True, autoincrement=True)
    lesson_id = Column(Integer, ForeignKey('lessons.id'), nullable=False)
    text = Column(String(255), nullable=False)
    video_url = Column(String(512), nullable=False)
    difficulty_level = Column(
        Enum('beginner', 'intermediate', 'advanced'),
        default='beginner',
    )
    archived = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    lesson = relationship('Lesson', back_populates='signs')

class UserProgress(Base):
    __tablename__ = 'user_progress'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('accounts.user_id'))
    lesson_id = Column(Integer, ForeignKey('lessons.id'))
    progress = Column(Integer)
    completed = Column(Boolean, default=False)
    last_question = Column(Integer, default=0)
    updated_at = Column(
        TIMESTAMP, server_default=func.now(), onupdate=func.now()
    )

class Account(Base):
    __tablename__ = 'accounts'

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    hash_password = Column(String(255), nullable=False)
    role = Column(Enum('user', 'admin'), default='user')
    created_at = Column(TIMESTAMP, server_default=func.now())
    last_login = Column(TIMESTAMP)
    status = Column(Enum('active', 'inactive'), default='active')

    profile = relationship('UserProfile', back_populates='account', uselist=False)

class UserProfile(Base):
    __tablename__ = 'users'

    user_id = Column(Integer, ForeignKey('accounts.user_id'), primary_key=True)
    profile_url = Column(String(512))
    progress = Column(JSON, default={})
    rubies = Column(Integer, default=0)
    hearts = Column(Integer, default=5)
    hearts_last_updated = Column(TIMESTAMP, server_default=func.now())
    streak = Column(Integer, default=0)
    last_lesson_date = Column(TIMESTAMP)
    last_challenge_date = Column(TIMESTAMP)
    streak_updated_today = Column(Boolean, default=False)
    certificate = Column(Boolean, default=False)
    updated_at = Column(
        TIMESTAMP, server_default=func.now(), onupdate=func.now()
    )

    account = relationship('Account', back_populates='profile')

class HeartPackage(Base):
    __tablename__ = 'heart_packages'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    hearts_amount = Column(Integer, nullable=False)
    ruby_cost = Column(Integer, nullable=False)

class PracticeLevel(Base):
    __tablename__ = 'practice_levels'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    required_progress = Column(Integer, default=0)
    order_index = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(
        TIMESTAMP, server_default=func.now(), onupdate=func.now()
    )

    games = relationship('PracticeGame', back_populates='level', lazy='selectin')

class PracticeGame(Base):
    __tablename__ = 'practice_games'

    id = Column(Integer, primary_key=True, autoincrement=True)
    level_id = Column(Integer, ForeignKey('practice_levels.id'), nullable=False)
    game_identifier = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(
        TIMESTAMP, server_default=func.now(), onupdate=func.now()
    )

    level = relationship('PracticeLevel', back_populates='games')

class UserPracticeProgress(Base):
    __tablename__ = 'user_practice_progress'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('accounts.user_id'))
    level_id = Column(Integer, ForeignKey('practice_levels.id'))
    game_id = Column(Integer, ForeignKey('practice_games.id'))
    high_score = Column(Integer, default=0)
    progress = Column(Integer, default=0)
    completed = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(
        TIMESTAMP, server_default=func.now(), onupdate=func.now()
    )

class SignAttempt(Base):
    __tablename__ = 'sign_attempts'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('accounts.user_id'), nullable=False)
    sign_id = Column(Integer, ForeignKey('signs.id'), nullable=False)
    attempt_time = Column(TIMESTAMP, server_default=func.now())
    is_correct = Column(Boolean, nullable=False)
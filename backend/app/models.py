from datetime import UTC, datetime

from sqlmodel import Field, SQLModel


class SessionAlias(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    platform: str = Field(index=True, max_length=32)
    session_key: str = Field(index=True, max_length=512)
    title: str = Field(max_length=255)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC), nullable=False
    )


class EditLog(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    platform: str = Field(index=True, max_length=32)
    session_key: str = Field(index=True, max_length=512)
    edit_target: str = Field(max_length=1024)
    old_content: str = Field(default="")
    new_content: str = Field(default="")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC), nullable=False
    )

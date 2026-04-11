"""Simple TTL cache for expensive operations."""
from __future__ import annotations

import time
from threading import Lock
from typing import Any


class TTLCache:
    """Thread-safe TTL cache."""

    def __init__(self, default_ttl: float = 30.0):
        self.default_ttl = default_ttl
        self._store: dict[str, tuple[float, Any]] = {}
        self._lock = Lock()

    def get(self, key: str) -> Any | None:
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            expire_at, value = entry
            if time.monotonic() > expire_at:
                del self._store[key]
                return None
            return value

    def set(self, key: str, value: Any, ttl: float | None = None) -> None:
        ttl = ttl if ttl is not None else self.default_ttl
        with self._lock:
            self._store[key] = (time.monotonic() + ttl, value)

    def invalidate(self, key: str) -> None:
        with self._lock:
            self._store.pop(key, None)

    def invalidate_prefix(self, prefix: str) -> None:
        with self._lock:
            keys_to_remove = [k for k in self._store if k.startswith(prefix)]
            for k in keys_to_remove:
                del self._store[k]

    def clear(self) -> None:
        with self._lock:
            self._store.clear()


# Global cache instances
dashboard_cache = TTLCache(default_ttl=30.0)
sessions_cache = TTLCache(default_ttl=15.0)

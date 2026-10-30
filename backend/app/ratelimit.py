"""A small in-memory limit of requests per client per hour.

Enough for one server process; every Gemini call costs money, so a stolen app
token cannot be used to run up the bill quickly.
"""

import time
from collections import defaultdict, deque


class RateLimiter:
    def __init__(self, per_hour: int, clock=time.monotonic):
        self.per_hour = per_hour
        self._clock = clock
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def allow(self, key: str) -> bool:
        if self.per_hour <= 0:
            return True
        now = self._clock()
        hits = self._hits[key]
        while hits and now - hits[0] >= 3600:
            hits.popleft()
        if len(hits) >= self.per_hour:
            return False
        hits.append(now)
        return True

# Copyright 2024-2026 nirholas. All rights reserved.
# SPDX-License-Identifier: SEE LICENSE IN LICENSE

"""Unit tests for AsyncCryptoNewsClient."""

import asyncio
import json
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

from crypto_news import AsyncCryptoNewsClient, RateLimitError, APIError, NetworkError


class _FakeResponse:
    """Minimal mock for aiohttp.ClientResponse."""

    def __init__(self, data: dict, status: int = 200, headers: dict | None = None):
        self._data = data
        self.status = status
        self.headers = headers or {}

    async def json(self):
        return self._data

    async def text(self):
        return json.dumps(self._data)

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        pass


class _FakeSession:
    """Minimal mock for aiohttp.ClientSession."""

    def __init__(self, response: _FakeResponse):
        self._response = response
        self.closed = False
        self.get_url: str | None = None

    def get(self, url: str, **kwargs):
        self.get_url = url
        return self._response

    async def close(self):
        self.closed = True


class TestAsyncCryptoNewsClient(unittest.TestCase):
    """Test suite for the async client."""

    def _run(self, coro):
        return asyncio.get_event_loop().run_until_complete(coro)

    def test_default_base_url(self):
        client = AsyncCryptoNewsClient()
        self.assertEqual(client.base_url, "https://cryptocurrency.cv/api")

    def test_custom_base_url(self):
        client = AsyncCryptoNewsClient(base_url="https://custom.com/api/")
        self.assertEqual(client.base_url, "https://custom.com/api")

    def test_get_news(self):
        articles = [{"title": "BTC up", "source": "CoinDesk"}]
        response = _FakeResponse({"articles": articles})
        session = _FakeSession(response)

        async def _test():
            client = AsyncCryptoNewsClient()
            client._session = session
            result = await client.get_news(limit=5)
            self.assertEqual(len(result), 1)
            self.assertEqual(result[0]["title"], "BTC up")
            self.assertIn("/news?limit=5", session.get_url)

        self._run(_test())

    def test_get_news_with_category(self):
        response = _FakeResponse({"articles": []})
        session = _FakeSession(response)

        async def _test():
            client = AsyncCryptoNewsClient()
            client._session = session
            await client.get_news(limit=3, category="defi")
            self.assertIn("/defi?limit=3", session.get_url)

        self._run(_test())

    def test_get_news_with_search(self):
        response = _FakeResponse({"articles": []})
        session = _FakeSession(response)

        async def _test():
            client = AsyncCryptoNewsClient()
            client._session = session
            await client.get_news(limit=3, search="solana")
            self.assertIn("/search?q=solana&limit=3", session.get_url)

        self._run(_test())

    def test_search(self):
        response = _FakeResponse({"articles": [{"title": "ETH merge"}]})
        session = _FakeSession(response)

        async def _test():
            client = AsyncCryptoNewsClient()
            client._session = session
            result = await client.search("ethereum", limit=3)
            self.assertEqual(len(result), 1)

        self._run(_test())

    def test_get_sources(self):
        response = _FakeResponse({"sources": [{"key": "coindesk"}]})
        session = _FakeSession(response)

        async def _test():
            client = AsyncCryptoNewsClient()
            client._session = session
            sources = await client.get_sources()
            self.assertEqual(sources[0]["key"], "coindesk")

        self._run(_test())

    def test_get_trending(self):
        response = _FakeResponse({
            "trending": [{"topic": "BTC", "count": 10, "sentiment": "bullish"}]
        })
        session = _FakeSession(response)

        async def _test():
            client = AsyncCryptoNewsClient()
            client._session = session
            result = await client.get_trending(limit=5)
            self.assertEqual(len(result["trending"]), 1)

        self._run(_test())

    def test_get_health(self):
        response = _FakeResponse({"status": "healthy"})
        session = _FakeSession(response)

        async def _test():
            client = AsyncCryptoNewsClient()
            client._session = session
            result = await client.get_health()
            self.assertEqual(result["status"], "healthy")

        self._run(_test())

    def test_context_manager(self):
        response = _FakeResponse({"articles": []})
        session = _FakeSession(response)

        async def _test():
            async with AsyncCryptoNewsClient() as client:
                client._session = session
                await client.get_news()
            self.assertTrue(session.closed)

        self._run(_test())

    def test_api_error_on_non_200(self):
        response = _FakeResponse({"error": "not found"}, status=404)
        session = _FakeSession(response)

        async def _test():
            client = AsyncCryptoNewsClient()
            client._session = session
            with self.assertRaises(APIError) as ctx:
                await client.get_news()
            self.assertEqual(ctx.exception.status_code, 404)

        self._run(_test())

    def test_rate_limit_error(self):
        response = _FakeResponse({}, status=429, headers={"Retry-After": "60"})
        session = _FakeSession(response)

        async def _test():
            client = AsyncCryptoNewsClient()
            client._session = session
            with self.assertRaises(RateLimitError) as ctx:
                await client.get_news()
            self.assertEqual(ctx.exception.retry_after, 60.0)

        self._run(_test())


if __name__ == "__main__":
    unittest.main()

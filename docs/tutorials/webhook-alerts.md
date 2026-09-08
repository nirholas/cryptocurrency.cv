# 🔔 Webhook, Telegram & Discord Alerts

Deliver a triggered alert straight into your own system, a Telegram chat, or a Discord channel, instead of polling `/api/alerts` for changes.

Every webhook we send is signed with HMAC-SHA256, so you can prove the request came from us and that nobody rewrote the price on the way.

---

## Channels

| `notificationChannel` | Where it goes | Required `delivery` fields |
|---|---|---|
| `webhook` | Any HTTPS URL you own | `webhookUrl` (`webhookSecret` optional, generated if omitted) |
| `discord` | A Discord channel webhook | `discordWebhookUrl` |
| `telegram` | A Telegram chat, group, or channel | `telegramBotToken`, `telegramChatId` |
| `email` | The address on the alert | `email` (top level, not inside `delivery`) |
| `push` | Browser web push | none |
| `none` | Recorded only, nobody is notified | none |

Every delivery gets a **5 second timeout**, **3 retries** with exponential back-off, and a per-host circuit breaker, so one dead endpoint never delays anybody else's alerts.

---

## Create a webhook alert

```bash
curl -sS -X POST https://cryptocurrency.cv/api/alerts \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "price",
    "userId": "demo-user",
    "coin": "Bitcoin",
    "coinId": "bitcoin",
    "condition": "above",
    "threshold": 100000,
    "notificationChannel": "webhook",
    "delivery": {
      "webhookUrl": "https://hooks.example.com/crypto-alerts"
    }
  }'
```

Response:

```json
{
  "success": true,
  "alert": {
    "id": "pa_9f2c1b",
    "userId": "demo-user",
    "coinId": "bitcoin",
    "condition": "above",
    "threshold": 100000,
    "notifyVia": ["webhook"],
    "active": true,
    "triggered": false,
    "createdAt": "2026-08-28T00:00:00.000Z"
  },
  "webhookSecret": "3f8c…64 hex characters…a91d"
}
```

`webhookSecret` is returned **once**, at creation, and never again. Store it: it is the key you verify signatures with. Supply your own instead by adding `"webhookSecret": "…"` (16 characters minimum) inside `delivery`.

---

## What we POST

When the alert fires we send this JSON body, and only this body, to your URL:

```json
{
  "event": "alert.triggered",
  "alertId": "pa_9f2c1b",
  "type": "price_above",
  "title": "Bitcoin (BTC)",
  "message": "Bitcoin is now $100,412 (above $100,000)",
  "triggeredAt": "2026-08-28T14:03:11.482Z",
  "url": "https://cryptocurrency.cv/coin/bitcoin",
  "coin": { "id": "bitcoin", "symbol": "btc", "name": "Bitcoin" },
  "threshold": 100000,
  "price": 100412
}
```

Keyword alerts send `"type": "keyword"`, the article headline as `title`, the article link as `url`, and a `keywords` array instead of `coin` / `threshold` / `price`.

Headers:

| Header | Value |
|---|---|
| `Content-Type` | `application/json` |
| `X-Alert-Id` | The alert's id |
| `X-Alert-Event` | `alert.triggered` |
| `X-Alert-Timestamp` | ISO-8601 trigger time |
| `X-Signature-256` | `sha256=` followed by the HMAC-SHA256 of the **raw body**, hex encoded |

---

## Verify the signature

The signature covers the raw request bytes, so compute it **before** parsing JSON. Re-serialising the body first will produce a different string and the check will fail.

### Node.js (Express)

```js
import express from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';

const app = express();
const SECRET = process.env.ALERT_WEBHOOK_SECRET;

// Keep the raw bytes: express.json() would hand us a re-serialised object.
app.post('/crypto-alerts', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.get('X-Signature-256') || '';
  const expected = 'sha256=' + createHmac('sha256', SECRET).update(req.body).digest('hex');

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'bad signature' });
  }

  const alert = JSON.parse(req.body.toString('utf8'));
  console.log(`${alert.title}: ${alert.message}`);
  res.status(204).end();
});

app.listen(8080);
```

### Python (Flask)

```python
import hmac
import hashlib
import json
import os

from flask import Flask, request, jsonify

app = Flask(__name__)
SECRET = os.environ["ALERT_WEBHOOK_SECRET"].encode()


@app.post("/crypto-alerts")
def crypto_alerts():
    raw = request.get_data()  # raw bytes, not request.json
    expected = "sha256=" + hmac.new(SECRET, raw, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected, request.headers.get("X-Signature-256", "")):
        return jsonify(error="bad signature"), 401

    alert = json.loads(raw)
    print(f"{alert['title']}: {alert['message']}")
    return "", 204


if __name__ == "__main__":
    app.run(port=8080)
```

Return any 2xx status. A non-2xx response is retried up to three times, then recorded on the alert as `lastDelivery` with the status and error so you can see the failure without reading our logs.

---

## Telegram

Create a bot with [@BotFather](https://t.me/BotFather), add it to the chat, then read the numeric chat id (send a message and call `https://api.telegram.org/bot<TOKEN>/getUpdates`).

```bash
curl -sS -X POST https://cryptocurrency.cv/api/alerts \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "keyword",
    "userId": "demo-user",
    "keywords": ["etf", "sec"],
    "notificationChannel": "telegram",
    "delivery": {
      "telegramBotToken": "123456789:AA-your-bot-token",
      "telegramChatId": "-1001234567890"
    }
  }'
```

`telegramChatId` accepts a numeric id (negative for groups and channels) or an `@channelname`. Messages are sent with `parse_mode: HTML`, and every value we interpolate is escaped first.

---

## Discord

Create a channel webhook in **Server Settings → Integrations → Webhooks**, then:

```bash
curl -sS -X POST https://cryptocurrency.cv/api/alerts \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "price",
    "userId": "demo-user",
    "coin": "Ethereum",
    "coinId": "ethereum",
    "condition": "below",
    "threshold": 2000,
    "notificationChannel": "discord",
    "delivery": {
      "discordWebhookUrl": "https://discord.com/api/webhooks/123456789/abcdef"
    }
  }'
```

The alert arrives as a single embed: coin name and ticker as the title, the alert message as the description, and trigger / threshold / price as inline fields. Green when the price rose through the threshold, red when it fell.

---

## Several channels at once

Send `notifyVia` instead of `notificationChannel` to fan one alert out:

```bash
curl -sS -X POST https://cryptocurrency.cv/api/alerts \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "price",
    "userId": "demo-user",
    "coin": "Solana",
    "coinId": "solana",
    "condition": "above",
    "threshold": 300,
    "notifyVia": ["push", "webhook", "discord"],
    "delivery": {
      "webhookUrl": "https://hooks.example.com/crypto-alerts",
      "discordWebhookUrl": "https://discord.com/api/webhooks/123456789/abcdef"
    }
  }'
```

Channels are delivered in parallel, and one failing channel does not stop the others.

---

## Change delivery on an existing alert

`PATCH /api/alerts` moves an alert onto a different channel without recreating it. The `delivery` block is merged, so you can send only the field you are changing.

```bash
curl -sS -X PATCH https://cryptocurrency.cv/api/alerts \
  -H 'Content-Type: application/json' \
  -d '{
    "alertId": "pa_9f2c1b",
    "notificationChannel": "telegram",
    "delivery": {
      "telegramBotToken": "123456789:AA-your-bot-token",
      "telegramChatId": "@my_alerts_channel"
    }
  }'
```

---

## Validation errors

Endpoints are validated before anything is stored, so a misconfigured alert fails at create time rather than silently never firing:

```json
{
  "error": "Invalid notification settings",
  "issues": [
    {
      "field": "delivery.telegramChatId",
      "message": "delivery.telegramChatId is required when the telegram channel is selected"
    }
  ]
}
```

Rules worth knowing:

- `webhookUrl` must be `https://` and must resolve to a public host. Loopback, link-local (`169.254.*`), and private ranges (`10.*`, `192.168.*`, `172.16-31.*`) are rejected in production. They are allowed in local development so you can point an alert at `http://localhost:8080`.
- `discordWebhookUrl` must be a real Discord webhook URL.
- `telegramBotToken` must match BotFather's `<digits>:<token>` format.
- `webhookSecret`, when you supply it, must be at least 16 characters.
- Unknown keys inside `delivery` are rejected, so a typo is an error rather than a silently ignored field.

---

## Related

- [User Alerts Tutorial](user-alerts.md) — alert rules, conditions, and the polling API
- [Real-Time SSE](realtime-sse.md) — stream alerts over `/api/alerts/stream` instead of receiving pushes
- [API Reference](../API.md)

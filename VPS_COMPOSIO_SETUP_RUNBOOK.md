# OpenClaw + Composio VPS Runbook (Beginner-Friendly)

This is a quick reference for your current setup.
It explains both:
- **What** to do
- **Why** you are doing it

---

## 1) Current architecture (simple view)

1. **OpenClaw Gateway** runs on the VPS, private to the machine (`127.0.0.1:18789`).
2. **Composio Bridge** runs on the VPS, private to the machine (`127.0.0.1:3001`).
3. **Caddy** is the public web server on ports `80/443`.
4. Public webhook URL is: `https://hook.sundayclaw.com/composio/webhook`
5. Caddy forwards webhook requests to Composio Bridge on `127.0.0.1:3001`.

Why this design:
- Keeps internal services private.
- Exposes only the one endpoint Composio needs.
- Easier to secure and debug.

---

## 2) VPS baseline you confirmed

- OS: `Ubuntu 24.04.4 LTS`
- VPS IP: `31.97.211.229`
- OpenClaw service: `openclaw-gateway.service` (user systemd service)
- Composio bridge service: `composio-bridge.service` (system service)

Check commands:

```bash
uname -a
cat /etc/os-release
systemctl --user status openclaw-gateway.service --no-pager
systemctl status composio-bridge.service --no-pager
```

---

## 3) DNS setup (safe option)

### What you used
- Keep main domain (`@`) for your existing site.
- Create a subdomain for webhooks:
  - Type: `A`
  - Name: `hook`
  - Points to: `31.97.211.229`
  - TTL: `300` during setup

Why:
- You do not break your main site.
- Webhook traffic is isolated to one subdomain.

Verify DNS:

```bash
dig +short hook.sundayclaw.com
```

Expected:

```text
31.97.211.229
```

---

## 4) Firewall (UFW)

### What you configured
- Default deny incoming
- Allow only:
  - `22/tcp` (SSH, rate-limited)
  - `80/tcp` (HTTP)
  - `443/tcp` (HTTPS)

Commands:

```bash
apt update && apt install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw limit 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status verbose
```

Why:
- Blocks accidental public exposure of internal ports.
- Keeps only remote admin + web ingress open.

---

## 5) Composio Bridge service

### What is running
- Service file: `/etc/systemd/system/composio-bridge.service`
- Process: `node /opt/composio-bridge/bridge.mjs`
- Listen address: `127.0.0.1:3001`

Check:

```bash
systemctl status composio-bridge.service --no-pager -l
systemctl cat composio-bridge.service
```

Why:
- Bridge receives webhook events and hands them into your automation flow.
- Binding to `127.0.0.1` means not directly internet-exposed.

---

## 6) Public HTTPS with Caddy

### What you configured
`/etc/caddy/Caddyfile`

```caddy
hook.sundayclaw.com {
    reverse_proxy 127.0.0.1:3001
}
```

Commands used:

```bash
apt update
apt install -y caddy
caddy validate --config /etc/caddy/Caddyfile
systemctl enable --now caddy
systemctl restart caddy
systemctl status caddy --no-pager -l
```

Why:
- Composio requires a public HTTPS URL.
- Caddy auto-manages SSL certificates and forwards safely to local bridge.

---

## 7) Composio webhook settings

Recommended values in Composio dashboard:

1. Webhook URL: `https://hook.sundayclaw.com/composio/webhook`
2. Version: `V3`
3. Event types:
   - `composio.trigger.message` (required for trigger payloads)
   - `composio.connected_account.expired` (recommended for auth-expiry alerts)
4. Keep secret stable unless rotating intentionally.

Why:
- V3 is current payload format.
- Expiry event helps avoid silent breakage when OAuth expires.

---

## 8) End-to-end verification checklist

Run in this order:

1. DNS resolves:

```bash
dig +short hook.sundayclaw.com
```

2. HTTP redirects to HTTPS:

```bash
curl -i http://hook.sundayclaw.com/composio/webhook
```

Expected: `308 Permanent Redirect`

3. HTTPS endpoint is reachable:

```bash
curl -i https://hook.sundayclaw.com/composio/webhook
```

Expected: HTTP response (often `404` for GET is fine)

4. POST works:

```bash
curl -i -X POST https://hook.sundayclaw.com/composio/webhook \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected in your setup: `HTTP/2 202` and `{"ok":true}`

5. Live logs while testing:

```bash
journalctl -u composio-bridge.service -f
```

---

## 9) OpenClaw reliability settings already done

Commands:

```bash
loginctl enable-linger root
systemctl --user enable --now openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

Why:
- Keeps OpenClaw running even when you disconnect SSH or close your laptop.

---

## 10) Backup setup already done

Script:
- `/usr/local/bin/backup-openclaw.sh`

Backup location:
- `/root/backups/openclaw`

Schedule:
- Daily at `03:15` via cron

Why:
- Protects `.openclaw` state and your `/root/openclaw-workspace`.

Check:

```bash
crontab -l
ls -lh /root/backups/openclaw | tail -n 5
```

---

## 11) Common issues and what they mean

1. `curl: Failed to connect ... port 443`
- Meaning: DNS exists, but no HTTPS server is listening.
- Fix: Start/fix Caddy.

2. `Cannot GET /composio/webhook` on browser/curl GET
- Meaning: Route is reachable. GET not supported.
- Fix: Test with POST (this is normal for webhooks).

3. `Gateway did not become healthy after restart` but `openclaw health --json` says `"ok": true`
- Meaning: restart probe likely timed out but runtime is healthy.
- Fix: verify service + health, ignore if both are healthy.

---

## 12) Security to-do (important)

Rotate these secrets if they were ever shown in terminal screenshots/chat:

1. Composio API key
2. Composio webhook secret
3. OpenClaw hook token
4. Any provider API tokens

Why:
- Once exposed in logs/chat, treat as compromised.

---

## 13) Day-2 operations (quick commands)

Service status:

```bash
systemctl --user status openclaw-gateway.service --no-pager
systemctl status composio-bridge.service --no-pager
systemctl status caddy --no-pager
ufw status verbose
```

Logs:

```bash
journalctl --user -u openclaw-gateway.service -n 80 --no-pager
journalctl -u composio-bridge.service -n 80 --no-pager
journalctl -u caddy -n 80 --no-pager
```

Connectivity checks:

```bash
dig +short hook.sundayclaw.com
curl -i https://hook.sundayclaw.com/composio/webhook
```

---

## 14) Why Composio needs a public domain (plain language)

Composio runs on Composio's servers, not inside your VPS.
When an event happens, Composio must send the event to your server.
It can only send to a public internet URL, not to `127.0.0.1`.

That is why you expose one public URL (`hook.sundayclaw.com`) and keep the app itself private on loopback.

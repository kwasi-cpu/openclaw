# OpenClaw + Composio VPS: 10-Command Emergency Checklist

Use this when something breaks and you need quick checks.

## Command 1: OpenClaw service status
```bash
systemctl --user status openclaw-gateway.service --no-pager
```
Why: confirms OpenClaw gateway is running.

## Command 2: Composio bridge status
```bash
systemctl status composio-bridge.service --no-pager
```
Why: confirms webhook bridge process is running.

## Command 3: Caddy status
```bash
systemctl status caddy --no-pager
```
Why: confirms HTTPS reverse proxy is running.

## Command 4: Firewall rules
```bash
ufw status verbose
```
Why: confirms only 22/80/443 are publicly open.

## Command 5: DNS check
```bash
dig +short hook.sundayclaw.com
```
Why: confirms webhook subdomain points to your VPS IP.

## Command 6: HTTP -> HTTPS redirect check
```bash
curl -i http://hook.sundayclaw.com/composio/webhook
```
Why: should return `308` redirect to HTTPS.

## Command 7: HTTPS endpoint reachability
```bash
curl -i https://hook.sundayclaw.com/composio/webhook
```
Why: confirms port 443 and route are reachable.

## Command 8: Webhook POST test
```bash
curl -i -X POST https://hook.sundayclaw.com/composio/webhook \
  -H "Content-Type: application/json" \
  -d '{}'
```
Why: proves bridge can accept webhook payloads. Expected in your setup: `202 {"ok":true}`.

## Command 9: Live bridge logs
```bash
journalctl -u composio-bridge.service -f
```
Why: shows incoming webhook events in real time.

## Command 10: Live OpenClaw logs
```bash
journalctl --user -u openclaw-gateway.service -f
```
Why: confirms events/actions are flowing into OpenClaw.

## If SSH lockout happens
Use Hostinger VPS console and run:
```bash
ufw disable
```
Then re-apply rules carefully.

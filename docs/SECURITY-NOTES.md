# CloudGuard Platform Security Notes

## 1. Authentication & Cookie-Only Session Model

The platform uses HTTP-only, SameSite=Strict cookies (`cg_token`) to store JWT session tokens.
- **Cookie Security**: In non-local profiles (`production`, `staging`, etc.), cookies are strictly required to be `Secure` (`cloudguard.cookie.secure=true`). In the `local` development profile, `Secure=false` is allowed for HTTP localhost access.
- **XSRF Protection**: The `XSRF-TOKEN` cookie is set with `SameSite=Strict` and mirrors the `cloudguard.cookie.secure` flag. Mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) require the `X-XSRF-TOKEN` header.
- **CSRF / Origin Verification**: An `OriginRefererFilter` strictly requires that any cookie-authenticated mutating request must present either an `Origin` or `Referer` header matching `cloudguard.allowed-origins`. If neither is provided, or if the origin is untrusted, the request is blocked with HTTP `403 Forbidden`.

## 2. JWT Lifetime & Server-Side Revocation (TODO)

- **JWT Lifetime**: Configured via `cloudguard.jwt.expiration-ms` with a default lifetime of **3,600,000 ms (1 hour)**. The cookie `Max-Age` header matches this expiration (3600 seconds).
- **Server-Side Token Revocation (jti Denylist)**:
  - *Current Status*: Stateless JWT validation. On `/api/auth/logout`, the server clears the client cookie (`Max-Age=0`) and records an audit log. However, because JWT validation is cryptographically stateless, an intercepted valid token remains mathematically valid until expiration.
  - *Planned Architecture (TODO)*: Implement a distributed token revocation store (e.g., Redis or database-backed denylist) keyed by unique JWT IDs (`jti`). When a user logs out or is deactivated/revoked by an administrator, the `jti` will be added to the denylist with a TTL equal to the token's remaining lifetime.
  - *Rationale for Current Phasing*: A Redis dependency has not yet been introduced into the core stack, and in-memory single-instance denylists do not survive restarts or horizontally scale across multiple backend replicas. The 1-hour expiration minimizes the exposure window until distributed caching is provisioned.

## 3. Rate Limiting & Account Lockout

- Brute-force protection is enforced by `AuthenticationService` and keyed strictly by **Client IP + Username** (`<ipAddress>:<username>`).
- This design ensures that malicious login attempts from a hostile IP address do not cause a Denial of Service (DoS) against legitimate users attempting to authenticate from trusted enterprise networks.
- Lockout duration is temporary (default: **15 minutes**) and configurable via `cloudguard.security.lockout-duration-minutes`.
- Behind reverse proxies, client IP resolution honours `X-Forwarded-For` only when the request originates from an explicitly trusted proxy defined in `cloudguard.trusted-proxies`.

## 4. DB Lockout: Denial-of-Service Tradeoff

The database-level lockout (`users.failed_login_count` / `locked_until`) is per-username, not per-IP:username. This means a malicious actor who knows a valid username can intentionally trigger lockout by sending 5 wrong-password requests, denying the legitimate user access for 15 minutes (or whatever the lockout window is).

**Tradeoff accepted**: We chose per-username DB lockout for simplicity and to guarantee that brute-force against a specific user is stopped regardless of how many IPs the attacker rotates. The in-memory IP:username rate limiter provides an additional layer that cannot be weaponised across IPs. The temporary lockout window (default 15 minutes) limits the DoS impact. Production deployments may wish to add CAPTCHA or progressive delays as a middle ground.

## 5. HTTP 423 vs 401: Account-Existence Enumeration

When a user is locked out, the backend returns HTTP `423 Locked` with `{"error": "ACCOUNT_LOCKED"}`. This differs from the `401 Unauthorized` returned for wrong credentials on non-locked accounts. An attacker can use this difference to confirm whether a given username exists and is locked.

**Tradeoff accepted**: Returning `423` provides clear user feedback ("your account is locked, try later") which is important for legitimate users. Returning a blanket `401` for locked accounts would prevent enumeration but would confuse users who believe their password is wrong. This is a deliberate UX-over-stealth choice; compensating controls include IP-based rate limiting and logging of enumeration-pattern activity.

## 6. In-Memory Rate Limiter: Restart Resets

The `ipUserAttempts` map in `AuthenticationService` is an in-memory `ConcurrentHashMap`. On application restart (or rolling deployment across multiple replicas), **all in-memory lockout state is lost**. This means:
- An attacker who has been rate-limited can regain their attempt budget by waiting for a deployment.
- Horizontal scaling does not share rate-limit state across replicas; each instance maintains its own map.
- The map is bounded (max 10,000 entries) with TTL eviction to prevent unbounded memory growth, but eviction logic runs inline on each login attempt, not on a background timer.

**Mitigation**: The database-level lockout (`users.locked_until`) is the durable backstop. Even if the in-memory map is lost, users who have already been locked in the DB remain locked until the timeout expires. For production environments requiring durable cross-replica rate limiting, a shared store (e.g., Redis) is recommended.


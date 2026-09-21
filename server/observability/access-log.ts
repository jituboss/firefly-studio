import 'server-only';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import {
  clientIp,
  formatAccessLine,
  isNoiseRequest,
  isProbeRequest,
  redactUrl,
  responseBytes,
} from '@/lib/access-log';
import { logger } from '@/lib/logger';

/**
 * E1-16 — nginx-style access logging to stdout, so `docker logs` answers
 * "who hit what, and did it work".
 *
 * **Why this patches `node:http` rather than using middleware.**
 *
 * Middleware was the obvious place and it cannot do the job:
 *
 *   - it runs on the edge runtime, where there is no socket and so no client
 *     address except whatever header the client itself supplied;
 *   - it is excluded from `/api/*` by this app's matcher, which is exactly the
 *     traffic an operator most wants to see;
 *   - and it cannot observe the response. `NextResponse.next()` hands control
 *     onward without resolving to what was eventually sent, so there is no
 *     status, no size and no duration — three of the five fields that make an
 *     access log worth having.
 *
 * Patching `Server.prototype.emit` is what APM agents do, and it is aimed at
 * Node's own API rather than at any Next.js internal, which is why it is stable
 * across Next upgrades. It sees every request: pages, RSC payloads, route
 * handlers, static files.
 *
 * Nothing here may throw into the request path. A logger that can take the
 * server down is worse than no logger, so the whole hook is wrapped and a
 * failure disables it rather than propagating.
 */

let installed = false;

export function installAccessLog(): void {
  if (installed) return;

  const enabled = process.env.ACCESS_LOG !== 'false';
  if (!enabled) return;

  const logStatic = process.env.ACCESS_LOG_STATIC === 'true';
  const logProbes = process.env.ACCESS_LOG_PROBES === 'true';
  /*
   * Off by default, and that default is the safe one. With nothing in front of
   * the app, `x-forwarded-for` is set by the client and trusting it means any
   * visitor can write any address they like into the operator's logs — which
   * is worse than useless, because the log then looks authoritative.
   *
   * Behind a reverse proxy (nginx, Traefik, Cloudflare, a TrueNAS app proxy)
   * set ACCESS_LOG_TRUST_PROXY=true and the forwarded address is used.
   */
  const trustProxy = process.env.ACCESS_LOG_TRUST_PROXY === 'true';

  try {
    /*
     * `process.getBuiltinModule`, not `require('node:http')` or a dynamic
     * `import()`.
     *
     * Both of those are module specifiers, and webpack resolves them while
     * building — including for the EDGE bundle, which instrumentation.ts is
     * also compiled into. There it fails outright:
     *   UnhandledSchemeError: Reading from "node:http" is not handled by plugins
     * and takes the whole production build with it. The runtime guard in
     * instrumentation.ts does not help, because the failure happens at build
     * time and the guard is a value only known at run time.
     *
     * `getBuiltinModule` is a function call with a string argument. No bundler
     * treats it as an import, so the edge bundle never sees node:http at all,
     * and the node runtime gets the real module.
     *
     * Available from Node 20.16 and 22.3. `engines` here allows 20.11, so an
     * older 20.x returns undefined and access logging is skipped with a warning
     * rather than crashing the process on boot.
     */
    const http = process.getBuiltinModule?.('node:http') as
      { Server: { prototype: Server } } | undefined;
    if (!http) {
      logger.warn(
        { node: process.version },
        'Access logging needs Node 20.16+ for process.getBuiltinModule; skipping',
      );
      return;
    }
    const proto = http.Server.prototype as unknown as {
      emit: (event: string, ...args: unknown[]) => boolean;
    };
    const originalEmit = proto.emit;

    proto.emit = function patchedEmit(event: string, ...args: unknown[]): boolean {
      if (event === 'request') {
        try {
          record(args[0] as IncomingMessage, args[1] as ServerResponse, {
            logStatic,
            logProbes,
            trustProxy,
          });
        } catch {
          // A malformed request must still be served.
        }
      }
      return originalEmit.apply(this, [event, ...args]);
    };

    installed = true;
    logger.info(
      { trustProxy, logStatic, logProbes },
      'Access logging on — set ACCESS_LOG=false to silence it',
    );
  } catch (error) {
    logger.warn({ err: error }, 'Access logging could not be installed; continuing without it');
  }
}

function record(
  req: IncomingMessage,
  res: ServerResponse,
  options: { logStatic: boolean; logProbes: boolean; trustProxy: boolean },
): void {
  const target = req.url ?? '/';
  const path = target.split('?')[0] ?? '/';

  if (!options.logStatic && isNoiseRequest(path)) return;
  if (!options.logProbes && isProbeRequest(path)) return;

  // `performance.now()` rather than `process.hrtime.bigint()`: it is already a
  // float, so reading it needs no Number() — which is a lint error outside
  // lib/money.ts, and rightly so.
  const startedAt = performance.now();

  /*
   * `finish`, not `close`.
   *
   * `finish` fires when the response has been handed to the OS; `close` fires
   * afterwards and ALSO fires when the client hangs up mid-response, which
   * would log a request twice. `once` on each, with a guard, gets the aborted
   * case recorded exactly once — and an aborted request is worth a line,
   * because "the user gave up" is a real answer to "why is this slow".
   */
  let done = false;
  const finish = (aborted: boolean) => {
    if (done) return;
    done = true;

    const durationMs = performance.now() - startedAt;
    const entry = {
      ip: clientIp(req.headers, req.socket?.remoteAddress, options.trustProxy),
      method: req.method ?? '-',
      // Redacted: /verify-email/confirm?token=… and /reset-password?token=…
      // carry single-use account-takeover credentials, and this line goes to
      // stdout, which is the most-forwarded artefact a deployment produces.
      url: redactUrl(target),
      status: res.statusCode,
      bytes: responseBytes(res.getHeader('content-length')),
      durationMs: Math.round(durationMs * 10) / 10,
      userAgent: req.headers['user-agent'] ?? '-',
      /*
       * The referer gets the SAME redaction as the URL, and for a sharper
       * reason: when someone opens /reset-password?token=… and the page then
       * requests anything at all, the browser sends that whole URL — token
       * included — as the referer. Redacting only `url` would have closed the
       * front door and left this one open, logging the same credential one
       * line later under a different key.
       */
      referer: req.headers.referer ? redactUrl(req.headers.referer) : undefined,
      ...(aborted ? { aborted: true } : {}),
    };

    /*
     * The message is the human-readable combined line and the fields are
     * structured alongside it, so `docker logs` is scannable by eye while a
     * collector can still filter on `status>=500`. pino-pretty prints the
     * message in development; JSON carries both in production.
     */
    logger.info(entry, formatAccessLine(entry));
  };

  res.once('finish', () => finish(false));
  res.once('close', () => finish(true));
}

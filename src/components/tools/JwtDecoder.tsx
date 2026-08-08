'use client';

import { KeyRound, ShieldAlert, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ToolColumns } from '@/components/ToolShell';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { CopyButton } from '@/components/ui/CopyButton';
import { Badge, Callout } from '@/components/ui/Feedback';
import { Textarea } from '@/components/ui/Input';
import { JWT_CLAIM_DESCRIPTIONS, JWT_TIME_CLAIMS, decodeJwt, jwtValidity } from '@/lib/encoding';
import { useMounted } from '@/lib/hooks';
import { cn, relativeTime } from '@/lib/utils';

/**
 * A JWT signed with HS256 and the key "secret" — a well-known example token, so
 * the sample button demonstrates the tool without anyone pasting a real one.
 */
const SAMPLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

export function JwtDecoder() {
  const mounted = useMounted();
  const [token, setToken] = useState('');

  const result = useMemo(() => (token.trim() === '' ? null : decodeJwt(token)), [token]);
  const jwt = result?.ok ? result.jwt : null;

  const validity = useMemo(() => {
    // Time-dependent, so only computed after mount to keep prerender stable.
    if (!jwt || !mounted) return null;
    return jwtValidity(jwt.payload);
  }, [jwt, mounted]);

  return (
    <div className="space-y-5">
      <Callout tone="warning" icon={<ShieldAlert />} title="This decodes, it does not verify">
        A JWT&apos;s payload is only base64 — anyone can read it, and anyone can forge one without the signing
        key. Decoding here proves nothing about authenticity. Everything happens in your browser and the token
        is never sent anywhere, but treat a token you didn&apos;t issue as untrusted input.
      </Callout>

      <ToolColumns
        main={
          <>
            <Card flush>
              <div className="border-b border-border px-5 py-3.5">
                <CardHeader
                  title="Token"
                  icon={<KeyRound />}
                  actions={
                    <>
                      <Button size="sm" variant="ghost" onClick={() => setToken(SAMPLE)}>
                        Sample
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        leadingIcon={<Trash2 />}
                        onClick={() => setToken('')}
                        disabled={token === ''}
                        aria-label="Clear token"
                        className="text-fg-subtle hover:text-danger"
                      />
                    </>
                  }
                />
              </div>
              <div className="p-4">
                <label htmlFor="jwt-input" className="sr-only">
                  JWT to decode
                </label>
                <Textarea
                  id="jwt-input"
                  mono
                  rows={5}
                  value={token}
                  onChange={(event) => setToken(event.currentTarget.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.…"
                  className="break-all"
                />

                {/* Colour the three segments so the structure is visible. */}
                {jwt && (
                  <p className="mt-3 break-all font-mono text-[11px] leading-relaxed">
                    <span className="text-danger">{jwt.raw.header}</span>
                    <span className="text-fg-subtle">.</span>
                    <span className="text-accent-text">{jwt.raw.payload}</span>
                    <span className="text-fg-subtle">.</span>
                    <span className="text-success">{jwt.raw.signature}</span>
                  </p>
                )}
              </div>
            </Card>

            {result && !result.ok && <Callout tone="danger">{result.error}</Callout>}

            {jwt && (
              <>
                <SegmentCard title="Header" tone="danger" data={jwt.header} />
                <SegmentCard title="Payload" tone="accent" data={jwt.payload} />

                <Card>
                  <CardHeader title="Signature" description="Shown as-is; verifying it needs the signing key." />
                  <pre className="mt-3 overflow-x-auto break-all rounded-xl border border-border bg-bg-subtle p-3.5 font-mono text-[12px] text-success">
                    {jwt.signature || '(none — this is an unsigned token)'}
                  </pre>
                </Card>
              </>
            )}
          </>
        }
        side={
          jwt ? (
            <>
              <Card>
                <CardHeader title="Status" />
                {validity === null ? (
                  <p className="mt-3 text-[13px] text-fg-muted">Checking…</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {validity.expired ? (
                        <Badge tone="danger">Expired</Badge>
                      ) : validity.notYetValid ? (
                        <Badge tone="warning">Not yet valid</Badge>
                      ) : validity.expiresAt ? (
                        <Badge tone="success">Currently valid</Badge>
                      ) : (
                        <Badge tone="neutral">No expiry claim</Badge>
                      )}
                      {typeof jwt.header.alg === 'string' && <Badge tone="accent">{jwt.header.alg}</Badge>}
                      {jwt.header.alg === 'none' && <Badge tone="danger">Unsigned</Badge>}
                    </div>

                    <dl className="space-y-2 text-[13px]">
                      {validity.issuedAt && (
                        <TimeRow label="Issued" date={validity.issuedAt} />
                      )}
                      {validity.notBefore && <TimeRow label="Valid from" date={validity.notBefore} />}
                      {validity.expiresAt && (
                        <TimeRow label="Expires" date={validity.expiresAt} danger={validity.expired} />
                      )}
                    </dl>
                  </div>
                )}
              </Card>

              <Card>
                <CardHeader title="Claims explained" />
                <dl className="mt-3 divide-y divide-border">
                  {Object.keys(jwt.payload)
                    .filter((key) => key in JWT_CLAIM_DESCRIPTIONS)
                    .map((key) => (
                      <div key={key} className="py-2 first:pt-0 last:pb-0">
                        <dt className="font-mono text-[12px] font-semibold text-accent-text">{key}</dt>
                        <dd className="mt-0.5 text-[12px] text-fg-muted">{JWT_CLAIM_DESCRIPTIONS[key]}</dd>
                      </div>
                    ))}
                </dl>
              </Card>
            </>
          ) : (
            <Card>
              <p className="py-6 text-center text-[13px] text-fg-muted">
                Paste a token to see its header, payload and expiry.
              </p>
            </Card>
          )
        }
      />
    </div>
  );
}

function TimeRow({ label, date, danger = false }: { label: string; date: Date; danger?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="text-right">
        <span className={cn('block font-medium', danger ? 'text-danger' : 'text-fg')}>
          {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)}
        </span>
        <span className="block text-[11px] text-fg-subtle">{relativeTime(date.getTime())}</span>
      </dd>
    </div>
  );
}

function SegmentCard({
  title,
  tone,
  data,
}: {
  title: string;
  tone: 'danger' | 'accent';
  data: Record<string, unknown>;
}) {
  const json = JSON.stringify(data, null, 2);

  return (
    <Card flush>
      <div className="border-b border-border px-5 py-3.5">
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              {title}
              <span
                className={cn('size-2 rounded-full', tone === 'danger' ? 'bg-danger' : 'bg-accent')}
                aria-hidden="true"
              />
            </span>
          }
          actions={<CopyButton value={json} label="Copy" />}
        />
      </div>
      <div className="p-4">
        <pre className="overflow-x-auto rounded-xl border border-border bg-bg-subtle p-3.5 font-mono text-[12px] leading-relaxed text-fg">
          {json}
        </pre>

        {/* Time claims rendered as dates, since a raw epoch tells nobody anything. */}
        {JWT_TIME_CLAIMS.some((claim) => typeof data[claim] === 'number') && (
          <dl className="mt-3 space-y-1 border-t border-border pt-3">
            {JWT_TIME_CLAIMS.filter((claim) => typeof data[claim] === 'number').map((claim) => (
              <div key={claim} className="flex items-baseline justify-between gap-3 text-[12px]">
                <dt className="font-mono text-fg-muted">{claim}</dt>
                <dd className="text-fg">
                  {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
                    new Date((data[claim] as number) * 1000),
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </Card>
  );
}

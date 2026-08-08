'use client';

import { Camera, Download, FileUp, QrCode, StopCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ToolColumns } from '@/components/ToolShell';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Segmented, Slider } from '@/components/ui/Controls';
import { CopyButton } from '@/components/ui/CopyButton';
import { Callout } from '@/components/ui/Feedback';
import { Field } from '@/components/ui/Field';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { cn, downloadBlob, downloadText } from '@/lib/utils';

type Tab = 'generate' | 'read';
type Kind = 'text' | 'url' | 'wifi' | 'contact' | 'email' | 'sms';

/** Escape the characters that are structural in a WIFI: payload. */
const escapeWifi = (value: string) => value.replace(/([\\;,":])/g, '\\$1');

const ERROR_LEVELS = [
  { value: 'L', label: 'Low — 7% recoverable' },
  { value: 'M', label: 'Medium — 15% (default)' },
  { value: 'Q', label: 'Quartile — 25%' },
  { value: 'H', label: 'High — 30%' },
];

export function QrCodeTool() {
  const [tab, setTab] = useState<Tab>('generate');

  return (
    <div className="space-y-5">
      <Segmented
        value={tab}
        onChange={setTab}
        ariaLabel="Mode"
        options={[
          { value: 'generate', label: 'Generate a code' },
          { value: 'read', label: 'Read a code' },
        ]}
      />

      {tab === 'generate' ? <Generator /> : <Reader />}
    </div>
  );
}

// ─── Generator ────────────────────────────────────────────────────────────

function Generator() {
  const [kind, setKind] = useState<Kind>('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');

  const [wifi, setWifi] = useState({ ssid: '', password: '', security: 'WPA', hidden: false });
  const [contact, setContact] = useState({ name: '', phone: '', email: '', org: '' });
  const [email, setEmail] = useState({ to: '', subject: '', body: '' });
  const [sms, setSms] = useState({ number: '', message: '' });

  const [size, setSize] = useState(320);
  const [margin, setMargin] = useState(2);
  const [level, setLevel] = useState('M');
  const [dark, setDark] = useState('#000000');
  const [light, setLight] = useState('#ffffff');

  const [dataUrl, setDataUrl] = useState('');
  const [svg, setSvg] = useState('');
  const [error, setError] = useState<string | null>(null);

  /** Build the payload string in the format scanners actually act on. */
  const payload = (() => {
    switch (kind) {
      case 'url':
        return url.trim() === '' ? '' : /^[a-zA-Z][\w+.-]*:/.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
      case 'wifi':
        if (wifi.ssid.trim() === '') return '';
        return `WIFI:T:${wifi.security};S:${escapeWifi(wifi.ssid)};${
          wifi.security === 'nopass' ? '' : `P:${escapeWifi(wifi.password)};`
        }${wifi.hidden ? 'H:true;' : ''};`;
      case 'contact':
        if (contact.name.trim() === '') return '';
        // vCard 3.0 is the version phone cameras handle most reliably.
        return [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `FN:${contact.name}`,
          contact.org ? `ORG:${contact.org}` : '',
          contact.phone ? `TEL;TYPE=CELL:${contact.phone}` : '',
          contact.email ? `EMAIL:${contact.email}` : '',
          'END:VCARD',
        ]
          .filter(Boolean)
          .join('\n');
      case 'email':
        if (email.to.trim() === '') return '';
        return `mailto:${email.to}${
          email.subject || email.body
            ? `?${[
                email.subject ? `subject=${encodeURIComponent(email.subject)}` : '',
                email.body ? `body=${encodeURIComponent(email.body)}` : '',
              ]
                .filter(Boolean)
                .join('&')}`
            : ''
        }`;
      case 'sms':
        if (sms.number.trim() === '') return '';
        return `SMSTO:${sms.number}${sms.message ? `:${sms.message}` : ''}`;
      default:
        return text;
    }
  })();

  // qrcode is imported on demand so it isn't in the initial route chunk.
  useEffect(() => {
    if (payload === '') {
      setDataUrl('');
      setSvg('');
      setError(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const QRCode = (await import('qrcode')).default;
        const options = {
          width: size,
          margin,
          errorCorrectionLevel: level as 'L' | 'M' | 'Q' | 'H',
          color: { dark, light },
        };

        const [png, vector] = await Promise.all([
          QRCode.toDataURL(payload, options),
          QRCode.toString(payload, { ...options, type: 'svg' }),
        ]);

        if (cancelled) return;
        setDataUrl(png);
        setSvg(vector);
        setError(null);
      } catch (caught) {
        if (cancelled) return;
        setDataUrl('');
        setSvg('');
        // Almost always "data too long for this error-correction level".
        setError(caught instanceof Error ? caught.message : 'Could not build a QR code from that.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [payload, size, margin, level, dark, light]);

  const downloadPng = async () => {
    if (dataUrl === '') return;
    const response = await fetch(dataUrl);
    downloadBlob(await response.blob(), 'qr-code.png');
  };

  return (
    <ToolColumns
      main={
        <Card className="text-center">
          <CardHeader title="Your code" icon={<QrCode />} className="text-left" />

          <div className="mt-5 flex flex-col items-center">
            {error ? (
              <Callout tone="danger" className="w-full text-left">
                {error}
              </Callout>
            ) : dataUrl === '' ? (
              <div className="grid aspect-square w-full max-w-80 place-items-center rounded-2xl border border-dashed border-border-strong bg-bg-subtle">
                <p className="px-6 text-[13px] text-fg-subtle">
                  Fill in the fields to generate a code.
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-border bg-white p-4">
                  {/* A plain img: the data URL is generated locally and the
                      element needs no optimisation pipeline. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dataUrl}
                    alt={`QR code encoding: ${payload.slice(0, 80)}`}
                    width={size}
                    height={size}
                    className="block h-auto w-full max-w-72"
                  />
                </div>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Button variant="primary" leadingIcon={<Download />} onClick={() => void downloadPng()}>
                    PNG
                  </Button>
                  <Button
                    leadingIcon={<Download />}
                    onClick={() => downloadText(svg, 'qr-code.svg', 'image/svg+xml')}
                  >
                    SVG
                  </Button>
                  <CopyButton value={payload} label="Copy contents" variant="secondary" size="md" />
                </div>

                <p className="mt-4 max-w-md break-all rounded-lg bg-bg-subtle px-3 py-2 font-mono text-[11px] text-fg-muted">
                  {payload.length > 200 ? `${payload.slice(0, 200)}…` : payload}
                </p>
              </>
            )}
          </div>
        </Card>
      }
      side={
        <>
          <Card>
            <CardHeader title="Contents" />

            <Field label="Type" className="mt-4">
              <Select
                options={[
                  { value: 'text', label: 'Plain text' },
                  { value: 'url', label: 'Website link' },
                  { value: 'wifi', label: 'Wi-Fi network' },
                  { value: 'contact', label: 'Contact card' },
                  { value: 'email', label: 'Email' },
                  { value: 'sms', label: 'Text message' },
                ]}
                value={kind}
                onChange={(event) => setKind(event.currentTarget.value as Kind)}
              />
            </Field>

            <div className="mt-4 space-y-3">
              {kind === 'text' && (
                <Field label="Text">
                  <Textarea rows={5} value={text} onChange={(event) => setText(event.currentTarget.value)} placeholder="Anything at all" />
                </Field>
              )}

              {kind === 'url' && (
                <Field label="URL" hint="https:// is added if you leave the scheme off.">
                  <Input value={url} onChange={(event) => setUrl(event.currentTarget.value)} placeholder="appbox.msyb.dev" />
                </Field>
              )}

              {kind === 'wifi' && (
                <>
                  <Field label="Network name (SSID)">
                    <Input value={wifi.ssid} onChange={(event) => setWifi({ ...wifi, ssid: event.currentTarget.value })} />
                  </Field>
                  <Field label="Security">
                    <Select
                      options={[
                        { value: 'WPA', label: 'WPA / WPA2 / WPA3' },
                        { value: 'WEP', label: 'WEP' },
                        { value: 'nopass', label: 'Open (no password)' },
                      ]}
                      value={wifi.security}
                      onChange={(event) => setWifi({ ...wifi, security: event.currentTarget.value })}
                    />
                  </Field>
                  {wifi.security !== 'nopass' && (
                    <Field label="Password">
                      <Input
                        value={wifi.password}
                        onChange={(event) => setWifi({ ...wifi, password: event.currentTarget.value })}
                      />
                    </Field>
                  )}
                </>
              )}

              {kind === 'contact' && (
                <>
                  <Field label="Full name">
                    <Input value={contact.name} onChange={(event) => setContact({ ...contact, name: event.currentTarget.value })} />
                  </Field>
                  <Field label="Phone">
                    <Input type="tel" value={contact.phone} onChange={(event) => setContact({ ...contact, phone: event.currentTarget.value })} />
                  </Field>
                  <Field label="Email">
                    <Input type="email" value={contact.email} onChange={(event) => setContact({ ...contact, email: event.currentTarget.value })} />
                  </Field>
                  <Field label="Organisation">
                    <Input value={contact.org} onChange={(event) => setContact({ ...contact, org: event.currentTarget.value })} />
                  </Field>
                </>
              )}

              {kind === 'email' && (
                <>
                  <Field label="To">
                    <Input type="email" value={email.to} onChange={(event) => setEmail({ ...email, to: event.currentTarget.value })} />
                  </Field>
                  <Field label="Subject">
                    <Input value={email.subject} onChange={(event) => setEmail({ ...email, subject: event.currentTarget.value })} />
                  </Field>
                  <Field label="Message">
                    <Textarea rows={3} value={email.body} onChange={(event) => setEmail({ ...email, body: event.currentTarget.value })} />
                  </Field>
                </>
              )}

              {kind === 'sms' && (
                <>
                  <Field label="Phone number">
                    <Input type="tel" value={sms.number} onChange={(event) => setSms({ ...sms, number: event.currentTarget.value })} />
                  </Field>
                  <Field label="Message">
                    <Textarea rows={3} value={sms.message} onChange={(event) => setSms({ ...sms, message: event.currentTarget.value })} />
                  </Field>
                </>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Appearance" />
            <div className="mt-4 space-y-4">
              <Slider label="Size" value={size} onChange={setSize} min={128} max={1024} step={32} formatValue={(v) => `${v} px`} />
              <Slider label="Quiet zone" value={margin} onChange={setMargin} min={0} max={8} formatValue={(v) => `${v} modules`} />

              <Field label="Error correction" hint="Higher levels survive more damage but fit less data.">
                <Select options={ERROR_LEVELS} value={level} onChange={(event) => setLevel(event.currentTarget.value)} />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Foreground">
                  <input
                    type="color"
                    value={dark}
                    onChange={(event) => setDark(event.currentTarget.value)}
                    aria-label="Foreground colour"
                    className="h-10 w-full cursor-pointer rounded-xl border border-border bg-card p-1"
                  />
                </Field>
                <Field label="Background">
                  <input
                    type="color"
                    value={light}
                    onChange={(event) => setLight(event.currentTarget.value)}
                    aria-label="Background colour"
                    className="h-10 w-full cursor-pointer rounded-xl border border-border bg-card p-1"
                  />
                </Field>
              </div>

              <Callout tone="info">
                Keep strong contrast between the two colours — a low-contrast code is unreadable to most
                scanners even when it looks fine on screen.
              </Callout>
            </div>
          </Card>
        </>
      }
    />
  );
}

// ─── Reader ───────────────────────────────────────────────────────────────

function Reader() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number>(0);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  // Release the camera if the component unmounts mid-scan.
  useEffect(() => stopCamera, [stopCamera]);

  const decodeImageData = async (imageData: ImageData): Promise<string | null> => {
    const jsQR = (await import('jsqr')).default;
    const found = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });
    return found?.data ?? null;
  };

  const readFile = async (file: File) => {
    setError(null);
    setResult(null);

    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas is unavailable.');

      context.drawImage(bitmap, 0, 0);
      const decoded = await decodeImageData(context.getImageData(0, 0, canvas.width, canvas.height));

      if (decoded === null) setError('No QR code found in that image. Try a sharper or less cropped photo.');
      else setResult(decoded);
    } catch {
      setError('Could not read that file as an image.');
    }
  };

  const startCamera = async () => {
    setError(null);
    setResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        // The rear camera is the one pointed at a code on a screen or poster.
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setScanning(true);

      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();

      const tick = async () => {
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
          frameRef.current = requestAnimationFrame(() => void tick());
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (!context) return;

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const decoded = await decodeImageData(context.getImageData(0, 0, canvas.width, canvas.height));

        if (decoded !== null) {
          setResult(decoded);
          stopCamera();
          return;
        }

        frameRef.current = requestAnimationFrame(() => void tick());
      };

      frameRef.current = requestAnimationFrame(() => void tick());
    } catch {
      setError('Could not open the camera. Check the permission prompt, or upload an image instead.');
      setScanning(false);
    }
  };

  const isUrl = result !== null && /^https?:\/\//i.test(result);

  return (
    <ToolColumns
      main={
        <Card>
          <CardHeader title="Scan a code" icon={<Camera />} />

          <div className="mt-4">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) void readFile(file);
                event.currentTarget.value = '';
              }}
            />

            <div className={cn('overflow-hidden rounded-2xl border border-border bg-black', !scanning && 'hidden')}>
              <video ref={videoRef} playsInline muted className="block w-full" />
            </div>
            <canvas ref={canvasRef} className="hidden" />

            {!scanning && (
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border-strong bg-bg-subtle px-6 py-8 transition-colors hover:border-accent hover:bg-accent-soft/40"
                >
                  <FileUp className="size-5 text-fg-subtle" aria-hidden="true" />
                  <span className="text-[13px] font-medium text-fg">Upload an image</span>
                </button>
                <button
                  type="button"
                  onClick={() => void startCamera()}
                  className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border-strong bg-bg-subtle px-6 py-8 transition-colors hover:border-accent hover:bg-accent-soft/40"
                >
                  <Camera className="size-5 text-fg-subtle" aria-hidden="true" />
                  <span className="text-[13px] font-medium text-fg">Use the camera</span>
                </button>
              </div>
            )}

            {scanning && (
              <Button leadingIcon={<StopCircle />} onClick={stopCamera} className="mt-3" fullWidth>
                Stop scanning
              </Button>
            )}
          </div>

          {error && (
            <Callout tone="danger" className="mt-4">
              {error}
            </Callout>
          )}
        </Card>
      }
      side={
        <Card>
          <CardHeader title="Result" />
          {result === null ? (
            <p className="mt-3 text-[13px] text-fg-muted">
              Decoded contents will appear here. Everything is processed on your device — no image is uploaded.
            </p>
          ) : (
            <>
              <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-xl border border-accent/25 bg-accent-soft p-3.5 font-mono text-[12px] leading-relaxed text-accent-text">
                {result}
              </pre>
              <div className="mt-3 flex flex-wrap gap-2">
                <CopyButton value={result} label="Copy" variant="secondary" size="sm" />
                {isUrl && (
                  <a
                    href={result}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex h-8 items-center rounded-lg border border-border bg-card px-3 text-[13px] font-medium text-fg transition-colors hover:border-border-strong"
                  >
                    Open link
                  </a>
                )}
              </div>
              {isUrl && (
                <Callout tone="warning" className="mt-3">
                  Check the address before opening it — a QR code can point anywhere, and you cannot tell where
                  from the pattern.
                </Callout>
              )}
            </>
          )}
        </Card>
      }
    />
  );
}

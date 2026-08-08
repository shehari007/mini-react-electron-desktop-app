'use client';

import { ArrowUpDown, FileUp, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardHeader, Stat } from '@/components/ui/Card';
import { Segmented, Switch } from '@/components/ui/Controls';
import { CopyButton } from '@/components/ui/CopyButton';
import { Callout } from '@/components/ui/Feedback';
import { Textarea } from '@/components/ui/Input';
import {
  bytesToBase64,
  decodeBase64,
  encodeBase64,
  parseDataUri,
  toDataUri,
  toUrlSafe,
} from '@/lib/encoding';
import { downloadText, formatBytes, formatNumber } from '@/lib/utils';

type Direction = 'encode' | 'decode';

export function Base64Encoder() {
  const [direction, setDirection] = useState<Direction>('encode');
  const [input, setInput] = useState('');
  const [urlSafe, setUrlSafe] = useState(false);
  const [asDataUri, setAsDataUri] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; mimeType: string } | null>(null);
  /** Base64 of an uploaded file, kept separate so binary never has to round-trip
   *  through the text input. */
  const [fileResult, setFileResult] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  const result = useMemo(() => {
    if (input.trim() === '') return { ok: true as const, value: '' };

    if (direction === 'encode') {
      try {
        const base64 = encodeBase64(input, urlSafe);
        return {
          ok: true as const,
          value: asDataUri ? toDataUri(base64, 'text/plain;charset=utf-8') : base64,
        };
      } catch {
        return { ok: false as const, error: 'Could not encode that input.' };
      }
    }

    // Decoding: accept a full data URI as well as a bare base64 string.
    const dataUri = parseDataUri(input);
    const payload = dataUri ? dataUri.base64 : input;
    const decoded = decodeBase64(payload);

    return decoded.ok
      ? { ok: true as const, value: decoded.value }
      : { ok: false as const, error: decoded.error ?? 'Could not decode that input.' };
  }, [input, direction, urlSafe, asDataUri]);

  const swap = () => {
    // Feed the output back as the new input, which is how people iterate here.
    if (result.ok && result.value !== '') setInput(result.value);
    setDirection(direction === 'encode' ? 'decode' : 'encode');
    setFileInfo(null);
  };

  const handleFile = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const base64 = bytesToBase64(new Uint8Array(buffer));
    setDirection('encode');
    setFileInfo({ name: file.name, size: file.size, mimeType: file.type });
    // A file's base64 goes straight to the output panel rather than being pushed
    // into the textarea, which would mangle it and be unusable to edit.
    setInput('');
    setFileResult(asDataUri ? toDataUri(base64, file.type) : urlSafe ? toUrlSafe(base64) : base64);
  };

  const output = fileInfo ? fileResult : result.ok ? result.value : '';

  const inputBytes = new TextEncoder().encode(input).length;
  const outputBytes = new TextEncoder().encode(output).length;

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            value={direction}
            onChange={(value) => {
              setDirection(value);
              setFileInfo(null);
            }}
            ariaLabel="Direction"
            options={[
              { value: 'encode', label: 'Text → Base64' },
              { value: 'decode', label: 'Base64 → Text' },
            ]}
          />
          <Button variant="ghost" size="sm" leadingIcon={<ArrowUpDown />} onClick={swap}>
            Swap
          </Button>
        </div>

        {direction === 'encode' && (
          <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
            <Switch
              checked={urlSafe}
              onChange={setUrlSafe}
              label="URL-safe output"
              description="Uses - and _ instead of + and /, and drops the padding."
            />
            <Switch
              checked={asDataUri}
              onChange={setAsDataUri}
              label="Wrap as a data URI"
              description="Produces data:…;base64,… ready to paste into src or CSS."
            />
          </div>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card flush>
          <div className="border-b border-border px-5 py-3.5">
            <CardHeader
              title={direction === 'encode' ? 'Plain text' : 'Base64'}
              actions={
                <>
                  {direction === 'encode' && (
                    <>
                      <input
                        ref={fileRef}
                        type="file"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0];
                          if (file) void handleFile(file);
                          event.currentTarget.value = '';
                        }}
                      />
                      <Button size="sm" variant="ghost" leadingIcon={<FileUp />} onClick={() => fileRef.current?.click()}>
                        File
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    leadingIcon={<Trash2 />}
                    onClick={() => {
                      setInput('');
                      setFileInfo(null);
                      setFileResult('');
                    }}
                    disabled={input === '' && fileInfo === null}
                    aria-label="Clear"
                    className="text-fg-subtle hover:text-danger"
                  />
                </>
              }
            />
          </div>

          <div className="p-4">
            {fileInfo ? (
              <div className="rounded-xl border border-accent/25 bg-accent-soft p-4">
                <p className="text-[13px] font-semibold text-accent-text">{fileInfo.name}</p>
                <p className="mt-0.5 text-[12px] text-fg-muted">
                  {formatBytes(fileInfo.size)} · {fileInfo.mimeType || 'unknown type'}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-3"
                  onClick={() => {
                    setFileInfo(null);
                    setFileResult('');
                  }}
                >
                  Use text instead
                </Button>
              </div>
            ) : (
              <>
                <label htmlFor="b64-input" className="sr-only">
                  {direction === 'encode' ? 'Text to encode' : 'Base64 to decode'}
                </label>
                <Textarea
                  id="b64-input"
                  rows={14}
                  mono={direction === 'decode'}
                  value={input}
                  onChange={(event) => setInput(event.currentTarget.value)}
                  placeholder={
                    direction === 'encode' ? 'Type or paste text…' : 'Paste Base64 or a data URI…'
                  }
                />
              </>
            )}
          </div>
        </Card>

        <Card flush>
          <div className="border-b border-border px-5 py-3.5">
            <CardHeader
              title={direction === 'encode' ? 'Base64' : 'Plain text'}
              actions={
                <>
                  <CopyButton value={output} label="Copy" disabled={output === ''} />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      downloadText(output, direction === 'encode' ? 'encoded.txt' : 'decoded.txt')
                    }
                    disabled={output === ''}
                  >
                    Download
                  </Button>
                </>
              }
            />
          </div>

          <div className="p-4">
            {!result.ok && !fileInfo ? (
              <Callout tone="danger">{result.error}</Callout>
            ) : output === '' ? (
              <p className="py-10 text-center text-[13px] text-fg-subtle">
                Output appears here as you type.
              </p>
            ) : (
              <pre className="max-h-[22rem] overflow-auto whitespace-pre-wrap break-all rounded-xl border border-border bg-bg-subtle p-3.5 font-mono text-[12px] leading-relaxed text-fg">
                {output}
              </pre>
            )}
          </div>
        </Card>
      </div>

      {(input !== '' || output !== '') && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Input size" value={formatBytes(fileInfo ? fileInfo.size : inputBytes)} />
          <Stat label="Output size" value={formatBytes(outputBytes)} />
          <Stat
            label="Overhead"
            value={
              inputBytes > 0 || fileInfo
                ? `${formatNumber(((outputBytes / (fileInfo ? fileInfo.size : inputBytes) - 1) * 100) || 0, 1)}%`
                : '—'
            }
            hint="Base64 adds about a third"
          />
        </div>
      )}
    </div>
  );
}

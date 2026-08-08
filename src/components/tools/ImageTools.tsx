'use client';

import { Download, Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardHeader, Stat } from '@/components/ui/Card';
import { Segmented, Slider, Switch } from '@/components/ui/Controls';
import { Callout } from '@/components/ui/Feedback';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { cn, downloadBlob, formatBytes, formatNumber, safeFilename } from '@/lib/utils';

type OutputFormat = 'image/webp' | 'image/jpeg' | 'image/png';

interface SourceImage {
  id: string;
  file: File;
  url: string;
  width: number;
  height: number;
}

interface Processed {
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

const FORMAT_LABELS: Record<OutputFormat, string> = {
  'image/webp': 'WebP',
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
};

const EXTENSIONS: Record<OutputFormat, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

export function ImageTools() {
  const [source, setSource] = useState<SourceImage | null>(null);
  const [processed, setProcessed] = useState<Processed | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [format, setFormat] = useState<OutputFormat>('image/webp');
  const [quality, setQuality] = useState(80);
  const [resizeMode, setResizeMode] = useState<'none' | 'pixels' | 'percent'>('none');
  const [targetWidth, setTargetWidth] = useState('1600');
  const [percent, setPercent] = useState(50);
  const [lockAspect, setLockAspect] = useState(true);
  const [targetHeight, setTargetHeight] = useState('900');

  const fileRef = useRef<HTMLInputElement | null>(null);
  // Object URLs are revoked on replace/unmount; leaking them holds the decoded
  // image in memory for the life of the page.
  const urlsRef = useRef<string[]>([]);

  const trackUrl = (url: string) => {
    urlsRef.current.push(url);
    return url;
  };

  useEffect(
    () => () => {
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  const loadFile = async (file: File) => {
    setError(null);
    setProcessed(null);

    if (!file.type.startsWith('image/')) {
      setError('That file is not an image.');
      return;
    }

    try {
      const bitmap = await createImageBitmap(file);
      setSource({
        id: `${file.name}-${file.size}`,
        file,
        url: trackUrl(URL.createObjectURL(file)),
        width: bitmap.width,
        height: bitmap.height,
      });
      setTargetWidth(String(bitmap.width));
      setTargetHeight(String(bitmap.height));
      bitmap.close();
    } catch {
      setError('Could not decode that image. It may be corrupt or in an unsupported format.');
    }
  };

  const process = useCallback(async () => {
    if (!source) return;

    setBusy(true);
    setError(null);

    try {
      const bitmap = await createImageBitmap(source.file);

      let width = bitmap.width;
      let height = bitmap.height;

      if (resizeMode === 'percent') {
        width = Math.max(1, Math.round((bitmap.width * percent) / 100));
        height = Math.max(1, Math.round((bitmap.height * percent) / 100));
      } else if (resizeMode === 'pixels') {
        const requestedWidth = Math.max(1, Number(targetWidth) || bitmap.width);
        if (lockAspect) {
          width = requestedWidth;
          height = Math.max(1, Math.round((bitmap.height / bitmap.width) * requestedWidth));
        } else {
          width = requestedWidth;
          height = Math.max(1, Number(targetHeight) || bitmap.height);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas is unavailable in this browser.');

      // JPEG has no alpha channel; without a white base, transparency renders
      // black rather than white.
      if (format === 'image/jpeg') {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
      }

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();

      const blob = await new Promise<Blob | null>((resolve) =>
        // PNG ignores the quality argument — it is lossless.
        canvas.toBlob(resolve, format, format === 'image/png' ? undefined : quality / 100),
      );

      if (!blob) throw new Error('Could not encode the image in that format.');

      setProcessed({ blob, url: trackUrl(URL.createObjectURL(blob)), width, height });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong processing the image.');
    } finally {
      setBusy(false);
    }
  }, [source, resizeMode, percent, targetWidth, targetHeight, lockAspect, format, quality]);

  // Re-encode whenever a setting changes, so the size readout stays truthful.
  useEffect(() => {
    if (!source) return;
    const timer = setTimeout(() => void process(), 250);
    return () => clearTimeout(timer);
  }, [source, process]);

  const savings =
    source && processed ? ((source.file.size - processed.blob.size) / source.file.size) * 100 : null;

  const download = () => {
    if (!processed || !source) return;
    const base = safeFilename(source.file.name.replace(/\.[^.]+$/, ''), 'image');
    downloadBlob(processed.blob, `${base}-appbox.${EXTENSIONS[format]}`);
  };

  return (
    <div className="space-y-5">
      <Callout tone="info" title="Processed on your device">
        Images are decoded and re-encoded on a canvas in your browser. Nothing is uploaded to any server, which
        also means very large images are limited by your own memory rather than an upload cap.
      </Callout>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          <Card flush>
            <div className="border-b border-border px-5 py-3.5">
              <CardHeader
                title="Image"
                icon={<ImageIcon />}
                actions={
                  source && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()}>
                        Replace
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        leadingIcon={<Trash2 />}
                        onClick={() => {
                          setSource(null);
                          setProcessed(null);
                        }}
                        aria-label="Remove image"
                        className="text-fg-subtle hover:text-danger"
                      />
                    </>
                  )
                }
              />
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) void loadFile(file);
                event.currentTarget.value = '';
              }}
            />

            <div className="p-4">
              {!source ? (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const file = event.dataTransfer.files[0];
                    if (file) void loadFile(file);
                  }}
                  className="flex w-full flex-col items-center gap-3 rounded-xl border border-dashed border-border-strong bg-bg-subtle px-6 py-16 transition-colors hover:border-accent hover:bg-accent-soft/40"
                >
                  <Upload className="size-7 text-fg-subtle" aria-hidden="true" />
                  <span className="text-[14px] font-medium text-fg">Choose an image or drop one here</span>
                  <span className="text-[12px] text-fg-subtle">PNG, JPEG, WebP, GIF or AVIF</span>
                </button>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <figure>
                    <figcaption className="mb-2 flex items-baseline justify-between gap-2">
                      <span className="text-[12px] font-semibold text-fg">Original</span>
                      <span className="text-[11px] text-fg-subtle">{formatBytes(source.file.size)}</span>
                    </figcaption>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={source.url}
                      alt="The image you selected, before processing"
                      className="w-full rounded-xl border border-border bg-bg-subtle object-contain"
                      style={{ maxHeight: 300 }}
                    />
                    <p className="mt-1.5 text-[11px] text-fg-subtle">
                      {formatNumber(source.width, 0)} × {formatNumber(source.height, 0)} px
                    </p>
                  </figure>

                  <figure>
                    <figcaption className="mb-2 flex items-baseline justify-between gap-2">
                      <span className="text-[12px] font-semibold text-accent-text">Result</span>
                      <span className="text-[11px] text-fg-subtle">
                        {processed ? formatBytes(processed.blob.size) : busy ? 'working…' : '—'}
                      </span>
                    </figcaption>
                    {processed ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={processed.url}
                          alt="The processed result"
                          className="w-full rounded-xl border border-accent/40 bg-bg-subtle object-contain"
                          style={{ maxHeight: 300 }}
                        />
                        <p className="mt-1.5 text-[11px] text-fg-subtle">
                          {formatNumber(processed.width, 0)} × {formatNumber(processed.height, 0)} px ·{' '}
                          {FORMAT_LABELS[format]}
                        </p>
                      </>
                    ) : (
                      <div
                        className="grid w-full place-items-center rounded-xl border border-dashed border-border bg-bg-subtle"
                        style={{ height: 200 }}
                      >
                        <span className="text-[12px] text-fg-subtle">{busy ? 'Processing…' : 'Adjust the settings'}</span>
                      </div>
                    )}
                  </figure>
                </div>
              )}
            </div>

            {error && (
              <div className="px-4 pb-4">
                <Callout tone="danger">{error}</Callout>
              </div>
            )}
          </Card>

          {source && processed && (
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Original" value={formatBytes(source.file.size)} />
              <Stat label="Result" value={formatBytes(processed.blob.size)} />
              <Stat
                label={savings !== null && savings >= 0 ? 'Saved' : 'Larger by'}
                value={savings === null ? '—' : `${formatNumber(Math.abs(savings), 1)}%`}
                hint={
                  savings !== null && savings < 0
                    ? 'Try WebP, or a lower quality'
                    : undefined
                }
              />
            </div>
          )}
        </div>

        <Card>
          <CardHeader title="Settings" />

          <div className="mt-4 space-y-4">
            <Field label="Output format">
              <Segmented
                value={format}
                onChange={setFormat}
                ariaLabel="Output format"
                fullWidth
                size="sm"
                options={[
                  { value: 'image/webp', label: 'WebP' },
                  { value: 'image/jpeg', label: 'JPEG' },
                  { value: 'image/png', label: 'PNG' },
                ]}
              />
            </Field>

            {format === 'image/png' ? (
              <p className="rounded-xl border border-border bg-bg-subtle px-3.5 py-2.5 text-[12px] leading-relaxed text-fg-muted">
                PNG is lossless, so there is no quality setting. For photographs WebP is usually far smaller at
                the same visible quality.
              </p>
            ) : (
              <Slider
                label="Quality"
                value={quality}
                onChange={setQuality}
                min={10}
                max={100}
                formatValue={(value) => `${value}%`}
              />
            )}

            <div className="border-t border-border pt-4">
              <Field label="Resize">
                <Segmented
                  value={resizeMode}
                  onChange={setResizeMode}
                  ariaLabel="Resize mode"
                  fullWidth
                  size="sm"
                  options={[
                    { value: 'none', label: 'Original' },
                    { value: 'pixels', label: 'Pixels' },
                    { value: 'percent', label: 'Percent' },
                  ]}
                />
              </Field>

              {resizeMode === 'percent' && (
                <Slider
                  className="mt-3"
                  label="Scale to"
                  value={percent}
                  onChange={setPercent}
                  min={5}
                  max={200}
                  step={5}
                  formatValue={(value) => `${value}%`}
                />
              )}

              {resizeMode === 'pixels' && (
                <div className="mt-3 space-y-3">
                  <Field label="Width">
                    <Input
                      type="number"
                      min={1}
                      value={targetWidth}
                      onChange={(event) => setTargetWidth(event.currentTarget.value)}
                      suffix="px"
                    />
                  </Field>
                  <Field label="Height">
                    <Input
                      type="number"
                      min={1}
                      value={
                        lockAspect && source
                          ? String(
                              Math.max(
                                1,
                                Math.round((source.height / source.width) * (Number(targetWidth) || source.width)),
                              ),
                            )
                          : targetHeight
                      }
                      onChange={(event) => setTargetHeight(event.currentTarget.value)}
                      disabled={lockAspect}
                      suffix="px"
                    />
                  </Field>
                  <Switch
                    checked={lockAspect}
                    onChange={setLockAspect}
                    label="Keep the aspect ratio"
                    description="Height follows the width automatically."
                  />
                </div>
              )}
            </div>

            <Button
              variant="primary"
              leadingIcon={<Download />}
              onClick={download}
              disabled={!processed}
              loading={busy}
              fullWidth
              className={cn('mt-2')}
            >
              Download {FORMAT_LABELS[format]}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

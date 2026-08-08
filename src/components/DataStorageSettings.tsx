'use client';

import { Download, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { clearAllStored } from '@/lib/storage';
import { cn, downloadText, formatBytes } from '@/lib/utils';

const PREFIX = 'appbox:';

/** Sum the bytes AppBox occupies, so "your data" is a number rather than a claim. */
function measureStorage(): { keys: number; bytes: number } {
  try {
    let keys = 0;
    let bytes = 0;
    for (const key of Object.keys(window.localStorage)) {
      if (!key.startsWith(PREFIX)) continue;
      keys += 1;
      // UTF-16 in practice, so two bytes per code unit for key and value.
      bytes += (key.length + (window.localStorage.getItem(key)?.length ?? 0)) * 2;
    }
    return { keys, bytes };
  } catch {
    return { keys: 0, bytes: 0 };
  }
}

function collectAll(): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (!key.startsWith(PREFIX)) continue;
      const raw = window.localStorage.getItem(key);
      if (raw === null) continue;
      try {
        output[key.slice(PREFIX.length)] = JSON.parse(raw);
      } catch {
        // Keep unparseable values verbatim rather than dropping them from a backup.
        output[key.slice(PREFIX.length)] = raw;
      }
    }
  } catch {
    /* storage unavailable */
  }
  return output;
}

export function DataStorageSettings({ className }: { className?: string }) {
  const { toast } = useToast();
  const [stats, setStats] = useState<{ keys: number; bytes: number } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const refresh = useCallback(() => setStats(measureStorage()), []);

  useEffect(refresh, [refresh]);

  const handleExport = () => {
    const data = collectAll();
    if (Object.keys(data).length === 0) {
      toast('Nothing to export yet', { tone: 'info' });
      return;
    }
    downloadText(
      JSON.stringify({ app: 'AppBox', exportedAt: new Date().toISOString(), data }, null, 2),
      'appbox-data.json',
      'application/json',
    );
    toast('Data exported', { tone: 'success', description: 'Saved as appbox-data.json' });
  };

  const handleClear = () => {
    clearAllStored();
    refresh();
    toast('All AppBox data cleared', { tone: 'success' });
  };

  return (
    <div className={cn('rounded-xl border border-border bg-bg-subtle p-4', className)}>
      <p className="text-[13px] text-fg-muted">
        {stats === null
          ? 'Checking local storage…'
          : stats.keys === 0
            ? 'AppBox has not stored anything on this device yet.'
            : `AppBox is storing ${stats.keys} ${stats.keys === 1 ? 'entry' : 'entries'} (${formatBytes(stats.bytes)}) in this browser.`}
      </p>

      <div className="mt-3.5 flex flex-wrap gap-2">
        <Button size="sm" leadingIcon={<Download />} onClick={handleExport}>
          Export as JSON
        </Button>
        <Button
          size="sm"
          variant="ghost"
          leadingIcon={<Trash2 />}
          onClick={() => setConfirmOpen(true)}
          disabled={stats === null || stats.keys === 0}
          className="text-danger hover:bg-danger/10 hover:text-danger"
        >
          Clear all data
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleClear}
        title="Clear all AppBox data?"
        message="This permanently deletes your todos, notes, history, saved cities and preferences from this device. It cannot be undone — export a backup first if you want to keep any of it."
        confirmLabel="Delete everything"
      />
    </div>
  );
}

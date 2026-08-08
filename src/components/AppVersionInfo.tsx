'use client';

import { useEffect, useState } from 'react';

import { useElectron } from '@/lib/hooks';
import { SITE } from '@/lib/site';
import { cn } from '@/lib/utils';
import type { AppInfo } from '@/types/appbox-bridge';

/**
 * Runtime version details. On the web this is just the app version; in the
 * desktop build it also reports the Electron/Chromium/Node versions, which is
 * the first thing worth knowing on a bug report.
 */
export function AppVersionInfo({ className }: { className?: string }) {
  const electron = useElectron();
  const [info, setInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    if (!electron) return;
    let active = true;
    void electron.app.info().then((result) => {
      if (active) setInfo(result);
    });
    return () => {
      active = false;
    };
  }, [electron]);

  const rows: Array<[string, string]> = [
    ['AppBox', `v${info?.version ?? SITE.version}`],
    ['Runtime', electron ? 'Desktop (Electron)' : 'Web browser'],
    ...(info
      ? ([
          ['Electron', info.electron],
          ['Chromium', info.chrome],
          ['Node', info.node],
          ['Platform', info.platform],
        ] satisfies Array<[string, string]>)
      : []),
  ];

  return (
    <div className={cn('rounded-xl border border-border bg-bg-subtle p-4', className)}>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px] sm:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[11px] uppercase tracking-wide text-fg-subtle">{label}</dt>
            <dd className="font-mono text-[12px] font-medium text-fg">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { CronParser } from '@/components/tools/CronParser';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('cron-parser');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <CronParser />
    </ToolShell>
  );
}

import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { WorldClock } from '@/components/tools/WorldClock';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('world-clock');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <WorldClock />
    </ToolShell>
  );
}

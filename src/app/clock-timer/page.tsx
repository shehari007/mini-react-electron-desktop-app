import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { ClockTimer } from '@/components/tools/ClockTimer';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('clock-timer');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <ClockTimer />
    </ToolShell>
  );
}

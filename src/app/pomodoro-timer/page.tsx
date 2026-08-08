import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { PomodoroTimer } from '@/components/tools/PomodoroTimer';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('pomodoro-timer');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <PomodoroTimer />
    </ToolShell>
  );
}

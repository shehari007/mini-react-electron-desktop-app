import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { DiffChecker } from '@/components/tools/DiffChecker';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('diff-checker');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <DiffChecker />
    </ToolShell>
  );
}

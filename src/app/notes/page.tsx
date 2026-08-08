import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { Notes } from '@/components/tools/Notes';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('notes');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <Notes />
    </ToolShell>
  );
}

import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { TextTools } from '@/components/tools/TextTools';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('text-tools');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <TextTools />
    </ToolShell>
  );
}

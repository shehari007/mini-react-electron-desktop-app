import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { ColorTools } from '@/components/tools/ColorTools';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('color-tools');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <ColorTools />
    </ToolShell>
  );
}

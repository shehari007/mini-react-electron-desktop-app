import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { NumberBaseConverter } from '@/components/tools/NumberBaseConverter';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('number-base-converter');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <NumberBaseConverter />
    </ToolShell>
  );
}

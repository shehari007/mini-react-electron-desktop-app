import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { UnitConverter } from '@/components/tools/UnitConverter';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('unit-converter');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <UnitConverter />
    </ToolShell>
  );
}

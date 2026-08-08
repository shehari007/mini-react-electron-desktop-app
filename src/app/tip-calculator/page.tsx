import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { TipCalculator } from '@/components/tools/TipCalculator';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('tip-calculator');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <TipCalculator />
    </ToolShell>
  );
}

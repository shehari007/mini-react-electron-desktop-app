import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { PercentageCalculator } from '@/components/tools/PercentageCalculator';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('percentage-calculator');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <PercentageCalculator />
    </ToolShell>
  );
}

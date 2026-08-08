import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { CompoundInterestCalculator } from '@/components/tools/CompoundInterestCalculator';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('compound-interest-calculator');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <CompoundInterestCalculator />
    </ToolShell>
  );
}

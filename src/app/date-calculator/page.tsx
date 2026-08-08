import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { DateCalculator } from '@/components/tools/DateCalculator';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('date-calculator');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <DateCalculator />
    </ToolShell>
  );
}

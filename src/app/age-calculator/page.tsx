import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { AgeCalculator } from '@/components/tools/AgeCalculator';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('age-calculator');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <AgeCalculator />
    </ToolShell>
  );
}

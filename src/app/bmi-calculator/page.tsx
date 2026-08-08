import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { BmiCalculator } from '@/components/tools/BmiCalculator';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('bmi-calculator');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <BmiCalculator />
    </ToolShell>
  );
}

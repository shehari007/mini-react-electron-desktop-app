import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { LoanCalculator } from '@/components/tools/LoanCalculator';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('loan-calculator');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <LoanCalculator />
    </ToolShell>
  );
}

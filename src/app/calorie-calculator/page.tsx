import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { CalorieCalculator } from '@/components/tools/CalorieCalculator';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('calorie-calculator');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <CalorieCalculator />
    </ToolShell>
  );
}

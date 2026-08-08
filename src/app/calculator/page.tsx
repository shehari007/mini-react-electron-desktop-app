import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { Calculator } from '@/components/tools/Calculator';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('calculator');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <Calculator />
    </ToolShell>
  );
}

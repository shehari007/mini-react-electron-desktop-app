import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { CurrencyConverter } from '@/components/tools/CurrencyConverter';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('currency-converter');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <CurrencyConverter />
    </ToolShell>
  );
}

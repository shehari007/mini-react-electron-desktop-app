import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { CsvJsonConverter } from '@/components/tools/CsvJsonConverter';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('csv-json-converter');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <CsvJsonConverter />
    </ToolShell>
  );
}

import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { JsonFormatter } from '@/components/tools/JsonFormatter';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('json-formatter');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <JsonFormatter />
    </ToolShell>
  );
}

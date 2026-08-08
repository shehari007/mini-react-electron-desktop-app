import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { Weather } from '@/components/tools/Weather';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('weather');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <Weather />
    </ToolShell>
  );
}

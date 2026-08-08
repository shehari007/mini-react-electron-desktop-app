import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { JwtDecoder } from '@/components/tools/JwtDecoder';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('jwt-decoder');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <JwtDecoder />
    </ToolShell>
  );
}

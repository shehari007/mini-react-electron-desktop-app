import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { Base64Encoder } from '@/components/tools/Base64Encoder';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('base64-encoder');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <Base64Encoder />
    </ToolShell>
  );
}

import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { UrlEncoder } from '@/components/tools/UrlEncoder';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('url-encoder');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <UrlEncoder />
    </ToolShell>
  );
}

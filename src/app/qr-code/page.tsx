import type { Metadata } from 'next';

import { ToolShell } from '@/components/ToolShell';
import { QrCodeTool } from '@/components/tools/QrCodeTool';
import { toolMetadata } from '@/lib/seo';
import { requireTool } from '@/lib/tools';

const tool = requireTool('qr-code');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell tool={tool}>
      <QrCodeTool />
    </ToolShell>
  );
}

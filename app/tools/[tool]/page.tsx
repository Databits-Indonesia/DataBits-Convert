import ClientOnly from '../../client';
import { POPULAR_TOOLS } from '../../../config/constants';

export function generateStaticParams() {
  return POPULAR_TOOLS.map((tool) => ({ tool: tool.id }));
}

interface ToolPageProps {
  params: Promise<{ tool: string }>;
}

export default async function ToolPage({ params }: ToolPageProps) {
  const resolvedParams = await params;
  return <ClientOnly initialTool={resolvedParams.tool} />;
}

import { ApprovalPageClient } from './approval-page-client';

interface ApprovalPageProps {
  params: Promise<{ token: string }>;
}

export const metadata = {
  title: 'Aprovação de Orçamento',
  description: 'Visualize e aprove ou recuse este orçamento',
};

export default async function ApprovalPage({ params }: ApprovalPageProps) {
  const { token } = await params;

  return <ApprovalPageClient token={token} />;
}

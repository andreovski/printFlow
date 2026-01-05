import type { Metadata } from 'next';

import { AccountsPayableContent } from './accounts-payable-content';

export const metadata: Metadata = {
  title: 'Contas a Pagar | Magic System',
};

export default function AccountsPayablePage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Contas a Pagar</h1>
        <p className="text-muted-foreground">Gerencie suas contas e acompanhe os pagamentos</p>
      </div>

      <AccountsPayableContent />
    </div>
  );
}

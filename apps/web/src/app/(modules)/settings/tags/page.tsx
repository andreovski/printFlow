import { Suspense } from 'react';

import { TagsContent } from './tags-content';

export default function TagsPage() {
  return (
    <Suspense fallback={<div className="p-6">Carregando...</div>}>
      <TagsContent />
    </Suspense>
  );
}

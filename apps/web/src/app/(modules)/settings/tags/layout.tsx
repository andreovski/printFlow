import { Suspense } from 'react';

import TagsLoading from './loading';
import { TagsContent } from './tags-content';

export default function TagsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<TagsLoading />}>
        <TagsContent />
      </Suspense>
      <Suspense fallback={<TagsLoading />}>{children}</Suspense>
    </>
  );
}

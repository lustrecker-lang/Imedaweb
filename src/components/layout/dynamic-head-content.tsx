// src/components/layout/dynamic-head-content.tsx

'use client';

import { useEffect, useState, useMemo } from 'react';
import Head from 'next/head';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';

export function DynamicHeadContent() {
  const firestore = useFirestore();
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);

  const companyProfileRef = useMemo(() => {
    if (!firestore) return null;
    return doc(firestore, 'companyProfile', 'main');
  }, [firestore]);

  const { data: companyProfile } = useDoc(companyProfileRef);

  useEffect(() => {
    if (companyProfile?.faviconUrl) {
      setFaviconUrl(companyProfile.faviconUrl);
    }
  }, [companyProfile]);
  
  return (
    <Head>
      {faviconUrl && (
        <>
          <link rel="icon" href={faviconUrl} sizes="any" />
          <link rel="shortcut icon" href={faviconUrl} />
        </>
      )}
    </Head>
  );
}
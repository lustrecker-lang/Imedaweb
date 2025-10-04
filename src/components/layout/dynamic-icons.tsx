'use client';

import { useMemo } from 'react';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import Head from 'next/head';

interface CompanyProfile {
  iconUrl?: string;
  faviconUrl?: string;
}

export function DynamicIcons() {
  const firestore = useFirestore();

  const companyProfileRef = useMemo(() => {
    if (!firestore) return null;
    return doc(firestore, 'companyProfile', 'main');
  }, [firestore]);

  const { data: companyProfile } = useDoc<CompanyProfile>(companyProfileRef);

  if (!companyProfile) {
    return null;
  }

  return (
    <Head>
      {companyProfile.faviconUrl && <link rel="icon" href={companyProfile.faviconUrl} sizes="any" />}
      {companyProfile.iconUrl && <link rel="apple-touch-icon" href={companyProfile.iconUrl} />}
    </Head>
  );
}

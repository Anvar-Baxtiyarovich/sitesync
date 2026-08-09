import React from 'react';

export function generateStaticParams() {
  return [
    { lang: 'uz' },
    { lang: 'ru' },
    { lang: 'en' },
    { lang: 'zh' },
  ];
}

export default function LangLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

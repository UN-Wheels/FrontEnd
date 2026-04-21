'use client';
import dynamic from 'next/dynamic';

const RouteDetailPage = dynamic(
  () => import('@/views/routes/RouteDetailPage').then((m) => m.RouteDetailPage),
  { ssr: false }
);

export default function Page() {
  return <RouteDetailPage />;
}

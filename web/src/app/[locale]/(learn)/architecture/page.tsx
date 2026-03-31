import ArchitectureClient from "./client";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

export default async function ArchitecturePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // params resolved server-side for metadata; client component reads locale from useParams
  await params;
  return <ArchitectureClient />;
}

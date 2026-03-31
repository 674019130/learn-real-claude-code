import CompareClient from "./client";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  return <CompareClient />;
}

import { ExplorerClient } from "./client";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

export default async function ExplorerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <ExplorerClient locale={locale} />;
}

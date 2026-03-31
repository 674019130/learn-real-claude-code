import FlowClient from "./client";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

export default async function FlowPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  return <FlowClient />;
}

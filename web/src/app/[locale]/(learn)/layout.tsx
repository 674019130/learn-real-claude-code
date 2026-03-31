import { Sidebar } from "@/components/layout/sidebar";

export default async function LearnLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <Sidebar locale={locale} />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-3xl">
          {children}
        </div>
      </main>
    </div>
  );
}

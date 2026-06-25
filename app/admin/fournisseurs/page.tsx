import { db } from "@/db/drizzle";
import { getCurrentUserAction } from "@/server/user-actions";
import { redirect } from "next/navigation";
import { ProvidersClientContainer } from "@/components/admin/providers-client-container";

export default async function AdminProvidersPage() {
  const session = await getCurrentUserAction();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const allProviders = await db.query.providers.findMany({
    columns: {
      id: true,
      name: true,
      refProvider: true,
    },
    orderBy: (providers, { desc }) => [desc(providers.createdAt)],
  });

  return (
    <main className="container mx-auto p-6 max-w-5xl">
      <ProvidersClientContainer initialProviders={allProviders} />
    </main>
  );
}
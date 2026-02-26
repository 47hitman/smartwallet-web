import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("amount, type, category, date")
    .eq("user_id", user?.id ?? "")
    .order("date", { ascending: true });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analitik</h1>
        <p className="text-gray-500 text-sm mt-1">Grafik keuangan kamu</p>
      </div>
      <AnalyticsCharts transactions={transactions ?? []} />
    </div>
  );
}

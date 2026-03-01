/**
 * Dashboard > Usage Page
 */

import { setRequestLocale } from "next-intl/server";
import UsageDashboard from "@/components/dashboard/UsageDashboard";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function UsagePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <UsageDashboard />;
}

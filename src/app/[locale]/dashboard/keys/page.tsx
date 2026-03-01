/**
 * Dashboard > API Keys Page
 */

import { setRequestLocale } from "next-intl/server";
import ApiKeysManager from "@/components/dashboard/ApiKeysManager";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function KeysPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ApiKeysManager />;
}

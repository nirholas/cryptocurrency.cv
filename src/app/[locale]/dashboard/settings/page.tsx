/**
 * Dashboard > Settings Page
 */

import { setRequestLocale } from "next-intl/server";
import AccountSettings from "@/components/dashboard/AccountSettings";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AccountSettings />;
}

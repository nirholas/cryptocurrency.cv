/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Dashboard Overview Page — Key metrics at a glance.
 */

import { setRequestLocale } from "next-intl/server";
import DashboardOverview from "@/components/dashboard/DashboardOverview";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <DashboardOverview />;
}

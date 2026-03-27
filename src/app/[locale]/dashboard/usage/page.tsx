/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

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

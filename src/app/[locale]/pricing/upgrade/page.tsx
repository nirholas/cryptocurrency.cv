import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{ locale: string }>;
};

/**
 * /pricing/upgrade now redirects to /billing where x402 payment
 * info is explained. There are no subscription upgrades — everything
 * is pay-per-request via x402 micropayments on Base.
 */
export default async function UpgradePage({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/billing`);
}

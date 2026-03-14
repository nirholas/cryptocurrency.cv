import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TEAM } from "@/data/team";
import { TeamMemberCard } from "@/components/TeamMemberCard";
import { generateSEOMetadata } from "@/lib/seo";
import { Users, ArrowRight, ExternalLink, BookOpen } from "lucide-react";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Our Team — Free Crypto News",
    description:
      "Meet the people behind Free Crypto News. Our leadership, core contributors, and open source community building the free crypto news infrastructure.",
    path: "/team",
    locale,
    tags: ["team", "contributors", "masthead", "open source", "crypto news"],
  });
}

interface GitHubContributor {
  avatar_url: string;
  login: string;
  contributions: number;
  html_url: string;
}

async function fetchContributors() {
  try {
    const res = await fetch(
      "https://api.github.com/repos/nirholas/free-crypto-news/contributors",
      {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 86400 },
      },
    );
    if (!res.ok) return [];
    const data: GitHubContributor[] = await res.json();
    return data.map((c) => ({
      avatarUrl: c.avatar_url,
      username: c.login,
      contributions: c.contributions,
      profileUrl: c.html_url,
    }));
  } catch {
    return [];
  }
}

function TeamStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Free Crypto News",
    url: "https://cryptocurrency.cv",
    logo: "https://cryptocurrency.cv/logo.png",
    member: TEAM.filter((m) => m.type === "leadership").map((m) => ({
      "@type": "Person",
      name: m.name,
      jobTitle: m.role,
      description: m.bio,
      ...(m.githubUsername && {
        sameAs: [`https://github.com/${m.githubUsername}`],
      }),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export default async function TeamPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const contributors = await fetchContributors();
  const leadership = TEAM.filter((m) => m.type === "leadership");
  const coreContributors = TEAM.filter(
    (m) => m.type === "core" || m.type === "contributor",
  );

  return (
    <>
      <Header />
      <TeamStructuredData />
      <main className="container-main py-10">
        {/* Hero */}
        <section className="mb-16 pt-8 text-center">
          <Users className="mx-auto mb-4 h-10 w-10 text-[var(--color-accent)]" />
          <h1 className="font-serif text-4xl font-bold text-[var(--color-text-primary)] md:text-5xl">
            Our Team
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--color-text-secondary)]">
            The people behind Free Crypto News — building the free and open
            crypto news infrastructure the industry needs.
          </p>
        </section>

        {/* Leadership */}
        <section className="mb-16">
          <h2 className="mb-6 font-serif text-2xl font-bold text-[var(--color-text-primary)] md:text-3xl">
            Leadership
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {leadership.map((member) => (
              <TeamMemberCard key={member.slug} member={member} featured />
            ))}
          </div>
        </section>

        {/* Core Contributors */}
        {coreContributors.length > 0 && (
          <section className="mb-16">
            <h2 className="mb-6 font-serif text-2xl font-bold text-[var(--color-text-primary)] md:text-3xl">
              Contributors
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              {coreContributors.map((member) => (
                <TeamMemberCard key={member.slug} member={member} />
              ))}
            </div>
          </section>
        )}

        {/* Open Source Contributors */}
        <section className="mb-16">
          <h2 className="mb-3 font-serif text-2xl font-bold text-[var(--color-text-primary)] md:text-3xl">
            Open Source Contributors
          </h2>
          <p className="mb-6 text-[var(--color-text-secondary)]">
            Thanks to our{" "}
            <strong className="text-[var(--color-text-primary)]">
              {contributors.length}
            </strong>{" "}
            GitHub contributors who have helped build this project.
          </p>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {contributors.map((c) => (
              <a
                key={c.username}
                href={c.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center rounded-lg p-3 transition-colors hover:bg-[var(--color-surface-secondary)]"
              >
                <img
                  src={c.avatarUrl}
                  alt={c.username}
                  width={48}
                  height={48}
                  className="mb-2 h-12 w-12 rounded-full"
                />
                <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                  {c.username}
                </span>
                <span className="text-[10px] text-[var(--color-text-tertiary)]">
                  {c.contributions} commits
                </span>
              </a>
            ))}
          </div>
          <div className="mt-4">
            <a
              href="https://github.com/nirholas/free-crypto-news/graphs/contributors"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-accent)] hover:underline"
            >
              View all contributors on GitHub
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>

        {/* Join Us */}
        <section className="mb-10">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-8 md:p-12">
            <h2 className="mb-3 font-serif text-2xl font-bold text-[var(--color-text-primary)] md:text-3xl">
              Join Us
            </h2>
            <p className="mb-6 max-w-2xl text-[var(--color-text-secondary)]">
              We&apos;re always looking for contributors. Whether you&apos;re
              fixing bugs, adding features, translating, or improving docs —
              every contribution matters.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://github.com/nirholas/free-crypto-news/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-accent)]/50 hover:text-[var(--color-accent)]"
              >
                <ExternalLink className="h-4 w-4" />
                View open issues on GitHub
              </a>
              <a
                href="https://github.com/nirholas/free-crypto-news/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-accent)]/50 hover:text-[var(--color-accent)]"
              >
                <BookOpen className="h-4 w-4" />
                Read our contributing guide
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

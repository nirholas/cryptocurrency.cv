import { Link } from "@/i18n/navigation";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumb navigation — provides hierarchical context on sub-pages.
 * Renders JSON-LD structured data for SEO.
 */
export default function Breadcrumb({ items }: BreadcrumbProps) {
  const allItems = [{ label: "Home", href: "/" }, ...items];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: allItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `https://cryptocurrency.cv${item.href}` } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <nav
        aria-label="Breadcrumb"
        className="container-main py-3 border-b border-border"
      >
        <ol className="flex items-center gap-1.5 text-sm text-text-tertiary overflow-x-auto">
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1;
            return (
              <li key={index} className="flex items-center gap-1.5 shrink-0">
                {index > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 text-border" aria-hidden="true" />
                )}
                {isLast ? (
                  <span className="font-medium text-text-primary truncate max-w-[200px]" aria-current="page">
                    {item.label}
                  </span>
                ) : item.href ? (
                  <Link
                    href={item.href}
                    className="flex items-center gap-1 hover:text-text-primary transition-colors"
                  >
                    {index === 0 && <Home className="h-3.5 w-3.5" aria-hidden="true" />}
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <span>{item.label}</span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

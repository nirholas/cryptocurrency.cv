// Index centralisé de tous les articles du blog
export const articles = [
  {
    slug: "product-directory-high-quality-backlinks",
    import: () => import("./product-directory-high-quality-backlinks.mdx"),
  },
] as const

export type ArticleSlug = (typeof articles)[number]["slug"]



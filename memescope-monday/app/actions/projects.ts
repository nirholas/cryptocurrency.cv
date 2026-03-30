"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

import { db } from "@/drizzle/db"
import {
  category as categoryTable,
  fumaComments,
  project,
  project as projectTable,
  projectToCategory,
  upvote,
} from "@/drizzle/db/schema"
import { and, asc, count, desc, eq, or, sql } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { notifyXNewCoin } from "@/lib/x-notification"

// Fonction pour générer un slug unique
async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  // Vérifier si le slug existe déjà dans la table project
  const existingProject = await db.query.project.findFirst({
    where: eq(projectTable.slug, baseSlug),
  })

  if (!existingProject) {
    return baseSlug
  }

  // Si le slug existe, ajouter un nombre aléatoire
  const randomSuffix = Math.floor(Math.random() * 10000)
  return `${baseSlug}-${randomSuffix}`
}

// Get session helper
async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  })
}

// Get all categories
export async function getAllCategories() {
  const categories = await db.select().from(categoryTable).orderBy(categoryTable.name)
  return categories
}

// Get top categories based on project count
export async function getTopCategories(limit = 5) {
  const topCategories = await db
    .select({
      id: categoryTable.id,
      name: categoryTable.name,
      count: count(projectToCategory.projectId),
    })
    .from(categoryTable)
    .leftJoin(projectToCategory, eq(categoryTable.id, projectToCategory.categoryId))
    .leftJoin(project, eq(projectToCategory.projectId, project.id))
    .where(or(eq(project.launchStatus, "ongoing"), eq(project.launchStatus, "launched")))
    .groupBy(categoryTable.id, categoryTable.name)
    .orderBy(desc(count(projectToCategory.projectId)))
    .limit(limit)

  return topCategories
}

// Get user's upvoted projects
export async function getUserUpvotedProjects() {
  const session = await getSession()

  if (!session?.user?.id) {
    return []
  }

  const upvotedProjects = await db
    .select({
      project: projectTable,
      upvotedAt: upvote.createdAt,
    })
    .from(upvote)
    .innerJoin(projectTable, eq(upvote.projectId, projectTable.id))
    .where(eq(upvote.userId, session.user.id))
    .orderBy(desc(upvote.createdAt))
    .limit(10)

  return upvotedProjects
}

// La fonction getUserComments ne devrait plus être nécessaire car gérée par Fuma Comment
export async function getUserComments() {
  return []
}

// Get projects created by user
export async function getUserCreatedProjects() {
  const session = await getSession()

  if (!session?.user?.id) {
    return []
  }

  const userProjects = await db
    .select()
    .from(projectTable)
    .where(eq(projectTable.createdBy, session.user.id))
    .orderBy(desc(projectTable.createdAt))
    .limit(10)

  return userProjects
}

// Toggle upvote on a project
export async function toggleUpvote(projectId: string) {
  const session = await getSession()

  if (!session?.user?.id) {
    return {
      success: false,
      message: "You must be logged in to upvote",
    }
  }

  // Importer les constantes et le module de rate limiting
  const { UPVOTE_LIMITS } = await import("@/lib/constants")
  const rateLimit = await import("@/lib/rate-limit")

  // Rate limiting pour les upvotes en utilisant les constantes
  const { success, reset } = await rateLimit.checkRateLimit(
    `upvote:${session.user.id}`,
    UPVOTE_LIMITS.ACTIONS_PER_WINDOW,
    UPVOTE_LIMITS.TIME_WINDOW_MS,
  )

  if (!success) {
    return {
      success: false,
      message: `Anti-Spam Squad here: ${UPVOTE_LIMITS.ACTIONS_PER_WINDOW} upvotes in ${UPVOTE_LIMITS.TIME_WINDOW_MINUTES} minutes maxed out! Retry in ${reset} seconds.`,
    }
  }

  // Vérifier si l'utilisateur a déjà fait une action sur ce project récemment
  const lastAction = await db.query.upvote.findFirst({
    where: and(eq(upvote.userId, session.user.id), eq(upvote.projectId, projectId)),
    orderBy: [desc(upvote.createdAt)],
  })

  // Si une action existe et a été créée il y a moins de X secondes (défini dans les constantes), bloquer
  if (lastAction?.createdAt) {
    const timeSinceLastAction = Date.now() - lastAction.createdAt.getTime()
    if (timeSinceLastAction < UPVOTE_LIMITS.MIN_TIME_BETWEEN_ACTIONS_MS) {
      return {
        success: false,
        message: `Anti-Spam Squad here: ${UPVOTE_LIMITS.MIN_TIME_BETWEEN_ACTIONS_SECONDS}-second wait required for vote changes`,
      }
    }
  }

  // Check if the user has already upvoted the project
  const existingUpvote = await db
    .select()
    .from(upvote)
    .where(and(eq(upvote.userId, session.user.id), eq(upvote.projectId, projectId)))
    .limit(1)

  // If upvote exists, remove it, otherwise add it
  if (existingUpvote.length > 0) {
    await db
      .delete(upvote)
      .where(and(eq(upvote.userId, session.user.id), eq(upvote.projectId, projectId)))
  } else {
    await db.insert(upvote).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      projectId,
      createdAt: new Date(),
    })
  }

  revalidatePath("/dashboard")
  // Temporairement commenter la revalidation spécifique au projet
  // Il faudrait le slug ici pour revalider /projects/{slug}
  // revalidatePath(`/projects/${projectSlug}`);

  return { success: true }
}

// Définir l'interface ici
interface ProjectSubmissionData {
  name: string
  description: string
  websiteUrl: string
  logoUrl: string | null
  productImage: string | null
  categories: string[]
  techStack?: string[]
  platforms?: string[]
  pricing?: string
  githubUrl?: string | null
  twitterUrl?: string | null
  ticker?: string | null
  chain?: string | null
  coinType?: string | null
  contractAddress?: string | null
  telegramUrl?: string | null
  pumpfunUrl?: string | null
}

// Version correcte de submitProject
export async function submitProject(projectData: ProjectSubmissionData) {
  const session = await getSession()

  if (!session?.user) {
    return { success: false, error: "Authentication required" }
  }

  try {
    // Utiliser les données de projectData
    const {
      name,
      description,
      websiteUrl,
      logoUrl,
      productImage,
      categories,
      techStack,
      platforms,
      pricing,
      githubUrl,
      twitterUrl,
      ticker,
      chain,
      coinType,
      contractAddress,
      telegramUrl,
      pumpfunUrl,
    } = projectData

    // Validation
    if (!name || !description || !websiteUrl) {
      return { success: false, error: "Missing required fields" }
    }

    // Générer le slug à partir du nom dans projectData
    const slug = await generateUniqueSlug(name)

    // Insérer le projet
    const [newProject] = await db
      .insert(projectTable)
      .values({
        id: crypto.randomUUID(),
        // Utiliser les variables déstructurées de projectData
        name,
        slug,
        description,
        websiteUrl,
        logoUrl,
        productImage: productImage ?? undefined,
        techStack,
        platforms,
        pricing,
        githubUrl: githubUrl ?? undefined,
        twitterUrl: twitterUrl ?? undefined,
        ticker: ticker ?? undefined,
        chain: chain ?? undefined,
        coinType: coinType ?? undefined,
        contractAddress: contractAddress ?? undefined,
        telegramUrl: telegramUrl ?? undefined,
        pumpfunUrl: pumpfunUrl ?? undefined,
        createdBy: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: projectTable.id, slug: projectTable.slug })

    // Ajouter les catégories
    if (categories.length > 0) {
      await db.insert(projectToCategory).values(
        categories.map((categoryId) => ({
          projectId: newProject.id,
          categoryId,
        })),
      )
    }

    // Post to X in the background (don't block submission)
    notifyXNewCoin({
      name,
      ticker,
      chain,
      slug: newProject.slug,
    }).catch((err) => console.error("[X Notification] Failed:", err))

    return { success: true, projectId: newProject.id, slug: newProject.slug }
  } catch (error) {
    console.error("Error submitting project:", error)
    return { success: false, error: "Failed to submit project" }
  }
}

async function enrichProjectsWithUserData<T extends { id: string }>(
  projects: T[],
  userId: string | null,
): Promise<
  (T & {
    userHasUpvoted: boolean
    categories: { id: string; name: string }[]
  })[]
> {
  if (!projects.length) return []

  const projectIds = projects.map((p) => p.id)

  // Récupérer les catégories pour tous les projets
  const categoriesData = await db
    .select({
      projectId: projectToCategory.projectId,
      categoryId: categoryTable.id,
      categoryName: categoryTable.name,
    })
    .from(projectToCategory)
    .innerJoin(categoryTable, eq(categoryTable.id, projectToCategory.categoryId))
    .where(sql`${projectToCategory.projectId} IN ${projectIds}`)

  const categoriesByProjectId = categoriesData.reduce(
    (acc, row) => {
      if (!acc[row.projectId]) {
        acc[row.projectId] = []
      }
      acc[row.projectId].push({ id: row.categoryId, name: row.categoryName })
      return acc
    },
    {} as Record<string, { id: string; name: string }[]>,
  )

  // Récupérer les upvotes de l'utilisateur
  let userUpvotedProjectIds = new Set<string>()
  if (userId) {
    const userUpvotes = await db
      .select({ projectId: upvote.projectId })
      .from(upvote)
      .where(and(eq(upvote.userId, userId), sql`${upvote.projectId} IN ${projectIds}`))
    userUpvotedProjectIds = new Set(userUpvotes.map((uv) => uv.projectId))
  }

  return projects.map((project) => ({
    ...project,
    userHasUpvoted: userUpvotedProjectIds.has(project.id),
    categories: categoriesByProjectId[project.id] || [],
  }))
}

// Get projects by category with pagination and sorting
export async function getProjectsByCategory(
  categoryId: string,
  page: number = 1,
  limit: number = 10,
  sort: string = "recent",
) {
  const session = await getSession()
  const userId = session?.user?.id || null

  let orderByClause
  switch (sort) {
    case "upvotes":
      orderByClause = desc(sql`count(distinct ${upvote.id})`)
      break
    case "alphabetical":
      orderByClause = asc(projectTable.name)
      break
    case "recent":
    default:
      orderByClause = desc(projectTable.createdAt)
      break
  }

  const offset = (page - 1) * limit

  const queryConditions = and(
    eq(projectToCategory.categoryId, categoryId),
    or(eq(projectTable.launchStatus, "ongoing"), eq(projectTable.launchStatus, "launched")),
  )

  const projectsData = await db
    .select({
      id: projectTable.id,
      name: projectTable.name,
      slug: projectTable.slug,
      description: projectTable.description,
      logoUrl: projectTable.logoUrl,
      websiteUrl: projectTable.websiteUrl,
      launchStatus: projectTable.launchStatus,
      launchType: projectTable.launchType,
      dailyRanking: projectTable.dailyRanking,
      scheduledLaunchDate: projectTable.scheduledLaunchDate,
      createdAt: projectTable.createdAt,
      upvoteCount: sql<number>`count(distinct ${upvote.id})`.mapWith(Number),
      commentCount: sql<number>`count(distinct ${fumaComments.id})`.mapWith(Number),
    })
    .from(projectTable)
    .innerJoin(projectToCategory, eq(projectTable.id, projectToCategory.projectId))
    .leftJoin(upvote, eq(upvote.projectId, projectTable.id))
    .leftJoin(fumaComments, sql`(${fumaComments.page}::text = ${projectTable.id}::text)`)
    .where(queryConditions)
    .groupBy(
      projectTable.id,
      projectTable.name,
      projectTable.slug,
      projectTable.description,
      projectTable.logoUrl,
      projectTable.websiteUrl,
      projectTable.launchStatus,
      projectTable.launchType,
      projectTable.dailyRanking,
      projectTable.scheduledLaunchDate,
      projectTable.createdAt,
    )
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset)

  const enrichedProjects = await enrichProjectsWithUserData(projectsData, userId)

  const totalProjectsResult = await db
    .select({ count: count(projectTable.id) })
    .from(projectTable)
    .innerJoin(projectToCategory, eq(projectTable.id, projectToCategory.projectId))
    .where(queryConditions)

  const totalCount = totalProjectsResult[0]?.count || 0

  return {
    projects: enrichedProjects,
    totalCount,
  }
}

// getCategoryById
export async function getCategoryById(categoryId: string) {
  const categoryData = await db
    .select()
    .from(categoryTable)
    .where(eq(categoryTable.id, categoryId))
    .limit(1)

  return categoryData[0] || null
}

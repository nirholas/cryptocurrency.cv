import { LAUNCH_TYPES } from "@/lib/constants";
import { launchStatus as launchStatusEnum, project as projectSchema } from "@/drizzle/db/schema";

type ProjectSchemaSelect = typeof projectSchema.$inferSelect;

interface ProjectLinkInfo {
  launchType?: ProjectSchemaSelect['launchType'];
  launchStatus?: ProjectSchemaSelect['launchStatus'];
  dailyRanking?: ProjectSchemaSelect['dailyRanking'];
}

export function getProjectWebsiteRelAttribute(projectInfo: ProjectLinkInfo): string {
  let rel = "noopener";

  const isPremiumTier =
    projectInfo.launchType === LAUNCH_TYPES.PREMIUM ||
    projectInfo.launchType === LAUNCH_TYPES.PREMIUM_PLUS;

  const isTop3Daily =
    projectInfo.launchStatus === launchStatusEnum.LAUNCHED &&
    projectInfo.dailyRanking !== null &&
    typeof projectInfo.dailyRanking === 'number' &&
    projectInfo.dailyRanking >= 1 &&
    projectInfo.dailyRanking <= 3;

  if (!isPremiumTier && !isTop3Daily) {
    rel += " nofollow";
  }

  return rel;
} 
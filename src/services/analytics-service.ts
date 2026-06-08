import { ContentStatus, ContentType, Platform, Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";

const statuses: ContentStatus[] = [
  "planned",
  "in_progress",
  "review",
  "done",
  "published",
];

const contentTypes: ContentType[] = ["post", "video", "reel", "carousel"];

const platforms: Platform[] = [
  "LinkedIn",
  "X",
  "Instagram",
  "TikTok",
  "YouTube",
  "Facebook",
];

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Aggregates dashboard metrics in the database (groupBy/count) instead of
 * shipping the full content table to the client for in-browser filtering —
 * see CLAUDE.md "Client-side analytics" gap. `platforms` is an array column,
 * which Prisma can't `groupBy`, so it's counted per-platform with `has`.
 *
 * Pass `productId` to scope `totals`/`completionRate`/`statusBreakdown`/
 * `typeBreakdown`/`platformDistribution`/`weeklyOutput` to a single product
 * (used by the product detail view); `postsPerProduct`/`productCompletion`
 * stay cross-product comparisons regardless, since that's what they're for.
 */
export async function getDashboardStats(productId?: string) {
  const contentWhere: Prisma.ContentItemWhereInput | undefined = productId
    ? { productId }
    : undefined;

  const [
    products,
    statusGroups,
    typeGroups,
    productGroups,
    publishedProductGroups,
    platformCounts,
    createdDates,
  ] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: "asc" } }),

    prisma.contentItem.groupBy({
      by: ["status"],
      where: contentWhere,
      _count: { _all: true },
    }),

    prisma.contentItem.groupBy({
      by: ["type"],
      where: contentWhere,
      _count: { _all: true },
    }),

    prisma.contentItem.groupBy({
      by: ["productId"],
      _count: { _all: true },
    }),

    prisma.contentItem.groupBy({
      by: ["productId"],
      where: { status: "published" },
      _count: { _all: true },
    }),

    Promise.all(
      platforms.map(async (platform) => ({
        platform,
        total: await prisma.contentItem.count({
          where: { ...contentWhere, platforms: { has: platform } },
        }),
      }))
    ),

    prisma.contentItem.findMany({
      where: contentWhere,
      select: { createdAt: true },
    }),
  ]);

  const countByStatus = new Map(
    statusGroups.map((group) => [group.status, group._count._all])
  );

  const countByType = new Map(
    typeGroups.map((group) => [group.type, group._count._all])
  );

  const totalContent = statusGroups.reduce(
    (sum, group) => sum + group._count._all,
    0
  );

  const published = countByStatus.get("published") ?? 0;

  const totals = {
    totalContent,
    published,
    inProgress: countByStatus.get("in_progress") ?? 0,
    planned: countByStatus.get("planned") ?? 0,
  };

  const completionRate =
    totalContent === 0 ? 0 : Math.round((published / totalContent) * 100);

  const statusBreakdown = statuses.map((status) => ({
    status,
    total: countByStatus.get(status) ?? 0,
  }));

  const typeBreakdown = contentTypes.map((type) => ({
    type,
    total: countByType.get(type) ?? 0,
  }));

  const contentCountByProduct = new Map(
    productGroups.map((group) => [group.productId, group._count._all])
  );

  const publishedCountByProduct = new Map(
    publishedProductGroups.map((group) => [group.productId, group._count._all])
  );

  const postsPerProduct = products.map((product) => ({
    productId: product.id,
    productName: product.name,
    total: contentCountByProduct.get(product.id) ?? 0,
  }));

  const productCompletion = products.map((product) => {
    const total = contentCountByProduct.get(product.id) ?? 0;
    const productPublished = publishedCountByProduct.get(product.id) ?? 0;

    return {
      productId: product.id,
      productName: product.name,
      total,
      published: productPublished,
      completionRate:
        total === 0 ? 0 : Math.round((productPublished / total) * 100),
    };
  });

  const totalsByDate = new Map<string, number>();

  createdDates.forEach(({ createdAt }) => {
    const key = getDateKey(createdAt);
    totalsByDate.set(key, (totalsByDate.get(key) ?? 0) + 1);
  });

  const weeklyOutput = Array.from(totalsByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({ date, total }));

  return {
    totals,
    completionRate,
    statusBreakdown,
    typeBreakdown,
    postsPerProduct,
    productCompletion,
    platformDistribution: platformCounts,
    weeklyOutput,
  };
}

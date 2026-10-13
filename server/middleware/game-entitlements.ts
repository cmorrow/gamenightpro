import { hasBillingAccess } from "#shared/utils/billing";
import { hasGameAccess } from "#shared/utils/plan";

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith("/api/music-bingo")) return;

  const { user } = await getUserSession(event);
  if (!user) return;
  if (!hasBillingAccess(user.billingStatus)) {
    throw createError({
      statusCode: 402,
      statusMessage: "An active subscription is required.",
    });
  }
  if (
    !hasGameAccess(
      user.billingPlanId,
      user.billingGameId ?? undefined,
      "/music-bingo",
    )
  ) {
    throw createError({
      statusCode: 403,
      statusMessage: "Music Bingo is not included in your plan.",
    });
  }
});

import type { BillingStatus } from "#shared/utils/billing";
import type { GameId, PlanId } from "#shared/utils/plan";

export type Role = "admin" | "host";

declare module "#auth-utils" {
  interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
    tenantId: string;
    mustChangePassword: boolean;
    billingStatus: BillingStatus;
    billingPlanId?: PlanId;
    billingGameId?: GameId | null;
  }
}

export {};

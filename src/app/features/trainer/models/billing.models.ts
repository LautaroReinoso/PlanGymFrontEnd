// ─────────────────────────────────────────────
//  PlanGym — Billing models
//  Contrato de /api/billing (suscripción del entrenador).
// ─────────────────────────────────────────────

export type SubscriptionStatus = 'PENDING' | 'AUTHORIZED' | 'PAUSED' | 'CANCELLED';

// GET /api/billing/plans
export interface BillingPlan {
  code: string;
  name: string;
  price: number;
  currency: string;
  frequencyMonths: number;
  /** null = ilimitado */
  maxStudents: number | null;
}

// POST /api/billing/subscriptions
export interface CreateSubscriptionRequest {
  planCode: string;
}

// SubscriptionResponse
export interface Subscription {
  id: number;
  status: SubscriptionStatus;
  plan: BillingPlan;
  /** Solo viene en PENDING */
  initPoint?: string | null;
  createdAt: string;
}

// Error de negocio del backend (400)
export interface ApiErrorBody {
  message?: string;
}

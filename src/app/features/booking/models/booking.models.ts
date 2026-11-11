// ─────────────────────────────────────────────
//  PlanGym — Booking (turnos) models
//  Espejo de los DTOs de /api/booking/plangym.
//  Instantes (startAt/endAt) en ISO con offset de Argentina:
//  se muestran tal cual, nunca se convierten a la zona del navegador.
// ─────────────────────────────────────────────

export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
export type EnrollmentStatus = 'ACTIVE' | 'PAUSED' | 'ENDED';
export type BookingMode = 'SELF' | 'ENROLLMENT' | 'BOTH';
/** 1 = lunes … 7 = domingo */
export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Booking {
  id: number;
  status: BookingStatus;
  serviceId: number;
  serviceName: string;
  professionalId: number;
  professionalName: string;
  startAt: string;
  endAt: string;
  location: string | null;
  note: string | null;
  rescheduleCount: number;
  cancelledAt: string | null;
  cancelReason: string | null;
  /** != null → viene de un horario fijo */
  enrollmentId: number | null;
  /** != null → es la recuperación de esa ausencia (clase suelta) */
  recoveryOfBookingId?: number | null;
  /** Quién canceló (pendiente en el backend; si no viene, no se muestra el aviso) */
  cancelledBy?: 'STUDENT' | 'PROFESSIONAL' | 'SYSTEM' | null;
  /** true si esa cancelación le dio una clase para recuperar */
  grantsRecovery?: boolean;
}

export interface AgendaClient {
  userId: number;
  name: string | null;
  mail: string | null;
  phone: string | null;
}

export interface AgendaItem {
  id: number;
  status: BookingStatus;
  serviceId: number;
  serviceName: string;
  professionalId: number;
  professionalName: string;
  startAt: string;
  endAt: string;
  client: AgendaClient;
  note: string | null;
  enrollmentId: number | null;
  cancelReason: string | null;
  /** != null → el alumno vino a recuperar */
  recoveryOfBookingId?: number | null;
  cancelledBy?: 'STUDENT' | 'PROFESSIONAL' | 'SYSTEM' | null;
}

export interface Enrollment {
  id: number;
  userId: number;
  clientName: string | null;
  serviceId: number;
  serviceName: string;
  professionalId: number;
  professionalName: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  validFrom: string | null;
  validTo: string | null;
  status: EnrollmentStatus;
}

export interface OverviewClient {
  enrollmentId: number;
  userId: number;
  name: string | null;
  startTime: string;
}

export interface ScheduleOverviewItem {
  ruleId: number;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  capacity: number;
  enrolled: number;
  free: number;
  clients: OverviewClient[];
}

export interface SelfSlot {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  capacity: number;
  free: number;
  mine: boolean;
  enrollmentId: number | null;
}

export interface SelfEnrollmentOptions {
  serviceId: number;
  serviceName: string;
  durationMinutes: number;
  weeklyLimit: number;
  used: number;
  changesPerMonth: number;
  changesUsed: number;
  changesLeft: number;
  changeNoticeHours: number;
  professionals: { id: number; displayName: string; slots: SelfSlot[] }[];
}

export interface BookingStudentSummary {
  userId: number;
  name: string | null;
  mail: string | null;
  phone: string | null;
  lastBookingAt: string | null;
  nextBookingAt: string | null;
  bookingsCount: number;
  activeEnrollments: { id: number; serviceName: string; dayOfWeek: DayOfWeek; startTime: string }[];
  activeSubscription?: unknown;
}

export interface Rule {
  id?: number;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  capacity: number;
  validFrom?: string | null;
  validTo?: string | null;
  active?: boolean;
}

/**
 * Servicio del entrenador. ⚠️ Forma supuesta (el prompt no trae el DTO):
 * verificar contra el backend. El precio no se muestra; siempre se manda 0.
 */
export interface BookingService {
  id: number;
  name: string;
  description?: string | null;
  durationMinutes: number;
  bookingMode: BookingMode;
  selfEnrollment?: boolean;
  weeklyLimit?: number | null;
  /** Tope de clases por mes cargado a mano (1–62) o null */
  monthlyLimit?: number | null;
  /** Tope que se aplica (solo lectura): monthlyLimit, o weeklyLimit × 4; null = sin tope */
  monthlyCap?: number | null;
  price?: number;
  active?: boolean;
}
export type BookingServiceRequest = Omit<BookingService, 'id' | 'monthlyCap'>;

/** Bloqueo propio (ExceptionResponse del backend) */
export interface Block {
  id: number;
  professionalId?: number;
  professionalName?: string;
  startAt: string;
  endAt: string;
  type?: string;
  reason: string | null;
}

/** GET /services/{id}/slots → SlotsResponse (verificado contra el backend) */
export interface SlotsResponse {
  serviceId: number;
  timezone: string;
  slots: {
    startAt: string;
    endAt: string;
    professionals: { id: number; displayName: string; capacity: number; spotsLeft: number }[];
  }[];
}

/** Una opción reservable (aplanada: un horario con un profesional) */
export interface FreeSlot {
  startAt: string;
  endAt: string;
  professionalId: number;
  professionalName: string;
  free: number;
}

export interface SlotRef {
  dayOfWeek: DayOfWeek;
  startTime: string;
}

/** Exactamente uno de userId / dni / mail */
export interface EnrollBatchRequest {
  userId?: number;
  dni?: string;
  serviceId: number;
  slots: SlotRef[];
  validFrom?: string;
  validTo?: string;
}

export interface CancellationPreview {
  canCancel: boolean;
  canReschedule: boolean;
  reschedulesLeft: number;
  losesPayment: boolean;
  message: string;
}

// ── Recuperar clases ──────────────────────────
/** GET /schedule — horarios del entrenador con cupo (incluye completos). Máx. 42 días. */
export interface ScheduleSlot {
  serviceId: number;
  serviceName: string;
  professionalId: number;
  professionalName: string;
  startAt: string;
  endAt: string;
  capacity: number;
  booked: number;
  free: number;
  /** != null → el alumno ya está en esa clase */
  myBookingId: number | null;
}

/** GET /recoveries/mine (sin ?month): créditos vigentes. Cada clase se recupera hasta 30 días después. */
export interface RecoverySummary {
  month: string;          // "YYYY-MM" (informativo)
  limit: number;          // tope mensual de las AUSENCIAS (0 = sin recuperación por ausencia)
  absences: number;       // ausencias avisadas a tiempo
  professionalCancels?: number; // clases de horario fijo que canceló el profe/sitio (sin tope)
  used: number;
  available: number;
  expiresAt: string | null; // vencimiento más próximo entre las disponibles
  items: {
    absenceBookingId: number;
    source?: 'ABSENCE' | 'PROFESSIONAL_CANCEL';
    cancelReason?: string | null;
    serviceId: number;
    serviceName: string;
    professionalId: number;
    professionalName: string;
    startAt: string;
    recoveredByBookingId: number | null;
    recoveredAt: string | null;
    /** Hasta cuándo se puede recuperar esta clase (30 días después) */
    expiresAt?: string | null;
  }[];
}

export interface RecoveryRequest {
  serviceId: number;
  professionalId: number;
  startAt: string;
}

/** GET/PUT /professional/me */
export interface ProfessionalMe {
  id: number;
  userId: number;
  displayName: string;
  mail: string | null;
  active: boolean;
  recoveriesPerMonth: number | null;
}

// ─────────────────────────────────────────────
//  GymPlan — Auth Models
//  Aligned with Spring Boot JWT backend
// ─────────────────────────────────────────────

export type RoleType =
  | 'ROLE_ADMIN'
  | 'ROLE_TRAINER'
  | 'ROLE_STUDENT'
  | 'ROLE_GLOBAL_ADMIN'
  | 'ROLE_GYM_ADMIN';

// POST /auth/login  →  request body
export interface LoginRequest {
  mail: string;
  password: string;
}

// POST /auth/login  →  response body
export interface AuthResponse {
  accessToken: string;
  tokenType: string; // "Bearer"
}

// Decoded JWT payload (standard claims + Spring Security roles)
export interface JwtPayload {
  sub: string;          // mail del usuario
  roles: RoleType[];
  iat: number;          // issued at (epoch seconds)
  exp: number;          // expiration (epoch seconds)
}

// Sesión activa que la app mantiene en memoria
export interface AuthSession {
  token: string;
  mail: string;
  roles: RoleType[];
  expiresAt: Date;
}
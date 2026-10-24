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

// POST /auth/student/login  →  request body (el alumno entra solo con DNI)
export interface StudentLoginRequest {
  dni: string;
}

// POST /auth/student/login  →  response body
// Extiende AuthResponse: la sesión se maneja igual que la del entrenador.
export interface StudentAuthResponse extends AuthResponse {
  studentId: number;
  nombre: string;
  apellido: string;
}

// Modo de la pantalla de login
export type LoginMode = 'trainer' | 'student';

// Decoded JWT payload (standard claims + Spring Security roles)
export interface JwtPayload {
  sub: string;          // mail del usuario (entrenador) o DNI (alumno)
  roles: RoleType[];
  iat: number;          // issued at (epoch seconds)
  exp: number;          // expiration (epoch seconds)
}

// Sesión activa que la app mantiene en memoria
export interface AuthSession {
  token: string;
  mail: string;         // para alumnos contiene el DNI (viene del "sub" del JWT)
  roles: RoleType[];
  expiresAt: Date;
}
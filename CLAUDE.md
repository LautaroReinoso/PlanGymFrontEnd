# PlanGym — Frontend Context (Angular 19)

> **Marca: PlanGym** (antes "GymPlan"; los comentarios de cabecera de algunos archivos todavía dicen GymPlan).
> Dominio de producción: **plangympro.com**

## Stack
- **Framework:** Angular 19, Standalone Components, Signals
- **Estilos:** CSS nativo, sin librerías UI
- **Estado:** Signals (`signal`, `computed`, `effect`)
- **HTTP:** `HttpClient` con interceptor JWT funcional
- **Routing:** Lazy loading por feature con `loadChildren`
- **IDE:** IntelliJ / VS Code
- **Backend:** Spring Boot + MySQL en `http://localhost:8080`
- **Producción:** front en **HostGator** (`https://plangympro.com`), backend en **Railway**
  (`https://api.plangympro.com`). Paso a paso en `DEPLOY.md` (raíz del backend).
  - `environment.production.ts` → `apiUrl: 'https://api.plangympro.com/api'`, `appName: 'PlanGym'`,
    `billingEnabled: false` (ver "Suscripciones del entrenador")
  - `public/.htaccess` (se copia al build): todas las rutas → `index.html` (si no, el link del mail
    y el F5 dan 404 en Apache), fuerza HTTPS, `index.html` sin caché.
  - Favicon: `public/favicon.svg` + `favicon.ico` + `apple-touch-icon.png` (logo PlanGym), enlazados en `index.html`.

---

## Design System

### Colores
```css
--color-bg:        #0A0A0F
--color-surface:   #13131A
--color-card:      #1C1C26
--color-border:    #2A2A38
--color-accent:    #4A68F2   /* azul eléctrico (antes #4F6EF7; se oscureció apenas para que el texto blanco encima dé 4,6:1) */
--color-celeste:   #38BDF8   /* celeste — acento secundario */
--color-text:      #F0F0F5
--color-muted:     #6B6B80
--color-muted-light: #9898A8   /* labels, legends, texto secundario */
--color-success:   #22C55E
--color-warning:   #F59E0B
--color-danger:    #EF4444
```

> Todos los tokens viven en `src/styles/token.css` (incluye `--color-muted-light`, `--color-celeste`,
> `--color-accent-glow`, `--color-success-dim`, `--ease-spring`). **Antes de usar una variable nueva, definirla ahí**:
> una `var(--x)` sin definir deja el texto sin color (negro del navegador sobre fondo oscuro).
> `src/styles.css` define la base global: `body` con fondo/texto/fuente del design system, `color-scheme: dark`,
> `label`/`legend` en `--color-muted-light`, opciones de `<select>` legibles.

### Tipografía
- **Display/Títulos:** `Syne` (700, 800)
- **Body/UI:** `DM Sans` (400, 500, 600)

### Easings
```css
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1)
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)  /* overshooting suave */
```

### Principios visuales
- Dark theme siempre
- Cards con línea de acento degradada en el borde superior
- Animaciones con spring easing
- `ChangeDetectionStrategy.OnPush` en todos los componentes
- `standalone: true` en todos los componentes
- Sin librerías de animación externas

---

## Estructura de carpetas

```
src/app/
├── core/
│   ├── http/
│   │   └── api-error.util.ts        → apiErrorText(err, fallback): `message` del backend
│   ├── auth/
│   │   ├── auth.service.ts          → login, logout, sesión, roles
│   │   ├── auth.guards.ts           → authGuard, roleGuard, loginGuard
│   │   └── jwt.interceptor.ts       → adjunta Bearer token
│   ├── storage/
│   │   └── storage.service.ts       → wrapper localStorage tipado
│   ├── models/
│   │   └── auth.models.ts           → AuthSession, JwtPayload, RoleType
│   └── (token ENVIRONMENT: src/environments/tokens/environment.token.ts — única definición)
│
├── shared/
│   ├── components/
│   │   ├── button-component/            → gp-button
│   │   ├── badge-component/             → gp-badge
│   │   ├── card/                        → gp-card
│   │   ├── input-field/                 → gp-input (ControlValueAccessor)
│   │   ├── skeleton/                    → gp-skeleton
│   │   ├── modal/                       → gp-modal
│   │   ├── muscle-icon/                 → gp-muscle-icon
│   │   ├── exercise-item/               → app-exercise-item (ÚNICA copia — fila reutilizable)
│   │   ├── icon-button/                 → gp-icon-button (único botón de ícono, área 44px)
│   │   ├── empty-state/                 → app-empty-state
│   │   ├── day-badge/                   → app-day-badge (chip de día)
│   │   └── toast/                       → gp-toast (montado en app.component)
│   ├── services/
│   │   └── toast.service.ts             → ToastService (success / error / info)
│   └── utils/
│       └── muscle-group.util.ts         → NUEVO — labels ES + opciones de select
│
├── features/
│   ├── auth/
│   │   ├── login/                   → LoginComponent
│   │   └── register/                → RegisterComponent
│   │
│   ├── trainer/
│   │   ├── trainer.routes.ts
│   │   ├── models/
│   │   │   ├── trainer.models.ts
│   │   │   └── billing.models.ts         → BillingPlan, Subscription, SubscriptionStatus
│   │   ├── guards/
│   │   │   └── billing-enabled.guard.ts  → bloquea /suscripcion si billingEnabled = false
│   │   ├── services/
│   │   │   ├── billing.service.ts        → suscripción (signal compartida mySubscription)
│   │   │   ├── student.service.ts
│   │   │   ├── template.service.ts
│   │   │   ├── exercise.service.ts       → COMPLETADO (CRUD full)
│   │   │   ├── assignment.service.ts
│   │   │   └── trainer-workout-log.service.ts → historial del alumno + "marcar hecho" como entrenador (Hoy)
│   │   ├── pages/
│   │   │   ├── students-page/
│   │   │   ├── student-detail-page/
│   │   │   ├── templates-list-page/
│   │   │   ├── template-detail-page/
│   │   │   ├── template-create-page/
│   │   │   ├── exercises-page/       → COMPLETADO (fila clickable → abre detalle)
│   │   │   ├── exercise-detail-page/ → NUEVO — detalle de ejercicio (catálogo)
│   │   │   └── subscription/
│   │   │       ├── subscription-page/        → "Mi suscripción" + vuelta de Mercado Pago (polling)
│   │   │       └── subscription-plans-page/  → tarjetas de planes
│   │   └── components/
│   │       ├── layout/
│   │       │   ├── trainer-layout.component   → incluye <app-trainer-bottom-nav /> (solo celular)
│   │       │   ├── sidebar/                   → Hoy · Alumnos · Turnos · Plantillas · Ejercicios (+ Suscripción)
│   │       │   └── bottom-nav/                → app-trainer-bottom-nav (≤768px)
│   │       ├── students/
│   │       │   ├── student-card.component
│   │       │   └── new-student-modal.component  → muestra errorMessage del backend (+ link a planes)
│   │       ├── subscription/
│   │       │   ├── subscription-banner.component         → aviso en "Mis alumnos"
│   │       │   └── cancel-subscription-modal.component   → confirmación (sobre gp-modal)
│   │       ├── templates/
│   │       │   ├── template-card.component
│   │       │   ├── template-day.component     → limpieza: CSS muerto y console.log sacados
│   │       │   ├── template-edit-modal.component
│   │       │   └── edit-day-modal.component
│   │       └── exercises/
│   │           ├── add-exercise-modal.component   → UNIFICADO (usa app-exercise-form + app-exercise-item, sin duplicación)
│   │           ├── exercise-form.component        → soporta `forceCreate` (crear/editar/crear variante)
│   │           └── exercise-form-modal.component  → soporta `forceCreate`
│   │
│   └── student/
│       ├── student.routes.ts            → incluye guard `todayRedirect` ("Hoy")
│       ├── models/student.models.ts     → + WeekStatus / WeekDayStatus
│       ├── utils/progress.util.ts       → fechas locales, semana lun–dom, racha (usado por Mes)
│       ├── services/
│       │   ├── student-workout.service.ts
│       │   ├── workout-log.service.ts         → my-history (Mes)
│       │   ├── week-status.service.ts         → FUENTE ÚNICA del estado de la semana (signals)
│       │   ├── student-progress.service.ts    → plan + historial juntos (Mes)
│       │   └── student-profile.service.ts
│       ├── components/
│       │   ├── exercise-card/
│       │   └── layout/
│       │       ├── student-layout.component   → incluye <app-bottom-nav /> y <app-cancel-notice />
│       │       └── bottom-nav/                → con Turnos: Inicio · Hoy · Semana · Turnos
│       │                                         sin Turnos: Inicio · Hoy · Semana · Mes · Perfil
│       └── pages/
│           ├── dashboard-page/
│           ├── day-page/          → ejercicios + "Marcar como hecho" / "Me equivoqué, desmarcar"
│           ├── weekly-page/
│           ├── monthly-page/
│           └── profile-page/      → datos + "Cerrar sesión"
│
└── booking/                          → TURNOS (ver sección "Turnos / calendario")
```

---

## Shared Components — API

### `gp-button`
```html
<gp-button
  variant="primary | secondary | ghost | danger"
  size="sm | md | lg"
  [loading]="bool"
  [disabled]="bool"
  [fullWidth]="bool"
  type="button | submit"
  (click)="handler()"
>
  Texto
</gp-button>
```

### `gp-modal`
```html
<gp-modal
  [isOpen]="signal()"
  title="Título"
  size="sm | md | lg | full"
  [closeOnBackdrop]="true"
  [showClose]="true"
  (closed)="signal.set(false)"
>
  <!-- ng-content -->
</gp-modal>
```
⚠️ **Fix aplicado:** `:host` tiene `pointer-events: none` para no bloquear clicks cuando está cerrado. El contenedor real `.modal-container` vive dentro del `@if(isVisible())`.

### `gp-badge`
```html
<gp-badge
  variant="active | inactive | rest | completed | pending | overdue | accent | neutral"
  size="sm | md"
  [dot]="bool"
>
  Texto
</gp-badge>
```

### `gp-input` (ControlValueAccessor)
```html
<gp-input
  label="Label flotante"
  type="text | email | password | number | search"
  [errorMsg]="string | null"
  [hint]="string | null"
  [disabled]="bool"
  formControlName="field"
  <!-- o -->
  [ngModel]="value()"
  (ngModelChange)="value.set($event)"
/>
```

### `gp-skeleton`
```html
<gp-skeleton
  shape="line | circle | rect | card"
  width="100%"
  height="48px"
  radius="10px"
/>
```

### `app-page-loader` (shared) — estado de carga estándar
```html
@if (isLoading()) { <app-page-loader message="Cargando tu semana…" /> }
<app-page-loader [size]="40" [compact]="true" message="Cargando planes…" />   <!-- modales/tarjetas -->
```
Envuelve `<app-gym-loader>` (persona levantando la barra) centrado + texto. **Usarlo para toda carga de
página o sección**; reemplazó a los skeletons en Inicio/Día/Semana/Mes/Perfil del alumno y en Alumnos,
Ejercicios, Perfil y el modal de asignar del trainer. Los botones mantienen su spinner propio (`[loading]`).

### `gp-muscle-icon` — silueta anatómica (frente/espalda)
```html
<gp-muscle-icon [muscleGroup]="ex.primaryMuscle" [size]="28" />                       <!-- zoom (default), listas -->
<gp-muscle-icon [muscleGroup]="d.primaryMuscle" [secondary]="d.secondaryMuscles"
                mode="both" [size]="220" />                                          <!-- detalle -->
```
- `mode`: `zoom` (default; encuadra torso o piernas en la vista del músculo, cuadrado) · `single`
  (cuerpo entero, una vista) · `both` (frente + espalda). `size` = ancho en px.
- `[secondary]`: secundarios en azul suave (fill-opacity .42). Principal en `--color-accent`.
- Dibujos en `muscle-body.paths.ts` (lienzo 100×196, solo lado izquierdo; el derecho se espeja).
  Para ajustar un músculo, editar sus paths ahí. Vista por músculo: espalda para BACK, TRICEPS,
  GLUTES, HAMSTRINGS, CALVES; frente para el resto.
- Colores por variables CSS en el `svg`: `--mi-body`, `--mi-neutral`, `--mi-muscle`, `--mi-primary`.
- Usos: filas de ejercicio (28px), tarjeta del alumno (26px), header del detalle (48px) y mapa muscular
  `both` 220px en `app-exercise-detail`.

### `app-exercise-item` (NUEVO)
Fila reutilizable de ejercicio. Usada en `TemplateDayComponent` (contexto día: número de orden + sets/reps/rest + quitar), en `ExercisesPageComponent` (contexto catálogo: badge Global/Personal + click → detalle + editar/eliminar) y en `AddExercisesModalComponent` (contexto selección: `selected` con check icon).

```html
<app-exercise-item
  [name]="string"
  [muscleGroup]="MuscleGroup | null"
  [detail]="string"                    <!-- "3 series · 10 reps · 60s" o "Pecho" -->
  [index]="number | null"              <!-- contexto día -->
  [badge]="{ text: string, variant } | null"  <!-- contexto catálogo -->
  [clickable]="bool"
  [selected]="bool"                    <!-- NUEVO — contexto selección (AddExercisesModal) -->
  [showRemove]="bool"                  <!-- contexto día -->
  [showEdit]="bool"                    <!-- contexto catálogo -->
  [showDelete]="bool"                  <!-- contexto catálogo -->
  (itemClick)="..."
  (remove)="..."
  (edit)="..."
  (delete)="..."
/>
```
⚠️ Reemplaza el `<li class="exercise-item">` que antes vivía hardcodeado dentro de `template-day.component.html` **y** dentro de `add-exercises-modal.component.html` (tab "Existentes") — ambos unificados.

### `app-exercise-form` / `app-exercise-form-modal`
```html
<app-exercise-form-modal
  [isOpen]="signal()"
  [editingExercise]="ExerciseDetail | null"   <!-- detalle, NO el item de listado -->
  [forceCreate]="bool"
  [submitting]="bool"
  (closed)="..."
  (save)="onSave($event)"   <!-- emite ExerciseFormValue → toExercisePayload(value) -->
/>
```
- `null` → modo crear. `ExerciseDetail` → modo editar.
- Campos: nombre, músculo principal (select) + secundarios (chips; el principal se deshabilita),
  tipo, equipamiento, lateralidad, dificultad 1–5, valores sugeridos (series, reps mín/máx, descanso)
  con validador de grupo `repsRange` (mín ≤ máx, igual que el backend), técnica (textarea, **un paso
  por línea**), descripción, imagen y video.
- `toExercisePayload()` (`exercise-meta.util.ts`) convierte el form a `ExerciseRequest`: `''` → `undefined`,
  la técnica se parte con `parseTechniqueSteps()` (ignora líneas vacías y numeración "1." / "2)" / "-").
- Para editar desde el listado, `ExercisesPage` primero pide `getById()`: el item de listado no trae
  técnica ni secundarios.

Usado en: `ExercisesPageComponent` (crear/editar), `AddExercisesModalComponent` tab "Crear nuevo",
`ExerciseDetailPageComponent` (editar).

### `app-exercise-detail` (shared) + `app-exercise-detail-page`
`app-exercise-detail` (shared, Trainer y Student) recibe `ExerciseDetailViewModel`: chips (músculo,
tipo, equipo, lateralidad, Global/Personal), "También trabaja: …", "Variante de X", stats
(series / reps / descanso, solo los que vengan), dificultad, descripción, técnica en pasos numerados
y link al video. Cada sección se muestra solo si el dato existe (Student arma un VM mínimo).

`app-exercise-detail-page` (`/trainer/exercises/:id`): los botones salen de **`canEdit` /
`canCreateVariant` que calcula el backend** (no se deduce en el front).
- "Crear variante" → `POST /exercises/:id/variants`, navega al nuevo (escucha `paramMap`, no snapshot).
- "Usar en plantilla" → navega a `/trainer/templates` (no hay flujo propio todavía).
- "Eliminar" archiva (soft delete); las plantillas que lo usan no se tocan.

---

## Modelos principales

### Auth
```typescript
type RoleType = 'ROLE_ADMIN' | 'ROLE_TRAINER' | 'ROLE_STUDENT' | 'ROLE_GLOBAL_ADMIN' | 'ROLE_GYM_ADMIN'

interface AuthSession {
  token: string
  mail: string
  roles: RoleType[]
  expiresAt: Date
}
```

### Trainer Models (`trainer.models.ts`)
⚠️ **Esta sección estaba desactualizada respecto al código real** — quedó corregida acá con las interfaces tal como están hoy en `trainer.models.ts`.

```typescript
type MuscleGroup =
  'CHEST' | 'BACK' | 'SHOULDERS' | 'BICEPS' | 'TRICEPS' | 'FOREARMS' |
  'QUADRICEPS' | 'HAMSTRINGS' | 'GLUTES' | 'CALVES' | 'CORE' | 'FULL_BODY'
// Igual al enum del backend. LEGS y CARDIO ya NO existen.
type Equipment = 'BARBELL' | 'DUMBBELL' | 'MACHINE' | 'CABLE' | 'BODYWEIGHT' |
  'KETTLEBELL' | 'BAND' | 'OTHER'
type ExerciseType = 'COMPOUND' | 'ISOLATION'      // exercise-meta.util.ts
type Laterality   = 'BILATERAL' | 'UNILATERAL'    // exercise-meta.util.ts
type ExerciseScope = 'GLOBAL' | 'MINE' | 'ALL'    // solo filtro de listado

interface StudentSummary {
  id: number
  fullName: string | null      // el campo siempre viene, puede ser null
  dni: string                  // string, no number (puede tener ceros a la izquierda)
  active: boolean
  activeWorkout: {
    startDate: string
    templateName: string
    dayCount: number
  } | null
  adherencePercent: number | null   // 0-100
}

interface WorkoutSummary {
  id: number
  templateName: string
  startDate: string        // ISO date
  active: boolean
}

// Item de listado — espejo de ExerciseResponse. Sin colecciones.
interface Exercise {
  id: number; name: string; description?: string | null
  primaryMuscle: MuscleGroup
  exerciseType?: ExerciseType | null; equipment?: Equipment | null; laterality?: Laterality | null
  difficulty: number; imageUrl?: string | null
  global: boolean                    // trainer == null en el backend
  trainerId?: number | null; trainerName?: string | null
  parentExerciseId?: number | null   // != null → es una variante
  createdAt?: string | null
}

// Detalle — espejo de ExerciseDetailDto (GET /exercises/:id, y respuesta de POST/PUT/variants)
interface ExerciseDetail {
  id; name; description; primaryMuscle; secondaryMuscles: MuscleGroup[]
  exerciseType; equipment; laterality; difficulty
  defaultSets?; defaultRepsMin?; defaultRepsMax?; defaultRestSeconds?   // valores sugeridos
  techniqueSteps: string[]; imageUrl?; videoUrl?
  global: boolean; parentExerciseId?; parentExerciseName?
  canEdit: boolean            // lo calcula el backend: dueño y no global
  canCreateVariant: boolean   // lo calcula el backend: es trainer
}

// Create y update usan el MISMO DTO (PUT reemplaza todo)
interface ExerciseRequest {
  name: string; description?; primaryMuscle: MuscleGroup; secondaryMuscles?: MuscleGroup[]
  exerciseType?; equipment?; laterality?; difficulty: number   // 1-5, requerida
  defaultSets?; defaultRepsMin?; defaultRepsMax?; defaultRestSeconds?
  techniqueSteps?: string[]; imageUrl?; videoUrl?
}
type CreateExerciseRequest = ExerciseRequest
type UpdateExerciseRequest = ExerciseRequest

interface WorkoutTemplate {
  id: number
  name: string
  description?: string
  trainerId: number
  days: WorkoutTemplateDay[]
}

interface WorkoutTemplateSummary {
  id: number
  name: string
  description?: string
  dayCount: number
  exerciseCount?: number      // pendiente de backend
  assignedStudents?: number   // pendiente de backend
}

interface WorkoutTemplateDay {
  id: number
  name: string
  description: string
  orderIndex: number
  workoutDayId: number        // usar este campo (no `id`) para PUT /workout-days/:workoutDayId
  dayNumber: number            // 1 = Lunes … 7 = Domingo
  exercises: DayExercise[]
  workoutTemplateName: string
}

interface UpdateDayRequest {
  name: string
  description: string
  orderIndex: number
}
// Fuente única: edit-day-modal.component.ts lo re-exporta desde acá (ya no lo redeclara).

// Espejo de DayExerciseResponse
interface DayExercise {
  id: number
  workoutDayId?: number; workoutDayName?: string
  exerciseId: number; exerciseName: string
  primaryMuscle: MuscleGroup       // (antes muscleGroup)
  difficulty: number; imageUrl: string
  sets: number
  reps: number                     // mínimo del rango
  repsMax?: number | null          // tope del rango
  weightSuggestion?: number | null // kg (antes `weight`, que el backend ignoraba)
  restSeconds: number | null
  notes?: string; orderIndex: number
}

// Espejo de DayExerciseRequest. Lo vacío (sets, reps/repsMax, restSeconds) el backend
// lo prellena con los default* del ejercicio.
interface AddExerciseToDayRequest {
  exerciseId: number
  sets?: number; reps?: number; repsMax?: number; restSeconds?: number
  weightSuggestion?: number; orderIndex?: number; notes?: string
}
// Para mostrar: dayExerciseSummary(de) → "3 series · 8–10 reps · 20kg · 90 s"

interface StudentDetail {
  id: number
  fullName: string
  dni: string
  active: boolean
  adherencePercent: number
  activeWorkout?: ActiveWorkoutDetail | null
  activeTemplate?: WorkoutTemplate | null   // árbol completo con days[]
  workoutHistory: WorkoutHistoryItem[]
  recentLogs: RecentLog[]
}
```

### `muscle-group.util.ts` y `exercise-meta.util.ts`
```typescript
// muscle-group.util.ts — fuente ÚNICA de labels de músculo (se borró la copia de trainer.models.ts)
MUSCLE_GROUP_LABELS, muscleGroupLabel(mg), MUSCLE_GROUP_OPTIONS
// exercise-meta.util.ts
EXERCISE_TYPE_* / LATERALITY_* / EQUIPMENT_* (labels + options), DIFFICULTY_*, SCOPE_OPTIONS
restLabel(90) → "90 s" · repsRangeLabel(8, 10) → "8–10" · dayExerciseSummary(de)
parseTechniqueSteps(text) · toExercisePayload(formValue): ExerciseRequest
```

---

## Servicios — Endpoints

### AuthService
```
POST /auth/login      → { accessToken, tokenType }
POST /auth/register   → confirmación
```
⚠️ El campo del token es `accessToken`, no `token`.

### StudentService
```
GET  /api/v1/trainer/students        → StudentSummary[]
GET  /api/v1/trainer/students/:id    → StudentDetail
POST /api/v1/trainer/students        → confirmación (solo dni requerido)
```

### TemplateService
```
GET    /api/v1/workout-templates          → WorkoutTemplateSummary[]
GET    /api/v1/workout-templates/:id      → WorkoutTemplate (con days[])
POST   /api/v1/workout-templates          → WorkoutTemplate
PUT    /api/v1/workout-templates/:id      → WorkoutTemplate
DELETE /api/v1/workout-templates/:id      → void
POST   /api/v1/workout-templates/:id/days → WorkoutTemplateDay
DELETE /api/v1/workout-templates/:id/days/:dayId → void
POST   /api/v1/workout-templates/:id/days/:dayId/exercises → DayExercise
DELETE /api/v1/workout-templates/:id/days/:dayId/exercises/:exId → void
```

### ExerciseService
`ENVIRONMENT.apiUrl` = `http://localhost:8080/api` (**sin `/v1`**). Rutas reales:
```
GET    /api/exercises?search&primaryMuscle&equipment&exerciseType&scope=ALL|GLOBAL|MINE → Exercise[] (sin archivados)
GET    /api/exercises/:id            → ExerciseDetail
POST   /api/exercises                → ExerciseDetail   (trainer)
PUT    /api/exercises/:id            → ExerciseDetail   (solo propios)
POST   /api/exercises/:id/variants   → ExerciseDetail   (clona como propio, nombre "<original> (variante)")
DELETE /api/exercises/:id            → void             (archiva, soft delete)
```
`ExercisesPage` filtra **en el backend** (`toObservable(filters)` + `debounceTime(250)` + `switchMap`).

### AssignmentService
```
POST   /api/v1/workout-templates/:templateId/assign/:studentId → StudentWorkout
DELETE /api/v1/student-workouts/:id   → void
```

### WorkoutDayService (días)
```
PUT    /api/v1/workout-days/:workoutDayId → WorkoutDayResponse
```
⚠️ Usa `workoutDayId` (campo `WorkoutTemplateDay.workoutDayId`), no el `id` del día.

### BillingService (suscripción del entrenador)
```
GET    /api/billing/plans                     → BillingPlan[]   (público; maxStudents null = ilimitado)
POST   /api/billing/subscriptions             → Subscription    body { planCode } → redirigir a initPoint
GET    /api/billing/subscriptions/me          → Subscription | 204 (→ null, nunca se suscribió)
POST   /api/billing/subscriptions/me/cancel   → Subscription (CANCELLED)
```
- Estados: `PENDING | AUTHORIZED | PAUSED | CANCELLED`. `initPoint` solo viene en PENDING.
- `mySubscription` (signal): `undefined` = no consultado, `null` = sin suscripción. `isActive` = AUTHORIZED.
- Helpers en el mismo archivo: `apiErrorMessage(err, fallback)` (saca `message` de los 400) e
  `isStudentLimitError(msg)`.
- Planes y precios siempre del backend, nunca fijos en el front. Nada de MP se guarda en el front.

### Student — servicios y endpoints
```
GET    /api/student-workouts/my-workout                → resumen del plan activo
GET    /api/student-workouts/my-workout/days           → árbol días/ejercicios
GET    /api/student-workouts/my-workout/days/:dayId    → un día (404 si no es de su plan)
GET    /api/student-workouts/my-workout/week?date=     → WeekStatus de la semana que contiene `date` (default hoy)
POST   /api/workout-logs/my/:workoutDayId?date=        → marca hecho (default hoy) → WeekStatus
DELETE /api/workout-logs/my/:workoutDayId?date=        → desmarca (default hoy) → WeekStatus
GET    /api/workout-logs/my-history                    → todos los logs (lo usa Mes)
GET/PUT /api/student/profile (StudentProfileService)
```

### Semana del alumno — cómo funciona
El plan (A, B, C…) es un **molde** que se repite cada semana: nunca se marca como completado.
Cada sesión es un `WorkoutLog` con fecha. "Hecho esta semana" = existe un log de ese día entre
lunes y domingo. **No se guarda estado**: al cambiar de semana todo vuelve a pendiente solo.
"Hoy" lo define el backend en horario de Argentina (`WeekStatus.today`), no el celular.

```typescript
interface WeekStatus {
  studentWorkoutId; templateName
  today; weekStart; weekEnd           // "YYYY-MM-DD"; semana lun–dom
  currentWeek: boolean
  weekNumber: number | null           // 1 = semana del startDate de la asignación
  durationWeeks: number | null        // hoy siempre null (WorkoutTemplate no tiene duración)
  doneCount; totalDays
  days: { workoutDayId; name; orderIndex; exerciseCount; done; completedAt; timesDone }[]
}
```
`WeekStatusService` (root) guarda la última respuesta en un signal `week` y expone `days`,
`percent`, `nextDay` y `doneToday(id)`. `markDone` / `unmark` reemplazan el signal con la
respuesta del backend → **las páginas no guardan estado propio**.
- **Semana**: lee el servicio; flechas = `load(lunes ± 7)`.
- **Día**: siempre llama `load()` al entrar (evita datos de otro alumno en el mismo navegador).
- **Hoy** (`/student/daily`): guard que redirige al primer día pendiente o a Semana.
- **Mes**: calendario armado desde `my-history` (`progress.util.ts`), con racha en semanas.

---

## Patrones Angular 19 usados

### Suscripciones RxJS en componentes
Todos los `.subscribe()` de componentes (`features/**/*.component.ts`) van con
`.pipe(takeUntilDestroyed(this.destroyRef))` y el componente declara primero
`private readonly destroyRef = inject(DestroyRef);`. Así una respuesta que llega tarde (celular lento) no pisa la
pantalla a la que ya se fue el usuario. Los servicios no lo usan (son root). Sin `console.log` de debug en el código.

### Signals
```typescript
readonly data    = signal<T[]>([]);
readonly loading = signal(false);
readonly error   = signal<string | null>(null);

readonly filtered = computed(() => { ... });
```

### Effect para reset de forms
```typescript
constructor() {
  effect(() => {
    if (this.isOpen()) {
      this.field.set('');
      this.submitted.set(false);
    }
  });
}
```

### Effect para hidratar form reactivo desde input (crear/editar)
```typescript
// ExerciseFormComponent: initialValue() null = crear, Exercise = editar
constructor() {
  effect(() => {
    const ex = this.initialValue();
    if (ex) this.form.patchValue({ ...ex });
    else this.form.reset({ name: '', description: '', muscleGroup: '' });
  });
}
```

### Update local sin recargar
```typescript
// Agregar item
this.items.update(list => [newItem, ...list]);

// Parchear item
this.items.update(list =>
  list.map(i => i.id === id ? { ...i, ...changes } : i)
);

// Eliminar item
this.items.update(list => list.filter(i => i.id !== id));
```

### Separación de signals de loading
```typescript
readonly isLoading  = signal(false);  // carga inicial
readonly isCreating = signal(false);  // acción de crear
readonly isSaving   = signal(false);  // acción de guardar
readonly isDeleting = signal(false);  // acción de eliminar
```

### Componentes de fila reutilizables entre contextos
`ExerciseItemComponent` se parametriza por completo vía inputs (`index`, `badge`, `showRemove`/`showEdit`/`showDelete`) en vez de tener dos componentes casi iguales. Mismo criterio a futuro para otras filas/cards que se repitan entre feature trainer y catálogos.

---

## Rutas

```
/login                          → LoginComponent (loginGuard)
/register                       → RegisterComponent (loginGuard)
/recuperar-contrasena           → ForgotPasswordComponent (loginGuard) — solo trainers
/reset-password?token=…         → ResetPasswordComponent (link del mail)

/trainer                        → TrainerLayoutComponent
/trainer/students               → StudentsPageComponent
/trainer/students/:id           → StudentDetailPageComponent
/trainer/templates              → TemplatesListPageComponent
/trainer/templates/referencia   → ReferenceTemplatesPageComponent (planes de PlanGym → "Usar este plan" copia)
/trainer/templates/new          → TemplateCreatePageComponent
/trainer/templates/:id          → TemplateDetailPageComponent
/trainer/exercises              → ExercisesPageComponent (COMPLETADO)
/trainer/exercises/:id          → ExerciseDetailPageComponent (NUEVO)
/trainer/suscripcion            → SubscriptionPageComponent (billingEnabledGuard + roleGuard('ROLE_TRAINER'))
/trainer/suscripcion/planes     → SubscriptionPlansPageComponent (idem)
/suscripcion                    → redirect a /trainer/suscripcion conservando la query (back_url de MP)

/student                        → StudentLayoutComponent (+ bottom-nav)
/student/dashboard              → DashboardPageComponent
/student/daily                  → guard todayRedirect → /student/day/:id o /student/weekly
/student/day/:workoutDayId      → DayPageComponent
/student/weekly                 → WeeklyPageComponent
/student/monthly                → MonthlyPageComponent
/student/profile                → ProfilePageComponent
/student/turnos                 → StudentAgendaPage (calendario + horarios libres) — studentBookingGuard
/student/turnos/horarios        → StudentSchedulePage (horarios día por día + Recuperar)
/student/turnos/elegir          → StudentChoosePage (elegir horarios fijos, si el servicio lo permite)
/student/turnos/reservar        → StudentBookPage (clase suelta)

/trainer/hoy                    → TrainerTodayPage (quién viene hoy + plan del día) — trainerBookingGuard
/trainer/turnos                 → TrainerAgendaPage (calendario) — trainerBookingGuard
/trainer/turnos/horarios-fijos  → TrainerEnrollmentsPage
/trainer/turnos/disponibilidad  → TrainerAvailabilityPage (franjas y cupos + días sin clase) — unsavedChangesGuard
/trainer/turnos/servicios       → TrainerServicesPage (Mis servicios: activos + eliminados con Reactivar)
```
⚠️ `templates/referencia` y `templates/new` deben ir ANTES que `templates/:id` en el array de rutas.
⚠️ El guard de `/trainer` deja pasar ADMIN y GYM_ADMIN; las rutas de suscripción suman
`roleGuard('ROLE_TRAINER')` porque el billing es solo del entrenador.

---

## Bugs conocidos y fixes aplicados

### 1. Modal bloqueaba clicks cuando estaba cerrado
**Fix:** `:host { pointer-events: none }`. El `.modal-container` vive dentro del `@if(isVisible())`.

### 2. Sesión perdida en cada refresh
**Fix:** Restauración de sesión movida al `constructor()` explícito (no en inicializador de campo). `expiresAt` guardado como timestamp numérico (`getTime()`), no como ISO string.

### 3. `t.days is not iterable`
**Fix:** `GET /workout-templates` devuelve `WorkoutTemplateSummary[]` (sin days). `GET /workout-templates/:id` devuelve `WorkoutTemplate` completo (con days). Nunca mezclar los dos tipos.

### 4. JWT sin roles
**Fix en backend:** `JwtGenerator.generateToken()` debe incluir `.claim("roles", roles)`.

### 5. Token guardado como `token` vs `accessToken`
**Fix:** El backend devuelve `accessToken`. El modelo `AuthResponse` usa `accessToken`.

### 6. `TemplateDayComponent` muestra botones en StudentDetailPage
**Fix:** Agregar `readonly = input<boolean>(false)`. Envolver botones con `@if (!readonly())`.
*(Verificado: ya estaba aplicado correctamente en `StudentDetailPage`, no hizo falta tocarlo.)*

### 7. `ExerciseService` — endpoints inconsistentes
**Fix:** ver detalle en la sección ExerciseService más arriba. `getById/update/delete` tenían `/api/v1` duplicado.

### 8. `AddExercisesModalComponent` duplicaba `ExerciseFormComponent` y `app-exercise-item`
**Fix:** tab "Crear nuevo" ahora embebe `<app-exercise-form>`; tab "Existentes" ahora usa `<app-exercise-item [selected]>` en vez de un `<li>` hardcodeado con su propio CSS.

### 9. Componente `exercise-card` — stub vacío sin usar
**Fix:** se eliminó (`features/trainer/components/exercises/exercise-card/`). No estaba importado ni referenciado en ningún lado; su rol quedó cubierto por la nueva `ExerciseDetailPageComponent`.

### 10. `console.log` de debug sueltos
**Fix:** removidos de `template-day.component.ts`, `template-detail-page.component.ts` (x3) y `student-detail-page.component.ts`. Se aprovechó para sacar también el CSS muerto en `template-day.component.css` que quedó de antes de migrar a `app-exercise-item`.

---

### 11. Exercise refactor (oct-2026)
Front alineado al refactor del backend: `muscleGroup` → `primaryMuscle` + `secondaryMuscles`,
`globalExercise` → `global`, `technique` → `techniqueSteps[]`, equipo como enum, valores sugeridos,
variantes, soft delete, `canEdit`/`canCreateVariant` desde el backend.

### 12. Peso nunca se guardaba
El front mandaba `weight` y `DayExerciseRequest` espera `weightSuggestion` → el backend lo ignoraba.
Corregido en modelo, modal y vistas. El peso por defecto del modal pasó de 5 a vacío.

### 13. Labels del formulario sin color
`--color-muted-light` se usaba pero no estaba definida y `body` no tenía color → labels en negro.
Corregido en `token.css` + base global en `styles.css`.

### 14. Sidebar del trainer desbordaba
`.sidebar` medía `100dvh` + 48px de padding (faltaba `box-sizing: border-box`) → usuario y
"Cerrar sesión" quedaban fuera de pantalla. Corregido; "Cerrar sesión" ahora es un ícono en la
misma fila que el usuario.

### 15. Perfil del alumno nunca había funcionado
No tenía ruta, usaba un selector inexistente (`app-input-field` en vez de `gp-input`), un `@else if
(...; as p)` inválido, y el link del dashboard no importaba `RouterLink`. Corregido + ruta
`/student/profile` + pestaña en bottom-nav + "Cerrar sesión".

### 16. El alumno no podía registrar entrenamientos
Nada llamaba a `workout-logs`. Ahora "Marcar como hecho" / "desmarcar" en el Día (ver "Semana del
alumno"). La bottom-nav existía pero no estaba montada en el layout: ya lo está.

### 17. Archivos perdidos al descomprimir un zip (oct-2026)
Al extraer `planGym-app-cambios.zip` desaparecieron los archivos que traía. Se restauraron
escribiéndolos directo. Preferir escritura directa al proyecto antes que zips.

### 18. Recuperación de contraseña (trainers)
"¿Olvidaste tu contraseña?" en el login de entrenador → `/recuperar-contrasena` (pide mail; respuesta
siempre igual, exista o no) → mail con link → `/reset-password?token=…` (mín. 8 caracteres, repetir) →
login. `core/auth/services/password-reset.service.ts` → `POST /api/auth/password/forgot` y `/reset`.
Ambas páginas reutilizan `login.component.css`. Alumnos: fuera del MVP (se resuelve a mano).

### 19. El error al crear alumno nunca se mostraba
`StudentsPage` cargaba `createError` pero no se lo pasaba al modal, y el HTML de `new-student-modal`
no mostraba `errorMessage`. Además el botón "+ Nuevo alumno" no limpiaba el error anterior.
Ahora: `[errorMessage]`, `[isSaving]` y `[showPlansLink]` al modal, el botón usa `openCreateModal()` y
el texto sale del `message` del 400 del backend (DNI repetido/inválido, límite del plan).

---

## Planes de referencia y ejercicios por tiempo (nov-2026, backend V24)
- `GET /workout-templates/reference` → `ReferenceTemplate[]` (name, description, level, daysPerWeek, exerciseCount);
  `GET /workout-templates/reference/:id` → `WorkoutTemplate` con días; `POST /workout-templates/reference/:id/copy` → la copia
  (201). Los originales no se editan ni se asignan. Página `/trainer/templates/referencia` (botón "Planes de referencia" en
  Plantillas): ver días (solo lectura, `app-template-day [readonly]`) y "Usar este plan" → copia y abre la plantilla nueva.
- `DayExercise.durationSeconds` (y en `AddExerciseToDayRequest`): ejercicio por tiempo, viene con `reps = 0`.
  `dayExerciseSummary` muestra "3 × 20 seg" y suma `notes` cortas ("Por pierna"); `setsRepsLabel` / `durationLabel` en
  `exercise-meta.util.ts`. El modal "Agregar ejercicio" tiene el selector Repeticiones / Por tiempo.
- Probado contra el backend real ✔ (lista, ver días, copiar). Si aparece "Valor inválido para el parámetro 'id'" en
  `/reference`, el backend corriendo es anterior a V24 (la ruta cae en `/{id}`): pull de `feature/booking` y reiniciar.

## Alumnos con este plan (nov-2026)
`app-template-students` en el detalle de plantilla: lista quién la tiene activa, "+ Asignar" (buscador; aviso si
reemplaza otro plan — el backend desactiva el anterior) y "Quitar" (`DELETE /student-workouts/{id}`, confirma).
El listado de alumnos trae `activeWorkout.workoutTemplateId` y `studentWorkoutId`: se filtra por id, sin llamadas extra.
Si el backend no los manda (versión vieja), cae al método anterior: filtra por nombre y confirma con
`GET /student-workouts/student/{id}`.
- **Eliminar plantilla con alumnos:** el componente emite `countChange` (nombres); si hay alumnos, el modal de
  eliminar no muestra el botón y explica que primero hay que quitárselo. Si el backend rechaza, se muestra su `message`.
- [x] Backend: `workoutTemplateId` y `studentWorkoutId` en `activeWorkout` del listado.

## Sistema visual (nov-2026, rama `feature/ui-tokens`)

### Política de colores y tokens
- **Ningún color literal fuera de `src/styles/token.css`.** Ni hex ni `rgba()` de la paleta en CSS, TS o HTML.
  Única excepción: los archivos de `public/` (favicon). Sombras `rgba(0,0,0,…)` y reflejos `rgba(255,255,255,…)` sí.
  Verificar: `grep -rnoiE "#[0-9a-f]{3,8}\b" src/app src/styles.css src/styles/booking.css --include=*.css --include=*.ts --include=*.html`
- Variantes: `--color-border-strong`, `--color-surface-raised` (capa sobre card), `--color-surface-sunken` (inputs),
  `--color-accent-hover`, `--color-*-soft` (texto claro sobre tinte), `--color-danger-strong` (relleno rojo con texto blanco),
  `--color-on-accent` (texto sobre relleno), `--color-violet*` (solo avatares), `--gradient-accent` (línea de acento de cards).
- **Transparencias:** `--color-<color>-a<%>` con escala única 8 · 12 · 20 · 30 · 40 · 50 (ej. `--color-danger-a8`).
  Si hace falta otra, agregarla en `token.css`, no escribir `color-mix` suelto.
- **Texto en color:** acento como texto = `--color-accent-text` (#7590FA); rojo como texto = `--color-danger-soft`.
  `--color-accent` / `--color-danger` quedan para bordes, rellenos y barras. Texto sobre success/warning/celeste = `--color-bg`.
- **Texto secundario = `--color-muted-light`** (5,9:1 sobre card). `--color-muted` solo para placeholders, deshabilitados y
  elementos decorativos (3,2:1: no alcanza para texto).
- Radios: `--radius-sm` 8 · `--radius-md` 14 · `--radius-lg` 20 · `--radius-full`. Se dejan 50% (círculos) y 2–4px (barras).
- ⚠️ No redefinir un token global dentro de un componente (`--color-accent: var(--color-accent)` es circular y deja el
  valor vacío: así se rompió el botón del login).

### Escala tipográfica
`--text-xs` 12/16 · `--text-sm` 14/20 · `--text-md` 16/24 · `--text-lg` 20/28 · `--text-xl` 26/32 (`--leading-*`).
Nada por debajo de 12px; texto de lectura ≥ 14px. Títulos grandes de página (30–32px) quedan en px.

### Contraste (WCAG AA, texto normal ≥ 4,5:1)
| Texto / fondo | card #1C1C26 | surface-raised #232330 |
|---|---|---|
| text | 14,9 | 13,6 |
| muted-light | 5,9 | 5,5 |
| accent-text | 5,7 | 5,3 |
| danger-soft | 8,9 | 8,2 |
| success / success-soft | 7,4 / 9,7 | 6,8 / 8,9 |
| warning / warning-soft | 7,9 / 11,7 | 7,2 / 10,8 |
| celeste | 7,9 | 7,2 |
Rellenos: blanco sobre accent 4,6 · sobre danger-strong 4,8 · `--color-bg` sobre success/warning.

### Regla de 44 px
- Todo elemento interactivo tiene área táctil ≥ 44×44 en pantallas táctiles.
- **Botón de ícono único: `gp-icon-button`** (`icon`, `variant` ghost|primary|danger, `size` sm|md|lg, `[bordered]`,
  `ariaLabel` **obligatorio**). Se ve de 32/36/40 px pero un `::before` invisible lleva el área a 44×44. Ya no existen
  `.action-btn`, `.exercise-icon-btn` ni `.header-action-btn`. Íconos decorativos van como `<svg aria-hidden>`, no como
  botón deshabilitado.
- `gp-button`: `sm` mínimo 36px de alto; con `@media (pointer: coarse)` todos ≥ 44px. Igual `.bk-tab`, flechas del calendario
  y `.difficulty-btn`. Botones chicos sueltos (`.slot__x`, `.logout-btn`, `.modal-close-btn`) usan el mismo `::before`.
- Bottom-nav: 64px de alto, label 12px.

### Componentes nuevos / unificados
- `app-empty-state` (shared): ícono (`[empty-icon]`) + título + subtítulo + acciones (`[empty-actions]`). Usado en Mis
  alumnos y en el Inicio del alumno. Usarlo para todo estado vacío nuevo.
- `app-student-card`: una columna. Fila 1 avatar + nombre (o DNI) + badge; fila 2 plan · días; fila 3 adherencia
  (`adherencePercent` del backend, barra ≥70 verde / 40–69 ámbar / <40 rojo, "—" si viene null). Pendiente = DNI como
  dato principal + "Registro pendiente"; el estado se marca SOLO con el badge (sin borde ámbar ni avatar ámbar).
  Hover sin `translateY`. Falta backend: fecha de última actividad para "hace 2 días".
  Pie de la card = lista `<dl>` etiqueta / valor con la misma forma para Adherencia, Próxima clase y Horario fijo
  (input `turnos: { next, fixed }`, solo con Turnos prendido). Nada de texto en color suelto.
- Inicio del alumno: `app-next-day-card` destaca el siguiente día pendiente de la semana (`WeekStatusService.nextDay`, el
  mismo criterio que "Hoy"; si la semana no carga, el Día 1). Los días hechos esta semana muestran "Hecho".
- `app-day-badge` (shared) es el único chip de día: lo usan detalle de plantilla y detalle de alumno (antes la plantilla
  tenía su copia). Los chips bajan de línea; no hay scroll horizontal oculto.
- `app-exercise-item`: queda solo el de `shared/` (se borró la copia sin uso de `features/trainer/components`). El nombre
  baja de línea en vez de cortarse.
- Nombres largos (alumno, plantilla, día, ejercicio) **bajan de línea** (`overflow-wrap: anywhere`), no usan ellipsis.

### Verificación visual — `npm run visual`
`tools/visual/visual-check.mjs` hace `ng build`, sirve `dist/`, simula el backend (`tools/visual/mocks.mjs`, Playwright
interceptando `api.plangympro.com`, sesión fake en localStorage) y saca capturas en 360 / 390 / 768 / 1280 px de: Mis alumnos
(con y sin Turnos), detalle de alumno, detalle de plantilla, modal Agregar ejercicio, Ejercicios, Inicio del alumno (con plan,
sin plan, semana completa), Semana, login y registro. **Falla si hay scroll horizontal o errores de JS.** Capturas en
`visual-output/` (ignorado por git). `node tools/visual/visual-check.mjs inicio` corre solo las que contienen "inicio".
Primera vez en una máquina: `npx playwright install chromium`. Si cambia un DTO, actualizar `mocks.mjs`.

### Tamaño de CSS por componente
- `angular.json`: aviso `anyComponentStyle` en **4,5 kB** (los `var(--…)` pesan más que los hex). Hoy **ningún componente
  avisa**. El límite es por hoja: un componente puede tener varias en `styleUrls`.
- Hojas compartidas (van PRIMERO en `styleUrls`): `features/auth/auth-shared.css` (fondo, logo y error de login / registro /
  recuperar), `features/student/pages/student-pages.css` (flechas de Semana/Mes, tarjeta de error),
  `features/trainer/pages/detail-pages.css` (`.back-btn` con 44 px y `.error-banner` de los detalles de alumno, plantilla y
  ejercicio). Solo se incluyen en los componentes que usan esas clases.
- `app-booking-calendar` usa tres hojas en orden: `calendar.component.css` (base + Semana), `calendar-entries.css`,
  `calendar-month.css`. **El orden importa** (es el orden original de las reglas).
- La página Semana del alumno usa `app-next-day-card` (igual que el Inicio) en vez de su propia tarjeta "Te toca".

### Modal (`gp-modal`) accesible
Al abrir enfoca el primer campo del contenido (en pantallas táctiles, el panel, para no abrir el teclado), Tab / Shift+Tab
quedan dentro, Escape cierra solo el modal de arriba (pila estática) y al cerrar el foco vuelve al botón que lo abrió.
`aria-labelledby` apunta al título. El scroll del body se libera cuando no queda ningún modal abierto.

### Logo
El SVG del logo (sidebar, layout, registro) usa `style="fill: var(--color-accent)"`. `public/favicon.svg`,
`favicon.ico` y `apple-touch-icon.png` están en #4A68F2 (no pueden usar tokens).

## Suscripciones del entrenador (nov-2026)
Quien paga es el TRAINER: suscripción mensual a la plataforma con Mercado Pago (preapproval).
Sin suscripción AUTHORIZED, sus alumnos no pueden entrar (lo resuelve el backend).

- **Flujo:** planes → "Suscribirme" → `POST /subscriptions` → `window.location.href = initPoint` →
  MP vuelve a `/suscripcion?preapproval_id=…` → redirect a `/trainer/suscripcion`.
- **Polling:** si vuelve con `preapproval_id` y sigue PENDING (el webhook tarda), consulta
  `/subscriptions/me` cada 3 s, hasta 5 reintentos, con "Confirmando tu pago…". Al terminar limpia la
  query (`replaceUrl`). Si sigue pendiente, aviso + botón "Actualizar".
- **Mi suscripción:** badge Activa / Pendiente de pago / Pausada / Cancelada / Sin suscripción.
  PENDING → "Continuar con el pago"; AUTHORIZED → "Cancelar suscripción" (modal propio);
  sin suscripción o CANCELLED → "Ver planes". Para cambiar de plan primero se cancela.
- **Banner** (`app-subscription-banner`) solo en "Mis alumnos", no en el layout.
- **Moneda/fechas:** `registerLocaleData(localeEsAR, 'es-AR')` en `app.config.ts`. No se cambió el
  `LOCALE_ID` global (para no alterar fechas existentes): cada pipe pasa `'es-AR'` explícito.
- **Período de prueba — `billingEnabled: false`** en los dos environments (también en la interfaz
  `AppEnvironment`, que existe duplicada; ver pendiente del token `ENVIRONMENT`). Con `false`: sin ítem
  de menú, sin banner (ni consulta), rutas redirigen a `/trainer/students`, sin link a planes en el
  error de límite. Para habilitar: `true` en ambos environments y rebuild.

## Turnos / calendario (booking, nov-2026)

Módulo de turnos de `elytra-platform`. Base: `${apiUrl}/booking/plangym` (JWT, mismo login).
PlanGym **no cobra turnos**: no se muestran precios ni MP; los servicios se mandan con `price: 0`.

### Estructura
```
features/booking/
├── booking.guard.ts                  → trainerBookingGuard / studentBookingGuard (403 = módulo apagado)
├── models/booking.models.ts          → Booking, AgendaItem, Enrollment, ScheduleOverviewItem, SelfEnrollmentOptions, Rule…
├── utils/booking-date.util.ts        → rangos semana/mes, splitRange (≤92 días), isoTime/isoDateKey, hhmm, textos
├── services/
│   ├── booking-http.service.ts       → base URL, cache GET 60 s, invalidación en mutaciones, signal `enabled`
│   ├── booking-trainer.service.ts    → /professional/** (agenda, attendance, availability, blocks, enrollments, services…)
│   ├── booking-student.service.ts    → /bookings/mine, /enrollments/**, /services, /bookings
│   └── calendar-prefs.ts             → última vista (localStorage con try/catch)
├── components/
│   ├── calendar/                     → app-booking-calendar (grilla propia Semana/Mes, sin librería)
│   └── enroll-modal/                 → app-enroll-student-modal (elegir alumno de la lista + franjas → batch con userId)
└── pages/
    ├── trainer-today/                → /trainer/hoy — quién viene hoy (por clase) + plan del día del alumno + marcar hecho
    ├── trainer-agenda/               → /trainer/turnos — agrupa por startAt+serviceId, pasar lista, cancelar con motivo
    ├── trainer-enrollments/          → /trainer/turnos/horarios-fijos — grilla por alumno (chips Lun 07:00…), acciones por horario, recuperaciones
    ├── trainer-services/             → /trainer/turnos/servicios — Mis servicios (activos / eliminados → Reactivar)
    ├── trainer-availability/         → /trainer/turnos/disponibilidad — semana lun–dom con franjas y cupos juntos (borrador + Guardar cambios), bloqueos
    ├── student-agenda/               → /student/turnos — mis clases + mis horarios fijos, ausencia / cancelar
    ├── student-choose/               → /student/turnos/elegir — elegir/cambiar/dejar horarios (selfEnrollment)
    ├── student-schedule/             → /student/turnos/horarios — horarios día por día + Recuperar
    └── student-book/                 → /student/turnos/reservar — clase suelta (SELF/BOTH)
core/http/api-error.util.ts           → apiErrorText(err, fallback): `message` del backend para cualquier status
shared/services/toast.service.ts + shared/components/toast → <gp-toast /> montado en app.component
src/styles/booking.css                → estilos compartidos de turnos (prefijo bk-), importado en styles.css
```

### Decisiones
- **Calendario propio** (sin FullCalendar/angular-calendar): agrupación por clase, contadores en Mes y
  theming con tokens. **Semana** según el ancho (container query 620px):
  - Ancho → **grilla por hora**: días en columnas, solo las horas con clases en filas; por celda 2 clases + "+N más".
  - Angosto/celular → **tira de días** L M M J V S D (contador de clases, rojo si hay completas, punto si solo hay libres)
    + **lista del día elegido** (hoy por defecto). Sin scroll horizontal.
  `angular.json`: budget `anyComponentStyle` subido a 14 kB por el CSS del calendario.
- **Fechas:** `startAt`/`endAt` se leen por texto (`isoTime`, `isoDateKey`), nunca se convierten a la zona
  del navegador. Bloqueos: el `datetime-local` se manda con offset `-03:00`.
- **Recarga, no parcheo:** a diferencia del resto de la app, después de cada acción se recarga el rango
  visible (el backend genera/borra clases solo). La cache de 60 s se invalida entera en cada POST/PUT/PATCH/DELETE.
- **Por usuario:** `BookingHttp.syncUser()` y `StudentClassesService` comparan el token actual: si cambió
  (logout/login en la misma pestaña) se olvida `enabled` y la cache. Antes, un alumno dejaba "Turnos"
  prendido y el entrenador entraba a pantallas que le daban 403.
- **Entrenador sin acceso:** para `/professional/**` el backend exige una fila activa en `bk_professionals`
  (alta por GLOBAL_ADMIN: `POST /booking/plangym/admin/professionals { userId, displayName }`). Sin eso → 403 y
  "Turnos" no aparece en el menú.
- **Módulo apagado:** el primer 403 (antes de cualquier 2xx) pone `enabled = false`. El sidebar del trainer,
  la tarjeta "Mis turnos" del Dashboard del alumno y la oferta de horario fijo en "Mis alumnos" dependen de `probe()`.
- **Alumno — integración en su vista** (`StudentClassesService`, root: probe único + `classesIn(range)` + `upcoming()`):
  - Bottom-nav con Turnos prendido: **Inicio · Hoy · Semana · Turnos** (Turnos tiene vista Semana y Mes; la página
    Mes de entrenamientos queda en "Ver mi mes" dentro de Semana). Sin Turnos: Inicio · Hoy · Semana · Mes · Perfil.
    El Perfil vive en el avatar del header del Inicio (punto naranja si falta completar el nombre).
  - **Mis turnos (calendario):** además de sus clases muestra los **horarios libres** del entrenador (`GET /schedule`
    del rango visible, tenues y punteados, "3 lugares"). Tocar una clase suya → avisar que no va / cancelar; tocar un
    horario libre → recuperar ahí (si le quedan y es del mes). Filtros "Horarios libres" y "Canceladas".
  - **Aviso de cancelación del profe:** `app-cancel-notice` (en el layout del alumno) muestra un popup con las clases
    futuras canceladas por el profe o el sitio (`Booking.cancelledBy === 'PROFESSIONAL'`) y botón "Elegir horario"
    (si `grantsRecovery`). Se muestra una vez por clase (ids vistos en localStorage `pg.student.seenCancelNotices`).
  - Inicio: `app-next-class-card` — próxima clase ("Hoy · 20:00"), "y N más en 7 días", "Avisar que no voy"
    en horario fijo; sin clases → atajos a Elegir horarios / Reservar clase.
  - Semana: hora de la clase en la tira de días + tarjeta "Tus clases" de la semana mostrada.
  - Día: `app-today-classes` — aviso "Hoy tenés clase: Funcional 18:00" (solo si hay).
  - Todo informativo: el plan de ejercicios sigue sin depender del día de la semana.
- **Cupo "7/10"** en el calendario del trainer: sale de cruzar `schedule-overview` (día + hora) porque `AgendaItem`
  no trae capacidad. Si no hay franja que coincida, se muestra solo "7 alumnos".
- **Anotar en horario fijo:** el entrenador elige al alumno de su lista (`GET /v1/users/students`, buscador por nombre o
  DNI) y el batch se manda con `userId` (el backend acepta exactamente uno de userId / dni / mail). Las franjas donde
  ya está anotado se ven como "Ya anotado". Al dar de alta un alumno se abre el modal con él preseleccionado (match por DNI).
  **Tope del plan:** el modal muestra "Este plan es de 2 por semana. Ya tiene 1. Podés elegir 1 más." y no deja marcar más
  días que `weeklyLimit − horarios vigentes del alumno en ese plan`; si lo intenta, aviso ámbar que sugiere "Cambiar plan".
  Cambiar el plan en el select limpia los días elegidos. El backend igual valida (409).
  **Un solo plan por alumno:** si el alumno ya tiene horarios vigentes, el select de plan queda fijo en ese plan ("Ya está en
  X…" + link **Cambiar plan**, que cierra el modal y abre el de cambio de plan de Horarios fijos vía output `changePlan`).
  Un 409 al anotar muestra el `message` + botón "Cambiar plan". En Horarios fijos, el alumno con horarios en dos planes
  (datos viejos) se marca en ámbar: "Tiene horarios en dos planes: unificalos con Cambiar plan" (el backend unifica).
  Alumno (`/student/turnos/elegir`): si ya tiene horarios vigentes, solo ve su plan; un 409 se muestra con su `message`.
- **Horarios fijos:** filtro por defecto **Vigentes (activos y en pausa)** — el mismo criterio que usa el backend para el 409
  de franjas (antes se veían solo los activos y un horario en pausa bloqueaba guardar sin que se viera). Una fila por alumno con chips "Lun 07:00 · Mié 07:00" (pausa = borde punteado, "hasta dd/mm" si
  tiene fin). Tocar un chip abre sus acciones; "+" agrega otro día a ese alumno.
- **Cambiar plan** (backend `feature/booking-change-service`): las filas de Horarios fijos son por **alumno + plan**
  ("Funcional 2 veces · 2/2 por semana"). "Cambiar plan" abre un modal: plan actual, plan nuevo (activos, ENROLLMENT/BOTH,
  distinto del actual), "Desde" (hoy por defecto, sin fechas pasadas) y aviso ámbar si el plan nuevo tiene menos
  `weeklyLimit` que los horarios del grupo (deshabilita Confirmar). `POST /professional/students/{userId}/change-service
  { fromServiceId, toServiceId, from }` → mismos días/horas/estado en el plan nuevo, todo o nada; errores en el modal.
  Si el plan nuevo deja lugar, el "+" dice "Agregar horario". Al anotar, el 409 de "ya tiene todos los días de su plan"
  suma la sugerencia de "Cambiar plan".
- **Franjas y cupos (una sola vista):** grilla lun–dom; cada franja muestra "3/10 fijos" con barra (naranja si está
  completa) y al tocarla se ve la lista de alumnos fijos y se edita. "+ Agregar": Desde + Duración (45/60/90/Otra) + Cupo +
  "Repetir en" (L–D, atajos Lunes a viernes / Todos los días). ✕ quita (confirma si tiene alumnos fijos).
  **Borrador:** todo se arma en pantalla y se guarda con "Guardar cambios" (barra con N cambios + Descartar). El PUT
  reemplaza todas las franjas, por eso **no se deja guardar si la carga inicial falló** (`rulesLoaded`), y hay aviso al
  salir con cambios (`unsavedChangesGuard` + `beforeunload`). Las nuevas se ven "sin guardar".
  Cambiar la hora de una franja **no** mueve a los alumnos fijos (quedan en la hora vieja); el editor lo avisa y el
  backend rechaza con 409 si un cambio deja horarios fijos vigentes fuera de las franjas.
- **Servicios — soft delete:** `DELETE /professional/services/{id}` pone `active=false` y el GET los sigue devolviendo.
  `BookingTrainerService.services()` filtra los activos (filtros, modal de anotar); `allServices()` trae todos y solo lo usa
  la página Servicios, que muestra los eliminados aparte con "Reactivar" (`PUT` con `active: true`).
- ⚠️ **Bug corregido (nov-2026):** `GET/PUT /professional/availability` devuelven `RuleResponse[]` (array), no
  `{ rules }`. El front leía `res.rules` → veía la semana vacía y al guardar **borraba las franjas existentes**.
- **Entrenador en el celular:** barra inferior `app-trainer-bottom-nav` (≤768px): Hoy · Alumnos · Turnos · Plantillas ·
  Ejercicios (Hoy y Turnos solo con el módulo prendido). El ☰ sigue para Perfil, Suscripción y Cerrar sesión. En
  pantallas angostas las pestañas de Turnos (`.bk-tabs`) van en una fila que se desliza.
- **Hoy (`/trainer/hoy`):** `GET /professional/agenda` de hoy (sin canceladas), agrupado por clase. Por cada alumno:
  `GET /v1/users/students/{id}` (plan con días y ejercicios) + `GET /workout-logs/student/{id}`. "Le toca" se calcula en
  el front con el mismo criterio que el "Hoy" del alumno: el día que ya marcó hoy, o el primer día pendiente de la
  semana (lun–dom); si hizo todos, "Semana completa". Al tocar: plan del día (chips para ver otro día) y
  "Marcar como hecho" → `POST /workout-logs { studentId, workoutDayId, completedAt: hoy, completed: true }`
  (`TrainerWorkoutLogService`). No hay desmarcar del lado del entrenador (lo puede desmarcar el alumno).
- **Admin (GYM_ADMIN):** no implementado; no existe panel de GYM_ADMIN en este front.
- **Panel GLOBAL_ADMIN (`features/admin`, Entrenadores):** habilitar/deshabilitar, suscripción a mano
  (`PATCH /admin/users/{id}/subscription { active }`) y "Dar de alta en turnos" para los que aparecen en
  `GET /booking/plangym/admin/professionals/candidates` (`POST …/admin/professionals { userId }`). `subscriptionActive`
  se muestra si `AdminTrainerResponse` lo trae (hoy no: se ve "—" hasta cambiarlo). No usa el `PATCH /admin/{id}/role` obsoleto.
- **Agenda del entrenador:** en canceladas, "canceló el alumno / cancelaste vos / cancelación automática" (`cancelledBy`).
- **Mis alumnos:** con Turnos prendido, cada tarjeta muestra próxima clase y horarios fijos (`GET /professional/students?status=ALL`, cruce por `userId`).
- **409 de franjas:** se explica que primero hay que cambiar o terminar esos horarios fijos, con link a Horarios fijos.

### Recuperar clases (plazo de 30 días — backend `feature/booking-cupos`)
- Avisar que no va con **12 horas o más** (`POST /bookings/{id}/absence`) → gana 1 clase para recuperar **hasta 30 días
  después de la clase**, aunque caiga en el mes siguiente. Avisar tarde → 400 con `message` ("Faltan menos de 12 horas…").
- **El profe (o el sitio) cancela** una clase → también gana una, mismo plazo, sin gastar el tope `recoveriesPerMonth`.
- Tope **por entrenador**: `GET/PUT /professional/me { displayName, recoveriesPerMonth }` (0 = no). Se edita en
  "Horarios fijos → Recuperar clases".
- `GET /recoveries/mine` **sin `?month`** → créditos vigentes `{ month, limit, absences, professionalCancels, used,
  available, expiresAt (el más próximo), items[{ …, expiresAt }] }`. `utils/recovery.util.ts`: `pendingRecoveries`,
  `latestRecoveryDeadline`, `withinRecoveryWindow`, `expiresSoon` (≤ 7 días → ámbar), `ddmm`, `plus30`.
- `POST /recoveries/mine { serviceId, professionalId, startAt }`: el horario tiene que ser anterior al vencimiento (si no, 400
  con la fecha); el backend usa la que vence antes. 409 sin lugar.
- `GET /schedule?from=&to=` (máx. 42 días). La tira de `/student/turnos/horarios` se extiende hasta el vencimiento más lejano
  (21 a 42 días); los horarios posteriores se ven "después del vencimiento" y no se pueden elegir.
- Textos: "Listo. Podés recuperar esta clase hasta el dd/MM" (`absenceWithMessage`, busca el item recién creado),
  "Tenés N para recuperar · la primera vence el dd/MM" + lista con vencimiento en Mis turnos y Horarios, popup del profe
  "La podés recuperar hasta el {día + 30}". `changesLeft` (cambios de horario fijo) **sigue siendo mensual**.
- **Tope de ausencias del mes usado** (`absenceCapNotice`): si ya se recuperaron `limit` ausencias de clases de ese mes, se
  avisa "Ya usaste tus 3 recuperaciones de noviembre…" antes de "Avisar que no voy" (detalle de la clase y tarjeta del Inicio)
  y en el estado vacío. El backend cuenta por profesional y mes de la clase faltada; el front lo aproxima con `items`.
- **Clases completas en el calendario** (`CalEntry.full` → `.cal-entry--full`, rojo `--color-danger` en tinte + borde):
  entrenador = cupo lleno (`active ≥ capacity`); alumno = horarios de `/schedule` con `free = 0` (antes no se mostraban;
  al tocarlos dicen "Esta clase está completa"). En Mes, cada día muestra "N completas" con punto rojo (solo el punto en
  pantallas angostas). En Horarios (`/student/turnos/horarios`) la fila "Completo" usa el mismo rojo.

### Tope mensual de clases por plan (backend `feature/booking-cupos`)
- Servicio: `monthlyLimit` (a mano, 1–62, o null) y `monthlyCap` (el que se aplica: `monthlyLimit` o `weeklyLimit × 4`;
  null = sin tope). Suma horario fijo + sueltos; las recuperaciones no cuentan; el generador no crea la clase de más.
- Formulario de Servicios: solo "Veces por semana" + texto "Son 12 clases por mes (3 por semana × 4)". `monthlyLimit` se
  manda siempre `null` (el backend calcula `monthlyCap`). Listado: "3 por semana · 12 por mes".
- `modality` es obligatoria en el backend: PlanGym es solo presencial → el front manda siempre `IN_PERSON` (crear,
  editar y reactivar).
- Alumno: "Tu plan: 12 clases por mes" en Mis turnos y en la tarjeta del Inicio (servicios en los que está anotado). El uso del
  mes no se calcula en el front. Reservar clase suelta: el 409 del tope se muestra como aviso con su `message`.
- No hay "reprogramar" en el front todavía (`POST /bookings/{id}/reschedule`).

### Formas verificadas contra el backend (`elytra-platform`, rama `feature/booking`)
- Servicio = `ServiceAdminResponse` (trae además precio, modalidad, avisos mínimos, abonos…; el front ignora lo que no usa).
- Bloqueos = `ExceptionResponse { id, professionalId, professionalName, startAt, endAt, type, reason }`.
  `POST /professional/blocks` da **409 si pisa clases**; con `?confirm=true` las cancela y avisa (el front pide confirmación).
- `GET /services/{id}/slots` → `SlotsResponse { serviceId, timezone, slots: [{ startAt, endAt, professionals: [{ id, displayName, capacity, spotsLeft }] }] }`;
  `BookingStudentService.slots()` lo aplana a `FreeSlot` (una opción por horario + profesional con lugar).
- `POST /bookings { serviceId, professionalId, startAt, acceptPolicy: true }`.
- `CancellationPreview { canCancel, canReschedule, reschedulesLeft, losesPayment, message }` — si `!canCancel` se deshabilita cancelar.
- `Booking` / `AgendaItem`: `cancelledBy: "STUDENT" | "PROFESSIONAL" | "SYSTEM" | null` (en la base: CLIENT/PROFESSIONAL/
  ADMIN/SYSTEM; ADMIN se informa como PROFESSIONAL), `grantsRecovery: boolean`, `recoveryOfBookingId`.
- `GET/PUT /professional/availability` → `RuleResponse[]` (array). El PUT recibe `{ rules: [...] }` y da **409 si deja
  afuera horarios fijos vigentes** (el mensaje se muestra abajo de la semana).
- `GET /v1/users/students/{id}` (entrenador) → `StudentDetail` con `activeTemplate` completo (días + ejercicios).
- `GET /workout-logs/student/{id}` y `POST /workout-logs { studentId, workoutDayId, completedAt, completed }` como
  entrenador (valida que el alumno sea suyo y que el día sea de su plan activo; 400 si ya está registrado ese día).
- Respuestas 400/409 en ausencia/cancelación se toman como "fuera de término" → se muestra `message` y se deshabilita el botón.

---

## Pendiente de implementar

### Trainer — Exercise ecosystem
- [x] `ExercisesPage` — lista + filtro por músculo + crear/editar/eliminar + click abre detalle
- [x] `ExerciseDetailPage` (`/trainer/exercises/:id`) — nombre, badges, aviso solo-lectura global, descripción, acciones según Global/Personal
- [x] Unificar `AddExercisesModal` para que use `app-exercise-form` y `app-exercise-item` en vez de duplicar
- [x] Confirmado: `badge-component`'s `BadgeVariant` (`default | elevated | flat | accent | success | warning | danger`) — usado consistente en todos los componentes de ejercicios
- [ ] **"Usar en plantilla"** desde `ExerciseDetailPage` hoy solo navega a `/trainer/templates` — no existe un flujo de "elegir plantilla → elegir día → agregar este ejercicio" fuera del contexto de un día. Armarlo es una feature nueva, no una unificación visual; queda a decidir si se construye.
- [x] `apiUrl` confirmado: `http://localhost:8080/api`
- [x] Filtros de listado (alcance, músculo, equipo, tipo) resueltos en el backend
- [x] "Agregar ejercicio" precarga series/reps/descanso con los valores sugeridos del ejercicio
- [x] `ng build` OK con el refactor de ejercicios (oct-2026)
- [ ] ⚠️ Verificar contra el backend corriendo: el detalle de plantilla arma los ejercicios con
      `WorkoutTemplateMapper.toExerciseDetail()`, que antes mandaba `.muscleGroup(...)`. Si sigue
      mandando `muscleGroup` en vez de `primaryMuscle`, se pierden los íconos y el resumen por músculo
      en la plantilla. Lo mismo para la vista del alumno (`studentWorkout`).
- [x] Token `ENVIRONMENT` duplicado: se borró `core/config/environment.ts` (sin uso); el real es `environments/tokens/environment.token.ts`
- [x] Import sin usar de `AddExerciseToDayRequest` en `add-exercises-modal` — sacado
- [x] `UpdateDayRequest` unificado en `trainer.models.ts`
- [x] `MUSCLE_GROUP_LABELS` — fuente única en `muscle-group.util.ts`
- [x] Tests de lógica pura: `recovery.util.spec.ts` (vencimientos, ventana de 30 días, tope del mes) y
      `exercise-meta.util.spec.ts` (por tiempo / reps). El resto de los `.spec.ts` sigue siendo boilerplate del CLI.
      Correr todos los de lógica: `npm run test:ci` (usa `karma.ci.cjs`: Chrome sin ventana y con `--no-sandbox`, sirve en
      Linux como root y en CI; si Chrome no está en el PATH, `CHROME_BIN=/ruta/a/chrome`). Hoy 19 tests, todos pasan.
- [x] Tests del cálculo "le toca" de `/trainer/hoy`: `booking/utils/today-plan.util.ts` + spec (10 casos)
- [x] CSS de componentes bajo el límite de aviso (ver "Tamaño de CSS por componente")

### Student
- [x] `DashboardPage` — plan activo + lista de días (el alumno elige)
- [x] `DayPage` — ejercicios del día + detalle + marcar/desmarcar
- [x] `WeeklyPage` — estado de la semana calculado en backend (WeekStatus)
- [x] `MonthlyPage` — calendario con días entrenados, racha y adherencia
- [x] `ProfilePage` + cerrar sesión
- [~] Detalle rico de ejercicio para el alumno: el front ya llama `GET /student-workouts/my-workout/exercises/{exerciseId}`
      (→ `ExerciseDetail`) al tocar un ejercicio en el Día y muestra técnica, secundarios, video, etc., con las series/reps/
      descanso **de su plan** (no los sugeridos). Si el endpoint no existe o da 403/404, queda la vista mínima. **Falta backend.**
- [ ] "Semana N de M": agregar `durationWeeks` a `WorkoutTemplate` (V9) + campo en el form de plantilla
- [ ] Registro de pesos/reps reales por ejercicio (tabla `workout_log_sets` colgada del log)

### Shared / UI
- [x] **Íconos de músculos**: silueta anatómica frente/espalda, modos zoom/single/both, secundarios
- [x] `app-page-loader` con el gym-loader en toda la app
- [x] Marca unificada PlanGym + favicon propio
- [x] `ToastService` — feedback de éxito/error global (`<gp-toast />`, usado por Turnos)

### Suscripciones
- [x] Modelos, `BillingService`, planes, Mi suscripción, polling de vuelta, banner, menú, guard
- [x] Interruptor `billingEnabled` (hoy en `false`, período de prueba)
- [ ] Backend: interruptor equivalente (ej. `billing.enforce=false`) para que en la prueba no se
      bloquee el login de alumnos ni se aplique el límite de alumnos del plan
- [ ] Probar el flujo completo con usuario de prueba de MP (en local el `back_url` del backend tiene
      que apuntar a `localhost:4200`)
- [ ] `isStudentLimitError` detecta el límite buscando "plan" en el mensaje: si el backend agrega un
      `code` en el error, cambiar a ese campo

### Turnos
- [x] Calendario trainer (semana/mes, detalle de clase, pasar lista, cancelar)
- [x] Calendario alumno (semana/mes, horarios fijos, ausencia, cancelar con preview)
- [x] Horarios fijos del trainer + servicios + anotar por DNI (también tras el alta)
- [x] Elegir horarios del alumno + clase suelta
- [x] Disponibilidad, bloqueos y resumen de cupos
- [x] Turnos en la vista del alumno: pestaña (Perfil al header), próxima clase en Inicio, clases en Semana y Día
- [x] Entrenador mobile: barra inferior + pantalla Hoy (alumnos del día, plan, marcar hecho)
- [ ] Backend (opcional): "día que le toca" calculado en el backend para el entrenador (hoy lo calcula el front) y desmarcar desde el entrenador
- [ ] Detalles: contador de clases en la pestaña Turnos del alumno
- [x] La cancelación del profe da recuperación (sin tope, mismo mes) + `cancelledBy`/`grantsRecovery` (backend V22) + popup
- [x] Recuperar tocando un horario libre del calendario (semana y mes)
- [ ] Cambiar la hora de una franja deja a los alumnos fijos en la hora vieja (el editor avisa, el backend da 409);
      decidir si se mueven solos
- [x] Probado contra el backend real (nov-2026): turnos, recuperar (30 días, topes), cambiar plan, un solo plan, celular
- [x] Formas verificadas contra el backend (servicio, bloqueos, slots, preview de cancelación)
- [x] Recuperar clases: horarios día por día, recuperar, tope del entrenador, "recupera" en su agenda
- [ ] Panel GYM_ADMIN (agenda de todos, feriados, ajustes)

### Plantillas
- [x] Planes de referencia (ver días + "Usar este plan" → copia) — probado
- [x] Ejercicios por tiempo (`durationSeconds`, "3 × 20 seg", selector en "Agregar ejercicio")
- [ ] Traducir `level` si el backend manda otro valor que BASIC / INTERMEDIATE

### Admin
- [x] Suscripción a mano y "Dar de alta en turnos" en Entrenadores
- [ ] Backend: sumar `subscriptionActive` a `AdminTrainerResponse` (hoy se ve "—" hasta cambiarlo)
- [ ] Dar / quitar rol TRAINER desde el panel (`PUT/DELETE /admin/tenants/plangym/members/{userId}/roles/{role}`), si hace falta

### Cerrar Turnos (cuando termine la prueba)
- [ ] PR `feature/turnos-calendario` → `master` (front) y `feature/booking` → `main` (backend `elytra-platform`)
- [ ] Deploy: backend a Railway (Flyway corre V21, V22, V24 y las de `feature/booking-cupos`) y `ng build` del front a HostGator
- [ ] Producción: habilitar el módulo BOOKING para `plangym` y dar de alta como profesionales a los entrenadores que
      ya tenían TRAINER (los nuevos se dan de alta solos al recibir el rol)

### Backend pendiente
- [ ] `exerciseCount` y `assignedStudents` en `WorkoutTemplateSummary`
- [x] `WorkoutLog` + estado semanal calculado (V8, `WeekStatusService`)
- [ ] Endpoint de adherencia calculado en backend
- [ ] Si se decide construir "Usar en plantilla" como flujo propio: endpoint que permita agregar un ejercicio a un día sin pasar por el detalle completo de la plantilla

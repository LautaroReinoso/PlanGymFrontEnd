# GymPlan — Frontend Context (Angular 19)

## Stack
- **Framework:** Angular 19, Standalone Components, Signals
- **Estilos:** CSS nativo, sin librerías UI
- **Estado:** Signals (`signal`, `computed`, `effect`)
- **HTTP:** `HttpClient` con interceptor JWT funcional
- **Routing:** Lazy loading por feature con `loadChildren`
- **IDE:** NetBeans
- **Backend:** Spring Boot + MySQL en `http://localhost:8080`
- **Producción:** Railway

---

## Design System

### Colores
```css
--color-bg:        #0A0A0F
--color-surface:   #13131A
--color-card:      #1C1C26
--color-border:    #2A2A38
--color-accent:    #4F6EF7   /* azul eléctrico */
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
│   ├── auth/
│   │   ├── auth.service.ts          → login, logout, sesión, roles
│   │   ├── auth.guards.ts           → authGuard, roleGuard, loginGuard
│   │   └── jwt.interceptor.ts       → adjunta Bearer token
│   ├── storage/
│   │   └── storage.service.ts       → wrapper localStorage tipado
│   ├── models/
│   │   └── auth.models.ts           → AuthSession, JwtPayload, RoleType
│   └── environment.token.ts         → InjectionToken para environment
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
│   │   └── exercise-item/               → app-exercise-item (NUEVO — fila reutilizable)
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
│   │   │   └── trainer.models.ts
│   │   ├── services/
│   │   │   ├── student.service.ts
│   │   │   ├── template.service.ts
│   │   │   ├── exercise.service.ts       → COMPLETADO (CRUD full)
│   │   │   └── assignment.service.ts
│   │   ├── pages/
│   │   │   ├── students-page/
│   │   │   ├── student-detail-page/
│   │   │   ├── templates-list-page/
│   │   │   ├── template-detail-page/
│   │   │   ├── template-create-page/
│   │   │   ├── exercises-page/       → COMPLETADO (fila clickable → abre detalle)
│   │   │   └── exercise-detail-page/ → NUEVO — detalle de ejercicio (catálogo)
│   │   └── components/
│   │       ├── layout/
│   │       │   ├── trainer-layout.component
│   │       │   └── sidebar/
│   │       ├── students/
│   │       │   └── student-card.component
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
│       │       ├── student-layout.component   → incluye <app-bottom-nav />
│       │       └── bottom-nav/                → Inicio · Hoy · Semana · Mes · Perfil
│       └── pages/
│           ├── dashboard-page/
│           ├── day-page/          → ejercicios + "Marcar como hecho" / "Me equivoqué, desmarcar"
│           ├── weekly-page/
│           ├── monthly-page/
│           └── profile-page/      → datos + "Cerrar sesión"
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

### `gp-muscle-icon`
```html
<gp-muscle-icon [muscleGroup]="ex.primaryMuscle" [size]="24" />
```
Silueta blanca + músculo en azul. Tiene caso para los 12 `MuscleGroup` (FOREARMS = antebrazos,
QUADRICEPS/HAMSTRINGS = muslos, CALVES = gemelos).

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
// ⚠️ Duplicado: existe también un UpdateDayRequest local e idéntico dentro de
//    edit-day-modal.component.ts. No rompe nada (misma forma), pero convendría
//    que ese componente importe este tipo en vez de redeclararlo.

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

/trainer                        → TrainerLayoutComponent
/trainer/students               → StudentsPageComponent
/trainer/students/:id           → StudentDetailPageComponent
/trainer/templates              → TemplatesListPageComponent
/trainer/templates/new          → TemplateCreatePageComponent
/trainer/templates/:id          → TemplateDetailPageComponent
/trainer/exercises              → ExercisesPageComponent (COMPLETADO)
/trainer/exercises/:id          → ExerciseDetailPageComponent (NUEVO)

/student                        → StudentLayoutComponent (+ bottom-nav)
/student/dashboard              → DashboardPageComponent
/student/daily                  → guard todayRedirect → /student/day/:id o /student/weekly
/student/day/:workoutDayId      → DayPageComponent
/student/weekly                 → WeeklyPageComponent
/student/monthly                → MonthlyPageComponent
/student/profile                → ProfilePageComponent
```
⚠️ `templates/new` debe ir ANTES que `templates/:id` en el array de rutas.

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
- [ ] Posible **doble definición del token `ENVIRONMENT`**: existe `core/config/environment.ts` (no usado por `exercise.service.ts`/`template.service.ts`, que importan de `environments/tokens/environment.token.ts`) — confirmar cuál es el real y borrar el que sobre
- [ ] `AddExerciseToDayRequest` — import sin usar en `add-exercises-modal.component.ts` (preexistente, no rompe nada)
- [ ] `UpdateDayRequest` duplicado entre `trainer.models.ts` y `edit-day-modal.component.ts` (mismo shape, preexistente) — unificar para que `edit-day-modal` importe el de `trainer.models.ts`
- [x] `MUSCLE_GROUP_LABELS` — fuente única en `muscle-group.util.ts`
- [ ] Sin tests nuevos para lo agregado (`.spec.ts` del proyecto son boilerplate default de Angular CLI, sin adaptar)

### Student
- [x] `DashboardPage` — plan activo + lista de días (el alumno elige)
- [x] `DayPage` — ejercicios del día + detalle + marcar/desmarcar
- [x] `WeeklyPage` — estado de la semana calculado en backend (WeekStatus)
- [x] `MonthlyPage` — calendario con días entrenados, racha y adherencia
- [x] `ProfilePage` + cerrar sesión
- [ ] Detalle rico de ejercicio para el alumno (técnica, secundarios, video): requiere habilitar
      `GET /api/exercises/:id` para STUDENT solo con ejercicios de su plan activo
- [ ] "Semana N de M": agregar `durationWeeks` a `WorkoutTemplate` (V9) + campo en el form de plantilla
- [ ] Registro de pesos/reps reales por ejercicio (tabla `workout_log_sets` colgada del log)

### Shared
- [ ] `ToastService` — feedback de éxito/error global

### Backend pendiente
- [ ] `exerciseCount` y `assignedStudents` en `WorkoutTemplateSummary`
- [x] `WorkoutLog` + estado semanal calculado (V8, `WeekStatusService`)
- [ ] Endpoint de adherencia calculado en backend
- [ ] Si se decide construir "Usar en plantilla" como flujo propio: endpoint que permita agregar un ejercicio a un día sin pasar por el detalle completo de la plantilla

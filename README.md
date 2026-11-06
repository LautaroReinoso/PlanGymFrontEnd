# PlanGym — Frontend

App web (Angular 19) para entrenadores y alumnos de gimnasio: planes de entrenamiento, seguimiento semanal y turnos.
Producción: **https://plangympro.com** · Backend: `elytra-platform` (Spring Boot) en `https://api.plangympro.com`.

> El contexto técnico completo (arquitectura, decisiones, endpoints, bugs conocidos y pendientes) está en
> **[CLAUDE.md](./CLAUDE.md)**. Mantenerlo actualizado con cada cambio.

## Qué hace

**Entrenador** (mail + contraseña)
- **Hoy:** quién viene hoy, agrupado por clase, qué día del plan le toca a cada uno y "marcar como hecho".
- **Alumnos:** alta por DNI, ficha, asignación de plan.
- **Plantillas y Ejercicios:** armado de planes (días A, B, C…), planes de referencia de PlanGym para copiar,
  ejercicios por repeticiones o por tiempo y catálogo de ejercicios.
- **Turnos:** calendario semana/mes (pasar lista, cancelar), horarios fijos por alumno, horarios y cupos de la semana,
  días sin clase, tope de recuperaciones y servicios (pestaña propia).
- **Admin (GLOBAL_ADMIN):** entrenadores habilitados, suscripción a mano y alta en turnos.
- En el celular: barra inferior Hoy · Alumnos · Turnos · Plantillas · Ejercicios.

**Alumno** (solo DNI)
- **Inicio / Hoy / Semana / Mes:** su plan, el día que le toca, marcar entrenamientos y su historial.
- **Turnos:** sus clases (semana/mes), avisar que no va, recuperar clases en horarios libres del mes,
  aviso cuando el profe cancela.

## Desarrollo

Requisitos: Node 20+, Angular CLI 19 y el backend corriendo en `http://localhost:8080`.

```bash
npm install
ng serve            # http://localhost:4200
ng build            # producción → dist/ (subir a HostGator; incluye public/.htaccess)
```

La URL del backend se configura en `src/environments/` (`apiUrl`). El módulo de turnos se activa desde el backend:
si responde 403, el front oculta todo lo de Turnos.

## Ramas

- `master`: estable.
- `feature/turnos-calendario`: turnos, recuperar clases, vista "Hoy" del entrenador y mobile (pendiente de merge).

## Probar contra el backend

Colección de Postman del backend (`elytra-platform/docs/postman`): carpeta 8 (turnos) y carpeta 13 (recuperar clases).
Planes de referencia: necesitan el backend con la migración V24.

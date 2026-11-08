# SOP omgithub v3.2 — RALPH LOOP COMPLETO

## Núcleo indestructible
1. Build verde → push fast-forward a main. Nunca force push.
2. Conflicto de merge → abort + tag + avisar. Nunca resolver conflictos a mano en autónomo.
3. Base roja → no trabajar encima: reparar o revertir a save tag verificado.
4. Al arrancar: leer HANDOFF y hacer forensis del último muerto antes de tocar código.
5. Toda tarea terminada = commit atómico + checkpoint. Sin excepciones.

## [0] Modo Ralph
- Loop de trabajo autónomo, sin preguntas aclaratorias salvo conflicto de merge.
- Asumir decisiones razonables y anotarlas en HANDOFF.md.
- Leer errores, diagnosticarlos, corregirlos y reintentar.
- No dejar tareas a medias: terminarlas o descartarlas.

## [1] Autoinstalación (solo primera vez)
- Si AGENTS.md no tiene esta sección, agregarla al final sin pisar contenido existente.
- La última línea del archivo debe ser `── FIN DEL SOP ──`. Si falta al iniciar, considerar el archivo corrupto y pedir el paste original antes de continuar.
- Crear si faltan: README.md, HANDOFF.md, todo.md, user-requests.md y /roadmap/.
- Repo vacío con boilerplate que exige build: esa exigencia es la tarea [A] semilla.
- Sesiones futuras arrancan con: «Seguí el SOP en AGENTS.md».

## [2] Funeral, compost y mantenimiento de issues (boot)
### 2.0 Censo
Listar issues abiertos (excluyendo el actual), más nuevos primero. Agrupar linajes de prompts repetidos. Leer threads de los últimos 3 linajes. Los de más de 7 días o fuera de cota se compostan sin leer.
### 2.1 Forensis (por unidad muerta, de más nueva a más vieja)
Fuentes por autoridad: (1) diff de código huérfano, qué hizo; (2) HANDOFF.md, qué se proponía; (3) thread del issue, último Work State/Next Move, por qué murió. Reconciliar en una línea: «causa de muerte + trabajo pendiente». Issue sin comentarios del agente: ignorar.
### 2.2 Compost
Rescatar a main vía branch temporal: `git checkout -B tmp-main origin/main`, merge checkpoints/N; si queda limpio y build verde, push FF tmp-main:main y crear tag save-NNN si es hito. Si no, tag `graveyard-checkpoints-N` y mencionarlo en epitafio. Borrar branches compostables (ancestro de main o sin código). Volver a la rama; sync [3.2] absorbe main compostado.
### 2.3 Sepultura
Cerrar issue con comentario: `⚰ sesión N | murió en: X | rescatado: Y | compostado: Z | cemetery: W`. Sin permiso para cerrar: comentar `⚰ CERRABLE: ...` y reportar.
### 2.4 Higiene post-funeral
Objetivo: ≤2 issues abiertos (actual + máximo 1 esperando humano). Reportar conteo final en epitafio.

## [3] Boot
1. Leer AGENTS.md → README.md → HANDOFF.md → /roadmap/ → todo.md → user-requests.md.
2. Sync preciso: si HEAD es ancestro de origin/main, `reset --hard origin/main`. Divergidas: merge limpio y rebuild. Conflictos: abort + pending-N + reporte.
3. Triage huérfano: si origin/main..HEAD tiene commits o árbol sucio ajeno a HANDOFF, adoptar si es coherente con «en progreso»; si no, descartar y reportar.
4. Gate baseline: build y tests si existen. Si está rojo, prioridad P0: diagnosticar entorno vs código; revertir a save-NNN solo si ese tag verifica verde en worktree temporal. Si el tag también falla, es entorno: repararlo, no revertir.
5. Sin tags save-*: crear `git tag save-000` y hacer push.

## [4] Cola y loop externo
Prioridad: [P0] base roja > [A] usuario (chat + user-requests.md) > [B] roadmap > [C] mantenimiento > [D] green. Cada iteración: `git fetch`, reevaluar cola, tomar una tarea, motor [5], checkpoint [6], volver acá.
- Auto-pacing: cada 8 checkpoints o 3 re-anclajes, cierre gracioso [11] aunque la cola no esté vacía.
- Cola vacía: HANDOFF + checkpoint final + reporte + pausa.

## [5] Motor Ralph interno (por tarea)
- PLAN: leer archivos involucrados; mini-plan de 3–6 líneas en HANDOFF «en progreso».
- ACT: edición mínima, solo archivos del scope.
- VERIFY: build verde + preview verificado (captura/playwright, consola limpia).
- AUTOCRÍTICA: una línea «¿qué podría romper esto?». Si es serio, agregar test o guarda.
- FIX: si VERIFY falla, diagnosticar, corregir y re-verificar (máximo 3 rondas).
- DONE: commit atómico tipo(área): desc [ref] + checkbox del roadmap en el mismo commit + README si cambió comportamiento visible.
- Para tareas [A], descomponer el manifiesto en 3–10 checkboxes en todo.md o roadmap y ejecutar de a una como [B]. Manifiesto ≠ tarea.
- DESCARTE: tras 3 rondas sin éxito, revertir archivos de la tarea, anotar motivo e intentos en todo.md (máximo 3 de por vida → «requiere humano») y seguir.

## [6] Checkpoints
1. DONE con build verde → `git push origin HEAD:main` (fast-forward; nunca force).
2. Rechazo non-fast-forward: fetch + merge limpio + rebuild + push. Conflicto: abort + pending-N + reporte; seguir [C]/[D] sin reintentar el sync cada iteración; pausar tras 3 iteraciones con el mismo conflicto.
3. Rechazo 403/permission: no reintentar; reportar una vez «falta permiso de push a main» y seguir sin checkpoint hasta resolución humana.
4. Tag save-NNN solo con VERIFY aprobado (hito visible).
5. Todo checkpoint es punto de muerte segura.

## [7] Libros
- HANDOFF.md: reescribir solo en pausa, cierre y re-anclaje (cada 5 tareas).
- todo.md: descartadas/bloqueadas con intentos (máximo 3 de por vida → «requiere humano»).
- user-requests.md: inbox externo; tachar al completar.
- roadmap/*.md: autogestionado con checkboxes; archivo completo → siguiente.

## [8] Scope e higiene
Solo archivos del scope; cero refactors drive-by. Problema ajeno → todo.md, no código de hoy. Sin reestructuraciones sin [A] explícita.

## [9] Recuperación
- Main rojo heredado → revert hasta verde (nunca force).
- Conflicto → abort + pending + reporte (única pregunta permitida).
- Muerte de sesión: el último checkpoint ya salvó todo; el funeral [2] de la próxima sesión atiende el cadáver.

## [10] Reportes (una línea)
- `▶ [P0/A/B/C/D] tarea | iniciando`
- `✓ tarea | checkpoint ok / save-NNN`
- `✗ descartada → todo.md | motivo`
- `⚠ conflicto | sha | (a) autorizar merge (b) sesión nueva`
- `⚰ funeral | unidades N | rescatado X | compostado Y | cemetery Z | issues abiertos: K`

## [11] Cierre gracioso
En pausa/cola vacía/auto-pacing: HANDOFF actualizado, checkpoint final, reporte de 3 líneas: hecho / siguiente / riesgos.

## [C] Recurrentes
- Cada 5 checkpoints: tarea «playtest humano», revisión manual de lo acumulado.
- Cada 5 tareas: auto-auditoría, releer últimos 3 commits buscando rotura silenciosa.
- Cada 10 checkpoints: verificar que el último save-NNN siga buildeando verde.
- Si issues abiertos >2: mini-funeral (solo censo/forensis/sepultura, sin compost de branches).

## Núcleo indestructible (repetir al final)
1. Build verde → push fast-forward a main. Nunca force push.
2. Conflicto de merge → abort + tag + avisar. Nunca resolver conflictos a mano en autónomo.
3. Base roja → no trabajar encima: reparar o revertir a save tag verificado.
4. Al arrancar: leer HANDOFF y hacer forensis del último muerto antes de tocar código.
5. Toda tarea terminada = commit atómico + checkpoint. Sin excepciones.

── FIN DEL SOP ──

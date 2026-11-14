# Análisis local de BPM, tonalidad y energía

**Estado:** investigación y diseño. No implementado todavía.
**Alcance:** entender qué se puede calcular en el navegador con audio local,
qué límites tiene y cómo distinguir una estimación de un metadato confirmado.

## Reglas del proyecto que aplican

- El análisis corre en el navegador sobre demos o archivos locales autorizados.
- No se descarga, analiza ni enruta audio de YouTube.
- No se sube audio a ningún servidor.
- Las funciones centrales no dependen de servicios ni suscripciones externas.
- Cualquier dependencia nueva debe documentar licencia, tamaño y motivo.

## Lo que ya existe (v1)

### BPM offline (`analyzeOfflineBpm`)

1. Decodifica el archivo con `OfflineAudioContext` a 11 025 Hz, mono.
2. Calcula la energía RMS en ventanas de 1024 muestras con salto de 256.
3. Detecta picos por encima de 1.45 × la media, con separación mínima de 220 ms.
4. Toma la mediana de los intervalos entre picos y la convierte a BPM.
5. Normaliza el resultado al rango 70–160 BPM multiplicando o dividiendo por 2.
6. Guarda el BPM en el metadato de la biblioteca y lo muestra como
   `LOCAL · ≈n BPM`.

### BPM en vivo (`estimateBpmFromEnergy`)

Usa la energía capturada por el analizador durante la reproducción y aplica el
mismo criterio de picos/mediana para actualizar la lectura mientras suena.

### Limitaciones conocidas

- Errores de octava: un mismo patrón puede leerse a 70 u 140 BPM.
- La normalización 70–160 BPM no cubre géneros lentos ni rápidos.
- No hay confianza ni fuente del dato: hoy la estimación puede sobrescribir un
  valor que el usuario consideraba correcto.
- El análisis es mono y de archivo completo; en archivos largos consume memoria.
- No hay detección de tonalidad ni de energía por sección.

## Propuesta para la siguiente fase

### 1. BPM con procedencia y confianza

Añadir a cada pista:

```js
{ bpm: 124.0, bpmSource: 'manual' | 'estimate', bpmConfidence: 0.0 }
```

Reglas:

- `manual` siempre gana; la estimación solo rellena valores vacíos o `estimate`.
- La UI muestra `≈` para estimaciones y permite editar/limpiar el BPM.
- La confianza se calcula con la dispersión de los intervalos: si la mediana y
  los cuartiles están lejos, el valor se marca como dudoso.
- Los filtros y la planificación de sets usan el mismo campo, sin romper el
  formato actual de importación/exportación.

### 2. Tonalidad (rueda Camelot)

Sin librerías externas:

1. Aplicar una DFT/Goertzel sobre ventanas del audio para obtener la energía de
   las 12 clases de altura (C, C#, D…).
2. Comparar el perfil de croma con los perfiles mayor/menor de
   Krumhansl-Schmuckler (tablas públicas y ampliamente citadas).
3. Elegir la correlación más alta y mapear a Camelot (1A–12A / 1B–12B).
4. Mostrar el resultado como estimación con confianza; nunca como verdad
   absoluta.

Criterio de aceptación: una pista con acorde sostenido de La menor debe
detectarse como 8A en una prueba sintética; el resultado real se etiqueta como
estimación y se puede corregir a mano.

### 3. Energía relativa

- Calcular RMS y flujo espectral por compás/frase.
- Normalizar **dentro del set**, no de forma absoluta: una pista “alta” es alta
  respecto de las demás del crate.
- Mostrar una curva simple (baja/media/alta) junto al setlist y usar esa señal
  para sugerir orden, sin prometer análisis emocional.
- Mantener el cálculo barato: remuestreo y ventanas, sin decodificar dos veces.

## Dependencias y licencias

| Opción | Licencia | Coste | Decisión |
| --- | --- | --- | --- |
| Web Audio API + DFT propia | nativa del navegador | bajo | preferida |
| Krumhansl-Schmuckler (tablas) | conocimiento público, tablas citadas | bajo | usar solo tablas, no código copiado |
| essentia.js | AGPL-3.0 | medio/alto | evitar salvo necesidad; revisar compatibilidad |
| Cualquier modelo pesado | variable | alto | fuera de alcance local-first |

## Criterios de aceptación

- [ ] El BPM manual se conserva y la estimación no lo pisa.
- [ ] Las estimaciones se etiquetan con `≈` y confianza; las correcciones se
      guardan solo en el dispositivo.
- [ ] La tonalidad se prueba con al menos un caso sintético y se puede corregir.
- [ ] La energía se normaliza por set y no altera el audio ni sube archivos.
- [ ] `./smoke.sh` cubre los estados nuevos y la consola sigue limpia.

## No objetivos

- Prometer precisión de estudio o reemplazar software profesional.
- Analizar streams externos o audio de YouTube.
- Subir audio o metadatos a un backend.

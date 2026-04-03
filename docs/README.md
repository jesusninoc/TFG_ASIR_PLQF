# Documentación técnica — PC Selector

Bienvenido a la documentación técnica del proyecto **PC Selector**: una tienda de hardware que integra un asistente conversacional con inteligencia artificial para guiar al usuario en la creación de configuraciones de PC personalizadas.

Esta carpeta contiene artículos detallados sobre el diseño del sistema, las decisiones de arquitectura y el funcionamiento interno de cada capa.

---

## Índice de documentos

| Documento | Descripción resumida |
|---|---|
| [arquitectura-general.md](./arquitectura-general.md) | Visión de alto nivel del sistema completo: capas, flujo de datos y responsabilidades de cada módulo |
| [motor-de-builds.md](./motor-de-builds.md) | Funcionamiento interno del motor determinista: tablas de pesos, tiers, `pickBest`, seguimiento de presupuesto restante |
| [llm-vs-motor-deterministico.md](./llm-vs-motor-deterministico.md) | Por qué el LLM solo infiere intención y el motor determinista toma decisiones — motivación, riesgos y alternativas descartadas |
| [compatibilidad-y-validacion.md](./compatibilidad-y-validacion.md) | Cómo `evaluateBuildCompatibility` valida cada build, qué reglas aplica y cómo se integra en el motor |
| [gestion-de-presupuesto.md](./gestion-de-presupuesto.md) | Diseño completo del sistema de presupuesto: tiers, pesos por caso de uso, `pickBest`, máximos dinámicos y capas de seguridad |

---

## Primeros pasos para leer la documentación

Si eres nuevo en el proyecto, el orden de lectura recomendado es:

1. **[arquitectura-general.md](./arquitectura-general.md)** — entiende el sistema como un todo antes de profundizar en módulos individuales.
2. **[llm-vs-motor-deterministico.md](./llm-vs-motor-deterministico.md)** — comprende la decisión de diseño más importante del sistema: la separación radical entre inferencia (LLM) y decisión (motor).
3. **[motor-de-builds.md](./motor-de-builds.md)** — aprende cómo el motor genera builds reales a partir de stock de base de datos.
4. **[gestion-de-presupuesto.md](./gestion-de-presupuesto.md)** — profundiza en el algoritmo de distribución y control de presupuesto.
5. **[compatibilidad-y-validacion.md](./compatibilidad-y-validacion.md)** — cierra el ciclo entendiendo la capa de validación final antes de presentar resultados.

---

## Ficheros de código relacionados

```
lib/
  intent-parser.ts      ← Capa LLM: convierte lenguaje natural en JSON estructurado
  rag.ts                ← Orquestador: coordina LLM, motor y respuesta al usuario
  build-engine.ts       ← Motor determinista: genera builds desde BD con restricciones de presupuesto
  compatibility.ts      ← Validador: verifica compatibilidad física y calcula precio real
  types.ts              ← Tipos TypeScript compartidos por todas las capas
  db-to-types.ts        ← Adaptador: convierte registros Prisma a tipos del dominio
```

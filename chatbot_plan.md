# Plan de Acción – Chatbot de Tienda con LLM (4B) + Engine de Negocio

## Objetivo
Construir un chatbot simple para una tienda online donde:
- Un LLM pequeño (≈4B parámetros) actúe como interfaz conversacional.
- Un engine backend determinista tome todas las decisiones de negocio.

---

## 1. Arquitectura General

Usuario → Frontend Chat → API Orchestrator → (LLM + Engine + Memoria)

---

## 2. Componentes

### Frontend
- Web/App/WhatsApp
- UI del chat

### Orchestrator
- Recibe mensajes
- Llama al LLM
- Llama al engine
- Maneja estado

### LLM (4B)
- Intención
- Entidades
- Respuestas naturales

### Engine
- Catálogo
- Stock
- Precios
- Pedidos

### Memoria
- Contexto de conversación

---

## 3. Flujo

1. Usuario escribe
2. LLM interpreta (JSON)
3. Engine procesa
4. LLM responde

---

## 4. Ejemplo JSON

```json
{
  "intent": "buscar_producto",
  "entities": {
    "categoria": "botas",
    "precio_max": 120
  }
}
```

---

## 5. Intents

- buscar_producto
- filtrar_producto
- ver_detalle_producto
- recomendar_producto
- pregunta_envio
- pregunta_devolucion
- estado_pedido
- hablar_humano

---

## 6. Reglas

El LLM nunca debe inventar:
- precios
- stock
- envíos
- pedidos

---

## 7. Métricas

- intent_accuracy
- error_rate
- conversion_rate

---

## 8. Recomendación

Usar 4B para interfaz + backend fuerte para lógica.

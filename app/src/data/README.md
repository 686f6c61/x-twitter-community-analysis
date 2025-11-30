# Diccionario de Análisis de Sentimiento

Este directorio contiene el diccionario léxico usado para el análisis de sentimiento, emociones y toxicidad en el análisis avanzado de comunidades.

## 📄 Archivo: `sentiment-dictionary.json`

### Estructura

```json
{
  "sentiment": {
    "very_positive": { "score": 3, "words": [...] },
    "positive": { "score": 2, "words": [...] },
    "slightly_positive": { "score": 1, "words": [...] },
    "slightly_negative": { "score": -1, "words": [...] },
    "negative": { "score": -2, "words": [...] },
    "very_negative": { "score": -3, "words": [...] }
  },
  "emotions": {
    "ira": [...],
    "miedo": [...],
    "felicidad": [...],
    "tristeza": [...],
    "neutral": [...]
  },
  "toxicity": [...],
  "metadata": { ... }
}
```

### Categorías de Sentimiento

| Categoría | Score | Descripción | Ejemplos |
|-----------|-------|-------------|----------|
| `very_positive` | +3 | Sentimiento muy positivo | excelente, increíble, maravilloso |
| `positive` | +2 | Sentimiento positivo | genial, fantástico, bueno |
| `slightly_positive` | +1 | Sentimiento ligeramente positivo | agradable, contento, interesante |
| `slightly_negative` | -1 | Sentimiento ligeramente negativo | malo, triste, problema |
| `negative` | -2 | Sentimiento negativo | terrible, pésimo, desastre |
| `very_negative` | -3 | Sentimiento muy negativo | genocidio, asesino, criminal |

### Categorías de Emociones

- **ira**: Emociones relacionadas con enojo, rabia, furia
- **miedo**: Emociones relacionadas con miedo, terror, ansiedad
- **felicidad**: Emociones relacionadas con alegría, júbilo, satisfacción
- **tristeza**: Emociones relacionadas con pena, melancolía, dolor
- **neutral**: Ausencia de palabras emocionales

### Palabras Tóxicas

Lista de palabras que indican toxicidad en el discurso (insultos, palabras ofensivas, etc.)

## 🔧 Cómo Ampliar el Diccionario

### 1. Añadir Palabras de Sentimiento

```json
{
  "sentiment": {
    "positive": {
      "score": 2,
      "words": [
        "genial",
        "fantástico",
        "nueva_palabra_positiva"  // ← Añadir aquí
      ]
    }
  }
}
```

### 2. Añadir Palabras Emocionales

```json
{
  "emotions": {
    "ira": [
      "rabia",
      "enojo",
      "nueva_palabra_ira"  // ← Añadir aquí
    ]
  }
}
```

### 3. Añadir Palabras Tóxicas

```json
{
  "toxicity": [
    "imbécil",
    "nueva_palabra_toxica"  // ← Añadir aquí
  ]
}
```

### 4. Actualizar Metadata

Después de hacer cambios significativos:

```json
{
  "metadata": {
    "version": "1.1.0",  // ← Incrementar versión
    "last_updated": "2025-01-10",  // ← Actualizar fecha
    "total_sentiment_words": 95,  // ← Actualizar conteo
    "total_emotion_words": 65,
    "total_toxicity_words": 30
  }
}
```

## 📊 Estadísticas Actuales (v1.0.0)

- **Total palabras de sentimiento**: 90
- **Total palabras de emociones**: 60
- **Total palabras tóxicas**: 25
- **Total general**: ~175 palabras

## ⚠️ Consideraciones

1. **Formato**: Todas las palabras deben estar en minúsculas
2. **Acentos**: Mantener acentos correctos (ej: "crítico" no "critico")
3. **Duplicados**: Evitar duplicar palabras entre categorías de sentimiento
4. **Contexto**: Las palabras se buscan de forma literal, sin considerar contexto
5. **Negaciones**: El sistema NO detecta negaciones (ej: "no es bueno" se detecta como positivo)
6. **Recarga**: Después de editar el JSON, hacer hard refresh (Ctrl+Shift+R) para que los workers recarguen

## 🔬 Uso en el Sistema

El worker de análisis de grafos (`graph.worker.ts`) carga este JSON al inicio:

```typescript
import sentimentDictionary from '../../../data/sentiment-dictionary.json';

// Construye diccionarios en memoria
const SENTIMENT_DICT = {}; // palabra → score
const EMOTION_DICT = {};   // palabra → emoción
const TOXIC_KEYWORDS = []; // array de palabras tóxicas
```

### Flujo de Análisis

1. **Cargar diccionario** al iniciar el worker
2. **Tokenizar tweet** en palabras individuales
3. **Buscar cada palabra** en los diccionarios
4. **Acumular scores** de sentimiento
5. **Contar emociones** por frecuencia
6. **Detectar toxicidad** por presencia de keywords
7. **Agregar a nivel comunidad** promediando todos los tweets

## 🚀 Recomendaciones para Expansión

### Palabras a considerar añadir:

**Sentimiento Político Español:**
- Positivo: "valentía", "dignidad", "justicia", "transparencia", "democracia"
- Negativo: "corrupción", "autoritario", "nepotismo", "impunidad", "censura"

**Emociones Españolas:**
- Ira: "hartazgo", "cabreo", "indignado", "iracundo"
- Miedo: "incertidumbre", "inseguridad", "desconfianza"
- Tristeza: "desánimo", "desencanto", "desesperanza"
- Felicidad: "esperanzador", "ilusión", "motivación"

**Modismos y Regionalismos:**
- Añadir variantes regionales si el análisis se centra en geografías específicas
- Considerar jerga de redes sociales ("xD", "lol" → felicidad)

## 📚 Referencias

- **AFINN**: Léxico de sentimiento original (inglés)
- **EmoLex**: Léxico de emociones de Mohammad & Turney
- **SentiWordNet**: Red léxica con polaridades
- **ML-SentiCon**: Léxico de sentimiento en español

## 🔗 Ver también

- `/src/features/graph-visualization/workers/graph.worker.ts` - Implementación del análisis
- `/src/features/statistics/components/CommunityAdvancedAnalysis.tsx` - UI de resultados
- `/src/features/statistics/components/Communities.tsx` - Documentación en InfoModal

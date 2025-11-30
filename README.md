# ANÁLISIS DE COMUNIDADES EN X.COM

**Versión Beta 0.6.8**

Sistema profesional de análisis de redes sociales para X.com (Twitter) mediante grafos interactivos. Procesa datos scrapeados para detectar comunidades, calcular métricas de red avanzadas, identificar influencers, detectar bots y visualizar interacciones con optimizaciones de rendimiento.

**Público objetivo:** Investigadores SAR (Social Network Analysis and Research), ingenieros de software, analistas de datos, científicos sociales.

---

## TABLA DE CONTENIDOS

- [Requisitos Previos](#requisitos-previos)
- [Arquitectura del Proyecto](#arquitectura-del-proyecto)
- [Instalación](#instalación)
- [Uso](#uso)
  - [Método Recomendado: Navegador](#método-recomendado-navegador)
  - [Python CLI: Análisis Individual](#python-cli-análisis-individual)
  - [Python CLI: Análisis Batch](#python-cli-análisis-batch)
- [Características Principales](#características-principales)
- [Métricas Calculadas](#métricas-calculadas)
- [Interfaz Web](#interfaz-web)
- [Exportación de Datos](#exportación-de-datos)
- [Desarrollo y Personalización](#desarrollo-y-personalización)
- [Troubleshooting](#troubleshooting)
- [Control de Versiones](#control-de-versiones)
- [Licencia](#licencia)

---

## REQUISITOS PREVIOS

### OBTENER DATOS DE X.COM

#### 🎯 Archivos de Ejemplo Incluidos

El repositorio incluye archivos JSON de ejemplo listos para usar en la carpeta **`example_data/`**:
- `example_betis.json` - Conversaciones sobre Real Betis Balompié
- `example_sevilla.json` - Conversaciones sobre Sevilla FC

Puedes usar estos archivos para probar inmediatamente todas las funcionalidades.

#### 📥 Obtener tus propios datos

Para exportar tus propias conversaciones de X.com, usa nuestro scraper:

**🔗 [x-twitter-scraper](https://github.com/686f6c61/x-twitter-scraper)**

El scraper genera el formato JSON compatible con este sistema de análisis.

### DEPENDENCIAS

**Python 3.7+** (opcional, solo para CLI)
- networkx >= 3.0
- typing-extensions >= 4.0

**Navegador moderno** (recomendado)
- Chrome/Firefox/Edge con soporte ES6 modules
- JavaScript habilitado

---

## ARQUITECTURA DEL PROYECTO

```
grafos/
├── data/                          # Datasets de entrada
│   └── tweets.json                # JSON de tweets scrapeados
│
├── example_data/                  # 📁 Archivos de ejemplo
│   ├── README.md                  # Instrucciones de uso
│   ├── example_betis.json         # Datos de ejemplo Real Betis
│   └── example_sevilla.json       # Datos de ejemplo Sevilla FC
│
├── web/                           # Aplicación web (frontend)
│   ├── index.html                 # Aplicación principal
│   ├── style.css                  # Estilos globales
│   ├── app.js                     # Entry point (294 líneas)
│   ├── graph-worker.js            # Web Worker para procesamiento
│   │
│   ├── core/                      # Núcleo del sistema
│   │   ├── state.js               # Estado global y gestión
│   │   ├── utils.js               # Utilidades generales
│   │   └── init.js                # Inicialización
│   │
│   ├── ui/                        # Interfaz de usuario
│   │   ├── tabs.js                # Sistema de pestañas
│   │   ├── modals.js              # Modales de ayuda
│   │   ├── overlay.js             # Overlays y paneles
│   │   └── footer.js              # Footer con changelog y disclaimer
│   │
│   ├── data/                      # Gestión de datos
│   │   ├── loader.js              # Carga de archivos
│   │   └── processor.js           # Procesamiento de tweets
│   │
│   ├── features/                  # Funcionalidades específicas
│   │   ├── influencers/           # Sistema de influencers
│   │   │   ├── table.js           # Tabla de influencers
│   │   │   ├── profile.js         # Perfiles detallados
│   │   │   ├── filters.js         # Filtros de búsqueda
│   │   │   └── chart.js           # Gráficos de dispersión
│   │   │
│   │   ├── bots/                  # Detección de bots
│   │   │   ├── table.js           # Tabla de bots
│   │   │   ├── profile.js         # Perfiles de bots
│   │   │   ├── filters.js         # Filtros de bots
│   │   │   └── chart.js           # Gráficos de bots
│   │   │
│   │   └── statistics/            # Estadísticas generales
│   │       └── index.js           # Renderizado de stats
│   │
│   ├── visualization/             # Visualización de grafos
│   │   ├── graphs/                # Renderizado de grafos
│   │   │   ├── renderer.js        # Inicialización de vis.js
│   │   │   ├── controls.js        # Controles interactivos
│   │   │   ├── styles.js          # Estilos de nodos/aristas
│   │   │   └── events.js          # Eventos de interacción
│   │   │
│   │   └── word-cloud.js          # Nube de palabras
│   │
│   ├── utils/                     # Utilidades auxiliares
│   │   ├── export.js              # Exportación ZIP/GraphML/CSV
│   │   └── performance.js         # Caché y optimización
│   │
│   └── assets/
│       └── favicon.ico
│
├── src/                           # Backend Python (CLI)
│   ├── main.py                    # CLI principal - análisis individual
│   ├── batch_analyze.py           # CLI batch - análisis múltiples
│   │
│   ├── core/                      # Núcleo del sistema
│   │   ├── config.py              # Configuración y constantes
│   │   └── types.py               # Type hints y dataclasses
│   │
│   ├── io/                        # Entrada/Salida
│   │   ├── loaders.py             # Carga de tweets y grafos
│   │   └── exporters.py           # Exportación GraphML/JSON
│   │
│   ├── processors/                # Procesamiento de datos
│   │   ├── tweet_extractor.py     # Extracción de datos de tweets
│   │   ├── graph_builder.py       # Construcción de grafos
│   │   └── statistics.py          # Cálculo de estadísticas
│   │
│   ├── analysis/                  # Análisis de grafos
│   │   ├── centrality.py          # Métricas de centralidad
│   │   ├── communities.py         # Detección de comunidades
│   │   ├── metrics_advanced.py    # Métricas avanzadas
│   │   └── enrichment.py          # Enriquecimiento de nodos
│   │
│   └── batch/                     # Procesamiento múltiple
│       └── processor.py           # Análisis de múltiples JSONs
│
├── output/                        # Resultados generados (Python CLI)
│   ├── mentions_graph.graphml     # Grafo de menciones (Gephi/Cytoscape)
│   ├── cohashtag_graph.graphml    # Grafo de co-hashtags
│   ├── graph_mentions.json        # Grafo para visualización web
│   ├── graph_cohashtags.json      # Grafo para visualización web
│   └── statistics.json            # Estadísticas generales
│
├── logs/                          # Logs del servidor
├── start_server.py                # Servidor web Python
├── requirements.txt               # Dependencias Python
└── README.md
```

**Total archivos JavaScript:** 30 módulos (app.js reducido de 3140 → 294 líneas, reducción del 90%)

**Total módulos Python:** 20 archivos organizados (de 3 scripts monolíticos)

---

## INSTALACIÓN

### MÉTODO 1: SOLO NAVEGADOR (RECOMENDADO)

No requiere instalación Python. Procesa datos directamente en el navegador.

```bash
# Iniciar servidor web
python3 start_server.py

# O usar script helper
./restart_server.sh
```

Accede a: **http://localhost:8000**

### MÉTODO 2: CON PYTHON CLI (ANÁLISIS AVANZADO)

Para análisis batch de múltiples datasets o integración en pipelines.

```bash
# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Instalar dependencias
pip install -r requirements.txt
```

---

## USO

### MÉTODO RECOMENDADO: NAVEGADOR

Procesamiento completo en el navegador sin necesidad de Python.

1. **Iniciar servidor:**
```bash
python3 start_server.py
```

2. **Abrir navegador:** http://localhost:8000

3. **Cargar archivo:** Seleccionar `tweets.json` con el botón de carga

4. **Procesar:** Click en "Procesar y Visualizar"

5. **Exportar (opcional):** Click en "Exportar ZIP" para descargar todos los archivos generados

### PYTHON CLI: ANÁLISIS INDIVIDUAL

Análisis de un único dataset con salida a disco.

```bash
# Básico
python src/main.py data/tweets.json

# Con directorio de salida personalizado
python src/main.py data/tweets.json --output output/elecciones/

# Sin métricas avanzadas (más rápido)
python src/main.py data/tweets.json --no-advanced

# Modo verbose
python src/main.py data/tweets.json -v
```

**Salida generada:**
```
output/
├── mentions_graph.graphml      # Grafo de menciones (Gephi/Cytoscape)
├── cohashtag_graph.graphml     # Grafo de co-hashtags
├── graph_mentions.json         # Grafo para web
├── graph_cohashtags.json       # Grafo para web
└── statistics.json             # Estadísticas generales
```

### PYTHON CLI: ANÁLISIS BATCH

Procesamiento de múltiples datasets simultáneamente con comparación opcional.

```bash
# Procesar todos los JSONs en data/
python src/batch_analyze.py data/*.json

# Con comparación entre datasets
python src/batch_analyze.py data/*.json --compare

# Salida personalizada
python src/batch_analyze.py data/*.json --output output/batch/ --compare

# Sin métricas avanzadas (más rápido)
python src/batch_analyze.py data/*.json --no-advanced
```

**Ejemplo de uso real:**
```bash
# Comparar elecciones de diferentes años
python src/batch_analyze.py \
    data/elecciones_2020.json \
    data/elecciones_2024.json \
    --compare \
    --output output/elecciones_comparacion/
```

**Uso como librería Python:**
```python
from src.main import analyze_dataset
from src.batch.processor import process_multiple_datasets, compare_datasets

# Análisis individual
result = analyze_dataset('data/tweets.json', output_dir='output/custom/')
print(result['mentions_json'])

# Análisis batch
results = process_multiple_datasets([
    'data/elecciones.json',
    'data/debate.json'
])

# Comparación
comparison = compare_datasets(results)
print(comparison['summary'])
```

---

## CARACTERÍSTICAS PRINCIPALES

### PROCESAMIENTO DE DATOS

- **Procesamiento en navegador:** Web Workers para cálculo paralelo sin bloqueo de UI
- **Sistema de caché:** localStorage con TTL de 7 días para cargas instantáneas
- **Detección de comunidades:** Algoritmo de Louvain para grafos de menciones y co-hashtags
- **Métricas de red:** Centralidad (degree, betweenness, closeness, eigenvector, PageRank), clustering, k-core
- **Análisis temporal:** Ventanas configurables para detección de Rising/Falling Stars

### VISUALIZACIÓN INTERACTIVA

- **Grafos a pantalla completa:** Visualización con vis.js
- **4 dimensiones visuales:**
  - Color: Comunidad detectada
  - Tamaño: Número de tweets
  - Grosor del borde: Clustering Coefficient (cohesión local)
  - Opacidad/Brillo: Closeness Centrality (capacidad de difusión)
- **Controles avanzados:**
  - Búsqueda de usuarios
  - Filtro por peso de aristas
  - Toggle de etiquetas
  - Configuración de métricas visuales
  - Exportación de imagen PNG
- **Nube de palabras:** Visualización de términos más frecuentes

### DETECCIÓN DE INFLUENCERS

Sistema multi-métrica para identificación de influencers con puntuación compuesta (0-100):

- **Influencer Score:** Combina PageRank (30%), Eigenvector (20%), Betweenness (15%), Degree (10%), Engagement (15%), Engagement Rate (10%)
- **Categorización:** Mega (80-100), Macro (60-80), Micro (40-60), Nano (20-40)
- **Tabla Top 20:** Ranking con filtros por categoría y comunidad
- **Gráfico de dispersión:** Score vs Engagement
- **Perfiles detallados:** Panel lateral con todas las métricas y tweet destacado

### DETECCIÓN DE BOTS

Sistema de puntuación multi-señal para identificación de cuentas automatizadas:

- **Bot Score (0-100):** Basado en patrones temporales, contenido repetitivo, interacciones y perfil
- **Categorización:** Humano (0-30), Sospechoso (30-60), Bot Probable (60-80), Bot Confirmado (80-100)
- **Ranking completo:** Ordenado por Bot Score con filtros
- **Gráfico de dispersión:** Bot Score vs Actividad
- **Análisis detallado:** Desglose de señales por cuenta

**Disclaimer:** El sistema puede generar falsos positivos (usuarios legítimos con patrones automatizados) y falsos negativos. Ver pestaña "Disclaimer" en la aplicación para más información.

### NETWORK MOTIFS

Análisis de patrones estructurales en las redes sociales:

- **Triángulos:** Grupos cohesivos de 3 usuarios mutuamente conectados (clustering local)
- **Estrellas:** Hubs centralizados con estructura hub-and-spoke
- **Cadenas:** Flujos lineales de información a través de intermediarios
- **Cohesión de red:** Métrica compuesta 0-100% que combina triángulos, clustering y densidad
- **Selector de grafos:** Análisis en Menciones y Co-hashtags
- **Exportación:** CSV/JSON individual y completo
- **Documentación académica:** Fundamentos teóricos y referencias a papers clave

### ESTADÍSTICAS GENERALES

- Top 10 usuarios por actividad (tweets)
- Top 10 usuarios por engagement (likes + views + replies)
- Top hashtags más usados
- Actividad temporal (timeline)
- Métricas de red (densidad, modularidad, assortativity)
- Distribución de comunidades con detalles interactivos

---

## MÉTRICAS CALCULADAS

### CENTRALIDAD

**DEGREE CENTRALITY**
Número de conexiones directas de un nodo normalizado. Identifica usuarios altamente conectados.

**BETWEENNESS CENTRALITY**
Mide cuántas rutas más cortas entre pares de nodos pasan por un nodo dado. Identifica conectores clave entre comunidades.

**CLOSENESS CENTRALITY**
Inversa de la distancia promedio a todos los demás nodos. Valores altos indican capacidad de alcanzar rápidamente a otros usuarios (difusión de información).

**EIGENVECTOR CENTRALITY**
Mide influencia basada en la importancia de las conexiones. Un nodo es importante si está conectado a otros nodos importantes.

**PAGERANK**
Algoritmo de Google adaptado a grafos sociales. Mide influencia ponderada por la importancia de quienes te mencionan.

### COHESIÓN

**CLUSTERING COEFFICIENT**
Mide qué tan conectados están los vecinos de un nodo entre sí. Valores altos indican grupos cohesivos o "cliques".

**K-CORE DECOMPOSITION**
Identifica el núcleo denso del grafo. Separa usuarios centrales (k-core alto) de periféricos (k-core bajo).

**MODULARIDAD**
Calidad de la división en comunidades. Valores altos (> 0.3) indican comunidades bien definidas.

**ASSORTATIVITY**
Mide si nodos similares tienden a conectarse. Valores positivos = homofilia (similar con similar), negativos = patrón hub-spoke.

### INFLUENCIA COMPUESTA

**INFLUENCER SCORE (0-100)**

Métrica compuesta que combina múltiples indicadores de influencia mediante sistema de pesos basado en investigación:

```
Score = (PageRank × 30%) + (Eigenvector × 20%) + (Betweenness × 15%) +
        (Degree × 10%) + (Engagement × 15%) + (Engagement Rate × 10%)
```

**Componentes:**
- **PageRank (30%):** Influencia algorítmica basada en conexiones de calidad
- **Eigenvector Centrality (20%):** Importancia por conectar con nodos importantes
- **Betweenness Centrality (15%):** Capacidad de actuar como puente entre comunidades
- **Degree Centrality (10%):** Número relativo de conexiones directas
- **Engagement (15%):** Interacción total recibida (likes + views + replies)
- **Engagement Rate (10%):** Eficiencia de engagement (engagement/tweets)

**Categorías:**
- **Mega Influencer (80-100):** Máxima influencia, líderes de opinión clave
- **Macro Influencer (60-80):** Alta influencia, voces importantes en la comunidad
- **Micro Influencer (40-60):** Influencia moderada, conectores relevantes
- **Nano Influencer (20-40):** Influencia emergente o especializada

**Interpretación:** Un score alto indica que el usuario combina múltiples factores de influencia: no solo tiene muchas conexiones, sino que son conexiones de calidad, actúa como puente entre grupos, y genera alto engagement. Esta métrica es más robusta que usar un solo indicador.

---

## INTERFAZ WEB

### PESTAÑAS PRINCIPALES

**GRAFO DE MENCIONES**
Visualiza las menciones dirigidas entre usuarios (A → B = "A menciona a B").

- **Nodos:** Color por comunidad, tamaño por tweets, grosor del borde por clustering, brillo por closeness
- **Aristas:** Grosor indica frecuencia de menciones
- **Interacción:** Click en nodo para ver información detallada y tweet destacado
- **Controles:** Búsqueda, filtro por peso, toggle de etiquetas, configuración de métricas visuales

**GRAFO DE CO-HASHTAGS**
Visualiza usuarios que comparten hashtags similares (aristas no dirigidas).

- **Nodos:** Mismo sistema de visualización multi-dimensional
- **Aristas:** Grosor indica cantidad de hashtags compartidos
- **Interacción:** Mismos controles que grafo de menciones

**INFLUENCERS**
Sistema completo de detección y análisis de influencers.

- **Tabla Top 20:** Ranking con filtros por categoría y comunidad
- **Gráfico de dispersión:** Score vs Engagement coloreado por categoría
- **Panel de perfil:** Click en influencer para ver detalles completos con todas las métricas y tweet destacado

**BOTS**
Detección de cuentas automatizadas con análisis multi-señal.

- **Tabla de bots:** Ordenado por Bot Score con filtros
- **Gráfico de dispersión:** Bot Score vs Actividad
- **Panel de perfil:** Desglose de señales por cuenta

**ESTADÍSTICAS**
Rankings, métricas de red y distribución de comunidades.

- Top 10 por actividad y engagement
- Top hashtags
- Timeline de actividad
- Métricas de red (densidad, modularidad, assortativity)
- Distribución de comunidades con modal de detalles

### CONTROLES INTERACTIVOS

- **Búsqueda:** Encuentra usuarios por nombre (resalta en grafo)
- **Peso mínimo:** Filtra conexiones débiles (tooltip explicativo disponible)
- **Mostrar etiquetas:** Toggle de nombres de usuario en nodos
- **Exportar imagen:** Descarga el grafo como PNG
- **Resetear vista:** Vuelve al zoom inicial
- **⚙ Avanzado:** Configura qué métricas visualizar (grosor del borde, opacidad/brillo)

---

## EXPORTACIÓN DE DATOS

### DESDE NAVEGADOR

Click en "Exportar ZIP" para descargar archivo comprimido con:

```
export_[timestamp].zip
├── mentions_graph.graphml       # Grafo de menciones (Gephi/Cytoscape)
├── cohashtag_graph.graphml      # Grafo de co-hashtags (Gephi/Cytoscape)
├── graph_mentions.json          # Grafo para visualización web
├── graph_cohashtags.json        # Grafo para visualización web
├── statistics.json              # Estadísticas generales
├── influencers.json             # Ranking completo de influencers
├── influencers.csv              # Influencers (Excel/Google Sheets)
├── bots.json                    # Detección de bots
├── bots.csv                     # Bots (Excel/Google Sheets)
├── communities.json             # Comunidades detectadas
├── communities.csv              # Comunidades (Excel/Google Sheets)
├── word_frequencies.json        # Términos frecuentes
└── README.txt                   # Documentación de archivos
```

**GraphML** es un formato XML estándar para grafos que puede ser importado en herramientas de análisis de redes como [Gephi](https://gephi.org/) o [Cytoscape](https://cytoscape.org/).

### DESDE PYTHON CLI

Los archivos se generan automáticamente en el directorio especificado con `--output` (por defecto `output/`).

---

## DESARROLLO Y PERSONALIZACIÓN

### MODIFICAR DATOS

Reemplaza `data/tweets.json` con tu propio archivo y vuelve a procesar.

### AJUSTAR PARÁMETROS PYTHON

Edita `src/core/config.py` para:
- Cambiar límites de rankings (TOP_LIMIT)
- Ajustar configuración de algoritmos (LOUVAIN_CONFIG, PAGERANK_CONFIG)
- Modificar directorios de entrada/salida

### PERSONALIZAR VISUALIZACIÓN

**Colores de comunidades:** Edita `web/core/state.js` (variable `COMMUNITY_COLORS`)

**Física del grafo:** Modifica opciones de vis.js en `web/visualization/graphs/renderer.js`

**Tooltips y ayuda:** Edita textos en modales desde `web/ui/modals.js`

**Footer y changelog:** Actualiza `web/ui/footer.js` para modificar historial de versiones

### AGREGAR NUEVAS MÉTRICAS

**Python:**
1. Implementar función en `src/analysis/centrality.py` o `src/analysis/metrics_advanced.py`
2. Llamar desde `src/main.py` en el pipeline de análisis
3. Exportar en `src/io/exporters.py`

**JavaScript:**
1. Agregar cálculo en `web/graph-worker.js` (para procesamiento paralelo)
2. Actualizar visualización en `web/visualization/graphs/styles.js`
3. Agregar opción en modal avanzado (`web/ui/modals.js`)

---

## TROUBLESHOOTING

### ERROR: "No module named 'networkx'"

```bash
pip install -r requirements.txt
```

### ERROR: "File not found: data/tweets.json"

Asegúrate de que el archivo JSON esté en `data/tweets.json` o especifica la ruta correcta.

### LA VISUALIZACIÓN NO CARGA

Si usas Python CLI, verifica que ejecutaste `python src/main.py` antes de abrir el navegador.

Si usas el navegador, revisa la consola del navegador (F12) para errores JavaScript.

### EL GRAFO SE VE VACÍO

Algunos grafos pueden tener pocos nodos conectados. Ajusta el "peso mínimo" a 1 para ver todas las conexiones.

### ERROR: "ModuleNotFoundError" EN PYTHON

Asegúrate de ejecutar desde la raíz del proyecto:

```bash
cd /home/r/Escritorio/grafos
python src/main.py data/tweets.json
```

### EL BOTÓN DE EXPORTAR NO APARECE

Recarga la página. El botón se muestra automáticamente después de procesar datos.

---

## CONTROL DE VERSIONES

### BETA 0.6.8 (2025-10-07) - Network Motifs

- **Network Motifs:** Análisis de patrones estructurales (triángulos, estrellas, cadenas)
- **Métrica de cohesión:** Indicador compuesto 0-100% de unión de red
- **Selector de grafos:** Cambio dinámico entre Menciones y Co-hashtags en análisis de patrones
- **Modales interactivos:** Click en motifs para ver listado completo de usuarios
- **Exportación motifs:** CSV/JSON individual y completo por tipo de patrón
- **Documentación académica:** Referencias a papers clave (Milo 2002, Newman 2003, Granovetter 1973)
- **Sistema de caché v0.5.13:** Invalidación automática al actualizar código
- **Diseño profesional:** Botones negros, UI mejorada en modales

### BETA 0.6.6 (2025-10-06) - Exportación Avanzada

- **PDF Report:** Informe completo con visualizaciones capturadas
- **Excel XLSX:** 4 hojas (Nodos, Aristas, Métricas, Comunidades)
- **GraphML mejorado:** 21 atributos por nodo para Gephi/Cytoscape
- **Tab Exportar:** Selección granular de 16 formatos diferentes
- **Búsqueda global:** Buscador universal en header

### BETA 0.6.5 (2025-10-06)

- **Refactorización JavaScript:** app.js reducido de 3140 a 294 líneas (reducción del 90%)
- **Arquitectura modular:** 30 módulos organizados (core, ui, data, features, visualization, utils)
- **Refactorización Python:** 3 scripts monolíticos transformados en 20 módulos organizados
- **CLI moderno:** Soporte para análisis de múltiples datasets y comparación entre ellos
- **Type hints completos:** Anotaciones de tipo en todo el código Python
- **Correcciones:** Fix export.js como módulo ES6, graphData undefined, orden de carga
- **Footer:** Añadido con enlaces, versiones y descargo de responsabilidad
- **UX/UI:** Breadcrumbs, tooltips mejorados con Tippy.js, responsive para tablets

### V0.5.12 (OCTUBRE 2025)

- **Refactorización inicial:** Separación de responsabilidades en múltiples módulos
- **Módulos creados:** 21 archivos JavaScript con estructura organizada
- **Event-driven architecture:** CustomEvents para desacoplamiento entre componentes
- **Overlay fix:** Corrección de z-index y gestión de cierre de paneles
- **Documentación:** ARCHITECTURE.md con estructura del proyecto

### V0.5

- **Análisis Temporal de Influencia BETA:** Ventanas configurables para análisis dinámico
- **Nube de Palabras:** Integrada en tab Estadísticas
- **Export ampliado:** Incluye temporal_analysis y word_frequencies
- **Rising/Falling Stars:** Identificación de usuarios con cambio de influencia

### V0.4

- **Detección de comunidades:** Algoritmo Union-Find implementado
- **Modal de comunidades:** Exploración interactiva con estadísticas detalladas
- **Export ZIP ampliado:** 12 archivos incluyendo communities.json y CSV
- **Panel Avanzado:** Radio buttons descriptivos rediseñados
- **Detección de bots BETA:** Mejoras en algoritmo multi-señal
- **Branding:** GRAPHS - 686f6c61
- **UX:** Botones blanco/negro consistentes

### V0.3

- **Sistema de influencers:** Detección completa con categorización
- **UX/UI mejorada:** Tooltips, popups y ayuda contextual
- **Exportación ampliada:** Influencers en JSON y CSV

### V0.2

- **Métricas avanzadas:** Cálculo en navegador con optimizaciones
- **Web Workers:** Procesamiento paralelo sin bloqueo de UI
- **Sistema de caché:** localStorage para datos procesados
- **Exportación ZIP:** GraphML para Gephi y Cytoscape

### V0.1

- **Análisis básico:** Detección de comunidades con algoritmo de Louvain
- **Visualización interactiva:** Grafos con vis.js
- **Métricas fundamentales:** PageRank, betweenness, degree centrality

---

## TECNOLOGÍAS UTILIZADAS

**Backend:** Python 3.7+, NetworkX

**Frontend:** HTML, CSS, JavaScript (ES6 modules)

**Visualización:** vis.js (grafos), Chart.js (estadísticas), wordcloud2.js (nube de palabras)

**Algoritmos:** Louvain (comunidades), PageRank, métricas de centralidad, k-core, clustering

**Optimización:** Web Workers API, localStorage API

**Formatos:** GraphML (estándar XML para grafos), JSON, CSV

---

## DESCARGO DE RESPONSABILIDAD

Esta herramienta está diseñada exclusivamente para investigación académica, análisis de tendencias y detección de comunidades. Los resultados son aproximaciones algorítmicas y heurísticas que **no constituyen verdades absolutas**.

**El sistema de detección de bots puede generar falsos positivos y falsos negativos.** No utilizar para acoso, difamación, toma de decisiones automatizadas que afecten a personas, violación de privacidad o discriminación.

Todos los análisis se realizan localmente en el navegador. Los datos no se envían a servidores externos.

Ver modal "Disclaimer" en la aplicación para información completa sobre uso responsable, limitaciones y prohibiciones.

---

## AUTOR

**686f6c61**

- GitHub: [github.com/686f6c61](https://github.com/686f6c61)
- X.com: [@hex686f6c61](https://x.com/hex686f6c61)

---

## LICENCIA

MIT License - Este proyecto es de código abierto y está disponible bajo la licencia MIT.

Software distribuido "tal cual", sin garantías de ningún tipo. El autor no se hace responsable de uso indebido, inexactitudes en análisis, daños derivados del uso del software, o incumplimiento de leyes o regulaciones por parte del usuario.

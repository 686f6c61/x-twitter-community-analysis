import {
  Network,
  BarChart3,
  Users,
  Download,
  Sparkles,
  FileJson,
  Info,
  BookOpen,
  GitBranch,
  TrendingUp,
  Target,
  Zap,
  Database,
  Github,
  Twitter
} from 'lucide-react'

export function HelpPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <h1 className="page-title">Documentación GRAPHS</h1>
        <p style={{ fontSize: '16px', color: '#666', marginTop: '8px' }}>
          Guía completa de análisis de comunidades digitales con teoría de grafos y métricas de centralidad
        </p>
      </div>

      {/* Introducción */}
      <div className="chart-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Info size={24} />
          <h2 className="chart-title">¿Qué es GRAPHS?</h2>
        </div>
        <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#333' }}>
          GRAPHS es una herramienta de análisis de comunidades digitales basada en teoría de grafos que permite visualizar y
          estudiar interacciones en Twitter/X. El sistema procesa interacciones entre usuarios (menciones, respuestas, retweets)
          para construir un grafo dirigido donde los nodos representan usuarios y las aristas representan interacciones.
        </p>
      </div>

      {/* Formato de Datos */}
      <div className="chart-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <FileJson size={24} />
          <h2 className="chart-title">Formato de Datos de Entrada</h2>
        </div>

        <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', marginBottom: '16px' }}>
          El sistema acepta archivos JSON generados por el worker de análisis de Twitter/X. El formato original
          contiene datos en bruto que luego son procesados y transformados para el análisis de grafos.
        </p>

        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', marginTop: '24px' }}>
          Formato JSON Original (Del Worker)
        </h3>

        <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace', marginBottom: '16px' }}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{`{
  "metadata": {
    "query": "comunidad Betis",
    "start_date": "2025-01-01T00:00:00Z",
    "end_date": "2025-01-31T23:59:59Z",
    "total_tweets": 15432,
    "users_analyzed": 3521,
    "collection_date": "2025-01-31T23:59:59Z"
  },
  "users": [
    {
      "username": "usuario123",
      "display_name": "Usuario de Ejemplo",
      "user_id": "1234567890",
      "followers_count": 5420,
      "following_count": 312,
      "verified": false,
      "created_at": "2015-03-15T10:30:00Z",
      "profile_image_url": "https://pbs.twimg.com/...",
      "bio": "Descripción del usuario",
      "location": "Sevilla, España"
    }
  ],
  "tweets": [
    {
      "tweet_id": "1234567890123456789",
      "author_username": "usuario123",
      "text": "Contenido del tweet con @mencion1 y @mencion2",
      "created_at": "2025-01-15T14:30:00Z",
      "lang": "es",
      "retweet_count": 45,
      "reply_count": 12,
      "like_count": 230,
      "quote_count": 8,
      "is_retweet": false,
      "is_quote": false,
      "is_reply": false,
      "replied_to_username": null,
      "hashtags": ["Betis", "VamosMiBetis"],
      "mentions": ["mencion1", "mencion2"],
      "urls": ["https://example.com"],
      "media": []
    }
  ],
  "interactions": {
    "mentions": [
      {
        "source": "usuario123",
        "target": "mencion1",
        "tweet_id": "1234567890123456789",
        "timestamp": "2025-01-15T14:30:00Z"
      }
    ],
    "replies": [
      {
        "source": "usuario456",
        "target": "usuario123",
        "tweet_id": "9876543210987654321",
        "timestamp": "2025-01-15T15:00:00Z"
      }
    ],
    "retweets": [
      {
        "source": "usuario789",
        "target": "usuario123",
        "tweet_id": "1111111111111111111",
        "timestamp": "2025-01-15T16:00:00Z"
      }
    ]
  }
}`}</pre>
        </div>

        <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', marginBottom: '24px' }}>
          <strong>Secciones del JSON original:</strong>
          <ul style={{ marginTop: '8px', paddingLeft: '24px' }}>
            <li><strong>metadata:</strong> Información sobre la consulta y fecha de recolección</li>
            <li><strong>users:</strong> Lista completa de usuarios con datos de perfil</li>
            <li><strong>tweets:</strong> Todos los tweets recolectados con métricas de engagement</li>
            <li><strong>interactions:</strong> Menciones, respuestas y retweets estructurados por tipo de interacción</li>
          </ul>
        </div>

        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', marginTop: '24px' }}>
          Formato JSON Transformado (Para Visualización)
        </h3>

        <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', marginBottom: '16px' }}>
          El sistema procesa automáticamente el JSON original y genera una estructura de grafo optimizada:
        </p>

        <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace', marginBottom: '16px' }}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{`{
  "mentions": {
    "nodes": [
      {
        "id": "username",
        "label": "Display Name",
        "tweets": 150,
        "engagement": 1250,
        "followers": 5000,
        "following": 300,
        "degree_centrality": 0.0234,
        "betweenness_centrality": 0.0156,
        "closeness_centrality": 0.0189,
        "pagerank": 0.0034
      }
    ],
    "edges": [
      {
        "from": "user1",
        "to": "user2",
        "weight": 5
      }
    ]
  }
}`}</pre>
        </div>

        <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#333' }}>
          <strong>Proceso de transformación:</strong>
          <ol style={{ marginTop: '8px', paddingLeft: '24px', marginBottom: '16px' }}>
            <li>Extracción de usuarios únicos desde la sección <code>users</code></li>
            <li>Agregación de interacciones (menciones + respuestas + retweets) en aristas ponderadas</li>
            <li>Cálculo de métricas básicas: total de tweets por usuario, engagement acumulado</li>
            <li>Cálculo de métricas de centralidad usando algoritmos de teoría de grafos</li>
            <li>Generación de estructura optimizada para visualización con vis.js</li>
          </ol>

          <strong>Campos del grafo transformado:</strong>
          <ul style={{ marginTop: '8px', paddingLeft: '24px' }}>
            <li><code>id</code>: Username único del usuario</li>
            <li><code>label</code>: Nombre para mostrar (display_name)</li>
            <li><code>tweets</code>: Número de publicaciones del usuario en el dataset</li>
            <li><code>engagement</code>: Suma de likes + retweets + respuestas recibidas</li>
            <li><code>followers</code>, <code>following</code>: Métricas de la cuenta de Twitter</li>
            <li><code>degree_centrality</code>: Centralidad de grado normalizada</li>
            <li><code>betweenness_centrality</code>: Centralidad de intermediación</li>
            <li><code>closeness_centrality</code>: Centralidad de cercanía</li>
            <li><code>pagerank</code>: Score de PageRank calculado sobre el grafo de menciones</li>
          </ul>

          <strong style={{ marginTop: '16px', display: 'block' }}>Campos de las aristas:</strong>
          <ul style={{ marginTop: '8px', paddingLeft: '24px' }}>
            <li><code>from</code>: Username del usuario que realiza la interacción</li>
            <li><code>to</code>: Username del usuario que recibe la interacción</li>
            <li><code>weight</code>: Frecuencia de interacción (número de menciones/respuestas/retweets)</li>
          </ul>
        </div>
      </div>

      {/* Métricas de Centralidad */}
      <div className="chart-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Target size={24} />
          <h2 className="chart-title">Métricas de Centralidad</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Degree Centrality */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Centralidad de Grado (Degree Centrality)</h3>
            <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', marginBottom: '12px' }}>
              Mide el número de conexiones directas que tiene un nodo. Un valor alto indica que el usuario interactúa
              con muchos otros usuarios o es mencionado frecuentemente.
            </p>
            <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px', fontSize: '14px', fontFamily: 'monospace' }}>
              C<sub>D</sub>(v) = deg(v) / (n - 1)
            </div>
            <p style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
              Donde <code>deg(v)</code> es el grado del nodo y <code>n</code> es el número total de nodos.
            </p>
          </div>

          {/* Betweenness Centrality */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Centralidad de Intermediación (Betweenness Centrality)</h3>
            <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', marginBottom: '12px' }}>
              Mide cuántas veces un nodo actúa como puente en el camino más corto entre dos nodos. Identifica usuarios
              que conectan diferentes comunidades o grupos.
            </p>
            <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px', fontSize: '14px', fontFamily: 'monospace' }}>
              C<sub>B</sub>(v) = Σ (σ<sub>st</sub>(v) / σ<sub>st</sub>)
            </div>
            <p style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
              Donde <code>σ<sub>st</sub></code> es el número de caminos más cortos entre <code>s</code> y <code>t</code>,
              y <code>σ<sub>st</sub>(v)</code> es el número de esos caminos que pasan por <code>v</code>.
            </p>
            <p style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
              <strong>Referencia:</strong> Freeman, L. C. (1977). "A Set of Measures of Centrality Based on Betweenness". Sociometry, 40(1), 35-41.
            </p>
          </div>

          {/* Closeness Centrality */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Centralidad de Cercanía (Closeness Centrality)</h3>
            <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', marginBottom: '12px' }}>
              Mide qué tan cerca está un nodo de todos los demás nodos en la red. Un valor alto indica que el usuario
              puede difundir información rápidamente.
            </p>
            <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px', fontSize: '14px', fontFamily: 'monospace' }}>
              C<sub>C</sub>(v) = (n - 1) / Σ d(v, u)
            </div>
            <p style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
              Donde <code>d(v, u)</code> es la distancia más corta entre el nodo <code>v</code> y el nodo <code>u</code>.
            </p>
          </div>

          {/* PageRank */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>PageRank</h3>
            <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', marginBottom: '12px' }}>
              Algoritmo originalmente desarrollado por Google para ranking de páginas web. En redes sociales, identifica
              usuarios influyentes considerando no solo cuántas menciones reciben, sino la importancia de quienes los mencionan.
            </p>
            <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px', fontSize: '14px', fontFamily: 'monospace' }}>
              PR(v) = (1-d)/n + d × Σ (PR(u) / L(u))
            </div>
            <p style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
              Donde <code>d</code> es el factor de amortiguamiento (típicamente 0.85), <code>L(u)</code> es el número de
              enlaces salientes del nodo <code>u</code>, y la suma se realiza sobre todos los nodos <code>u</code> que
              enlazan a <code>v</code>.
            </p>
            <p style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
              <strong>Referencia:</strong> Page, L., Brin, S., Motwani, R., & Winograd, T. (1999).
              "The PageRank Citation Ranking: Bringing Order to the Web". Stanford InfoLab.
            </p>
          </div>
        </div>
      </div>

      {/* Funcionalidades por Pestaña */}
      <div className="chart-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <BookOpen size={24} />
          <h2 className="chart-title">Funcionalidades del Sistema</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Grafo */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Network size={20} />
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Grafo</h3>
            </div>
            <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#333' }}>
              Visualización interactiva del grafo de menciones usando vis.js. Características:
            </p>
            <ul style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', paddingLeft: '24px', marginTop: '8px' }}>
              <li><strong>Física de grafos:</strong> Algoritmo de Barnesut para layout automático (n-body simulation)</li>
              <li><strong>Interacción:</strong> Zoom, pan, selección de nodos, arrastre</li>
              <li><strong>Tamaño de nodos:</strong> Proporcional al PageRank del usuario</li>
              <li><strong>Grosor de aristas:</strong> Proporcional al peso de la interacción</li>
              <li><strong>Información detallada:</strong> Click en nodo muestra métricas completas</li>
            </ul>
          </div>

          {/* Estadísticas */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <BarChart3 size={20} />
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Estadísticas</h3>
            </div>
            <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#333' }}>
              Análisis estadístico completo de la red:
            </p>
            <ul style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', paddingLeft: '24px', marginTop: '8px' }}>
              <li><strong>Métricas generales:</strong> Total de usuarios, interacciones, densidad de red</li>
              <li><strong>Top usuarios:</strong> Rankings por PageRank, Betweenness, Closeness y Degree</li>
              <li><strong>Distribución de grados:</strong> Histograma que muestra la distribución de conexiones</li>
              <li><strong>Métricas de engagement:</strong> Usuarios más activos y con mayor engagement</li>
              <li><strong>Análisis temporal:</strong> Si los datos incluyen timestamps</li>
            </ul>
          </div>

          {/* Influencers */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Users size={20} />
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Influencers</h3>
            </div>
            <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#333' }}>
              Identificación de usuarios influyentes mediante análisis multidimensional:
            </p>
            <ul style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', paddingLeft: '24px', marginTop: '8px' }}>
              <li><strong>Score de influencia:</strong> Combinación ponderada de PageRank (40%), Betweenness (30%), Degree (20%) y Engagement (10%)</li>
              <li><strong>Categorización:</strong> Elite, Alto, Medio, Emergente</li>
              <li><strong>Filtros avanzados:</strong> Por score, métricas específicas, nivel de actividad</li>
              <li><strong>Visualización comparativa:</strong> Gráficos de dispersión y rankings</li>
            </ul>
          </div>

          {/* Exportar */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Download size={20} />
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Exportar</h3>
            </div>
            <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#333' }}>
              Exportación de datos y análisis en múltiples formatos:
            </p>
            <ul style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', paddingLeft: '24px', marginTop: '8px', marginBottom: '16px' }}>
              <li><strong>JSON:</strong> Grafo completo con todas las métricas calculadas</li>
              <li><strong>CSV:</strong> Tabla de nodos con métricas para análisis en Excel/R/Python</li>
              <li><strong>GraphML:</strong> Formato estándar XML para importar en Gephi, Cytoscape, NetworkX</li>
              <li><strong>GEXF:</strong> Graph Exchange XML Format nativo de Gephi</li>
              <li><strong>Reporte PDF:</strong> Documento completo con visualizaciones y análisis</li>
            </ul>

            <div style={{ background: '#f9f9f9', padding: '16px', borderRadius: '8px', marginTop: '16px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Uso de archivos con Gephi</h4>
              <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', marginBottom: '12px' }}>
                <strong>Gephi</strong> es una herramienta profesional de código abierto para análisis y visualización de grafos.
                Para usar los archivos exportados:
              </p>

              <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', marginBottom: '16px' }}>
                <strong>1. Exportar desde GRAPHS:</strong>
                <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
                  <li>Ve a la pestaña <strong>Exportar</strong></li>
                  <li>Selecciona formato <strong>GEXF</strong> o <strong>GraphML</strong> (recomendado: GEXF)</li>
                  <li>Haz clic en "Exportar" y guarda el archivo</li>
                </ul>
              </div>

              <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', marginBottom: '16px' }}>
                <strong>2. Importar en Gephi:</strong>
                <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
                  <li>Abre Gephi (descarga gratuita en <code>gephi.org</code>)</li>
                  <li>Archivo → Abrir → Selecciona tu archivo .gexf o .graphml</li>
                  <li>En el diálogo de importación, selecciona "Grafo dirigido" (Directed Graph)</li>
                  <li>Acepta la configuración por defecto</li>
                </ul>
              </div>

              <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#333' }}>
                <strong>3. Análisis avanzado en Gephi:</strong>
                <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
                  <li><strong>Layouts:</strong> Usa ForceAtlas 2, Fruchterman Reingold o Yifan Hu para visualización</li>
                  <li><strong>Estadísticas:</strong> Calcula modularidad, comunidades (Louvain), clustering coefficient</li>
                  <li><strong>Ranking:</strong> Colorea nodos por PageRank, grado, o cualquier métrica</li>
                  <li><strong>Filtros:</strong> Filtra por grado, PageRank o métricas personalizadas</li>
                  <li><strong>Exportación:</strong> Genera imágenes PNG/SVG o archivos interactivos HTML</li>
                </ul>
              </div>

              <p style={{ fontSize: '13px', color: '#666', marginTop: '16px', fontStyle: 'italic' }}>
                <strong>Nota:</strong> Todas las métricas calculadas en GRAPHS (PageRank, Betweenness, Closeness, Degree)
                se exportan como atributos de los nodos y estarán disponibles en Gephi para visualización y análisis.
              </p>
            </div>
          </div>

          {/* IA */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles size={20} />
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Análisis con IA</h3>
            </div>
            <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#333' }}>
              Análisis avanzado usando inteligencia artificial (requiere API key):
            </p>
            <ul style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', paddingLeft: '24px', marginTop: '8px' }}>
              <li><strong>Detección de comunidades:</strong> Identificación automática de grupos y subgrafos</li>
              <li><strong>Análisis de sentimiento:</strong> Clasificación de polaridad en interacciones</li>
              <li><strong>Predicción de influencia:</strong> Modelos ML para predecir usuarios emergentes</li>
              <li><strong>Recomendaciones:</strong> Sugerencias de cuentas para seguir o colaborar</li>
              <li><strong>Resumen narrativo:</strong> Generación automática de insights y conclusiones</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Algoritmos y Técnicas */}
      <div className="chart-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <GitBranch size={24} />
          <h2 className="chart-title">Algoritmos y Técnicas Implementadas</h2>
        </div>

        <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#333' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Construcción del Grafo</h3>
          <p style={{ marginBottom: '16px' }}>
            El grafo se construye como un <strong>grafo dirigido ponderado</strong> donde:
          </p>
          <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
            <li>Cada nodo representa un usuario único identificado por su username</li>
            <li>Cada arista dirigida (u → v) representa que el usuario u mencionó al usuario v</li>
            <li>El peso de la arista indica la frecuencia de interacción</li>
          </ul>

          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', marginTop: '24px' }}>Procesamiento de Datos</h3>
          <p style={{ marginBottom: '8px' }}>Pipeline de procesamiento:</p>
          <ol style={{ paddingLeft: '24px', marginBottom: '16px' }}>
            <li><strong>Parsing:</strong> Lectura y validación del JSON de entrada</li>
            <li><strong>Normalización:</strong> Limpieza de usernames, eliminación de duplicados</li>
            <li><strong>Cálculo de métricas:</strong> Si no están presentes, se calculan todas las centralidades</li>
            <li><strong>Agregación:</strong> Cálculo de estadísticas globales de la red</li>
            <li><strong>Indexación:</strong> Creación de índices para búsqueda y filtrado rápido</li>
          </ol>

          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', marginTop: '24px' }}>Visualización</h3>
          <p style={{ marginBottom: '8px' }}>
            Utilizamos el algoritmo <strong>Force-Directed Layout</strong> (Fruchterman-Reingold) para el posicionamiento
            de nodos, que simula un sistema físico donde:
          </p>
          <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
            <li>Los nodos se repelen entre sí (fuerza repulsiva)</li>
            <li>Las aristas actúan como resortes que atraen nodos conectados</li>
            <li>El sistema busca un estado de equilibrio que minimiza la energía total</li>
          </ul>
          <p style={{ fontSize: '13px', color: '#666' }}>
            <strong>Referencia:</strong> Fruchterman, T. M., & Reingold, E. M. (1991).
            "Graph drawing by force-directed placement". Software: Practice and experience, 21(11), 1129-1164.
          </p>
        </div>
      </div>

      {/* Interpretación de Resultados */}
      <div className="chart-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <TrendingUp size={24} />
          <h2 className="chart-title">Interpretación de Resultados</h2>
        </div>

        <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#333' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>¿Qué significan las métricas?</h3>

          <div style={{ marginBottom: '16px' }}>
            <strong>PageRank alto:</strong> Usuario que recibe menciones de otros usuarios importantes.
            Indica autoridad e influencia en la red.
          </div>

          <div style={{ marginBottom: '16px' }}>
            <strong>Betweenness alto:</strong> Usuario que conecta diferentes grupos o comunidades.
            Actúa como puente de información entre clusters.
          </div>

          <div style={{ marginBottom: '16px' }}>
            <strong>Closeness alto:</strong> Usuario bien conectado con el resto de la red.
            Puede difundir información rápidamente a toda la comunidad.
          </div>

          <div style={{ marginBottom: '16px' }}>
            <strong>Degree alto:</strong> Usuario muy activo en interacciones.
            Menciona o es mencionado por muchos otros usuarios.
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', marginTop: '24px' }}>Casos de Uso</h3>

          <ul style={{ paddingLeft: '24px' }}>
            <li style={{ marginBottom: '12px' }}>
              <strong>Marketing de Influencers:</strong> Identificar usuarios con alto PageRank y engagement
              para campañas publicitarias
            </li>
            <li style={{ marginBottom: '12px' }}>
              <strong>Análisis de Comunidades:</strong> Detectar grupos cohesionados y sus líderes de opinión
            </li>
            <li style={{ marginBottom: '12px' }}>
              <strong>Monitoreo de Marca:</strong> Rastrear menciones y sentiment en torno a una marca o producto
            </li>
            <li style={{ marginBottom: '12px' }}>
              <strong>Investigación Social:</strong> Estudiar patrones de comunicación y difusión de información
            </li>
            <li style={{ marginBottom: '12px' }}>
              <strong>Crisis Management:</strong> Identificar usuarios clave para comunicación en situaciones críticas
            </li>
          </ul>
        </div>
      </div>

      {/* Coste Estimado de Transacciones */}
      <div className="chart-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Database size={24} />
          <h2 className="chart-title">Coste Estimado de Transacciones con RapidAPI</h2>
        </div>

        <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#333' }}>
          <p style={{ marginBottom: '16px' }}>
            El sistema utiliza la API de Twitter a través de RapidAPI para obtener datos. A continuación se muestran
            los costes estimados para diferentes volúmenes de datos:
          </p>

          <div style={{
            background: '#f9f9f9',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '16px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
              Ejemplo: 1000 tweets principales
            </h3>

            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600 }}>Concepto</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 600 }}>Cantidad</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 600 }}>Coste</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 8px' }}>Tweets principales</td>
                  <td style={{ textAlign: 'right', padding: '12px 8px' }}>1000 tweets</td>
                  <td style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 600 }}>€0.1410</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 8px' }}>Conversaciones completas</td>
                  <td style={{ textAlign: 'right', padding: '12px 8px' }}>~20.000 replies (~20 por tweet)</td>
                  <td style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 600 }}>€2.8200</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 8px' }}>Perfiles de usuarios</td>
                  <td style={{ textAlign: 'right', padding: '12px 8px' }}>~300 perfiles</td>
                  <td style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 600 }}>€0.0508</td>
                </tr>
                <tr style={{ borderTop: '2px solid #ddd', background: '#f5f5f5' }}>
                  <td style={{ padding: '12px 8px', fontWeight: 600 }}>Total estimado</td>
                  <td style={{ textAlign: 'right', padding: '12px 8px' }}></td>
                  <td style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 700, fontSize: '16px', color: '#2563eb' }}>€3.0118</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            gap: '12px'
          }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
              <strong style={{ display: 'block', marginBottom: '8px' }}>Coste aumentado: Conversaciones completas activadas</strong>
              <p style={{ margin: 0, fontSize: '13px' }}>
                Las conversaciones completas pueden multiplicar el coste por <strong>21.0x</strong>. Para 1000 tweets
                principales, se estiman ~20.000 replies adicionales.
              </p>
            </div>
          </div>

          <div style={{
            background: '#f5f5f5',
            borderRadius: '6px',
            padding: '16px',
            fontSize: '13px',
            color: '#666'
          }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
              Precios base (USD → EUR aprox.)
            </h4>
            <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
              <li>Tweets: $0.15/1K (€0.141)</li>
              <li>Perfiles: $0.18/1K (€0.169)</li>
            </ul>
            <p style={{ marginTop: '12px', marginBottom: '4px' }}>
              <strong>Nota:</strong> Estimaciones basadas en uso típico:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '4px 0' }}>
              <li>Usuarios estimados: ~30% del total (autores + mencionados)</li>
              <li>Conversaciones: ~20 respuestas promedio por tweet (método batch optimizado)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Limitaciones y Consideraciones */}
      <div className="chart-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Zap size={24} />
          <h2 className="chart-title">Limitaciones y Consideraciones</h2>
        </div>

        <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#333' }}>
          <ul style={{ paddingLeft: '24px' }}>
            <li style={{ marginBottom: '12px' }}>
              <strong>Snapshot temporal:</strong> El análisis refleja un momento específico en el tiempo.
              Las redes sociales son dinámicas y cambian constantemente.
            </li>
            <li style={{ marginBottom: '12px' }}>
              <strong>Sesgo de muestreo:</strong> Los resultados dependen de qué datos fueron recolectados.
              Una muestra incompleta puede no representar la red completa.
            </li>
            <li style={{ marginBottom: '12px' }}>
              <strong>Contexto de interacciones:</strong> Las métricas no distinguen entre menciones positivas,
              negativas o neutrales sin análisis de sentimiento adicional.
            </li>
            <li style={{ marginBottom: '12px' }}>
              <strong>Bots y cuentas automatizadas:</strong> Pueden distorsionar las métricas si no son filtrados previamente.
            </li>
            <li style={{ marginBottom: '12px' }}>
              <strong>Escalabilidad:</strong> Para grafos muy grandes (&gt;10,000 nodos), la visualización puede ser lenta.
              Se recomienda filtrar o usar exportación para análisis externo.
            </li>
          </ul>
        </div>
      </div>

      {/* Referencias */}
      <div className="chart-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Database size={24} />
          <h2 className="chart-title">Referencias Bibliográficas</h2>
        </div>

        <div style={{ fontSize: '13px', lineHeight: '1.8', color: '#333' }}>
          <ol style={{ paddingLeft: '24px' }}>
            <li style={{ marginBottom: '12px' }}>
              Newman, M. E. (2010). <em>Networks: An Introduction</em>. Oxford University Press.
            </li>
            <li style={{ marginBottom: '12px' }}>
              Wasserman, S., & Faust, K. (1994). <em>Social Network Analysis: Methods and Applications</em>.
              Cambridge University Press.
            </li>
            <li style={{ marginBottom: '12px' }}>
              Barabási, A. L. (2016). <em>Network Science</em>. Cambridge University Press.
            </li>
            <li style={{ marginBottom: '12px' }}>
              Page, L., Brin, S., Motwani, R., & Winograd, T. (1999).
              "The PageRank Citation Ranking: Bringing Order to the Web". Stanford InfoLab Technical Report.
            </li>
            <li style={{ marginBottom: '12px' }}>
              Freeman, L. C. (1977). "A Set of Measures of Centrality Based on Betweenness".
              <em>Sociometry</em>, 40(1), 35-41.
            </li>
            <li style={{ marginBottom: '12px' }}>
              Fruchterman, T. M., & Reingold, E. M. (1991).
              "Graph drawing by force-directed placement".
              <em>Software: Practice and Experience</em>, 21(11), 1129-1164.
            </li>
            <li style={{ marginBottom: '12px' }}>
              Borgatti, S. P., Everett, M. G., & Johnson, J. C. (2018).
              <em>Analyzing Social Networks</em>. SAGE Publications.
            </li>
            <li style={{ marginBottom: '12px' }}>
              Easley, D., & Kleinberg, J. (2010).
              <em>Networks, Crowds, and Markets: Reasoning About a Highly Connected World</em>.
              Cambridge University Press.
            </li>
          </ol>
        </div>
      </div>

      {/* Contacto */}
      <div style={{
        background: '#f5f5f5',
        border: '2px solid #ddd',
        borderRadius: '8px',
        padding: '24px',
        fontSize: '14px',
        lineHeight: '1.6',
        textAlign: 'center'
      }}>
        <strong style={{ fontSize: '16px' }}>¿Necesitas ayuda adicional?</strong>
        <p style={{ marginTop: '12px', marginBottom: '20px', color: '#666' }}>
          Para soporte técnico, reportar bugs o sugerencias de mejora
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <a
            href="https://github.com/686f6c61/x-twitter-community-analysis"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#000',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#000'}
          >
            <Github size={18} />
            <span>GitHub</span>
          </a>
          <a
            href="https://x.com/hex686f6c61"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#000',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#000'}
          >
            <Twitter size={18} />
            <span>Twitter/X</span>
          </a>
        </div>
      </div>
    </div>
  )
}

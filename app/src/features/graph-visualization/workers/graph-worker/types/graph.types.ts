/**
 * Tipos para nodos, aristas y grafos
 */

export interface Node {
  id: string;
  label?: string;
  community?: number;
  degree_centrality?: number;
  betweenness_centrality?: number;
  closeness_centrality?: number;
  clustering?: number;
  eigenvector_centrality?: number;
  pagerank?: number;
  kcore?: number;
  core_number?: number;
  influencer_score?: number;
  bot_score?: number;
  tweets?: number;
  total_likes?: number;
  total_retweets?: number;
  follower_count?: number;
  engagement?: number;
  engagement_rate?: number;
  name?: string;
  // Propiedades adicionales de usuario enriquecido
  followers?: number;
  following?: number;
  following_count?: number;
  verifiedType?: string;
  isBlueVerified?: boolean;
  is_blue_verified?: boolean;
  verified_type?: string;
  isAutomated?: boolean;
  is_automated?: boolean;
  automatedBy?: string | null;
  automated_by?: string | null;
  location?: string;
  description?: string;
  createdAt?: string;
  account_created_at?: string;
  statusesCount?: number;
  statuses_count?: number;
  // Propiedades de conexiones y hashtags
  top_connections?: Array<{ user: string; weight: number }>;
  top_hashtags?: Array<{ hashtag: string; count: number }>;
  top_tweet?: any;
  // Propiedades de disponibilidad
  unavailable?: boolean;
  unavailable_reason?: string | null;
}

export interface Edge {
  source: string;
  target: string;
  weight?: number;
}

export interface Community {
  id: number;
  nodes: string[];
  size: number;
  label?: string;
  density?: number;
  internal_edges?: number;
  external_edges?: number;
}

export interface NetworkMotifs {
  triangles: number;
  stars: number;
  chains: number;
  cohesion: number;
  trianglesList?: any[];
  starsList?: any[];
  chainsList?: any[];
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
  communities?: Community[];
  modularity?: number;
  assortativity?: number;
  network_stats?: NetworkStats;
}

export interface NetworkStats {
  num_communities?: number;
  modularity?: number;
  assortativity?: number;
  motifs?: NetworkMotifs;
  avg_clustering?: number;
  echo_chambers?: EchoChamber[];
}

export interface EchoChamber {
  community_id: number;
  size: number;
  density: number;
  internal_edges: number;
  external_edges: number;
  isolation_score: number;
  sentiment_homogeneity: number;
  avg_sentiment: number;
  top_users: string[];
}

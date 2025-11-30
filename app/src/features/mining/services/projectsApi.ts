import type {
  ProjectMetadata,
  ProjectStats,
  CreateProjectRequest,
  AddQueryToProjectRequest,
  ContinueProjectRequest,
} from '../../../types/project'

const API_BASE_URL = 'http://localhost:3001/api'

export interface CreateProjectResponse {
  project: ProjectMetadata
  jobId: string
  message: string
}

export interface AddQueryResponse {
  project: ProjectMetadata
  jobId: string
  message: string
}

export interface ContinueProjectResponse {
  project: ProjectMetadata
  jobs: Array<{ query: string; jobId: string }>
  message: string
}

export const projectsApi = {
  async listProjects(): Promise<ProjectMetadata[]> {
    const response = await fetch(`${API_BASE_URL}/projects`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to list projects')
    return data.projects
  },

  async getProject(projectId: string): Promise<{ project: ProjectMetadata; stats: ProjectStats }> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to get project')
    return data
  },

  async createProject(request: CreateProjectRequest): Promise<CreateProjectResponse> {
    const response = await fetch(`${API_BASE_URL}/projects/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to create project')
    return data
  },

  async addQuery(projectId: string, request: AddQueryToProjectRequest): Promise<AddQueryResponse> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/add-query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to add query')
    return data
  },

  async continueProject(projectId: string, request: ContinueProjectRequest): Promise<ContinueProjectResponse> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/continue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to continue project')
    return data
  },

  async updateStatus(
    projectId: string,
    status: 'active' | 'paused' | 'completed'
  ): Promise<{ project: ProjectMetadata }> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to update status')
    return data
  },

  async deleteProject(projectId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: 'DELETE',
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to delete project')
  },

  async getStats(projectId: string): Promise<ProjectStats> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/stats`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to get stats')
    return data.stats
  },

  async removeQuery(projectId: string, query: string): Promise<{ project: ProjectMetadata; message: string }> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/remove-query`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to remove query')
    return data
  },
}

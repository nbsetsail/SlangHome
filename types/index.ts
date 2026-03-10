// Type definitions for the application

export interface EvolutionItem {
  id: number
  slang_id: number
  period: string
  phase: string
  explanation: string
  example: string
  origin: string
  story: string
  seq: number
  created_at: string
  updated_at: string
}

export interface CommentItem {
  id: number
  slang_id: number
  parent_id: number | null
  user_id: number
  content: string
  likes: number
  created_at: string
  username?: string
}

export interface SlangHighlighted {
  phrase?: string
  explanation?: string
  example?: string
  evolution_periods?: string
  evolution_phases?: string
  evolution_explanations?: string
  evolution_examples?: string
  evolution_origins?: string
  evolution_stories?: string
}

export interface SlangItem {
  id: number
  phrase: string
  explanation: string
  example: string
  origin: string
  has_evolution: boolean
  evolution?: EvolutionItem[]
  views: number
  likes: number
  comments_count: number
  favorites: number
  shares: number
  heat: number
  categories: string
  tags: string
  user_id?: string
  created_at: string
  highlighted?: SlangHighlighted
}

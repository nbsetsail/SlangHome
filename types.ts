export interface EvolutionItem {
  id?: number
  slang_id?: number
  period: string
  phase: string
  explanation: string
  example?: string
  origin?: string
  story?: string
  seq?: number
}

export interface CommentItem {
  id: number
  slang_id: number
  parent_id?: number | null
  user_id: number
  content: string
  likes: number
  created_at: string
  username?: string
}

export interface SlangItem {
  id: number
  phrase: string
  explanation: string
  example?: string
  origin?: string
  has_evolution: boolean
  evolution?: EvolutionItem[]
  views: number
  likes: number
  comments_count: number
  favorites: number
  shares: number
  heat: number
  categories?: string
  tags?: string
  user_id?: number
  created_at: string
  updated_at?: string
  isLiked?: boolean
  isFavorited?: boolean
}

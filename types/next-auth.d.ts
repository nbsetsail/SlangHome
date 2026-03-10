import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface User {
    role: string
    username?: string
    avatar?: string
    showRank?: boolean
    showAchievement?: boolean
    equippedAchievement?: string | null
    rankName?: string | null
    rankLevel?: number | null
    achievementType?: string | null
    achievementValue?: number | null
    managed_locales?: string[]
  }

  interface Session {
    user: {
      id: string
      name: string
      username?: string
      email: string
      role: string
      provider?: string
      avatar?: string
      showRank?: boolean
      showAchievement?: boolean
      equippedAchievement?: string | null
      rankName?: string | null
      rankLevel?: number | null
      achievementType?: string | null
      achievementValue?: number | null
      managed_locales?: string[]
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    id: string
    name: string
    username?: string
    provider?: string
    avatar?: string
    showRank?: boolean
    showAchievement?: boolean
    equippedAchievement?: string | null
    rankName?: string | null
    rankLevel?: number | null
    achievementType?: string | null
    achievementValue?: number | null
  }
}

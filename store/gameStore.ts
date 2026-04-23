import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export type CourtPlayer = {
  id: string
  name: string
  jerseyNumber: number | null
  position: number // 1–6
}

export type StatKey = 'kills' | 'digs' | 'aces' | 'blocks' | 'errors'

export type PlayerStat = {
  playerId: string
  kills: number
  digs: number
  aces: number
  blocks: number
  errors: number
}

export type GamePhase = 'idle' | 'setup' | 'playing'

type GameState = {
  phase: GamePhase
  gameId: string | null
  shareToken: string | null
  homeScore: number
  awayScore: number
  setNumber: number
  courtPlayers: CourtPlayer[]
  selectedPlayerId: string | null
  stats: Record<string, PlayerStat>

  startSetup: () => void
  initGame: (gameId: string, shareToken: string, players: CourtPlayer[]) => void
  incrementHome: () => void
  decrementHome: () => void
  incrementAway: () => void
  decrementAway: () => void
  rotateForward: () => void
  rotateBackward: () => void
  selectPlayer: (id: string | null) => void
  recordStat: (playerId: string, stat: StatKey) => void
  endSet: () => Promise<void>
  endGame: () => void
}

// Rotation clockwise: 1→2→3→4→5→6→1
const rotate = (players: CourtPlayer[], dir: 'fwd' | 'bwd'): CourtPlayer[] =>
  players.map((p) => ({
    ...p,
    position: dir === 'fwd'
      ? p.position === 6 ? 1 : p.position + 1
      : p.position === 1 ? 6 : p.position - 1,
  }))

const blankStat = (playerId: string): PlayerStat => ({
  playerId, kills: 0, digs: 0, aces: 0, blocks: 0, errors: 0,
})

// Push score to Supabase so the live page sees it in real time
let syncTimer: ReturnType<typeof setTimeout> | null = null
const syncScore = (gameId: string, home: number, away: number, set: number) => {
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    supabase.from('games')
      .update({ home_score: home, away_score: away, set_number: set })
      .eq('id', gameId)
      .then(() => {}) // fire-and-forget
  }, 300)
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'idle',
  gameId: null,
  shareToken: null,
  homeScore: 0,
  awayScore: 0,
  setNumber: 1,
  courtPlayers: [],
  selectedPlayerId: null,
  stats: {},

  startSetup: () => set({ phase: 'setup' }),

  initGame: (gameId, shareToken, players) =>
    set({ phase: 'playing', gameId, shareToken, courtPlayers: players }),

  incrementHome: () => {
    set((s) => {
      const next = s.homeScore + 1
      if (s.gameId) syncScore(s.gameId, next, s.awayScore, s.setNumber)
      return { homeScore: next }
    })
  },
  decrementHome: () => {
    set((s) => {
      const next = Math.max(0, s.homeScore - 1)
      if (s.gameId) syncScore(s.gameId, next, s.awayScore, s.setNumber)
      return { homeScore: next }
    })
  },
  incrementAway: () => {
    set((s) => {
      const next = s.awayScore + 1
      if (s.gameId) syncScore(s.gameId, s.homeScore, next, s.setNumber)
      return { awayScore: next }
    })
  },
  decrementAway: () => {
    set((s) => {
      const next = Math.max(0, s.awayScore - 1)
      if (s.gameId) syncScore(s.gameId, s.homeScore, next, s.setNumber)
      return { awayScore: next }
    })
  },

  rotateForward: () => set((s) => ({ courtPlayers: rotate(s.courtPlayers, 'fwd') })),
  rotateBackward: () => set((s) => ({ courtPlayers: rotate(s.courtPlayers, 'bwd') })),

  selectPlayer: (id) =>
    set((s) => ({ selectedPlayerId: s.selectedPlayerId === id ? null : id })),

  recordStat: (playerId, stat) =>
    set((s) => {
      const cur = s.stats[playerId] ?? blankStat(playerId)
      return { stats: { ...s.stats, [playerId]: { ...cur, [stat]: cur[stat] + 1 } } }
    }),

  endSet: async () => {
    const { gameId, setNumber, homeScore, awayScore, stats, courtPlayers } = get()
    if (!gameId) return

    await supabase.from('games')
      .update({ home_score: homeScore, away_score: awayScore, set_number: setNumber })
      .eq('id', gameId)

    const rows = courtPlayers.map((p) => {
      const s = stats[p.id] ?? blankStat(p.id)
      return { game_id: gameId, player_id: p.id, set_number: setNumber, ...s }
    })
    if (rows.length) {
      await supabase.from('player_stats')
        .upsert(rows, { onConflict: 'game_id,player_id,set_number' })
    }

    set((s) => ({
      setNumber: s.setNumber + 1,
      homeScore: 0,
      awayScore: 0,
      stats: {},
      selectedPlayerId: null,
    }))
  },

  endGame: () => set({
    phase: 'idle',
    gameId: null, shareToken: null,
    homeScore: 0, awayScore: 0, setNumber: 1,
    courtPlayers: [], selectedPlayerId: null, stats: {},
  }),
}))

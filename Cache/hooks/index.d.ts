declare module 'claude-code' {
  interface PluginState {
    'cache-clock': {
      lastAt: number | null
      tick: number
      warnedFor: number | null
    }
  }
}
export {}

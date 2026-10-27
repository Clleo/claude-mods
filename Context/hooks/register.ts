import type { Register } from 'claude-code'

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const { context } = await $.session.usage()
    showContext($, context)

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const { context } = await $.session.usage()
    showContext($, context)

    return next(e)
  })
}

const showContext = (
  $: { ui: { status: (text: string | undefined) => void } },
  context: { percent?: number; tokens?: number; window: number },
) => {
  if (context.percent === undefined) {
    $.ui.status('—')
    return
  }

  const tokens = Math.round((context.tokens ?? 0) / 1000)
  const window = Math.round(context.window / 1000)

  $.ui.status(`${context.percent}%, ${tokens}k / ${window}k ·`)
}

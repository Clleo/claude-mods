import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import { fmtTokens, minLeft, msLeft, shouldWarn, WARN_MIN } from './lib'

const PANE = 'cache'
const lastAt = atom({ plugin: 'Cache', key: 'lastAt' } as const, null)
const tick = atom({ plugin: 'Cache', key: 'tick' } as const, 0)
const warnedFor = atom({ plugin: 'Cache', key: 'warnedFor' } as const, null)

// Status line text: "Cache ● 42m · 118k tok". ◐ under 5 min, ○ once cold.
// Small state symbols, no color: ● fresh, ◐ under 5 min, ○ cold.
const dot = (ms: number): string => (ms <= 0 ? '○' : ms <= WARN_MIN * 60_000 ? '◐' : '●')

const label = (ms: number | null, tokens: number | undefined): string => {
  if (ms === null) {
    return `· —, ${fmtTokens(tokens)} tok ·`
  }
  const time = ms <= 0 ? 'cold' : `${minLeft(ms)}m`
  return `${dot(ms)} ${time}, ${fmtTokens(tokens)} tok ·`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'cache',
      description: 'Show prompt cache timer and context size',
    })

    $.clock.every(15_000, async () => {
      const now = await $.clock.now()
      const last = await read($, lastAt)
      const ms = msLeft(last, now)

      if (shouldWarn(ms, await read($, warnedFor), last)) {
        await update($, warnedFor, () => last)
        $.ui.toast(
          `Prompt cache cools in ~${minLeft(ms ?? 0)} min. Send a message or /compact before it does.`,
          { timeoutMs: 15_000 },
        )
      }

      const { context } = await $.session.usage()
      $.ui.status(label(ms, context.tokens))
      await update($, tick, n => n + 1)
    })

    return next(e)
  })

  // Every finished turn is a fresh API response, which refreshes the cache.
  on('turn.complete', async ($, e, next) => {
    const now = await $.clock.now()
    await update($, lastAt, () => now)
    const { context } = await $.session.usage()
    $.ui.status(label(msLeft(now, now), context.tokens))
    return next(e)
  })

  on('session.compact', async ($, e, next) => {
    const ran = await next(e)
    const now = await $.clock.now()
    await update($, lastAt, () => now)
    const { context } = await $.session.usage()
    $.ui.status(label(msLeft(now, now), context.tokens))
    return ran
  }).catch(($, e, next) => next(e))

  on('command.run', { command: 'cache' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Cache' })
    return { text: 'Cache pane opened.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    await read($, tick)
    const last = await read($, lastAt)
    const now = await $.clock.now()
    const ms = msLeft(last, now)
    const { context } = await $.session.usage()

    const detail =
      ms === null
        ? 'No reply yet this session.'
        : ms <= 0
          ? 'Cache cold: next message re-reads full context at full price.'
          : `Expires in ${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s. Reminder ${WARN_MIN} min before.`

    return (
      <Box flexDirection="column">
        <Text>{label(ms, context.tokens)}</Text>
        <Text dimColor>
          Context {fmtTokens(context.tokens)} / {fmtTokens(context.window)} ({context.percent ?? '?'}%)
        </Text>
        <Text dimColor>{detail}</Text>
        <Button
          key="compact"
          label="Compact"
          variant="primary"
          onPress={async () => {
            $.ui.toast('Compacting…')
            await $.session.compact()
          }}
        />
      </Box>
    )
  })
}

import { type ClipboardEvent, type KeyboardEvent } from 'react'
import { ensureIndentedBody, stripIndentForClipboard } from './text'
import { INDENT } from './constants'
import type { SelectionRange } from './types'

type Options = {
  chapterBody: string
  setChapterBody: (value: string | ((prev: string) => string)) => void
  bodySelection: SelectionRange
  setBodySelection: (range: SelectionRange) => void
  setBodyFocused: (v: boolean) => void
}

export function useBodyEditing({
  chapterBody,
  setChapterBody,
  bodySelection,
  setBodySelection,
  setBodyFocused,
}: Options) {
  function handleBodyKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const target = e.target as HTMLTextAreaElement
    if (!target) return
    const start = target.selectionStart
    const end = target.selectionEnd
    if (start !== end) return

    const lineStart = chapterBody.lastIndexOf('\n', start - 1) + 1
    const indentEnd = lineStart + INDENT.length

    if (e.key === 'Backspace' && start <= indentEnd && lineStart > 0) {
      e.preventDefault()
      const merged = `${chapterBody.slice(0, lineStart - 1)}${chapterBody.slice(indentEnd)}`
      setChapterBody(merged)
      window.requestAnimationFrame(() => {
        const nextPos = lineStart - 1
        target.selectionStart = nextPos
        target.selectionEnd = nextPos
      })
      return
    }

    if (e.key === 'Backspace' && start <= indentEnd) {
      e.preventDefault()
      return
    }

    if (e.key === 'Delete' && start < indentEnd) {
      e.preventDefault()
      return
    }

    if (e.key !== 'Enter') return
    e.preventDefault()
    const next = `${chapterBody.slice(0, start)}\n${INDENT}${chapterBody.slice(end)}`
    setChapterBody(next)
    window.requestAnimationFrame(() => {
      target.selectionStart = start + 1 + INDENT.length
      target.selectionEnd = start + 1 + INDENT.length
    })
  }

  function handleBodyPaste(e: ClipboardEvent<HTMLDivElement>) {
    const target = e.target as HTMLTextAreaElement
    if (!target) return
    e.preventDefault()

    const raw = e.clipboardData.getData('text')
    const normalizedPaste = raw.replace(/\r\n/g, '\n')

    let start = target.selectionStart
    let end = target.selectionEnd

    const lineStart = chapterBody.lastIndexOf('\n', start - 1) + 1
    const indentEnd = lineStart + INDENT.length

    if (start < indentEnd) start = indentEnd
    if (end < indentEnd) end = indentEnd

    const next = `${chapterBody.slice(0, start)}${normalizedPaste}${chapterBody.slice(end)}`
    setChapterBody(next)

    window.requestAnimationFrame(() => {
      const pos = start + normalizedPaste.length
      target.selectionStart = pos
      target.selectionEnd = pos
      setBodySelection({ start: pos, end: pos })
    })
  }

  function handleBodyCopy(e: ClipboardEvent<HTMLDivElement>) {
    const target = e.target as HTMLTextAreaElement
    if (!target) return
    const selected = target.value.slice(target.selectionStart, target.selectionEnd)
    if (!selected) return
    e.preventDefault()
    e.clipboardData.setData('text/plain', stripIndentForClipboard(selected))
  }

  function handleBodyCut(e: ClipboardEvent<HTMLDivElement>) {
    const target = e.target as HTMLTextAreaElement
    if (!target) return
    const start = target.selectionStart
    const end = target.selectionEnd
    if (start === end) return

    e.preventDefault()
    const selected = target.value.slice(start, end)
    e.clipboardData.setData('text/plain', stripIndentForClipboard(selected))

    const next = ensureIndentedBody(`${chapterBody.slice(0, start)}${chapterBody.slice(end)}`)
    setChapterBody(next)

    window.requestAnimationFrame(() => {
      const pos = Math.min(start, next.length)
      target.selectionStart = pos
      target.selectionEnd = pos
      setBodySelection({ start: pos, end: pos })
    })
  }

  function handleBodySelect(start: number, end: number) {
    const safeStart = Math.max(0, Math.min(start, chapterBody.length))
    const safeEnd = Math.max(0, Math.min(end, chapterBody.length))
    setBodySelection({ start: safeStart, end: safeEnd })
  }

  function getSelectedBodyText() {
    if (bodySelection.end <= bodySelection.start) return ''
    return chapterBody.slice(bodySelection.start, bodySelection.end).trim()
  }

  function handleBodyFocus() {
    setBodyFocused(true)
  }

  function handleBodyBlur() {
    setBodyFocused(false)
    setBodySelection({ start: 0, end: 0 })
  }

  return {
    handleBodyKeyDown,
    handleBodyPaste,
    handleBodyCopy,
    handleBodyCut,
    handleBodySelect,
    getSelectedBodyText,
    handleBodyFocus,
    handleBodyBlur,
  }
}

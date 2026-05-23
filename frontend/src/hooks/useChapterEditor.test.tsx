import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useChapterEditor } from './useChapterEditor'
import { createChapter, generateChapterStream, updateChapter } from '../api/chapters'
import { APIError } from '../api/http'

vi.mock('../api/chapters', () => ({
  createChapter: vi.fn(),
  updateChapter: vi.fn(),
  generateChapterStream: vi.fn(),
}))

const mockedCreateChapter = vi.mocked(createChapter)
const mockedUpdateChapter = vi.mocked(updateChapter)
const mockedGenerateChapterStream = vi.mocked(generateChapterStream)

function createParams(): any {
  return {
    token: 'token',
    novelId: 3,
    initialChapter: null,
    defaultChapterNumber: 1,
    volumes: [{ id: 11, novel_id: 3, volume_number: 1, title: '第一卷', created_at: '', updated_at: '' }],
    characters: [{
      id: 21,
      novel_id: 3,
      name: '李元',
      aliases: '',
      role: '主角',
      personality: '',
      realm_or_ability: '',
      goal: '',
      relationships: '',
      speech_style: '',
      first_appearance_chapter: 1,
      last_appearance_chapter: 1,
      memo: '',
      importance_level: 9,
      created_at: '',
      updated_at: '',
    }],
    loreEntries: [{
      id: 31,
      novel_id: 3,
      category: 'artifact' as const,
      name: '天珠',
      description: '神秘法器',
      rules_or_limits: '',
      tags: '法器',
      character_ids: [21],
      created_at: '',
      updated_at: '',
    }],
    recentChapterCountDefault: 3,
    onNotifySuccess: vi.fn(),
    onNotifyError: vi.fn(),
    onSaved: vi.fn(async () => {}),
    onBack: vi.fn(),
  }
}

describe('useChapterEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
  })

  it('生成失败后应显示错误并允许重试', async () => {
    mockedGenerateChapterStream.mockRejectedValueOnce(new Error('生成失败'))
    const params = createParams()

    const { result } = renderHook(() => useChapterEditor(params))

    act(() => {
      result.current.setChapterInstruction('继续推进剧情')
    })

    await act(async () => {
      await result.current.handleGenerate()
    })

    await waitFor(() => {
      expect(result.current.localError).toBe('生成失败')
      expect(result.current.canRetryGenerate).toBe(true)
    })
  })

  it('ai output parse failed 应映射为可读提示', async () => {
    mockedGenerateChapterStream.mockRejectedValueOnce(new APIError('ai output parse failed, please retry', 502, 'AI_OUTPUT_INVALID'))
    const params = createParams()

    const { result } = renderHook(() => useChapterEditor(params))

    act(() => {
      result.current.setChapterInstruction('继续推进剧情')
    })

    await act(async () => {
      await result.current.handleGenerate()
    })

    await waitFor(() => {
      expect(result.current.localError).toContain('模型输出格式异常')
      expect(result.current.canRetryGenerate).toBe(true)
    })
  })

  it('保存失败不应保留生成重试状态', async () => {
    mockedGenerateChapterStream.mockRejectedValueOnce(new Error('生成失败'))
    mockedCreateChapter.mockRejectedValueOnce(new Error('保存失败'))
    const params = createParams()

    const { result } = renderHook(() => useChapterEditor(params))

    act(() => {
      result.current.setChapterInstruction('继续推进剧情')
    })

    await act(async () => {
      await result.current.handleGenerate()
    })

    expect(result.current.canRetryGenerate).toBe(true)

    await act(async () => {
      await result.current.handleSave()
    })

    await waitFor(() => {
      expect(result.current.localError).toBe('保存失败')
      expect(result.current.canRetryGenerate).toBe(false)
    })
  })

  it('生成请求应带上 lore_entry_ids 且成功后重试状态为 false', async () => {
    mockedGenerateChapterStream.mockResolvedValueOnce({
      outline: '大纲',
      body: '正文',
      summary: '总结',
    })
    const params = createParams()

    const { result } = renderHook(() => useChapterEditor(params))

    act(() => {
      result.current.setChapterInstruction('继续推进剧情')
      result.current.setSelectedCharacterIDs([21])
      result.current.setSelectedLoreEntryIDs([31])
      result.current.setTargetWordMin(0)
      result.current.setTargetWordMax(0)
    })

    await act(async () => {
      await result.current.handleGenerate()
    })

    await waitFor(() => {
      expect(mockedGenerateChapterStream).toHaveBeenCalledTimes(1)
      expect(mockedGenerateChapterStream.mock.calls[0][2]).toMatchObject({
        character_ids: [21],
        lore_entry_ids: [31],
        target_word_min: 0,
        target_word_max: 0,
        avoid_translation_tone: true,
        avoid_modern_slang: true,
        keep_pov_consistent: true,
        keep_tense_consistent: true,
        recent_chapter_count: 3,
      })
      expect(result.current.canRetryGenerate).toBe(false)
      expect(result.current.localSuccess).toContain('AI 生成完成')
    })
  })

  it('编辑模式保存时应调用 updateChapter', async () => {
    mockedUpdateChapter.mockResolvedValueOnce({
      chapter: {
        id: 1,
        novel_id: 3,
        volume_id: 11,
        chapter_number: 1,
        title: '第1章',
        body: '正文',
        word_count: 2,
        generation_instruction: '',
        outline: '',
        summary: '',
        status: 'draft',
        created_at: '',
        updated_at: '',
      },
    })

    const params = createParams()
    params.initialChapter = {
      id: 1,
      novel_id: 3,
      volume_id: 11,
      chapter_number: 1,
      title: '第1章',
      body: '　　正文',
      word_count: 2,
      generation_instruction: '',
      outline: '',
      summary: '',
      status: 'draft',
      created_at: '',
      updated_at: '',
    }

    const { result } = renderHook(() => useChapterEditor(params))

    await act(async () => {
      await result.current.handleSave()
    })

    expect(mockedUpdateChapter).toHaveBeenCalledTimes(1)
  })

  it('应仅保留最近 3 条生成历史', async () => {
    mockedGenerateChapterStream
      .mockResolvedValueOnce({ outline: 'o1', body: 'b1', summary: 's1', usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } })
      .mockResolvedValueOnce({ outline: 'o2', body: 'b2', summary: 's2', usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } })
      .mockResolvedValueOnce({ outline: 'o3', body: 'b3', summary: 's3', usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } })
      .mockResolvedValueOnce({ outline: 'o4', body: 'b4', summary: 's4', usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } })

    const params = createParams()
    const { result } = renderHook(() => useChapterEditor(params))

    act(() => {
      result.current.setChapterInstruction('继续推进剧情')
      result.current.setTargetWordMin(0)
      result.current.setTargetWordMax(0)
    })

    await act(async () => { await result.current.handleGenerate() })
    await act(async () => { await result.current.handleGenerate() })
    await act(async () => { await result.current.handleGenerate() })
    await act(async () => { await result.current.handleGenerate() })

    expect(result.current.generateHistory.length).toBe(3)
    expect(result.current.generateHistory[0].outline).toBe('o4')
    expect(result.current.generateHistory[2].outline).toBe('o2')
  })

  it('生成结果过短时应提示不完整并允许重试', async () => {
    mockedGenerateChapterStream.mockResolvedValueOnce({
      outline: '大纲',
      body: '太短',
      summary: '总结',
    })
    const params = createParams()
    const { result } = renderHook(() => useChapterEditor(params))

    act(() => {
      result.current.setChapterInstruction('继续推进剧情')
      result.current.setTargetWordMin(2000)
      result.current.setTargetWordMax(2300)
    })

    await act(async () => {
      await result.current.handleGenerate()
    })

    await waitFor(() => {
      expect(result.current.localError).toContain('生成结果疑似不完整')
      expect(result.current.canRetryGenerate).toBe(true)
      expect(result.current.generateHistory.length).toBe(0)
    })
  })

  it('应可套用生成模板并写入参数', async () => {
    const params = createParams()
    const { result } = renderHook(() => useChapterEditor(params))

    act(() => {
      result.current.applyTemplate('battle')
    })

    expect(result.current.targetWordMin).toBe(1800)
    expect(result.current.targetWordMax).toBe(2600)
    expect(result.current.recentChapterCount).toBe(3)
    expect(result.current.selectedTemplateId).toBe('battle')
    expect(result.current.chapterInstruction.length).toBeGreaterThan(0)
  })
})

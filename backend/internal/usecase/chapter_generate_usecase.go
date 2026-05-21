package usecase

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"strings"

	"novel-agent/backend/internal/domain"
	"novel-agent/backend/internal/service"
)

var ErrChapterGenerateInvalidOutput = errors.New("chapter generate invalid output")

type ChapterGenerateInput struct {
	VolumeID              int64
	ChapterNumber         int
	Title                 string
	GenerationInstruction string
	CharacterIDs          []int64
	LoreEntryIDs          []int64
	TargetWordMin         int
	TargetWordMax         int
	AvoidTranslationTone  bool
	AvoidModernSlang      bool
	KeepPovConsistent     bool
	KeepTenseConsistent   bool
	RecentChapterCount    int
}

type ChapterGenerateUsecase struct {
	novels         *NovelUsecase
	chapters       *ChapterUsecase
	characters     *CharacterUsecase
	loreEntries    *LoreEntryUsecase
	openai         service.OpenAIChapterGenerator
	gemini         service.GeminiChapterGenerator
	aiSettings     *UserAISettingUsecase
	fallbackOpenAI service.OpenAIConfig
	fallbackGemini service.GeminiConfig
}

func NewChapterGenerateUsecase(
	novels *NovelUsecase,
	chapters *ChapterUsecase,
	characters *CharacterUsecase,
	loreEntries *LoreEntryUsecase,
	openai service.OpenAIChapterGenerator,
	gemini service.GeminiChapterGenerator,
	aiSettings *UserAISettingUsecase,
	fallbackOpenAI service.OpenAIConfig,
	fallbackGemini service.GeminiConfig,
) *ChapterGenerateUsecase {
	return &ChapterGenerateUsecase{
		novels:         novels,
		chapters:       chapters,
		characters:     characters,
		loreEntries:    loreEntries,
		openai:         openai,
		gemini:         gemini,
		aiSettings:     aiSettings,
		fallbackOpenAI: fallbackOpenAI,
		fallbackGemini: fallbackGemini,
	}
}

func (u *ChapterGenerateUsecase) Generate(ctx context.Context, userID, novelID int64, in ChapterGenerateInput) (*service.ChapterGenerateResult, error) {
	if in.VolumeID <= 0 {
		return nil, errors.New("volume_id is required")
	}
	if in.ChapterNumber <= 0 {
		return nil, errors.New("chapter_number must be greater than 0")
	}
	in.GenerationInstruction = strings.TrimSpace(in.GenerationInstruction)
	if in.GenerationInstruction == "" {
		return nil, errors.New("generation_instruction is required")
	}
	if in.TargetWordMin < 0 {
		return nil, errors.New("target_word_min must be greater than or equal to 0")
	}
	if in.TargetWordMax < 0 {
		return nil, errors.New("target_word_max must be greater than or equal to 0")
	}
	if in.TargetWordMin > 0 && in.TargetWordMax > 0 && in.TargetWordMin > in.TargetWordMax {
		return nil, errors.New("target_word_min must be less than or equal to target_word_max")
	}
	if in.TargetWordMin > 12000 || in.TargetWordMax > 12000 {
		return nil, errors.New("target word range is too large")
	}
	if in.RecentChapterCount < 0 {
		return nil, errors.New("recent_chapter_count must be greater than or equal to 0")
	}
	in.Title = strings.TrimSpace(in.Title)

	novel, err := u.novels.Get(ctx, novelID, userID)
	if err != nil {
		return nil, err
	}
	characters, err := u.characters.List(ctx, userID, novelID)
	if err != nil {
		return nil, err
	}
	characters, err = filterCharactersBySelectedIDs(characters, in.CharacterIDs)
	if err != nil {
		return nil, err
	}
	loreEntries, err := u.loreEntries.List(ctx, userID, novelID)
	if err != nil {
		return nil, err
	}
	loreEntries, err = filterLoreEntriesBySelectedIDs(loreEntries, in.LoreEntryIDs)
	if err != nil {
		return nil, err
	}
	chapters, err := u.chapters.List(ctx, userID, novelID)
	if err != nil {
		return nil, err
	}

	prompt := buildChapterGeneratePrompt(novel, characters, loreEntries, chapters, in)
	maxTokens := estimateMaxCompletionTokens(in.TargetWordMax)
	openAICfg := u.fallbackOpenAI
	openAICfg.MaxCompletionTokens = maxTokens
	geminiCfg := u.fallbackGemini
	geminiCfg.MaxOutputTokens = maxTokens
	if u.aiSettings != nil {
		resolved, err := u.aiSettings.ResolveEffectiveConfig(ctx, userID, u.fallbackOpenAI.APIKey, u.fallbackGemini.APIKey)
		if err != nil {
			return nil, err
		}
		if resolved.Provider == AIProviderGemini {
			geminiCfg = service.GeminiConfig{
				APIKey:          firstNonEmpty(resolved.APIKey, u.fallbackGemini.APIKey),
				BaseURL:         firstNonEmpty(resolved.BaseURL, u.fallbackGemini.BaseURL),
				Model:           firstNonEmpty(resolved.Model, u.fallbackGemini.Model),
				MaxOutputTokens: maxTokens,
			}
			out, err := u.gemini.GenerateChapterWithConfig(ctx, prompt, geminiCfg)
			if err != nil {
				if errors.Is(err, service.ErrGeminiInvalidOutput) {
					return nil, ErrChapterGenerateInvalidOutput
				}
				return nil, err
			}
			return out, nil
		}
		openAICfg = service.OpenAIConfig{
			APIKey:              firstNonEmpty(resolved.APIKey, u.fallbackOpenAI.APIKey),
			BaseURL:             firstNonEmpty(resolved.BaseURL, u.fallbackOpenAI.BaseURL),
			Model:               firstNonEmpty(resolved.Model, u.fallbackOpenAI.Model),
			MaxCompletionTokens: maxTokens,
		}
	}
	out, err := u.openai.GenerateChapterWithConfig(ctx, prompt, openAICfg)
	if err != nil {
		if errors.Is(err, service.ErrOpenAIInvalidOutput) {
			return nil, ErrChapterGenerateInvalidOutput
		}
		return nil, err
	}
	return out, nil
}

func firstNonEmpty(v, fallback string) string {
	if strings.TrimSpace(v) != "" {
		return strings.TrimSpace(v)
	}
	return strings.TrimSpace(fallback)
}

func buildChapterGeneratePrompt(
	novel *domain.Novel,
	characters []domain.Character,
	loreEntries []domain.LoreEntry,
	chapters []domain.Chapter,
	in ChapterGenerateInput,
) string {
	var b strings.Builder

	b.WriteString("请基于以下信息生成中文小说章节，并只返回 JSON：")
	b.WriteString("\n\n")
	b.WriteString("JSON 字段必须且只能包含：outline, body, summary。")
	b.WriteString("\n\n")

	b.WriteString("【小说设定】\n")
	b.WriteString(fmt.Sprintf("标题：%s\n", novel.Title))
	b.WriteString(fmt.Sprintf("类型：%s\n", novel.Genre))
	b.WriteString(fmt.Sprintf("语言：%s\n", novel.Language))
	b.WriteString(fmt.Sprintf("整体风格：%s\n", novel.StyleProfile))
	b.WriteString(fmt.Sprintf("世界观：%s\n", novel.Worldview))
	b.WriteString(fmt.Sprintf("修炼体系：%s\n", novel.PowerSystem))
	b.WriteString(fmt.Sprintf("主线：%s\n", novel.MainPlot))
	b.WriteString(fmt.Sprintf("写作规则：%s\n", novel.WritingRules))
	b.WriteString(fmt.Sprintf("禁止事项：%s\n", novel.ForbiddenRules))
	b.WriteString("\n")

	b.WriteString("【主要人物】\n")
	for _, c := range characters {
		b.WriteString(fmt.Sprintf("- %s（身份：%s；性格：%s；目标：%s；说话风格：%s）\n",
			c.Name, c.Role, c.Personality, c.Goal, c.SpeechStyle))
	}
	if len(characters) == 0 {
		b.WriteString("- 无\n")
	}
	b.WriteString("\n")

	b.WriteString("【本章相关设定】\n")
	for _, le := range loreEntries {
		b.WriteString(fmt.Sprintf("- [%s] %s：%s", le.Category, le.Name, le.Description))
		if strings.TrimSpace(le.RulesOrLimits) != "" {
			b.WriteString(fmt.Sprintf("（限制：%s）", strings.TrimSpace(le.RulesOrLimits)))
		}
		if strings.TrimSpace(le.Tags) != "" {
			b.WriteString(fmt.Sprintf("（标签：%s）", strings.TrimSpace(le.Tags)))
		}
		b.WriteString("\n")
	}
	if len(loreEntries) == 0 {
		b.WriteString("- 无\n")
	}
	b.WriteString("\n")

	b.WriteString("【最近章节总结】\n")
	recentCount := novel.RecentChapterCount
	if in.RecentChapterCount > 0 {
		recentCount = in.RecentChapterCount
	}
	recentSummaries := pickRecentSummaries(chapters, recentCount)
	if len(recentSummaries) == 0 {
		b.WriteString("- 无\n")
	} else {
		for _, s := range recentSummaries {
			b.WriteString("- ")
			b.WriteString(s)
			b.WriteString("\n")
		}
	}
	b.WriteString("\n")

	b.WriteString("【本次生成要求】\n")
	b.WriteString(fmt.Sprintf("分卷ID：%d\n", in.VolumeID))
	b.WriteString(fmt.Sprintf("章节号：%d\n", in.ChapterNumber))
	if in.Title != "" {
		b.WriteString(fmt.Sprintf("章节标题：%s\n", in.Title))
	}
	if in.TargetWordMin > 0 || in.TargetWordMax > 0 {
		min := in.TargetWordMin
		max := in.TargetWordMax
		if min <= 0 {
			min = max
		}
		if max <= 0 {
			max = min
		}
		b.WriteString(fmt.Sprintf("目标正文长度：%d-%d 字（不含空白字符）\n", min, max))
		b.WriteString("硬性长度要求：正文必须落在目标范围内；如超出上限必须自行压缩后输出。\n")
		b.WriteString("令牌分配要求：优先保证 body 完整性，outline 与 summary 需简洁。\n")
	}
	b.WriteString("风格硬性约束：\n")
	if in.AvoidTranslationTone {
		b.WriteString("- 禁止翻译腔、欧化句式、书面腔堆砌。\n")
	}
	if in.AvoidModernSlang {
		b.WriteString("- 禁止现代网络流行语与出戏表达。\n")
	}
	if in.KeepPovConsistent {
		b.WriteString("- 全章保持同一叙事视角，不要中途跳视角。\n")
	}
	if in.KeepTenseConsistent {
		b.WriteString("- 全章时态一致，不要混用过去时与现在时叙述。\n")
	}
	if !in.AvoidTranslationTone && !in.AvoidModernSlang && !in.KeepPovConsistent && !in.KeepTenseConsistent {
		b.WriteString("- 无（按既有设定与指令输出）。\n")
	}
	b.WriteString(fmt.Sprintf("章节指令：%s\n", in.GenerationInstruction))
	b.WriteString("\n")

	b.WriteString("输出规则：\n")
	b.WriteString("1) 只输出 JSON，不要输出 Markdown 代码块。\n")
	b.WriteString("2) body 必须是完整可读正文，不要返回段落数组。\n")
	b.WriteString("3) outline 与 summary 必须为字符串，不要返回对象。\n")
	b.WriteString("4) outline 控制在 6-10 条短句；summary 控制在 120-220 字。\n")
	b.WriteString("5) 若 token 不足，优先压缩 outline/summary，禁止截断 body。\n")
	return b.String()
}

func estimateMaxCompletionTokens(targetWordMax int) int {
	if targetWordMax <= 0 {
		return 0
	}
	// Keep large headroom for JSON structure + outline/summary overhead.
	estimated := targetWordMax*5 + 2000
	if estimated < 3000 {
		estimated = 3000
	}
	if estimated > 32000 {
		estimated = 32000
	}
	return estimated
}

func pickRecentSummaries(chapters []domain.Chapter, count int) []string {
	if count <= 0 {
		count = 3
	}
	filtered := make([]domain.Chapter, 0)
	for _, c := range chapters {
		s := strings.TrimSpace(c.Summary)
		if s != "" {
			filtered = append(filtered, c)
		}
	}
	sort.Slice(filtered, func(i, j int) bool {
		if filtered[i].ChapterNumber == filtered[j].ChapterNumber {
			return filtered[i].ID > filtered[j].ID
		}
		return filtered[i].ChapterNumber > filtered[j].ChapterNumber
	})
	if len(filtered) > count {
		filtered = filtered[:count]
	}
	out := make([]string, 0, len(filtered))
	for _, c := range filtered {
		out = append(out, fmt.Sprintf("第%d章：%s", c.ChapterNumber, strings.TrimSpace(c.Summary)))
	}
	return out
}

func filterCharactersBySelectedIDs(all []domain.Character, selectedIDs []int64) ([]domain.Character, error) {
	// Fallback mode: if no explicit selection, use major characters.
	if len(selectedIDs) == 0 {
		filtered := make([]domain.Character, 0)
		for _, c := range all {
			if c.ImportanceLevel >= 5 {
				filtered = append(filtered, c)
			}
		}
		return filtered, nil
	}

	selectedSet := make(map[int64]bool, len(selectedIDs))
	for _, id := range selectedIDs {
		if id <= 0 {
			return nil, errors.New("character_ids contains invalid id")
		}
		selectedSet[id] = true
	}

	filtered := make([]domain.Character, 0, len(selectedSet))
	for _, c := range all {
		if selectedSet[c.ID] {
			filtered = append(filtered, c)
		}
	}
	if len(filtered) != len(selectedSet) {
		return nil, errors.New("character_ids contains non-existing character")
	}
	sort.Slice(filtered, func(i, j int) bool { return filtered[i].ID < filtered[j].ID })
	return filtered, nil
}

func filterLoreEntriesBySelectedIDs(all []domain.LoreEntry, selectedIDs []int64) ([]domain.LoreEntry, error) {
	if len(selectedIDs) == 0 {
		return []domain.LoreEntry{}, nil
	}

	selectedSet := make(map[int64]bool, len(selectedIDs))
	for _, id := range selectedIDs {
		if id <= 0 {
			return nil, errors.New("lore_entry_ids contains invalid id")
		}
		selectedSet[id] = true
	}

	filtered := make([]domain.LoreEntry, 0, len(selectedSet))
	for _, e := range all {
		if selectedSet[e.ID] {
			filtered = append(filtered, e)
		}
	}
	if len(filtered) != len(selectedSet) {
		return nil, errors.New("lore_entry_ids contains non-existing lore entry")
	}
	sort.Slice(filtered, func(i, j int) bool { return filtered[i].ID < filtered[j].ID })
	return filtered, nil
}

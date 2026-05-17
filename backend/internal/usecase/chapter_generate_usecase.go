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
}

type ChapterGenerateUsecase struct {
	novels     *NovelUsecase
	chapters   *ChapterUsecase
	characters *CharacterUsecase
	generator  service.OpenAIChapterGenerator
}

func NewChapterGenerateUsecase(
	novels *NovelUsecase,
	chapters *ChapterUsecase,
	characters *CharacterUsecase,
	generator service.OpenAIChapterGenerator,
) *ChapterGenerateUsecase {
	return &ChapterGenerateUsecase{
		novels:     novels,
		chapters:   chapters,
		characters: characters,
		generator:  generator,
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
	in.Title = strings.TrimSpace(in.Title)

	novel, err := u.novels.Get(ctx, novelID, userID)
	if err != nil {
		return nil, err
	}
	characters, err := u.characters.List(ctx, userID, novelID)
	if err != nil {
		return nil, err
	}
	chapters, err := u.chapters.List(ctx, userID, novelID)
	if err != nil {
		return nil, err
	}

	prompt := buildChapterGeneratePrompt(novel, characters, chapters, in)
	out, err := u.generator.GenerateChapter(ctx, prompt)
	if err != nil {
		if errors.Is(err, service.ErrOpenAIInvalidOutput) {
			return nil, ErrChapterGenerateInvalidOutput
		}
		return nil, err
	}
	return out, nil
}

func buildChapterGeneratePrompt(
	novel *domain.Novel,
	characters []domain.Character,
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
		if c.ImportanceLevel < 5 {
			continue
		}
		b.WriteString(fmt.Sprintf("- %s（身份：%s；性格：%s；目标：%s；说话风格：%s）\n",
			c.Name, c.Role, c.Personality, c.Goal, c.SpeechStyle))
	}
	b.WriteString("\n")

	b.WriteString("【最近章节总结】\n")
	recentSummaries := pickRecentSummaries(chapters, novel.RecentChapterCount)
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
	b.WriteString(fmt.Sprintf("章节指令：%s\n", in.GenerationInstruction))
	b.WriteString("\n")

	b.WriteString("请严格输出 JSON，不要输出 Markdown 代码块。")
	return b.String()
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

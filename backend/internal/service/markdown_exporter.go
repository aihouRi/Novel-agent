package service

import (
	"fmt"
	"sort"
	"strings"

	"novel-agent/backend/internal/domain"
)

type MarkdownExporter struct{}

func NewMarkdownExporter() *MarkdownExporter {
	return &MarkdownExporter{}
}

type ExportOptions struct {
	IncludeBody    bool
	IncludeSummary bool
	IncludeOutline bool
}

func (e *MarkdownExporter) BuildNovelMarkdown(novel *domain.Novel, volumes []domain.Volume, chapters []domain.Chapter, opts ExportOptions) string {
	var b strings.Builder

	title := strings.TrimSpace(novel.Title)
	if title == "" {
		title = "Untitled Novel"
	}
	b.WriteString("# ")
	b.WriteString(title)
	b.WriteString("\n\n")

	byVolume := make(map[int64][]domain.Chapter, len(volumes))
	for _, c := range chapters {
		byVolume[c.VolumeID] = append(byVolume[c.VolumeID], c)
	}

	for _, v := range volumes {
		b.WriteString("## ")
		b.WriteString(fmt.Sprintf("第%d卷：%s", v.VolumeNumber, strings.TrimSpace(v.Title)))
		b.WriteString("\n\n")

		volumeChapters := byVolume[v.ID]
		sort.Slice(volumeChapters, func(i, j int) bool {
			if volumeChapters[i].ChapterNumber == volumeChapters[j].ChapterNumber {
				return volumeChapters[i].ID < volumeChapters[j].ID
			}
			return volumeChapters[i].ChapterNumber < volumeChapters[j].ChapterNumber
		})

		for _, c := range volumeChapters {
			chTitle := strings.TrimSpace(c.Title)
			if chTitle == "" {
				chTitle = "Untitled"
			}
			b.WriteString("### ")
			b.WriteString(fmt.Sprintf("第%d章 %s", c.ChapterNumber, chTitle))
			b.WriteString("\n\n")

			if opts.IncludeBody {
				b.WriteString(strings.TrimSpace(c.Body))
				b.WriteString("\n\n")
			}
			if opts.IncludeSummary {
				b.WriteString("**章节总结**\n\n")
				b.WriteString(strings.TrimSpace(c.Summary))
				b.WriteString("\n\n")
			}
			if opts.IncludeOutline {
				b.WriteString("**章节大纲**\n\n")
				b.WriteString(strings.TrimSpace(c.Outline))
				b.WriteString("\n\n")
			}
		}
	}

	return b.String()
}

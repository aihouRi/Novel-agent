package handler

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"

	"novel-agent/backend/internal/domain"
	"novel-agent/backend/internal/middleware"
	"novel-agent/backend/internal/service"
	"novel-agent/backend/internal/usecase"

	"github.com/labstack/echo/v4"
)

type ExportHandler struct {
	novels   *usecase.NovelUsecase
	volumes  *usecase.VolumeUsecase
	chapters *usecase.ChapterUsecase
	exporter *service.MarkdownExporter
}

type exportScope string

const (
	exportScopeAll          exportScope = "all"
	exportScopeVolume       exportScope = "volume"
	exportScopeChapterRange exportScope = "chapter_range"
)

type exportRequest struct {
	Format         string `json:"format"`
	Scope          string `json:"scope"`
	VolumeID       int64  `json:"volume_id"`
	FromChapter    int    `json:"from_chapter"`
	ToChapter      int    `json:"to_chapter"`
	IncludeBody    bool   `json:"include_body"`
	IncludeSummary bool   `json:"include_summary"`
	IncludeOutline bool   `json:"include_outline"`
}

func NewExportHandler(
	novels *usecase.NovelUsecase,
	volumes *usecase.VolumeUsecase,
	chapters *usecase.ChapterUsecase,
	exporter *service.MarkdownExporter,
) *ExportHandler {
	return &ExportHandler{
		novels:   novels,
		volumes:  volumes,
		chapters: chapters,
		exporter: exporter,
	}
}

func (h *ExportHandler) ExportNovelMarkdown(c echo.Context) error {
	req := exportRequest{
		Format:         "markdown",
		Scope:          string(exportScopeAll),
		IncludeBody:    true,
		IncludeSummary: true,
		IncludeOutline: true,
	}
	return h.exportNovel(c, req)
}

func (h *ExportHandler) ExportNovel(c echo.Context) error {
	var req exportRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}
	if strings.TrimSpace(req.Format) == "" {
		req.Format = "markdown"
	}
	if strings.TrimSpace(req.Scope) == "" {
		req.Scope = string(exportScopeAll)
	}
	if !req.IncludeBody && !req.IncludeSummary && !req.IncludeOutline {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "at least one export content option is required"})
	}
	return h.exportNovel(c, req)
}

func (h *ExportHandler) exportNovel(c echo.Context, req exportRequest) error {
	userID, ok := c.Get(middleware.UserIDContextKey).(int64)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	novelID, err := parseInt64Param(c, "novelId")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid novel id"})
	}

	novel, err := h.novels.Get(c.Request().Context(), novelID, userID)
	if err != nil {
		if errors.Is(err, usecase.ErrNovelNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "novel not found"})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to load novel"})
	}

	volumes, err := h.volumes.List(c.Request().Context(), userID, novelID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to load volumes"})
	}
	chapters, err := h.chapters.List(c.Request().Context(), userID, novelID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to load chapters"})
	}

	filteredVolumes, filteredChapters, err := filterExportData(volumes, chapters, req)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}
	if strings.ToLower(req.Format) != "markdown" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "unsupported export format"})
	}

	markdown := h.exporter.BuildNovelMarkdown(novel, filteredVolumes, filteredChapters, service.ExportOptions{
		IncludeBody:    req.IncludeBody,
		IncludeSummary: req.IncludeSummary,
		IncludeOutline: req.IncludeOutline,
	})
	filename := buildMarkdownFilename(novel.Title)
	escaped := url.PathEscape(filename)

	c.Response().Header().Set(echo.HeaderContentType, "text/markdown; charset=utf-8")
	c.Response().Header().Set(
		echo.HeaderContentDisposition,
		fmt.Sprintf("attachment; filename=\"novel-export.md\"; filename*=UTF-8''%s", escaped),
	)
	return c.String(http.StatusOK, markdown)
}

func filterExportData(volumes []domain.Volume, chapters []domain.Chapter, req exportRequest) ([]domain.Volume, []domain.Chapter, error) {
	scope := exportScope(strings.ToLower(strings.TrimSpace(req.Scope)))
	volumeSet := make(map[int64]domain.Volume, len(volumes))
	for _, v := range volumes {
		volumeSet[v.ID] = v
	}

	switch scope {
	case exportScopeAll:
		return volumes, chapters, nil
	case exportScopeVolume:
		if req.VolumeID <= 0 {
			return nil, nil, errors.New("volume_id is required for volume scope")
		}
		v, ok := volumeSet[req.VolumeID]
		if !ok {
			return nil, nil, errors.New("volume not found")
		}
		filtered := make([]domain.Chapter, 0)
		for _, c := range chapters {
			if c.VolumeID == req.VolumeID {
				filtered = append(filtered, c)
			}
		}
		return []domain.Volume{v}, filtered, nil
	case exportScopeChapterRange:
		if req.FromChapter <= 0 || req.ToChapter <= 0 {
			return nil, nil, errors.New("from_chapter and to_chapter must be greater than 0")
		}
		if req.FromChapter > req.ToChapter {
			return nil, nil, errors.New("from_chapter must be less than or equal to to_chapter")
		}
		filteredChapters := make([]domain.Chapter, 0)
		usedVolumes := make(map[int64]bool)
		for _, c := range chapters {
			if c.ChapterNumber >= req.FromChapter && c.ChapterNumber <= req.ToChapter {
				filteredChapters = append(filteredChapters, c)
				usedVolumes[c.VolumeID] = true
			}
		}
		filteredVolumes := make([]domain.Volume, 0)
		for _, v := range volumes {
			if usedVolumes[v.ID] {
				filteredVolumes = append(filteredVolumes, v)
			}
		}
		sort.Slice(filteredVolumes, func(i, j int) bool {
			if filteredVolumes[i].VolumeNumber == filteredVolumes[j].VolumeNumber {
				return filteredVolumes[i].ID < filteredVolumes[j].ID
			}
			return filteredVolumes[i].VolumeNumber < filteredVolumes[j].VolumeNumber
		})
		return filteredVolumes, filteredChapters, nil
	default:
		return nil, nil, errors.New("unsupported scope")
	}
}

func buildMarkdownFilename(novelTitle string) string {
	base := strings.TrimSpace(novelTitle)
	if base == "" {
		base = "novel"
	}
	base = strings.ReplaceAll(base, "/", "-")
	base = strings.ReplaceAll(base, "\\", "-")
	base = strings.ReplaceAll(base, ":", "-")
	datePart := time.Now().Format("20060102")
	return fmt.Sprintf("%s-%s.md", base, datePart)
}

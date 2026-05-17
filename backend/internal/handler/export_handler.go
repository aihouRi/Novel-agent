package handler

import (
	"net/url"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

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

	markdown := h.exporter.BuildNovelMarkdown(novel, volumes, chapters)
	filename := buildMarkdownFilename(novel.Title)
	escaped := url.PathEscape(filename)

	c.Response().Header().Set(echo.HeaderContentType, "text/markdown; charset=utf-8")
	c.Response().Header().Set(
		echo.HeaderContentDisposition,
		fmt.Sprintf("attachment; filename=\"novel-export.md\"; filename*=UTF-8''%s", escaped),
	)
	return c.String(http.StatusOK, markdown)
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

package handler

import (
	"errors"
	"net/http"

	"novel-agent/backend/internal/middleware"
	"novel-agent/backend/internal/service"
	"novel-agent/backend/internal/usecase"

	"github.com/labstack/echo/v4"
)

type ChapterGenerateHandler struct {
	generate *usecase.ChapterGenerateUsecase
}

func NewChapterGenerateHandler(generate *usecase.ChapterGenerateUsecase) *ChapterGenerateHandler {
	return &ChapterGenerateHandler{generate: generate}
}

type chapterGenerateRequest struct {
	VolumeID              int64  `json:"volume_id"`
	ChapterNumber         int    `json:"chapter_number"`
	Title                 string `json:"title"`
	GenerationInstruction string `json:"generation_instruction"`
}

func (h *ChapterGenerateHandler) Generate(c echo.Context) error {
	userID, ok := c.Get(middleware.UserIDContextKey).(int64)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	novelID, err := parseInt64Param(c, "novelId")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid novel id"})
	}

	var req chapterGenerateRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	out, err := h.generate.Generate(c.Request().Context(), userID, novelID, usecase.ChapterGenerateInput{
		VolumeID:              req.VolumeID,
		ChapterNumber:         req.ChapterNumber,
		Title:                 req.Title,
		GenerationInstruction: req.GenerationInstruction,
	})
	if err != nil {
		switch {
		case errors.Is(err, usecase.ErrNovelNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": "novel not found"})
		case errors.Is(err, usecase.ErrChapterGenerateInvalidOutput):
			return c.JSON(http.StatusBadGateway, map[string]string{"error": "ai output parse failed, please retry"})
		case errors.Is(err, service.ErrOpenAIRequestFailed):
			return c.JSON(http.StatusBadGateway, map[string]string{"error": "ai service request failed"})
		default:
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"outline": out.Outline,
		"body":    out.Body,
		"summary": out.Summary,
	})
}

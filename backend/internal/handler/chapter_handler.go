package handler

import (
	"errors"
	"net/http"

	"novel-agent/backend/internal/domain"
	"novel-agent/backend/internal/middleware"
	"novel-agent/backend/internal/usecase"

	"github.com/labstack/echo/v4"
)

type ChapterHandler struct {
	chapters *usecase.ChapterUsecase
}

func NewChapterHandler(chapters *usecase.ChapterUsecase) *ChapterHandler {
	return &ChapterHandler{chapters: chapters}
}

type chapterUpsertRequest struct {
	VolumeID              int64  `json:"volume_id"`
	ChapterNumber         int    `json:"chapter_number"`
	Title                 string `json:"title"`
	Body                  string `json:"body"`
	WordCount             int    `json:"word_count"`
	GenerationInstruction string `json:"generation_instruction"`
	Outline               string `json:"outline"`
	Summary               string `json:"summary"`
	Status                string `json:"status"`
}

func (h *ChapterHandler) Create(c echo.Context) error {
	userID, ok := c.Get(middleware.UserIDContextKey).(int64)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	novelID, err := parseInt64Param(c, "novelId")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid novel id"})
	}

	var req chapterUpsertRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	chapter, err := h.chapters.Create(c.Request().Context(), userID, novelID, mapChapterReq(req))
	if err != nil {
		if errors.Is(err, usecase.ErrChapterNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "novel not found"})
		}
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{"chapter": chapter})
}

func (h *ChapterHandler) List(c echo.Context) error {
	userID, ok := c.Get(middleware.UserIDContextKey).(int64)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	novelID, err := parseInt64Param(c, "novelId")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid novel id"})
	}

	chapters, err := h.chapters.List(c.Request().Context(), userID, novelID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to list chapters"})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{"chapters": chapters})
}

func (h *ChapterHandler) Get(c echo.Context) error {
	userID, ok := c.Get(middleware.UserIDContextKey).(int64)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	novelID, err := parseInt64Param(c, "novelId")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid novel id"})
	}

	id, err := parseInt64Param(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}

	chapter, err := h.chapters.Get(c.Request().Context(), userID, novelID, id)
	if err != nil {
		if errors.Is(err, usecase.ErrChapterNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "chapter not found"})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to get chapter"})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{"chapter": chapter})
}

func (h *ChapterHandler) Update(c echo.Context) error {
	userID, ok := c.Get(middleware.UserIDContextKey).(int64)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	novelID, err := parseInt64Param(c, "novelId")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid novel id"})
	}

	id, err := parseInt64Param(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}

	var req chapterUpsertRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	chapter, err := h.chapters.Update(c.Request().Context(), userID, novelID, id, mapChapterReq(req))
	if err != nil {
		if errors.Is(err, usecase.ErrChapterNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "chapter not found"})
		}
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{"chapter": chapter})
}

func (h *ChapterHandler) Delete(c echo.Context) error {
	userID, ok := c.Get(middleware.UserIDContextKey).(int64)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	novelID, err := parseInt64Param(c, "novelId")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid novel id"})
	}

	id, err := parseInt64Param(c, "id")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}

	if err := h.chapters.Delete(c.Request().Context(), userID, novelID, id); err != nil {
		if errors.Is(err, usecase.ErrChapterNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "chapter not found"})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to delete chapter"})
	}

	return c.NoContent(http.StatusNoContent)
}

func mapChapterReq(req chapterUpsertRequest) *domain.Chapter {
	return &domain.Chapter{
		VolumeID:              req.VolumeID,
		ChapterNumber:         req.ChapterNumber,
		Title:                 req.Title,
		Body:                  req.Body,
		WordCount:             req.WordCount,
		GenerationInstruction: req.GenerationInstruction,
		Outline:               req.Outline,
		Summary:               req.Summary,
		Status:                req.Status,
	}
}

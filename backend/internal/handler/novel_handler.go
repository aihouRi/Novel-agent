package handler

import (
	"errors"
	"net/http"
	"strconv"

	"novel-agent/backend/internal/domain"
	"novel-agent/backend/internal/middleware"
	"novel-agent/backend/internal/usecase"

	"github.com/labstack/echo/v4"
)

type NovelHandler struct {
	novels *usecase.NovelUsecase
}

func NewNovelHandler(novels *usecase.NovelUsecase) *NovelHandler {
	return &NovelHandler{novels: novels}
}

type novelUpsertRequest struct {
	Title              string `json:"title"`
	Genre              string `json:"genre"`
	Language           string `json:"language"`
	StyleProfile       string `json:"style_profile"`
	Worldview          string `json:"worldview"`
	PowerSystem        string `json:"power_system"`
	MainPlot           string `json:"main_plot"`
	WritingRules       string `json:"writing_rules"`
	ForbiddenRules     string `json:"forbidden_rules"`
	RecentChapterCount int    `json:"recent_chapter_count"`
}

func (h *NovelHandler) Create(c echo.Context) error {
	userID, ok := c.Get(middleware.UserIDContextKey).(int64)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	var req novelUpsertRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	novel, err := h.novels.Create(c.Request().Context(), userID, &domain.Novel{
		Title:              req.Title,
		Genre:              req.Genre,
		Language:           req.Language,
		StyleProfile:       req.StyleProfile,
		Worldview:          req.Worldview,
		PowerSystem:        req.PowerSystem,
		MainPlot:           req.MainPlot,
		WritingRules:       req.WritingRules,
		ForbiddenRules:     req.ForbiddenRules,
		RecentChapterCount: req.RecentChapterCount,
	})
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{"novel": novel})
}

func (h *NovelHandler) List(c echo.Context) error {
	userID, ok := c.Get(middleware.UserIDContextKey).(int64)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	novels, err := h.novels.List(c.Request().Context(), userID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to list novels"})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{"novels": novels})
}

func (h *NovelHandler) Get(c echo.Context) error {
	userID, ok := c.Get(middleware.UserIDContextKey).(int64)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	id, err := parseIDParam(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}

	novel, err := h.novels.Get(c.Request().Context(), id, userID)
	if err != nil {
		if errors.Is(err, usecase.ErrNovelNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "novel not found"})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to get novel"})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{"novel": novel})
}

func (h *NovelHandler) Update(c echo.Context) error {
	userID, ok := c.Get(middleware.UserIDContextKey).(int64)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	id, err := parseIDParam(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}

	var req novelUpsertRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	novel, err := h.novels.Update(c.Request().Context(), id, userID, &domain.Novel{
		Title:              req.Title,
		Genre:              req.Genre,
		Language:           req.Language,
		StyleProfile:       req.StyleProfile,
		Worldview:          req.Worldview,
		PowerSystem:        req.PowerSystem,
		MainPlot:           req.MainPlot,
		WritingRules:       req.WritingRules,
		ForbiddenRules:     req.ForbiddenRules,
		RecentChapterCount: req.RecentChapterCount,
	})
	if err != nil {
		if errors.Is(err, usecase.ErrNovelNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "novel not found"})
		}
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{"novel": novel})
}

func (h *NovelHandler) Delete(c echo.Context) error {
	userID, ok := c.Get(middleware.UserIDContextKey).(int64)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	id, err := parseIDParam(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}

	if err := h.novels.Delete(c.Request().Context(), id, userID); err != nil {
		if errors.Is(err, usecase.ErrNovelNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "novel not found"})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to delete novel"})
	}

	return c.NoContent(http.StatusNoContent)
}

func parseIDParam(c echo.Context) (int64, error) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		return 0, errors.New("invalid id")
	}
	return id, nil
}

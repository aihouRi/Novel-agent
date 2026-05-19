package handler

import (
	"errors"
	"net/http"

	"novel-agent/backend/internal/domain"
	"novel-agent/backend/internal/middleware"
	"novel-agent/backend/internal/usecase"

	"github.com/labstack/echo/v4"
)

type LoreEntryHandler struct {
	entries *usecase.LoreEntryUsecase
}

func NewLoreEntryHandler(entries *usecase.LoreEntryUsecase) *LoreEntryHandler {
	return &LoreEntryHandler{entries: entries}
}

type loreEntryUpsertRequest struct {
	Category      string  `json:"category"`
	Name          string  `json:"name"`
	Description   string  `json:"description"`
	RulesOrLimits string  `json:"rules_or_limits"`
	Tags          string  `json:"tags"`
	CharacterIDs  []int64 `json:"character_ids"`
}

func (h *LoreEntryHandler) Create(c echo.Context) error {
	userID, ok := c.Get(middleware.UserIDContextKey).(int64)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	novelID, err := parseInt64Param(c, "novelId")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid novel id"})
	}

	var req loreEntryUpsertRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	entry, err := h.entries.Create(c.Request().Context(), userID, novelID, mapLoreEntryReq(req))
	if err != nil {
		if errors.Is(err, usecase.ErrLoreEntryNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "novel not found"})
		}
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{"lore_entry": entry})
}

func (h *LoreEntryHandler) List(c echo.Context) error {
	userID, ok := c.Get(middleware.UserIDContextKey).(int64)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	novelID, err := parseInt64Param(c, "novelId")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid novel id"})
	}

	entries, err := h.entries.List(c.Request().Context(), userID, novelID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to list lore entries"})
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"lore_entries": entries})
}

func (h *LoreEntryHandler) Get(c echo.Context) error {
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

	entry, err := h.entries.Get(c.Request().Context(), userID, novelID, id)
	if err != nil {
		if errors.Is(err, usecase.ErrLoreEntryNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "lore entry not found"})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to get lore entry"})
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"lore_entry": entry})
}

func (h *LoreEntryHandler) Update(c echo.Context) error {
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

	var req loreEntryUpsertRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	entry, err := h.entries.Update(c.Request().Context(), userID, novelID, id, mapLoreEntryReq(req))
	if err != nil {
		if errors.Is(err, usecase.ErrLoreEntryNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "lore entry not found"})
		}
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"lore_entry": entry})
}

func (h *LoreEntryHandler) Delete(c echo.Context) error {
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

	if err := h.entries.Delete(c.Request().Context(), userID, novelID, id); err != nil {
		if errors.Is(err, usecase.ErrLoreEntryNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "lore entry not found"})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to delete lore entry"})
	}
	return c.NoContent(http.StatusNoContent)
}

func mapLoreEntryReq(req loreEntryUpsertRequest) *domain.LoreEntry {
	return &domain.LoreEntry{
		Category:      req.Category,
		Name:          req.Name,
		Description:   req.Description,
		RulesOrLimits: req.RulesOrLimits,
		Tags:          req.Tags,
		CharacterIDs:  req.CharacterIDs,
	}
}

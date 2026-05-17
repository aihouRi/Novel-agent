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

type CharacterHandler struct {
	characters *usecase.CharacterUsecase
}

func NewCharacterHandler(characters *usecase.CharacterUsecase) *CharacterHandler {
	return &CharacterHandler{characters: characters}
}

type characterUpsertRequest struct {
	Name                   string `json:"name"`
	Aliases                string `json:"aliases"`
	Role                   string `json:"role"`
	Personality            string `json:"personality"`
	RealmOrAbility         string `json:"realm_or_ability"`
	Goal                   string `json:"goal"`
	Relationships          string `json:"relationships"`
	SpeechStyle            string `json:"speech_style"`
	FirstAppearanceChapter int    `json:"first_appearance_chapter"`
	LastAppearanceChapter  int    `json:"last_appearance_chapter"`
	Memo                   string `json:"memo"`
	ImportanceLevel        int    `json:"importance_level"`
}

func (h *CharacterHandler) Create(c echo.Context) error {
	userID, ok := c.Get(middleware.UserIDContextKey).(int64)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	novelID, err := parseInt64Param(c, "novelId")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid novel id"})
	}

	var req characterUpsertRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	ch, err := h.characters.Create(c.Request().Context(), userID, novelID, mapCharacterReq(req))
	if err != nil {
		if errors.Is(err, usecase.ErrCharacterNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "novel not found"})
		}
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{"character": ch})
}

func (h *CharacterHandler) List(c echo.Context) error {
	userID, ok := c.Get(middleware.UserIDContextKey).(int64)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	novelID, err := parseInt64Param(c, "novelId")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid novel id"})
	}

	chars, err := h.characters.List(c.Request().Context(), userID, novelID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to list characters"})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{"characters": chars})
}

func (h *CharacterHandler) Get(c echo.Context) error {
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

	ch, err := h.characters.Get(c.Request().Context(), userID, novelID, id)
	if err != nil {
		if errors.Is(err, usecase.ErrCharacterNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "character not found"})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to get character"})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{"character": ch})
}

func (h *CharacterHandler) Update(c echo.Context) error {
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

	var req characterUpsertRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	ch, err := h.characters.Update(c.Request().Context(), userID, novelID, id, mapCharacterReq(req))
	if err != nil {
		if errors.Is(err, usecase.ErrCharacterNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "character not found"})
		}
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{"character": ch})
}

func (h *CharacterHandler) Delete(c echo.Context) error {
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

	if err := h.characters.Delete(c.Request().Context(), userID, novelID, id); err != nil {
		if errors.Is(err, usecase.ErrCharacterNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "character not found"})
		}
		if errors.Is(err, usecase.ErrCharacterProtected) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "main character cannot be deleted when importance_level >= 7"})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to delete character"})
	}

	return c.NoContent(http.StatusNoContent)
}

func mapCharacterReq(req characterUpsertRequest) *domain.Character {
	return &domain.Character{
		Name:                   req.Name,
		Aliases:                req.Aliases,
		Role:                   req.Role,
		Personality:            req.Personality,
		RealmOrAbility:         req.RealmOrAbility,
		Goal:                   req.Goal,
		Relationships:          req.Relationships,
		SpeechStyle:            req.SpeechStyle,
		FirstAppearanceChapter: req.FirstAppearanceChapter,
		LastAppearanceChapter:  req.LastAppearanceChapter,
		Memo:                   req.Memo,
		ImportanceLevel:        req.ImportanceLevel,
	}
}

func parseInt64Param(c echo.Context, key string) (int64, error) {
	v, err := strconv.ParseInt(c.Param(key), 10, 64)
	if err != nil || v <= 0 {
		return 0, errors.New("invalid id")
	}
	return v, nil
}

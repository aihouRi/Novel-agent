package handler

import (
	"net/http"

	"novel-agent/backend/internal/middleware"
	"novel-agent/backend/internal/usecase"

	"github.com/labstack/echo/v4"
)

type UserAISettingHandler struct {
	uc *usecase.UserAISettingUsecase
}

func NewUserAISettingHandler(uc *usecase.UserAISettingUsecase) *UserAISettingHandler {
	return &UserAISettingHandler{uc: uc}
}

type upsertUserAISettingRequest struct {
	OpenAIAPIKey  string `json:"openai_api_key"`
	OpenAIBaseURL string `json:"openai_base_url"`
	OpenAIModel   string `json:"openai_model"`
}

func (h *UserAISettingHandler) Get(c echo.Context) error {
	userID, ok := c.Get(middleware.UserIDContextKey).(int64)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	setting, err := h.uc.Get(c.Request().Context(), userID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to get ai settings"})
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"setting": setting})
}

func (h *UserAISettingHandler) Upsert(c echo.Context) error {
	userID, ok := c.Get(middleware.UserIDContextKey).(int64)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	var req upsertUserAISettingRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	setting, err := h.uc.Upsert(c.Request().Context(), userID, usecase.UpsertUserAISettingInput{
		OpenAIAPIKey:  req.OpenAIAPIKey,
		OpenAIBaseURL: req.OpenAIBaseURL,
		OpenAIModel:   req.OpenAIModel,
	})
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"setting": setting})
}

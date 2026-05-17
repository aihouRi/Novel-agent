package handler

import (
	"errors"
	"net/http"

	"novel-agent/backend/internal/domain"
	"novel-agent/backend/internal/middleware"
	"novel-agent/backend/internal/usecase"

	"github.com/labstack/echo/v4"
)

type VolumeHandler struct {
	volumes *usecase.VolumeUsecase
}

func NewVolumeHandler(volumes *usecase.VolumeUsecase) *VolumeHandler {
	return &VolumeHandler{volumes: volumes}
}

type volumeUpsertRequest struct {
	VolumeNumber int    `json:"volume_number"`
	Title        string `json:"title"`
}

func (h *VolumeHandler) Create(c echo.Context) error {
	userID, ok := c.Get(middleware.UserIDContextKey).(int64)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	novelID, err := parseInt64Param(c, "novelId")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid novel id"})
	}
	var req volumeUpsertRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}
	v, err := h.volumes.Create(c.Request().Context(), userID, novelID, &domain.Volume{VolumeNumber: req.VolumeNumber, Title: req.Title})
	if err != nil {
		if errors.Is(err, usecase.ErrVolumeNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "novel not found"})
		}
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusCreated, map[string]interface{}{"volume": v})
}

func (h *VolumeHandler) List(c echo.Context) error {
	userID, ok := c.Get(middleware.UserIDContextKey).(int64)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	novelID, err := parseInt64Param(c, "novelId")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid novel id"})
	}
	volumes, err := h.volumes.List(c.Request().Context(), userID, novelID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to list volumes"})
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"volumes": volumes})
}

func (h *VolumeHandler) Update(c echo.Context) error {
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
	var req volumeUpsertRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}
	v, err := h.volumes.Update(c.Request().Context(), userID, novelID, id, &domain.Volume{VolumeNumber: req.VolumeNumber, Title: req.Title})
	if err != nil {
		if errors.Is(err, usecase.ErrVolumeNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "volume not found"})
		}
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"volume": v})
}

func (h *VolumeHandler) Delete(c echo.Context) error {
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
	if err := h.volumes.Delete(c.Request().Context(), userID, novelID, id); err != nil {
		if errors.Is(err, usecase.ErrVolumeNotFound) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "volume not found or contains chapters"})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to delete volume"})
	}
	return c.NoContent(http.StatusNoContent)
}

package main

import (
	"context"
	"database/sql"
	"net/http"
	"time"

	"novel-agent/backend/internal/config"
	"novel-agent/backend/internal/repository"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	cfg := config.Load()

	db, err := repository.NewMySQL(cfg.MySQLDSN)
	if err != nil {
		panic(err)
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := repository.Ping(ctx, db); err != nil {
		panic(err)
	}

	e := newServer(db)
	e.Logger.Fatal(e.Start(":" + cfg.Port))
}

func newServer(db *sql.DB) *echo.Echo {
	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})

	e.GET("/health/db", func(c echo.Context) error {
		ctx, cancel := context.WithTimeout(c.Request().Context(), 2*time.Second)
		defer cancel()

		if err := repository.Ping(ctx, db); err != nil {
			return c.JSON(http.StatusServiceUnavailable, map[string]string{
				"status": "error",
				"error":  err.Error(),
			})
		}

		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})

	return e
}

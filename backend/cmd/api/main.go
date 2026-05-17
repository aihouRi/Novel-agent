package main

import (
	"context"
	"database/sql"
	"net/http"
	"time"

	"novel-agent/backend/internal/config"
	"novel-agent/backend/internal/handler"
	appmiddleware "novel-agent/backend/internal/middleware"
	"novel-agent/backend/internal/repository"
	"novel-agent/backend/internal/service"
	"novel-agent/backend/internal/usecase"

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

	e := newServer(db, cfg)
	e.Logger.Fatal(e.Start(":" + cfg.Port))
}

func newServer(db *sql.DB, cfg config.AppConfig) *echo.Echo {
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

	userRepo := repository.NewUserRepository(db)
	authUC := usecase.NewAuthUsecase(userRepo, cfg.JWTSecret)
	authHandler := handler.NewAuthHandler(authUC)

	auth := e.Group("/auth")
	auth.POST("/register", authHandler.Register)
	auth.POST("/login", authHandler.Login)
	auth.GET("/me", authHandler.Me, appmiddleware.JWTAuth(cfg.JWTSecret))

	novelRepo := repository.NewNovelRepository(db)
	novelUC := usecase.NewNovelUsecase(novelRepo)
	novelHandler := handler.NewNovelHandler(novelUC)

	novels := e.Group("/novels", appmiddleware.JWTAuth(cfg.JWTSecret))
	novels.POST("", novelHandler.Create)
	novels.GET("", novelHandler.List)
	novels.GET("/:id", novelHandler.Get)
	novels.PUT("/:id", novelHandler.Update)
	novels.DELETE("/:id", novelHandler.Delete)

	characterRepo := repository.NewCharacterRepository(db)
	characterUC := usecase.NewCharacterUsecase(characterRepo)
	characterHandler := handler.NewCharacterHandler(characterUC)

	novelCharacters := e.Group("/novels/:novelId/characters", appmiddleware.JWTAuth(cfg.JWTSecret))
	novelCharacters.POST("", characterHandler.Create)
	novelCharacters.GET("", characterHandler.List)
	novelCharacters.GET("/:id", characterHandler.Get)
	novelCharacters.PUT("/:id", characterHandler.Update)
	novelCharacters.DELETE("/:id", characterHandler.Delete)

	chapterRepo := repository.NewChapterRepository(db)
	chapterUC := usecase.NewChapterUsecase(chapterRepo)
	chapterHandler := handler.NewChapterHandler(chapterUC)

	novelChapters := e.Group("/novels/:novelId/chapters", appmiddleware.JWTAuth(cfg.JWTSecret))
	novelChapters.POST("", chapterHandler.Create)
	novelChapters.GET("", chapterHandler.List)
	novelChapters.GET("/:id", chapterHandler.Get)
	novelChapters.PUT("/:id", chapterHandler.Update)
	novelChapters.DELETE("/:id", chapterHandler.Delete)

	volumeRepo := repository.NewVolumeRepository(db)
	volumeUC := usecase.NewVolumeUsecase(volumeRepo)
	volumeHandler := handler.NewVolumeHandler(volumeUC)

	novelVolumes := e.Group("/novels/:novelId/volumes", appmiddleware.JWTAuth(cfg.JWTSecret))
	novelVolumes.POST("", volumeHandler.Create)
	novelVolumes.GET("", volumeHandler.List)
	novelVolumes.PUT("/:id", volumeHandler.Update)
	novelVolumes.DELETE("/:id", volumeHandler.Delete)

	exporter := service.NewMarkdownExporter()
	exportHandler := handler.NewExportHandler(novelUC, volumeUC, chapterUC, exporter)
	novels.GET("/:novelId/export/markdown", exportHandler.ExportNovelMarkdown)
	novels.POST("/:novelId/export", exportHandler.ExportNovel)

	openaiClient := service.NewOpenAIClient(cfg.OpenAIAPIKey, cfg.OpenAIBaseURL, cfg.OpenAIModelName)
	chapterGenerateUC := usecase.NewChapterGenerateUsecase(novelUC, chapterUC, characterUC, openaiClient)
	chapterGenerateHandler := handler.NewChapterGenerateHandler(chapterGenerateUC)
	novelChapters.POST("/generate", chapterGenerateHandler.Generate)

	return e
}

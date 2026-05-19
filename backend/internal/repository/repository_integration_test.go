package repository

import (
	"context"
	"database/sql"
	"errors"
	"os"
	"testing"
	"time"

	"novel-agent/backend/internal/domain"
)

func TestRepositoryIntegration_MinimalCRUD(t *testing.T) {
	dsn := os.Getenv("MYSQL_DSN")
	if dsn == "" {
		dsn = "novel:novel@tcp(127.0.0.1:3306)/novel_agent?parseTime=true&charset=utf8mb4,utf8"
	}

	db, err := NewMySQL(dsn)
	if err != nil {
		t.Skipf("skip integration test: open mysql failed: %v", err)
	}
	t.Cleanup(func() { _ = db.Close() })

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := Ping(ctx, db); err != nil {
		t.Skipf("skip integration test: mysql not reachable: %v", err)
	}

	cleanupTestData(t, db)
	t.Cleanup(func() { cleanupTestData(t, db) })

	userRepo := NewUserRepository(db)
	novelRepo := NewNovelRepository(db)
	volumeRepo := NewVolumeRepository(db)
	chapterRepo := NewChapterRepository(db)

	user1, err := userRepo.Create(ctx, "u1", "u1-integration@example.com", "hash1")
	if err != nil {
		t.Fatalf("create user1: %v", err)
	}
	user2, err := userRepo.Create(ctx, "u2", "u2-integration@example.com", "hash2")
	if err != nil {
		t.Fatalf("create user2: %v", err)
	}

	novel, err := novelRepo.Create(ctx, &domain.Novel{
		UserID:             user1.ID,
		Title:              "integration novel",
		Genre:              "xianxia",
		Language:           "zh-CN",
		RecentChapterCount: 3,
	})
	if err != nil {
		t.Fatalf("create novel: %v", err)
	}

	list, err := novelRepo.ListByUserID(ctx, user1.ID)
	if err != nil {
		t.Fatalf("list novels: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("expected 1 novel, got %d", len(list))
	}

	if _, err := novelRepo.GetByID(ctx, novel.ID, user2.ID); !errors.Is(err, sql.ErrNoRows) {
		t.Fatalf("expected sql.ErrNoRows for cross-user get, got %v", err)
	}

	updated, err := novelRepo.Update(ctx, novel.ID, user1.ID, &domain.Novel{
		Title:              "integration novel updated",
		Genre:              "xuanhuan",
		Language:           "zh-CN",
		StyleProfile:       "fast",
		Worldview:          "world",
		PowerSystem:        "power",
		MainPlot:           "plot",
		WritingRules:       "rules",
		ForbiddenRules:     "forbid",
		RecentChapterCount: 5,
	})
	if err != nil {
		t.Fatalf("update novel: %v", err)
	}
	if updated.Title != "integration novel updated" || updated.RecentChapterCount != 5 {
		t.Fatalf("unexpected updated novel: %+v", updated)
	}

	volume, err := volumeRepo.Create(ctx, user1.ID, &domain.Volume{
		NovelID:      novel.ID,
		VolumeNumber: 1,
		Title:        "第一卷：起点",
	})
	if err != nil {
		t.Fatalf("create volume: %v", err)
	}

	chapter, err := chapterRepo.Create(ctx, user1.ID, &domain.Chapter{
		NovelID:              novel.ID,
		VolumeID:             volume.ID,
		ChapterNumber:        1,
		Title:                "第一章",
		Body:                 "正文",
		WordCount:            2,
		GenerationInstruction: "instruction",
		Outline:              "outline",
		Summary:              "summary",
	})
	if err != nil {
		t.Fatalf("create chapter: %v", err)
	}

	chapters, err := chapterRepo.ListByNovel(ctx, user1.ID, novel.ID)
	if err != nil {
		t.Fatalf("list chapters: %v", err)
	}
	if len(chapters) != 1 {
		t.Fatalf("expected 1 chapter, got %d", len(chapters))
	}

	chapterUpdated, err := chapterRepo.Update(ctx, user1.ID, novel.ID, chapter.ID, &domain.Chapter{
		VolumeID:             volume.ID,
		ChapterNumber:        1,
		Title:                "第一章-修订",
		Body:                 "正文修订",
		WordCount:            4,
		GenerationInstruction: "instruction2",
		Outline:              "outline2",
		Summary:              "summary2",
	})
	if err != nil {
		t.Fatalf("update chapter: %v", err)
	}
	if chapterUpdated.Title != "第一章-修订" {
		t.Fatalf("unexpected chapter title: %s", chapterUpdated.Title)
	}

	if err := chapterRepo.Delete(ctx, user1.ID, novel.ID, chapter.ID); err != nil {
		t.Fatalf("delete chapter: %v", err)
	}

	if err := volumeRepo.Delete(ctx, user1.ID, novel.ID, volume.ID); err != nil {
		t.Fatalf("delete volume: %v", err)
	}

	if err := novelRepo.Delete(ctx, novel.ID, user1.ID); err != nil {
		t.Fatalf("delete novel: %v", err)
	}

	finalList, err := novelRepo.ListByUserID(ctx, user1.ID)
	if err != nil {
		t.Fatalf("list novels after delete: %v", err)
	}
	if len(finalList) != 0 {
		t.Fatalf("expected 0 novel after delete, got %d", len(finalList))
	}
}

func cleanupTestData(t *testing.T, db *sql.DB) {
	t.Helper()
	queries := []string{
		"DELETE FROM chapters",
		"DELETE FROM characters",
		"DELETE FROM volumes",
		"DELETE FROM novels",
		"DELETE FROM users",
	}
	for _, q := range queries {
		if _, err := db.Exec(q); err != nil {
			t.Fatalf("cleanup failed for query %q: %v", q, err)
		}
	}
}

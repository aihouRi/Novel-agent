package main

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"novel-agent/backend/internal/config"
	"novel-agent/backend/internal/repository"
)

func TestAPIIntegration_AuthAndNovelsFlow(t *testing.T) {
	dsn := requireIntegrationTestDSN(t)

	db, err := repository.NewMySQL(dsn)
	if err != nil {
		t.Fatalf("open mysql: %v", err)
	}
	t.Cleanup(func() { _ = db.Close() })

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := repository.Ping(ctx, db); err != nil {
		t.Fatalf("ping mysql: %v", err)
	}

	requireSchemaReady(t, db)
	cleanupTestRows(t, db)
	t.Cleanup(func() { cleanupTestRows(t, db) })

	e := newServer(db, config.AppConfig{JWTSecret: "integration-test-secret"})

	email := "it_api_user_1@example.com"

	registerStatus, registerBody := doJSON(t, e, http.MethodPost, "/auth/register", map[string]any{
		"name":     "it-user",
		"email":    email,
		"password": "pass123",
	}, "")
	if registerStatus != http.StatusCreated {
		t.Fatalf("register status: want %d got %d body=%s", http.StatusCreated, registerStatus, registerBody)
	}

	registerJSON := decodeJSONMap(t, registerBody)
	token, _ := registerJSON["token"].(string)
	if token == "" {
		t.Fatalf("register token is empty: %s", registerBody)
	}

	loginStatus, loginBody := doJSON(t, e, http.MethodPost, "/auth/login", map[string]any{
		"email":    email,
		"password": "pass123",
	}, "")
	if loginStatus != http.StatusOK {
		t.Fatalf("login status: want %d got %d body=%s", http.StatusOK, loginStatus, loginBody)
	}

	loginJSON := decodeJSONMap(t, loginBody)
	loginToken, _ := loginJSON["token"].(string)
	if loginToken == "" {
		t.Fatalf("login token is empty: %s", loginBody)
	}

	meStatus, meBody := doJSON(t, e, http.MethodGet, "/auth/me", nil, loginToken)
	if meStatus != http.StatusOK {
		t.Fatalf("/auth/me status: want %d got %d body=%s", http.StatusOK, meStatus, meBody)
	}

	createNovelStatus, createNovelBody := doJSON(t, e, http.MethodPost, "/novels", map[string]any{
		"title":                "it_novel_1",
		"genre":                "xianxia",
		"language":             "zh-CN",
		"recent_chapter_count": 3,
	}, loginToken)
	if createNovelStatus != http.StatusCreated {
		t.Fatalf("create novel status: want %d got %d body=%s", http.StatusCreated, createNovelStatus, createNovelBody)
	}
	novelID := extractNestedID(t, createNovelBody, "novel")
	novelPath := fmt.Sprintf("/novels/%d", novelID)

	listStatus, listBody := doJSON(t, e, http.MethodGet, "/novels", nil, loginToken)
	if listStatus != http.StatusOK {
		t.Fatalf("list novels status: want %d got %d body=%s", http.StatusOK, listStatus, listBody)
	}
	if !strings.Contains(listBody, "it_novel_1") {
		t.Fatalf("list novels does not contain created novel, body=%s", listBody)
	}

	createVolumeStatus, createVolumeBody := doJSON(t, e, http.MethodPost, fmt.Sprintf("%s/volumes", novelPath), map[string]any{
		"volume_number": 1,
		"title":         "it_volume_1",
	}, loginToken)
	if createVolumeStatus != http.StatusCreated {
		t.Fatalf("create volume status: want %d got %d body=%s", http.StatusCreated, createVolumeStatus, createVolumeBody)
	}
	volumeID := extractNestedID(t, createVolumeBody, "volume")

	createCharacterStatus, createCharacterBody := doJSON(t, e, http.MethodPost, fmt.Sprintf("%s/characters", novelPath), map[string]any{
		"name":             "it_character_1",
		"role":             "lead",
		"importance_level": 6,
	}, loginToken)
	if createCharacterStatus != http.StatusCreated {
		t.Fatalf("create character status: want %d got %d body=%s", http.StatusCreated, createCharacterStatus, createCharacterBody)
	}
	characterID := extractNestedID(t, createCharacterBody, "character")

	listCharactersStatus, listCharactersBody := doJSON(t, e, http.MethodGet, fmt.Sprintf("%s/characters", novelPath), nil, loginToken)
	if listCharactersStatus != http.StatusOK {
		t.Fatalf("list characters status: want %d got %d body=%s", http.StatusOK, listCharactersStatus, listCharactersBody)
	}
	if !strings.Contains(listCharactersBody, "it_character_1") {
		t.Fatalf("list characters does not contain created character, body=%s", listCharactersBody)
	}

	updateCharacterStatus, updateCharacterBody := doJSON(t, e, http.MethodPut, fmt.Sprintf("%s/characters/%d", novelPath, characterID), map[string]any{
		"name":             "it_character_1_updated",
		"role":             "lead",
		"importance_level": 6,
	}, loginToken)
	if updateCharacterStatus != http.StatusOK {
		t.Fatalf("update character status: want %d got %d body=%s", http.StatusOK, updateCharacterStatus, updateCharacterBody)
	}

	deleteCharacterStatus, deleteCharacterBody := doJSON(t, e, http.MethodDelete, fmt.Sprintf("%s/characters/%d", novelPath, characterID), nil, loginToken)
	if deleteCharacterStatus != http.StatusNoContent {
		t.Fatalf("delete character status: want %d got %d body=%s", http.StatusNoContent, deleteCharacterStatus, deleteCharacterBody)
	}

	createChapterStatus, createChapterBody := doJSON(t, e, http.MethodPost, fmt.Sprintf("%s/chapters", novelPath), map[string]any{
		"volume_id":               volumeID,
		"chapter_number":          1,
		"title":                   "it_chapter_1",
		"body":                    "测试正文",
		"generation_instruction":  "it instruction",
		"outline":                 "it outline",
		"summary":                 "it summary",
	}, loginToken)
	if createChapterStatus != http.StatusCreated {
		t.Fatalf("create chapter status: want %d got %d body=%s", http.StatusCreated, createChapterStatus, createChapterBody)
	}
	chapterID := extractNestedID(t, createChapterBody, "chapter")

	listChaptersStatus, listChaptersBody := doJSON(t, e, http.MethodGet, fmt.Sprintf("%s/chapters", novelPath), nil, loginToken)
	if listChaptersStatus != http.StatusOK {
		t.Fatalf("list chapters status: want %d got %d body=%s", http.StatusOK, listChaptersStatus, listChaptersBody)
	}
	if !strings.Contains(listChaptersBody, "it_chapter_1") {
		t.Fatalf("list chapters does not contain created chapter, body=%s", listChaptersBody)
	}

	updateChapterStatus, updateChapterBody := doJSON(t, e, http.MethodPut, fmt.Sprintf("%s/chapters/%d", novelPath, chapterID), map[string]any{
		"volume_id":               volumeID,
		"chapter_number":          1,
		"title":                   "it_chapter_1_updated",
		"body":                    "测试正文更新",
		"generation_instruction":  "it instruction 2",
		"outline":                 "it outline 2",
		"summary":                 "it summary 2",
	}, loginToken)
	if updateChapterStatus != http.StatusOK {
		t.Fatalf("update chapter status: want %d got %d body=%s", http.StatusOK, updateChapterStatus, updateChapterBody)
	}

	deleteChapterStatus, deleteChapterBody := doJSON(t, e, http.MethodDelete, fmt.Sprintf("%s/chapters/%d", novelPath, chapterID), nil, loginToken)
	if deleteChapterStatus != http.StatusNoContent {
		t.Fatalf("delete chapter status: want %d got %d body=%s", http.StatusNoContent, deleteChapterStatus, deleteChapterBody)
	}
}

func TestAPIIntegration_FailurePaths(t *testing.T) {
	dsn := requireIntegrationTestDSN(t)

	db, err := repository.NewMySQL(dsn)
	if err != nil {
		t.Fatalf("open mysql: %v", err)
	}
	t.Cleanup(func() { _ = db.Close() })

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := repository.Ping(ctx, db); err != nil {
		t.Fatalf("ping mysql: %v", err)
	}

	requireSchemaReady(t, db)
	cleanupTestRows(t, db)
	t.Cleanup(func() { cleanupTestRows(t, db) })

	e := newServer(db, config.AppConfig{JWTSecret: "integration-test-secret"})

	unauthStatus, _ := doJSON(t, e, http.MethodGet, "/novels", nil, "")
	if unauthStatus != http.StatusUnauthorized {
		t.Fatalf("unauthorized /novels status: want %d got %d", http.StatusUnauthorized, unauthStatus)
	}

	email := "it_api_user_fail_1@example.com"
	registerStatus, registerBody := doJSON(t, e, http.MethodPost, "/auth/register", map[string]any{
		"name":     "it-user-fail",
		"email":    email,
		"password": "pass123",
	}, "")
	if registerStatus != http.StatusCreated {
		t.Fatalf("register status: want %d got %d body=%s", http.StatusCreated, registerStatus, registerBody)
	}
	token := mustTokenFromBody(t, registerBody)

	createNovelStatus, createNovelBody := doJSON(t, e, http.MethodPost, "/novels", map[string]any{
		"title":                "it_novel_fail_1",
		"genre":                "xianxia",
		"language":             "zh-CN",
		"recent_chapter_count": 3,
	}, token)
	if createNovelStatus != http.StatusCreated {
		t.Fatalf("create novel status: want %d got %d body=%s", http.StatusCreated, createNovelStatus, createNovelBody)
	}
	novelID := extractNestedID(t, createNovelBody, "novel")
	novelPath := fmt.Sprintf("/novels/%d", novelID)

	createVolumeStatus, createVolumeBody := doJSON(t, e, http.MethodPost, fmt.Sprintf("%s/volumes", novelPath), map[string]any{
		"volume_number": 1,
		"title":         "it_volume_fail_1",
	}, token)
	if createVolumeStatus != http.StatusCreated {
		t.Fatalf("create volume status: want %d got %d body=%s", http.StatusCreated, createVolumeStatus, createVolumeBody)
	}
	volumeID := extractNestedID(t, createVolumeBody, "volume")

	createProtectedCharacterStatus, createProtectedCharacterBody := doJSON(t, e, http.MethodPost, fmt.Sprintf("%s/characters", novelPath), map[string]any{
		"name":             "it_character_protected_1",
		"role":             "lead",
		"importance_level": 7,
	}, token)
	if createProtectedCharacterStatus != http.StatusCreated {
		t.Fatalf("create protected character status: want %d got %d body=%s", http.StatusCreated, createProtectedCharacterStatus, createProtectedCharacterBody)
	}
	protectedCharacterID := extractNestedID(t, createProtectedCharacterBody, "character")

	deleteProtectedStatus, deleteProtectedBody := doJSON(t, e, http.MethodDelete, fmt.Sprintf("%s/characters/%d", novelPath, protectedCharacterID), nil, token)
	if deleteProtectedStatus != http.StatusBadRequest {
		t.Fatalf("delete protected character status: want %d got %d body=%s", http.StatusBadRequest, deleteProtectedStatus, deleteProtectedBody)
	}
	if !strings.Contains(deleteProtectedBody, "main character cannot be deleted") {
		t.Fatalf("unexpected protected character error body=%s", deleteProtectedBody)
	}

	createChapterStatus, createChapterBody := doJSON(t, e, http.MethodPost, fmt.Sprintf("%s/chapters", novelPath), map[string]any{
		"volume_id":              volumeID,
		"chapter_number":         1,
		"title":                  "it_chapter_fail_1",
		"body":                   "测试正文",
		"generation_instruction": "it instruction",
		"outline":                "it outline",
		"summary":                "it summary",
	}, token)
	if createChapterStatus != http.StatusCreated {
		t.Fatalf("create chapter status: want %d got %d body=%s", http.StatusCreated, createChapterStatus, createChapterBody)
	}

	createDupChapterStatus, createDupChapterBody := doJSON(t, e, http.MethodPost, fmt.Sprintf("%s/chapters", novelPath), map[string]any{
		"volume_id":              volumeID,
		"chapter_number":         1,
		"title":                  "it_chapter_fail_dup",
		"body":                   "测试正文2",
		"generation_instruction": "it instruction 2",
		"outline":                "it outline 2",
		"summary":                "it summary 2",
	}, token)
	if createDupChapterStatus != http.StatusBadRequest {
		t.Fatalf("duplicate chapter status: want %d got %d body=%s", http.StatusBadRequest, createDupChapterStatus, createDupChapterBody)
	}
}

func requireIntegrationTestDSN(t *testing.T) string {
	t.Helper()
	if os.Getenv("INTEGRATION_TEST") != "1" {
		t.Skip("skip integration test: set INTEGRATION_TEST=1")
	}
	dsn := os.Getenv("MYSQL_DSN")
	if dsn == "" {
		t.Fatal("MYSQL_DSN is required for integration test")
	}
	if !strings.Contains(strings.ToLower(dsn), "_test") {
		t.Fatalf("unsafe MYSQL_DSN %q: database name must include '_test'", dsn)
	}
	return dsn
}

func requireSchemaReady(t *testing.T, db *sql.DB) {
	t.Helper()
	required := []string{"users", "novels", "characters", "volumes", "chapters"}
	for _, table := range required {
		var count int
		err := db.QueryRow(`
			SELECT COUNT(*)
			FROM information_schema.tables
			WHERE table_schema = DATABASE() AND table_name = ?
		`, table).Scan(&count)
		if err != nil {
			t.Fatalf("check schema table %s: %v", table, err)
		}
		if count == 0 {
			t.Fatalf("missing table %q in test DB; run migrations on your *_test database first", table)
		}
	}
}

func cleanupTestRows(t *testing.T, db *sql.DB) {
	t.Helper()
	queries := []string{
		`DELETE FROM chapters WHERE title LIKE 'it_%' OR title LIKE 'it-%'`,
		`DELETE FROM characters WHERE name LIKE 'it_%' OR name LIKE 'it-%'`,
		`DELETE FROM volumes WHERE title LIKE 'it_%' OR title LIKE 'it-%'`,
		`DELETE FROM novels WHERE title LIKE 'it_%' OR title LIKE 'it-%'`,
		`DELETE FROM users WHERE email LIKE 'it_%@%' OR email LIKE 'it-%@%'`,
	}
	for _, q := range queries {
		if _, err := db.Exec(q); err != nil {
			t.Fatalf("cleanup query failed: %s err=%v", q, err)
		}
	}
}

func doJSON(t *testing.T, e http.Handler, method, path string, body any, token string) (int, string) {
	t.Helper()
	var reader io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("marshal body: %v", err)
		}
		reader = bytes.NewReader(b)
	}

	req := httptest.NewRequest(method, path, reader)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if token != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	}
	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, req)
	return rec.Code, rec.Body.String()
}

func decodeJSONMap(t *testing.T, body string) map[string]any {
	t.Helper()
	out := map[string]any{}
	if err := json.Unmarshal([]byte(body), &out); err != nil {
		t.Fatalf("decode json body: %v body=%s", err, body)
	}
	return out
}

func mustTokenFromBody(t *testing.T, body string) string {
	t.Helper()
	obj := decodeJSONMap(t, body)
	token, _ := obj["token"].(string)
	if token == "" {
		t.Fatalf("missing token in body=%s", body)
	}
	return token
}

func extractNestedID(t *testing.T, body, key string) int64 {
	t.Helper()
	top := decodeJSONMap(t, body)
	rawObj, ok := top[key].(map[string]any)
	if !ok {
		t.Fatalf("missing object key %q in body=%s", key, body)
	}
	rawID, ok := rawObj["id"].(float64)
	if !ok {
		t.Fatalf("missing id in object %q body=%s", key, body)
	}
	return int64(rawID)
}

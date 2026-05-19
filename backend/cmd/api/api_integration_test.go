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

	listStatus, listBody := doJSON(t, e, http.MethodGet, "/novels", nil, loginToken)
	if listStatus != http.StatusOK {
		t.Fatalf("list novels status: want %d got %d body=%s", http.StatusOK, listStatus, listBody)
	}
	if !strings.Contains(listBody, "it_novel_1") {
		t.Fatalf("list novels does not contain created novel, body=%s", listBody)
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

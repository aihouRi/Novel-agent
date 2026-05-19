package repository

import (
	"os"
	"strings"
	"testing"
)

// requireIntegrationTestDB enforces a safety gate for DB integration tests.
// Rules:
// 1) INTEGRATION_TEST must be set to 1.
// 2) MYSQL_DSN must point to a *_test database.
func requireIntegrationTestDB(t *testing.T) string {
	t.Helper()

	if os.Getenv("INTEGRATION_TEST") != "1" {
		t.Skip("skip integration test: set INTEGRATION_TEST=1 to run")
	}

	dsn := os.Getenv("MYSQL_DSN")
	if dsn == "" {
		t.Fatal("MYSQL_DSN is required for integration tests")
	}

	lowerDSN := strings.ToLower(dsn)
	if !strings.Contains(lowerDSN, "_test") {
		t.Fatalf("unsafe MYSQL_DSN for integration test: %q (database name must include '_test')", dsn)
	}

	return dsn
}


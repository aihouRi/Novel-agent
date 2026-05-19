package middleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

func TestJWTAuthMissingBearerToken(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	h := JWTAuth("secret")(func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	if err := h(ctx); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}

	var body map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}
	if body["error"] != "missing bearer token" {
		t.Fatalf("expected missing bearer token error, got %q", body["error"])
	}
}

func TestJWTAuthValidTokenSetsUserID(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": float64(42),
		"exp":     time.Now().Add(1 * time.Hour).Unix(),
	})
	signed, err := token.SignedString([]byte("secret"))
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}
	req.Header.Set("Authorization", "Bearer "+signed)

	h := JWTAuth("secret")(func(c echo.Context) error {
		uid, ok := c.Get(UserIDContextKey).(int64)
		if !ok {
			t.Fatalf("user id not found in context")
		}
		if uid != 42 {
			t.Fatalf("expected user id 42, got %d", uid)
		}
		return c.String(http.StatusOK, "ok")
	})

	if err := h(ctx); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
}

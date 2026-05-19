package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
)

func TestParseIDParam(t *testing.T) {
	e := echo.New()
	tests := []struct {
		name    string
		param   string
		wantID  int64
		wantErr bool
	}{
		{name: "valid", param: "123", wantID: 123, wantErr: false},
		{name: "zero", param: "0", wantErr: true},
		{name: "negative", param: "-1", wantErr: true},
		{name: "non-numeric", param: "abc", wantErr: true},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/novels/"+tc.param, nil)
			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)
			c.SetParamNames("id")
			c.SetParamValues(tc.param)

			got, err := parseIDParam(c)
			if tc.wantErr {
				if err == nil {
					t.Fatalf("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != tc.wantID {
				t.Fatalf("expected id %d, got %d", tc.wantID, got)
			}
		})
	}
}

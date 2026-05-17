package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

var ErrOpenAIInvalidOutput = errors.New("openai returned invalid json output")
var ErrOpenAIRequestFailed = errors.New("openai request failed")

type ChapterGenerateResult struct {
	Outline string `json:"outline"`
	Body    string `json:"body"`
	Summary string `json:"summary"`
}

type OpenAIChapterGenerator interface {
	GenerateChapter(ctx context.Context, prompt string) (*ChapterGenerateResult, error)
}

type OpenAIClient struct {
	apiKey     string
	baseURL    string
	model      string
	httpClient *http.Client
}

func NewOpenAIClient(apiKey, baseURL, model string) *OpenAIClient {
	return &OpenAIClient{
		apiKey:     strings.TrimSpace(apiKey),
		baseURL:    strings.TrimRight(strings.TrimSpace(baseURL), "/"),
		model:      strings.TrimSpace(model),
		httpClient: &http.Client{Timeout: 60 * time.Second},
	}
}

func (c *OpenAIClient) GenerateChapter(ctx context.Context, prompt string) (*ChapterGenerateResult, error) {
	if c.apiKey == "" {
		return nil, errors.New("openai api key is not configured")
	}
	if c.baseURL == "" || c.model == "" {
		return nil, errors.New("openai config is incomplete")
	}

	reqBody := map[string]interface{}{
		"model": c.model,
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": "你是中文长篇小说写作助手。只返回 JSON，不要返回额外说明。",
			},
			{
				"role":    "user",
				"content": prompt,
			},
		},
		"response_format": map[string]string{
			"type": "json_object",
		},
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrOpenAIRequestFailed, err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 300 {
		return nil, fmt.Errorf("%w: status=%d body=%s", ErrOpenAIRequestFailed, resp.StatusCode, string(raw))
	}

	var data struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(raw, &data); err != nil {
		return nil, err
	}
	if len(data.Choices) == 0 {
		return nil, fmt.Errorf("%w: empty choices", ErrOpenAIRequestFailed)
	}

	content := strings.TrimSpace(data.Choices[0].Message.Content)
	var out ChapterGenerateResult
	if err := json.Unmarshal([]byte(content), &out); err != nil {
		return nil, ErrOpenAIInvalidOutput
	}
	out.Outline = strings.TrimSpace(out.Outline)
	out.Body = strings.TrimSpace(out.Body)
	out.Summary = strings.TrimSpace(out.Summary)
	if out.Outline == "" || out.Body == "" || out.Summary == "" {
		return nil, ErrOpenAIInvalidOutput
	}
	return &out, nil
}

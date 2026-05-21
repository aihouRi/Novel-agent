package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

var ErrGeminiInvalidOutput = errors.New("gemini returned invalid json output")
var ErrGeminiRequestFailed = errors.New("gemini request failed")

type GeminiConfig struct {
	APIKey          string
	BaseURL         string
	Model           string
	MaxOutputTokens int
}

type GeminiChapterGenerator interface {
	GenerateChapterWithConfig(ctx context.Context, prompt string, cfg GeminiConfig) (*ChapterGenerateResult, error)
}

type GeminiClient struct {
	apiKey     string
	baseURL    string
	model      string
	httpClient *http.Client
}

const geminiRequestTimeout = 120 * time.Second

func NewGeminiClient(apiKey, baseURL, model string) *GeminiClient {
	return &GeminiClient{
		apiKey:     strings.TrimSpace(apiKey),
		baseURL:    strings.TrimRight(strings.TrimSpace(baseURL), "/"),
		model:      strings.TrimSpace(model),
		httpClient: &http.Client{Timeout: geminiRequestTimeout},
	}
}

func (c *GeminiClient) GenerateChapterWithConfig(ctx context.Context, prompt string, cfg GeminiConfig) (*ChapterGenerateResult, error) {
	apiKey := strings.TrimSpace(cfg.APIKey)
	baseURL := strings.TrimRight(strings.TrimSpace(cfg.BaseURL), "/")
	model := strings.TrimSpace(cfg.Model)
	if apiKey == "" {
		return nil, errors.New("gemini api key is not configured")
	}
	if baseURL == "" || model == "" {
		return nil, errors.New("gemini config is incomplete")
	}

	reqBody := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]string{
					{"text": "你是中文长篇小说写作助手。只返回 JSON，不要返回额外说明。"},
					{"text": prompt},
				},
			},
		},
		"generationConfig": map[string]interface{}{
			"responseMimeType": "application/json",
		},
	}
	if cfg.MaxOutputTokens > 0 {
		reqBody["generationConfig"].(map[string]interface{})["maxOutputTokens"] = cfg.MaxOutputTokens
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}
	url := fmt.Sprintf("%s/models/%s:generateContent", baseURL, model)
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("x-goog-api-key", apiKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrGeminiRequestFailed, err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 300 {
		return nil, fmt.Errorf("%w: status=%d body=%s", ErrGeminiRequestFailed, resp.StatusCode, string(raw))
	}

	content, usage, err := extractGeminiText(raw)
	if err != nil {
		return nil, err
	}
	content = normalizeJSONContent(content)
	out, err := decodeChapterGenerateResult(content)
	if err != nil {
		repaired, repairErr := c.repairChapterJSON(ctx, content, GeminiConfig{
			APIKey:          apiKey,
			BaseURL:         baseURL,
			Model:           model,
			MaxOutputTokens: cfg.MaxOutputTokens,
		})
		if repairErr != nil {
			log.Printf("gemini parse failed; repair failed; fallback to plain text; content_preview=%q", truncateForLog(content, 600))
			fallback := fallbackChapterResultFromText(content)
			if fallback != nil {
				fallback.Model = model
				fallback.Usage = usage
				return fallback, nil
			}
			return nil, fmt.Errorf("%w: decode chapter json failed", ErrGeminiInvalidOutput)
		}
		out, err = decodeChapterGenerateResult(repaired)
		if err != nil {
			log.Printf("gemini parse failed after repair; fallback to plain text; repaired_preview=%q", truncateForLog(repaired, 600))
			fallback := fallbackChapterResultFromText(repaired)
			if fallback != nil {
				fallback.Model = model
				fallback.Usage = usage
				return fallback, nil
			}
			return nil, fmt.Errorf("%w: decode chapter json failed", ErrGeminiInvalidOutput)
		}
	}
	out.Model = model
	out.Usage = usage
	return out, nil
}

func (c *GeminiClient) repairChapterJSON(ctx context.Context, rawContent string, cfg GeminiConfig) (string, error) {
	apiKey := strings.TrimSpace(cfg.APIKey)
	baseURL := strings.TrimRight(strings.TrimSpace(cfg.BaseURL), "/")
	model := strings.TrimSpace(cfg.Model)

	reqBody := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]string{
					{"text": "你是 JSON 修复助手。请把用户输入改写为严格 JSON，且只能输出 JSON 对象，不要输出其他文字。"},
					{"text": "请把以下内容修复为严格 JSON，且必须包含且仅包含 outline/body/summary 三个字符串字段：\n\n" + rawContent},
				},
			},
		},
		"generationConfig": map[string]interface{}{
			"responseMimeType": "application/json",
		},
	}
	if cfg.MaxOutputTokens > 0 {
		reqBody["generationConfig"].(map[string]interface{})["maxOutputTokens"] = cfg.MaxOutputTokens
	}
	body, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}
	url := fmt.Sprintf("%s/models/%s:generateContent", baseURL, model)
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("x-goog-api-key", apiKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrGeminiRequestFailed, err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	if resp.StatusCode >= 300 {
		return "", fmt.Errorf("%w: status=%d body=%s", ErrGeminiRequestFailed, resp.StatusCode, string(raw))
	}
	content, _, err := extractGeminiText(raw)
	if err != nil {
		return "", err
	}
	return normalizeJSONContent(content), nil
}

func extractGeminiText(raw []byte) (string, OpenAIUsage, error) {
	var data struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
		UsageMetadata struct {
			PromptTokenCount     int `json:"promptTokenCount"`
			CandidatesTokenCount int `json:"candidatesTokenCount"`
			TotalTokenCount      int `json:"totalTokenCount"`
		} `json:"usageMetadata"`
	}
	if err := json.Unmarshal(raw, &data); err != nil {
		return "", OpenAIUsage{}, err
	}
	if len(data.Candidates) == 0 || len(data.Candidates[0].Content.Parts) == 0 {
		return "", OpenAIUsage{}, fmt.Errorf("%w: empty candidates", ErrGeminiRequestFailed)
	}
	var b strings.Builder
	for _, p := range data.Candidates[0].Content.Parts {
		if strings.TrimSpace(p.Text) == "" {
			continue
		}
		if b.Len() > 0 {
			b.WriteString("\n")
		}
		b.WriteString(p.Text)
	}
	out := strings.TrimSpace(b.String())
	if out == "" {
		return "", OpenAIUsage{}, fmt.Errorf("%w: empty content", ErrGeminiInvalidOutput)
	}
	return out, OpenAIUsage{
		PromptTokens:     data.UsageMetadata.PromptTokenCount,
		CompletionTokens: data.UsageMetadata.CandidatesTokenCount,
		TotalTokens:      data.UsageMetadata.TotalTokenCount,
	}, nil
}

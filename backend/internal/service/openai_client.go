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

var ErrOpenAIInvalidOutput = errors.New("openai returned invalid json output")
var ErrOpenAIRequestFailed = errors.New("openai request failed")

type OpenAIUsage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

type OpenAIConfig struct {
	APIKey              string
	BaseURL             string
	Model               string
	MaxCompletionTokens int
}

type ChapterGenerateResult struct {
	Outline string `json:"outline"`
	Body    string `json:"body"`
	Summary string `json:"summary"`
	Model   string `json:"model"`
	Usage   OpenAIUsage `json:"usage"`
}

type OpenAIChapterGenerator interface {
	GenerateChapter(ctx context.Context, prompt string) (*ChapterGenerateResult, error)
	GenerateChapterWithConfig(ctx context.Context, prompt string, cfg OpenAIConfig) (*ChapterGenerateResult, error)
}

type OpenAIClient struct {
	apiKey     string
	baseURL    string
	model      string
	httpClient *http.Client
}

const openAIRequestTimeout = 120 * time.Second

func NewOpenAIClient(apiKey, baseURL, model string) *OpenAIClient {
	return &OpenAIClient{
		apiKey:     strings.TrimSpace(apiKey),
		baseURL:    strings.TrimRight(strings.TrimSpace(baseURL), "/"),
		model:      strings.TrimSpace(model),
		httpClient: &http.Client{Timeout: openAIRequestTimeout},
	}
}

func (c *OpenAIClient) GenerateChapter(ctx context.Context, prompt string) (*ChapterGenerateResult, error) {
	return c.GenerateChapterWithConfig(ctx, prompt, OpenAIConfig{
		APIKey:  c.apiKey,
		BaseURL: c.baseURL,
		Model:   c.model,
	})
}

func (c *OpenAIClient) GenerateChapterWithConfig(ctx context.Context, prompt string, cfg OpenAIConfig) (*ChapterGenerateResult, error) {
	apiKey := strings.TrimSpace(cfg.APIKey)
	baseURL := strings.TrimRight(strings.TrimSpace(cfg.BaseURL), "/")
	model := strings.TrimSpace(cfg.Model)
	if apiKey == "" {
		return nil, errors.New("openai api key is not configured")
	}
	if baseURL == "" || model == "" {
		return nil, errors.New("openai config is incomplete")
	}

	reqBody := map[string]interface{}{
		"model": model,
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
	if cfg.MaxCompletionTokens > 0 {
		reqBody["max_completion_tokens"] = cfg.MaxCompletionTokens
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, baseURL+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)
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

	content, model, usage, err := extractAssistantContent(raw)
	if err != nil {
		return nil, err
	}
	content = normalizeJSONContent(content)
	out, err := decodeChapterGenerateResult(content)
	if err != nil {
		repaired, repairErr := c.repairChapterJSON(ctx, content, OpenAIConfig{
			APIKey:  apiKey,
			BaseURL: baseURL,
			Model:   model,
		})
		if repairErr != nil {
			log.Printf("openai parse failed; repair failed; fallback to plain text; content_preview=%q", truncateForLog(content, 600))
			fallback := fallbackChapterResultFromText(content)
			if fallback != nil {
				fallback.Model = model
				fallback.Usage.PromptTokens = usage.PromptTokens
				fallback.Usage.CompletionTokens = usage.CompletionTokens
				fallback.Usage.TotalTokens = usage.TotalTokens
				return fallback, nil
			}
			return nil, fmt.Errorf("%w: decode chapter json failed", ErrOpenAIInvalidOutput)
		}
		out, err = decodeChapterGenerateResult(repaired)
		if err != nil {
			log.Printf("openai parse failed after repair; fallback to plain text; repaired_preview=%q", truncateForLog(repaired, 600))
			fallback := fallbackChapterResultFromText(repaired)
			if fallback != nil {
				fallback.Model = model
				fallback.Usage.PromptTokens = usage.PromptTokens
				fallback.Usage.CompletionTokens = usage.CompletionTokens
				fallback.Usage.TotalTokens = usage.TotalTokens
				return fallback, nil
			}
			return nil, fmt.Errorf("%w: decode chapter json failed", ErrOpenAIInvalidOutput)
		}
	}
	out.Model = model
	out.Usage.PromptTokens = usage.PromptTokens
	out.Usage.CompletionTokens = usage.CompletionTokens
	out.Usage.TotalTokens = usage.TotalTokens
	return out, nil
}

func (c *OpenAIClient) repairChapterJSON(ctx context.Context, rawContent string, cfg OpenAIConfig) (string, error) {
	apiKey := strings.TrimSpace(cfg.APIKey)
	baseURL := strings.TrimRight(strings.TrimSpace(cfg.BaseURL), "/")
	model := strings.TrimSpace(cfg.Model)
	reqBody := map[string]interface{}{
		"model": model,
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": "你是 JSON 修复助手。请把用户输入改写为严格 JSON，且只能输出 JSON 对象，不要输出其他文字。",
			},
			{
				"role": "user",
				"content": "请把以下内容修复为严格 JSON，且必须包含且仅包含 outline/body/summary 三个字符串字段：\n\n" +
					rawContent,
			},
		},
		"response_format": map[string]string{
			"type": "json_object",
		},
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, baseURL+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrOpenAIRequestFailed, err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	if resp.StatusCode >= 300 {
		return "", fmt.Errorf("%w: status=%d body=%s", ErrOpenAIRequestFailed, resp.StatusCode, string(raw))
	}
	content, _, _, err := extractAssistantContent(raw)
	if err != nil {
		return "", err
	}
	return normalizeJSONContent(content), nil
}

func extractAssistantContent(raw []byte) (string, string, OpenAIUsage, error) {
	var data struct {
		Model string `json:"model"`
		Usage OpenAIUsage `json:"usage"`
		Choices []struct {
			Message struct {
				Content interface{} `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(raw, &data); err != nil {
		return "", "", data.Usage, err
	}
	if len(data.Choices) == 0 {
		return "", data.Model, data.Usage, fmt.Errorf("%w: empty choices", ErrOpenAIRequestFailed)
	}

	content := data.Choices[0].Message.Content
	switch v := content.(type) {
	case string:
		return strings.TrimSpace(v), data.Model, data.Usage, nil
	case []interface{}:
		var b strings.Builder
		for _, part := range v {
			obj, ok := part.(map[string]interface{})
			if !ok {
				continue
			}
			// Compatible with providers that return content parts like:
			// [{"type":"text","text":"..."}]
			if text, ok := obj["text"].(string); ok && strings.TrimSpace(text) != "" {
				if b.Len() > 0 {
					b.WriteString("\n")
				}
				b.WriteString(text)
			}
		}
		out := strings.TrimSpace(b.String())
		if out == "" {
			return "", data.Model, data.Usage, fmt.Errorf("%w: empty content parts", ErrOpenAIInvalidOutput)
		}
		return out, data.Model, data.Usage, nil
	default:
		return "", data.Model, data.Usage, fmt.Errorf("%w: unsupported content type", ErrOpenAIInvalidOutput)
	}
}

func normalizeJSONContent(content string) string {
	content = strings.TrimSpace(content)
	content = strings.TrimPrefix(content, "```json")
	content = strings.TrimPrefix(content, "```JSON")
	content = strings.TrimPrefix(content, "```")
	content = strings.TrimSuffix(content, "```")
	content = strings.TrimSpace(content)

	start := strings.Index(content, "{")
	end := strings.LastIndex(content, "}")
	if start >= 0 && end > start {
		return content[start : end+1]
	}
	return content
}

func decodeChapterGenerateResult(content string) (*ChapterGenerateResult, error) {
	content = strings.TrimSpace(content)
	if content == "" {
		return nil, fmt.Errorf("%w: empty content", ErrOpenAIInvalidOutput)
	}

	var direct ChapterGenerateResult
	if err := json.Unmarshal([]byte(content), &direct); err == nil {
		direct.Outline = strings.TrimSpace(direct.Outline)
		direct.Body = strings.TrimSpace(direct.Body)
		direct.Summary = strings.TrimSpace(direct.Summary)
		if direct.Outline != "" && direct.Body != "" && direct.Summary != "" {
			return &direct, nil
		}
	}

	var generic map[string]interface{}
	if err := json.Unmarshal([]byte(content), &generic); err != nil {
		return nil, fmt.Errorf("%w: invalid json object", ErrOpenAIInvalidOutput)
	}

	outline := pickTextValue(generic, "outline", "大纲", "chapter_outline")
	body := pickTextValue(generic, "body", "正文", "content", "chapter_body")
	summary := pickTextValue(generic, "summary", "总结", "chapter_summary")

	// Some providers wrap the actual payload inside a field.
	if (outline == "" || body == "" || summary == "") && len(generic) > 0 {
		for _, v := range generic {
			switch vv := v.(type) {
			case string:
				if strings.Contains(vv, "{") && strings.Contains(vv, "}") {
					if nested, err := decodeChapterGenerateResult(normalizeJSONContent(vv)); err == nil {
						return nested, nil
					}
				}
			}
		}
	}

	if outline == "" || body == "" || summary == "" {
		return nil, fmt.Errorf("%w: missing required fields", ErrOpenAIInvalidOutput)
	}

	return &ChapterGenerateResult{
		Outline: outline,
		Body:    body,
		Summary: summary,
	}, nil
}

func pickTextValue(m map[string]interface{}, keys ...string) string {
	for _, key := range keys {
		v, ok := m[key]
		if !ok {
			continue
		}
		if s := anyToText(v); s != "" {
			return s
		}
	}
	return ""
}

func anyToText(v interface{}) string {
	switch vv := v.(type) {
	case string:
		return strings.TrimSpace(vv)
	case []interface{}:
		lines := make([]string, 0, len(vv))
		for _, item := range vv {
			if s := strings.TrimSpace(anyToText(item)); s != "" {
				lines = append(lines, s)
			}
		}
		return strings.TrimSpace(strings.Join(lines, "\n"))
	default:
		return ""
	}
}

func truncateForLog(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max] + "...(truncated)"
}

func fallbackChapterResultFromText(raw string) *ChapterGenerateResult {
	text := strings.TrimSpace(raw)
	text = strings.TrimPrefix(text, "```")
	text = strings.TrimSuffix(text, "```")
	text = strings.TrimSpace(text)
	if text == "" {
		return nil
	}

	// Keep a short outline/summary and preserve full text in body.
	outline := "自动提取：模型未返回标准 JSON，已回退为文本结果。"
	summary := firstNRunes(text, 120)
	if summary == "" {
		summary = "自动提取：请手动补充总结。"
	}
	return &ChapterGenerateResult{
		Outline: outline,
		Body:    text,
		Summary: summary,
	}
}

func firstNRunes(s string, n int) string {
	if n <= 0 {
		return ""
	}
	r := []rune(strings.TrimSpace(s))
	if len(r) == 0 {
		return ""
	}
	if len(r) <= n {
		return string(r)
	}
	return string(r[:n])
}

package service

import "testing"

func TestExtractAssistantContent(t *testing.T) {
	rawString := []byte(`{"choices":[{"message":{"content":"{\"outline\":\"a\",\"body\":\"b\",\"summary\":\"c\"}"}}]}`)
	got, _, _, err := extractAssistantContent(rawString)
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	if got == "" {
		t.Fatal("expected non-empty content from string")
	}

	rawParts := []byte(`{"choices":[{"message":{"content":[{"type":"text","text":"{\"outline\":\"a\",\"body\":\"b\",\"summary\":\"c\"}"}]}}]}`)
	got, _, _, err = extractAssistantContent(rawParts)
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	if got == "" {
		t.Fatal("expected non-empty content from parts")
	}
}

func TestNormalizeJSONContent(t *testing.T) {
	cases := []struct {
		name string
		in   string
		want string
	}{
		{
			name: "plain json",
			in:   `{"outline":"a","body":"b","summary":"c"}`,
			want: `{"outline":"a","body":"b","summary":"c"}`,
		},
		{
			name: "json code fence",
			in: "```json\n{\"outline\":\"a\",\"body\":\"b\",\"summary\":\"c\"}\n```",
			want: `{"outline":"a","body":"b","summary":"c"}`,
		},
		{
			name: "extra text around json",
			in:   "以下是结果：\n{\"outline\":\"a\",\"body\":\"b\",\"summary\":\"c\"}\n请查收",
			want: `{"outline":"a","body":"b","summary":"c"}`,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := normalizeJSONContent(tc.in)
			if got != tc.want {
				t.Fatalf("want %q, got %q", tc.want, got)
			}
		})
	}
}

func TestDecodeChapterGenerateResult(t *testing.T) {
	t.Run("english keys", func(t *testing.T) {
		got, err := decodeChapterGenerateResult(`{"outline":"a","body":"b","summary":"c"}`)
		if err != nil {
			t.Fatalf("unexpected err: %v", err)
		}
		if got.Outline != "a" || got.Body != "b" || got.Summary != "c" {
			t.Fatalf("unexpected result: %#v", got)
		}
	})

	t.Run("chinese keys", func(t *testing.T) {
		got, err := decodeChapterGenerateResult(`{"大纲":"甲","正文":"乙","总结":"丙"}`)
		if err != nil {
			t.Fatalf("unexpected err: %v", err)
		}
		if got.Outline != "甲" || got.Body != "乙" || got.Summary != "丙" {
			t.Fatalf("unexpected result: %#v", got)
		}
	})

	t.Run("nested json string", func(t *testing.T) {
		got, err := decodeChapterGenerateResult(`{"result":"{\"outline\":\"x\",\"body\":\"y\",\"summary\":\"z\"}"}`)
		if err != nil {
			t.Fatalf("unexpected err: %v", err)
		}
		if got.Outline != "x" || got.Body != "y" || got.Summary != "z" {
			t.Fatalf("unexpected result: %#v", got)
		}
	})

	t.Run("array values", func(t *testing.T) {
		got, err := decodeChapterGenerateResult(`{"outline":["一","二"],"body":["甲","乙"],"summary":"丙"}`)
		if err != nil {
			t.Fatalf("unexpected err: %v", err)
		}
		if got.Outline != "一\n二" || got.Body != "甲\n乙" || got.Summary != "丙" {
			t.Fatalf("unexpected result: %#v", got)
		}
	})
}

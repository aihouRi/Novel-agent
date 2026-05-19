package domain

import "time"

type LoreEntry struct {
	ID            int64     `json:"id"`
	NovelID       int64     `json:"novel_id"`
	Category      string    `json:"category"`
	Name          string    `json:"name"`
	Description   string    `json:"description"`
	RulesOrLimits string    `json:"rules_or_limits"`
	Tags          string    `json:"tags"`
	CharacterIDs  []int64   `json:"character_ids"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

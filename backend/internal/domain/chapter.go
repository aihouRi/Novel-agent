package domain

import "time"

type Chapter struct {
	ID                    int64     `json:"id"`
	NovelID               int64     `json:"novel_id"`
	VolumeID              int64     `json:"volume_id"`
	ChapterNumber         int       `json:"chapter_number"`
	Title                 string    `json:"title"`
	Body                  string    `json:"body"`
	WordCount             int       `json:"word_count"`
	GenerationInstruction string    `json:"generation_instruction"`
	Outline               string    `json:"outline"`
	Summary               string    `json:"summary"`
	CreatedAt             time.Time `json:"created_at"`
	UpdatedAt             time.Time `json:"updated_at"`
}

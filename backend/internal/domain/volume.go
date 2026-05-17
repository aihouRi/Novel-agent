package domain

import "time"

type Volume struct {
	ID           int64     `json:"id"`
	NovelID      int64     `json:"novel_id"`
	VolumeNumber int       `json:"volume_number"`
	Title        string    `json:"title"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

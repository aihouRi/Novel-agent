package domain

import "time"

type Novel struct {
	ID                 int64     `json:"id"`
	UserID             int64     `json:"user_id"`
	Title              string    `json:"title"`
	Genre              string    `json:"genre"`
	Language           string    `json:"language"`
	StyleProfile       string    `json:"style_profile"`
	Worldview          string    `json:"worldview"`
	PowerSystem        string    `json:"power_system"`
	MainPlot           string    `json:"main_plot"`
	WritingRules       string    `json:"writing_rules"`
	ForbiddenRules     string    `json:"forbidden_rules"`
	RecentChapterCount int       `json:"recent_chapter_count"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

package domain

import "time"

type Character struct {
	ID                     int64     `json:"id"`
	NovelID                int64     `json:"novel_id"`
	Name                   string    `json:"name"`
	Aliases                string    `json:"aliases"`
	Role                   string    `json:"role"`
	Personality            string    `json:"personality"`
	RealmOrAbility         string    `json:"realm_or_ability"`
	Goal                   string    `json:"goal"`
	Relationships          string    `json:"relationships"`
	SpeechStyle            string    `json:"speech_style"`
	FirstAppearanceChapter int       `json:"first_appearance_chapter"`
	LastAppearanceChapter  int       `json:"last_appearance_chapter"`
	Memo                   string    `json:"memo"`
	CreatedAt              time.Time `json:"created_at"`
	UpdatedAt              time.Time `json:"updated_at"`
}

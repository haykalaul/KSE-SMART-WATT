package entity

import (
	"database/sql"

	"gorm.io/gorm"
)

type Users struct {
	gorm.Model
	Name           string `gorm:"type:varchar(100);not null"`
	Email          string `gorm:"type:varchar(100);unique;not null"`
	Password       string `gorm:"type:varchar(100);not null"`
	EmailVerfiedAt sql.NullTime
	Premium        bool `gorm:"default:false"`
}

type UsersResponse struct {
	ID      uint `json:"id"`
	Name    string `json:"name"`
	Email   string `json:"email"`
	Premium bool   `json:"premium"`
}

type UsersRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Premium  bool   `json:"premium"`
}

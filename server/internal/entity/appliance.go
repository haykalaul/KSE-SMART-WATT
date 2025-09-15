package entity

import (
	"gorm.io/gorm"
)

type Appliance struct {
	gorm.Model
	Name           string
	Type           string
	Location       string
	Power          int
	UsageToday     float64
	Energy         float64
	Cost           float64
	Status         string
	Connectivity   string
	AverageUsage   float64
	DailyUseTarget float64
	Priority       bool
}

type ApplianceRequest struct {
	Name                string   `json:"name"`
	Type                string   `json:"type"`
	Location            string   `json:"location"`
	Power               int      `json:"power"`
	UsageToday          float64  `json:"usage_today"`
	Energy              float64  `json:"energy"`
	Cost                float64  `json:"cost"`
	Status              string   `json:"status"`
	Connectivity        string   `json:"connectivity"`
	AverageUsage        float64  `json:"average_usage"`
	DailyUseTarget      float64  `json:"daily_use_target"`
	Priority            bool     `json:"priority"`
	MonthlyUse          float64  `json:"monthly_use"`
	RecommendedSchedule []string `json:"recommended_schedule"`
}

type ApplianceResponse struct {
	ID                  uint     `json:"id"`
	Name                string   `json:"name"`
	Type                string   `json:"type"`
	Location            string   `json:"location"`
	Power               int      `json:"power"`
	UsageToday          float64  `json:"usage_today"`
	Energy              float64  `json:"energy"`
	Cost                float64  `json:"cost"`
	Status              string   `json:"status"`
	Connectivity        string   `json:"connectivity"`
	AverageUsage        float64  `json:"average_usage"`
	DailyUseTarget      float64  `json:"daily_use_target"`
	Priority            bool     `json:"priority"`
	MonthlyUse          float64  `json:"monthly_use"`
	RecommendedSchedule []string `json:"recommended_schedule"`
}

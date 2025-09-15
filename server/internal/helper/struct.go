package helper

type DailySummary struct {
	ApplianceName string
	Type          string
	Message       string
	Info          string
	IsOveruse     bool
	Usage         float64
	Target        float64
}

type Recommendations struct {
	Name    string
	Message []string
}

// GEMINI AI RESPONSE
type GeminiResponse struct {
	Candidates    []Candidate   `json:"candidates"`
	ModelVersion  string        `json:"modelVersion"`
	UsageMetadata UsageMetadata `json:"usageMetadata"`
}

type Candidate struct {
	AvgLogprobs  float64 `json:"avgLogprobs"`
	Content      Content `json:"content"`
	FinishReason string  `json:"finishReason"`
}

type Content struct {
	Parts []Part `json:"parts"`
	Role  string `json:"role"`
}

type Part struct {
	Text string `json:"text"`
}

type UsageMetadata struct {
	CandidatesTokenCount int `json:"candidatesTokenCount"`
	PromptTokenCount     int `json:"promptTokenCount"`
	TotalTokenCount      int `json:"totalTokenCount"`
}

type OTP struct {
	Email string `json:"email"`
	OTP   string `json:"otp"`
}

type DailyTarget struct {
	Name   string `json:"name"`
	Target int    `json:"target"`
}

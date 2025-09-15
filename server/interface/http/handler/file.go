package handler

import (
	"bytes"
	"encoding/json"
	"math"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"

	"smart-home-energy-management-server/internal/entity"
	"smart-home-energy-management-server/internal/helper"
	"smart-home-energy-management-server/internal/service"

	"github.com/gin-gonic/gin"
)

type fileHandler struct {
	applianceService      service.ApplianceService
	fileService           service.FileService
	recommendationService service.RecommendationService
}

func NewFileHandler(applianceService service.ApplianceService, fileService service.FileService, recommendationService service.RecommendationService) fileHandler {
	return fileHandler{
		applianceService:      applianceService,
		fileService:           fileService,
		recommendationService: recommendationService,
	}
}

func (h *fileHandler) UploadFileCSV(c *gin.Context) {
	var inputs struct {
		URL string `json:"url"`
	}

	// Bind request body ke struct inputs
	err := c.ShouldBindJSON(&inputs)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":     false,
			"statusCode": 400,
			"message":    err.Error(),
		})
		return
	}

	// Membaca file CSV
	result, err := helper.ReadCSV(inputs.URL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":     false,
			"statusCode": 500,
			"message":    err.Error(),
		})
		return
	}

	// Parsing CSV ke struct
	appliances, err := helper.ParseCSVtoSliceOfStruct(inputs.URL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":     false,
			"statusCode": 500,
			"message":    err.Error(),
		})
		return
	}

	// Simpan data ke database
	var wg sync.WaitGroup
	var errors []string
	var mu sync.Mutex

	// Truncate table appliances
	h.applianceService.TruncateAppliances()
	for i := 0; i < len(appliances); i++ {
		// Goroutine untuk insert data ke database
		wg.Add(1)
		go func(appliance entity.ApplianceRequest) {
			defer wg.Done()
			_, err := h.applianceService.CreateAppliance(&appliance)
			if err != nil {
				mu.Lock()
				errors = append(errors, err.Error())
				mu.Unlock()
			}
		}(appliances[i])
	}

	wg.Wait()

	if len(errors) > 0 {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":     false,
			"statusCode": 500,
			"message":    errors,
		})
		return
	}

	// Marshal result ke JSON
	jsonResult, err := json.Marshal(result)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":     false,
			"statusCode": 500,
			"message":    err.Error(),
		})
		return
	}

	// Simpan table ke redis
	if err = h.fileService.SaveTable(string(jsonResult)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":     false,
			"statusCode": 500,
			"message":    err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":     true,
		"statusCode": 200,
		"message":    "Upload table success",
		"data":       result,
	})
}

func (h *fileHandler) GetTable(c *gin.Context) {
	// Mendapatkan table dari redis cache
	table, err := h.fileService.GetTable()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":     false,
			"statusCode": 500,
			"message":    err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":     true,
		"statusCode": 200,
		"message":    "Get table success",
		"data":       table,
	})
}

func (h *fileHandler) Chat(c *gin.Context) {
	// Mendapatkan URL dan Token dari environment variable
	baseUrl := os.Getenv("GEMINI_API_URL")
	token := os.Getenv("GEMINI_API_KEY")

	var inputs struct {
		Question string `json:"question"`
	}

	// Bind request body ke struct inputs
	err := c.ShouldBindJSON(&inputs)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":     false,
			"statusCode": 400,
			"message":    err.Error(),
		})
		return
	}

	// Membuat request ke Gemini API
	geminiReq, err := json.Marshal(map[string][]map[string]map[string]string{"contents": {{"parts": {"text": inputs.Question}}}})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":     false,
			"statusCode": 500,
			"message":    err.Error(),
		})
		return
	}

	// Membuat URL dengan query params
	u, _ := url.Parse(baseUrl)
	queryParams := u.Query()
	queryParams.Set("key", token)
	u.RawQuery = queryParams.Encode()

	// Membuat request ke Gemini API
	req, err := http.NewRequest("POST", u.String(), bytes.NewBuffer(geminiReq))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":     false,
			"statusCode": 500,
			"message":    err.Error(),
		})
		return
	}

	req.Header.Set("Content-Type", "application/json")

	// Mengirim request ke Gemini API
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":     false,
			"statusCode": 500,
			"message":    err.Error(),
		})
		return
	}

	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		c.JSON(resp.StatusCode, gin.H{
			"status":     false,
			"statusCode": resp.StatusCode,
			"message":    "Request to Gemini API failed",
		})
		return
	}

	// Decode response dari Gemini
	var result helper.GeminiResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":     false,
			"statusCode": 500,
			"message":    err.Error(),
		})
		return
	}

	// Return hasil dari Gemini API
	c.JSON(http.StatusOK, gin.H{
		"status":     true,
		"statusCode": 200,
		"message":    "Request to Gemini API successful",
		"data":       strings.Split(result.Candidates[0].Content.Parts[0].Text, "\n")[0],
	})
}

func (h *fileHandler) TapasChat(c *gin.Context) {
	// Mendapatkan URL dan Token dari environment variable
	tapasURL := os.Getenv("HUGGINGFACE_API_TAPAS_URL")
	marianmtURL := os.Getenv("HUGGINGFACE_API_MARIANMT_URL")
	token := os.Getenv("HUGGINGFACE_API_TOKEN")

	var inputs struct {
		Query string              `json:"query"`
		Table map[string][]string `json:"table"`
	}

	// Bind request body ke struct inputs
	err := c.ShouldBindJSON(&inputs)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":     false,
			"statusCode": 400,
			"message":    err.Error(),
		})
		return
	}

	// Mendapatkan table dari redis cache
	inputs.Table, err = h.fileService.GetTable()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":     false,
			"statusCode": 500,
			"message":    err.Error() + " Error get table",
		})
		return
	}

	// Membuat request ke Hugging Face API MarianMT untuk menerjemahkan query
	question := inputs.Query
	marianmtBody, err := json.Marshal(map[string]string{"inputs": inputs.Query})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":     false,
			"statusCode": 500,
			"message":    err.Error() + " Error marshal MarianMT body",
		})
		return
	}

	// Membuat request untuk MarianMT API
	marianmtReq, err := http.NewRequest("POST", marianmtURL, bytes.NewBuffer(marianmtBody))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":     false,
			"statusCode": 500,
			"message":    err.Error() + " Error create MarianMT request",
		})
		return
	}

	marianmtReq.Header.Set("Authorization", "Bearer "+token)
	marianmtReq.Header.Set("Content-Type", "application/json")

	// Mengirim request ke MarianMT API untuk menerjemahkan query
	client := &http.Client{}
	marianmtResp, err := client.Do(marianmtReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":     false,
			"statusCode": 500,
			"message":    err.Error() + " Error do MarianMT request",
		})
		return
	}
	defer marianmtResp.Body.Close()

	// Decode response dari MarianMT (harus array of string)
	var marianmtResult []map[string]interface{}
	if err := json.NewDecoder(marianmtResp.Body).Decode(&marianmtResult); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":     false,
			"statusCode": 500,
			"data":       marianmtResult,
			"message":    err.Error() + " Error decode MarianMT response",
		})
		return
	}

	// Ambil terjemahan query dari MarianMT response
	translatedQuery := marianmtResult[0]["translation_text"].(string)

	// Update inputs.Query dengan hasil terjemahan
	inputs.Query = translatedQuery

	// Membuat request ke Hugging Face API TAPAS
	tapasBody, err := json.Marshal(inputs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":     false,
			"statusCode": 500,
			"message":    err.Error() + " Error marshal TAPAS body",
		})
		return
	}

	// Membuat request ke TAPAS API
	tapasReq, err := http.NewRequest("POST", tapasURL, bytes.NewBuffer(tapasBody))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":     false,
			"statusCode": 500,
			"message":    err.Error() + " Error create TAPAS request",
		})
		return
	}

	tapasReq.Header.Set("Authorization", "Bearer "+token)
	tapasReq.Header.Set("Content-Type", "application/json")

	// Mengirim request ke TAPAS API
	tapasResp, err := client.Do(tapasReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":     false,
			"statusCode": 500,
			"message":    err.Error() + " Error do TAPAS request",
		})
		return
	}
	defer tapasResp.Body.Close()

	// Decode response dari TAPAS
	var tapasResult map[string]interface{}
	if err := json.NewDecoder(tapasResp.Body).Decode(&tapasResult); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":     false,
			"statusCode": 500,
			"message":    err.Error() + " Error decode TAPAS response",
		})
		return
	}

	// Return hasil dari TAPAS API
	c.JSON(http.StatusOK, gin.H{
		"status":     true,
		"statusCode": 200,
		"message":    "Request to Hugging Face API successful",
		"data": map[string]interface{}{
			"question": question,
			"answer":   tapasResult["answer"],
		},
	})
}

func (h *fileHandler) GetAppliance(c *gin.Context) {
	appliances, err := h.applianceService.GetAllAppliances()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":     false,
			"statusCode": 500,
			"message":    err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":     true,
		"statusCode": 200,
		"message":    "Get appliances success",
		"data":       appliances,
	})
}

func (h *fileHandler) GetAllAppliance(c *gin.Context) {
	result, err := h.fileService.GetTable()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":     false,
			"statusCode": 500,
			"message":    err.Error() + " Error get table",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":     true,
		"statusCode": 200,
		"message":    "Get all appliances success",
		"data":       result,
	})
}

func (h *fileHandler) GenerateMonthlyRecommendations(c *gin.Context) {
	var userInputs struct {
		Golongan   string  `json:"golongan"` // INPUT
		Tarif      float64 `json:"tarif"`
		MaksBiaya  float64 `json:"maks_biaya"` // INPUT
		MaksEnergi float64 `json:"maks_energi"`
		Tanggal    string  `json:"tanggal"` // INPUT
		Hari       int     `json:"hari"`
	}

	err := c.ShouldBindJSON(&userInputs)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":     false,
			"statusCode": 400,
			"message":    err.Error(),
		})
		return
	}

	userInputs.Tarif = helper.GetTarif(userInputs.Golongan)
	userInputs.MaksEnergi = userInputs.MaksBiaya / userInputs.Tarif
	userInputs.Hari, _ = helper.JumlahHariDalamBulan(userInputs.Tanggal)
	appliances, err := h.applianceService.GetAllAppliances()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":     false,
			"statusCode": 500,
			"message":    err.Error(),
		})
		return
	}

	result := helper.PrintRecommendationsMonthlyUsage(appliances, userInputs.Tarif, userInputs.Hari, userInputs.MaksEnergi)

	if err = h.recommendationService.SaveRecommendation(result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":     false,
			"statusCode": 500,
			"message":    err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":     true,
		"statusCode": 200,
		"message":    "Recommendations generated",
		"data":       result,
	})
}

func (h *fileHandler) GenerateDailyRecommendations(c *gin.Context) {
	var userInputs struct {
		Golongan string  `json:"golongan"` // INPUT
		Tarif    float64 `json:"tarif"`
	}

	err := c.ShouldBindJSON(&userInputs)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":     false,
			"statusCode": 400,
			"message":    err.Error(),
		})
		return
	}

	userInputs.Tarif = helper.GetTarif(userInputs.Golongan)

	appliances, err := h.applianceService.GetAllAppliances()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":     false,
			"statusCode": 500,
			"message":    err.Error(),
		})
		return
	}

	analysisResult := helper.PrintRecommendationsDailyUsage(appliances, userInputs.Tarif)

	// Rekomendasi penggunaan
	var recommendation []helper.Recommendations
	for _, appliance := range appliances {
		var result helper.Recommendations

		hoursRemaining := math.Max(0, appliance.DailyUseTarget-appliance.UsageToday)
		if hoursRemaining > 0 {
			result.Name, result.Message = helper.RecommendationsDailyUsage(appliance, hoursRemaining, userInputs.Tarif)
			recommendation = append(recommendation, result)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status":     true,
		"statusCode": 200,
		"message":    "Recommendations generated",
		"data": struct {
			AnalysisResult []helper.DailySummary    `json:"analysis-result"`
			Recommendation []helper.Recommendations `json:"recommendation"`
		}{
			AnalysisResult: analysisResult,
			Recommendation: recommendation,
		},
	})
}

func (h *fileHandler) SetDailyTarget(c *gin.Context) {
	var dailyTarget struct {
		Data  []helper.DailyTarget `json:"data"`
		Email string               `json:"email"`
	}

	if err := c.ShouldBindJSON(&dailyTarget); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"statusCode": 400,
			"status":     false,
			"data":       dailyTarget.Data,
			"message":    err.Error(),
		})
		return
	}

	appliances, err := h.applianceService.SetDailyTarget(dailyTarget.Data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"statusCode": 500,
			"status":     false,
			"data":       dailyTarget.Data,
			"message":    "Failed to set daily target",
		})
		return
	}

	dailyTargetJSON, err := json.Marshal(dailyTarget.Data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"statusCode": 500,
			"status":     false,
			"data":       dailyTarget.Data,
			"message":    "Failed to marshal daily target",
		})
		return
	}

	err = h.applianceService.SaveDailyTarget(string(dailyTargetJSON), dailyTarget.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"statusCode": 500,
			"status":     false,
			"data":       dailyTarget.Data,
			"message":    "Failed to save daily target",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":     true,
		"statusCode": 200,
		"message":    "Daily target set successfully",
		"data":       dailyTarget.Data,
		"appliances": appliances,
	})
}

func (h *fileHandler) GetDailyTarget(c *gin.Context) {
	var Payload struct {
		Email string `json:"email"`
	}

	if err := c.ShouldBindJSON(&Payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"statusCode": 400,
			"status":     false,
			"message":    err.Error(),
		})
		return
	}

	dailyTarget, err := h.applianceService.GetDailyTarget(Payload.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"statusCode": 500,
			"status":     false,
			"message":    "Failed to get daily target",
		})
		return
	}

	var dailyTargetJSON []helper.DailyTarget
	if err = json.Unmarshal([]byte(dailyTarget), &dailyTargetJSON); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"statusCode": 500,
			"status":     false,
			"message":    "Failed to unmarshal daily target",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":     true,
		"statusCode": 200,
		"message":    "Get daily target success",
		"data":       dailyTargetJSON,
	})
}

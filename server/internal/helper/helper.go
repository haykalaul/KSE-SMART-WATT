package helper

import (
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"net/smtp"
	"os"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"
	"unicode"

	"smart-home-energy-management-server/internal/entity"

	"github.com/golang-jwt/jwt"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var mode = os.Getenv("MODE")

func StorageIsExist(path string) error {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return os.MkdirAll(path, os.ModePerm)
	}
	return nil
}

func ReadCSV(fileURL string) (map[string][]string, error) {
	// Unduh file dari URL
	response, err := http.Get(fileURL)
	if err != nil {
		return nil, fmt.Errorf("error fetching file from URL: %w", err)
	}
	defer response.Body.Close()

	// Cek status HTTP
	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch file: %s", response.Status)
	}

	// Membaca CSV langsung dari response body
	reader := csv.NewReader(response.Body)
	// Read header first
	header, err := reader.Read()
	if err != nil {
		return nil, fmt.Errorf("error reading CSV header: %w", err)
	}

	if len(header) == 0 {
		return nil, errors.New("csv header is empty")
	}

	result := make(map[string][]string)
	for _, col := range header {
		result[col] = []string{}
	}

	// Read remaining records one by one to be defensive against malformed rows
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			// Log and continue to try to parse other rows
			log.Printf("warning: error reading csv row: %v", err)
			continue
		}

		for i := 0; i < len(header); i++ {
			var val string
			if i < len(record) {
				val = record[i]
			} else {
				val = ""
			}
			result[header[i]] = append(result[header[i]], val)
		}
	}

	return result, nil
}

func ParseCSVtoSliceOfStruct(fileURL string) ([]entity.ApplianceRequest, error) {
	// Unduh file dari URL
	response, err := http.Get(fileURL)
	if err != nil {
		return nil, fmt.Errorf("error fetching file from URL: %w", err)
	}
	defer response.Body.Close()

	// Cek status HTTP
	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch file: %s", response.Status)
	}

	// Membaca CSV langsung dari response body
	reader := csv.NewReader(response.Body)
	// Membaca header
	header, err := reader.Read()
	if err != nil {
		return nil, fmt.Errorf("error reading csv header: %w", err)
	}

	loweredHeader := make([]string, len(header))
	for i, h := range header {
		loweredHeader[i] = strings.ToLower(strings.TrimSpace(h))
	}

	// Determine schema: simplified or detailed
	// Simplified columns we expect: appliance (or device/name) and energy (or energy_consumption)
	idxAppliance := -1
	idxEnergy := -1
	idxPower := -1
	idxDuration := -1
	idxCost := -1
	idxType := -1
	idxLocation := -1
	idxStatus := -1
	idxConnectivity := -1

	for i, h := range loweredHeader {
		switch {
		case strings.Contains(h, "appliance") || strings.Contains(h, "device") || strings.Contains(h, "name"):
			if idxAppliance == -1 {
				idxAppliance = i
			}
		case strings.Contains(h, "energy") || strings.Contains(h, "energy_consumption") || strings.Contains(h, "kwh"):
			if idxEnergy == -1 {
				idxEnergy = i
			}
		case strings.Contains(h, "power"):
			if idxPower == -1 {
				idxPower = i
			}
		case strings.Contains(h, "duration") || strings.Contains(h, "usage"):
			if idxDuration == -1 {
				idxDuration = i
			}
		case strings.Contains(h, "cost") || strings.Contains(h, "price"):
			if idxCost == -1 {
				idxCost = i
			}
		case strings.Contains(h, "type"):
			if idxType == -1 {
				idxType = i
			}
		case strings.Contains(h, "location") || strings.Contains(h, "room"):
			if idxLocation == -1 {
				idxLocation = i
			}
		case strings.Contains(h, "status"):
			if idxStatus == -1 {
				idxStatus = i
			}
		case strings.Contains(h, "connect"):
			if idxConnectivity == -1 {
				idxConnectivity = i
			}
		}
	}

	var appliances []entity.ApplianceRequest
	deviceDurations := make(map[string][]float64)
	seenNames := make(map[string]bool)

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Printf("warning: skipping csv row due to read error: %v", err)
			continue
		}

		// retrieve values safely by index
		get := func(idx int) string {
			if idx >= 0 && idx < len(record) {
				return strings.TrimSpace(record[idx])
			}
			return ""
		}

		deviceName := get(idxAppliance)
		if deviceName == "" {
			// fallback: if there is a Date,Time,Appliance simple schema, appliance may be at index 2
			if len(record) > 2 {
				deviceName = strings.TrimSpace(record[2])
			}
		}

		// energy
		var energy float64
		if idxEnergy >= 0 {
			energy, err = strconv.ParseFloat(get(idxEnergy), 64)
			if err != nil {
				log.Printf("warning: invalid energy for device %s: %v", deviceName, err)
				continue
			}
		} else if len(record) > 3 {
			// if simple schema: Date,Time,Appliance,Energy_Consumption,...
			energy, err = strconv.ParseFloat(strings.TrimSpace(record[3]), 64)
			if err != nil {
				log.Printf("warning: invalid energy (fallback) for device %s: %v", deviceName, err)
				continue
			}
		}

		// power
		var powerInt int
		if idxPower >= 0 {
			powerInt, _ = strconv.Atoi(get(idxPower))
		}

		// duration
		var duration float64
		if idxDuration >= 0 {
			duration, _ = strconv.ParseFloat(get(idxDuration), 64)
		}

		// cost
		var cost float64
		if idxCost >= 0 {
			cost, _ = strconv.ParseFloat(get(idxCost), 64)
		}

		// other fields
		typ := get(idxType)
		loc := get(idxLocation)
		status := get(idxStatus)
		conn := get(idxConnectivity)

		// If appliance name still empty, skip
		if deviceName == "" {
			log.Printf("warning: skipping row with empty appliance name: %v", record)
			continue
		}

		// For duration fallback set to 0 if missing
		// priority: example rule power > 500
		priority := powerInt > 500

		// If appliance already seen, append duration/energy
		if seenNames[deviceName] {
			deviceDurations[deviceName] = append(deviceDurations[deviceName], duration)
			continue
		}

		seenNames[deviceName] = true

		appliance := entity.ApplianceRequest{
			Name:         deviceName,
			Type:         typ,
			Location:     loc,
			Power:        powerInt,
			Energy:       energy,
			Cost:         cost,
			Status:       status,
			Connectivity: conn,
			Priority:     priority,
		}

		deviceDurations[deviceName] = append(deviceDurations[deviceName], duration)
		appliances = append(appliances, appliance)
	}

	// Tambahkan AverageUsage untuk setiap appliance
	for i := range appliances {
		deviceName := appliances[i].Name
		durations := deviceDurations[deviceName]
		if len(durations) > 0 {
			var totalDuration float64
			for _, d := range durations {
				totalDuration += d
			}
			averageUsage := totalDuration / float64(len(durations))
			appliances[i].UsageToday = totalDuration
			appliances[i].AverageUsage = averageUsage
		}
	}

	return appliances, nil
}

func GetTarif(golongan string) float64 {
	switch golongan {
	case "Subsidi daya 450 VA":
		return 415.00
	case "Subsidi daya 900 VA":
		return 605.00
	case "R-1/TR daya 900 VA":
		return 1352.00
	case "R-1/TR daya 1300 VA":
		return 1444.70
	case "R-1/TR daya 2200 VA":
		return 1444.70
	case "R-2/TR daya 3500 VA - 5500 VA":
		return 1699.53
	case "R-3/TR daya 6600 VA ke atas":
		return 1699.53
	case "B-2/TR daya 6600 VA - 200 kVA":
		return 1444.70
	case "B-3/TM daya di atas 200 kVA":
		return 1114.74
	case "I-3/TM daya di atas 200 kVA":
		return 1114.74
	case "I-4/TT daya 30.000 kVA ke atas":
		return 996.74
	case "P-1/TR daya 6600 VA - 200 kVA":
		return 1699.53
	case "P-2/TM daya di atas 200 kVA":
		return 1522.88
	case "P-3/TR penerangan jalan umum":
		return 1699.53
	case "L/TR", "L/TM", "L/TT":
		return 1644.00
	default:
		return -1
	}
}

func JumlahHariDalamBulan(tanggal string) (int, error) {
	// Parsing string tanggal ke tipe time.Time
	t, err := time.Parse("2006-01-02", tanggal)
	if err != nil {
		return 0, err
	}

	// Mendapatkan tahun dan bulan dari tanggal
	tahun := t.Year()
	bulan := t.Month()

	// Menghitung jumlah hari di bulan tersebut
	// time.Date(tahun, bulan+1, 0, 0, 0, 0, 0, time.UTC) akan menghasilkan tanggal terakhir bulan tersebut
	hariTerakhir := time.Date(tahun, bulan+1, 0, 0, 0, 0, 0, time.UTC)

	// Mengembalikan jumlah hari di bulan tersebut
	return hariTerakhir.Day(), nil
}

func PrintRecommendationsMonthlyUsage(appliances []entity.ApplianceResponse, tarif float64, daysInMonth int, maxEnergy float64) []string {
	timeSlots := []string{"00:00–06:00", "06:00–12:00", "12:00–18:00", "18:00–24:00"}

	// Hitung penggunaan bulanan dan biaya untuk setiap perangkat
	for i := range appliances {
		appliances[i].MonthlyUse = appliances[i].AverageUsage * float64(daysInMonth)
		appliances[i].Cost = appliances[i].MonthlyUse * tarif
	}

	// Urutkan perangkat berdasarkan prioritas (true > false) lalu penggunaan daya (desc)
	sort.Slice(appliances, func(i, j int) bool {
		if appliances[i].Priority == appliances[j].Priority {
			return appliances[i].AverageUsage > appliances[j].AverageUsage
		}
		return appliances[i].Priority
	})

	allocatedEnergy := 0.0
	selectedAppliances := []entity.ApplianceResponse{}

	// Alokasikan perangkat ke jadwal
	for _, appliance := range appliances {
		if allocatedEnergy+appliance.MonthlyUse <= maxEnergy {
			allocatedEnergy += appliance.MonthlyUse
			appliance.RecommendedSchedule = RecommendationsMonthlyUsage(appliance, timeSlots)
			selectedAppliances = append(selectedAppliances, appliance)
		}
	}

	// Buat hasil output
	result := []string{}
	result = append(result, fmt.Sprintf("Jadwal Penggunaan Appliances (Total Energi = %.2f kWh, Biaya = Rp%.2f):", allocatedEnergy, allocatedEnergy*tarif))
	for _, appliance := range selectedAppliances {
		result = append(result, fmt.Sprintf("Name: %s, Type: %s, Priority: %t, Monthly Use: %.2f kWh, Cost: Rp%.2f, Schedule: %v",
			appliance.Name, appliance.Type, appliance.Priority, appliance.MonthlyUse, appliance.Cost, appliance.RecommendedSchedule))
	}

	return result
}

func RecommendationsMonthlyUsage(appliance entity.ApplianceResponse, timeSlots []string) []string {
	schedule := []string{}

	// Prioritaskan jadwal berdasarkan daya perangkat
	if appliance.AverageUsage >= 1.0 { // Perangkat daya besar (>= 1 kWh rata-rata)
		for _, slot := range []string{"18:00–24:00", "00:00–06:00"} {
			schedule = append(schedule, slot)
		}
	} else { // Perangkat daya kecil (< 1 kWh rata-rata)
		for _, slot := range []string{"06:00–12:00", "12:00–18:00"} {
			schedule = append(schedule, slot)
		}
	}

	return schedule
}

func PrintRecommendationsDailyUsage(appliances []entity.ApplianceResponse, tariff float64) []DailySummary {
	var summary []DailySummary
	for _, appliance := range appliances {
		// Hitung energi yang dikonsumsi saat ini
		currentEnergy := float64(appliance.Power) * appliance.UsageToday / 1000.0 // kWh
		// Biaya penggunaan saat ini
		currentCost := currentEnergy * tariff

		// Periksa apakah penggunaan melebihi target harian
		var applianceSummary DailySummary
		if appliance.UsageToday > appliance.DailyUseTarget {
			applianceSummary.ApplianceName = appliance.Name
			applianceSummary.Type = appliance.Type
			applianceSummary.Message = fmt.Sprintf("WARNING: %s telah melebihi target harian!", appliance.Name)
			applianceSummary.IsOveruse = true
		} else {
			applianceSummary.ApplianceName = appliance.Name
			applianceSummary.Type = appliance.Type
			applianceSummary.Message = fmt.Sprintf("%s dalam batas target harian. (Penggunaan: %.2f jam, Target: %.2f jam)", appliance.Name, appliance.UsageToday, appliance.DailyUseTarget)
			applianceSummary.IsOveruse = false
		}

		// Cetak informasi biaya
		applianceSummary.Usage = appliance.UsageToday
		applianceSummary.Target = appliance.DailyUseTarget
		applianceSummary.Info = fmt.Sprintf("Biaya saat ini untuk %s: IDR %.2f", appliance.Name, currentCost)
		summary = append(summary, applianceSummary)
	}

	return summary
}

func RecommendationsDailyUsage(appliance entity.ApplianceResponse, hoursRemaining, tariff float64) (string, []string) {
	if appliance.Priority {
		var result []string
		result = append(result, fmt.Sprintf("Rekomendasi untuk %s", appliance.Name))
		result = append(result, "PRIORITAS TINGGI: Perangkat ini penting untuk aktivitas sehari-hari.")
		result = append(result, fmt.Sprintf("Gunakan selama %.2f jam lagi hari ini untuk memenuhi kebutuhan harian tanpa melebihi batas target harian sebesar %.2f jam.", hoursRemaining, appliance.DailyUseTarget))
		result = append(result, fmt.Sprintf("Estimasi biaya tambahan jika digunakan selama %.2f jam: IDR %.2f", hoursRemaining, float64(appliance.Power)*hoursRemaining/1000*tariff))
		return appliance.Name, result
	} else {
		var result []string
		result = append(result, fmt.Sprintf("Rekomendasi untuk %s", appliance.Name))
		result = append(result, "PRIORITAS RENDAH: Perangkat ini tidak mendesak. Pertimbangkan untuk membatasi penggunaannya.")
		result = append(result, fmt.Sprintf("Kurangi penggunaannya agar tidak melebihi target harian %.2f jam.", appliance.DailyUseTarget))
		result = append(result, fmt.Sprintf("Potensi penghematan jika perangkat ini tidak digunakan lagi hari ini: IDR %.2f", float64(appliance.Power)*hoursRemaining/1000*tariff))
		return appliance.Name, result
	}
}

func EmailValidator(str string) bool {
	email_validator := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return email_validator.MatchString(str)
}

func PasswordValidator(str string) (bool, bool, bool) {
	var hasLetter, hasDigit, hasMinLen bool
	for _, char := range str {
		switch {
		case unicode.IsLetter(char):
			hasLetter = true
		case unicode.IsDigit(char):
			hasDigit = true
		}
	}

	if len(str) >= 8 {
		hasMinLen = true
	}

	return hasMinLen, hasLetter, hasDigit
}

func PasswordHashing(str string) (string, error) {
	hashPassword, err := bcrypt.GenerateFromPassword([]byte(str), bcrypt.MinCost)
	if err != nil {
		return "", err
	}

	return string(hashPassword), nil
}

func ConvertToResponseType(data interface{}) interface{} {
	switch v := data.(type) {
	case entity.Users:
		return entity.UsersResponse{
			ID:      v.ID,
			Name:    v.Name,
			Email:   v.Email,
			Premium: v.Premium,
		}
	default:
		return nil
	}
}

func GenerateToken(username string, email string, premium bool) (string, error) {
	secretKey := os.Getenv("JWT_SECRET")
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := jwt.MapClaims{
		"username": username,
		"email":    email,
		"premium":  premium,
		"exp":      expirationTime.Unix(),
	}

	parseToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	signedToken, err := parseToken.SignedString([]byte(secretKey))
	if err != nil {
		return "", err
	}

	return signedToken, nil
}

func VerifyToken(jwtToken string) (interface{}, error) {
	secretKey := os.Getenv("JWT_SECRET")

	token, err := jwt.Parse(jwtToken, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secretKey), nil
	})

	if err != nil {
		return nil, err
	}

	if token == nil || !token.Valid {
		return nil, errors.New("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	return claims, nil
}

func ComparePass(hashPassword, reqPassword string) bool {
	hash, pass := []byte(hashPassword), []byte(reqPassword)

	err := bcrypt.CompareHashAndPassword(hash, pass)
	return err == nil
}

func GetGoogleOAuthConfig() (*oauth2.Config, string, error) {
	var (
		ClientID          = os.Getenv("GOOGLE_CLIENT_ID")
		ClientSecret      = os.Getenv("GOOGLE_CLIENT_SECRET")
		redirectURL       = os.Getenv("FRONTEND_URL")
		port              = os.Getenv("PORT")
		googleOauthConfig = &oauth2.Config{
			ClientID:     ClientID,
			ClientSecret: ClientSecret,
			RedirectURL:  "http://localhost:" + port + "/v1/auth/callback/google",
			Scopes: []string{
				"https://www.googleapis.com/auth/userinfo.email",
				"https://www.googleapis.com/auth/userinfo.profile",
			},
			Endpoint: google.Endpoint,
		}
	)

	if mode == "production" {
		googleOauthConfig.RedirectURL = os.Getenv("PUBLIC_URL") + "/v1/auth/callback/google"
	}

	return googleOauthConfig, redirectURL, nil
}

func GenerateOTP() string {
	return fmt.Sprintf("%06d", rand.Intn(1000000))
}

func SendEmail(emailTo string, otp string) error {
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPassword := os.Getenv("SMTP_PASSWORD")

	msg := fmt.Sprintf("Subject: Your OTP Code\n\nYour OTP code is: %s", otp)
	auth := smtp.PlainAuth("", smtpUser, smtpPassword, smtpHost)
	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, smtpUser, []string{emailTo}, []byte(msg))
	return err
}

package service

import (
	"sync"

	"smart-home-energy-management-server/internal/entity"
	"smart-home-energy-management-server/internal/helper"
	"smart-home-energy-management-server/internal/repository"
)

type ApplianceService interface {
	CreateAppliance(appliance *entity.ApplianceRequest) (*entity.Appliance, error)
	GetAllAppliances() ([]entity.ApplianceResponse, error)
	GetApplianceByID(id uint) (*entity.Appliance, error)
	UpdateApplianceByID(id uint, appliance *entity.Appliance) (*entity.Appliance, error)
	DeleteApplianceByID(id uint) error
	TruncateAppliances() error
	SetDailyTarget([]helper.DailyTarget) ([]entity.Appliance, error)
	SaveDailyTarget(data, email string) error
	GetDailyTarget(email string) (string, error)
}

type applianceService struct {
	applianceRepo   repository.ApplianceRepository
	RedisRepository repository.RedisRepository
}

func NewApplianceService(applianceRepo repository.ApplianceRepository, redisRepository repository.RedisRepository) ApplianceService {
	return &applianceService{applianceRepo: applianceRepo, RedisRepository: redisRepository}
}

func (s *applianceService) CreateAppliance(applianceReq *entity.ApplianceRequest) (*entity.Appliance, error) {
	appliance := &entity.Appliance{
		Name:         applianceReq.Name,
		Type:         applianceReq.Type,
		Location:     applianceReq.Location,
		Power:        applianceReq.Power,
		Energy:       applianceReq.Energy,
		Cost:         applianceReq.Cost,
		Status:       applianceReq.Status,
		Connectivity: applianceReq.Connectivity,
		Priority:     applianceReq.Priority,
		UsageToday:   applianceReq.UsageToday,
		AverageUsage: applianceReq.AverageUsage,
	}
	return s.applianceRepo.Create(appliance)
}

func (s *applianceService) GetAllAppliances() ([]entity.ApplianceResponse, error) {
	appliances, err := s.applianceRepo.FindAll()
	if err != nil {
		return nil, err
	}

	var result []entity.ApplianceResponse
	for _, appliance := range appliances {
		result = append(result, entity.ApplianceResponse{
			ID:             appliance.ID,
			Name:           appliance.Name,
			Type:           appliance.Type,
			Location:       appliance.Location,
			Power:          appliance.Power,
			UsageToday:     appliance.UsageToday,
			Energy:         appliance.Energy,
			Cost:           appliance.Cost,
			Status:         appliance.Status,
			Connectivity:   appliance.Connectivity,
			AverageUsage:   appliance.AverageUsage,
			DailyUseTarget: appliance.DailyUseTarget,
			Priority:       appliance.Priority,
		})
	}

	return result, nil
}

func (s *applianceService) GetApplianceByID(id uint) (*entity.Appliance, error) {
	return s.applianceRepo.FindByID(id)
}

func (s *applianceService) UpdateApplianceByID(id uint, appliance *entity.Appliance) (*entity.Appliance, error) {
	return s.applianceRepo.UpdateByID(id, appliance)
}

func (s *applianceService) DeleteApplianceByID(id uint) error {
	return s.applianceRepo.DeleteByID(id)
}

func (s *applianceService) TruncateAppliances() error {
	return s.applianceRepo.Truncate()
}

func (s *applianceService) SetDailyTarget(dailyTargets []helper.DailyTarget) ([]entity.Appliance, error) {
	// Update daily use target for each appliance use Goroutine
	wg := sync.WaitGroup{}
	for _, dailyTarget := range dailyTargets {
		wg.Add(1)
		go func(dailyTarget helper.DailyTarget) {
			defer wg.Done()
			appliance, err := s.applianceRepo.FindByName(dailyTarget.Name)
			if err != nil {
				return
			}
			appliance.DailyUseTarget = float64(dailyTarget.Target)
			_, _ = s.applianceRepo.UpdateByID(appliance.ID, appliance)
		}(dailyTarget)
	}
	wg.Wait()
	return s.applianceRepo.FindAll()
}

func (s *applianceService) SaveDailyTarget(data, email string) error {
	return s.RedisRepository.Save("daily-target-"+email, data)
}

func (s *applianceService) GetDailyTarget(email string) (string, error) {
	return s.RedisRepository.Get("daily-target-" + email)
}

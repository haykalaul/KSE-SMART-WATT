package repository

import (
	"smart-home-energy-management-server/internal/entity"

	"gorm.io/gorm"
)

type ApplianceRepository interface {
	Create(appliance *entity.Appliance) (*entity.Appliance, error)
	FindAll() ([]entity.Appliance, error)
	FindByID(id uint) (*entity.Appliance, error)
	FindByName(name string) (*entity.Appliance, error)
	UpdateByID(id uint, appliance *entity.Appliance) (*entity.Appliance, error)
	DeleteByID(id uint) error
	Truncate() error
}

type applianceRepository struct {
	db *gorm.DB
}

func NewApplianceRepository(db *gorm.DB) ApplianceRepository {
	return &applianceRepository{db: db}
}

func (r *applianceRepository) Create(appliance *entity.Appliance) (*entity.Appliance, error) {
	if err := r.db.Create(appliance).Error; err != nil {
		return nil, err
	}
	return appliance, nil
}

func (r *applianceRepository) FindAll() ([]entity.Appliance, error) {
	var appliances []entity.Appliance
	if err := r.db.Find(&appliances).Error; err != nil {
		return nil, err
	}
	return appliances, nil
}

func (r *applianceRepository) FindByID(id uint) (*entity.Appliance, error) {
	var appliance entity.Appliance
	if err := r.db.First(&appliance, id).Error; err != nil {
		return nil, err
	}
	return &appliance, nil
}

func (r *applianceRepository) FindByName(name string) (*entity.Appliance, error) {
	var appliance entity.Appliance
	if err := r.db.Where("name = ?", name).First(&appliance).Error; err != nil {
		return nil, err
	}
	return &appliance, nil
}

func (r *applianceRepository) UpdateByID(id uint, appliance *entity.Appliance) (*entity.Appliance, error) {
	if err := r.db.Model(&entity.Appliance{}).Where("id = ?", id).Updates(appliance).Error; err != nil {
		return nil, err
	}
	return appliance, nil
}

func (r *applianceRepository) DeleteByID(id uint) error {
	if err := r.db.Delete(&entity.Appliance{}, id).Error; err != nil {
		return err
	}
	return nil
}

func (r *applianceRepository) Truncate() error {
	if err := r.db.Exec("TRUNCATE TABLE appliances").Error; err != nil {
		return err
	}
	return nil
}

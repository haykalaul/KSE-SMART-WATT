package service

import (
	"errors"

	"smart-home-energy-management-server/internal/repository"
)

type RecommendationService interface {
	SaveRecommendation(recommendation []string) error
	GetRecommendation() ([]string, error)
}

type recommendationService struct {
	RedisRepository repository.RedisRepository
}

func NewRecommendationService(redisRepository repository.RedisRepository) RecommendationService {
	return &recommendationService{redisRepository}
}

func (s *recommendationService) SaveRecommendation(recommendation []string) error {
	if recommendation == nil {
		return errors.New("recommendation is empty")
	}

	return s.RedisRepository.SaveList("recommendation", recommendation)
}

func (s *recommendationService) GetRecommendation() ([]string, error) {
	return s.RedisRepository.GetList("recommendation")
}

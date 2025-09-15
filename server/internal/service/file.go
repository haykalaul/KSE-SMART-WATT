package service

import (
	"encoding/json"
	"errors"

	"smart-home-energy-management-server/internal/repository"
)

type FileService interface {
	SaveTable(table string) error
	GetTable() (map[string][]string, error)
}

type fileService struct {
	RedisRepository repository.RedisRepository
}

func NewFileService(redisRepository repository.RedisRepository) FileService {
	return &fileService{redisRepository}
}

func (s *fileService) SaveTable(table string) error {
	if table == "" {
		return errors.New("table is empty")
	}

	return s.RedisRepository.Save("table", table)
}

func (s *fileService) GetTable() (map[string][]string, error) {
	table, err := s.RedisRepository.Get("table")
	if err != nil {
		return nil, err
	}

	var result map[string][]string
	err = json.Unmarshal([]byte(table), &result)
	if err != nil {
		return nil, err
	}

	return result, nil
}

package service

import (
	"encoding/json"
	"errors"
	"log"

	"smart-home-energy-management-server/internal/repository"
)

type FileService interface {
	SaveTable(table string) error
	GetTable() (map[string][]string, error)
	GetRawTable() (string, error)
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

	// log for debugging
	log.Printf("debug: saving table to redis, len=%d", len(table))
	if err := s.RedisRepository.Save("table", table); err != nil {
		log.Printf("error: failed save table to redis: %v", err)
		return err
	}
	return nil
}

func (s *fileService) GetTable() (map[string][]string, error) {
	table, err := s.RedisRepository.Get("table")
	if err != nil {
		log.Printf("error: redis get table: %v", err)
		return nil, err
	}

	var result map[string][]string
	err = json.Unmarshal([]byte(table), &result)
	if err != nil {
		log.Printf("error: json unmarshal table: %v", err)
		return nil, err
	}

	return result, nil
}

func (s *fileService) GetRawTable() (string, error) {
	table, err := s.RedisRepository.Get("table")
	if err != nil {
		log.Printf("error: redis get raw table: %v", err)
		return "", err
	}
	log.Printf("debug: got raw table from redis, len=%d", len(table))
	return table, nil
}

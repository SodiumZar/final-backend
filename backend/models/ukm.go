package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Status yang tersedia untuk UKM
type UKMStatus string

const (
	UKMStatusPending  UKMStatus = "pending"
	UKMStatusActive   UKMStatus = "active"
	UKMStatusInactive UKMStatus = "inactive"
)

// UKM adalah struct utama untuk data Unit Kegiatan Mahasiswa
type UKM struct {
	ID          primitive.ObjectID `bson:"_id,omitempty"   json:"id"`
	Name        string             `bson:"name"            json:"name"`
	Description string             `bson:"description"     json:"description"`
	Category    string             `bson:"category"        json:"category"`
	LogoURL     string             `bson:"logo_url"        json:"logo_url"`
	Status      UKMStatus          `bson:"status"          json:"status"`
	FoundedYear int                `bson:"founded_year"    json:"founded_year"`
	CreatedAt   time.Time          `bson:"created_at"      json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at"      json:"updated_at"`
}

// CreateUKMRequest adalah struct untuk validasi request pembuatan UKM baru
type CreateUKMRequest struct {
	Name        string `json:"name"         binding:"required"`
	Description string `json:"description"  binding:"required"`
	Category    string `json:"category"     binding:"required"`
	LogoURL     string `json:"logo_url"`
	FoundedYear int    `json:"founded_year" binding:"required"`
}

// UpdateUKMRequest adalah struct untuk validasi request update data UKM
type UpdateUKMRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"`
	LogoURL     string `json:"logo_url"`
	FoundedYear int    `json:"founded_year"`
}

// UpdateUKMStatusRequest adalah struct untuk validasi request update status UKM
type UpdateUKMStatusRequest struct {
	Status UKMStatus `json:"status" binding:"required"`
}

package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Status yang tersedia untuk event
type EventStatus string

const (
	EventStatusUpcoming  EventStatus = "upcoming"
	EventStatusOngoing   EventStatus = "ongoing"
	EventStatusCompleted EventStatus = "completed"
	EventStatusCancelled EventStatus = "cancelled"
)

// Event adalah struct utama untuk data kegiatan/acara UKM
type Event struct {
	ID          primitive.ObjectID `bson:"_id,omitempty"  json:"id"`
	UKMID       primitive.ObjectID `bson:"ukm_id"         json:"ukm_id"`
	Title       string             `bson:"title"          json:"title"`
	Description string             `bson:"description"    json:"description"`
	Location    string             `bson:"location"       json:"location"`
	StartDate   time.Time          `bson:"start_date"     json:"start_date"`
	EndDate     time.Time          `bson:"end_date"       json:"end_date"`
	Quota       int                `bson:"quota"          json:"quota"`
	Status      EventStatus        `bson:"status"         json:"status"`
	CreatedBy   primitive.ObjectID `bson:"created_by"     json:"created_by"`
	CreatedAt   time.Time          `bson:"created_at"     json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at"     json:"updated_at"`
}

// EventDetail adalah struct response event dengan data relasi
type EventDetail struct {
	ID          primitive.ObjectID `json:"id"`
	UKMID       primitive.ObjectID `json:"ukm_id"`
	Title       string             `json:"title"`
	Description string             `json:"description"`
	Location    string             `json:"location"`
	StartDate   time.Time          `json:"start_date"`
	EndDate     time.Time          `json:"end_date"`
	Quota       int                `json:"quota"`
	Status      EventStatus        `json:"status"`
	CreatedBy   primitive.ObjectID `json:"created_by"`
	CreatedAt   time.Time          `json:"created_at"`
	UpdatedAt   time.Time          `json:"updated_at"`
	// Data relasi UKM
	UKM              *UKM `json:"ukm,omitempty"`
	// Jumlah pendaftar yang sudah approved
	ApprovedCount    int  `json:"approved_count"`
	// Sisa quota yang tersedia
	RemainingQuota   int  `json:"remaining_quota"`
}

// CreateEventRequest adalah struct untuk validasi request pembuatan event baru
type CreateEventRequest struct {
	Title       string    `json:"title"       binding:"required"`
	Description string    `json:"description" binding:"required"`
	Location    string    `json:"location"    binding:"required"`
	StartDate   time.Time `json:"start_date"  binding:"required"`
	EndDate     time.Time `json:"end_date"    binding:"required"`
	Quota       int       `json:"quota"       binding:"required,min=1"`
}

// UpdateEventRequest adalah struct untuk validasi request update event
type UpdateEventRequest struct {
	Title       string      `json:"title"`
	Description string      `json:"description"`
	Location    string      `json:"location"`
	StartDate   time.Time   `json:"start_date"`
	EndDate     time.Time   `json:"end_date"`
	Quota       int         `json:"quota"  binding:"omitempty,min=1"`
	Status      EventStatus `json:"status"`
}

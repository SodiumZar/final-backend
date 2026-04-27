package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Announcement adalah struct utama untuk data pengumuman UKM
type Announcement struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UKMID     primitive.ObjectID `bson:"ukm_id"        json:"ukm_id"`
	Title     string             `bson:"title"         json:"title"`
	Content   string             `bson:"content"       json:"content"`
	CreatedBy primitive.ObjectID `bson:"created_by"    json:"created_by"`
	CreatedAt time.Time          `bson:"created_at"    json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at"    json:"updated_at"`
}

// AnnouncementDetail adalah struct response dengan data relasi UKM dan pembuat
type AnnouncementDetail struct {
	ID        primitive.ObjectID `json:"id"`
	UKMID     primitive.ObjectID `json:"ukm_id"`
	Title     string             `json:"title"`
	Content   string             `json:"content"`
	CreatedBy primitive.ObjectID `json:"created_by"`
	CreatedAt time.Time          `json:"created_at"`
	UpdatedAt time.Time          `json:"updated_at"`
	// Data relasi yang di-populate
	UKM     *UKM          `json:"ukm,omitempty"`
	Creator *UserResponse `json:"creator,omitempty"`
}

// CreateAnnouncementRequest adalah struct untuk validasi pembuatan pengumuman
type CreateAnnouncementRequest struct {
	Title   string `json:"title"   binding:"required"`
	Content string `json:"content" binding:"required"`
}

// UpdateAnnouncementRequest adalah struct untuk validasi update pengumuman
type UpdateAnnouncementRequest struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}
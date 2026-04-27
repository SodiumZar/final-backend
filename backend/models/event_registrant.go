package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Status pendaftaran event
type RegistrantStatus string

const (
	RegistrantStatusPending  RegistrantStatus = "pending"
	RegistrantStatusApproved RegistrantStatus = "approved"
	RegistrantStatusRejected RegistrantStatus = "rejected"
)

// EventRegistrant adalah struct untuk data pendaftaran user ke event
type EventRegistrant struct {
	ID           primitive.ObjectID `bson:"_id,omitempty"  json:"id"`
	EventID      primitive.ObjectID `bson:"event_id"       json:"event_id"`
	UserID       primitive.ObjectID `bson:"user_id"        json:"user_id"`
	Status       RegistrantStatus   `bson:"status"         json:"status"`
	RegisteredAt time.Time          `bson:"registered_at"  json:"registered_at"`
}

// EventRegistrantDetail adalah struct response dengan detail user dan event
type EventRegistrantDetail struct {
	ID           primitive.ObjectID `json:"id"`
	EventID      primitive.ObjectID `json:"event_id"`
	UserID       primitive.ObjectID `json:"user_id"`
	Status       RegistrantStatus   `json:"status"`
	RegisteredAt time.Time          `json:"registered_at"`
	// Data relasi yang di-populate
	User  *UserResponse `json:"user,omitempty"`
	Event *Event        `json:"event,omitempty"`
}

// UpdateRegistrantRequest adalah struct untuk validasi update status pendaftar
type UpdateRegistrantRequest struct {
	Status RegistrantStatus `json:"status" binding:"required"`
}

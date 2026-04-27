package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Role yang tersedia untuk anggota UKM
type MemberRole string

const (
	MemberRoleKetua   MemberRole = "ketua"
	MemberRolePengurus MemberRole = "pengurus"
	MemberRoleAnggota MemberRole = "anggota"
)

// Status keanggotaan UKM
type MemberStatus string

const (
	MemberStatusPending  MemberStatus = "pending"
	MemberStatusActive   MemberStatus = "active"
	MemberStatusInactive MemberStatus = "inactive"
)

// UKMMember adalah struct untuk data keanggotaan user di UKM
type UKMMember struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID   primitive.ObjectID `bson:"user_id"       json:"user_id"`
	UKMID    primitive.ObjectID `bson:"ukm_id"        json:"ukm_id"`
	Role     MemberRole         `bson:"role"          json:"role"`
	Status   MemberStatus       `bson:"status"        json:"status"`
	JoinedAt time.Time          `bson:"joined_at"     json:"joined_at"`
}

// UKMMemberDetail adalah struct untuk response dengan detail user dan UKM
type UKMMemberDetail struct {
	ID       primitive.ObjectID `json:"id"`
	UserID   primitive.ObjectID `json:"user_id"`
	UKMID    primitive.ObjectID `json:"ukm_id"`
	Role     MemberRole         `json:"role"`
	Status   MemberStatus       `json:"status"`
	JoinedAt time.Time          `json:"joined_at"`
	// Data relasi yang di-populate dari collection lain
	User *UserResponse `json:"user,omitempty"`
	UKM  *UKM          `json:"ukm,omitempty"`
}

// UpdateMemberRequest adalah struct untuk validasi request update member
type UpdateMemberRequest struct {
	Role   MemberRole   `json:"role"`
	Status MemberStatus `json:"status"`
}

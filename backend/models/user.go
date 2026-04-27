package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Role yang tersedia untuk user
type UserRole string

const (
	RoleAdmin     UserRole = "admin"
	RoleMahasiswa UserRole = "mahasiswa"
)

// User adalah struct utama untuk data pengguna sistem
type User struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"      json:"id"`
	Name      string             `bson:"name"               json:"name"`
	Email     string             `bson:"email"              json:"email"`
	Password  string             `bson:"password"           json:"-"` // json:"-" agar password tidak pernah dikirim ke client
	NIM       string             `bson:"nim"                json:"nim"`
	Role      UserRole           `bson:"role"               json:"role"`
	CreatedAt time.Time          `bson:"created_at"         json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at"         json:"updated_at"`
}

// RegisterRequest adalah struct untuk validasi request registrasi
type RegisterRequest struct {
	Name     string `json:"name"     binding:"required"`
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	NIM      string `json:"nim"      binding:"required"`
}

// LoginRequest adalah struct untuk validasi request login
type LoginRequest struct {
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// AuthResponse adalah struct untuk response setelah login/register berhasil
type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// UserResponse adalah struct untuk menampilkan data user tanpa password
type UserResponse struct {
	ID        primitive.ObjectID `json:"id"`
	Name      string             `json:"name"`
	Email     string             `json:"email"`
	NIM       string             `json:"nim"`
	Role      UserRole           `json:"role"`
	CreatedAt time.Time          `json:"created_at"`
	UpdatedAt time.Time          `json:"updated_at"`
}

// ToResponse mengkonversi User ke UserResponse (tanpa field password)
func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:        u.ID,
		Name:      u.Name,
		Email:     u.Email,
		NIM:       u.NIM,
		Role:      u.Role,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}

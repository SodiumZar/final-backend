package services

import (
	"context"
	"errors"
	"os"
	"strconv"
	"time"

	"github.com/SodiumZar/final-backend.git/middleware"
	"github.com/SodiumZar/final-backend.git/models"
	"github.com/SodiumZar/final-backend.git/repositories"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// AuthService menangani logika bisnis untuk autentikasi
type AuthService struct {
	userRepo *repositories.UserRepository
}

// NewAuthService membuat instance baru AuthService
func NewAuthService(userRepo *repositories.UserRepository) *AuthService {
	return &AuthService{userRepo: userRepo}
}

// Register memproses pendaftaran user baru
func (s *AuthService) Register(ctx context.Context, req *models.RegisterRequest) (*models.AuthResponse, error) {
	// Cek apakah email sudah digunakan oleh user lain
	emailExists, err := s.userRepo.ExistsByEmail(ctx, req.Email)
	if err != nil {
		return nil, errors.New("terjadi kesalahan saat memeriksa email")
	}
	if emailExists {
		return nil, errors.New("email sudah digunakan, gunakan email lain")
	}

	// Cek apakah NIM sudah digunakan oleh user lain
	nimExists, err := s.userRepo.ExistsByNIM(ctx, req.NIM)
	if err != nil {
		return nil, errors.New("terjadi kesalahan saat memeriksa NIM")
	}
	if nimExists {
		return nil, errors.New("NIM sudah terdaftar, gunakan NIM yang benar")
	}

	// Hash password menggunakan bcrypt dengan cost 10
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	if err != nil {
		return nil, errors.New("terjadi kesalahan saat memproses password")
	}

	// Buat object user baru
	user := &models.User{
		Name:     req.Name,
		Email:    req.Email,
		Password: string(hashedPassword),
		NIM:      req.NIM,
		Role:     models.RoleMahasiswa, // Role default saat register adalah mahasiswa
	}

	// Simpan user ke database
	createdUser, err := s.userRepo.Create(ctx, user)
	if err != nil {
		return nil, errors.New("terjadi kesalahan saat menyimpan data user")
	}

	// Generate JWT token untuk user yang baru terdaftar
	token, err := s.generateToken(createdUser)
	if err != nil {
		return nil, errors.New("terjadi kesalahan saat membuat token")
	}

	return &models.AuthResponse{
		Token: token,
		User:  *createdUser,
	}, nil
}

// Login memverifikasi kredensial dan mengembalikan token JWT
func (s *AuthService) Login(ctx context.Context, req *models.LoginRequest) (*models.AuthResponse, error) {
	// Cari user berdasarkan email
	user, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, errors.New("terjadi kesalahan pada server")
	}

	// Jika user tidak ditemukan, berikan pesan generik
	// (tidak membedakan "email tidak ada" vs "password salah" untuk keamanan)
	if user == nil {
		return nil, errors.New("email atau password tidak valid")
	}

	// Verifikasi password dengan membandingkan hash
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		return nil, errors.New("email atau password tidak valid")
	}

	// Generate JWT token
	token, err := s.generateToken(user)
	if err != nil {
		return nil, errors.New("terjadi kesalahan saat membuat token")
	}

	return &models.AuthResponse{
		Token: token,
		User:  *user,
	}, nil
}

// GetProfile mengambil data profil user berdasarkan ID
func (s *AuthService) GetProfile(ctx context.Context, userID string) (*models.User, error) {
	// Konversi string ID ke ObjectID MongoDB
	objectID, err := parseObjectID(userID)
	if err != nil {
		return nil, errors.New("ID user tidak valid")
	}

	user, err := s.userRepo.FindByID(ctx, objectID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan pada server")
	}

	if user == nil {
		return nil, errors.New("user tidak ditemukan")
	}

	return user, nil
}

// generateToken membuat JWT token baru untuk user
func (s *AuthService) generateToken(user *models.User) (string, error) {
	// Ambil secret key dari environment variable
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return "", errors.New("JWT_SECRET tidak dikonfigurasi")
	}

	// Ambil durasi expired dari environment variable (default 24 jam)
	expiredHours := 24
	if hoursStr := os.Getenv("JWT_EXPIRED_HOURS"); hoursStr != "" {
		if h, err := strconv.Atoi(hoursStr); err == nil {
			expiredHours = h
		}
	}

	// Buat claims JWT sesuai spesifikasi
	claims := middleware.JWTClaims{
		UserID: user.ID.Hex(),
		Email:  user.Email,
		Role:   string(user.Role),
		RegisteredClaims: jwt.RegisteredClaims{
			// Token kedaluwarsa setelah N jam dari sekarang
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expiredHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	// Buat token dengan algoritma HS256
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign token dengan secret key
	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

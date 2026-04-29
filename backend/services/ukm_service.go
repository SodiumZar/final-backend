package services

import (
	"context"
	"errors"

	"github.com/SodiumZar/final-backend.git/models"
	"github.com/SodiumZar/final-backend.git/repositories"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// UKMService menangani logika bisnis untuk UKM dan keanggotaan
type UKMService struct {
	ukmRepo  *repositories.UKMRepository
	userRepo *repositories.UserRepository
}

// NewUKMService membuat instance baru UKMService
func NewUKMService(ukmRepo *repositories.UKMRepository, userRepo *repositories.UserRepository) *UKMService {
	return &UKMService{
		ukmRepo:  ukmRepo,
		userRepo: userRepo,
	}
}

// ─────────────────────────────────────────────────────────────
// LOGIKA BISNIS: UKM
// ─────────────────────────────────────────────────────────────

// GetAllUKMs mengambil semua UKM (public: hanya yang active)
func (s *UKMService) GetAllUKMs(ctx context.Context, onlyActive bool) ([]*models.UKM, error) {
	filter := bson.M{}

	// Jika request dari public (bukan admin), hanya tampilkan UKM yang active
	if onlyActive {
		filter["status"] = models.UKMStatusActive
	}

	ukms, err := s.ukmRepo.FindAllUKMs(ctx, filter)
	if err != nil {
		return nil, errors.New("terjadi kesalahan saat mengambil data UKM")
	}

	return ukms, nil
}

// GetUKMByID mengambil detail satu UKM berdasarkan ID
func (s *UKMService) GetUKMByID(ctx context.Context, ukmIDStr string) (*models.UKM, error) {
	ukmID, err := parseObjectID(ukmIDStr)
	if err != nil {
		return nil, errors.New("ID UKM tidak valid")
	}

	ukm, err := s.ukmRepo.FindUKMByID(ctx, ukmID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan pada server")
	}

	if ukm == nil {
		return nil, errors.New("UKM tidak ditemukan")
	}

	return ukm, nil
}

// CreateUKM membuat UKM baru (hanya admin)
func (s *UKMService) CreateUKM(ctx context.Context, req *models.CreateUKMRequest) (*models.UKM, error) {
	ukm := &models.UKM{
		Name:        req.Name,
		Description: req.Description,
		Category:    req.Category,
		LogoURL:     req.LogoURL,
		FoundedYear: req.FoundedYear,
		// Status default "pending" diset di repository
	}

	created, err := s.ukmRepo.CreateUKM(ctx, ukm)
	if err != nil {
		return nil, errors.New("terjadi kesalahan saat membuat UKM")
	}

	return created, nil
}

// UpdateUKM memperbarui data UKM (hanya admin)
func (s *UKMService) UpdateUKM(ctx context.Context, ukmIDStr string, req *models.UpdateUKMRequest) (*models.UKM, error) {
	ukmID, err := parseObjectID(ukmIDStr)
	if err != nil {
		return nil, errors.New("ID UKM tidak valid")
	}

	// Pastikan UKM yang akan diupdate benar-benar ada
	ukm, err := s.ukmRepo.FindUKMByID(ctx, ukmID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan pada server")
	}
	if ukm == nil {
		return nil, errors.New("UKM tidak ditemukan")
	}

	// Bangun object update hanya untuk field yang diisi
	update := bson.M{}
	if req.Name != "" {
		update["name"] = req.Name
	}
	if req.Description != "" {
		update["description"] = req.Description
	}
	if req.Category != "" {
		update["category"] = req.Category
	}
	if req.LogoURL != "" {
		update["logo_url"] = req.LogoURL
	}
	if req.FoundedYear != 0 {
		update["founded_year"] = req.FoundedYear
	}

	if err := s.ukmRepo.UpdateUKM(ctx, ukmID, update); err != nil {
		return nil, errors.New("terjadi kesalahan saat memperbarui UKM")
	}

	// Ambil data terbaru setelah update
	updated, err := s.ukmRepo.FindUKMByID(ctx, ukmID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan saat mengambil data terbaru")
	}

	return updated, nil
}

// UpdateUKMStatus mengubah status UKM (hanya admin: pending/active/inactive)
func (s *UKMService) UpdateUKMStatus(ctx context.Context, ukmIDStr string, req *models.UpdateUKMStatusRequest) (*models.UKM, error) {
	ukmID, err := parseObjectID(ukmIDStr)
	if err != nil {
		return nil, errors.New("ID UKM tidak valid")
	}

	// Validasi nilai status yang dikirim
	validStatuses := map[models.UKMStatus]bool{
		models.UKMStatusPending:  true,
		models.UKMStatusActive:   true,
		models.UKMStatusInactive: true,
	}
	if !validStatuses[req.Status] {
		return nil, errors.New("status tidak valid, pilih: pending, active, atau inactive")
	}

	// Pastikan UKM ada
	ukm, err := s.ukmRepo.FindUKMByID(ctx, ukmID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan pada server")
	}
	if ukm == nil {
		return nil, errors.New("UKM tidak ditemukan")
	}

	update := bson.M{"status": req.Status}
	if err := s.ukmRepo.UpdateUKM(ctx, ukmID, update); err != nil {
		return nil, errors.New("terjadi kesalahan saat memperbarui status UKM")
	}

	// Ambil data terbaru
	updated, err := s.ukmRepo.FindUKMByID(ctx, ukmID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan saat mengambil data terbaru")
	}

	return updated, nil
}

// DeleteUKM menghapus UKM (hanya admin)
// UKM tidak bisa dihapus jika masih memiliki anggota aktif
func (s *UKMService) DeleteUKM(ctx context.Context, ukmIDStr string) error {
	ukmID, err := parseObjectID(ukmIDStr)
	if err != nil {
		return errors.New("ID UKM tidak valid")
	}

	// Pastikan UKM ada
	ukm, err := s.ukmRepo.FindUKMByID(ctx, ukmID)
	if err != nil {
		return errors.New("terjadi kesalahan pada server")
	}
	if ukm == nil {
		return errors.New("UKM tidak ditemukan")
	}

	// Cek jumlah anggota aktif — UKM tidak bisa dihapus jika masih ada anggota
	activeCount, err := s.ukmRepo.CountActiveMembersByUKMID(ctx, ukmID)
	if err != nil {
		return errors.New("terjadi kesalahan saat memeriksa anggota UKM")
	}
	if activeCount > 0 {
		return errors.New("UKM tidak dapat dihapus karena masih memiliki anggota aktif")
	}

	if err := s.ukmRepo.DeleteUKM(ctx, ukmID); err != nil {
		return errors.New("terjadi kesalahan saat menghapus UKM")
	}

	return nil
}

// ─────────────────────────────────────────────────────────────
// LOGIKA BISNIS: KEANGGOTAAN UKM
// ─────────────────────────────────────────────────────────────

// JoinUKM memproses permintaan user untuk bergabung ke UKM
func (s *UKMService) JoinUKM(ctx context.Context, ukmIDStr, userIDStr string) (*models.UKMMember, error) {
	ukmID, err := parseObjectID(ukmIDStr)
	if err != nil {
		return nil, errors.New("ID UKM tidak valid")
	}

	userID, err := parseObjectID(userIDStr)
	if err != nil {
		return nil, errors.New("ID user tidak valid")
	}

	// Pastikan UKM ada dan berstatus active
	ukm, err := s.ukmRepo.FindUKMByID(ctx, ukmID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan pada server")
	}
	if ukm == nil {
		return nil, errors.New("UKM tidak ditemukan")
	}
	if ukm.Status != models.UKMStatusActive {
		return nil, errors.New("UKM tidak aktif, tidak bisa bergabung")
	}

	// Cek apakah user sudah menjadi anggota UKM ini
	existing, err := s.ukmRepo.FindMember(ctx, userID, ukmID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan pada server")
	}
	if existing != nil {
		return nil, errors.New("anda sudah pernah mendaftar ke UKM ini")
	}

	// Buat record keanggotaan baru (role: anggota, status: pending)
	member := &models.UKMMember{
		UserID: userID,
		UKMID:  ukmID,
	}

	created, err := s.ukmRepo.CreateMember(ctx, member)
	if err != nil {
		return nil, errors.New("terjadi kesalahan saat mendaftar ke UKM")
	}

	return created, nil
}

// GetUKMMembers mengambil semua anggota UKM beserta detail user
func (s *UKMService) GetUKMMembers(ctx context.Context, ukmIDStr string) ([]*models.UKMMemberDetail, error) {
	ukmID, err := parseObjectID(ukmIDStr)
	if err != nil {
		return nil, errors.New("ID UKM tidak valid")
	}

	// Pastikan UKM ada
	ukm, err := s.ukmRepo.FindUKMByID(ctx, ukmID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan pada server")
	}
	if ukm == nil {
		return nil, errors.New("UKM tidak ditemukan")
	}

	// Ambil semua record keanggotaan
	members, err := s.ukmRepo.FindMembersByUKMID(ctx, ukmID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan saat mengambil data anggota")
	}

	// Populate data user untuk setiap anggota
	var details []*models.UKMMemberDetail
	for _, m := range members {
		detail := &models.UKMMemberDetail{
			ID:       m.ID,
			UserID:   m.UserID,
			UKMID:    m.UKMID,
			Role:     m.Role,
			Status:   m.Status,
			JoinedAt: m.JoinedAt,
		}

		// Ambil data user dari repository
		user, err := s.userRepo.FindByID(ctx, m.UserID)
		if err == nil && user != nil {
			userResp := user.ToResponse()
			detail.User = &userResp
		}

		details = append(details, detail)
	}

	if details == nil {
		details = []*models.UKMMemberDetail{}
	}

	return details, nil
}

// UpdateMember mengubah role atau status anggota UKM
// Menangani logika: jika user diset jadi ketua, ketua lama otomatis jadi pengurus
func (s *UKMService) UpdateMember(ctx context.Context, ukmIDStr, memberIDStr string, req *models.UpdateMemberRequest, requesterIDStr string) (*models.UKMMember, error) {
	ukmID, err := parseObjectID(ukmIDStr)
	if err != nil {
		return nil, errors.New("ID UKM tidak valid")
	}

	memberID, err := parseObjectID(memberIDStr)
	if err != nil {
		return nil, errors.New("ID member tidak valid")
	}

	// Cari record keanggotaan yang akan diupdate
	member, err := s.ukmRepo.FindMemberByID(ctx, memberID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan pada server")
	}
	if member == nil {
		return nil, errors.New("data keanggotaan tidak ditemukan")
	}

	// Pastikan member tersebut memang anggota UKM yang dimaksud
	if member.UKMID != ukmID {
		return nil, errors.New("anggota tidak terdaftar di UKM ini")
	}

	update := bson.M{}

	// Jika role yang baru adalah "ketua", terapkan logika pergantian ketua
	if req.Role == models.MemberRoleKetua {
		// Cari ketua yang saat ini aktif
		currentKetua, err := s.ukmRepo.FindKetua(ctx, ukmID)
		if err != nil {
			return nil, errors.New("terjadi kesalahan pada server")
		}

		// Jika sudah ada ketua dan bukan member yang sama, turunkan ke pengurus
		if currentKetua != nil && currentKetua.ID != memberID {
			demoteUpdate := bson.M{"role": models.MemberRolePengurus}
			if err := s.ukmRepo.UpdateMember(ctx, currentKetua.ID, demoteUpdate); err != nil {
				return nil, errors.New("terjadi kesalahan saat mengubah role ketua lama")
			}
		}
		update["role"] = models.MemberRoleKetua
	} else if req.Role != "" {
		update["role"] = req.Role
	}

	// Update status jika diisi
	if req.Status != "" {
		update["status"] = req.Status
	}

	if len(update) == 0 {
		return nil, errors.New("tidak ada data yang diperbarui")
	}

	if err := s.ukmRepo.UpdateMember(ctx, memberID, update); err != nil {
		return nil, errors.New("terjadi kesalahan saat memperbarui data anggota")
	}

	// Ambil data terbaru
	updated, err := s.ukmRepo.FindMemberByID(ctx, memberID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan saat mengambil data terbaru")
	}

	return updated, nil
}

// DeleteMember menghapus keanggotaan user dari UKM
func (s *UKMService) DeleteMember(ctx context.Context, ukmIDStr, memberIDStr string) error {
	ukmID, err := parseObjectID(ukmIDStr)
	if err != nil {
		return errors.New("ID UKM tidak valid")
	}

	memberID, err := parseObjectID(memberIDStr)
	if err != nil {
		return errors.New("ID member tidak valid")
	}

	// Pastikan member ada dan terdaftar di UKM yang benar
	member, err := s.ukmRepo.FindMemberByID(ctx, memberID)
	if err != nil {
		return errors.New("terjadi kesalahan pada server")
	}
	if member == nil {
		return errors.New("data keanggotaan tidak ditemukan")
	}
	if member.UKMID != ukmID {
		return errors.New("anggota tidak terdaftar di UKM ini")
	}

	if err := s.ukmRepo.DeleteMember(ctx, memberID); err != nil {
		return errors.New("terjadi kesalahan saat menghapus anggota")
	}

	return nil
}

// GetMyUKMs mengambil daftar UKM yang diikuti oleh user yang sedang login
func (s *UKMService) GetMyUKMs(ctx context.Context, userIDStr string) ([]*models.UKMMemberDetail, error) {
	userID, err := parseObjectID(userIDStr)
	if err != nil {
		return nil, errors.New("ID user tidak valid")
	}

	members, err := s.ukmRepo.FindMembersByUserID(ctx, userID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan saat mengambil data UKM")
	}

	// Populate data UKM untuk setiap keanggotaan
	var details []*models.UKMMemberDetail
	for _, m := range members {
		detail := &models.UKMMemberDetail{
			ID:       m.ID,
			UserID:   m.UserID,
			UKMID:    m.UKMID,
			Role:     m.Role,
			Status:   m.Status,
			JoinedAt: m.JoinedAt,
		}

		// Ambil data UKM
		ukm, err := s.ukmRepo.FindUKMByID(ctx, m.UKMID)
		if err == nil && ukm != nil {
			detail.UKM = ukm
		}

		details = append(details, detail)
	}

	if details == nil {
		details = []*models.UKMMemberDetail{}
	}

	return details, nil
}

// parseObjectID adalah helper untuk mengkonversi string ke primitive.ObjectID
func parseObjectID(id string) (primitive.ObjectID, error) {
	return primitive.ObjectIDFromHex(id)
}

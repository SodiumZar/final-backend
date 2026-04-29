package services

import (
	"context"
	"errors"

	"github.com/SodiumZar/final-backend.git/models"
	"github.com/SodiumZar/final-backend.git/repositories"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// AnnouncementService menangani logika bisnis untuk pengumuman UKM
type AnnouncementService struct {
	announcementRepo *repositories.AnnouncementRepository
	ukmRepo          *repositories.UKMRepository
}

// NewAnnouncementService membuat instance baru AnnouncementService
func NewAnnouncementService(
	announcementRepo *repositories.AnnouncementRepository,
	ukmRepo *repositories.UKMRepository,
) *AnnouncementService {
	return &AnnouncementService{
		announcementRepo: announcementRepo,
		ukmRepo:          ukmRepo,
	}
}

// GetAllAnnouncements mengambil semua pengumuman dari semua UKM
func (s *AnnouncementService) GetAllAnnouncements(ctx context.Context) ([]*models.Announcement, error) {
	announcements, err := s.announcementRepo.FindAll(ctx, bson.M{})
	if err != nil {
		return nil, errors.New("terjadi kesalahan saat mengambil data pengumuman")
	}
	return announcements, nil
}

// GetAnnouncementsByUKMID mengambil semua pengumuman dari UKM tertentu
func (s *AnnouncementService) GetAnnouncementsByUKMID(ctx context.Context, ukmIDStr string) ([]*models.Announcement, error) {
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

	announcements, err := s.announcementRepo.FindByUKMID(ctx, ukmID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan saat mengambil pengumuman")
	}

	return announcements, nil
}

// GetAnnouncementByID mengambil detail satu pengumuman
func (s *AnnouncementService) GetAnnouncementByID(ctx context.Context, announcementIDStr string) (*models.AnnouncementDetail, error) {
	announcementID, err := parseObjectID(announcementIDStr)
	if err != nil {
		return nil, errors.New("ID pengumuman tidak valid")
	}

	announcement, err := s.announcementRepo.FindByID(ctx, announcementID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan pada server")
	}
	if announcement == nil {
		return nil, errors.New("pengumuman tidak ditemukan")
	}

	// Buat AnnouncementDetail dan populate data UKM
	detail := &models.AnnouncementDetail{
		ID:        announcement.ID,
		UKMID:     announcement.UKMID,
		Title:     announcement.Title,
		Content:   announcement.Content,
		CreatedBy: announcement.CreatedBy,
		CreatedAt: announcement.CreatedAt,
		UpdatedAt: announcement.UpdatedAt,
	}

	// Populate data UKM terkait
	ukm, err := s.ukmRepo.FindUKMByID(ctx, announcement.UKMID)
	if err == nil && ukm != nil {
		detail.UKM = ukm
	}

	return detail, nil
}

// CreateAnnouncement membuat pengumuman baru
// Hanya bisa dibuat untuk UKM yang berstatus "active"
func (s *AnnouncementService) CreateAnnouncement(
	ctx context.Context,
	ukmIDStr string,
	req *models.CreateAnnouncementRequest,
	creatorIDStr string,
) (*models.Announcement, error) {
	ukmID, err := parseObjectID(ukmIDStr)
	if err != nil {
		return nil, errors.New("ID UKM tidak valid")
	}

	creatorID, err := parseObjectID(creatorIDStr)
	if err != nil {
		return nil, errors.New("ID pembuat tidak valid")
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
		return nil, errors.New("pengumuman hanya bisa dibuat untuk UKM yang aktif")
	}

	announcement := &models.Announcement{
		UKMID:     ukmID,
		Title:     req.Title,
		Content:   req.Content,
		CreatedBy: creatorID,
	}

	created, err := s.announcementRepo.Create(ctx, announcement)
	if err != nil {
		return nil, errors.New("terjadi kesalahan saat membuat pengumuman")
	}

	return created, nil
}

// UpdateAnnouncement memperbarui isi pengumuman
// Hanya pembuat atau admin yang bisa melakukan update
func (s *AnnouncementService) UpdateAnnouncement(
	ctx context.Context,
	announcementIDStr string,
	req *models.UpdateAnnouncementRequest,
	requesterIDStr string,
	requesterRole string,
) (*models.Announcement, error) {
	announcementID, err := parseObjectID(announcementIDStr)
	if err != nil {
		return nil, errors.New("ID pengumuman tidak valid")
	}

	// Pastikan pengumuman ada
	announcement, err := s.announcementRepo.FindByID(ctx, announcementID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan pada server")
	}
	if announcement == nil {
		return nil, errors.New("pengumuman tidak ditemukan")
	}

	// Cek hak akses: hanya admin atau pembuat pengumuman yang bisa edit
	if requesterRole != "admin" {
		requesterID, err := parseObjectID(requesterIDStr)
		if err != nil {
			return nil, errors.New("ID requester tidak valid")
		}

		// Konversi CreatedBy ke string untuk perbandingan
		if announcement.CreatedBy != requesterID {
			// Cek apakah requester adalah pengurus UKM pemilik pengumuman
			isPengurus, err := s.ukmRepo.IsUserPengurusOfUKM(ctx, requesterID, announcement.UKMID)
			if err != nil {
				return nil, errors.New("terjadi kesalahan saat memeriksa hak akses")
			}
			if !isPengurus {
				return nil, errors.New("anda tidak memiliki hak untuk mengubah pengumuman ini")
			}
		}
	}

	// Bangun object update
	update := bson.M{}
	if req.Title != "" {
		update["title"] = req.Title
	}
	if req.Content != "" {
		update["content"] = req.Content
	}

	if len(update) == 0 {
		return nil, errors.New("tidak ada data yang diperbarui")
	}

	if err := s.announcementRepo.Update(ctx, announcementID, update); err != nil {
		return nil, errors.New("terjadi kesalahan saat memperbarui pengumuman")
	}

	// Ambil data terbaru
	updated, err := s.announcementRepo.FindByID(ctx, announcementID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan saat mengambil data terbaru")
	}

	return updated, nil
}

// DeleteAnnouncement menghapus pengumuman
// Hanya pembuat atau admin yang bisa menghapus
func (s *AnnouncementService) DeleteAnnouncement(
	ctx context.Context,
	announcementIDStr string,
	requesterIDStr string,
	requesterRole string,
) error {
	announcementID, err := parseObjectID(announcementIDStr)
	if err != nil {
		return errors.New("ID pengumuman tidak valid")
	}

	// Pastikan pengumuman ada
	announcement, err := s.announcementRepo.FindByID(ctx, announcementID)
	if err != nil {
		return errors.New("terjadi kesalahan pada server")
	}
	if announcement == nil {
		return errors.New("pengumuman tidak ditemukan")
	}

	// Cek hak akses: hanya admin atau pembuat pengumuman yang bisa hapus
	if requesterRole != "admin" {
		requesterID, err := parseObjectID(requesterIDStr)
		if err != nil {
			return errors.New("ID requester tidak valid")
		}

		if announcement.CreatedBy != requesterID {
			// Cek apakah pengurus UKM dari UKM pemilik pengumuman
			isPengurus, err := s.ukmRepo.IsUserPengurusOfUKM(ctx, requesterID, announcement.UKMID)
			if err != nil {
				return errors.New("terjadi kesalahan saat memeriksa hak akses")
			}
			if !isPengurus {
				return errors.New("anda tidak memiliki hak untuk menghapus pengumuman ini")
			}
		}
	}

	if err := s.announcementRepo.Delete(ctx, announcementID); err != nil {
		return errors.New("terjadi kesalahan saat menghapus pengumuman")
	}

	return nil
}

// CheckUserAccessToAnnouncement memeriksa akses user ke pengumuman UKM tertentu
func (s *AnnouncementService) CheckUserAccessToAnnouncement(
	ctx context.Context,
	ukmID primitive.ObjectID,
	userIDStr string,
	userRole string,
) (bool, error) {
	// Admin selalu punya akses
	if userRole == "admin" {
		return true, nil
	}

	userID, err := parseObjectID(userIDStr)
	if err != nil {
		return false, errors.New("ID user tidak valid")
	}

	// Cek apakah user adalah pengurus UKM tersebut
	return s.ukmRepo.IsUserPengurusOfUKM(ctx, userID, ukmID)
}

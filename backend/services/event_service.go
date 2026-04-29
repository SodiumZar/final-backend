package services

import (
	"context"
	"errors"

	"github.com/SodiumZar/final-backend.git/models"
	"github.com/SodiumZar/final-backend.git/repositories"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// EventService menangani logika bisnis untuk event dan pendaftaran event
type EventService struct {
	eventRepo *repositories.EventRepository
	ukmRepo   *repositories.UKMRepository
	userRepo  *repositories.UserRepository
}

// NewEventService membuat instance baru EventService
func NewEventService(
	eventRepo *repositories.EventRepository,
	ukmRepo *repositories.UKMRepository,
	userRepo *repositories.UserRepository,
) *EventService {
	return &EventService{
		eventRepo: eventRepo,
		ukmRepo:   ukmRepo,
		userRepo:  userRepo,
	}
}

// ─────────────────────────────────────────────────────────────
// LOGIKA BISNIS: EVENT
// ─────────────────────────────────────────────────────────────

// GetAllEvents mengambil semua event dari semua UKM
func (s *EventService) GetAllEvents(ctx context.Context) ([]*models.Event, error) {
	events, err := s.eventRepo.FindAllEvents(ctx, bson.M{})
	if err != nil {
		return nil, errors.New("terjadi kesalahan saat mengambil data event")
	}
	return events, nil
}

// GetEventsByUKMID mengambil semua event dari UKM tertentu
func (s *EventService) GetEventsByUKMID(ctx context.Context, ukmIDStr string) ([]*models.Event, error) {
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

	events, err := s.eventRepo.FindEventsByUKMID(ctx, ukmID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan saat mengambil data event")
	}

	return events, nil
}

// GetEventByID mengambil detail event beserta informasi quota
func (s *EventService) GetEventByID(ctx context.Context, eventIDStr string) (*models.EventDetail, error) {
	eventID, err := parseObjectID(eventIDStr)
	if err != nil {
		return nil, errors.New("ID event tidak valid")
	}

	event, err := s.eventRepo.FindEventByID(ctx, eventID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan pada server")
	}
	if event == nil {
		return nil, errors.New("event tidak ditemukan")
	}

	// Hitung jumlah pendaftar yang sudah diapprove
	approvedCount, err := s.eventRepo.CountApprovedRegistrants(ctx, eventID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan saat menghitung pendaftar")
	}

	// Hitung sisa quota yang tersedia
	remainingQuota := event.Quota - int(approvedCount)
	if remainingQuota < 0 {
		remainingQuota = 0
	}

	// Buat EventDetail dengan data relasi
	detail := &models.EventDetail{
		ID:             event.ID,
		UKMID:          event.UKMID,
		Title:          event.Title,
		Description:    event.Description,
		Location:       event.Location,
		StartDate:      event.StartDate,
		EndDate:        event.EndDate,
		Quota:          event.Quota,
		Status:         event.Status,
		CreatedBy:      event.CreatedBy,
		CreatedAt:      event.CreatedAt,
		UpdatedAt:      event.UpdatedAt,
		ApprovedCount:  int(approvedCount),
		RemainingQuota: remainingQuota,
	}

	// Populate data UKM
	ukm, err := s.ukmRepo.FindUKMByID(ctx, event.UKMID)
	if err == nil && ukm != nil {
		detail.UKM = ukm
	}

	return detail, nil
}

// CreateEvent membuat event baru untuk UKM tertentu
func (s *EventService) CreateEvent(
	ctx context.Context,
	ukmIDStr string,
	req *models.CreateEventRequest,
	creatorIDStr string,
) (*models.Event, error) {
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
		return nil, errors.New("UKM tidak aktif, tidak bisa membuat event")
	}

	// Validasi: StartDate harus sebelum EndDate
	if !req.StartDate.Before(req.EndDate) {
		return nil, errors.New("tanggal mulai harus sebelum tanggal selesai")
	}

	// Validasi: Quota minimal 1
	if req.Quota < 1 {
		return nil, errors.New("quota minimal adalah 1")
	}

	event := &models.Event{
		UKMID:       ukmID,
		Title:       req.Title,
		Description: req.Description,
		Location:    req.Location,
		StartDate:   req.StartDate,
		EndDate:     req.EndDate,
		Quota:       req.Quota,
		CreatedBy:   creatorID,
		// Status default "upcoming" diset di repository
	}

	created, err := s.eventRepo.CreateEvent(ctx, event)
	if err != nil {
		return nil, errors.New("terjadi kesalahan saat membuat event")
	}

	return created, nil
}

// UpdateEvent memperbarui data event
func (s *EventService) UpdateEvent(
	ctx context.Context,
	eventIDStr string,
	req *models.UpdateEventRequest,
	requesterIDStr string,
	requesterRole string,
) (*models.Event, error) {
	eventID, err := parseObjectID(eventIDStr)
	if err != nil {
		return nil, errors.New("ID event tidak valid")
	}

	// Pastikan event ada
	event, err := s.eventRepo.FindEventByID(ctx, eventID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan pada server")
	}
	if event == nil {
		return nil, errors.New("event tidak ditemukan")
	}

	// Cek apakah requester adalah admin atau pengurus UKM pemilik event
	if requesterRole != "admin" {
		requesterID, err := parseObjectID(requesterIDStr)
		if err != nil {
			return nil, errors.New("ID requester tidak valid")
		}
		isPengurus, err := s.ukmRepo.IsUserPengurusOfUKM(ctx, requesterID, event.UKMID)
		if err != nil {
			return nil, errors.New("terjadi kesalahan saat memeriksa hak akses")
		}
		if !isPengurus {
			return nil, errors.New("anda tidak memiliki hak untuk mengubah event ini")
		}
	}

	// Bangun object update
	update := bson.M{}
	if req.Title != "" {
		update["title"] = req.Title
	}
	if req.Description != "" {
		update["description"] = req.Description
	}
	if req.Location != "" {
		update["location"] = req.Location
	}
	if req.Quota > 0 {
		update["quota"] = req.Quota
	}
	if req.Status != "" {
		update["status"] = req.Status
	}

	// Validasi tanggal jika keduanya diisi
	startDate := req.StartDate
	endDate := req.EndDate
	if !startDate.IsZero() && !endDate.IsZero() {
		if !startDate.Before(endDate) {
			return nil, errors.New("tanggal mulai harus sebelum tanggal selesai")
		}
		update["start_date"] = startDate
		update["end_date"] = endDate
	} else if !startDate.IsZero() {
		// Hanya startDate yang diisi, bandingkan dengan endDate yang ada
		if !startDate.Before(event.EndDate) {
			return nil, errors.New("tanggal mulai harus sebelum tanggal selesai")
		}
		update["start_date"] = startDate
	} else if !endDate.IsZero() {
		// Hanya endDate yang diisi, bandingkan dengan startDate yang ada
		if !event.StartDate.Before(endDate) {
			return nil, errors.New("tanggal selesai harus setelah tanggal mulai")
		}
		update["end_date"] = endDate
	}

	if len(update) == 0 {
		return nil, errors.New("tidak ada data yang diperbarui")
	}

	if err := s.eventRepo.UpdateEvent(ctx, eventID, update); err != nil {
		return nil, errors.New("terjadi kesalahan saat memperbarui event")
	}

	// Ambil data terbaru
	updated, err := s.eventRepo.FindEventByID(ctx, eventID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan saat mengambil data terbaru")
	}

	return updated, nil
}

// DeleteEvent menghapus event
// Event tidak bisa dihapus jika ada pendaftar yang sudah diapprove
func (s *EventService) DeleteEvent(
	ctx context.Context,
	eventIDStr string,
	requesterIDStr string,
	requesterRole string,
) error {
	eventID, err := parseObjectID(eventIDStr)
	if err != nil {
		return errors.New("ID event tidak valid")
	}

	// Pastikan event ada
	event, err := s.eventRepo.FindEventByID(ctx, eventID)
	if err != nil {
		return errors.New("terjadi kesalahan pada server")
	}
	if event == nil {
		return errors.New("event tidak ditemukan")
	}

	// Cek hak akses
	if requesterRole != "admin" {
		requesterID, err := parseObjectID(requesterIDStr)
		if err != nil {
			return errors.New("ID requester tidak valid")
		}
		isPengurus, err := s.ukmRepo.IsUserPengurusOfUKM(ctx, requesterID, event.UKMID)
		if err != nil {
			return errors.New("terjadi kesalahan saat memeriksa hak akses")
		}
		if !isPengurus {
			return errors.New("anda tidak memiliki hak untuk menghapus event ini")
		}
	}

	// Cek apakah ada pendaftar yang sudah diapprove
	hasApproved, err := s.eventRepo.HasApprovedRegistrants(ctx, eventID)
	if err != nil {
		return errors.New("terjadi kesalahan saat memeriksa pendaftar event")
	}
	if hasApproved {
		return errors.New("event tidak dapat dihapus karena sudah ada peserta yang disetujui")
	}

	if err := s.eventRepo.DeleteEvent(ctx, eventID); err != nil {
		return errors.New("terjadi kesalahan saat menghapus event")
	}

	return nil
}

// ─────────────────────────────────────────────────────────────
// LOGIKA BISNIS: PENDAFTARAN EVENT
// ─────────────────────────────────────────────────────────────

// RegisterToEvent mendaftarkan user ke sebuah event
func (s *EventService) RegisterToEvent(ctx context.Context, eventIDStr, userIDStr string) (*models.EventRegistrant, error) {
	eventID, err := parseObjectID(eventIDStr)
	if err != nil {
		return nil, errors.New("ID event tidak valid")
	}

	userID, err := parseObjectID(userIDStr)
	if err != nil {
		return nil, errors.New("ID user tidak valid")
	}

	// Pastikan event ada
	event, err := s.eventRepo.FindEventByID(ctx, eventID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan pada server")
	}
	if event == nil {
		return nil, errors.New("event tidak ditemukan")
	}

	// Cek status event: hanya bisa daftar ke event berstatus "upcoming"
	if event.Status != models.EventStatusUpcoming {
		return nil, errors.New("tidak bisa mendaftar ke event yang bukan berstatus upcoming")
	}

	// Cek apakah user sudah mendaftar ke event ini sebelumnya
	existing, err := s.eventRepo.FindRegistrant(ctx, eventID, userID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan pada server")
	}
	if existing != nil {
		return nil, errors.New("anda sudah mendaftar ke event ini")
	}

	// Cek ketersediaan quota
	approvedCount, err := s.eventRepo.CountApprovedRegistrants(ctx, eventID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan saat memeriksa quota")
	}
	if int(approvedCount) >= event.Quota {
		return nil, errors.New("quota event sudah penuh")
	}

	// Buat record pendaftaran baru (status: pending)
	registrant := &models.EventRegistrant{
		EventID: eventID,
		UserID:  userID,
	}

	created, err := s.eventRepo.CreateRegistrant(ctx, registrant)
	if err != nil {
		return nil, errors.New("terjadi kesalahan saat mendaftar ke event")
	}

	return created, nil
}

// GetEventRegistrants mengambil semua pendaftar event beserta detail user
func (s *EventService) GetEventRegistrants(ctx context.Context, eventIDStr string) ([]*models.EventRegistrantDetail, error) {
	eventID, err := parseObjectID(eventIDStr)
	if err != nil {
		return nil, errors.New("ID event tidak valid")
	}

	// Pastikan event ada
	event, err := s.eventRepo.FindEventByID(ctx, eventID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan pada server")
	}
	if event == nil {
		return nil, errors.New("event tidak ditemukan")
	}

	registrants, err := s.eventRepo.FindRegistrantsByEventID(ctx, eventID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan saat mengambil data pendaftar")
	}

	// Populate data user untuk setiap pendaftar
	var details []*models.EventRegistrantDetail
	for _, reg := range registrants {
		detail := &models.EventRegistrantDetail{
			ID:           reg.ID,
			EventID:      reg.EventID,
			UserID:       reg.UserID,
			Status:       reg.Status,
			RegisteredAt: reg.RegisteredAt,
		}

		// Ambil data user
		user, err := s.userRepo.FindByID(ctx, reg.UserID)
		if err == nil && user != nil {
			userResp := user.ToResponse()
			detail.User = &userResp
		}

		details = append(details, detail)
	}

	if details == nil {
		details = []*models.EventRegistrantDetail{}
	}

	return details, nil
}

// UpdateRegistrantStatus mengubah status pendaftaran (approved/rejected)
func (s *EventService) UpdateRegistrantStatus(
	ctx context.Context,
	eventIDStr string,
	registrantIDStr string,
	req *models.UpdateRegistrantRequest,
) (*models.EventRegistrant, error) {
	eventID, err := parseObjectID(eventIDStr)
	if err != nil {
		return nil, errors.New("ID event tidak valid")
	}

	registrantID, err := parseObjectID(registrantIDStr)
	if err != nil {
		return nil, errors.New("ID pendaftar tidak valid")
	}

	// Pastikan event ada
	event, err := s.eventRepo.FindEventByID(ctx, eventID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan pada server")
	}
	if event == nil {
		return nil, errors.New("event tidak ditemukan")
	}

	// Pastikan record pendaftar ada
	registrant, err := s.eventRepo.FindRegistrantByID(ctx, registrantID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan pada server")
	}
	if registrant == nil {
		return nil, errors.New("data pendaftar tidak ditemukan")
	}

	// Pastikan pendaftar ini memang terdaftar di event yang dimaksud
	if registrant.EventID != eventID {
		return nil, errors.New("pendaftar tidak terdaftar di event ini")
	}

	// Validasi status yang dikirim
	validStatuses := map[models.RegistrantStatus]bool{
		models.RegistrantStatusPending:  true,
		models.RegistrantStatusApproved: true,
		models.RegistrantStatusRejected: true,
	}
	if !validStatuses[req.Status] {
		return nil, errors.New("status tidak valid, pilih: pending, approved, atau rejected")
	}

	// Jika akan diapprove, cek apakah quota masih tersedia
	if req.Status == models.RegistrantStatusApproved {
		approvedCount, err := s.eventRepo.CountApprovedRegistrants(ctx, eventID)
		if err != nil {
			return nil, errors.New("terjadi kesalahan saat memeriksa quota")
		}
		// Hitung tanpa menghitung registrant ini (mungkin sudah approved sebelumnya)
		currentlyApproved := int(approvedCount)
		if registrant.Status != models.RegistrantStatusApproved {
			// Jika belum approved, cek apakah quota masih ada
			if currentlyApproved >= event.Quota {
				return nil, errors.New("quota event sudah penuh, tidak bisa menyetujui pendaftar ini")
			}
		}
	}

	update := bson.M{"status": req.Status}
	if err := s.eventRepo.UpdateRegistrant(ctx, registrantID, update); err != nil {
		return nil, errors.New("terjadi kesalahan saat memperbarui status pendaftar")
	}

	// Ambil data terbaru
	updated, err := s.eventRepo.FindRegistrantByID(ctx, registrantID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan saat mengambil data terbaru")
	}

	return updated, nil
}

// GetMyEvents mengambil daftar event yang didaftarkan oleh user yang sedang login
func (s *EventService) GetMyEvents(ctx context.Context, userIDStr string) ([]*models.EventRegistrantDetail, error) {
	userID, err := parseObjectID(userIDStr)
	if err != nil {
		return nil, errors.New("ID user tidak valid")
	}

	registrants, err := s.eventRepo.FindRegistrantsByUserID(ctx, userID)
	if err != nil {
		return nil, errors.New("terjadi kesalahan saat mengambil data event")
	}

	// Populate data event untuk setiap pendaftaran
	var details []*models.EventRegistrantDetail
	for _, reg := range registrants {
		detail := &models.EventRegistrantDetail{
			ID:           reg.ID,
			EventID:      reg.EventID,
			UserID:       reg.UserID,
			Status:       reg.Status,
			RegisteredAt: reg.RegisteredAt,
		}

		// Ambil data event
		event, err := s.eventRepo.FindEventByID(ctx, reg.EventID)
		if err == nil && event != nil {
			detail.Event = event
		}

		details = append(details, detail)
	}

	if details == nil {
		details = []*models.EventRegistrantDetail{}
	}

	return details, nil
}

// CheckUserAccessToEvent memeriksa apakah user punya akses ke event tertentu
// (admin atau pengurus UKM pemilik event)
func (s *EventService) CheckUserAccessToEvent(ctx context.Context, eventID primitive.ObjectID, userIDStr, userRole string) (bool, error) {
	if userRole == "admin" {
		return true, nil
	}

	event, err := s.eventRepo.FindEventByID(ctx, eventID)
	if err != nil || event == nil {
		return false, errors.New("event tidak ditemukan")
	}

	userID, err := parseObjectID(userIDStr)
	if err != nil {
		return false, errors.New("ID user tidak valid")
	}

	return s.ukmRepo.IsUserPengurusOfUKM(ctx, userID, event.UKMID)
}

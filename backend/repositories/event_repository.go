package repositories

import (
	"context"
	"time"

	"github.com/SodiumZar/final-backend.git/config"
	"github.com/SodiumZar/final-backend.git/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// EventRepository menangani semua operasi database untuk collection events dan event_registrants
type EventRepository struct {
	eventCollection      *mongo.Collection
	registrantCollection *mongo.Collection
}

// NewEventRepository membuat instance baru EventRepository
func NewEventRepository() *EventRepository {
	return &EventRepository{
		eventCollection:      config.GetCollection("events"),
		registrantCollection: config.GetCollection("event_registrants"),
	}
}

// ─────────────────────────────────────────────────────────────
// OPERASI PADA COLLECTION: events
// ─────────────────────────────────────────────────────────────

// CreateEvent menyimpan event baru ke database
func (r *EventRepository) CreateEvent(ctx context.Context, event *models.Event) (*models.Event, error) {
	now := time.Now()
	event.ID = primitive.NewObjectID()
	event.CreatedAt = now
	event.UpdatedAt = now
	// Status default event baru adalah "upcoming"
	event.Status = models.EventStatusUpcoming

	_, err := r.eventCollection.InsertOne(ctx, event)
	if err != nil {
		return nil, err
	}
	return event, nil
}

// FindAllEvents mengambil semua event dengan filter opsional
func (r *EventRepository) FindAllEvents(ctx context.Context, filter bson.M) ([]*models.Event, error) {
	// Urutkan berdasarkan start_date terbaru
	opts := options.Find().SetSort(bson.D{{Key: "start_date", Value: -1}})

	cursor, err := r.eventCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var events []*models.Event
	if err = cursor.All(ctx, &events); err != nil {
		return nil, err
	}

	if events == nil {
		events = []*models.Event{}
	}

	return events, nil
}

// FindEventsByUKMID mengambil semua event milik UKM tertentu
func (r *EventRepository) FindEventsByUKMID(ctx context.Context, ukmID primitive.ObjectID) ([]*models.Event, error) {
	filter := bson.M{"ukm_id": ukmID}
	return r.FindAllEvents(ctx, filter)
}

// FindEventByID mencari event berdasarkan ObjectID
func (r *EventRepository) FindEventByID(ctx context.Context, id primitive.ObjectID) (*models.Event, error) {
	var event models.Event

	filter := bson.M{"_id": id}
	err := r.eventCollection.FindOne(ctx, filter).Decode(&event)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &event, nil
}

// UpdateEvent memperbarui data event berdasarkan ID
func (r *EventRepository) UpdateEvent(ctx context.Context, id primitive.ObjectID, update bson.M) error {
	update["updated_at"] = time.Now()

	filter := bson.M{"_id": id}
	updateDoc := bson.M{"$set": update}

	_, err := r.eventCollection.UpdateOne(ctx, filter, updateDoc)
	return err
}

// DeleteEvent menghapus event berdasarkan ID
func (r *EventRepository) DeleteEvent(ctx context.Context, id primitive.ObjectID) error {
	filter := bson.M{"_id": id}
	_, err := r.eventCollection.DeleteOne(ctx, filter)
	return err
}

// ─────────────────────────────────────────────────────────────
// OPERASI PADA COLLECTION: event_registrants
// ─────────────────────────────────────────────────────────────

// CreateRegistrant mendaftarkan user ke event
func (r *EventRepository) CreateRegistrant(ctx context.Context, reg *models.EventRegistrant) (*models.EventRegistrant, error) {
	reg.ID = primitive.NewObjectID()
	reg.RegisteredAt = time.Now()
	// Status pendaftaran default adalah "pending"
	reg.Status = models.RegistrantStatusPending

	_, err := r.registrantCollection.InsertOne(ctx, reg)
	if err != nil {
		return nil, err
	}
	return reg, nil
}

// FindRegistrantsByEventID mengambil semua pendaftar dari sebuah event
func (r *EventRepository) FindRegistrantsByEventID(ctx context.Context, eventID primitive.ObjectID) ([]*models.EventRegistrant, error) {
	filter := bson.M{"event_id": eventID}
	opts := options.Find().SetSort(bson.D{{Key: "registered_at", Value: -1}})

	cursor, err := r.registrantCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var registrants []*models.EventRegistrant
	if err = cursor.All(ctx, &registrants); err != nil {
		return nil, err
	}

	if registrants == nil {
		registrants = []*models.EventRegistrant{}
	}

	return registrants, nil
}

// FindRegistrantsByUserID mengambil semua event yang didaftarkan oleh user
func (r *EventRepository) FindRegistrantsByUserID(ctx context.Context, userID primitive.ObjectID) ([]*models.EventRegistrant, error) {
	filter := bson.M{"user_id": userID}
	opts := options.Find().SetSort(bson.D{{Key: "registered_at", Value: -1}})

	cursor, err := r.registrantCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var registrants []*models.EventRegistrant
	if err = cursor.All(ctx, &registrants); err != nil {
		return nil, err
	}

	if registrants == nil {
		registrants = []*models.EventRegistrant{}
	}

	return registrants, nil
}

// FindRegistrant mencari satu record pendaftaran berdasarkan eventID dan userID
func (r *EventRepository) FindRegistrant(ctx context.Context, eventID, userID primitive.ObjectID) (*models.EventRegistrant, error) {
	var reg models.EventRegistrant

	filter := bson.M{
		"event_id": eventID,
		"user_id":  userID,
	}

	err := r.registrantCollection.FindOne(ctx, filter).Decode(&reg)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &reg, nil
}

// FindRegistrantByID mencari pendaftar berdasarkan ObjectID
func (r *EventRepository) FindRegistrantByID(ctx context.Context, id primitive.ObjectID) (*models.EventRegistrant, error) {
	var reg models.EventRegistrant

	filter := bson.M{"_id": id}
	err := r.registrantCollection.FindOne(ctx, filter).Decode(&reg)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &reg, nil
}

// UpdateRegistrant memperbarui status pendaftaran
func (r *EventRepository) UpdateRegistrant(ctx context.Context, id primitive.ObjectID, update bson.M) error {
	filter := bson.M{"_id": id}
	updateDoc := bson.M{"$set": update}

	_, err := r.registrantCollection.UpdateOne(ctx, filter, updateDoc)
	return err
}

// CountApprovedRegistrants menghitung pendaftar yang sudah diapprove untuk sebuah event
// Digunakan untuk mengecek apakah quota masih tersedia
func (r *EventRepository) CountApprovedRegistrants(ctx context.Context, eventID primitive.ObjectID) (int64, error) {
	filter := bson.M{
		"event_id": eventID,
		"status":   models.RegistrantStatusApproved,
	}
	return r.registrantCollection.CountDocuments(ctx, filter)
}

// HasApprovedRegistrants mengecek apakah ada pendaftar yang sudah diapprove
// Digunakan sebelum menghapus event (event tidak bisa dihapus jika ada approved registrant)
func (r *EventRepository) HasApprovedRegistrants(ctx context.Context, eventID primitive.ObjectID) (bool, error) {
	count, err := r.CountApprovedRegistrants(ctx, eventID)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

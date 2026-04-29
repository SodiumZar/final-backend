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

// AnnouncementRepository menangani semua operasi database untuk collection announcements
type AnnouncementRepository struct {
	collection *mongo.Collection
}

// NewAnnouncementRepository membuat instance baru AnnouncementRepository
func NewAnnouncementRepository() *AnnouncementRepository {
	return &AnnouncementRepository{
		collection: config.GetCollection("announcements"),
	}
}

// Create menyimpan pengumuman baru ke database
func (r *AnnouncementRepository) Create(ctx context.Context, announcement *models.Announcement) (*models.Announcement, error) {
	now := time.Now()
	announcement.ID = primitive.NewObjectID()
	announcement.CreatedAt = now
	announcement.UpdatedAt = now

	_, err := r.collection.InsertOne(ctx, announcement)
	if err != nil {
		return nil, err
	}
	return announcement, nil
}

// FindAll mengambil semua pengumuman dengan filter opsional
func (r *AnnouncementRepository) FindAll(ctx context.Context, filter bson.M) ([]*models.Announcement, error) {
	// Urutkan berdasarkan waktu pembuatan terbaru (pengumuman terbaru di atas)
	opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})

	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var announcements []*models.Announcement
	if err = cursor.All(ctx, &announcements); err != nil {
		return nil, err
	}

	// Kembalikan slice kosong bukan nil
	if announcements == nil {
		announcements = []*models.Announcement{}
	}

	return announcements, nil
}

// FindByUKMID mengambil semua pengumuman dari UKM tertentu
func (r *AnnouncementRepository) FindByUKMID(ctx context.Context, ukmID primitive.ObjectID) ([]*models.Announcement, error) {
	filter := bson.M{"ukm_id": ukmID}
	return r.FindAll(ctx, filter)
}

// FindByID mencari pengumuman berdasarkan ObjectID
func (r *AnnouncementRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*models.Announcement, error) {
	var announcement models.Announcement

	filter := bson.M{"_id": id}
	err := r.collection.FindOne(ctx, filter).Decode(&announcement)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &announcement, nil
}

// Update memperbarui isi pengumuman berdasarkan ID
func (r *AnnouncementRepository) Update(ctx context.Context, id primitive.ObjectID, update bson.M) error {
	// Selalu perbarui field updated_at
	update["updated_at"] = time.Now()

	filter := bson.M{"_id": id}
	updateDoc := bson.M{"$set": update}

	_, err := r.collection.UpdateOne(ctx, filter, updateDoc)
	return err
}

// Delete menghapus pengumuman berdasarkan ID
func (r *AnnouncementRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	filter := bson.M{"_id": id}
	_, err := r.collection.DeleteOne(ctx, filter)
	return err
}

// FindByIDAndCreator mencari pengumuman berdasarkan ID dan pembuat
// Digunakan untuk validasi: hanya pembuat atau admin yang bisa edit/hapus
func (r *AnnouncementRepository) FindByIDAndCreator(ctx context.Context, id, creatorID primitive.ObjectID) (*models.Announcement, error) {
	var announcement models.Announcement

	filter := bson.M{
		"_id":        id,
		"created_by": creatorID,
	}

	err := r.collection.FindOne(ctx, filter).Decode(&announcement)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &announcement, nil
}

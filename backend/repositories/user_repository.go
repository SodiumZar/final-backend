package repositories

import (
	"context"
	"time"

	"github.com/SodiumZar/final-backend.git/config"
	"github.com/SodiumZar/final-backend.git/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// UserRepository menangani semua operasi database untuk collection users
type UserRepository struct {
	collection *mongo.Collection
}

// NewUserRepository membuat instance baru UserRepository
func NewUserRepository() *UserRepository {
	return &UserRepository{
		collection: config.GetCollection("users"),
	}
}

// Create menyimpan user baru ke database
func (r *UserRepository) Create(ctx context.Context, user *models.User) (*models.User, error) {
	// Set waktu pembuatan dan update
	now := time.Now()
	user.CreatedAt = now
	user.UpdatedAt = now

	// Buat ObjectID baru untuk user
	user.ID = primitive.NewObjectID()

	// Insert ke MongoDB
	_, err := r.collection.InsertOne(ctx, user)
	if err != nil {
		return nil, err
	}

	return user, nil
}

// FindByEmail mencari user berdasarkan alamat email
func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User

	// Filter berdasarkan email (case-sensitive di MongoDB)
	filter := bson.M{"email": email}

	err := r.collection.FindOne(ctx, filter).Decode(&user)
	if err != nil {
		// Kembalikan nil jika tidak ditemukan (bukan error sebenarnya)
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &user, nil
}

// FindByID mencari user berdasarkan ObjectID
func (r *UserRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*models.User, error) {
	var user models.User

	filter := bson.M{"_id": id}

	err := r.collection.FindOne(ctx, filter).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &user, nil
}

// FindByNIM mencari user berdasarkan Nomor Induk Mahasiswa
func (r *UserRepository) FindByNIM(ctx context.Context, nim string) (*models.User, error) {
	var user models.User

	filter := bson.M{"nim": nim}

	err := r.collection.FindOne(ctx, filter).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &user, nil
}

// UpdateByID memperbarui data user berdasarkan ID
func (r *UserRepository) UpdateByID(ctx context.Context, id primitive.ObjectID, update bson.M) error {
	// Selalu perbarui field updated_at saat ada perubahan
	update["updated_at"] = time.Now()

	filter := bson.M{"_id": id}
	updateDoc := bson.M{"$set": update}

	_, err := r.collection.UpdateOne(ctx, filter, updateDoc)
	return err
}

// ExistsByEmail mengecek apakah email sudah digunakan (untuk validasi registrasi)
func (r *UserRepository) ExistsByEmail(ctx context.Context, email string) (bool, error) {
	filter := bson.M{"email": email}
	count, err := r.collection.CountDocuments(ctx, filter)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// ExistsByNIM mengecek apakah NIM sudah digunakan
func (r *UserRepository) ExistsByNIM(ctx context.Context, nim string) (bool, error) {
	filter := bson.M{"nim": nim}
	count, err := r.collection.CountDocuments(ctx, filter)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

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

// UKMRepository menangani semua operasi database untuk collection ukms dan ukm_members
type UKMRepository struct {
	ukmCollection    *mongo.Collection
	memberCollection *mongo.Collection
}

// NewUKMRepository membuat instance baru UKMRepository
func NewUKMRepository() *UKMRepository {
	return &UKMRepository{
		ukmCollection:    config.GetCollection("ukms"),
		memberCollection: config.GetCollection("ukm_members"),
	}
}

// ─────────────────────────────────────────────────────────────
// OPERASI PADA COLLECTION: ukms
// ─────────────────────────────────────────────────────────────

// CreateUKM menyimpan UKM baru ke database
func (r *UKMRepository) CreateUKM(ctx context.Context, ukm *models.UKM) (*models.UKM, error) {
	now := time.Now()
	ukm.ID = primitive.NewObjectID()
	ukm.CreatedAt = now
	ukm.UpdatedAt = now
	// Status default saat UKM baru dibuat adalah "pending"
	ukm.Status = models.UKMStatusPending

	_, err := r.ukmCollection.InsertOne(ctx, ukm)
	if err != nil {
		return nil, err
	}
	return ukm, nil
}

// FindAllUKMs mengambil semua UKM dengan opsi filter dan sorting
func (r *UKMRepository) FindAllUKMs(ctx context.Context, filter bson.M) ([]*models.UKM, error) {
	// Urutkan berdasarkan waktu pembuatan terbaru
	opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})

	cursor, err := r.ukmCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var ukms []*models.UKM
	if err = cursor.All(ctx, &ukms); err != nil {
		return nil, err
	}

	// Kembalikan slice kosong jika tidak ada data (bukan nil)
	if ukms == nil {
		ukms = []*models.UKM{}
	}

	return ukms, nil
}

// FindUKMByID mencari UKM berdasarkan ObjectID
func (r *UKMRepository) FindUKMByID(ctx context.Context, id primitive.ObjectID) (*models.UKM, error) {
	var ukm models.UKM

	filter := bson.M{"_id": id}
	err := r.ukmCollection.FindOne(ctx, filter).Decode(&ukm)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &ukm, nil
}

// UpdateUKM memperbarui data UKM berdasarkan ID
func (r *UKMRepository) UpdateUKM(ctx context.Context, id primitive.ObjectID, update bson.M) error {
	update["updated_at"] = time.Now()

	filter := bson.M{"_id": id}
	updateDoc := bson.M{"$set": update}

	_, err := r.ukmCollection.UpdateOne(ctx, filter, updateDoc)
	return err
}

// DeleteUKM menghapus UKM berdasarkan ID
func (r *UKMRepository) DeleteUKM(ctx context.Context, id primitive.ObjectID) error {
	filter := bson.M{"_id": id}
	_, err := r.ukmCollection.DeleteOne(ctx, filter)
	return err
}

// ─────────────────────────────────────────────────────────────
// OPERASI PADA COLLECTION: ukm_members
// ─────────────────────────────────────────────────────────────

// CreateMember menambahkan anggota baru ke UKM
func (r *UKMRepository) CreateMember(ctx context.Context, member *models.UKMMember) (*models.UKMMember, error) {
	member.ID = primitive.NewObjectID()
	member.JoinedAt = time.Now()
	// Role default saat pertama join adalah "anggota" dengan status "pending"
	member.Role = models.MemberRoleAnggota
	member.Status = models.MemberStatusPending

	_, err := r.memberCollection.InsertOne(ctx, member)
	if err != nil {
		return nil, err
	}
	return member, nil
}

// FindMembersByUKMID mengambil semua anggota berdasarkan ID UKM
func (r *UKMRepository) FindMembersByUKMID(ctx context.Context, ukmID primitive.ObjectID) ([]*models.UKMMember, error) {
	filter := bson.M{"ukm_id": ukmID}
	opts := options.Find().SetSort(bson.D{{Key: "joined_at", Value: -1}})

	cursor, err := r.memberCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var members []*models.UKMMember
	if err = cursor.All(ctx, &members); err != nil {
		return nil, err
	}

	if members == nil {
		members = []*models.UKMMember{}
	}

	return members, nil
}

// FindMembersByUserID mengambil semua UKM yang diikuti oleh seorang user
func (r *UKMRepository) FindMembersByUserID(ctx context.Context, userID primitive.ObjectID) ([]*models.UKMMember, error) {
	filter := bson.M{"user_id": userID}
	opts := options.Find().SetSort(bson.D{{Key: "joined_at", Value: -1}})

	cursor, err := r.memberCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var members []*models.UKMMember
	if err = cursor.All(ctx, &members); err != nil {
		return nil, err
	}

	if members == nil {
		members = []*models.UKMMember{}
	}

	return members, nil
}

// FindMember mencari satu record keanggotaan berdasarkan userID dan ukmID
func (r *UKMRepository) FindMember(ctx context.Context, userID, ukmID primitive.ObjectID) (*models.UKMMember, error) {
	var member models.UKMMember

	filter := bson.M{
		"user_id": userID,
		"ukm_id":  ukmID,
	}

	err := r.memberCollection.FindOne(ctx, filter).Decode(&member)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &member, nil
}

// FindMemberByID mencari member berdasarkan ObjectID member itu sendiri
func (r *UKMRepository) FindMemberByID(ctx context.Context, memberID primitive.ObjectID) (*models.UKMMember, error) {
	var member models.UKMMember

	filter := bson.M{"_id": memberID}
	err := r.memberCollection.FindOne(ctx, filter).Decode(&member)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &member, nil
}

// FindKetua mencari ketua dari sebuah UKM
func (r *UKMRepository) FindKetua(ctx context.Context, ukmID primitive.ObjectID) (*models.UKMMember, error) {
	var member models.UKMMember

	filter := bson.M{
		"ukm_id": ukmID,
		"role":   models.MemberRoleKetua,
		"status": models.MemberStatusActive,
	}

	err := r.memberCollection.FindOne(ctx, filter).Decode(&member)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &member, nil
}

// UpdateMember memperbarui data keanggotaan berdasarkan ID member
func (r *UKMRepository) UpdateMember(ctx context.Context, memberID primitive.ObjectID, update bson.M) error {
	filter := bson.M{"_id": memberID}
	updateDoc := bson.M{"$set": update}

	_, err := r.memberCollection.UpdateOne(ctx, filter, updateDoc)
	return err
}

// UpdateMemberByUserAndUKM memperbarui data keanggotaan berdasarkan userID dan ukmID
func (r *UKMRepository) UpdateMemberByUserAndUKM(ctx context.Context, userID, ukmID primitive.ObjectID, update bson.M) error {
	filter := bson.M{
		"user_id": userID,
		"ukm_id":  ukmID,
	}
	updateDoc := bson.M{"$set": update}

	_, err := r.memberCollection.UpdateOne(ctx, filter, updateDoc)
	return err
}

// DeleteMember menghapus keanggotaan berdasarkan ID member
func (r *UKMRepository) DeleteMember(ctx context.Context, memberID primitive.ObjectID) error {
	filter := bson.M{"_id": memberID}
	_, err := r.memberCollection.DeleteOne(ctx, filter)
	return err
}

// CountActiveMembersByUKMID menghitung jumlah anggota aktif di sebuah UKM
func (r *UKMRepository) CountActiveMembersByUKMID(ctx context.Context, ukmID primitive.ObjectID) (int64, error) {
	filter := bson.M{
		"ukm_id": ukmID,
		"status": models.MemberStatusActive,
	}
	return r.memberCollection.CountDocuments(ctx, filter)
}

// IsUserMemberOfUKM mengecek apakah user adalah pengurus atau ketua dari UKM tertentu
func (r *UKMRepository) IsUserPengurusOfUKM(ctx context.Context, userID, ukmID primitive.ObjectID) (bool, error) {
	filter := bson.M{
		"user_id": userID,
		"ukm_id":  ukmID,
		"status":  models.MemberStatusActive,
		"role": bson.M{
			// Cek apakah role adalah ketua atau pengurus
			"$in": []models.MemberRole{
				models.MemberRoleKetua,
				models.MemberRolePengurus,
			},
		},
	}

	count, err := r.memberCollection.CountDocuments(ctx, filter)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../utils/colors';
import Icon from 'react-native-vector-icons/FontAwesome';

interface ReviewPostProps {
  reviewDetails: {
    name: string;
    rating: number;
    price?: number;
    pros: string[];
    cons: string[];
    restaurantInfo?: {
      name: string;
      cuisineType?: string[];
      priceRange?: 'low' | 'medium' | 'high';
      contactInfo?: {
        phone?: string;
        website?: string;
      };
      openingHours?: string;
    };
  };
  caption?: string;
  location?: {
    name: string;
    address?: string;
  };
}

const CAPTION_LIMIT = 150;

const ReviewPost: React.FC<ReviewPostProps> = ({ reviewDetails, caption, location }) => {
  const [showFullContent, setShowFullContent] = useState(false);
  const [showRestaurantInfo, setShowRestaurantInfo] = useState(false);

  const renderRestaurantInfo = () => {
    if (!reviewDetails.restaurantInfo) return null;

    const { restaurantInfo } = reviewDetails;
    return (
      <View style={styles.restaurantContainer}>
        <View style={styles.restaurantHeader}>
          <Icon name="cutlery" size={16} color={colors.primary} />
          <Text style={styles.restaurantName}>{restaurantInfo.name}</Text>
          <TouchableOpacity onPress={() => setShowRestaurantInfo(!showRestaurantInfo)}>
            <Icon name={showRestaurantInfo ? "chevron-up" : "chevron-down"} size={14} color={colors.darkGray} />
          </TouchableOpacity>
        </View>

        {showRestaurantInfo && (
          <View style={styles.restaurantDetails}>
            {restaurantInfo.cuisineType && restaurantInfo.cuisineType.length > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Loại ẩm thực:</Text>
                <Text style={styles.infoValue}>{restaurantInfo.cuisineType.join(", ")}</Text>
              </View>
            )}

            {restaurantInfo.priceRange && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mức giá:</Text>
                <Text style={styles.infoValue}>
                  {restaurantInfo.priceRange === 'low' ? 'Rẻ' : 
                   restaurantInfo.priceRange === 'medium' ? 'Trung bình' : 'Cao'}
                </Text>
              </View>
            )}

            {restaurantInfo.openingHours && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Giờ mở cửa:</Text>
                <Text style={styles.infoValue}>{restaurantInfo.openingHours}</Text>
              </View>
            )}

            {restaurantInfo.contactInfo?.phone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Điện thoại:</Text>
                <Text style={styles.infoValue}>{restaurantInfo.contactInfo.phone}</Text>
              </View>
            )}

            {restaurantInfo.contactInfo?.website && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Website:</Text>
                <Text style={styles.infoValue}>{restaurantInfo.contactInfo.website}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderLocation = () => {
    if (!location) return null;
    
    return (
      <View style={styles.locationContainer}>
        <Icon name="map-marker" size={16} color={colors.primary} />
        <Text style={styles.locationText}>{location.name}</Text>
        {location.address && (
          <Text style={styles.addressText}>{location.address}</Text>
        )}
      </View>
    );
  };

  const renderRating = () => (
    <View style={styles.ratingContainer}>
      <View style={styles.ratingHeader}>
        <Text style={styles.dishName}>{reviewDetails.name}</Text>
        <View style={styles.ratingStars}>
          <Text style={styles.ratingText}>{reviewDetails.rating}</Text>
          <Icon name="star" size={18} color="#FFD700" />
        </View>
      </View>

      {reviewDetails.price && (
        <Text style={styles.price}>{reviewDetails.price.toLocaleString()}đ</Text>
      )}

      {reviewDetails.pros.length > 0 && (
        <View style={styles.prosContainer}>
          <Text style={styles.prosTitle}>Điểm tốt:</Text>
          {reviewDetails.pros.map((pro, index) => (
            <View key={`pro-${index}`} style={styles.proItem}>
              <Icon name="plus-circle" size={14} color={colors.primary} />
              <Text style={styles.proText}>{pro}</Text>
            </View>
          ))}
        </View>
      )}

      {reviewDetails.cons.length > 0 && (
        <View style={styles.consContainer}>
          <Text style={styles.consTitle}>Điểm chưa tốt:</Text>
          {reviewDetails.cons.map((con, index) => (
            <View key={`con-${index}`} style={styles.conItem}>
              <Icon name="minus-circle" size={14} color="#FF4C61" />
              <Text style={styles.conText}>{con}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {caption && <Text style={styles.caption}>{caption}</Text>}
      {renderRestaurantInfo()}
      {renderLocation()}
      {renderRating()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  caption: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 12,
  },
  restaurantContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  restaurantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  restaurantName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  restaurantDetails: {
    marginTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: 8,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: colors.darkGray,
    width: 100,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 15,
    color: colors.text,
    marginLeft: 8,
  },
  addressText: {
    fontSize: 14,
    color: colors.darkGray,
    marginLeft: 8,
  },
  ratingContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dishName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginRight: 4,
  },
  price: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
  prosContainer: {
    marginTop: 12,
  },
  prosTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  proItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  proText: {
    marginLeft: 8,
    fontSize: 15,
    color: colors.text,
  },
  consContainer: {
    marginTop: 12,
  },
  consTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  conItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  conText: {
    marginLeft: 8,
    fontSize: 15,
    color: colors.text,
  }
});

export default ReviewPost;

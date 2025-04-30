import React from 'react';
import { View, Text } from 'react-native';

interface ReviewPostProps {
  reviewDetails: {
    restaurantName: string;
    rating: number;
    content: string;
  };
}

const ReviewPost: React.FC<ReviewPostProps> = ({ reviewDetails }) => (
  <View style={{ marginHorizontal: 14, marginTop: 8, marginBottom: 4 }}>
    <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Nhà hàng: {reviewDetails.restaurantName}</Text>
    <Text>Đánh giá: {reviewDetails.rating} ⭐</Text>
    <Text>{reviewDetails.content}</Text>
  </View>
);

export default ReviewPost;

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface RecipePostProps {
  recipeDetails: {
    recipeName: string;
    ingredients: string[];
    instructions: string[];
  };
  caption?: string;
}

const CAPTION_LIMIT = 120;

const RecipePost: React.FC<RecipePostProps> = ({ recipeDetails, caption }) => {
  const [showFullCaption, setShowFullCaption] = useState(false);

  const renderCaption = () => {
    if (!caption) return null;
    if (caption.length <= CAPTION_LIMIT) {
      return <Text style={{ color: '#222', fontSize: 16, marginBottom: 4, fontWeight: '500' }}>{caption}</Text>;
    }
    return (
      <>
        <Text style={{ color: '#222', fontSize: 16, marginBottom: 4, fontWeight: '500' }}>
          {showFullCaption ? caption : caption.slice(0, CAPTION_LIMIT) + '...'}
        </Text>
        <TouchableOpacity onPress={() => setShowFullCaption(!showFullCaption)}>
          <Text style={{ color: '#FF4C61', marginLeft: 0, marginBottom: 4, fontWeight: 'bold' }}>
            {showFullCaption ? 'Thu gọn' : 'Xem thêm'}
          </Text>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <View style={{ marginHorizontal: 14, marginTop: 8, marginBottom: 4 }}>
      {renderCaption()}
      <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>Món ăn: {recipeDetails.recipeName}</Text>
      <Text style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 2 }}>Nguyên liệu:</Text>
      {Array.isArray(recipeDetails.ingredients) && recipeDetails.ingredients.length > 0 ? (
        recipeDetails.ingredients.map((item, idx) => (
          <Text key={idx} style={{ marginLeft: 10, fontSize: 15 }}>• {item}</Text>
        ))
      ) : (
        <Text style={{ marginLeft: 10, fontSize: 15 }}>Không có thông tin nguyên liệu.</Text>
      )}
      <Text style={{ fontWeight: 'bold', fontSize: 15, marginTop: 6, marginBottom: 2 }}>Các bước:</Text>
      {Array.isArray(recipeDetails.instructions) ? (
        recipeDetails.instructions.map((step, idx) => (
          <Text key={idx} style={{ marginLeft: 10, fontSize: 15 }}>{idx + 1}. {step}</Text>
        ))
      ) : (
        <Text style={{ marginLeft: 10, fontSize: 15 }}>{recipeDetails.instructions}</Text>
      )}
    </View>
  );
};

export default RecipePost;

import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../utils/colors';

interface RecipePostProps {
  recipeDetails: {
    recipeName: string;
    ingredients: string[];
    instructions: string[];
  };
  caption?: string;
}

const CAPTION_LIMIT = 150;

const RecipePost: React.FC<RecipePostProps> = ({ recipeDetails, caption }) => {
  const [showFullContent, setShowFullContent] = useState(false);

  const renderContent = () => {
    const mainContent = caption ? caption + '\n\n' : '';
    
    const ingredientsText = recipeDetails.ingredients.map(ing => `• ${ing}`).join('\n');
    const instructionsText = recipeDetails.instructions.map((inst, idx) => `${idx + 1}. ${inst}`).join('\n');
    
    const combined = mainContent + ingredientsText + '\n\n' + instructionsText;
    const shouldTruncate = combined.length > CAPTION_LIMIT;
    
    const displayedContent = shouldTruncate && !showFullContent
      ? combined.slice(0, CAPTION_LIMIT) + '...'
      : combined;

    return (
      <View>
        {caption && <Text style={styles.caption}>{caption}</Text>}
        
        <Text style={styles.sectionTitle}>📝 Nguyên liệu:</Text>
        <Text style={styles.content}>
          {recipeDetails.ingredients.map(ing => `• ${ing}`).join('\n')}
        </Text>
        
        <Text style={styles.sectionTitle}>🥘 Cách nấu:</Text>
        <Text style={styles.content}>
          {recipeDetails.instructions.map((inst, idx) => `${idx + 1}. ${inst}`).join('\n')}
        </Text>

        {shouldTruncate && (
          <TouchableOpacity 
            onPress={() => setShowFullContent(!showFullContent)}
            style={styles.readMoreButton}
          >
            <Text style={styles.readMoreText}>
              {showFullContent ? 'Thu gọn' : 'Xem thêm'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.recipeName}>🍳 {recipeDetails.recipeName}</Text>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  recipeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  caption: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  content: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  readMoreButton: {
    marginTop: 8,
    marginBottom: 4,
  },
  readMoreText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  }
});

export default RecipePost;

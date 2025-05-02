import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { colors } from '../../utils/colors';

import RecipePost from '../../components/user/RecipePost';

const mockCategories = [
  { id: '1', name: 'Món Việt', image: require('../../assets/images/mainiconapp.png') },
  { id: '2', name: 'Ăn vặt', image: require('../../assets/images/mainiconapp.png') },
  { id: '3', name: 'Đồ chay', image: require('../../assets/images/mainiconapp.png') },
  { id: '4', name: 'Món Âu', image: require('../../assets/images/mainiconapp.png') },
  { id: '5', name: 'Tráng miệng', image: require('../../assets/images/mainiconapp.png') },
];

const mockPosts = [
  {
    id: 'p1',
    recipeDetails: {
      recipeName: 'Bún bò Huế',
      ingredients: ['Bún', 'Thịt bò', 'Chả', 'Hành lá', 'Ớt'],
      instructions: ['Nấu nước dùng', 'Luộc bún', 'Thêm thịt và chả', 'Thưởng thức'],
    },
    caption: 'Bún bò Huế là món ăn đặc trưng của miền Trung, thơm ngon và đậm đà hương vị.'
  },
  {
    id: 'p2',
    recipeDetails: {
      recipeName: 'Gỏi cuốn',
      ingredients: ['Bánh tráng', 'Tôm', 'Thịt', 'Rau sống', 'Bún'],
      instructions: ['Chuẩn bị nguyên liệu', 'Cuốn gỏi', 'Pha nước chấm', 'Thưởng thức'],
    },
    caption: 'Gỏi cuốn thanh mát, dễ làm, thích hợp cho ngày hè.'
  },
];

export default function DiscoverScreen() {
  const renderCategory = ({ item }: any) => (
    <TouchableOpacity style={styles.categoryItem}>
      <Image source={item.image} style={styles.categoryImage} />
      <Text style={styles.categoryText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderPost = ({ item }: any) => (
    <View style={styles.postContainer}>
        <RecipePost recipeDetails={item.recipeDetails} caption={item.caption} />
      <View style={{ backgroundColor: '#fff', borderRadius: 10, elevation: 2 }}>
        <RecipePost recipeDetails={item.recipeDetails} caption={item.caption} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Khám phá</Text>
      <Text style={styles.sectionTitle}>Danh mục</Text>
      <FlatList
        data={mockCategories}
        renderItem={renderCategory}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 10 }}
      />
      <Text style={styles.sectionTitle}>Bài viết nổi bật</Text>
      <FlatList
        data={mockPosts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 24,
    paddingHorizontal: 10,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginVertical: 8,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    elevation: 2,
  },
  categoryImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  postContainer: {
    marginBottom: 18,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
});
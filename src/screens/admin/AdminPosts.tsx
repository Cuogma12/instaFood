import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

const PostType = {
  ALL: 'all',
  RECIPE: 'recipe',
  REVIEW: 'review',
  GENERAL: 'general',
};

const HomeScreen = () => {
  const [selectedType, setSelectedType] = useState(PostType.ALL);
  const [searchText, setSearchText] = useState('');

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <TextInput
        style={styles.searchInput}
        placeholder="Tìm kiếm..."
        value={searchText}
        onChangeText={setSearchText}
      />

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedType === PostType.ALL && styles.activeFilter,
            ]}
            onPress={() => setSelectedType(PostType.ALL)}
          >
            <Text
              style={[
                styles.filterText,
                selectedType === PostType.ALL && styles.activeFilterText,
              ]}
            >
              Tất cả
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedType === PostType.RECIPE && styles.activeFilter,
            ]}
            onPress={() => setSelectedType(PostType.RECIPE)}
          >
            <Text
              style={[
                styles.filterText,
                selectedType === PostType.RECIPE && styles.activeFilterText,
              ]}
            >
              Công thức
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedType === PostType.REVIEW && styles.activeFilter,
            ]}
            onPress={() => setSelectedType(PostType.REVIEW)}
          >
            <Text
              style={[
                styles.filterText,
                selectedType === PostType.REVIEW && styles.activeFilterText,
              ]}
            >
              Đánh giá
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedType === PostType.GENERAL && styles.activeFilter,
            ]}
            onPress={() => setSelectedType(PostType.GENERAL)}
          >
            <Text
              style={[
                styles.filterText,
                selectedType === PostType.GENERAL && styles.activeFilterText,
              ]}
            >
              Bài viết
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Posts sẽ được hiển thị dưới đây */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  filterContainer: {
    marginBottom: 10,
  },
  filterButton: {
    backgroundColor: '#f1f1f1',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  activeFilter: {
    backgroundColor: '#3498db',
  },
  filterText: {
    color: '#333',
    fontSize: 14,
  },
  activeFilterText: {
    color: '#fff',
  },
});

export default HomeScreen;

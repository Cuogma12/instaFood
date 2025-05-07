import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../../utils/colors';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export default function TagInput({
  tags,
  onTagsChange,
  placeholder = 'Add tag...',
  maxTags = 20,
}: TagInputProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleAddTag = () => {
    if (text.trim() !== '' && tags.length < maxTags) {
      // Remove # symbol if user typed it
      const tagText = text.trim().startsWith('#') ? text.trim().substring(1) : text.trim();
      
      // Check if tag already exists
      if (!tags.includes(tagText)) {
        onTagsChange([...tags, tagText]);
      }
      
      setText('');
    }
  };

  const handleRemoveTag = (index: number) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    onTagsChange(newTags);
  };

  const handleKeyPress = ({ nativeEvent }: { nativeEvent: { key: string } }) => {
    if (nativeEvent.key === ' ' || nativeEvent.key === 'Enter' || nativeEvent.key === ',') {
      handleAddTag();
      return;
    }
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={0.9}
      onPress={focusInput}
    >
      <View style={styles.tagsContainer}>
        {tags.map((tag, index) => (
          <View key={`${tag}-${index}`} style={styles.tag}>
            <Text style={styles.tagText}>#{tag}</Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveTag(index)}
            >
              <Icon name="times" size={12} color={colors.white || '#fff'} />
            </TouchableOpacity>
          </View>
        ))}
        
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={tags.length === 0 ? placeholder : ''}
            value={text}
            onChangeText={setText}
            onKeyPress={handleKeyPress}
            onSubmitEditing={handleAddTag}
            blurOnSubmit={false}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>
      
      {text.trim() !== '' && (
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={handleAddTag}
        >
          <Icon name="plus" size={16} color={colors.primary || '#2296F3'} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border || '#ddd',
    borderRadius: 8,
    padding: 8,
    minHeight: 50,
  },
  tagsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary || '#2296F3',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  tagText: {
    color: colors.white || '#fff',
    fontSize: 14,
    marginRight: 4,
  },
  removeButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    minWidth: 100,
    margin: 4,
  },
  input: {
    fontSize: 16,
    padding: 4,
  },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary || '#2296F3',
    marginLeft: 8,
  },
});
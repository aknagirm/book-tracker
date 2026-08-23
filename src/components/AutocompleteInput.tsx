import React, { useState, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';

interface Props {
  label: string;
  value: string;
  suggestions: string[];
  onChangeText: (value: string) => void;
}

export function AutocompleteInput({ label, value, suggestions, onChangeText }: Props) {
  const [focused, setFocused] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchValue = value.trim().toLowerCase();
  const matchingSuggestions = suggestions
    .filter((suggestion) => !searchValue || suggestion.toLowerCase().includes(searchValue))
    .slice(0, 6);

  const handleFocus = () => {
    if (blurTimeout.current) {
      clearTimeout(blurTimeout.current);
      blurTimeout.current = null;
    }
    setFocused(true);
  };

  const handleBlur = () => {
    // Delay blur to allow onPress to fire on suggestions
    blurTimeout.current = setTimeout(() => setFocused(false), 300);
  };

  const handleSelect = (suggestion: string) => {
    if (blurTimeout.current) {
      clearTimeout(blurTimeout.current);
      blurTimeout.current = null;
    }
    onChangeText(suggestion);
    setFocused(false);
  };

  return (
    <View style={styles.container}>
      <TextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        mode="outlined"
        style={styles.input}
      />
      {focused && matchingSuggestions.length > 0 && (
        <View style={styles.suggestions}>
          {matchingSuggestions.map((suggestion) => (
            <Pressable
              key={suggestion}
              onPress={() => handleSelect(suggestion)}
              style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}
            >
              <Text>{suggestion}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 2,
  },
  input: {
    marginBottom: 4,
    backgroundColor: 'white',
  },
  suggestions: {
    backgroundColor: 'white',
    borderColor: '#d0d0d0',
    borderRadius: 4,
    borderWidth: 1,
    elevation: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  suggestion: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  pressed: {
    backgroundColor: '#f0f0f0',
  },
});

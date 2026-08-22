import React, { useState } from 'react';
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
  const searchValue = value.trim().toLowerCase();
  const matchingSuggestions = suggestions
    .filter((suggestion) => !searchValue || suggestion.toLowerCase().includes(searchValue))
    .slice(0, 6);

  return (
    <View style={styles.container}>
      <TextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        mode="outlined"
        style={styles.input}
      />
      {focused && matchingSuggestions.length > 0 && (
        <View style={styles.suggestions}>
          {matchingSuggestions.map((suggestion) => (
            <Pressable
              key={suggestion}
              onPress={() => {
                onChangeText(suggestion);
                setFocused(false);
              }}
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

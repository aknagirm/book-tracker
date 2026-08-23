import React, { useState, useRef } from 'react';
import { TouchableOpacity, StyleSheet, View, Keyboard } from 'react-native';
import { Text, TextInput } from 'react-native-paper';

interface Props {
  label: string;
  value: string;
  suggestions: string[];
  onChangeText: (value: string) => void;
}

export function AutocompleteInput({ label, value, suggestions, onChangeText }: Props) {
  const [showDropdown, setShowDropdown] = useState(false);
  const justSelected = useRef(false);

  const searchValue = value.trim().toLowerCase();
  const matchingSuggestions = searchValue
    ? suggestions
        .filter((s) => s.toLowerCase().includes(searchValue) && s.toLowerCase() !== searchValue)
        .slice(0, 6)
    : [];

  const handleFocus = () => {
    if (!justSelected.current) {
      setShowDropdown(true);
    }
    justSelected.current = false;
  };

  const handleBlur = () => {
    // Don't close immediately — let TouchableOpacity handle selection first
    setTimeout(() => {
      if (!justSelected.current) {
        setShowDropdown(false);
      }
      justSelected.current = false;
    }, 400);
  };

  const handleSelect = (suggestion: string) => {
    justSelected.current = true;
    onChangeText(suggestion);
    setShowDropdown(false);
    Keyboard.dismiss();
  };

  const handleChangeText = (text: string) => {
    onChangeText(text);
    setShowDropdown(true);
  };

  return (
    <View style={styles.container}>
      <TextInput
        label={label}
        value={value}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        mode="outlined"
        style={styles.input}
      />
      {showDropdown && matchingSuggestions.length > 0 && (
        <View style={styles.suggestions}>
          {matchingSuggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion}
              onPress={() => handleSelect(suggestion)}
              activeOpacity={0.6}
              style={styles.suggestion}
            >
              <Text>{suggestion}</Text>
            </TouchableOpacity>
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
    position: 'relative',
    zIndex: 10,
  },
  suggestion: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
});

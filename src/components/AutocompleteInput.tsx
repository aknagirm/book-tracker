import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, View, Keyboard } from 'react-native';
import { Text, TextInput, Menu } from 'react-native-paper';

interface Props {
  label: string;
  value: string;
  suggestions: string[];
  onChangeText: (value: string) => void;
}

export function AutocompleteInput({ label, value, suggestions, onChangeText }: Props) {
  const [menuVisible, setMenuVisible] = useState(false);

  const searchValue = value.trim().toLowerCase();
  const matchingSuggestions = searchValue
    ? suggestions
        .filter((s) => s.toLowerCase().includes(searchValue) && s.toLowerCase() !== searchValue)
        .slice(0, 6)
    : [];

  const showMenu = matchingSuggestions.length > 0 && menuVisible;

  const handleSelect = (suggestion: string) => {
    onChangeText(suggestion);
    setMenuVisible(false);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <Menu
        visible={showMenu}
        onDismiss={() => setMenuVisible(false)}
        anchorPosition="bottom"
        anchor={
          <TextInput
            label={label}
            value={value}
            onChangeText={(text) => {
              onChangeText(text);
              setMenuVisible(true);
            }}
            onFocus={() => setMenuVisible(true)}
            mode="outlined"
            style={styles.input}
          />
        }
      >
        {matchingSuggestions.map((suggestion) => (
          <Menu.Item
            key={suggestion}
            onPress={() => handleSelect(suggestion)}
            title={suggestion}
          />
        ))}
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    zIndex: 2,
  },
  input: {
    backgroundColor: 'white',
  },
});

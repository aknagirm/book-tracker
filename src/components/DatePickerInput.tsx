import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput } from 'react-native-paper';

interface Props {
  label: string;
  value: string | null;
  onChange: (date: string | null) => void;
}

export function DatePickerInput({ label, value, onChange }: Props) {
  const [text, setText] = useState(value || '');

  // Sync internal text state when external value prop changes
  useEffect(() => {
    setText(value || '');
  }, [value]);

  const handleChange = (input: string) => {
    // Auto-format as YYYY-MM-DD
    let cleaned = input.replace(/[^0-9]/g, '');
    if (cleaned.length > 8) cleaned = cleaned.substring(0, 8);

    let formatted = '';
    if (cleaned.length > 4) {
      formatted = cleaned.substring(0, 4) + '-' + cleaned.substring(4);
      if (cleaned.length > 6) {
        formatted = formatted.substring(0, 7) + '-' + cleaned.substring(6);
      }
    } else {
      formatted = cleaned;
    }

    setText(formatted);

    // Only emit valid dates
    if (formatted.match(/^\d{4}-\d{2}-\d{2}$/)) {
      onChange(formatted);
    } else if (formatted === '') {
      onChange(null);
    }
  };

  const handleClear = () => {
    setText('');
    onChange(null);
  };

  return (
    <View style={styles.container}>
      <TextInput
        label={label}
        value={text}
        onChangeText={handleChange}
        placeholder="YYYY-MM-DD"
        keyboardType="number-pad"
        mode="outlined"
        style={styles.input}
        right={
          text ? (
            <TextInput.Icon icon="close" onPress={handleClear} />
          ) : (
            <TextInput.Icon icon="calendar" />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'white',
  },
});

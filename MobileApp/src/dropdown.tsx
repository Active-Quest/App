import React from 'react';
import { StyleSheet } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';

interface EventItem {
  label: string;
  value: string;
}

interface DropdownProps {
  events: EventItem[];
  selectedValue: string | null;
  setSelectedValue: (value: string) => void;
}

export default function CustomDropdown({ events, selectedValue, setSelectedValue }: DropdownProps) {
  return (
    <Dropdown
      style={styles.dropdown}
      placeholderStyle={styles.placeholderStyle}
      selectedTextStyle={styles.selectedTextStyle}
      data={events}
      labelField="label"
      valueField="value"
      placeholder="Select Event"
      value={selectedValue}
      onChange={item => {
        setSelectedValue(item.value);
      }}
    />
  );
}

const styles = StyleSheet.create({
  dropdown: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#999',
  },
  selectedTextStyle: {
    fontSize: 16,
    color: '#333',
  },
});
import React, { useState } from 'react';
import { View, Button, Text } from 'react-native';
import CalendarPicker from 'react-native-calendar-picker';

const TestScreen = () => {
  const [selectedDate, setSelectedDate] = useState('');

  const handleDateChange = (date: Date) => {
    setSelectedDate(date.toISOString());
  };

  return (
    <View>
      <CalendarPicker
        onDateChange={handleDateChange}
        textStyle={{ color: '#000000' }}
      />
      <Button
        onPress={() => {
          console.log('Selected Date:', selectedDate);
        }}
        title="Confirm Date"
      />
      <Text>Selected Date: {selectedDate}</Text>
    </View>
  );
};

export default TestScreen;

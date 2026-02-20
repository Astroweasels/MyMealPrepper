import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-body',
  imports: [CommonModule, FormsModule],
  templateUrl: './body.html',
  standalone: true,
  styleUrls: ['./body.scss'],  // corrected
})
export class Body {
  startFromToday = signal(false);
  weekDays = signal(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const);
  meals = ['Breakfast','Lunch','Dinner'];
  mealOptions = ['All', 'Breakfast','Lunch','Dinner'];
  weekRangeOptions = ['This week', '2 weeks', '3 weeks', 'Month'];
  selectedWeekRange = signal(this.weekRangeOptions[0] as string);
  selectedMealTypeOptions = signal(this.mealOptions[0] as string);

  weekCount = computed(() => {
    switch(this.selectedWeekRange()) {
      case 'This week': return 1;
      case '2 weeks': return 2;
      case '3 weeks': return 3;
      case 'Month': return 4;
      default: return 1;
    }
  });

    weekDaysWithDates = computed(() => {
      const today = new Date();
      const todayMonIndex = (today.getDay() + 6) % 7;
      const thisMonday = new Date(today);
      thisMonday.setDate(today.getDate() - todayMonIndex);
      
      const nextMonday = new Date(thisMonday);
      nextMonday.setDate(thisMonday.getDate() + 7);
      
      const allWeeks: { day: string; date: string }[][] = [];
      
      if (this.startFromToday()) {
        const remainder = this.weekDays()
          .map((dayName, index) => {
            const dateObj = new Date(thisMonday);
            dateObj.setDate(thisMonday.getDate() + index);
          
            return {
              day: dayName,
              date: `${dateObj.getMonth() + 1}/${dateObj.getDate()}`
            };
          })
          .slice(todayMonIndex);
        
        allWeeks.push(remainder);
      }
    
      for (let week = 0; week < this.weekCount(); week++) {
        const weekStart = new Date(nextMonday);
        weekStart.setDate(nextMonday.getDate() + week * 7);
      
        const weekDays = this.weekDays().map((dayName, index) => {
          const dateObj = new Date(weekStart);
          dateObj.setDate(weekStart.getDate() + index);
        
          return {
            day: dayName,
            date: `${dateObj.getMonth() + 1}/${dateObj.getDate()}`
          };
        });
      
        allWeeks.push(weekDays);
      }
    
      return allWeeks;
  });

  onFocus(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    if (input.value === 'Not selected') input.value = '';
  }
}
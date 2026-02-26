import { Component, computed, signal, ViewChildren, QueryList, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullMeal, MealService } from '../../services/meal';
import { MealModal } from '../meal-modal/meal-modal';
import { EditableMeal } from '../../models/editable-meal.model';

@Component({
  selector: 'app-body',
  imports: [CommonModule, FormsModule, MealModal],
  templateUrl: './body.html',
  standalone: true,
  styleUrls: ['./body.scss'],
})

export class Body {
  startFromToday = signal(false);
  weekDays = signal(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const);
  meals = ['Breakfast','Lunch','Dinner'];
  mealOptions = ['All', 'Breakfast','Lunch','Dinner'];
  weekRangeOptions = ['This week', '2 weeks', '3 weeks', 'Month'];
  selectedWeekRange = signal(this.weekRangeOptions[0] as string);
  selectedMealTypes = signal<string[]>([...this.meals]);
  generatedMeals = signal<Record<string, EditableMeal[]>>({});
  editingKey = signal<string | null>(null);
  groceryList = signal<string[]>([]);
  editingGroceries = signal(false);
  isMealModalOpen = false;
  selectedMeal: EditableMeal  | null = null;
  printMode = signal<'calendar' | 'recipes' | 'both'>('both');
  printScope = signal<'day' | 'week' | 'all'>('all');
  printTarget = signal<'calendar' | 'grocery' | 'meal' | null>(null);
  showPrintOptions = false;
  selectedMealForPrint = signal<EditableMeal | null>(null);

  @ViewChildren('editInput') editInputs!: QueryList<ElementRef<HTMLInputElement>>;

  constructor(private mealService: MealService) {
      effect(() => {
        const meals = this.generatedMeals();
        this.buildGroceryList();
      });
  }

async generateMeals() {
  const allMeals: FullMeal[] = await this.mealService.loadMeals();
  const days = this.weekDaysWithDates().flat();
  const mealsToUse = [...allMeals];

  const generated: Record<string, EditableMeal[]> = { ...this.generatedMeals() };

  days.forEach(dayObj => {
    const key = `${dayObj.day}-${dayObj.date}`;
    const existingMeals = generated[key] || [];
    const selectedTypes = this.selectedMealTypes();
    const count = selectedTypes.length;
    const shuffled = this.shuffle([...mealsToUse]);
    const pickedMeals: FullMeal[] = [];
    const usedTitles = new Set(existingMeals.map(m => m.title));

    let i = 0;
    while (pickedMeals.length < count && i < shuffled.length) {
      const candidate = shuffled[i];
      if (!usedTitles.has(candidate.strMeal)) {
        pickedMeals.push(candidate);
        usedTitles.add(candidate.strMeal);
      }
      i++;
    }

      const newDayMeals: EditableMeal[] = selectedTypes.map((mealType, index) => {
      const m = pickedMeals[index];
      const existing = existingMeals.find(em => em.mealType === mealType);
      if (existing && existing.title && existing.title !== 'Not selected') {
        return existing;
      }

      if (!m) {
        return {
          day: dayObj.day,
          date: dayObj.date,
          mealType,
          title: 'Not selected',
          instructions: '',
          ingredients: []
        };
      }

      const ingredients = [];
      for (let j = 1; j <= 20; j++) {
        const name = m[`strIngredient${j}`];
        const amount = m[`strMeasure${j}`];
        if (name && name.trim()) {
          ingredients.push({
            name: name.trim(),
            amount: amount?.trim() || ''
          });
        }
      }

      return {
        day: dayObj.day,
        date: dayObj.date,
        mealType,
        title: m.strMeal,
        instructions: m.strInstructions || '',
        ingredients
      };
    });

    const updatedMeals = [
      ...existingMeals.filter(m => !selectedTypes.includes(m.mealType)),
      ...newDayMeals
    ];

    generated[key] = updatedMeals;
  });

  this.generatedMeals.set(generated);
  this.buildGroceryList();
}

  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

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

  getKey(dayObj: any, meal: string) {
    return `${dayObj.day}-${dayObj.date}-${meal}`;
  }

  startEdit(dayObj: any, meal: string) {
    const key = this.getKey(dayObj, meal);
    this.editingKey.set(key);
    
    setTimeout(() => {
      const input = this.editInputs.last?.nativeElement;
      if (input) {
        input.focus();
        input.select();
      }
    });
  }

  saveEdit(event: Event, dayObj: any, mealType: string) {
    const input = event.target as HTMLInputElement;
    const newValue = input.value.trim();
    const key = `${dayObj.day}-${dayObj.date}`;
    const index = this.meals.indexOf(mealType);
    const current = { ...this.generatedMeals() };

    if (!current[key] || index === -1) return;

    const updatedDayMeals = [...current[key]];
    updatedDayMeals[index] = {
      ...updatedDayMeals[index],
      title: newValue || 'Not selected'
    };

    current[key] = updatedDayMeals;
    this.generatedMeals.set(current);
    this.editingKey.set(null);
  }

  buildGroceryList() {
    const ingredientMap = new Map<string, string>();

    Object.values(this.generatedMeals()).forEach(dayMeals => {
      dayMeals.forEach(meal => {
        meal.ingredients.forEach(i => {
          const key = i.name.toLowerCase();
          ingredientMap.set(key, `${i.amount ?? ''} ${i.name}`.trim());
        });
      });
    });

    this.groceryList.set(
      Array.from(ingredientMap.values()).sort()
    );
  }

  saveGroceries(event: FocusEvent) {
    const textarea = event.target as HTMLTextAreaElement;
    const updated = textarea.value
      .split('\n')
      .map(i => i.trim())
      .filter(i => i.length);

    this.groceryList.set(updated);
    this.editingGroceries.set(false);
  }

  // gramsToOunces(g: number): number {
  //   return +(g / 28.3495).toFixed(2);
  // }

  // gramsToImperial(g: number): string {
  //   const ounces = g / 28.3495;
  //   if (ounces >= 16) {
  //     const pounds = ounces / 16;
  //     return `${pounds.toFixed(2)} lb`;
  //   }
  //   return `${ounces.toFixed(2)} oz`;
  // }

  openMealModal(dayObj: any, mealType: string) {
    const existing = this.getMealFromDayAndType(dayObj, mealType);

    if (existing) {
      this.selectedMeal = { ...existing };
    } else {
      this.selectedMeal = {
        day: dayObj.day,
        date: dayObj.date,
        mealType,
        title: '',
        instructions: '',
        ingredients: []
      };
    }

    this.isMealModalOpen = true;
  }

  getMealFromDayAndType(dayObj: any, mealType: string): EditableMeal | null {
    const key = `${dayObj.day}-${dayObj.date}`;
    const index = this.meals.indexOf(mealType);
    return this.generatedMeals()[key]?.[index] || null;
  }

  closeMealModal() {
    this.isMealModalOpen = false;
    this.selectedMeal = null;
  }

  handleSave(meal: EditableMeal) {
    const key = `${meal.day}-${meal.date}`;
    const index = this.meals.indexOf(meal.mealType);
    const updated = { ...this.generatedMeals() };

    if (!updated[key]) {
      updated[key] = [];
    }

    updated[key][index] = meal;

    this.generatedMeals.set(updated);
    this.isMealModalOpen = false;
  }

print(options: {
  calendar?: boolean;
  grocery?: boolean;
  meal?: EditableMeal | null;
}) {

  if (options.meal) {
    this.printTarget.set('meal');
    this.selectedMealForPrint.set(options.meal);
  } 
  else if (options.calendar && options.grocery) {
    this.printTarget.set('calendar');
  } 
  else if (options.grocery) {
    this.printTarget.set('grocery');
  }

  document.body.classList.add('printing');

  const cleanup = () => {
    document.body.classList.remove('printing');
    document.body.removeAttribute('data-print');
    this.printTarget.set(null);
    this.selectedMealForPrint.set(null);
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup);
  document.body.setAttribute('data-print', this.printTarget() ?? '');
  setTimeout(() => window.print());
}

printMeal(dayObj: any, mealType: string) {
  const meal = this.getMealFromDayAndType(dayObj, mealType);
  if (!meal) return;

  const isMobile = window.matchMedia('(max-width: 600px)').matches;
  const popup = window.open('', '_blank', isMobile ? undefined : 'width=800,height=600');
  if (!popup) return;

  popup.document.title = meal.title;
  popup.document.body.innerHTML = '';

  const style = popup.document.createElement('style');
  style.textContent = `
    body { font-family: Arial; padding: 20px; }
    h1 { margin-bottom: 10px; }
    ul { margin-bottom: 20px; }
    button { margin-right: 10px; }
    .close-btn { display: block; margin: 30px auto 0 auto; padding: 10px 24px; font-size: 1.1rem; background: #eee; border: 1px solid #aaa; border-radius: 6px; cursor: pointer; }
  `;
  popup.document.head.appendChild(style);

  const h1 = popup.document.createElement('h1');
  h1.textContent = meal.title;
  popup.document.body.appendChild(h1);

  const h3Ingredients = popup.document.createElement('h3');
  h3Ingredients.textContent = 'Ingredients';
  popup.document.body.appendChild(h3Ingredients);

  const ul = popup.document.createElement('ul');
  meal.ingredients.forEach(i => {
    const li = popup.document.createElement('li');
    li.textContent = `${i.amount} ${i.name}`;
    ul.appendChild(li);
  });
  popup.document.body.appendChild(ul);

  const h3Instructions = popup.document.createElement('h3');
  h3Instructions.textContent = 'Instructions';
  popup.document.body.appendChild(h3Instructions);

  const p = popup.document.createElement('p');
  p.textContent = meal.instructions ?? '';
  popup.document.body.appendChild(p);

  if (isMobile) {
    // Add a close button for mobile
    const closeBtn = popup.document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.className = 'close-btn';
    closeBtn.onclick = () => popup.close();
    popup.document.body.appendChild(closeBtn);
    setTimeout(() => {
      popup.print();
    }, 300);
  } else {
    setTimeout(() => {
      popup.print();
      popup.close();
    }, 300);
  }
}

printFullPlan() {
  const isMobile = window.matchMedia('(max-width: 600px)').matches;
  const popup = window.open('', '_blank', isMobile ? undefined : 'width=1000,height=800');
  if (!popup) return;

  popup.document.title = 'Meal Plan';
  popup.document.body.innerHTML = '';

  const calendarSource = document.querySelector('.print-calendar');
  const grocerySource = document.querySelector('.print-grocery');

  const cleanCalendar = calendarSource?.cloneNode(true) as HTMLElement | null;
  const cleanGrocery = grocerySource?.cloneNode(true) as HTMLElement | null;

  cleanCalendar?.querySelectorAll('.print-icon').forEach(el => el.remove());
  cleanCalendar?.querySelectorAll('.re-roll-icon').forEach(el => el.remove());
  cleanGrocery?.querySelectorAll('.print-icon').forEach(el => el.remove());

  const style = popup.document.createElement('style');
  style.textContent = `
    body {
      font-family: Arial, sans-serif;
      padding: 30px;
    }

    h1 {
      margin-bottom: 30px;
    }

    h2 {
      margin-bottom: 20px;
    }

    .week-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 15px;
    }

    .card {
      border: 1px solid #ccc;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    ul {
      margin-bottom: 20px;
    }

    .card h3 {
      margin-top: 15px;
    }

    .card p {
      margin-top: 10px;
    }

    .card-body > div {
      margin-bottom: 15px;
    }

    .meal-card {
      margin-bottom: 20px;
    }

    .meal-type-label {
      font-weight: bold;
    }

    /* Page separation */
    .print-section {
      break-after: page;
      page-break-after: always;
    }

    .print-section:last-child {
      break-after: auto;
      page-break-after: auto;
    }
    .close-btn { display: block; margin: 30px auto 0 auto; padding: 10px 24px; font-size: 1.1rem; background: #eee; border: 1px solid #aaa; border-radius: 6px; cursor: pointer; }
  `;
  popup.document.head.appendChild(style);

  const h1 = popup.document.createElement('h1');
  h1.textContent = 'Meal Plan';
  popup.document.body.appendChild(h1);

  const calendarSection = popup.document.createElement('div');
  calendarSection.className = 'print-section';

  if (cleanCalendar) {
    calendarSection.appendChild(cleanCalendar);
  }

  popup.document.body.appendChild(calendarSection);

  if (cleanGrocery && cleanGrocery.textContent?.trim()) {
    const grocerySection = popup.document.createElement('div');
    grocerySection.className = 'print-section';

    const h2 = popup.document.createElement('h2');
    h2.textContent = 'Grocery List';
    grocerySection.appendChild(h2);

    grocerySection.appendChild(cleanGrocery);
    popup.document.body.appendChild(grocerySection);
  }

  if (isMobile) {
    // Add a close button for mobile
    const closeBtn = popup.document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.className = 'close-btn';
    closeBtn.onclick = () => popup.close();
    popup.document.body.appendChild(closeBtn);
    setTimeout(() => {
      popup.print();
    }, 300);
  } else {
    setTimeout(() => {
      popup.print();
      popup.close();
    }, 300);
  }
}

  togglePrintMenu(event: Event) {
    event.stopPropagation();
    this.showPrintOptions = !this.showPrintOptions;
  }

  ngOnInit() {
    document.addEventListener('click', this.closePrintMenu);
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.closePrintMenu);
  }

  closePrintMenu = () => {
    this.showPrintOptions = false;
  };

  toggleMealType(meal: string) {
    const current = this.selectedMealTypes();
    if (current.includes(meal)) {
      this.selectedMealTypes.set(current.filter(m => m !== meal));
    } else {
      this.selectedMealTypes.set([...current, meal]);
    }
  }

  rerollMeal(dayObj: any, mealType: string) {
  const key = `${dayObj.day}-${dayObj.date}`;
  const index = this.meals.indexOf(mealType);

  if (index === -1) return;

  const currentMeals = this.generatedMeals()[key] || [];
  const availableMeals = this.mealService.getRandomMeals(this.meals.length * 2); 
  if (!availableMeals.length) return;

  const usedTitles = new Set(currentMeals.map(m => m.title));

  let newMeal: FullMeal | null = null;
  for (const candidate of availableMeals) {
    if (!usedTitles.has(candidate.strMeal)) {
      newMeal = candidate;
      break;
    }
  }

  if (!newMeal) return;

  const ingredients = [];
  for (let j = 1; j <= 20; j++) {
    const name = newMeal[`strIngredient${j}`];
    const amount = newMeal[`strMeasure${j}`];
    if (name && name.trim()) {
      ingredients.push({ name: name.trim(), amount: amount?.trim() || '' });
    }
  }

  const updatedMeal: EditableMeal = {
    day: dayObj.day,
    date: dayObj.date,
    mealType,
    title: newMeal.strMeal,
    instructions: newMeal.strInstructions || '',
    ingredients
  };


  const updatedDayMeals = [...currentMeals];
  updatedDayMeals[index] = updatedMeal;
  const updatedGenerated = { ...this.generatedMeals() };
  updatedGenerated[key] = updatedDayMeals;
  this.generatedMeals.set(updatedGenerated);
  this.buildGroceryList();
}
}
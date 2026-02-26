  showIngredientAmounts = signal(true);
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
        // Returns true if any meal is selected for a given day
        isAnyMealSelectedForDay(dayObj: any): boolean {
          return this.meals.some((meal: string) => this.isMealSelected(dayObj, meal));
        }
    // Selection state for meal cards
    selectedMealsState = signal<{ day: string; date: string; mealType: string }[]>([]);
    // Check if meal is selected
    isMealSelected(dayObj: any, mealType: string): boolean {
      return this.selectedMealsState().some(sel => sel.day === dayObj.day && sel.date === dayObj.date && sel.mealType === mealType);
    }

    // Toggle meal selection
    toggleMealSelection(dayObj: any, mealType: string) {
      const sel = { day: dayObj.day, date: dayObj.date, mealType };
      const current = this.selectedMealsState();
      const exists = current.some(s => s.day === sel.day && s.date === sel.date && s.mealType === sel.mealType);
      if (exists) {
        this.selectedMealsState.set(current.filter(s => !(s.day === sel.day && s.date === sel.date && s.mealType === sel.mealType)));
      } else {
        this.selectedMealsState.set([...current, sel]);
      }
    }

    // Get selected meal objects
    selectedMealsData(): EditableMeal[] {
      return this.selectedMealsState().map(sel => {
        const key = `${sel.day}-${sel.date}`;
        const index = this.meals.indexOf(sel.mealType);
        return this.generatedMeals()[key]?.[index] || null;
      }).filter(m => m && m.title && m.title !== 'Not selected');
    }

    // Print all selected recipes
    printSelectedRecipes() {
      const meals = this.selectedMealsData();
      if (!meals.length) return;
      const isMobile = window.matchMedia('(max-width: 600px)').matches;
      const popup = window.open('', '_blank', isMobile ? undefined : 'width=900,height=800');
      if (!popup) return;

      popup.document.title = 'Selected Recipes';
      popup.document.body.innerHTML = '';

      const style = popup.document.createElement('style');
      style.textContent = `
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; padding: 0; margin: 0; color: #2a3a4a; }
        .print-wrapper { max-width: 900px; margin: 2rem auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); padding: 2.5rem 2rem; }
        h1 { font-size: 2.2rem; margin-bottom: 1.2rem; color: #2a3a4a; text-align: center; }
        .recipe-section { margin-bottom: 2.5rem; page-break-after: always; }
        .section-title { font-size: 1.2rem; font-weight: bold; margin-top: 1.5rem; margin-bottom: 0.7rem; color: #3a4a5a; }
        ul { margin-bottom: 1.2rem; padding-left: 1.2rem; }
        li { font-size: 1rem; margin-bottom: 0.4rem; }
        .instructions { font-size: 1rem; color: #3a4a5a; margin-top: 1rem; line-height: 1.6; }
        hr { margin: 1.2rem 0; border: none; border-top: 1px solid #e3e9f3; }
        @media (max-width: 600px) { .print-wrapper { max-width: 98vw; padding: 1rem 0.5rem; } h1 { font-size: 1.3rem; } .section-title { font-size: 1.05rem; } li, .instructions { font-size: 0.95rem; } }
        @media print and (orientation: landscape) { .print-wrapper { max-width: 1200px; padding: 2rem 3rem; } h1 { font-size: 2.4rem; } }
      `;
      popup.document.head.appendChild(style);

      const wrapper = popup.document.createElement('div');
      wrapper.className = 'print-wrapper';

      const h1 = popup.document.createElement('h1');
      h1.textContent = 'Selected Recipes';
      wrapper.appendChild(h1);

      meals.forEach((meal, idx) => {
        const section = popup.document.createElement('div');
        section.className = 'recipe-section';

        const title = popup.document.createElement('div');
        title.className = 'section-title';
        title.textContent = `${meal.title} (${meal.mealType}, ${meal.day} ${meal.date})`;
        section.appendChild(title);

        const hr = popup.document.createElement('hr');
        section.appendChild(hr);

        const ingredientsTitle = popup.document.createElement('div');
        ingredientsTitle.className = 'section-title';
        ingredientsTitle.textContent = 'Ingredients';
        section.appendChild(ingredientsTitle);

        const ul = popup.document.createElement('ul');
        meal.ingredients.forEach(i => {
          const li = popup.document.createElement('li');
          li.textContent = `${i.amount} ${i.name}`;
          ul.appendChild(li);
        });
        section.appendChild(ul);

        const instructionsTitle = popup.document.createElement('div');
        instructionsTitle.className = 'section-title';
        instructionsTitle.textContent = 'Instructions';
        section.appendChild(instructionsTitle);

        const instructions = popup.document.createElement('div');
        instructions.className = 'instructions';
        instructions.textContent = meal.instructions ?? '';
        section.appendChild(instructions);

        wrapper.appendChild(section);
      });

      popup.document.body.appendChild(wrapper);

      if (isMobile) {
        const closeBtn = popup.document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.className = 'close-btn';
        closeBtn.onclick = () => popup.close();
        // Add inline style to hide button during print
        closeBtn.style.setProperty('display', 'block');
        closeBtn.style.setProperty('@media print', 'display: none !important');
        popup.document.body.appendChild(closeBtn);
        // Also add a print-specific style tag
        const printHideStyle = popup.document.createElement('style');
        printHideStyle.textContent = '@media print { .close-btn { display: none !important; } }';
        popup.document.head.appendChild(printHideStyle);
        setTimeout(() => { popup.print(); }, 300);
      } else {
        setTimeout(() => { popup.print(); popup.close(); }, 300);
      }
    }
    // Expose selectedMeals() for template
    selectedMeals() {
      return this.selectedMealsState();
    }
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
    const waterRegex = /water|cold water|boiling water|ice water/i;

    Object.values(this.generatedMeals()).forEach(dayMeals => {
      dayMeals.forEach(meal => {
        meal.ingredients.forEach(i => {
          if (!i.name || waterRegex.test(i.name)) return;
          const key = i.name.toLowerCase();
          if (this.showIngredientAmounts()) {
            ingredientMap.set(key, `${i.amount ?? ''} ${i.name}`.trim());
          } else {
            ingredientMap.set(key, i.name.trim());
          }
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
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #f8fafc;
      padding: 0;
      margin: 0;
      color: #2a3a4a;
    }
    .print-wrapper {
      max-width: 600px;
      margin: 2rem auto;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      padding: 2rem 1.5rem;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
      color: #2a3a4a;
      text-align: center;
    }
    .subtitle {
      font-size: 1.1rem;
      color: #6c7a89;
      margin-bottom: 1.2rem;
      text-align: center;
    }
    hr {
      margin: 1.2rem 0;
      border: none;
      border-top: 1px solid #e3e9f3;
    }
    .section-title {
      font-size: 1.2rem;
      font-weight: bold;
      margin-top: 1.5rem;
      margin-bottom: 0.7rem;
      color: #3a4a5a;
    }
    ul {
      margin-bottom: 1.2rem;
      padding-left: 1.2rem;
    }
    li {
      font-size: 1rem;
      margin-bottom: 0.4rem;
    }
    .instructions {
      font-size: 1rem;
      color: #3a4a5a;
      margin-top: 1rem;
      line-height: 1.6;
    }
    .close-btn {
      display: block;
      margin: 30px auto 0 auto;
      padding: 10px 24px;
      font-size: 1.1rem;
      background: #eee;
      border: 1px solid #aaa;
      border-radius: 6px;
      cursor: pointer;
    }
    @media (max-width: 600px) {
      .print-wrapper {
        max-width: 98vw;
        padding: 1rem 0.5rem;
      }
      h1 {
        font-size: 1.3rem;
      }
      .section-title {
        font-size: 1.05rem;
      }
      li, .instructions {
        font-size: 0.95rem;
      }
    }
    @media print and (orientation: landscape) {
      .print-wrapper {
        max-width: 900px;
        padding: 2rem 3rem;
      }
      h1 {
        font-size: 2.2rem;
      }
    }
  `;
  popup.document.head.appendChild(style);

  const wrapper = popup.document.createElement('div');
  wrapper.className = 'print-wrapper';

  const h1 = popup.document.createElement('h1');
  h1.textContent = meal.title;
  wrapper.appendChild(h1);

  const subtitle = popup.document.createElement('div');
  subtitle.className = 'subtitle';
  subtitle.textContent = 'Meal Details';
  wrapper.appendChild(subtitle);

  const hr = popup.document.createElement('hr');
  wrapper.appendChild(hr);

  const sectionTitle1 = popup.document.createElement('div');
  sectionTitle1.className = 'section-title';
  sectionTitle1.textContent = 'Ingredients';
  wrapper.appendChild(sectionTitle1);

  const ul = popup.document.createElement('ul');
  meal.ingredients.forEach(i => {
    const li = popup.document.createElement('li');
    li.textContent = `${i.amount} ${i.name}`;
    ul.appendChild(li);
  });
  wrapper.appendChild(ul);

  const sectionTitle2 = popup.document.createElement('div');
  sectionTitle2.className = 'section-title';
  sectionTitle2.textContent = 'Instructions';
  wrapper.appendChild(sectionTitle2);

  const instructions = popup.document.createElement('div');
  instructions.className = 'instructions';
  instructions.textContent = meal.instructions ?? '';
  wrapper.appendChild(instructions);

  popup.document.body.appendChild(wrapper);

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

printFullPlan(includeGrocery: boolean = true) {
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
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #f8fafc;
      padding: 0;
      margin: 0;
      color: #2a3a4a;
    }
    .print-wrapper {
      max-width: 900px;
      margin: 2rem auto;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      padding: 2.5rem 2rem;
    }
    h1 {
      font-size: 2.2rem;
      margin-bottom: 1.2rem;
      color: #2a3a4a;
      text-align: center;
    }
    h2 {
      font-size: 1.3rem;
      color: #3a4a5a;
      margin-bottom: 1.2rem;
      text-align: left;
    }
    hr {
      margin: 1.2rem 0;
      border: none;
      border-top: 1px solid #e3e9f3;
    }
    .calendar-section {
      margin-bottom: 2rem;
    }
    .week-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1.2rem;
      margin-bottom: 2rem;
    }
    .meal-card {
      background: #f8fafc;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      padding: 1rem;
      margin-bottom: 1rem;
      min-width: 0;
    }
    .card-title {
      font-size: 1.1rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
      color: #2a3a4a;
    }
    .meal-type-label {
      font-size: 1rem;
      font-weight: bold;
      color: #3a4a5a;
      margin-bottom: 0.3rem;
    }
    .meal-display {
      font-size: 0.98rem;
      color: #3a4a5a;
      background: #fff;
      border-radius: 6px;
      padding: 0.5rem 0.7rem;
      margin-bottom: 0.4rem;
      box-shadow: 0 1px 4px rgba(0,0,0,0.03);
    }
    .grocery-section {
      margin-top: 2rem;
      background: #f8fafc;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      padding: 1.5rem 1rem;
    }
    .grocery-section h2 {
      margin-bottom: 1rem;
    }
    .grocery-section ul {
      margin-bottom: 0;
      padding-left: 1.2rem;
    }
    .grocery-section li {
      font-size: 1rem;
      margin-bottom: 0.3rem;
    }
    .close-btn {
      display: block;
      margin: 30px auto 0 auto;
      padding: 10px 24px;
      font-size: 1.1rem;
      background: #eee;
      border: 1px solid #aaa;
      border-radius: 6px;
      cursor: pointer;
    }
    @media (max-width: 900px) {
      .print-wrapper {
        max-width: 98vw;
        padding: 1rem 0.5rem;
      }
      h1 {
        font-size: 1.3rem;
      }
      h2 {
        font-size: 1.05rem;
      }
      .meal-card, .grocery-section {
        padding: 0.7rem 0.3rem;
      }
      .week-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.7rem;
      }
    }
    @media print and (orientation: landscape) {
      .print-wrapper {
        max-width: 1200px;
        padding: 2rem 3rem;
      }
      h1 {
        font-size: 2.4rem;
      }
      h2 {
        font-size: 1.5rem;
      }
    }
  `;
  popup.document.head.appendChild(style);

  const wrapper = popup.document.createElement('div');
  wrapper.className = 'print-wrapper';

  const h1 = popup.document.createElement('h1');
  h1.textContent = 'Meal Plan';
  wrapper.appendChild(h1);

  const hr = popup.document.createElement('hr');
  wrapper.appendChild(hr);

  const calendarSection = popup.document.createElement('div');
  calendarSection.className = 'calendar-section';
  if (cleanCalendar) calendarSection.appendChild(cleanCalendar);
  // Add page breaks after each week if possible
  if (calendarSection.querySelectorAll('.week-grid').length > 1) {
    const weekGrids = calendarSection.querySelectorAll('.week-grid');
    weekGrids.forEach((grid, idx) => {
      grid.classList.add('print-section');
    });
  }
  wrapper.appendChild(calendarSection);

  if (includeGrocery && cleanGrocery && cleanGrocery.textContent?.trim()) {
    const grocerySection = popup.document.createElement('div');
    grocerySection.className = 'grocery-section print-section'; // print-section for page break
    const h2 = popup.document.createElement('h2');
    h2.textContent = 'Grocery List';
    grocerySection.appendChild(h2);
    grocerySection.appendChild(cleanGrocery);
    wrapper.appendChild(grocerySection);
  }

  popup.document.body.appendChild(wrapper);

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
    // Remove from selection if rerolled
    this.selectedMealsState.set(this.selectedMealsState().filter(sel => !(sel.day === dayObj.day && sel.date === dayObj.date && sel.mealType === mealType)));
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
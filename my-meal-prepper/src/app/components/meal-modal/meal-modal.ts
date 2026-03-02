import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EditableMeal } from '../../models/editable-meal.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
type Ingredient = EditableMeal['ingredients'][number];

@Component({
  selector: 'app-meal-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './meal-modal.html',
  styleUrl: './meal-modal.scss',
  standalone: true,
})

export class MealModal {
  @Input() meal!: EditableMeal;
  @Output() saved = new EventEmitter<EditableMeal>();
  @Output() closed = new EventEmitter<void>();
  ingredientsText: string = '';

  onPasteIngredients(event: ClipboardEvent) {
    const text = event.clipboardData?.getData('text') || '';
    this.meal.ingredients = this.parseIngredientText(text);
  }

  ngOnChanges() {
    if (this.meal) {
      this.ingredientsText = this.ingredientsToText(this.meal.ingredients);
    }
  }

  saveMeal() {
    this.meal.ingredients = this.parseIngredientText(this.ingredientsText);
    this.meal.isManual = true;
    this.saved.emit(this.meal);
  }
  
  parseIngredientText(text: string): Ingredient[] {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const parts = line.split(' ');
        const amount = parts.shift() || '';
        const name = parts.join(' ');
        return { amount, name };
      });
  }

  ingredientsToText(ingredients: EditableMeal['ingredients']): string {
    return ingredients.map(i => `${i.amount ?? ''} ${i.name}`.trim()).join('\n');
  }
}

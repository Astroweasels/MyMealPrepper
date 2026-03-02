export interface EditableMeal {
  day: string;
  date: string;
  mealType: string;

  title: string;
  instructions?: string;

  ingredients: {
    name: string;
    amount?: string;
  }[];
  isManual?: boolean;
}
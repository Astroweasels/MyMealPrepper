import { inject, Injectable } from '@angular/core';
import { MealResponse } from '../models/meal.model';
import { Observable } from 'rxjs/internal/Observable';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Meal {
  http = inject(HttpClient);
  private apiUrl = 'https://www.themealdb.com/api/json/v1/1/search.php?s=';
  searchMeals(query: string): Observable<MealResponse> {
  return this.http.get<MealResponse>(`${this.apiUrl}${query}`);
}
}

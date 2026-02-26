import { inject, Injectable } from '@angular/core';
import { MealResponse } from '../models/meal.model';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, map, tap, firstValueFrom } from 'rxjs';

export interface FullMeal {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
  strInstructions: string;

  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class MealService {
  private http = inject(HttpClient);
  private apiUrl = 'https://www.themealdb.com/api/json/v1/1/search.php?s=';
  private allMeals: FullMeal[] = [];
  private loaded = false;
  private strongLetters = ['a','b','c','f','m','p','s','t'];
  private queryCache: Record<string, MealResponse> = {};
  
  searchMeals(query: string): Observable<MealResponse> {
    if (this.queryCache[query]) {
      return of(this.queryCache[query]);
    }
    return this.http.get<MealResponse>(`${this.apiUrl}${query}`).pipe(
      tap(data => this.queryCache[query] = data)
    );
  }

  loadMeals(): Promise<FullMeal[]> {
    if (this.loaded) {
      return Promise.resolve(this.allMeals);
    }

    const selectedLetters = this.shuffle([...this.strongLetters]).slice(0, 6);

    const requests = selectedLetters.map(letter =>
      this.http.get<any>(`https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`)
    );

    return firstValueFrom(
      forkJoin(requests).pipe(
        map(results => {
          const meals: FullMeal[] = results
            .flatMap(r => r?.meals ?? [])
            .filter(m =>
              m.strCategory !== 'Side' &&
              m.strCategory !== 'Dessert' &&
              m.strCategory !== 'Starter'
            )

          this.allMeals = meals;
          this.loaded = true;

          return meals;
        })
      )
    );
  }

  getRandomMeals(count: number): FullMeal[] {
    return this.shuffle(
      [...this.allMeals].filter(m =>
        m['strCategory'] !== 'Side' &&
        m['strCategory'] !== 'Dessert' &&
        m['strCategory'] !== 'Starter'
      )
    ).slice(0, count);
  }

  private shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
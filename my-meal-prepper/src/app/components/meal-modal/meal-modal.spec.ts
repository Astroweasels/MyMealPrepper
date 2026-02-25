import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MealModal } from './meal-modal';

describe('MealModal', () => {
  let component: MealModal;
  let fixture: ComponentFixture<MealModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MealModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MealModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

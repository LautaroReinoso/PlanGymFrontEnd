import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddExercisesModalComponent } from './add-exercises-modal.component';

describe('AddExercisesModalComponent', () => {
  let component: AddExercisesModalComponent;
  let fixture: ComponentFixture<AddExercisesModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddExercisesModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddExercisesModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

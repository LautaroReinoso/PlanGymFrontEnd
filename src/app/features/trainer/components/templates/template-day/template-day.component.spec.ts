import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplateDayComponent } from './template-day.component';

describe('TemplateDayComponent', () => {
  let component: TemplateDayComponent;
  let fixture: ComponentFixture<TemplateDayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateDayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TemplateDayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

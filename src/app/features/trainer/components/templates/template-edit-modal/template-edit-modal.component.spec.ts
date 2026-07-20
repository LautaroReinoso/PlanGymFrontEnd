import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplateEditModalComponent } from './template-edit-modal.component';

describe('TemplateEditModalComponent', () => {
  let component: TemplateEditModalComponent;
  let fixture: ComponentFixture<TemplateEditModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateEditModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TemplateEditModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

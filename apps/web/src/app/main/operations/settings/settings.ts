import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, effect, inject } from '@angular/core'; // Importar ChangeDetectorRef
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { GroupsService } from '../../../services/group.service';
import { SubmissionsService } from '../../../services/submission.service';
import { BasicCard } from '../../../shared-components/basic-card/basic-card';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, BasicCard, DatePipe, ReactiveFormsModule],
  templateUrl: './settings.html',
})
export class Settings {
  private submissionsService = inject(SubmissionsService);
  private groupsService = inject(GroupsService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef); // Inyectar CDR

  currentGroup = this.groupsService.currentGroup$;
  isLoadingGroup = this.groupsService.isLoading$;
  
  public submissions$ = this.submissionsService.mySubmissions$;
  public isLoadingSubmissions$ = this.submissionsService.isLoading$;

  settingsForm!: FormGroup;
  isSubmitting = false;
  showSuccessMessage = false;

  constructor() {
    this.initForm();
    effect(() => {
      const group = this.currentGroup();
      if (group) this.loadGroupData(group);
    });
  }

  ngOnInit() {
    this.submissionsService.loadMySubmissions();
  }

  private initForm() {
    this.settingsForm = this.fb.group({
      groupName: ['', [Validators.required, Validators.minLength(3)]],
      weeklyLeetcodes: [1, [Validators.required, Validators.min(1)]],
    });
  }

  private loadGroupData(group: any) {
    this.settingsForm.patchValue({
      groupName: group.name || '',
      weeklyLeetcodes: group.weeklyLeetcodes || 1,
    });
  }

  async onSubmit() {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      return;
    }

    const group = this.currentGroup();
    if (!group) return;

    this.isSubmitting = true;
    this.showSuccessMessage = false;

    try {
      const formValue = this.settingsForm.value;
      const updatedGroupData = {
        name: formValue.groupName,
        weeklyLeetcodes: Number(formValue.weeklyLeetcodes)
      };

      // Esperamos la respuesta
      await firstValueFrom(this.groupsService.updateGroup(group.id, updatedGroupData));

      // Éxito
      this.showSuccessMessage = true;
      setTimeout(() => {
        this.showSuccessMessage = false;
        this.cdr.markForCheck(); // Actualizar vista al ocultar mensaje
      }, 3000);

    } catch (error) {
      console.error('Error updating group:', error);
    } finally {
      // Forzamos el desbloqueo del botón
      this.isSubmitting = false;
      this.cdr.detectChanges(); // <--- ESTO ES CLAVE para que el botón reaccione
    }
  }

  onCancel() {
    this.navigateTo();
  }

  navigateTo(): void {
    this.router.navigate([`/main/group-content`]);
  }
}
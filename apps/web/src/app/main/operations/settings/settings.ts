import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { GroupsService } from '@web/src/app/services/group.service';
import { IconService } from '@web/src/app/services/icon.service';
import { SubmissionsService } from '@web/src/app/services/submission.service';
import { BasicCard } from '@web/src/app/shared-components/basic-card/basic-card';
import { LucideAngularModule } from "lucide-angular";

@Component({
  selector: 'app-settings',
  imports: [CommonModule, BasicCard, DatePipe, LucideAngularModule, ReactiveFormsModule],
  templateUrl: './settings.html',
})
export class Settings {
  private submissionsService = inject(SubmissionsService);
  private groupsService = inject(GroupsService);
  private iconService = inject(IconService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  currentGroup = this.groupsService.currentGroup$;
  isLoadingGroup = this.groupsService.isLoading$;
  public submissions$ = this.submissionsService.mySubmissions$;
  public isLoadingSubmissions$ = this.submissionsService.isLoading$;

  settingsForm!: FormGroup;
  isSubmitting = false;

  ngOnInit() {
    this.submissionsService.loadMySubmissions();

    // Inicializar el formulario
    this.initForm();

    // Cargar datos del grupo actual cuando estén disponibles
    const group = this.currentGroup();
    if (group) {
      this.loadGroupData(group);
    }
  }

  private initForm() {
    this.settingsForm = this.fb.group({
      groupName: ['', [Validators.required, Validators.minLength(3)]],
      inviteCode: ['', [Validators.required, Validators.minLength(6)]],
      weeklyLeetcodes: ['', [Validators.required, Validators.min(1)]],
      finalDeadline: ['', Validators.required]
    });
  }

  private loadGroupData(group: any) {
    this.settingsForm.patchValue({
      groupName: group.name || '',
      inviteCode: group.inviteCode || '',
      weeklyLeetcodes: group.weeklyLeetcodes || '',
      finalDeadline: group.finalDeadline ? this.formatDate(group.finalDeadline) : ''
    });
  }

  private formatDate(date: string | Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  generateInviteCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    this.settingsForm.patchValue({ inviteCode: code });
  }

  copyInviteCode() {
    const inviteCode = this.settingsForm.get('inviteCode')?.value;
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      console.log('Invite code copied!');
      // Aquí podrías mostrar un toast/alerta
    }
  }

  async onSubmit() {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      return;
    }

    const group = this.currentGroup();
    if (!group) return;

    this.isSubmitting = true;

    try {
      const formValue = this.settingsForm.value;
      const updatedGroup = {
        ...group,
        name: formValue.groupName,
        inviteCode: formValue.inviteCode,
        weeklyLeetcodes: Number(formValue.weeklyLeetcodes),
        finalDeadline: formValue.finalDeadline
      };

      // Aquí llamarías al servicio para actualizar el grupo
      // await this.groupsService.updateGroup(group.id, updatedGroup);

      console.log('Group updated:', updatedGroup);

      // Navegar de vuelta
      this.navigateTo();
    } catch (error) {
      console.error('Error updating group:', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  onCancel() {
    // Recargar los datos originales
    const group = this.currentGroup();
    if (group) {
      this.loadGroupData(group);
    }
    this.navigateTo();
  }

  getIcon(iconName: string) {
    return this.iconService.iconsMap[iconName];
  }

  navigateTo(): void {
    this.router.navigate([`/main/group-content`]);
  }
}
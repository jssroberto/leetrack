import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// --- Interfaces para el modelo de datos ---
export interface GroupMember {
  userId: string;
  name: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: Date;
}

export interface GroupData {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: Date;
  members: GroupMember[];
}

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [CommonModule, FormsModule], // Importante para ngModel y @if
  templateUrl: './group.html',
  styleUrl: './group.css'
})
export class Group implements OnInit {
  
  // --- ESTADO GLOBAL ---
  public isLoading = false;
  // Cambia esto a un objeto real para ver la vista de Grupo, o null para ver la de "Sin Grupo"
  public currentGroup: GroupData | null = null; 
  public currentUserId = 'user-1'; // ID simulado del usuario actual

  // --- ESTADO "SIN GRUPO" ---
  public noGroupMode: 'MENU' | 'CREATE' | 'JOIN' = 'MENU';
  public newGroupNameInput = '';
  public joinCodeInput = '';

  // --- ESTADO "CON GRUPO" ---
  public isEditingName = false;
  public editedName = '';

  ngOnInit() {
    // SIMULACIÓN: Descomenta las siguientes líneas para ver cómo se ve CUANDO TIENES GRUPO
    /*
    this.currentGroup = {
      id: 'g-1',
      name: 'Algorithm Masters',
      inviteCode: 'A8F-9K2',
      createdAt: new Date(),
      members: [
        { userId: 'user-1', name: 'Tú (Usuario)', role: 'ADMIN', joinedAt: new Date() },
        { userId: 'user-2', name: 'John Doe', role: 'MEMBER', joinedAt: new Date() },
        { userId: 'user-3', name: 'Sarah Smith', role: 'MEMBER', joinedAt: new Date() }
      ]
    };
    */
  }

  // --- GETTERS ---
  get isAdmin(): boolean {
    return this.currentGroup?.members.find(m => m.userId === this.currentUserId)?.role === 'ADMIN' || false;
  }

  // --- MÉTODOS "SIN GRUPO" ---
  setMode(mode: 'MENU' | 'CREATE' | 'JOIN') {
    this.noGroupMode = mode;
    this.newGroupNameInput = '';
    this.joinCodeInput = '';
  }

  handleCreate() {
    if (!this.newGroupNameInput.trim()) return;
    
    // Aquí llamarías a tu servicio API
    console.log('Creando grupo:', this.newGroupNameInput);
    
    // Simulamos éxito
    this.isLoading = true;
    setTimeout(() => {
      this.currentGroup = {
        id: 'new-g',
        name: this.newGroupNameInput,
        inviteCode: 'N3W-COD',
        createdAt: new Date(),
        members: [{ userId: this.currentUserId, name: 'Tú', role: 'ADMIN', joinedAt: new Date() }]
      };
      this.isLoading = false;
      this.setMode('MENU');
    }, 1000);
  }

  handleJoin() {
    if (!this.joinCodeInput.trim()) return;
    console.log('Uniéndose con código:', this.joinCodeInput);
    // Aquí lógica de API
  }

  // --- MÉTODOS "CON GRUPO" ---
  copyCode() {
    if (this.currentGroup?.inviteCode) {
      navigator.clipboard.writeText(this.currentGroup.inviteCode);
      // Aquí podrías mostrar un toast/notificación
      alert('Código copiado: ' + this.currentGroup.inviteCode);
    }
  }

  startEditing() {
    if (this.currentGroup) {
      this.editedName = this.currentGroup.name;
      this.isEditingName = true;
    }
  }

  saveGroupName() {
    if (this.currentGroup && this.editedName.trim()) {
      this.currentGroup.name = this.editedName;
      this.isEditingName = false;
      // Llamada API updateName...
    }
  }

  cancelEditing() {
    this.isEditingName = false;
  }

  removeMember(memberId: string) {
    if (confirm('¿Estás seguro de eliminar a este miembro?')) {
      if (this.currentGroup) {
        this.currentGroup.members = this.currentGroup.members.filter(m => m.userId !== memberId);
      }
    }
  }
}
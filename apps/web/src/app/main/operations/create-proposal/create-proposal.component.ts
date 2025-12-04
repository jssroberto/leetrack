import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SubTitle } from '@web/src/app/shared-components/sub-title/sub-title';
import { Category, ProposalService } from '../../../services/proposal.service';

@Component({
  selector: 'app-create-proposal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, SubTitle],
  templateUrl: './create-proposal.html',
})
export class CreateProposalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private proposalService = inject(ProposalService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  groupId: string | null = null;
  categories: Category[] = [];
  isLoading = false;
  error: string | null = null;

  form = this.fb.group({
    categoryId: ['', Validators.required],
    title: [''],
    description: [''],
    targetDate: ['', Validators.required],
  });

  ngOnInit() {
    this.groupId = this.route.snapshot.paramMap.get('groupId');
    if (!this.groupId) {
      this.error = 'Group ID is missing';
      return;
    }

    this.loadCategories();
  }

  loadCategories() {
    this.proposalService.getCategories().subscribe({
      next: (categories) => (this.categories = categories),
      error: (err) => {
        console.error('Failed to load categories', err);
        this.error = 'Failed to load categories';
      },
    });
  }

  onSubmit() {
    if (this.form.invalid || !this.groupId) return;

    this.isLoading = true;
    this.error = null;

    const { categoryId, title, description, targetDate } = this.form.value;

    this.proposalService
      .createProposal(this.groupId, {
        categoryId: categoryId!,
        title: title || undefined,
        description: description || undefined,
        targetDate: targetDate!,
      })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/main/group-content']);
        },
        error: (err) => {
          console.error('Failed to create proposal', err);
          this.error = 'Failed to create proposal';
          this.isLoading = false;
        },
      });
  }
}

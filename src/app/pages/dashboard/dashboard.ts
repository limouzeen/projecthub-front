// src/app/pages/dashboard/dashboard.ts
import { Component, effect, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common'; // ใช้ pipe date ใน template
import { ProjectsService, Project } from '../../core/projects.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe], 
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  // ไม่อ้าง svc ที่นี่
  keyword = signal('');
  selected = signal<Set<string>>(new Set());
  asideOpen = signal(false);

  // แหล่งข้อมูล
  projects = signal<Project[]>([]);

  // มุมมองที่กรองแล้ว
  filtered = computed(() => {
    const q = this.keyword().trim().toLowerCase();
    const list = this.projects();
    return q ? list.filter(p => p.name.toLowerCase().includes(q)) : list;
  });

  constructor(private svc: ProjectsService) {
    // sync projects จาก service → signal ภายใน component
    effect(() => this.projects.set(this.svc.list()));
  }

  toggleAside() { this.asideOpen.set(!this.asideOpen()); }

  addQuick(name: string) {
    if (!name.trim()) return;
    this.svc.add(name.trim());
    this.keyword.set('');
  }

  isChecked(id: string) { return this.selected().has(id); }
  toggleCheck(id: string, checked: boolean) {
    this.selected.update(s => {
      const next = new Set(s);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  removeOne(id: string) { this.svc.remove(id); }
  removeManySelected() {
    const ids = Array.from(this.selected());
    if (ids.length) this.svc.removeMany(ids);
    this.selected.set(new Set());
  }
  toggleFavorite(id: string) { this.svc.toggleFavorite(id); }

  exportCSV() { this.svc.downloadCSV(this.filtered()); }

  toLocal(iso: string) { return new Date(iso).toLocaleDateString(); }
}

// src/app/pages/dashboard/dashboard.ts
import { Component, effect, signal, computed, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ProjectsService, Project } from '../../core/projects.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  // ====== state หลัก ======
  keyword    = signal('');
  selected   = signal<Set<string>>(new Set());
  asideOpen  = signal(false);

  // เมนู 3 จุด (จำว่าเมนูของโปรเจกต์ไหนเปิดอยู่)
  menuOpenId = signal<string | null>(null);

  // เมนูโปรไฟล์ (มุมขวาบน)
  profileOpen = signal(false);

  // ข้อมูลโปรเจกต์
  projects = signal<Project[]>([]);
  filtered = computed(() => {
    const q = this.keyword().trim().toLowerCase();
    const list = this.projects();
    return q ? list.filter(p => p.name.toLowerCase().includes(q)) : list;
  });

  constructor(private svc: ProjectsService) {
    effect(() => this.projects.set(this.svc.list()));
  }

  // ====== Aside (แฮมเบอร์เกอร์) ======
  toggleAside() {
    const next = !this.asideOpen();
    this.asideOpen.set(next);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = next ? 'hidden' : '';
    }
  }

  // ====== จัดการคลิกนอก/กด ESC (รวมศูนย์) ======

  /** คลิกที่เอกสาร: ปิดทุกเมนูที่เปิดอยู่ */
  @HostListener('document:click')
  onDocClick() {
    if (this.menuOpenId() !== null) this.menuOpenId.set(null);
    if (this.profileOpen())       this.profileOpen.set(false);
  }

  /** กด ESC: ปิดโปรไฟล์ก่อน > เมนู 3 จุด > aside */
  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.profileOpen())        { this.profileOpen.set(false); return; }
    if (this.menuOpenId() !== null){ this.menuOpenId.set(null);   return; }
    if (this.asideOpen()) {
      this.asideOpen.set(false);
      if (typeof document !== 'undefined') document.body.style.overflow = '';
    }
  }

  // ====== เมนู 3 จุด (ต่อท้ายการ์ดโปรเจกต์) ======
  toggleMenu(id: string) {
    this.menuOpenId.update(cur => (cur === id ? null : id));
  }
  closeMenu() { this.menuOpenId.set(null); }

  openProject(id: string) {
    console.log('open project', id);
    this.closeMenu();
  }

  renameProject(id: string, currentName: string) {
    const next = window.prompt('Rename project:', currentName?.trim() ?? '');
    if (next != null) {
      const name = next.trim();
      if (name && name !== currentName) this.svc.rename(id, name);
    }
    this.closeMenu();
  }

  // ====== เมนูโปรไฟล์ (มุมขวาบน navbar) ======
  toggleProfileMenu() {
    // ถ้าเมนู 3 จุดเปิดอยู่ ให้ปิดก่อน
    if (this.menuOpenId() !== null) this.menuOpenId.set(null);
    // toggle โปรไฟล์
    this.profileOpen.update(v => !v);
  }

  onEditProfile() {
    this.profileOpen.set(false);
    // this.router.navigateByUrl('/profile/edit');
  }

  onLogout() {
    this.profileOpen.set(false);
    // this.auth.logout();
  }

  // ====== อื่น ๆ คงเดิม ======
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
  exportCSV()               { this.svc.downloadCSV(this.filtered()); }
  toLocal(iso: string)      { return new Date(iso).toLocaleDateString(); }
}

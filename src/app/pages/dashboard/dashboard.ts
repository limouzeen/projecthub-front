// src/app/pages/dashboard/dashboard.ts
import { Component, effect, signal, computed, HostListener } from '@angular/core'; // ← มี HostListener แล้ว
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
  keyword = signal('');
  selected = signal<Set<string>>(new Set());
  asideOpen = signal(false);

  // ✅ เมนู 3 จุด: เก็บว่าเมนูของโปรเจกต์ไหนกำลังเปิด
  menuOpenId = signal<string | null>(null);

  projects = signal<Project[]>([]);

  filtered = computed(() => {
    const q = this.keyword().trim().toLowerCase();
    const list = this.projects();
    return q ? list.filter(p => p.name.toLowerCase().includes(q)) : list;
  });

  constructor(private svc: ProjectsService) {
    effect(() => this.projects.set(this.svc.list()));
  }

  /** แฮมเบอร์เกอร์: เปิด/ปิด aside + ล็อกสกอร์ล */
  toggleAside() {
    const next = !this.asideOpen();
    this.asideOpen.set(next);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = next ? 'hidden' : '';
    }
  }

  /** กด ESC: ปิดเมนู 3 จุดก่อน ถ้ายังมีให้ปิด aside ต่อ */
  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.menuOpenId()) {
      this.menuOpenId.set(null);
      return;
    }
    if (this.asideOpen()) {
      this.asideOpen.set(false);
      if (typeof document !== 'undefined') document.body.style.overflow = '';
    }
  }

  /** คลิกที่ใด ๆ บนเอกสาร: ปิดเมนู 3 จุดถ้าเปิดอยู่ */
  @HostListener('document:click')
  onDocClick() {
    if (this.menuOpenId()) this.menuOpenId.set(null);
  }

  /** ===== เมนู 3 จุด: เมธอดที่ใช้ใน template ===== */
  toggleMenu(id: string) {
    this.menuOpenId.update(cur => (cur === id ? null : id));
  }
  closeMenu() {
    this.menuOpenId.set(null);
  }
  openProject(id: string) {
    // ถ้ามี Router แล้วค่อย navigate: this.router.navigate(['/projects', id]);
    console.log('open project', id);
    this.closeMenu();
  }
  renameProject(id: string, currentName: string) {
    const next = window.prompt('Rename project:', currentName?.trim() ?? '');
    if (next != null) {
      const name = next.trim();
      if (name && name !== currentName) {
        this.svc.rename(id, name); // ⚠️ ต้องมีเมธอด rename ใน ProjectsService (ดูหมายเหตุ)
      }
    }
    this.closeMenu();
  }
  /** =========================================== */

  // ==== ด้านล่างคงเดิมทั้งหมด ====
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

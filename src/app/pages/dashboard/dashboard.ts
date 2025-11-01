import {
  Component, effect, signal, computed, HostListener, ViewChild,
  ElementRef, AfterViewInit, OnDestroy
} from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { ProjectsService, Project } from '../../core/projects.service';
import { FooterStateService } from '../../core/footer-state.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, NgClass],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements AfterViewInit, OnDestroy {
  /* ===== Footer overlap handling ===== */
  @ViewChild('pagerZone', { static: false }) pagerZone?: ElementRef<HTMLElement>;

  private updateFooterAvoidOverlap() {
    const pager = this.pagerZone?.nativeElement;
    const pill = document.querySelector<HTMLElement>('.footer-pill');
    if (!pager || !pill) return;

    const vpH = window.innerHeight;
    const pr = pager.getBoundingClientRect();
    const pillH = pill.offsetHeight || 48;
    const bottomGap = 16;                  // = bottom-4
    const pillTop = vpH - bottomGap - pillH;
    const pillBottom = pillTop + pillH;

    const pagerInViewport = pr.bottom > 0 && pr.top < vpH;
    const overlap = pagerInViewport ? (pillTop < pr.bottom) && (pillBottom > pr.top) : false;

    this.footer.setForceCompact(overlap ? true : null);
  }

  private onScroll = () => this.updateFooterAvoidOverlap();
  private onResize = () => {
    this.updateFooterAvoidOverlap();
    this.pageSize.set(this.calcPageSize(window.innerHeight));
  };

  // ปรับ footer ด้านล่าง
  ngAfterViewInit() {
    this.footer.setThreshold(720);
    setTimeout(() => {
      this.updateFooterAvoidOverlap();
      this.pageSize.set(this.calcPageSize(window.innerHeight)); // เช็กครั้งแรก
    }, 0);

    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onResize, { passive: true });
  }

  ngOnDestroy() {
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);
    this.footer.resetAll();
  }

  /* ===== Core state ===== */
  readonly Math = Math;
  keyword = signal('');
  selected = signal<Set<string>>(new Set());
  asideOpen = signal(false);
  menuOpenId = signal<string | null>(null);
  profileOpen = signal(false);

  projects = signal<Project[]>([]);
  filtered = computed(() => {
    const q = this.keyword().trim().toLowerCase();
    const list = this.projects();
    return q ? list.filter(p => p.name.toLowerCase().includes(q)) : list;
  });

  /* ===== Dynamic page size by viewport height =====
     - < 800px  ➜  5 items (เช่น notebook สูง ~740–760)
     - ≥ 800px  ➜  8 items (จอพีซีปกติ)
  */
  private calcPageSize(h: number): number {
    return h < 800 ? 5 : 8;
  }
  pageSize = signal<number>(this.calcPageSize(typeof window !== 'undefined' ? window.innerHeight : 900));

  /* ===== Pagination ===== */
  pageIndex = signal(0);
  pageCount = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize())));
  pages = computed(() => Array.from({ length: this.pageCount() }, (_, i) => i));
  paged = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  constructor(
    private svc: ProjectsService,
    private router: Router,
    private footer: FooterStateService
  ) {
    effect(() => this.projects.set(this.svc.list()));

    // เมื่อกรองผลเปลี่ยน ให้กลับหน้าแรก
    effect(() => {
      this.filtered();
      this.pageIndex.set(0);
    });
  }

  /* ===== Aside ===== */
  toggleAside() {
    const next = !this.asideOpen();
    this.asideOpen.set(next);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = next ? 'hidden' : '';
    }
  }

  /* ===== Global click / ESC ===== */
  @HostListener('document:click') onDocClick() {
    if (this.menuOpenId() !== null) this.menuOpenId.set(null);
    if (this.profileOpen()) this.profileOpen.set(false);
  }
  @HostListener('document:keydown.escape') onEsc() {
    if (this.profileOpen()) { this.profileOpen.set(false); return; }
    if (this.menuOpenId() !== null) { this.menuOpenId.set(null); return; }
    if (this.asideOpen()) {
      this.asideOpen.set(false);
      if (typeof document !== 'undefined') document.body.style.overflow = '';
    }
  }

  /* ===== Project card menus ===== */
  toggleMenu(id: string) { this.menuOpenId.update(cur => (cur === id ? null : id)); }
  closeMenu() { this.menuOpenId.set(null); }
  openProject(id: string) { console.log('open project', id); this.closeMenu(); }
  renameProject(id: string, currentName: string) {
    const next = window.prompt('Rename project:', currentName?.trim() ?? '');
    if (next != null) {
      const name = next.trim();
      if (name && name !== currentName) this.svc.rename(id, name);
    }
    this.closeMenu();
  }

  /* ===== Profile menu (top-right) ===== */
  toggleProfileMenu() {
    if (this.menuOpenId() !== null) this.menuOpenId.set(null);
    this.profileOpen.update(v => !v);
  }
  onEditProfile() { this.router.navigateByUrl('/profile/edit'); }
  onLogout() { this.router.navigateByUrl('/login'); }

  /* ===== CRUD helpers ===== */
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

  /* ===== Paging actions ===== */
  gotoPage(n: number) { if (n >= 0 && n < this.pageCount()) this.pageIndex.set(n); }
  nextPage() { const n = this.pageIndex() + 1; if (n < this.pageCount()) this.pageIndex.set(n); }
  prevPage() { const n = this.pageIndex() - 1; if (n >= 0) this.pageIndex.set(n); }
}

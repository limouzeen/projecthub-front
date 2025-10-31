import {
  Component,
  effect,
  signal,
  computed,
  HostListener,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
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
  // ปรับป้ายลิขสิทธิ์


  @ViewChild('pagerZone', { static: false }) pagerZone?: ElementRef<HTMLElement>;
private updateFooterAvoidOverlap() {
  const pager = this.pagerZone?.nativeElement;
  const pill = document.querySelector<HTMLElement>('.footer-pill');
  if (!pager || !pill) return;

  const vpH = window.innerHeight;
  const pr = pager.getBoundingClientRect();

  // พื้นที่แนวตั้งของป้าย (ถ้าอยู่กลางล่างปกติ)
  const pillH = pill.offsetHeight || 48;
  const bottomGap = 16;                       // ตรงกับ bottom-4
  const pillTop = vpH - bottomGap - pillH;    // ขอบบนของป้าย
  const pillBottom = pillTop + pillH;         // ขอบล่างของป้าย

  const pagerInViewport = pr.bottom > 0 && pr.top < vpH;

  //  overlap เฉพาะเมื่อช่วงแนวตั้ง "ซ้อนทับกันจริง ๆ"
  const overlap = pagerInViewport
    ? (pillTop < pr.bottom) && (pillBottom > pr.top)
    : false;

  // ชน -> บังคับย่อ, ไม่ชน -> กลับไป auto ตาม threshold ของ service
  this.footer.setForceCompact(overlap ? true : null);
}

// ใส่ใน class
private onScroll = () => this.updateFooterAvoidOverlap();
private onResize = () => this.updateFooterAvoidOverlap();

ngAfterViewInit() {
  this.footer.setThreshold(915);
  // เช็กครั้งแรกหลัง DOM เสถียร
  setTimeout(() => this.updateFooterAvoidOverlap(), 0);

  window.addEventListener('scroll', this.onScroll, { passive: true });
  window.addEventListener('resize', this.onResize, { passive: true });
}

ngOnDestroy() {
  window.removeEventListener('scroll', this.onScroll);
  window.removeEventListener('resize', this.onResize);
  this.footer.resetAll();
}
  //  =======================

  readonly Math = Math;

  // ====== state หลัก ======
  keyword = signal('');
  selected = signal<Set<string>>(new Set());
  asideOpen = signal(false);

  // เมนู 3 จุด (จำว่าเมนูของโปรเจกต์ไหนเปิดอยู่)
  menuOpenId = signal<string | null>(null);

  // เมนูโปรไฟล์ (มุมขวาบน)
  profileOpen = signal(false);

  // ข้อมูลโปรเจกต์
  projects = signal<Project[]>([]);
  filtered = computed(() => {
    const q = this.keyword().trim().toLowerCase();
    const list = this.projects();
    return q ? list.filter((p) => p.name.toLowerCase().includes(q)) : list;
  });

  /* Pagination */
  readonly pageSize = 8;
  pageIndex = signal(0);
  pageCount = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
  pages = computed(() => Array.from({ length: this.pageCount() }, (_, i) => i));
  paged = computed(() => {
    const start = this.pageIndex() * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  constructor(
    private svc: ProjectsService,
    private router: Router,
    private footer: FooterStateService
  ) {
    effect(() => this.projects.set(this.svc.list()));

    // ตัวจัดการแสดงผล paging
    effect(() => {
      this.filtered();
      this.pageIndex.set(0);
    });
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
    if (this.profileOpen()) this.profileOpen.set(false);
  }

  /** กด ESC: ปิดโปรไฟล์ก่อน > เมนู 3 จุด > aside */
  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.profileOpen()) {
      this.profileOpen.set(false);
      return;
    }
    if (this.menuOpenId() !== null) {
      this.menuOpenId.set(null);
      return;
    }
    if (this.asideOpen()) {
      this.asideOpen.set(false);
      if (typeof document !== 'undefined') document.body.style.overflow = '';
    }
  }

  // ====== เมนู 3 จุด (ต่อท้ายการ์ดโปรเจกต์) ======
  toggleMenu(id: string) {
    this.menuOpenId.update((cur) => (cur === id ? null : id));
  }
  closeMenu() {
    this.menuOpenId.set(null);
  }

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
    this.profileOpen.update((v) => !v);
  }

  onEditProfile() {
    // this.profileOpen.set(false);
    this.router.navigateByUrl('/profile/edit');
  }

  onLogout() {
    this.router.navigateByUrl('/login');
    // this.auth.logout();
  }

  addQuick(name: string) {
    if (!name.trim()) return;
    this.svc.add(name.trim());
    this.keyword.set('');
  }

  isChecked(id: string) {
    return this.selected().has(id);
  }
  toggleCheck(id: string, checked: boolean) {
    this.selected.update((s) => {
      const next = new Set(s);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  removeOne(id: string) {
    this.svc.remove(id);
  }
  removeManySelected() {
    const ids = Array.from(this.selected());
    if (ids.length) this.svc.removeMany(ids);
    this.selected.set(new Set());
  }

  toggleFavorite(id: string) {
    this.svc.toggleFavorite(id);
  }
  exportCSV() {
    this.svc.downloadCSV(this.filtered());
  }
  toLocal(iso: string) {
    return new Date(iso).toLocaleDateString();
  }

  // -------------------------------------------------------------------------------
  /*ฟังก์ชันเปลี่ยนหน้า */
  gotoPage(n: number) {
    if (n >= 0 && n < this.pageCount()) this.pageIndex.set(n);
  }
  nextPage() {
    const n = this.pageIndex() + 1;
    if (n < this.pageCount()) this.pageIndex.set(n);
  }
  prevPage() {
    const n = this.pageIndex() - 1;
    if (n >= 0) this.pageIndex.set(n);
  }
}

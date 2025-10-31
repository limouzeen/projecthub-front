import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { combineLatest, filter, Subscription } from 'rxjs';
import { FooterStateService } from '../../../app/core/footer-state.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.html',
  styleUrls: ['./footer.css'],
})
export class Footer implements OnInit, OnDestroy {
  year = new Date().getFullYear();
  private sub?: Subscription;
  private router = inject(Router);
  private footerState = inject(FooterStateService);

  ngOnInit() {
    // เมื่อเปลี่ยนหน้า หรือ state เปลี่ยน -> คำนวณใหม่
    this.sub = combineLatest([
      this.footerState.threshold$,
      this.footerState.forceCompact$,
      this.router.events.pipe(filter(e => e instanceof NavigationEnd))
    ]).subscribe(() => this.applyCompact());

    // โหลดครั้งแรก
    this.applyCompact();
  }

  @HostListener('window:resize')
  onResize() { this.applyCompact(); }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  private applyCompact() {
    const wrap = document.querySelector<HTMLElement>('footer.footer-wrap');
    const pill = document.querySelector<HTMLElement>('.footer-pill');
    if (!wrap || !pill) return;

    const force = this.footerState.forceCompact$.value;        // true/false/null
    const th = this.footerState.threshold$.value;              // number|null
    const shouldCompact = force === true
      ? true
      : force === false
        ? false
        : (th != null && window.innerHeight <= th);            // auto

    pill.classList.toggle('is-compact', shouldCompact);
    wrap.classList.toggle('footer-right', shouldCompact);
  }
}

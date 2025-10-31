import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FooterStateService {
  /** ความสูงจอที่อยากให้ย่อ (null = ไม่กำหนด) */
  readonly threshold$ = new BehaviorSubject<number | null>(null);

  /** บังคับย่อ: true/false, null = ปล่อย auto ตาม threshold */
  readonly forceCompact$ = new BehaviorSubject<boolean | null>(null);

  setThreshold(px: number | null) { this.threshold$.next(px); }
  clearThreshold() { this.threshold$.next(null); }

  setForceCompact(v: boolean | null) { this.forceCompact$.next(v); }
  clearForce() { this.forceCompact$.next(null); }

  /** เคลียร์ทุก override (เรียกตอนออกจากหน้า) */
  resetAll() { this.clearThreshold(); this.clearForce(); }
}

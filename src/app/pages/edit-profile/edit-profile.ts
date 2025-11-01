import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FooterStateService } from '../../core/footer-state.service';

/* ===== Types ===== */
type ProfileForm = {
  avatarFile: File | null;
  avatarPreview: string | null;
  displayName: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

type UpdateStatus = 'idle' | 'success' | 'error';

/* ===== Component ===== */
@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css',
})
export class EditProfile implements OnInit, OnDestroy {
  /* -----------------------------
   * State (signals)
   * --------------------------- */
  readonly model = signal<ProfileForm>({
    avatarFile: null,
    avatarPreview: null,
    displayName: 'Phakin Kamwilaisak',
    email: 's65524100xx@sau.ac.th',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  readonly saving = signal(false);

  // สถานะการอัปเดต (สำหรับแถบข้อความด้านซ้ายปุ่ม Save)
  readonly status = signal<UpdateStatus>('idle');
  readonly statusMessage = signal<string>('');

  // สเตตสำหรับปุ่มตาแต่ละช่อง
  readonly showCurrent = signal(false);
  readonly showNew = signal(false);

  /* -----------------------------
   * Derived values
   * --------------------------- */
  readonly strength = computed(() => {
    const p = this.model().newPassword ?? '';
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[a-z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return Math.min(s, 5); // 0..5
  });

  readonly strengthLabel = computed(() => {
    return ['Too weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'][this.strength()];
  });

  constructor(private readonly footer: FooterStateService) {}

  /* -----------------------------
   * Lifecycle
   * --------------------------- */
  ngOnInit(): void {
    // ให้ป้ายลิขสิทธิ์ย่อเมื่อจอเตี้ยจริง ๆ
    this.footer.setThreshold(735);
    this.footer.setForceCompact(null); // auto ตาม threshold
  }

  ngOnDestroy(): void {
    // เก็บกวาด URL เดิมถ้ายังมี
    const prev = this.model().avatarPreview;
    if (prev) URL.revokeObjectURL(prev);
    this.footer.resetAll();
  }

  /* -----------------------------
   * UI helpers
   * --------------------------- */
  toggleShowCurrent() { this.showCurrent.update(v => !v); }
  toggleShowNew()     { this.showNew.update(v => !v); }

  private setStatus(kind: UpdateStatus, message: string, autoClearMs = 4000) {
    this.status.set(kind);
    this.statusMessage.set(message);
    if (autoClearMs > 0) {
      window.clearTimeout((this as any).__statusTimer);
      (this as any).__statusTimer = window.setTimeout(() => {
        this.status.set('idle');
        this.statusMessage.set('');
      }, autoClearMs);
    }
  }

  /* -----------------------------
   * Form events
   * --------------------------- */
  onText<K extends keyof ProfileForm>(key: K, ev: Event) {
    const value = (ev.target as HTMLInputElement).value as ProfileForm[K];
    this.model.update(m => ({ ...m, [key]: value }));
  }

  onPickAvatar(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;

    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) {
      this.setStatus('error', 'Please choose an image file (PNG, JPG, WEBP, GIF).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.setStatus('error', 'Image is too large. Max 2 MB.');
      return;
    }

    // ลบพรีวิวเก่า (ถ้ามี) ก่อนสร้างใหม่ เพื่อไม่ให้ leak
    const prev = this.model().avatarPreview;
    if (prev) URL.revokeObjectURL(prev);

    const url = URL.createObjectURL(file);
    this.model.update(m => ({ ...m, avatarFile: file, avatarPreview: url }));
  }

  removeAvatar() {
    const prev = this.model().avatarPreview;
    if (prev) URL.revokeObjectURL(prev);
    this.model.update(m => ({ ...m, avatarFile: null, avatarPreview: null }));
  }

  /* -----------------------------
   * Save
   * --------------------------- */
  async save() {
    // เคลียร์สถานะเดิม
    this.setStatus('idle', '');

    const { displayName, email, currentPassword, newPassword, confirmNewPassword } = this.model();

    // Basic validations
    if (!displayName.trim()) {
      this.setStatus('error', 'Please enter your name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.setStatus('error', 'Invalid email.');
      return;
    }

    // ตั้งรหัสใหม่ (ถ้ากรอกมา)
    if (newPassword || confirmNewPassword) {
      if (newPassword !== confirmNewPassword) {
        this.setStatus('error', 'New password and confirm password do not match.');
        return;
      }
      if (this.strength() < 3) {
        this.setStatus('error', 'Please choose a stronger password (min 8 chars, mixed case, numbers, symbol).');
        return;
      }
      if (!currentPassword) {
        this.setStatus('error', 'Please enter your current password to change password.');
        return;
      }
    }

    // เริ่มบันทึก
    this.saving.set(true);
    try {
      // TODO: call API ของคุณที่นี่
      // - แนบ this.model().avatarFile ถ้ามี
      // - ส่งข้อมูลฟอร์มที่แก้ไข

      await new Promise(r => setTimeout(r, 900)); // mock delay
      this.setStatus('success', 'Updated successfully');
    } catch (e: any) {
      this.setStatus('error', e?.message ?? 'Update failed. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }
}

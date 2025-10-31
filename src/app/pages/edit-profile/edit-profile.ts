import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FooterStateService } from '../../core/footer-state.service';

type ProfileForm = {
  avatarFile: File | null;
  avatarPreview: string | null;
  displayName: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css',
})
export class EditProfile implements OnInit, OnDestroy {
  // ===== state =====
  readonly model = signal<ProfileForm>({
    avatarFile: null,
    avatarPreview: null,
    displayName: 'Phakin Kamwilaisak',
    email: 's65524100xx@sau.ac.th',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  showPw = signal(false);
  saving = signal(false);
  msg = signal<string | null>(null);

  // ===== password strength (very simple client side) =====
  strength = computed(() => {
    const p = this.model().newPassword ?? '';
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return Math.min(score, 5); // 0..5
  });

  strengthLabel = computed(() => {
    const s = this.strength();
    return ['Too weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'][s];
  });

  constructor(private footer: FooterStateService) {}

  // ให้ป้ายลิขสิทธิ์ย่อเมื่อจอเตี้ยจริง ๆ (เช่น < 900px)
  ngOnInit(): void {
    this.footer.setThreshold(900);
    this.footer.setForceCompact(null); // auto ตาม threshold
  }

  ngOnDestroy(): void {
    this.footer.resetAll();
  }

  // ===== จัดการรูป =====
  onPickAvatar(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;

    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) {
      this.msg.set('Please choose an image file (PNG, JPG, WEBP, GIF).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) { // 2MB
      this.msg.set('Image is too large. Max 2 MB.');
      return;
    }

    const url = URL.createObjectURL(file);
    this.model.update(m => ({ ...m, avatarFile: file, avatarPreview: url }));
  }

  removeAvatar() {
    const prev = this.model().avatarPreview;
    if (prev) URL.revokeObjectURL(prev);
    this.model.update(m => ({ ...m, avatarFile: null, avatarPreview: null }));
  }

  async save() {
    this.msg.set(null);

    const { displayName, email, currentPassword, newPassword, confirmNewPassword } = this.model();

    // basic validations
    if (!displayName.trim()) { this.msg.set('Please enter your name.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { this.msg.set('Invalid email.'); return; }

    if (newPassword || confirmNewPassword) {
      if (newPassword !== confirmNewPassword) {
        this.msg.set('New password and confirm password do not match.');
        return;
      }
      if (this.strength() < 3) {
        this.msg.set('Please choose a stronger password (min 8 chars, mixed case, numbers, symbol).');
        return;
      }
      // ปกติควรให้กรอกรหัสเดิมเพื่อยืนยัน
      if (!currentPassword) {
        this.msg.set('Please enter your current password to change password.');
        return;
      }
    }


    this.saving.set(true);
    try {
      // TODO: เรียก API ของคุณที่นี่
      // 1) ถ้าอัปโหลดรูป: ส่ง this.model().avatarFile เป็น multipart/form-data
      // 2) ส่งชื่อ/อีเมล/รหัสตามฟิลด์ที่เปลี่ยน

      await new Promise(r => setTimeout(r, 900)); // mock delay
      this.msg.set('Profile updated successfully.');
    } catch (e: any) {
      this.msg.set('Update failed. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }


  onText<K extends keyof ProfileForm>(key: K, ev: Event) {
  const value = (ev.target as HTMLInputElement).value as ProfileForm[K];
  this.model.update(m => {
    
    return { ...m, [key]: value } as ProfileForm;
  });

}

toggleShowPw() {
  this.showPw.update(v => !v);
}

}

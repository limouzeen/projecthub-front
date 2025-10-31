import { Component, OnInit, OnDestroy } from '@angular/core';  
import { Router, RouterLink } from '@angular/router';
import { FooterStateService } from '../../../core/footer-state.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit, OnDestroy {               

  //  constructor
  constructor(
    private router: Router,
    private footer: FooterStateService
  ) {}

  onLoginSuccess() {
    this.router.navigateByUrl('/dashboard');
  }

  //  ตั้ง threshold เฉพาะหน้า Login: ย่อเมื่อสูง < 578px
  ngOnInit(): void {
    this.footer.setThreshold(578);
    this.footer.setForceCompact(null); // ให้ทำงานแบบ auto ตาม threshold
  }

  // ออกจากหน้านี้ให้คืนค่ากลับปกติ
  ngOnDestroy(): void {
    this.footer.resetAll();
  }
}

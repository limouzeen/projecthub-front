import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FooterStateService } from '../../../core/footer-state.service';
@Component({
  selector: 'app-register',
  imports: [RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit, OnDestroy {

    //  constructor
  constructor(
    private router: Router,
    private footer: FooterStateService
  ) {}


   //  ตั้ง threshold เฉพาะหน้า Login: ย่อเมื่อสูง < 675px
  ngOnInit(): void {
    this.footer.setThreshold(675);
    this.footer.setForceCompact(null); // ให้ทำงานแบบ auto ตาม threshold
  }

  // ออกจากหน้านี้ให้คืนค่ากลับปกติ
  ngOnDestroy(): void {
    this.footer.resetAll();
  }

}

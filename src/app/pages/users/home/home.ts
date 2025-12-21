import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home implements OnInit {

  name = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.name = this.authService.getCurrentUserName();
  }
}

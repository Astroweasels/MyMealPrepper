import { Component, signal } from '@angular/core';
import { Header } from './components/header/header';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  standalone: true,
  imports: [Header, RouterOutlet],
})
export class App {
  protected readonly title = signal('my-meal-prepper');
}
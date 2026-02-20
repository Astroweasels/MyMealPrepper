import { Component, signal } from '@angular/core';
import { Header } from './components/header/header';
import { Body } from './components/body/body';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  standalone: true,
  imports: [Header, Body],
})
export class App {
  protected readonly title = signal('my-meal-prepper');
}
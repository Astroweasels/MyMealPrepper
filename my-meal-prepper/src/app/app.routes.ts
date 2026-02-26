import { Routes } from '@angular/router';

export const routes: Routes = [
 {
    path: '',
    redirectTo: 'body',
    pathMatch: 'full'
},    
{
  path: 'about',
  loadComponent: () =>
    import('./components/about/about').then(m => m.About)
},
{
  path: 'body',
  loadComponent: () =>
    import('./components/body/body').then(m => m.Body)
}];

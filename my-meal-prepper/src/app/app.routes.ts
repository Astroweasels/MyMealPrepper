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
},
{
  path: 'how-it-works',
  loadComponent: () =>
    import('./components/how-it-works/how-it-works').then(m => m.HowItWorks)
}
];

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgxMapboxGLModule } from 'ngx-mapbox-gl';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { FiltersComponent } from './filters/filters.component';

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    FiltersComponent
  ],
  imports: [
    BrowserModule,
    NgxMapboxGLModule,
    HttpClientModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

import { Component } from '@angular/core';
import { DataService } from "../data.service";

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.scss']
})
export class FiltersComponent {
  constructor(public dataService: DataService) { }

  public filterIsClicked(e: Event): void{
    this.dataService.changeFilters(e);
  }

}

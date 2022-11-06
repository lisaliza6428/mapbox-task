import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { GeoDataItemModel, GeoDataModel } from "./models";
import { Subject } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private allPoints!: GeoDataModel;
  private filtersList: string[] = [];
  public accidentsList: string[] = [];

  private initAccidentsData = new Subject<GeoDataModel>();
  public initAccidentsDataObservable = this.initAccidentsData.asObservable();

  private accidentsData = new Subject<GeoDataModel>();
  public accidentsDataObservable = this.accidentsData.asObservable();

  constructor(private http: HttpClient) { }

  public getGeoData(): void {
    this.http.get<GeoDataModel>('./assets/road_accidents.geojson').subscribe((data: GeoDataModel) => {
      this.allPoints = data;
      this.getAccidentsList();
      this.initAccidentsData.next(this.allPoints);
    });
  }

  public changeFilters(e: Event): void {
    const filterIsChecked = (e.target as HTMLInputElement).checked;
    const filterValue = (e.target as HTMLInputElement).id;
    if (filterIsChecked) {
      this.filtersList.push(filterValue);
    } else {
      this.filtersList = this.filtersList.filter((filter: string) => filter !== filterValue);
    }
    this.checkFiltersListLength();
  }

  private getAccidentsList(): void {
    const accidentsList: Set<string> = new Set();
    this.allPoints.features.forEach((feature: GeoDataItemModel) => {
      accidentsList.add(feature.properties.type);
    });
    this.accidentsList = [...accidentsList];
  }

  private checkFiltersListLength(): void {
    if (this.filtersList.length === 0) {
      this.accidentsData.next(this.allPoints);
    } else {
      this.filterAccidentsData();
    }
  }

  private filterAccidentsData(): void {
    let filteredData: GeoDataItemModel[] = [];
    this.filtersList.forEach((filter: string) => {
      const filtered = this.allPoints.features.filter((x: GeoDataItemModel) => x.properties.type === filter);
      filteredData = filteredData.concat(filtered);
    })
    const filteredFeatureCollection = {
      type: "FeatureCollection",
      features: filteredData,
    };
    this.accidentsData.next(filteredFeatureCollection as GeoDataModel);
  }

}

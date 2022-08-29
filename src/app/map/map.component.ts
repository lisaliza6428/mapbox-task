import { Component, OnDestroy, OnInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { GeoDataModel, GeoDataItemModel } from '../models';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-map',
  templateUrl: `./map.component.html`,
  styleUrls: ['./map.component.scss'
  ],
})

export class MapComponent implements OnInit, OnDestroy {

  map!: mapboxgl.Map;
  style: string;
  lat: number;
  lng: number;
  data!: GeoDataModel;
  points!: GeoDataModel;
  accidentsTypes!: string[];
  filtersArray: string[];
  subscription!: Subscription;

  constructor(private http: HttpClient) {
    this.style = 'mapbox://styles/mapbox/streets-v11';
    this.lat = 52.4207;
    this.lng = 58.8020;
    this.filtersArray = [];
  }

  ngOnInit(): void {
    this.getGeoData();
    this.addMap();
  }

  private getGeoData(): void {
    this.subscription = this.http.get<GeoDataModel>('./assets/road_accidents.geojson').subscribe((data: GeoDataModel) => {
      this.data = data;
      this.points = data;
      this.getAccidentsTypes();
    });
  }

  private getAccidentsTypes(): void {
    const accidentTypes: Set<string> = new Set();
    this.data.features.forEach((x: GeoDataItemModel) => {
      accidentTypes.add(x.properties.type);
    });
    this.accidentsTypes = [...accidentTypes];
  }

  private addMap(): void {
    this.map = new mapboxgl.Map({
      container: 'map',
      accessToken: "pk.eyJ1IjoibGlzYWxpemE2NDI4IiwiYSI6ImNrdWNrMW9hajB6NXYzMW12Ymt5M2NuZ3MifQ.T4b2--uZ14J9xjMtZtk8mg",
      style: this.style,
      center: [this.lat, this.lng],
      zoom: 4.5
    });

    this.map.addControl(new mapboxgl.NavigationControl());

    this.map.on('load', () => {
      this.map.addSource('accidents', {
        type: 'geojson',
        data: this.points,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      this.map.addLayer({ //add circles
        id: 'clusters',
        type: 'circle',
        source: 'accidents',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#8ff180',
            100,
            '#8ff180',
            750,
            '#8ff180'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            100,
            30,
            750,
            40
          ]
        }
      });

      this.map.addLayer({ //add number of points to circles
        id: 'cluster-count',
        type: 'symbol',
        source: 'accidents',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium'],
          'text-size': 16
        }
      });

      this.map.addLayer({  //add all points of accidents
        id: 'unclustered-point',
        type: 'circle',
        source: 'accidents',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': 7,
          'circle-stroke-width': 2,
          'circle-color': 'green',
          'circle-stroke-color': 'white'
        }
      });

      this.map.on('click', 'unclustered-point', (e) => {
        if (e.features && e.features[0] && e.features[0].geometry && e.features[0].geometry.type === 'Point') {
          const coordinates = e.features[0].geometry.coordinates.slice();
          const info = e.features[0].properties;
          const type = info?.['type'];
          const died = info?.['died'];
          const wounded = info?.['wounded'];
          new mapboxgl.Popup()
            .setLngLat([coordinates[0], coordinates[1]])
            .setHTML(
              `<p>Тип ДТП: ${type}</p>
              <p>Количество умерших: ${died}</p>
              <p>Количество раненых: ${wounded}</p>`
            )
            .addTo(this.map);
        }
      });

      this.map.on('mouseenter', ['unclustered-point'], () => {
        this.map.getCanvas().style.cursor = 'pointer';
      });

      this.map.on('mouseleave', ['unclustered-point'], () => {
        this.map.getCanvas().style.cursor = '';
      });
    });
  }

  public changeFilters(e: Event): void {
    const filterIsChecked = (e.target as HTMLInputElement).checked;
    const filterValue = (e.target as HTMLInputElement).id;
    if (filterIsChecked) {
      this.filtersArray.push(filterValue);
    } else {
      this.filtersArray = this.filtersArray.filter((filter: string) => filter !== filterValue);
    }
    this.checkFiltersArrayLength();
  }

  private checkFiltersArrayLength(): void {
    if (this.filtersArray.length === 0) {
      (this.map.getSource('accidents') as mapboxgl.GeoJSONSource).setData(this.data);
    } else {
      this.filterData();
    }
  }

  private filterData(): void {
    let filteredData: GeoDataItemModel[] = [];
    this.filtersArray.forEach((filter: string) => {
      let arr = this.data.features.filter((x: GeoDataItemModel) => x.properties.type === filter);
      filteredData = filteredData.concat(arr);
    })
    const filteredFeatureCollection = {
      type: "FeatureCollection",
      features: filteredData
    };
    this.points = filteredFeatureCollection as GeoDataModel;
    (this.map.getSource('accidents') as mapboxgl.GeoJSONSource).setData(this.points);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}





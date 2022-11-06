import { Component, OnInit, OnDestroy } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { GeoDataModel } from '../models';
import { DataService } from "../data.service";
import { Subscription } from "rxjs";

@Component({
  selector: 'app-map',
  templateUrl: `./map.component.html`,
  styleUrls: ['./map.component.scss'
  ],
})

export class MapComponent implements OnInit, OnDestroy {

  private map!: mapboxgl.Map;
  private style = 'mapbox://styles/mapbox/streets-v11';
  private accessToken = 'pk.eyJ1IjoibGlzYWxpemE2NDI4IiwiYSI6ImNrdWNrMW9hajB6NXYzMW12Ymt5M2NuZ3MifQ.T4b2--uZ14J9xjMtZtk8mg';
  private mapCenter: mapboxgl.LngLatLike = [52.4207, 58.8020];
  private initAccidentsDataSubscription!: Subscription;
  private accidentsDataSubscription!: Subscription;

  constructor(private dataService: DataService) {
    this.initAccidentsDataSubscription = this.dataService.initAccidentsDataObservable.subscribe((data: GeoDataModel) => this.addAccidentsData(data));
    this.accidentsDataSubscription = this.dataService.accidentsDataObservable.subscribe((data: GeoDataModel) => this.updateAccidentsData(data));
  }

  ngOnInit(): void {
    this.addMap();
    this.dataService.getGeoData();
  }

  private addMap(): void {
    this.map = new mapboxgl.Map({
      container: 'map',
      accessToken: this.accessToken,
      style: this.style,
      center: this.mapCenter,
      zoom: 4.5
    });
    this.map.addControl(new mapboxgl.NavigationControl());
  }

  private addAccidentsData(data: GeoDataModel): void {
    this.map.on('load', () => {
      this.map.addSource('accidents', {
        type: 'geojson',
        data: data,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });
      this.addClusterLayer();
      this.addNumbersToClusterLayer();
      this.addAccidentsPoints();
      this.listenAccidentPointClick();
      this.listenMapMouseEvents();
    });
  }

  private addClusterLayer(): void {
    this.map.addLayer({
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
  }

  private addNumbersToClusterLayer(): void {
    this.map.addLayer({
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
  }

  private addAccidentsPoints(): void {
    this.map.addLayer({
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
  }

  private listenAccidentPointClick(): void {
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
              <p>Количество погибших: ${died}</p>
              <p>Количество раненых: ${wounded}</p>`
        )
        .addTo(this.map);
      }
    });
  }

  private listenMapMouseEvents(): void {
    this.map.on('mouseenter', ['unclustered-point'], () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', ['unclustered-point'], () => {
      this.map.getCanvas().style.cursor = '';
    });
  }

  private updateAccidentsData(data: GeoDataModel): void {
    (this.map.getSource('accidents') as mapboxgl.GeoJSONSource).setData(data);
  }

  ngOnDestroy(): void {
    this.initAccidentsDataSubscription.unsubscribe();
    this.accidentsDataSubscription.unsubscribe();
  }
}





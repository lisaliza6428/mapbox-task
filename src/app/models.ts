export interface GeoDataModel {
  type: 'FeatureCollection',
  features: GeoDataItemModel[],
}

export interface GeoDataItemModel {
  geometry: {
    type: 'Point',
    coordinates: number[]
  }
  id: string,
  properties: {
    type: string,
    died: number,
    wounded: number
  }
  type: "Feature"
}
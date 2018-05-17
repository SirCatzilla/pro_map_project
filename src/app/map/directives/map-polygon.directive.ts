import { OnInit, Input, NgZone, Directive, OnDestroy, ViewChild, inject, forwardRef } from '@angular/core';

import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

import { MapPolygonManager } from './map-polygon-manager';
import { MapsApiLoader } from '../maps-api-loader';

declare var google: any;

export const MAP_POLYGON_VALUE_ACCESSOR: any = {
	provide: NG_VALUE_ACCESSOR,
	useExisting: forwardRef(() => MapPolygonDirective),
	multi: true
}

@Directive({
	selector: 'pv-map-polygon',
	providers: [
		MAP_POLYGON_VALUE_ACCESSOR
	]
})
export class MapPolygonDirective implements OnInit, OnDestroy, ControlValueAccessor{

	private _polygon: any;
	private _onChange = (value: any)=>{};
	private _ontouch = ()=>{};

	private _defaultOptions: any = {
		draggable: true,
		editable: true
	};

	private _path$ = new BehaviorSubject([]);
	private _options$ = new BehaviorSubject(this._defaultOptions);

	// ADD INPUTS

	// draggable
	// editable
	// fillColor
	// fillOpacity
	// geodesic
	// strokeColor
	// strokeWeight
	// visible

	constructor(
		private _mapsApiLoader: MapsApiLoader,
		private _polygons: MapPolygonManager

	) { }

	writeValue(value: any): void {
		this._path$.next(value);
	}

	registerOnChange(fn: any): void {
		this._onChange = fn;
	}

	registerOnTouched(fn: any): void {
		this._ontouch = fn;
	}

	ngOnInit() {
		this._mapsApiLoader.load().then(() => {
			this.initPoly();
		});
	}

	initPoly() {
		this._polygon = new google.maps.Polygon(this._defaultOptions);
		this._polygons.add(this._polygon);

		this._polygon.addListener('mouseup', (event) => {
			console.log('mouseup', event);
			this._onChange(this.serializePath());
		});

		this._options$.subscribe(options => {
			this._polygon.setOptions(options);
		});

		this._path$.subscribe(pathArr => {

			let lngLngs = pathArr.map(latLng => new google.maps.LatLng(latLng));

			console.log('SET PATH', lngLngs);

			this._polygon.getPath().unbindAll();

			let path = new google.maps.MVCArray(lngLngs);

			path.addListener('insert_at', (event) => {
				console.log('insert_at', event);
				this._onChange(this.serializePath());
			});
			path.addListener('remove_at', (event) => {
				console.log('remove_at', event);
				this._onChange(this.serializePath());
			});
			// path.addListener('set_at', (event) => {
			// 	console.log('set_at', event);
			// 	this._onChange(this.serializePath());
			// });

			this._polygon.setPath(path);
		});
	}

	ngOnDestroy() {

	}

	private serializePath(){

		return this._polygon
				   .getPath()
				   .getArray()
				   .map(latLng => {
					   return {
						   lat: latLng.lat(),
						   lng: latLng.lng(),
					   }
				   });
	}

	private patchOptions(options: any) {
		this._options$.next({
			...this._options$.value,
			...options
		});
	}

}
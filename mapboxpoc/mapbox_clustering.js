import { define, render, html } from "heresy";
import mapboxgl from "mapbox-gl";

import geoData from "./geo_pushpin.json";

const token =
    "pk.eyJ1IjoiaW1udXR6IiwiYSI6ImNrMHAxY2UxZzBnc2EzZG11YmVhd2dubG0ifQ.bUTN7ceAHq6kVooe3MKgqg";

var size = 200;

const ClusteringMap = {
    extends: "div",

    style(selector) {
        return `${selector} {
            width: 100vw;
            height: 100vh;
        }`;
    },

    oninit() {
        this.geoData = this._processData();
    },

    _processData() {
        const features = geoData.geoResult.data || [];

        return features.map(feature => {
            return {
                type: "Feature",
                geometry: feature.geometry,
                properties: {
                    title: feature.title,
                    value: feature.value
                }
            };
        });
    },

    _addMarkers() {
        this.geoData.forEach(data => {
            let {
                geometry: {
                    coordinates
                },
                properties: {
                    title,
                    value
                }
            } = data;


            let marker = new mapboxgl.Marker();
            let popup = `
                <div>
                    <span>Title</span><span>${title}</span>
                    <span>Value</span><span>${value}</span>
                </div>
            `;
            marker.setLngLat(coordinates);
            marker.setPopup(new mapboxgl.Popup().setHTML(popup));
            marker.addTo(this.map);

        });
    },

    onMapLoaded() {

        this.map.addSource("mysource", {
            type: "geojson",
            data: {
                type: "FeatureCollection",
                features: this.geoData
            },
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50
        });
        this.map.addLayer({
            id: "clusters",
            type: "circle",
            source: "mysource",
            filter: ["has", "point_count"],
            paint: {
                // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
                // with three steps to implement three types of circles:
                //   * Blue, 20px circles when point count is less than 100
                //   * Yellow, 30px circles when point count is between 100 and 750
                //   * Pink, 40px circles when point count is greater than or equal to 750
                "circle-color": [
                    "step",
                    ["get", "point_count"],
                    "#51bbd6",
                    0,
                    "#f28cb1",
                    50,
                    "#f1f075",
                    100,
                    "cyan"
                ],
                "circle-radius": [
                    "step",
                    ["get", "point_count"],
                    10,
                    100,
                    20,
                    150,
                    30,
                    750,
                    40
                ]
            }
        });
        this.map.addLayer({
            id: "unclustered-point",
            type: "circle",
            source: "mysource",
            filter: ["!", ["has", "point_count"]],
            paint: {
                "circle-color": [
                    "interpolate",
                    ["linear"],
                    ["number", ["get", "value"]],
                    0,
                    "yellow",
                    50,
                    "red",
                    100,
                    "green"
                ],
                "circle-radius": 10,
                "circle-stroke-width": 1,
                "circle-stroke-color": "#fff",
                "circle-opacity": 0.75
            }
        });
        this.map.addLayer({
            id: "cluster-count",
            type: "symbol",
            source: "mysource",
            filter: ["has", "point_count"],
            layout: {
                "text-field": "{point_count_abbreviated}",
                "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                "text-size": 12
            }
        });
        this.map.setCenter(this.geoData[3000].geometry.coordinates);

        this.map.on(
            "mouseenter",
            "unclustered-point",
            this.showPopup.bind(this)
        );

        //this.map.on("click", "unclustered-point", this.showMarker.bind(this));

        this.map.on(
            "mouseleave",
            "unclustered-point",
            this.hidePopup.bind(this)
        );

        this.map.on("click", "clusters", this.onClusterClicked.bind(this));
    },

    onconnected() {
        mapboxgl.accessToken = token;
        this.map = new mapboxgl.Map({
            container: this,
            style: "mapbox://styles/mapbox/light-v10",
            zoom: 5
        });

        this.popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false
        });

        this.map.on("load", this.onMapLoaded.bind(this));
    },

    showPopup(e) {
        this.map.getCanvas().style.cursor = "pointer";

        let coordinates = e.features[0].geometry.coordinates.slice();
        let { title, value } = e.features[0].properties;

        let popupHtml = `
            <div>
                <table>
                    <tr>
                        <td>Title</td>
                        <td>${title}</td>
                    </tr>
                    <tr>
                        <td>Value</td>
                        <td>${value}</td>
                    </tr>
                </table>
            </div>
        `;

        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        this.popup
            .setLngLat(coordinates)
            .setHTML(popupHtml)
            .addTo(this.map);
    },

    hidePopup() {
        this.map.getCanvas().style.cursor = "";
        this.popup.remove();
    },

    onClusterClicked(e) {
        let features = this.map.queryRenderedFeatures(e.point, {
            layers: ["clusters"]
        });
        let clusterId = features[0].properties.cluster_id;

        this.map
            .getSource("mysource")
            .getClusterExpansionZoom(clusterId, (err, zoom) => {
                if (err) return;

                this.map.easeTo({
                    center: features[0].geometry.coordinates,
                    zoom
                });
            });
    },
};

const MapboxApp = {
    extends: "div",
    includes: { ClusteringMap },

    render() {
        this.html`
            <ClusteringMap/>
        `
    }
}

define("MapboxApp", MapboxApp);

render(document.querySelector("#app"), html`<MapboxApp/>`);


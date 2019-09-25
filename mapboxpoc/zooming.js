import { define, render, html } from "heresy";
import mapboxgl from "mapbox-gl";

import usStates from "./usstates.json";

const RAN_MIN = 10;
const RAN_MAX = 1000;

const token =
    "pk.eyJ1IjoiaW1udXR6IiwiYSI6ImNrMHAxY2UxZzBnc2EzZG11YmVhd2dubG0ifQ.bUTN7ceAHq6kVooe3MKgqg";

const ZoomingMap = {
    extends: "div",

    style(selector) {
        return `${selector} {
            width: 100vw;
            height: 100vh;
        }`;
    },

    oninit() {
        this._transformData();

        this.layers = {
            "mycircle-value": {
                id: "mycircle-value",
                type: "symbol",
                source: "mysource",
                layout: {
                    "text-field": "{value}",
                    "text-size": 10
                }
            },
            mycircle: {
                id: "mycircle",
                type: "circle",
                source: "mysource",
                userProperties: true,
                paint: {
                    "circle-color": [
                        "step",
                        ["get", "value"],
                        "#000000",
                        10,
                        "#fbb03b",
                        50,
                        "#223b53",
                        200,
                        "#e26a6a",
                        500,
                        "#aa8f00",
                        800,
                        "#3498db"
                    ],
                    "circle-radius": {
                        property: "value",
                        stops: [
                            [10, 8],
                            [50, 9],
                            [100, 12],
                            [500, 16],
                            [800, 25]
                        ]
                    },
                    "circle-stroke-width": 1,
                    "circle-stroke-color": "#fff",
                    "circle-opacity": 0.75
                }
            },
            "wifi-price-value": {
                id: "wifi-price-value",
                type: "symbol",
                source: "mysource",
                filter: ["has", "price"],
                layout: {
                    "text-field": "{price}",
                    "text-size": 10
                }
            },
            "wifi-price": {
                id: "wifi-price",
                type: "circle",
                source: "mysource",
                filter: ["has", "price"],
                paint: {
                    "circle-color": [
                        "step",
                        ["get", "price"],
                        "#51bbd6",
                        100,
                        "#f1f075",
                        350,
                        "#f28cb1"
                    ],
                    "circle-radius": [
                        "step",
                        ["get", "price"],
                        10,
                        100,
                        12,
                        300,
                        30
                    ],
                    "circle-stroke-width": 2,
                    "circle-stroke-color": "#fff",
                    "circle-opacity": 0.65
                }
            }
        };
    },

    _transformData() {
        let dataWithValues = usStates.features.map(feature => {
            feature.properties.value = Math.round(
                Math.random() * (RAN_MAX - RAN_MIN) + RAN_MIN
            );

            return feature;
        });

        this.states = {
            type: "FeatureCollection",
            features: dataWithValues
        };
    },

    onMapLoaded() {
        this.map.addSource("mysource", {
            type: "geojson",
            data: this.states
        });

        this.map.addLayer(this.layers["mycircle-value"]);
        this.map.addLayer(this.layers["mycircle"]);

        this.map.setCenter(usStates.features[0].geometry.coordinates);

        this.map.on("mouseenter", "mycircle", this.onMouseEnter.bind(this));
        this.map.on("mouseleave", "mycircle", this.onMouseLeave.bind(this));
        this.map.on("click", "mycircle", this.zoomToPosition.bind(this));
    },

    onMouseEnter(e) {
        this.map.getCanvas().style.cursor = "pointer";
    },

    onMouseLeave(e) {
        this.map.getCanvas().style.cursor = "";
    },

    zoomToPosition(e) {
        let features = this.map.queryRenderedFeatures(e.point, {
            layers: ["mycircle"]
        });

        if (!features || !features.length) return;

        let coordinates = features[0].geometry.coordinates;
        this.map.flyTo({
            center: coordinates,
            zoom: 10
        });
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
    }
};

const ZoomingApp = {
    extends: "div",
    includes: { ZoomingMap },

    render() {
        this.html`
            <ZoomingMap/>
        `;
    }
};

define("ZoomingApp", ZoomingApp);

render(
    document.querySelector("#app"),
    html`
        <ZoomingApp />
    `
);

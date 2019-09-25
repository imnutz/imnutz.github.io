import { define, render, html } from "heresy";
import mapboxgl from "mapbox-gl";

import usCounties from "./us_polygon.json";
import usStates from "./us_states_only.json";

const token =
    "pk.eyJ1IjoiaW1udXR6IiwiYSI6ImNrMHAxY2UxZzBnc2EzZG11YmVhd2dubG0ifQ.bUTN7ceAHq6kVooe3MKgqg";

const ZOOM_AND_CENTER = {
    zoom: 4,
    center: [-100.04, 38.907]
};

const PolygonMap = {
    extends: "div",

    style(selector) {
        return `${selector} {
            width: 100vw;
            height: 100vh;
        }`;
    },

    oninit() {
        this._transformData();
        this._setupLayers();
    },

    _transformData() {
        this.usData = usStates.geoResult.data.map(feature => {
            return {
                type: "Feature",
                geometry: feature.geometry,
                properties: {
                    title: feature.title,
                    value: feature.value,
                    element: feature.element
                }
            };
        });

        this.counties = usCounties.geoResult.data.map(feature => {
            return {
                type: "Feature",
                geometry: feature.geometry,
                properties: {
                    title: feature.title,
                    value: feature.value,
                    element: feature.element
                }
            };
        });
    },

    _setupLayers() {
        this.layers = {
            "us-states": {
                id: "us-states-layer",
                type: "fill",
                source: "ussource",
                paint: {
                    "fill-color": [
                        "step",
                        ["get", "value"],
                        "#888888",
                        1000,
                        "red",
                        10000,
                        "pink",
                        50000,
                        "blue",
                        100000,
                        "green"
                    ],
                    "fill-opacity": 0.4
                }
            },
            "us-counties": {
                id: "us-counties-layer",
                type: "fill",
                source: "ussource",
                paint: {
                    "fill-color": [
                        "step",
                        ["get", "value"],
                        "#888888",
                        10,
                        "red",
                        100,
                        "pink",
                        200,
                        "blue",
                        300,
                        "green",
                        400,
                        "cyan",
                        500,
                        "yellow",
                        700,
                        "purple",
                        1000,
                        "#f022bb"
                    ],
                    "fill-opacity": 0.4
                },
                filter: ["==", "$type", "Polygon"]
            }
        };
    },

    onMapLoaded() {
        this.map.addSource("ussource", {
            type: "geojson",
            data: {
                type: "FeatureCollection",
                features: this.usData
            }
        });

        this.map.addLayer(this.layers["us-states"]);

        // this.map.addLayer(this.layers["mycircle-value"]);
        // this.map.addLayer(this.layers["mycircle"]);
        this.map.on(
            "mousemove",
            "us-states-layer",
            this.onMouseMove.bind(this)
        );
        this.map.on(
            "mouseleave",
            "us-states-layer",
            this.onMouseLeave.bind(this)
        );

        this.map.on(
            "mouseenter",
            "us-counties-layer",
            this.onMouseEnter.bind(this)
        );
        this.map.on(
            "mouseleave",
            "us-counties-layer",
            this.onMouseLeave.bind(this)
        );

        this.map.on("click", "us-states-layer", this.onClick.bind(this));
        this.map.on(
            "click",
            "us-counties-layer",
            this.onCountyClicked.bind(this)
        );
    },

    onMouseEnter(e) {
        this.map.getCanvas().style.cursor = "pointer";
    },

    onMouseMove(e) {
        this.map.getCanvas().style.cursor = "pointer";
        let { title, value, element } = e.features[0].properties;
        let type = e.features[0].geometry.type;

        let html = `
            <div class="state-info-popup">
                <p><span>Title:</span><span>${title}</span></p>
                <p><span>Value:</span><span>${value}</span></p>
                <p class="element"><span>Element:</span><input value=${element}></p>
            </div>
        `;

        this.popupForState
            .setLngLat(e.lngLat)
            .setHTML(html)
            .addTo(this.map);
    },

    onMouseLeave(e) {
        this.map.getCanvas().style.cursor = "";

        if (document.querySelector(".state-info-popup")) {
            this.popupForState.remove();
        }
    },

    onClick(e) {
        let statesLayer = this.layers["us-states"];
        let countiesLayer = this.layers["us-counties"];

        this.map.removeLayer(statesLayer.id);
        this.map.addLayer(countiesLayer);

        this.map.getSource("ussource").setData({
            type: "FeatureCollection",
            features: this.counties
        });

        this.map.flyTo({
            center: e.lngLat,
            zoom: 6
        });

        this.backButton.style.display = "block";
    },

    onCountyClicked(e) {
        let { title, value, element } = e.features[0].properties;

        let html = `
            <div class="info-popup">
                <p><span>Title:</span><span>${title}</span></p>
                <p><span>Value:</span><span>${value}</span></p>
                <p class="element"><span>Element:</span><input value=${element}/></p>
            </div>
        `;

        this.popupForCounty
            .setLngLat(e.lngLat)
            .setHTML(html)
            .addTo(this.map);
    },

    onconnected() {
        mapboxgl.accessToken = token;
        this.map = new mapboxgl.Map({
            container: this,
            style: "mapbox://styles/mapbox/light-v10",
            ...ZOOM_AND_CENTER
        });

        this.popupForState = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false
        });

        this.popupForCounty = new mapboxgl.Popup();

        this.map.on("load", this.onMapLoaded.bind(this));

        this.backButton = document.querySelector(".back-btn");
        this.backButton.addEventListener(
            "click",
            this._handleBackButton.bind(this)
        );
    },

    _handleBackButton(e) {
        e.preventDefault();

        this.popupForCounty.remove();

        let statesLayer = this.layers["us-states"];
        let countiesLayer = this.layers["us-counties"];

        this.map.removeLayer(countiesLayer.id);
        this.map.addLayer(statesLayer);

        this.map.getSource("ussource").setData({
            type: "FeatureCollection",
            features: this.usData
        });
        this.map.flyTo({
            ...ZOOM_AND_CENTER
        });
        this.backButton.style.display = "none";
    }
};

const PolygonApp = {
    extends: "div",
    includes: { PolygonMap },

    render() {
        this.html`
            <PolygonMap/>
        `;
    }
};

define("PolygonApp", PolygonApp);

render(
    document.querySelector("#app"),
    html`
        <PolygonApp />
    `
);

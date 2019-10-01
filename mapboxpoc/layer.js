import { define, render, html } from "heresy";
import mapboxgl from "mapbox-gl";

import usStates from "./usstates.json";
import wifi from "./wifi.json";

import GDCNavigationControl from "./navigation_control";

const RAN_MIN = 10;
const RAN_MAX = 1000;
const STATE_ZOOM = 3;
const token =
    "pk.eyJ1IjoiaW1udXR6IiwiYSI6ImNrMHAxY2UxZzBnc2EzZG11YmVhd2dubG0ifQ.bUTN7ceAHq6kVooe3MKgqg";

const BOUNDS = [[-127.177734, 23.781965], [-61.171875, 50.567563]];

var size = 200;

const MarkerMap = {
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
                        150,
                        "#e26a6a",
                        250,
                        "#aa8f00",
                        350,
                        "#3498db",
                        450,
                        "#3477db",
                        650,
                        "#2277db",
                        700,
                        "#bb77db",
                        750,
                        "#0077db",
                        800,
                        "#3aa7db"
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
        this.map.on("click", "mycircle", this.onClick.bind(this));
    },

    onMouseEnter(e) {
        this.map.getCanvas().style.cursor = "pointer";
    },

    onMouseLeave(e) {
        this.map.getCanvas().style.cursor = "";
    },

    onClickWifi(e) {
        let features = this.map.queryRenderedFeatures(e.point, {
            layers: ["wifi-price"]
        });

        if (!features || !features.length) return;

        let {
            geometry: { coordinates },
            properties: { price, name, host_name }
        } = features[0];

        let html = `
            <div class="info-popup">
                <p><span>Name:</span><span>${name}</span></p>
                <p><span>Price:</span><span>$$${price}</span></p>
                <p><span>Host:</span><span>${host_name}</span></p>
            </div>
        `;

        this.popup
            .setLngLat(coordinates)
            .setHTML(html)
            .addTo(this.map);
    },

    onClick(e) {
        let features = this.map.queryRenderedFeatures(e.point, {
            layers: ["mycircle"]
        });

        if (!features || !features.length) return;

        let {
            geometry: { coordinates },
            properties: { City, value }
        } = features[0];

        let html = `
            <div class="info-popup">
                <p><span>City:</span><span>${City}</span></p>
                <p><span>Value:</span><span>${value}</span></p>
            </div>
            <div class="see-more">
                See more: <a href="https://gooddata.com" class="see-more-link" target="_blank">here</a> 
            </div>
        `;

        this.popup
            .setLngLat(coordinates)
            .setHTML(html)
            .addTo(this.map);

        let seeMoreLink = document.querySelector(".see-more-link");
        if (seeMoreLink) {
            seeMoreLink.addEventListener("click", evt => {
                evt.preventDefault();

                this.popup.remove();
                this.map.getSource("mysource").setData(wifi);
                this.map.removeLayer(this.layers["mycircle"].id);
                this.map.removeLayer(this.layers["mycircle-value"].id);

                this.map.addLayer(this.layers["wifi-price"]);
                this.map.addLayer(this.layers["wifi-price-value"]);

                this.map.flyTo({
                    center: wifi.features[10].geometry.coordinates,
                    zoom: 10
                });

                this.gdcNavigationControl.showHome();

                // remove listeners
                this.map.off(
                    "mouseenter",
                    "mycircle",
                    this.onMouseEnter.bind(this)
                );
                this.map.off(
                    "mouseleave",
                    "mycircle",
                    this.onMouseLeave.bind(this)
                );
                this.map.off("click", "mycircle", this.onClick.bind(this));

                // new event listeners for new layers
                this.map.on(
                    "mouseenter",
                    "wifi-price",
                    this.onMouseEnter.bind(this)
                );
                this.map.on(
                    "mouseleave",
                    "wifi-price",
                    this.onMouseLeave.bind(this)
                );
                this.map.on("click", "wifi-price", this.onClickWifi.bind(this));
            });
        }
    },

    onconnected() {
        mapboxgl.accessToken = token;
        this.map = new mapboxgl.Map({
            container: this,
            style: "mapbox://styles/mapbox/light-v10",
            center: [-98.657227, 40.097134],
            zoom: STATE_ZOOM
        });

        this.map.on("load", this.onMapLoaded.bind(this));
        this.popup = new mapboxgl.Popup();

        this.gdcNavigationControl = new GDCNavigationControl({
            showZoom: true,
            showHome: false,
            homeHandler: this.handleBackButton.bind(this)
        });

        this.map.addControl(this.gdcNavigationControl, "top-left");

        this._setupElements();
    },

    handleBackButton(e) {
        this.popup.remove();

        this.map.getSource("mysource").setData(usStates);
        this.map.flyTo({
            center: usStates.features[0].geometry.coordinates,
            zoom: STATE_ZOOM
        });

        this.map.removeLayer(this.layers["wifi-price"].id);
        this.map.removeLayer(this.layers["wifi-price-value"].id);

        this.map.addLayer(this.layers["mycircle"]);
        this.map.addLayer(this.layers["mycircle-value"]);

        this.gdcNavigationControl.hideHome();

        // remove listeners
        this.map.off("mouseenter", "wifi-price", this.onMouseEnter.bind(this));
        this.map.off("mouseleave", "wifi-price", this.onMouseLeave.bind(this));
        this.map.off("click", "wifi-price", this.onClick.bind(this));

        // new event listeners for new layers
        this.map.on("mouseenter", "mycircle", this.onMouseEnter.bind(this));
        this.map.on("mouseleave", "mycircle", this.onMouseLeave.bind(this));
        this.map.on("click", "mycircle", this.onClick.bind(this));
    },

    _setupElements() {
        this.maxBoundsChk = document.querySelector(".max-bounds");
        this.maxBoundsChk.addEventListener("click", this);


        this.legendsChk = document.querySelector(".chk-legends");
        this.legendsChk.addEventListener("click", this);

        this.legendsContainer = document.querySelector(".legends-container");
    },

    onclick(e) {
        const target = e.target;

        if (/max-bounds/i.test(target.className)) {
            if (target.checked) {
                this.map.setMaxBounds(BOUNDS);
            } else {
                this.map.setMaxBounds(null);
                this.map.setZoom(STATE_ZOOM);
            }
        } else if (/chk-legends/i.test(target.className)) {
            if (target.checked) {
                this.legendsContainer.style.display = "block";
            } else {
                this.legendsContainer.style.display = "none";
            }
        }
    }
};

const MarkerApp = {
    extends: "div",
    includes: { MarkerMap },

    render() {
        this.html`
            <MarkerMap/>
        `;
    }
};

define("MarkerApp", MarkerApp);

render(
    document.querySelector("#app"),
    html`
        <MarkerApp />
    `
);

const noop = () => {};

function GDCNavigationControl(options = { showZoom: true, showHome: false }) {
    this.options = options;

    this.container = document.createElement("div");
    this.container.className = "mapboxgl-ctrl-group mapboxgl-ctrl";

    this.zoomInButton = this.createButton("mapboxgl-ctrl-icon mapboxgl-ctrl-zoom-in", this.zoomIn.bind(this));
    this.zoomOutButton = this.createButton("mapboxgl-ctrl-icon mapboxgl-ctrl-zoom-out", this.zoomOut.bind(this));
    this.homeButton = this.createButton("mapboxgl-ctrl-icon gdc-ctrl-home", this.options.homeHandler || noop);
}

GDCNavigationControl.prototype.onAdd = function onAdd(map) {
    this._map = map;

    if (this.options.showZoom) {
        this.container.appendChild(this.zoomInButton);
        this.container.appendChild(this.zoomOutButton);
    }

    if (this.options.showHome) {
        this.container.appendChild(this.homeButton);
    }

    return this.container;
}

GDCNavigationControl.prototype.onRemove = function onRemove() {
    this.container.parentNode.removeChild(this.container);

    this._map = null;
}

GDCNavigationControl.prototype.createButton = function createButton(className, handler) {
    const btn = document.createElement("button");
    
    btn.type = "button";
    btn.className = className;
    
    btn.addEventListener("click", handler);

    return btn;
}

GDCNavigationControl.prototype.zoomIn = function zoomIn(e) {
    this._map.zoomIn({}, { originalEvent: e })
}

GDCNavigationControl.prototype.zoomOut = function zoomOut(e) {
    this._map.zoomOut({}, { originalEvent: e })
}

GDCNavigationControl.prototype.showHome = function showHome() {
    this.container.appendChild(this.homeButton);
}

GDCNavigationControl.prototype.hideHome = function hideHome() {
    this.container.removeChild(this.homeButton);
}
export default GDCNavigationControl;

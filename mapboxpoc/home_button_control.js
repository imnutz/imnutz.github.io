function HomeButtonControl(eventHandler) {
    this.eventHandler = eventHandler;
}


HomeButtonControl.prototype.onAdd = function(map) {
    this.container = document.createElement("div");
    this.container.className = "home-button-control mapboxgl-ctrl-group mapboxgl-ctrl";


    let button = document.createElement("button");
    button.className = "home-button mapboxgl-ctrl-icon mapbox-gl-draw_home";
    button.appendChild(Assembly.createIcon("home"));

    button.addEventListener("click", this.eventHandler);

    this.container.appendChild(button);

    return this.container;
}

HomeButtonControl.prototype.onRemove = function() {
    this.container.parentNode.removeChild(this.container);
}

export default HomeButtonControl;

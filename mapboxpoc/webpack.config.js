const path = require("path");

module.exports = {
    entry: {
        cluster: "./mapbox_clustering.js",
        layer: "./layer.js",
        zooming: "./zooming.js",
        polygon: "./polygon.js"
    },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "dist")
    },

    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"],
                        exclude: ["/mapbox-gl"]
                    }
                }
            }
        ]
    },
    devServer: {
        port: 9000,
        hot: true
    }
};

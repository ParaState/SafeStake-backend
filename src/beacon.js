const request = require('request')
var config = require("../config/config")

const beacon = {}

beacon.get_validator_by_public = pk => new Promise((resolve, reject) => request.get(config.BEACONCHA_API + "/api/v1/validator/" + pk.toString(), (err, response, body) => {
    if (err) {
        reject(err);
    } else {
        resolve(JSON.parse(body));
    }
}));

beacon.get_latest_state = () => new Promise((resolve, reject) => request.get(config.BEACONCHA_API + "/latestState", (err, response, body) => {
    if (err) {
        reject(err);
    } else {
        resolve(JSON.parse(body));
    }
}));

module.exports = beacon;
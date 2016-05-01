import { HTTP } from 'meteor/http'

Meteor.startup(function () {
  if (Champions.find({}).count() === 0) {
    console.log("Loading Champions in DB (May takes few minutes)")
    var request = HTTP.get(`https://global.api.pvp.net/api/lol/static-data/euw/v1.2/champion?champData=tags&api_key=${api_key}`, {}),
        champions = request.data;
    for (var i in champions.data) {
      Champions.insert(champions.data[i]);
      console.log(champions.data[i].name + " inserted");
      var request = HTTP.get(`https://global.api.pvp.net/api/lol/static-data/euw/v1.2/champion/${champions.data[i].id}?champData=image&api_key=${api_key}`, {}),
          img = request.data.image.full;
      Champions.update({id: champions.data[i].id}, {$set: {"image": img}});
      console.log(champions.data[i].name + " updated");
    }
    console.log("Champions loaded");
  }
});

import { HTTP } from 'meteor/http'

Meteor.startup(function () {
  // We need to get all champions data (like tags and image) from the LOL API.
  if (Champions.find({}).count() < 130) {
    // We clear the DB because there's not 130 champions in it at least
    Champions.remove({});
    console.log("Loading Champions in DB (May takes few minutes)");
    // We ask for the champion list with tags
    var request = HTTP.get(`https://global.api.pvp.net/api/lol/static-data/euw/v1.2/champion?champData=tags&api_key=${api_key}`, {}),
        champions = request.data;
    // And for each champion, we ask the path for his image
    for (var i in champions.data) {
      Champions.insert(champions.data[i]);
      var request = HTTP.get(`https://global.api.pvp.net/api/lol/static-data/euw/v1.2/champion/${champions.data[i].id}?champData=image&api_key=${api_key}`, {}),
          img = request.data.image.full;
      Champions.update({id: champions.data[i].id}, {$set: {"image": img}});
    }
    // Once it's done, we prevent in the server console
    console.log("Champions loaded");
  }
});

import { Meteor } from 'meteor/meteor'
import { HTTP } from 'meteor/http'
Future = Npm.require('fibers/future');

Meteor.methods({
  searchSummoner: function (name, region) {
    var future = new Future();
    HTTP.get(`https://${region.toLowerCase()}.api.pvp.net/api/lol/${region}/v1.4/summoner/by-name/${name}?api_key=${api_key}`, {}, function (error, result) {
      if (result.statusCode === 404)
        future.throw(new Meteor.Error("search-summoner-404", "Summoner Not Found"));
      else if (result.statusCode === 500)
        future.throw(new Meteor.Error("search-summoner-500", "Something bad happened on Riot Servers :("));
      else
        future.return(result.data);
    });
    try {
      return future.wait();
    }
    catch (e) {
      throw new Meteor.Error('search-summoner', e.reason);
    }
  },
  summonerProfile: function (id, region) {
    try {
      var result = HTTP.get(`https://${region.toLowerCase()}.api.pvp.net/api/lol/${region}/v1.4/summoner/${id}?api_key=${api_key}`, {});
      return result.data[Object.keys(result.data)[0]];
    }
    catch (e) {
      throw new Meteor.Error(e);
    }
  },
  summonerChampionsMasteries: function (id, region) {
    var platforms = {"BR": "BR", "EUNE": "EUN1", "EUW": "EUW1", "JP": "JP1", "KR": "KR", "LAN": "LA1", "LAS": "LA2", "NA": "NA1", "OCE": "OC1", "RU": "RU", "TR": "TR1"};
    try {
      var result = HTTP.get(`https://${region}.api.pvp.net/championmastery/location/${platforms[region]}/player/${id}/champions?api_key=${api_key}`, {});
      return result.data;
    }
    catch (e) {
      throw new Meteor.Error(e.reason);
    }
  }
});

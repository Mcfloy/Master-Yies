Template.teamAdviser.onRendered(function () {
  $('.loading').css('display', 'none');
  var roles = [];
  addRole = function (result, tag, lane) {
    let selectedChampions = Champions.find({"tags.0": tag}).fetch();
    let finalResult = result.filter(function (a) {
      for (let c of selectedChampions) {
        if (c.id === a.championId)
          return true;
      }
      return false;
    });
    if (finalResult.length > 1)
      roles.push([lane, [Champions.findOne({id: finalResult[0].championId}), Champions.findOne({id: finalResult[1].championId}) ] ] );
  };
  removeRole = function (summoner, position) {
    Session.set(`summoner${position}-id`, undefined);
    Session.set(`summoner${position}-name`, undefined);
    Session.set(`summoner${position}`, undefined);
    let counter = Session.get('team-length');
    Session.set('team-length', counter - 1);
  };
  getRoles = function (summoner, position) {
    roles = [];
    let region = Session.get('team-region');
    Meteor.call('searchSummoner', summoner, region, function (error, result) {
      if (error) {
        $('.error-team').text(error.reason);
        $('.error-team').fadeIn();
      } else {
        var result = result[Object.keys(result)[0]];
        Session.set(`summoner${position}-id`, result.id);
        Session.set(`summoner${position}-name`, result.name);
        Meteor.call('summonerChampionsMasteries', result.id, region, function (error, result) {
          if (error) {
            $('.error-team').text(error.reason);
            $('.error-team').fadeIn();
          } else {
            let data = {
              "Assassin": {"points": 0, "champions": 0, "percentage_points": 0, "percentage_champions": 0, "efficiency": 0, "percentage_global": 0},
              "Fighter": {"points": 0, "champions": 0, "percentage_points": 0, "percentage_champions": 0, "efficiency": 0, "percentage_global": 0},
              "Mage": {"points": 0, "champions": 0, "percentage_points": 0, "percentage_champions": 0, "efficiency": 0, "percentage_global": 0},
              "Support": {"points": 0, "champions": 0, "percentage_points": 0, "percentage_champions": 0, "efficiency": 0, "percentage_global": 0},
              "Tank": {"points": 0, "champions": 0, "percentage_points": 0, "percentage_champions": 0, "efficiency": 0, "percentage_global": 0},
              "Marksman": {"points": 0, "champions": 0, "percentage_points": 0, "percentage_champions": 0, "efficiency": 0, "percentage_global": 0}
            },
                dataEfficiency = [],
                dataGlobal = [],
                array = [],
                total = {"points": 0, "champions": 0};
            // Gathering datas
            Session.set('result', result);
            for (let node of result) {
              let champion = Champions.findOne({id: node.championId});
              for (let i of champion.tags) {
                if (data[i] !== undefined) {
                  data[i].points += node.championPoints;
                  total.points += node.championPoints;
                  data[i].champions++;
                  total.champions++;
                }
              }
            }
            // Calculating percentages
            for (let i in data) {
              data[i].percentage_points = parseFloat((data[i].points / total.points * 100).toFixed(2));
              data[i].percentage_champions = parseFloat((data[i].champions / total.champions * 100).toFixed(2));
              dataEfficiency.push([i, parseFloat((data[i].percentage_points / data[i].percentage_champions).toFixed(2))]);
              dataGlobal.push([i, parseFloat(((data[i].percentage_points + data[i].percentage_champions) / 2).toFixed(2))]);
            }
            // Sorting the data by global percentage
            dataGlobal.sort(function (a, b) {
              return a[1] < b[1];
            });
            /*
            // Add some flexibility on the algorithm
            let flexibility = parseFloat( ( (dataGlobal[0][1] + dataGlobal[5][1]) / 2).toFixed(2) );
            // Now determining if we use global percentage or efficiency
            if (dataGlobal.filter(function (a) { return a[1] > flexibility; }).length < 4)
              array = dataGlobal.filter(function (a) { return a[1] > flexibility; });
            else {
              // We need to recalcule the flexibility for efficiency
              let flexibility = parseFloat( ( (dataEfficiency[0][1]) * 0.80).toFixed(2) );
              array = dataEfficiency.filter(function (a) { return a[1] > flexibility; });
            }
            */
            array = dataGlobal;
            // Sorting the ouput variable
            array.sort(function (a, b) {
              return a[1] < b[1];
            });
            // The algorithm that give lane (pretty boring to read)
            for (let i in array) {
              if (array[i][0] === "Fighter") {
                if (array[parseInt(i) + 1] !== undefined) {
                  if (array[parseInt(i) + 1][0] === "Assassin") {
                    addRole(result, "Fighter", "Top");
                  } else if (array[parseInt(i) + 1][0] === "Tank") {
                    addRole(result, "Fighter", "Jungler");
                  } else if (array[parseInt(i) + 1][0] === "Mage") {
                    addRole(result, "Fighter", "Top");
                  }
                } else {
                  addRole(result, "Fighter", "Jungler");
                }
              }
              if (array[i][0] === "Assassin") {
                if (array[parseInt(i) + 1] !== undefined) {
                  if (array[parseInt(i) + 1][0] === "Fighter") {
                    addRole(result, "Assassin", "Jungler");
                  } else if (array[parseInt(i) + 1][0] === "Mage") {
                    addRole(result, "Assassin", "Mid");
                  }
                }
              }
              if (array[i][0] === "Tank") {
                if (array[parseInt(i) + 1] !== undefined) {
                  if (array[parseInt(i) + 1][0] === "Assassin") {
                    addRole(result, "Tank", "Top");
                  } else if (array[parseInt(i) + 1][0] === "Fighter") {
                    addRole(result, "Tank", "Top");
                  } else if (array[parseInt(i) + 1][0] === "Mage") {
                    addRole(result, "Tank", "Jungler");
                  } else if (array[parseInt(i) + 1][0] === "Marksman") {
                    addRole(result, "Marskman", "ADC");
                  } else if (array[parseInt(i) + 1][0] === "Support") {
                    addRole(result, "Tank", "Support");
                  }
                } else {
                  addRole(result, "Tank", "Top");
                }
              }
              if (array[i][0] === "Mage") {
                addRole(result, "Mage", "Mid");
              }
              if (array[i][0] === "Marksman") {
                addRole(result, "Marksman", "ADC");
              }
              if (array[i][0] === "Support") {
                addRole(result, "Support", "Support");
              }
            }
            Session.set(`summoner${position}`, roles);
            let counter = Session.get('team-length');
            Session.set('team-length', counter + 1);
          }
        });
      }
    });
  }
});

Template.teamAdviser.events({
  'click .add-summoner': function (event) {
    event.preventDefault();
    var summoner = event.currentTarget.previousSibling.value,
        position = event.currentTarget.previousSibling.dataset.position;
    console.log(`${summoner}, position ${position} a été ajouté`);
    getRoles(summoner, position);
    event.currentTarget.style.display = "none";
    event.currentTarget.previousSibling.disabled = true;
    event.currentTarget.nextSibling.style.display = "inline-block";
  },
  'click .remove-summoner': function (event) {
    event.preventDefault();
    var summoner = event.currentTarget.previousSibling.previousSibling.value,
        position = event.currentTarget.previousSibling.previousSibling.dataset.position;
    console.log(`${summoner}, position ${position} a été retiré`);
    removeRole(summoner, position);
    event.currentTarget.style.display = "none";
    event.currentTarget.previousSibling.previousSibling.disabled = false;
    event.currentTarget.previousSibling.previousSibling.value = "";
    event.currentTarget.previousSibling.style.display = "inline-block";
  },
  'submit .select-team-region': function (event) {
    event.preventDefault();
    Session.set('team-region', event.currentTarget.teamRegion.value);
    $('.step-1').slideUp("slow");
    $('.step-2').fadeIn("slow");
  }
});

Template.teamAdviser.helpers({
  summoners: function () {
    let summonerArray = [];
    // Need to avoid conflict lanes in this helper
    lockedRoles = {"Top": 0, "Jungler": 0, "Mid": 0, "ADC": 0, "Support": 0};
    for (let i = 1; i <= 5; i++) {
      let conflict = true;
      if (Session.get(`summoner${i}`) !== undefined) {
        let currentSummoner = Session.get(`summoner${i}`);
        for (currentLane of currentSummoner) {
          if (lockedRoles[currentLane[0]] === 0) {
            lockedRoles[currentLane[0]] = 1;
            conflict = false;
            summonerArray.push([Session.get(`summoner${i}-name`), currentLane]);
            break;
          }
        }
        console.log(conflict);
        if (conflict) {
          console.log("ON A UN CONFLIT");
          summonerArray.push([Session.get(`summoner${i}-name`), Session.get(`summoner${i}`)]);
        }
      }
    }
    return summonerArray;
  },
  summonerName: function () {
    return this[0];
  },
  summonerRole: function () {
    return this[1][0];
  },
  summonerChampionImage: function () {
    return this[1][1][0].image;
  },
  summonerChampion: function () {
    return this[1][1][0].name;
  }
});

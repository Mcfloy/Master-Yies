Template.teamAdviser.onRendered(function () {
  // Hide Katarina
  $('.loading').css('display', 'none');
  var roles = [];
  // Function that will add a role and the two best champions.
  // Why two ? Because of the ban system.
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
    lockedRoles = {"Top": 0, "Jungler": 0, "Mid": 0, "ADC": 0, "Support": 0};
  };
  // This function is similar to the "smar_role" helper from summoner.js
  getRoles = function (summoner, position) {
    // We clear the array that works like a cache
    roles = [];
    let region = Session.get('team-region');
    Meteor.call('summonerChampionsMasteries', summoner, region, function (error, result) {
      if (error) {
        $('.error-team').text(error.reason);
        $('.error-team').fadeIn();
      } else {
        // Once done, a deeper version of the algorithm will get a lot of roles per summoner
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
        array = dataGlobal.sort(function (a, b) {
          return a[1] < b[1];
        });

        // Sorting the ouput variable
        array.sort(function (a, b) {
          return a[1] < b[1];
        });
        // The algorithm that give lane (pretty boring to read)
        // I advice you to understand at first the summoner's algorithm, more readable.
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
        // We add the array to a Session variable (unique per summoner) and increment the number of summoners in the team
        Session.set(`summoner${position}`, roles);
        let counter = Session.get('team-length');
        Session.set('team-length', counter + 1);
      }
    });
  };
  // We need to remove a summoner
  // Note: Because of Meteor Reactivity, when you remove a role, you should see a different output of the algorithm.
  // The algorithm can ignore a empty input, but the priority is from top to bottom (Understand that the last one will have the last lane)
  removeRole = function (summoner, position) {
    Session.set(`summoner${position}-id`, undefined);
    Session.set(`summoner${position}-name`, undefined);
    Session.set(`summoner${position}`, undefined);
    let counter = Session.get('team-length');
    Session.set('team-length', counter - 1);
  };

});

Template.teamAdviser.events({
  'click .add-summoner': function (event) {
    event.preventDefault();
    let summoner = event.currentTarget.previousSibling.value,
        position = event.currentTarget.previousSibling.dataset.position,
        region = Session.get('team-region');
    $('.error-team').text('');
    $('.error-team').fadeOut();
    if (summoner.length !== 0) {
      // Firstly, we just have a summoner name, so we have to check if it exists
      let isInList = false;
      for (let i = 1; i < 6; i++) {
        let summonerName = Session.get(`summoner${i}-name`);
        if (summonerName !== undefined && summonerName.toLowerCase() === summoner.toLowerCase()) {
          isInList = true;
          break;
        }
      }
      if (isInList === false) {
        Meteor.call('searchSummoner', summoner, region, function (error, result) {
          if (error) {
            $('.error-team').text(error.reason);
            $('.error-team').fadeIn();
          } else {
            $('.error-team').text('');
            $('.error-team').fadeOut();
            event.currentTarget.style.display = "none";
            event.currentTarget.previousSibling.setAttribute("class", "locked");
            event.currentTarget.previousSibling.disabled = true;
            event.currentTarget.nextSibling.style.display = "inline-block";
            let summoner = result[Object.keys(result)[0]];
            Session.set(`summoner${position}-name`, summoner.name);
            getRoles(summoner.id, position);
            if (position < 5) {
              position++;
              let nextInput = $(`.manage-summoners input[data-position=${ position }]`);
              if (nextInput.val().length === 0) {
                nextInput.attr('disabled', false);
                nextInput.next().attr('disabled', false);
                nextInput.focus();
              }
            }
          }
        });
      } else {
        $('.error-team').text("You already added this summoner");
        $('.error-team').fadeIn();
      }
    }
  },
  'click .remove-summoner': function (event) {
    event.preventDefault();
    let summoner = event.currentTarget.previousSibling.previousSibling.value,
        position = event.currentTarget.previousSibling.previousSibling.dataset.position;
    removeRole(summoner, position);
    event.currentTarget.style.display = "none";
    event.currentTarget.previousSibling.previousSibling.disabled = false;
    event.currentTarget.previousSibling.previousSibling.removeAttribute('class');
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
  // This function will show lanes per summoner
  summoners: function () {
    summonerArray = [];
    // Need to avoid conflict lanes in this helper
    lockedRoles = {"Top": 0, "Jungler": 0, "Mid": 0, "ADC": 0, "Support": 0};
    for (let i = 1; i <= 5; i++) {
      let conflict = true;
      if (Session.get(`summoner${i}`) !== undefined) {
        let currentSummoner = Session.get(`summoner${i}`);
        for (currentLane of currentSummoner) {
          if (lockedRoles[currentLane[0]] === 0) {
            // We found a free lane, and the summoner can play on it
            lockedRoles[currentLane[0]] = 1;
            conflict = false;
            // So we add it to the array
            summonerArray.push([Session.get(`summoner${i}-name`), i, currentLane]);
            break;
          }
        }
        // Unfortunately, it's the last one that have high chance to create conflict, because it don't know the last freed lane.
        // I don't handle this, but for now, it's recommanded to change the summoner's position to have a correct lane.
        // I may make the last one the top one and make everybody moves, but it can create a loop. Which is worst.
        if (conflict) {
          let tempSummoner = Session.get(`summoner${i}`),
              tempSummonerName = Session.get(`summoner${i}-name`);
          Session.set('summoner0', tempSummoner);
          Session.set('summoner0-name', tempSummonerName);
          for (let k = i - 1; k >= 0; k--) {
            tempSummoner = Session.get(`summoner${k}`),
            tempSummonerName = Session.get(`summoner${k}-name`);

            Session.set(`summoner${k + 1}`, tempSummoner);
            Session.set(`summoner${k + 1}-name`, tempSummonerName);

          }
          $('.error-team').text('Conflict detected, summoner changed position');
          $('.error-team').fadeIn();
          summonerArray.push([Session.get(`summoner${i}-name`), Session.get(`summoner${i}`)]);
        }
      }
    }
    return summonerArray;
  },
  // Return the summoner's name
  summonerName: function () {
    return this[0];
  },
  // Return the summoner's role
  summonerRole: function () {
    return Session.get(`summoner${this[1]}`);
  },
  // Return the first role of the summoner
  role: function () {
    return this[2][0];
  },
  // Return champions of the summoner's first role
  summonerChampions: function () {
    return this[2][1];
  },
  // Return the path of the champion's image
  summonerChampionImage: function () {
    return this.image;
  },
  // Return champion's name
  summonerChampion: function () {
    return this.name;
  }
});

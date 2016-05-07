import { ReactiveVar } from 'meteor/reactive-var'

Template.summoner.onCreated(function () {
  // Reactive Variables (accessible only in the summoner template)
  this.arrayChamp = new ReactiveVar([]);
  this.arrayGlobalPercentages = new ReactiveVar([
    {"name": "Assassin", "percentage_global": 0},
    {"name": "Fighter", "percentage_global": 0},
    {"name": "Mage", "percentage_global": 0},
    {"name": "Support", "percentage_global": 0},
    {"name": "Tank", "percentage_global": 0},
    {"name": "Marksman", "percentage_global": 0}
  ]);
  this.arrayEffectiveness = new ReactiveVar([
    {"name": "Assassin", "effectiveness": 0},
    {"name": "Fighter", "effectiveness": 0},
    {"name": "Mage", "effectiveness": 0},
    {"name": "Support", "effectiveness": 0},
    {"name": "Tank", "effectiveness": 0},
    {"name": "Marksman", "effectiveness": 0}
  ]);
  this.tags = new ReactiveVar([
    {"name": "Assassin", "points": 0, "champions": 0},
    {"name": "Fighter", "points": 0, "champions": 0},
    {"name": "Mage", "points": 0, "champions": 0},
    {"name": "Support", "points": 0, "champions": 0},
    {"name": "Tank", "points": 0, "champions": 0},
    {"name": "Marksman", "points": 0, "champions": 0}
  ]);
  // Autorun function for showing charts
  this.autorun(function () {
    if (Session.get('data-ready')) {
      // We initialize local variables to the charts
      let dataChampPoints = [],
          dataChampNb = [],
          dataChampGlobal = [],
          colors = [
            {color: "#c0392b", highlight: "#e74c3c"},
            {color: "#d35400", highlight: "#e67e22"},
            {color: "#27ae60", highlight: "#2ecc71"},
            {color: "#2980b9", highlight: "#3498db"},
            {color: "#d5c295", highlight: "#f0deb4"},
            {color: "#ffa800", highlight: "#ffcd02"}],
          total_points = 0,
          total_champions = 0,
          tags = Template.instance().tags.get();
      // We sum up the "total" variables
      for (let i in tags) {
        total_points += tags[i].points;
        total_champions += tags[i].champions;
      }
      // And now we have them we can put percentage datas into arrays
      for (let i in tags) {
        dataChampPoints.push(
          {
            value: tags[i].points,
            color: colors[i].color,
            highlight: colors[i].highlight,
            label: tags[i].name
          });
        dataChampNb.push({
          value: tags[i].champions,
          color: colors[i].color,
          highlight: colors[i].highlight,
          label: tags[i].name
        });
        dataChampGlobal.push({
          value: Math.round(((tags[i].points / total_points) + (tags[i].champions / total_champions)) / 2 * 100),
          color: colors[i].color,
          highlight: colors[i].highlight,
          label: tags[i].name
        });
      }
      // Once the datas ready, we show them into charts
      let ctx = document.querySelector("#graph1").getContext("2d"),
          champChart = new Chart(ctx).Doughnut(dataChampPoints, {
            tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= Math.round((circumference / (Math.PI * 2)) * 100) %>%"
          });
      ctx = document.querySelector("#graph2").getContext("2d");
      champChart = new Chart(ctx).Doughnut(dataChampNb, {
        tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= Math.round((circumference / (Math.PI * 2)) * 100) %>%"
      });
      ctx = document.querySelector("#graph3").getContext("2d");
      champChart = new Chart(ctx).Doughnut(dataChampGlobal, {
        tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= Math.round((circumference / (Math.PI * 2)) * 100) %>%"
      });
      // As this function is really fast, it's done before the page is fully rendered to the user
      // So we put two instructions to hide the loading image and the analysis block
      $(".loading").css('display', 'none');
      $('.summoner-analysis').css('display', 'none');
    }
  });
});

Template.summoner.helpers({
  // Return the path of the champion's image.
  championImage: function () {
    return Champions.findOne({id: this.championId}) && Champions.findOne({id: this.championId}).image;
  },
  // Return the name of the champion
  championName: function () {
      return Champions.findOne({id: this.championId}) && Champions.findOne({id: this.championId}).name;
  },
  // Return the tags (roles) of the champion
  championTags: function () {
    // We make some operations
    if (Champions.findOne({id: this.championId})) {
      let champTag = Champions.findOne({id: this.championId}).tags,
          tags = Template.instance().tags.get();
      // For each champion's tags
      for (let j in champTag) {
        // We'll add the champion and the number of mastery points into the "tags" variable
        for (let i in tags) {
          if (tags[i].name === champTag[j]) {
            let tempArray = Template.instance().arrayChamp.get();
            if ($.inArray(this.championId, tempArray) === -1) {
              // We also add the mastery points to the total points, but we make sure to not add it twice
              let summonerTotalPoints = Session.get('summoner-total-points') + this.championPoints;
              tempArray.push(this.championId);
              Template.instance().arrayChamp.set(tempArray);
              Session.set('summoner-total-points', summonerTotalPoints);
            }
            tags[i].champions++;
            tags[i].points += this.championPoints;
          }
        }
      }
    }
    // After this, we return the champion's tag.
    return Champions.findOne({id: this.championId}) && Champions.findOne({id: this.championId}).tags;
  },
  // Return the effectiveness (percentage of points divided by the percentage of champion per roles);
  effectiveness: function () {
    let tempArray = Template.instance().arrayEffectiveness.get();
    if (tempArray) {
      for (let i in tempArray) {
        if (tempArray[i].name === this.name) {
          tempArray[i].effectiveness = parseFloat(((this.points / total_points) / (this.champions / total_champions)).toFixed(2));
        }
      }
      // Once the "tags" variable is full, we change the session variable (that is reactive) to display the charts
      if (this.name === "Marksman")
        Session.set('data-ready', true);
      return ((this.points / total_points) / (this.champions / total_champions)).toFixed(2);
    }
  },
  // Return true if we have at least one champion for a level or a tag
  enoughChampions: function () {
    // If we sort by levels
    if (Session.get('sort-by') === "levels") {
      let level = this.toString();
      // We filter the summoner's champions and return true if the number of champions that have a specific level is at least one
      return Session.get('summoner-champions').filter(function (node) {
        return node.championLevel == level;
      }).length > 0;
    }
    else {
      // If we sort by tags
      let tag = this;
      // We filter the summoner's champions, see if the tag asked is in it, and return true if there's at least one champion
      return Session.get('summoner-champions').filter(function (node) {
        let tempTags = Champions.findOne({id: node.championId}).tags;
        for (let j in tempTags) {
          if (tempTags[j] === tag.name) {
            return true;
          }
        }
        return false;
      }).length > 0;
    }
  },
  // Function that returns the array of levels that can have champions.
  levels: function () {
    return [5, 4, 3, 2, 1];
  },
  // Function that returns the percentage of champions per role
  percentage_champions: function () {
    let tags = Template.instance().tags.get();
    if (tags) {
      // This is a global variable (accessible in the others helpers)
      total_champions = 0;
      for (let i of tags) {
        total_champions += i.champions;
      }
      return ((this.champions / total_champions) * 100).toFixed(2);
    }
  },
  // Function that returns the percentage of mastery points per role
  percentage_points: function () {
    let tags = Template.instance().tags.get();
    if (tags) {
      // This is a global variable (accessible in the others helpers)
      total_points = 0;
      for (let i of tags) {
        total_points += i.points;
      }
      return ((this.points / total_points) * 100).toFixed(2);
    }
  },
  // Function that returns the average of the two previous percentages
  percentage_global: function () {
    let tempArray = Template.instance().arrayGlobalPercentages.get();
    if (tempArray) {
      for (let i of tempArray) {
        if (i.name === this.name) {
          // total_points and total_champions are not local variables, so there's no problem to access to them.
          // And because this function is called after percentage_points and percentage_champions, it's never undefined.
          i.percentage_global = parseFloat((((this.points / total_points) + (this.champions / total_champions)) / 2 * 100).toFixed(2));
        }
      }
      return (((this.points / total_points) + (this.champions / total_champions)) / 2 * 100).toFixed(2);
    }
  },
  // Function that returns the region parameter in the URL
  region: function () {
    return Router.current().params.region;
  },
  // The algorithm
  smart_role: function () {
    // We need to have all the datas to begin
    if (Session.get('data-ready')) {
      // Once it's ready, we initialize local variables and sort them
      let roles = [],
          tempArrayGlobalPercentages = Template.instance().arrayGlobalPercentages.get(),
          tempArrayEffectiveness = Template.instance().arrayEffectiveness.get();
      tempArrayGlobalPercentages.sort(function (a,b) { return a.percentage_global < b.percentage_global; });
      tempArrayEffectiveness.sort(function (a,b) { return a.effectiveness < b.effectiveness; });
      /*
      ** requirement is a variable to check if the summoner have a major lane or play on every lanes.
      ** Here's an example : If you always play as a support, you should have a lot of mastery points and/or champions with the "support" tag
      ** With this, it's easy to tell that you're a support
      ** But if you play every lane, or worst : If you play Jungler, the algorithm can't determine your best lane
      ** So we swap from global percentage to effectiveness, that will always tell you your lane (even if he's wrong, the algorithm need to tell your lane)
      ** Keep in mind the following advice : The more you play on every lanes, the more the algorithm will be bad.
      */
      let requirement = null;
      requirement = ((parseFloat(tempArrayGlobalPercentages[0].percentage_global) - parseFloat(tempArrayGlobalPercentages[5].percentage_global)) * 0.75);
      if (tempArrayGlobalPercentages.filter(function (a) { return a.percentage_global > requirement; }).length < 4)
        var array = tempArrayGlobalPercentages.filter(function (a) { return a.percentage_global > requirement; });
      else {
        requirement = ((parseFloat(tempArrayEffectiveness[0].effectiveness) - parseFloat(tempArrayEffectiveness[5].effectiveness)) * 0.75);
        var array = tempArrayEffectiveness.filter(function (a) { return a.effectiveness > requirement; });
      }
      // We filtered the data to get important roles, and put them into a variable.
      // Now we're ready to tell to the summoner which lane he knows well.

      /*
      ** Obviously the algorithm is not perfect, and some improvements are required
      ** But i don't think even Riot could improve the tags system as it is nowadays
      ** I found some combinations to determine a jungler or a top laner, but it's experimental
      */
      if (array[0].name === "Fighter")
          roles.push("Top laner");
      if (array[0].name === "Tank") {
        if (array[1] !== undefined) {
          if (array[1].name === "Mage")
            roles.push('Jungler');
          else if (array[1].name === "Fighter")
            roles.push('Jungler');
          else if (array[1].name === "Support")
            roles.push('Support');
          else if (array[1].name === "Marksman")
            roles.push('ADC');
        } else
          roles.push('Top laner');
      }
      // As Assassin is a very very very common role, we need to ensure that the third role is not too far from the two first.
      if (array[0].name === "Assassin") {
        if (array[1] !== undefined) {
          if (array[1].name === "Fighter") {
            if (array[2] !== undefined && (array[0].percentage_global - array[2].percentage_global < 10)) {
              if (array[2].name === "Mage")
                roles.push("Mid laner");
              else
                roles.push("Jungler");
            }
            else
              roles.push("Top laner");
          }
          else if (array[1].name === "Mage")
            roles.push("Mid laner");
          else if (array[1].name === "Marksman")
            roles.push("ADC");
        }
        else
          roles.push("Jungler");
      }
      // The other lanes below are easy to check
      if (array[0].name === "Mage") {
        if (array[1] !== undefined) {
          if (array[1].name === "Assassin")
            roles.push("Mid laner");
          else if (array[1].name === "Fighter")
            roles.push("Jungler");
          else if (array[1].name === "Support")
            roles.push("Support");
        } else
          roles.push("Mid laner");
      }
      if (array[0].name === "Marksman")
        roles.push("ADC");
      if (array[0].name === "Support")
        roles.push("Support");
      return roles;
    }
  },
  // Function that returns the sort variable.
  sortByLevel: function () {
    return Session.get('sort-by') === "levels";
  },
  // Function that returns summoner's champions by their levels or tags.
  summonerChampions: function () {
    if (Session.get('sort-by') === "levels") {
      let level = this.toString();
      return Session.get('summoner-champions').filter(function (node) {
        return node.championLevel == level;
      });
    }
    else {
      let tag = this;
      return Session.get('summoner-champions').filter(function (node) {
        let tempTags = Champions.findOne({id: node.championId}).tags;
          if (tempTags[0] === tag.name)
            return true;
        return false;
      });
    }
  },
  // Function that returns the summoner's name
  summonerName: function () {
    return Session.get('summoner-name');
  },
  // Function that returns the "tags" global variable
  tags: function () {
    return Template.instance().tags.get();
  },
  // Function that returns the total mastery points of a summoner
  totalPoints: function () {
    if (Session.get('summoner-total-points') > 1000000)
      return (Session.get('summoner-total-points') / 1000000).toFixed(1) + "M";
    else if (Session.get('summoner-total-points') > 1000)
      return (Session.get('summoner-total-points') / 1000).toFixed(1) + "K";
    else
      return Session.get('summoner-total-points');
  }
});

// I don't think it's very useful to tell you what those functions will do.
Template.summoner.events({
  'change #sort-by': function (event, template) {
    event.preventDefault();
    Session.set('sort-by', event.currentTarget.value);
    // We reset this variable, because if we don't it will add again the total points.
    Session.set('summoner-total-points', 0);
    Template.instance().arrayChamp.set([]);
  },
  'click #go-champions': function (event) {
    event.preventDefault();
    $(".summoner-champions").slideDown();
    $(".summoner-analysis").slideUp();
    $(".summoner-subheader .right").fadeIn();
  },
  'click #go-analysis': function(event) {
    event.preventDefault();
    $(".summoner-champions").slideUp();
    $(".summoner-analysis").slideDown();
    $(".summoner-subheader .right").fadeOut();
  }
});

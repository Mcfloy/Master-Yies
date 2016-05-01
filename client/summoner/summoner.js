tags = [
  {"name": "Assassin", "points": 0, "champions": 0},
  {"name": "Fighter", "points": 0, "champions": 0},
  {"name": "Mage", "points": 0, "champions": 0},
  {"name": "Support", "points": 0, "champions": 0},
  {"name": "Tank", "points": 0, "champions": 0},
  {"name": "Marksman", "points": 0, "champions": 0}
];
k = 0;
summonerTotalPoints = 0;
arrayChamp = [],
arrayGlobalPercentages = [
  {"name": "Assassin", "percentage_global": 0},
  {"name": "Fighter", "percentage_global": 0},
  {"name": "Mage", "percentage_global": 0},
  {"name": "Support", "percentage_global": 0},
  {"name": "Tank", "percentage_global": 0},
  {"name": "Marksman", "percentage_global": 0}
],
arrayEffectiveness = [
  {"name": "Assassin", "effectiveness": 0},
  {"name": "Fighter", "effectiveness": 0},
  {"name": "Mage", "effectiveness": 0},
  {"name": "Support", "effectiveness": 0},
  {"name": "Tank", "effectiveness": 0},
  {"name": "Marksman", "effectiveness": 0}
];

Tracker.autorun(function () {
  if (Session.get('graph')) {
    var dataChampPoints = [],
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
        total_champions = 0;
    for (var i in tags) {
      total_points += tags[i].points;
      total_champions += tags[i].champions;
    }
    for (var i in tags) {
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
    var ctx = document.querySelector("#graph1").getContext("2d"),
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
    $(".loading").css('display', 'none');
    $('.summoner-analysis').css('display', 'none');
  }
});

Template.summoner.helpers({
  summonerName: function () {
    return Session.get('summoner-name');
  },
  summonerChampions: function () {
    if (Session.get('sort-by') === "levels") {
      var level = this.toString();
      return Session.get('summoner-champions').filter(function (node) {
        return node.championLevel == level;
      });
    }
    else {
      var tag = this;
      return Session.get('summoner-champions').filter(function (node) {
        var tempTags = Champions.findOne({id: node.championId}).tags;
          if (tempTags[0] === tag.name)
            return true;
        return false;
      });
    }
  },
  sortByLevel: function () {
    return Session.get('sort-by') === "levels";
  },
  enoughChampions: function (sortBy) {
    if (Session.get('sort-by') === "levels") {
      var level = this.toString();
      return Session.get('summoner-champions').filter(function (node) {
        return node.championLevel == level;
      }).length > 0;
    }
    else {
      var tag = this;
      return Session.get('summoner-champions').filter(function (node) {
        var tempTags = Champions.findOne({id: node.championId}).tags;
        for (var k in tempTags) {
          if (tempTags[k] === tag.name) {
            return true;
          }
        }
        return false;
      }).length > 0;
    }
  },
  levels: function () {
    return [5, 4, 3, 2, 1];
  },
  tags: function () {
    return ["Tank", "Assassin", "Fighter", "Mage", "Marksman", "Support"];
  },
  totalPoints: function () {
    if (Session.get('summoner-total-points') > 1000000)
      return (Session.get('summoner-total-points') / 1000000).toFixed(1) + "M";
    else if (Session.get('summoner-total-points') > 1000)
      return (Session.get('summoner-total-points') / 1000).toFixed(1) + "K";
    else
      return Session.get('summoner-total-points');
  },
  region: function () {
    return Router.current().params.region;
  },
  championName: function () {
      return Champions.findOne({id: this.championId}) && Champions.findOne({id: this.championId}).name;
  },
  championImage: function () {
    return Champions.findOne({id: this.championId}) && Champions.findOne({id: this.championId}).image;
  },
  championTags: function () {
    // We make somes operations
    if (Champions.findOne({id: this.championId})) {
      var champTag = Champions.findOne({id: this.championId}).tags;
      for (var k in champTag) {
        for (var i in tags) {
          if (tags[i].name === champTag[k]) {
            if ($.inArray(this.championId, arrayChamp) === -1) {
              summonerTotalPoints += this.championPoints;
              arrayChamp.push(this.championId);
              Session.set('summoner-total-points', summonerTotalPoints);
            }
            tags[i].champions++;
            tags[i].points += this.championPoints;
          }
        }
      }
    }
    return Champions.findOne({id: this.championId}) && Champions.findOne({id: this.championId}).tags;
  },
  tags: function () {
    return tags;
  },
  percentage_points: function () {
    if (tags) {
      total_points = 0;
      for (var i of tags) {
        total_points += i.points;
      }
      k++;
      if (k === tags.length)
        Session.set('graph', true);
      return ((this.points / total_points) * 100).toFixed(2);
    }
  },
  percentage_champions: function () {
    if (tags) {
      total_champions = 0;
      for (var i of tags) {
        total_champions += i.champions;
      }
      return ((this.champions / total_champions) * 100).toFixed(2);
    }
  },
  percentage_global: function () {
    if (arrayGlobalPercentages) {
      for (var i of arrayGlobalPercentages) {
        if (i.name === this.name) {
          i.percentage_global = parseFloat((((this.points / total_points) + (this.champions / total_champions)) / 2 * 100).toFixed(2));
        }
      }
      return (((this.points / total_points) + (this.champions / total_champions)) / 2 * 100).toFixed(2);
    }
  },
  effectiveness: function () {
    if (arrayEffectiveness) {
      for (var i in arrayEffectiveness) {
        if (arrayEffectiveness[i].name === this.name) {
          arrayEffectiveness[i].effectiveness = parseFloat(((this.points / total_points) / (this.champions / total_champions)).toFixed(2));
        }
      }
      if (this.name === "Marksman")
        Session.set('smart-role-ready', true);
      return ((this.points / total_points) / (this.champions / total_champions)).toFixed(2);
    }
  },
  smart_role: function () {
    if (Session.get('smart-role-ready') == true) {
      var roles = [];
      arrayGlobalPercentages.sort(function (a,b) { return a.percentage_global < b.percentage_global; });
      arrayEffectiveness.sort(function (a,b) { return a.effectiveness < b.effectiveness; });
      var requirement = null;
      requirement = ((parseFloat(arrayGlobalPercentages[0].percentage_global) - parseFloat(arrayGlobalPercentages[5].percentage_global)) * 0.75);
      if (arrayGlobalPercentages.filter(function (a) { return a.percentage_global > requirement; }).length < 4)
        var array = arrayGlobalPercentages.filter(function (a) { return a.percentage_global > requirement; });
      else {
        requirement = ((parseFloat(arrayEffectiveness[0].effectiveness) - parseFloat(arrayEffectiveness[5].effectiveness)) * 0.75);
        var array = arrayEffectiveness.filter(function (a) { return a.effectiveness > requirement; });
      }
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
  }
});

Template.summoner.events({
  'change #sort-by': function (event) {
    event.preventDefault();
    Session.set('sort-by', event.currentTarget.value);
    summonerTotalPoints = 0;
    arrayChamp = [];
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

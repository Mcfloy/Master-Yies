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
      for (let i in tags) {
        total_points += tags[i].points;
        total_champions += tags[i].champions;
      }
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
      $(".loading").css('display', 'none');
      $('.summoner-analysis').css('display', 'none');
    }
  });
});

Template.summoner.helpers({
  championImage: function () {
    return Champions.findOne({id: this.championId}) && Champions.findOne({id: this.championId}).image;
  },
  championName: function () {
      return Champions.findOne({id: this.championId}) && Champions.findOne({id: this.championId}).name;
  },
  championTags: function () {
    // We make somes operations
    if (Champions.findOne({id: this.championId})) {
      let champTag = Champions.findOne({id: this.championId}).tags,
          tags = Template.instance().tags.get();
      for (let j in champTag) {
        for (let i in tags) {
          if (tags[i].name === champTag[j]) {
            let tempArray = Template.instance().arrayChamp.get();
            if ($.inArray(this.championId, tempArray) === -1) {
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
    return Champions.findOne({id: this.championId}) && Champions.findOne({id: this.championId}).tags;
  },
  effectiveness: function () {
    let tempArray = Template.instance().arrayEffectiveness.get();
    if (tempArray) {
      for (let i in tempArray) {
        if (tempArray[i].name === this.name) {
          tempArray[i].effectiveness = parseFloat(((this.points / total_points) / (this.champions / total_champions)).toFixed(2));
        }
      }
      if (this.name === "Marksman")
        Session.set('data-ready', true);
      return ((this.points / total_points) / (this.champions / total_champions)).toFixed(2);
    }
  },
  enoughChampions: function (sortBy) {
    if (Session.get('sort-by') === "levels") {
      let level = this.toString();
      return Session.get('summoner-champions').filter(function (node) {
        return node.championLevel == level;
      }).length > 0;
    }
    else {
      let tag = this;
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
  levels: function () {
    return [5, 4, 3, 2, 1];
  },
  percentage_champions: function () {
    let tags = Template.instance().tags.get();
    if (tags) {
      total_champions = 0;
      for (let i of tags) {
        total_champions += i.champions;
      }
      return ((this.champions / total_champions) * 100).toFixed(2);
    }
  },
  percentage_points: function () {
    let tags = Template.instance().tags.get();
    if (tags) {
      total_points = 0;
      for (let i of tags) {
        total_points += i.points;
      }
      return ((this.points / total_points) * 100).toFixed(2);
    }
  },
  percentage_global: function () {
    let tempArray = Template.instance().arrayGlobalPercentages.get();
    if (tempArray) {
      for (let i of tempArray) {
        if (i.name === this.name) {
          i.percentage_global = parseFloat((((this.points / total_points) + (this.champions / total_champions)) / 2 * 100).toFixed(2));
        }
      }
      return (((this.points / total_points) + (this.champions / total_champions)) / 2 * 100).toFixed(2);
    }
  },
  region: function () {
    return Router.current().params.region;
  },
  smart_role: function () {
    if (Session.get('data-ready')) {
      let roles = [],
          tempArrayGlobalPercentages = Template.instance().arrayGlobalPercentages.get(),
          tempArrayEffectiveness = Template.instance().arrayEffectiveness.get();
      tempArrayGlobalPercentages.sort(function (a,b) { return a.percentage_global < b.percentage_global; });
      tempArrayEffectiveness.sort(function (a,b) { return a.effectiveness < b.effectiveness; });
      let requirement = null;
      requirement = ((parseFloat(tempArrayGlobalPercentages[0].percentage_global) - parseFloat(tempArrayGlobalPercentages[5].percentage_global)) * 0.75);
      if (tempArrayGlobalPercentages.filter(function (a) { return a.percentage_global > requirement; }).length < 4)
        var array = tempArrayGlobalPercentages.filter(function (a) { return a.percentage_global > requirement; });
      else {
        requirement = ((parseFloat(tempArrayEffectiveness[0].effectiveness) - parseFloat(tempArrayEffectiveness[5].effectiveness)) * 0.75);
        var array = tempArrayEffectiveness.filter(function (a) { return a.effectiveness > requirement; });
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
  },
  sortByLevel: function () {
    return Session.get('sort-by') === "levels";
  },
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
  summonerName: function () {
    return Session.get('summoner-name');
  },
  tags: function () {
    return Template.instance().tags.get();
  },
  totalPoints: function () {
    if (Session.get('summoner-total-points') > 1000000)
      return (Session.get('summoner-total-points') / 1000000).toFixed(1) + "M";
    else if (Session.get('summoner-total-points') > 1000)
      return (Session.get('summoner-total-points') / 1000).toFixed(1) + "K";
    else
      return Session.get('summoner-total-points');
  }
});

Template.summoner.events({
  'change #sort-by': function (event, template) {
    event.preventDefault();
    Session.set('sort-by', event.currentTarget.value);
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

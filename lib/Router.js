// Iron-router will render the mainTemplate, for any page
Router.configure({
  layoutTemplate: 'mainTemplate'
});

Router.route('/:region/summoner/:id', {
  name: 'summoner',
  onBeforeAction: function () {
    // We call two methods to get informations about the summoner (his name and his champions)
    Meteor.call('summonerChampionsMasteries', this.params.id, this.params.region, function (error, result) {
      Session.set('summoner-champions', result);
    });
    Meteor.call('summonerProfile', this.params.id, this.params.region, function (error, result) {
      if (error) {
        Router.go('/');
      } else {
        Session.set('summoner-name', result.name);
        document.title = result.name + " - Master Yies";
      }
    });
    // We initiate Session Levels for the rendering process
    Session.set('data-ready', false);
    Session.set('sort-by', "levels");
    Session.set('summoner-total-points', 0);
    this.next();
  },
  action: function () {
    $('.select-region').val(this.params.region);
    this.render('summoner');
  },
  waitOn: function () {
    // We need the champions DB.
    return Meteor.subscribe('champions');
  }
});

Router.route('/team-adviser', {
  name: 'teamAdviser',
  onBeforeAction: function () {
    document.title = "Team Adviser - Master Yies";
    this.next();
  },
  action: function () {
    // Initialization of Session variables
    Session.set('team-region', undefined);
    Session.set('team-error', undefined);
    Session.set('team-length', 0);
    for (let i = 0; i <= 5; i++) {
      Session.set(`summoner${i}`, undefined);
      Session.set(`summoner${i}-name`, undefined);
    }
    this.render('teamAdviser');
  },
  waitOn: function () {
    return Meteor.subscribe('champions');
  }
});

Router.route('/', {
  name: 'home',
  onBeforeAction: function () {
    document.title = "Master Yies";
    this.next();
  },
  action: function () {
    this.render('home');
  }
});

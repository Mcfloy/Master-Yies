Router.configure({
  layoutTemplate: 'mainTemplate'
});

Router.route('/:region/summoner/:id', {
  name: 'summoner',
  onBeforeAction: function () {
    try {
      Meteor.call('summonerChampionsMasteries', this.params.id, this.params.region, function (error, result) {
        Session.set('summoner-champions', result);
      });
      Meteor.call('summonerProfile', this.params.id, this.params.region, function (error, result) {
        if (error) {
          Router.go('/');
        } else {
          Session.set('summoner-profile', result);
          Session.set('summoner-name', result.name);
          document.title = result.name + " - Master Yies";
        }
      });
    }
    catch (e) {
      console.log(e.reason);
    }
    Session.set('graph', false);
    Session.set('sort-by', "levels");
    Session.set('smart-role-ready', false);
    this.next();
  },
  action: function () {
    $('.select-region').val(this.params.region);
    this.render('summoner');
  },
  waitOn: function () {
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
      Session.set('error-search', undefined);
      Session.set('team-region', undefined);
      Session.set('team-length', 0);
      Session.set('summoner1', undefined);
      Session.set('summoner2', undefined);
      Session.set('summoner3', undefined);
      Session.set('summoner4', undefined);
      Session.set('summoner5', undefined);
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
    Session.set('error-search', undefined);
    this.render('home');
  }
});

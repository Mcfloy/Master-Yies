Template.mainTemplate.helpers({
  errorSearch: function () {
    return Session.get('error-search');
  }
});

Template.mainTemplate.events({
  'submit .search-summoner': function (event) {
    event.preventDefault();
    let summoner = event.currentTarget.summoner.value,
        region = event.currentTarget.region.value;
    event.currentTarget.summoner.disabled = true;
    event.currentTarget.region.disabled = true;
    event.currentTarget.submit.disabled = true;
    event.currentTarget.submit.value = "Searching";
    $('.error').fadeOut();
    Meteor.call('searchSummoner', summoner, region, function (error, result) {
      if (error) {
        event.currentTarget.summoner.disabled = false;
        event.currentTarget.region.disabled = false;
        event.currentTarget.submit.disabled = false;
        event.currentTarget.submit.value = "🔎";
        $('.error').text(error.reason);
        $('.error').fadeIn();
      } else {
        location.href = `/${region}/summoner/${result[Object.keys(result)[0]].id}`;
      }
    });
  },
  'change .region': function (event) {
    event.preventDefault();
    Session.set('region', event.currentTarget.value);
  }
});

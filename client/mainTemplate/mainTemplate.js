Template.mainTemplate.events({
  'submit .search-summoner': function (event) {
    event.preventDefault();
    // Storing value into local variables
    let summoner = event.currentTarget.summoner.value,
        region = event.currentTarget.region.value;
    // Blocking the form to prevent spam
    event.currentTarget.summoner.disabled = true;
    event.currentTarget.region.disabled = true;
    event.currentTarget.submit.disabled = true;
    event.currentTarget.submit.value = "Searching";
    $('.error').fadeOut();
    // Calling the search method
    Meteor.call('searchSummoner', summoner, region, function (error, result) {
      if (error) {
        // There's an error, we display it and allow the user to reuse the form
        event.currentTarget.summoner.disabled = false;
        event.currentTarget.region.disabled = false;
        event.currentTarget.submit.disabled = false;
        event.currentTarget.submit.value = "🔎";
        $('.error').text(error.reason);
        $('.error').fadeIn();
      } else {
        // We've found something, we change page.
        location.href = `/${region}/summoner/${result[Object.keys(result)[0]].id}`;
      }
    });
  }
});

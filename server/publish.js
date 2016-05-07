/*
** Called when the client use Meteor.subscribe('champions')
** Return the Champions data of the DB
*/
Meteor.publish('champions', function () {
  return Champions.find({});
});

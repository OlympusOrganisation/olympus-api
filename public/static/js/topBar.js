$(function() {
  const signInBtn = $("#signInBtn");
  const signedIn = $("#signedIn");
  const userData = {
    AccountType: $(".userData-accountType"),
    DisplayName: $(".userData-displayName"),
    Email: $(".userData-email"),
    PhotoURL: $(".userData-photoURL")
  }
  const iconContainer = $(".iconContainer");
  iconContainer.show();
  
  const providers = {
    'google.com': 'Google Account',
    'facebook.com': 'Facebook Account',
  }
  
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      console.log("USer", user);
      userData.DisplayName.html(user.displayName);
      userData.Email.html(user.email);
      userData.AccountType.html(providers[user.providerData[0].providerId]);
      userData.PhotoURL.attr("src", user.photoURL);
      signInBtn.fadeOut();
      signedIn.fadeIn();
    } else {
      signInBtn.fadeIn();
      signedIn.fadeOut();
    }
  });
})
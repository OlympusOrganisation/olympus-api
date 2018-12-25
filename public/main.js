'use strict';

function Demo() {
  document.addEventListener('DOMContentLoaded', function() {
    this.state = {
      loggedIn: false
    }
    this.signInButton = document.getElementById('demo-sign-in-button');
    this.signOutButton = document.getElementById('demo-sign-out-button');
    this.responseContainer = document.getElementById('demo-response');
    this.responseContainerCookie = document.getElementById('demo-response-cookie');
    this.urlContainer = document.getElementById('demo-url');
    this.urlContainerCookie = document.getElementById('demo-url-cookie');
    this.helloUserUrl = window.location.href + 'hello';
    this.signedOutCard = document.getElementById('demo-signed-out-card');
    this.signedInCard = document.getElementById('demo-signed-in-card');
    this.startUsingButton = document.getElementById('start-using-button');
    
    this.addADeviceButton = document.getElementById('add-a-device-button');
    this.captionsContainer = document.getElementById('captions-container');
    
    this.signInButton.addEventListener('click', this.signIn.bind(this));
    this.signOutButton.addEventListener('click', this.signOut.bind(this));
    this.startUsingButton.addEventListener('click', this.startUsing.bind(this));
    
    this.addADeviceButton.addEventListener('click', this.addADevice.bind(this));
    firebase.auth().onAuthStateChanged(this.onAuthStateChanged.bind(this));
    this.captionsContainer.innerHTML = "";
    
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new webkitSpeechRecognition();
      this.recognition.continuous = true;

      this.recognition.onstart = function() {  }
      this.recognition.onresult = function(event) {
        const caption = event.results[event.results.length - 1][0].transcript;
        console.log(caption);
        
        var span = document.createElement("span");
        span.classList.add("caption")
        var node = document.createTextNode(caption);
        span.appendChild(node);
        document.getElementById('captions-container').appendChild(span);
      }
      this.recognition.onerror = function(event) {  }
      this.recognition.onend = function() {
        this.start();
      }
      if(!Resonance.isCompatible()) {
        console.error('Your browser is not supported for Resonance');
      }
      this.resonance = new Resonance('e44f03ce-7383-4a74-9b99-17bdf80bc5bf');
    } else {
      alert("Not compatable");
    }
    
  }.bind(this));
}

Demo.prototype.getRequest = function(str) {
  firebase.auth().currentUser.getIdToken().then(function(token) {
    var req = new XMLHttpRequest();
    req.onload = function() {
      console.log(req.responseText);
    }.bind(this);
    req.onerror = function(err) {
      console.log(err);
    }.bind(this);
    req.open('GET', "https://us-central1-olympus-organisation-api.cloudfunctions.net/api/fetchIntent?q="+str, true);
    req.setRequestHeader('Authorization', 'Bearer ' + token);
    req.send();
  }.bind(this));
};

Demo.prototype.resonanceAsyncInit = function() {
  this.resonance.on('nearbyFound', function(nearby) {
    console.log(nearby.payload);
  });

  this.resonance.on('searchStopped', function(error) {
    if(error) {
      console.error(error.message);
    } else {
      // search was stopped normally
    }
  });
};

Demo.prototype.resonanceStart = function() {
  this.resonance.startSearch('Some useful data to broadcast', function(error) {
    if(error) {
      console.error(error.message);
    } else {
      // search started
    }
  });
}

Demo.prototype.resonanceStop = function() {
  this.resonance.stopSearch()
}

// Triggered on Firebase auth state change.
Demo.prototype.onAuthStateChanged = function(user) {
  console.log(user);
  if (user) {
    this.state.loggedIn = true;
    this.startUsingButton.style.display = 'block';
    document.getElementById("displayUserName").textContent = ", " + user.displayName;
    this.signedOutCard.style.display = 'none';
    this.signedInCard.style.display = 'flex';
    this.captionsContainer.style.display = 'none';
    this.startFunctionsRequest();
    this.startFunctionsCookieRequest();
  } else {
    this.state.loggedIn = false;
    this.startUsingButton.style.display = 'none';
    this.signedOutCard.style.display = 'flex';
    this.signedInCard.style.display = 'none';
    this.captionsContainer.style.display = 'none';
  }
};

Demo.prototype.startUsing = function() {
  if (this.state.loggedIn) {
    this.signedOutCard.style.display = 'none';
    this.signedInCard.style.display = 'none';
    this.captionsContainer.style.display = 'block';
    this.recognition.start();
  }
};

Demo.prototype.addADevice = function() {
  if (this.state.loggedIn) {
    this.signedOutCard.style.display = 'none';
    this.signedInCard.style.display = 'flex';
    this.captionsContainer.style.display = 'none';
    this.recognition.start();
  }
};

// Initiates the sign-in flow using GoogleAuthProvider sign in in a popup.
Demo.prototype.signIn = function() {
  firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
};

// Signs-out of Firebase.
Demo.prototype.signOut = function() {
  firebase.auth().signOut();
  // clear the __session cookie
  document.cookie = '__session=';
};

// Does an authenticated request to a Firebase Functions endpoint using an Authorization header.
Demo.prototype.startFunctionsRequest = function() {
  firebase.auth().currentUser.getIdToken().then(function(token) {
    console.log('Sending request to', this.helloUserUrl, 'with ID token in Authorization header.');
    var req = new XMLHttpRequest();
    req.onload = function() {
      this.responseContainer.innerText = req.responseText;
    }.bind(this);
    req.onerror = function() {
      this.responseContainer.innerText = 'There was an error';
    }.bind(this);
    req.open('GET', this.helloUserUrl, true);
    req.setRequestHeader('Authorization', 'Bearer ' + token);
    req.send();
  }.bind(this));
};

// Does an authenticated request to a Firebase Functions endpoint using a __session cookie.
Demo.prototype.startFunctionsCookieRequest = function() {
  // Set the __session cookie.
  firebase.auth().currentUser.getIdToken(true).then(function(token) {
    // set the __session cookie
    document.cookie = '__session=' + token + ';max-age=3600';

    console.log('Sending request to', this.helloUserUrl, 'with ID token in __session cookie.');
    var req = new XMLHttpRequest();
    req.onload = function() {
      this.responseContainerCookie.innerText = req.responseText;
    }.bind(this);
    req.onerror = function() {
      this.responseContainerCookie.innerText = 'There was an error';
    }.bind(this);
    req.open('GET', this.helloUserUrl, true);
    req.send();
  }.bind(this));
};

// Load the demo.
window.demo = new Demo();
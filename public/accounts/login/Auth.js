class auth {
  constructor() {
    
  }

  createSession(token) {
    return fetch('https://accounts.olympusorg.com/oauth/createSession', {
      method: 'post',
      body: JSON.stringify({idToken: token})
    })
    .then((data) => {
      console.log('Request succeeded with JSON response', data);
    })
    .catch((error) => {
      console.log('Request failed', error);
    });
  }

  checkAuth() {
    return fetch('https://accounts.olympusorg.com/oauth/checkAuthStatus', {
      method: 'post'
    })
      .then((response) => {
        if (response.status !== 200) throw "Failed";
        return response.json();
      });
  }

  async isSignedIn() {
    let users = await this.checkAuth();
    return users.valid;
  }

  logout() {
    return fetch('https://accounts.olympusorg.com/oauth/signout', {
      method: 'post'
    });
  }
}

const Auth = new auth();
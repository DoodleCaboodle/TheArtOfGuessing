# The Art of Guessing API Documentation

## Managing Users API

### Create

- description: register an user
- request: `POST /signup/`
	- content-type: `application/json`
	- body: object
		- email: (string) the email of the user
		- password: (string) the password of the user
		- firstname: (string) first name of the user
		- lastname: (string) last name of the user
-	response: 200
	-	body: User _email_ signed up
-	response: 409
	-	body: email _email_ already exists
```
$ curl --request POST
	   --header 'Content-Type: application/json'
	   --data `{"email": "alice@gmail.com", "password": "alice", "firstname": "alice", "lastname": "wonderland"}'
	   http://localhost:3000/signup/
```
- description: sign-in the user with the given credentials
- request: `POST /signin/`
	- content-type: `application/json`
	- body: object
		- email: (string) the email of the user
		- password: (string) the password of the user
- response: 200
	- body: user _email_ signed in
- response: 401 
	- body: access denied
```
$ curl --request POST
       --header 'Content-Type: application/json'
       --data '{"username": "alice", "password": "alice"}'
       --cookie-jar cookie.txt
       http://localhost:3000/signin/
```
- description: sign-out the user
- request: `GET /signout/`
- response: 200
```
$ curl --request GET
       --cookie cookie.txt
       --cookie-jar cookie.txt
       http://localhost:3000/signout/
```

### Read

- description: retrieve the login page if not logged in. Otherwise redirect to home page
- request: `GET /login/`
- response: 200
	- content-type: `text/html`
```
$ curl --request GET
       --cookie cookie.txt
       http://localhost:3000/login/
```
- description: retrieve the profile page if logged in. Otherwise redirect to login page
- request: `GET /profile/`
- response: 200
	- content-type: `text/html`
```
$ curl --request GET
	   --cookie cookie.txt
	   http://localhost:3000/profile/
```
- description: retrieve the statistics for the given email
- request: `GET /stats/:email/`
- response: 200
	- content-type: `application/json`
	- body: object
		- email: (string) the email of the user
		- roundsWon: (int) the number of rounds won
		- roundsPlayed: (int) the number of rounds played
		- gamesWon: (int) the number of games won
		- gamesPlayed: (int) the number of games played
		- words: (object) words used during all games
- response: 404
	- body: stats corrupt
```
$ curl --request GET
	   --cookie cookie.txt
	   http://localhost:3000/stats/alice@gmail.com
```
- description: retrieve the first name of the user with the given email
- request `GET /firstname/:email/`
- response: 200
	- content-type: `application/json`
	- body: object
		- firstname: (string) first name of the user
```
$ curl --request GET
	   http://localhost:3000/firstname/alice@gmail.com
```
- description: redirect to the Facebook Login page
- request `GET /login/facebook/`
```
$ curl --request GET
	   http://localhost:3000/login/facebook/
```
- description: redirect accordingly based on whether the Facebook Login failed or succeeded
- request `GET /login/facebook/callback/`
```
$ curl --request GET
	   http://localhost:3000/login/facebook/callback/
```
- description: redirect to the Google Login page
- request `GET /login/google`
```
$ curl --request GET
	   http://localhost:3000/login/google/
```
- description: redirect accordingly based on whether the Google Login failed or succeeded
- request `GET /login/google/callback/`
```
$ curl --request GET
	   http://localhost:3000/login/google/callback/
```
- description: retrieve the email of the authenticated user
- request `GET /user/`
- response: 200
	- content-type: `application/json`
	- body: object
		- email: (string) email of the authenticated user
- response: 404
	- body: User not found!
```
$ curl --request GET
	   --cookie cookie.txt
	   http://localhost:3000/user/
```
- description: retrieve the last name of the authenticated user
- request `GET /lastname/`
- response: 200
	- content-type: `application/json`
	- body: object
		- lastname: (string) last name of the authenticated user
- response: 404
	- body: User not found!
```
$ curl --request GET
	   --cookie cookie.txt
	   http://localhost:3000/lastname/
```
- description: retrieve the first name of the authenticated user
- request `GET /firstname/`
- response: 200
	- content-type: `application/json`
	- body:object
		- firstname: (string) first name of the authenticated user
- response: 404
	- body: User not found!
```
$ curl --request get
	   --cookie cookie.txt
	   http://localhost:3000/firstname/
```
- description: retrieve the credits page
- request: `GET /credits/`
- response: 200
	- content-type: `text/html`
```
$ curl --request GET
	   http://localhost:3000/credits/
```

### Update

- description: update the information of the authenticated user
- request: `POST /user/`
	- content-type: `application/json`
	- body: object
		- email: (string) the new email, if any
		- pass: (string) the new password, if any
		- firstname: (string) the new first name, if any
		- lastname: (string) the new last name, if any
- response: 200
	- content-type: `application/json`
	- body: object
		- success: (boolean) True if the update took place, False if the update failed
- response:  403
	- body: Access Denied!
```
$ curl --request POST
       --header 'Content-Type: application/json'
       --data '{"email": "alice@gmail.com", "pass": "alice", "firstname": "alice", "lastname":"wonderland"}'
       --cookie cookie.txt
       http://localhost:3000/user/
```


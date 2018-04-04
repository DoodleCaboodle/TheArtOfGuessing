
# <a href="https://art-of-guessing.herokuapp.com/">The Art of Guessing </a>
###  Team Members: Andrei Anculete and Kalindu De Costa
###  <a href="https://youtu.be/ZxZvy9cayNc">Demo</a>

## Project Description

The Art of Guessing is a multiplayer browser game that consists of one person drawing and everyone else guessing the word that describes the drawing. The person who guessed the correct word first wins the round. This multiplayer game would also feature player statistics and the ability to use voice to control everything. Players will have the choice of joining a public queue or creating their own private lobby. Private lobbies will consist of a name and a password, so only users with knowledge of both can join.

## Key Features for the Beta Version (https://art-of-guessing.herokuapp.com/)

We will focus on three main features for the beta release; the first game mode where every user will have the chance to enter and draw a word for all the other users to guess, the ability for users to guess using a text-based system as well as voice input, and a working leaderboard and player statistics. The beta implementation will consist of one lobby that any number of users can join within the given time period. Each game will consist of as many rounds as there are users so that each user will have the chance to draw. After a game has been completed, the next users in the queue will begin the next game. If there are more than two users in the queue, the game will begin after a 45 second wait period. The game will not begin if the queue consists of only one person. Users will have the option to guess the drawing using text-based input as well as voice input where the game will register each word separately. Lastly, we will gather user statistics. 

## Key Features for the Final version (https://art-of-guessing.herokuapp.com/)

The final version consists of four additional features. The first feature is the ability to have multiple lobbies with peer-to-peer hosting to eliminate the queue system. Users have the option to create a private lobby with a password as well as join a public lobby based on a matching system. The second feature is the ability to edit the user profile. The user can change their first and last names, email and password. The third feature is allowing users to log in with their Facebook and Google accounts in addition to the regular login system. Afterwards, they can change their password in profile settings, so they can use that email to login through the regular login system. The last feature consists of allowing the users to control the game and the rest of the website with voice commands. This feature can be paused or resumed at any time. In addition, when voice control is activated, the user can still use all the other features like they would normally do.

## Technologies
- Server hosting: https://www.heroku.com/
- Leader boards / statistics: https://www.chartjs.org/
- Database: https://www.mongodb.com/
- Voice control: https://www.talater.com/annyang/
- Realtime application framework: https://socket.io/
- Facebook/Google login: http://www.passportjs.org/
- Cool popups: https://sweetalert2.github.io/

## Technical Challenges
1. Implementing multiple lobbies as peer-to-peer hosting for groups of users
2. Deploying web application on the cloud
3. Using a NoSQL API based database for data storage and statistics
4. Collecting user data for statistical analysis
5. Real time synchronization between users, for the drawing mechanics.

## Links
App: https://art-of-guessing.herokuapp.com/
Demo: https://youtu.be/ZxZvy9cayNc

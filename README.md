# The Art of Guessing
###  Team Members: Andrei Anculete and Kalindu De Costa


## Project Description

The Art of Guessing is a multiplayer browser game that has 2 game modes. The first game mode consists of one person drawing and everyone else guessing the word that describes the drawing. Points would be awarded based on how fast the word was guessed. The second game mode consists of one person choosing a word and everyone else draws to the best of their ability. Points would be awarded based on how fast the AI matched the drawing to the word. This multiplayer game would also feature leaderboards, player statistics and the ability to use voice to guess.

## Key Features for the Beta Version

We will focus on three main features for the Beta release; the first game mode where every user will have the chance to enter a word that they will be drawing for all other users to guess, the ability for users to guess using a text-based system as well as voice input, and a working leaderboard and statistics. The beta implementation will consist of one lobby with 10 users and a queue of users.  Each game will consist of 10 rounds and each user will have the chance to draw. After a game has been completed, the next 10 users in the queue will occupy the next game. If there are less than 10 users in the queue, the game will begin after a 45 second wait period. However, the game will not begin if the queue only consists of one person. Users will have the option to guess the drawing using a text-based input as well as voice input where the game will register each word separately. Lastly, we will gather user statistics for the user leaderboards. 

## Key Features for the Final version

The final version will consist of two additional features. The first of the features will be a second game mode where every user will make a drawing of a word and an AI will try to guess the word based on the drawings. Points for the second game mode will be awarded based on time taken for the AI to guess the correct word; the lower the time, the higher the points. A game will consist of 10 rounds and during each round a unique user will have the chance to submit a word of their choice. Further, the leaderboards will be updated to accommodate the new game mode.  The last of the features will be multiple lobbies with peer-to-peer hosting to eliminate the queue system. Users will have the option to create a private lobby with a password as well as join a public lobby based on a matching system.

## Technologies
- Google draw AI: https://github.com/googlecreativelab/quickdraw-dataset
- Server hosting: https://www.heroku.com/ or http://www.smartfoxserver.com/
- VOIP: https://sipjs.com/ 
- Leader boards / statistics: http://playtomic.org/
- Database: http://couchdb.apache.org/, Heroku Postgress

## Technical Challenges
1. Implementing multiple lobbies as peer-to-peer hosting for groups of users
2. Deploying web application on the cloud
3. Using a NoSQL API based database for data storage and statistics
4. Collecting user data for statistical analysis
5. Real time synchronization between users, for the drawing mechanics.
